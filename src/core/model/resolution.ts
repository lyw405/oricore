import assert from 'assert';
import defu from 'defu';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { Context } from '../context';
import { ConfigManager, type ProviderConfig } from '../config';
import { PluginHookType } from '../plugin';
import type { Model, Provider, ProvidersMap, ModelAlias, ModelInfo } from './types';
import { providers, defaultModelCreator, defaultAnthropicModelCreator, openaiModelResponseCreator } from './providers';
import { modelAlias } from './aliases';
import type { ModelMap } from './types';
import { models } from './models';

// ApiFormat type for provider API formats
type ApiFormat = 'anthropic' | 'openai' | 'responses';

/**
 * Transform model reasoning capabilities into provider-specific variants
 * This function generates thinking/reasoning configurations for different effort levels
 */
function transformVariants(model: Model, provider: Provider): Record<string, any> {
  if (!model.reasoning) {
    return {};
  }

  const id = (model.id || '').toLowerCase();

  // These models use their own reasoning mechanism without variants
  if (
    id.includes('deepseek') ||
    id.includes('minimax') ||
    id.includes('glm') ||
    id.includes('mistral') ||
    // id.includes("kimi") ||
    id.includes('grok')
  ) {
    return {};
  }

  // Special provider handling
  if (provider.id === 'xiaomi') {
    return {
      on: {
        thinking: {
          type: 'enabled',
        },
      },
    };
  }

  if (provider.id === 'xai') {
    return {
      low: {
        // https://ai-sdk.dev/providers/ai-sdk-providers/xai#provider-options
        // Only supported by grok-3-mini and grok-3-mini-fast models?
        // reasoningEffort: 'low',
      },
    };
  }

  if (['openrouter', 'zenmux', 'wanqing'].includes(provider.id)) {
    return {
      low: {
        reasoning: {
          enabled: true,
          effort: 'low' as const,
        },
      },
      medium: {
        reasoning: {
          enabled: true,
          effort: 'medium' as const,
        },
      },
      high: {
        reasoning: {
          enabled: true,
          max_tokens: 31999,
        },
      },
    };
  }

  if (provider.id === 'modelwatch' && id.startsWith('gpt-')) {
    return {
      low: {
        reasoningEffort: 'low' as const,
        reasoningSummary: 'detailed',
      },
      medium: {
        reasoningEffort: 'medium' as const,
        reasoningSummary: 'detailed',
      },
      high: {
        reasoningEffort: 'high' as const,
        reasoningSummary: 'detailed',
      },
    };
  }

  if (provider.id === 'modelwatch' && id.startsWith('claude-')) {
    return {
      low: {
        thinking: {
          type: 'enabled' as const,
          budgetTokens: 1024,
        },
      },
      high: {
        thinking: {
          type: 'enabled' as const,
          budgetTokens: 31999,
        },
      },
    };
  }

  if (id.startsWith('gemini-')) {
    return {
      low: {
        thinkingConfig: {
          thinkingBudget: 1024,
          includeThoughts: true,
        },
      },
      high: {
        thinkingConfig: {
          thinkingBudget: 31999,
          includeThoughts: true,
        },
      },
    };
  }

  if (provider.id === 'google') {
    return {
      low: {
        thinkingConfig: {
          thinkingBudget: 1024,
          includeThoughts: true,
        },
      },
      high: {
        thinkingConfig: {
          thinkingBudget: 31999,
          includeThoughts: true,
        },
      },
    };
  }

  // OpenAI-compatible format: low, medium, high reasoning efforts
  if (provider.apiFormat === 'openai') {
    const WIDELY_SUPPORTED_EFFORTS = ['low', 'medium', 'high'];
    return Object.fromEntries(
      WIDELY_SUPPORTED_EFFORTS.map((effort) => [
        effort,
        {
          reasoningEffort: effort,
        },
      ]),
    );
  }

  // Anthropic format: high and max efforts with budget tokens
  if (provider.apiFormat === 'anthropic') {
    return {
      high: {
        thinking: {
          type: 'enabled',
          budgetTokens: Math.min(
            16_000,
            Math.floor(model.limit.output / 2 - 1),
          ),
        },
      },
      max: {
        thinking: {
          type: 'enabled',
          budgetTokens: Math.min(31_999, model.limit.output - 1),
        },
      },
    };
  }

  return {};
}

/**
 * Normalize a model definition by merging with base model info and adding variants
 */
function normalizeModel(
  modelId: string,
  model: Partial<Model> | string,
  provider: Provider,
): Model {
  let actualModel: Partial<Model> = {};
  let extraInfo: Partial<Model> = {};

  if (typeof model === 'string') {
    actualModel = models[model.toLowerCase()] || {};
  } else {
    const splitModelId = modelId.split('/').slice(-1)[0].toLowerCase();
    actualModel = models[splitModelId] || {};
    extraInfo = { ...model };
  }

  if (!actualModel.limit) {
    actualModel.limit = {
      context: 256000,
      output: 256000,
    };
  }

  const m = {
    ...actualModel,
    ...extraInfo,
  } as Model;

  if (!m.variants) {
    const variants = transformVariants(m, provider);
    m.variants = variants;
  }

  return m;
}

