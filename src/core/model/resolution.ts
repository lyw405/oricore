import assert from 'assert';
import defu from 'defu';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { Context } from '../context';
import { ConfigManager, type ProviderConfig } from '../config';
import { PluginHookType } from '../plugin';
import { getThinkingConfig } from '../thinking-config';
import type { Model, Provider, ProvidersMap, ModelAlias, ModelInfo } from './types';
import { providers, defaultModelCreator, defaultAnthropicModelCreator, openaiModelResponseCreator } from './providers';
import { modelAlias } from './aliases';
import type { ModelMap } from './types';
import { models } from './models';

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
        const model = provider.models[modelId];
        if (typeof model === 'string') {
          let actualModel: Partial<Model> = models[model.toLowerCase()] || {};
          // Add default limit if model doesn't exist or doesn't have limit
          if (!actualModel.limit) {
            actualModel.limit = {
              context: 0,
              output: 0,
            };
          }
          provider.models[modelId] = actualModel as Model;
        }
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

  // Add thinking config to model if available
  if (model) {
    const thinkingConfig = getThinkingConfig(model, 'low');
    if (thinkingConfig) {
      model.thinkingConfig = thinkingConfig;
    }
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