/**
 * Apply global proxy to all providers without provider-level proxy
 */
function applyGlobalProxyToProviders(
  providersMap: ProvidersMap,
  globalHttpProxy: string,
): ProvidersMap {
  return Object.fromEntries(
    Object.entries(providersMap).map(([id, prov]) => {
      const provider = prov as Provider;
      // Skip if provider already has its own proxy
      if (provider.options?.httpProxy) {
        return [id, provider];
      }
      // Apply global proxy
      return [
        id,
        {
          ...provider,
          options: {
            ...provider.options,
            httpProxy: globalHttpProxy,
          },
        },
      ];
    }),
  );
}

/**
 * Merge config providers with hooked providers
 */
function mergeConfigProviders(
  hookedProviders: ProvidersMap,
  configProviders: Record<string, ProviderConfig>,
): ProvidersMap {
  const mergedProviders = { ...hookedProviders };
  Object.entries(configProviders).forEach(([providerId, config]) => {
    let provider = mergedProviders[providerId] || {};
    provider = defu(config, provider) as Provider;

    // Set default createModel if apiFormat is anthropic
    if (provider.apiFormat === 'anthropic' && !provider.createModel) {
      provider.createModel = defaultAnthropicModelCreator;
    }

    // Set default createModel if not set
    if (!provider.createModel) {
      provider.createModel = defaultModelCreator;
    }

    // Process models
    if (provider.models) {
      for (const modelId in provider.models) {
        provider.models[modelId] = normalizeModel(
          modelId,
          provider.models[modelId],
          provider,
        );
      }
    }

    if (!provider.id) {
      provider.id = providerId;
    }
    if (!provider.name) {
      provider.name = providerId;
    }
    mergedProviders[providerId] = provider;
  });
  return mergedProviders;
}

function isPromise(m: any): m is Promise<LanguageModelV3> {
  return m instanceof Promise;
}

/**
 * Resolve a model by name from providers and modelAlias
 */
export async function resolveModel(
  name: string,
  providersMap: ProvidersMap,
  aliases: ModelAlias,
  globalConfigDir: string,
  setGlobalConfig: (key: string, value: string, isGlobal: boolean) => void,
): Promise<ModelInfo> {
  const alias = aliases[name];
  if (alias) {
    name = alias;
  }
  const [providerStr, ...modelNameArr] = name.split('/');
  const provider = providersMap[providerStr];
  assert(
    provider,
    `Provider ${providerStr} not found, valid providers: ${Object.keys(providersMap).join(', ')}`,
  );
  const modelId = modelNameArr.join('/');
  const model = provider.models[modelId] as Model;
  assert(
    model,
    `Model ${modelId} not found in provider ${providerStr}, valid models: ${Object.keys(provider.models).join(', ')}`,
  );
  model.id = modelId;
  const mCreator = async () => {
    let m: LanguageModelV3 | Promise<LanguageModelV3> = provider.createModel!(
      modelId,
      provider,
      {
        globalConfigDir,
        setGlobalConfig,
      },
    );
    if (isPromise(m)) {
      m = await m;
    }
    return m;
  };
  return {
    provider,
    model,
    _mCreator: mCreator,
  };
}

/**
 * Main entry point to resolve model with context
 */
export async function resolveModelWithContext(
  name: string | null,
  context: Context,
) {
  const hookedProviders = await context.apply({
    hook: 'provider',
    args: [
      {
        models,
        providers,
      },
    ],
    memo: providers,
    type: PluginHookType.SeriesLast,
  });

  let finalProviders = context.config.provider
    ? mergeConfigProviders(hookedProviders, context.config.provider)
    : hookedProviders;

  // Apply global proxy to ALL providers that don't have provider-level proxy
  if (context.config.httpProxy) {
    finalProviders = applyGlobalProxyToProviders(
      finalProviders,
      context.config.httpProxy,
    );
  }

  const hookedModelAlias = await context.apply({
    hook: 'modelAlias',
    args: [],
    memo: modelAlias,
    type: PluginHookType.SeriesLast,
  });
  const modelName = name || context.config.model;
  let model = null;
  let error = null;
  try {
    model = modelName
      ? await resolveModel(
          modelName,
          finalProviders,
          hookedModelAlias,
          context.paths.globalConfigDir,
          (key, value, isGlobal) => {
            const configManager = new ConfigManager(
              context.cwd,
              context.productName,
              {},
            );
            configManager.setConfig(isGlobal, key, value);
          },
        )
      : null;
  } catch (err) {
    error = err;
  }

  return {
    providers: finalProviders,
    modelAlias: hookedModelAlias,
    model,
    error,
  };
}

// Re-export types
export type { Model, Provider, ProvidersMap, ModelAlias, ModelInfo, ModelMap };
