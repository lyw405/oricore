import { createAnthropic } from '@ai-sdk/anthropic';
import { createCerebras } from '@ai-sdk/cerebras';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createHuggingFace } from '@ai-sdk/huggingface';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import { createAihubmix } from '@aihubmix/ai-sdk-provider';
import {
  createOpenRouter,
} from '@openrouter/ai-sdk-provider';
import type { LanguageModelV3, LanguageModelV3Middleware } from '@ai-sdk/provider';
import {
  extractReasoningMiddleware,
} from 'ai';
import assert from 'assert';

import type { Provider, ProvidersMap, ModelMap } from './types';
import { models } from './models';
import { getProviderBaseURL, getProviderApiKey } from './utils';
import { withProxyConfig } from './proxy';
import { mergeSystemMessagesMiddleware } from '../../utils/mergeSystemMessagesMiddleware';

export const defaultModelCreator = (name: string, provider: Provider): LanguageModelV3 => {
  if (provider.id !== 'openai') {
    assert(provider.api, `Provider ${provider.id} must have an api`);
  }
  const baseURL = getProviderBaseURL(provider);
  const apiKey = getProviderApiKey(provider);
  assert(baseURL, 'baseURL is required');
  const model = createOpenAICompatible(
    withProxyConfig(
      {
        name: provider.id,
        baseURL,
        apiKey,
      },
      provider,
    ),
  )(name);
  return model as unknown as LanguageModelV3;
};

export const defaultAnthropicModelCreator = (
  name: string,
  provider: Provider,
): LanguageModelV3 => {
  const baseURL = getProviderBaseURL(provider);
  const apiKey = getProviderApiKey(provider);
  return createAnthropic(
    withProxyConfig({ apiKey, baseURL }, provider),
  ).chat(name) as LanguageModelV3;
};

export const openaiModelCreator = (
  name: string,
  provider: Provider,
): LanguageModelV3 => {
  if (provider.id !== 'openai') {
    assert(provider.api, `Provider ${provider.id} must have an api`);
  }
  const baseURL = getProviderBaseURL(provider);
  const apiKey = getProviderApiKey(provider);
  return createOpenAI(
    withProxyConfig(
      {
        baseURL,
        apiKey,
      },
      provider,
    ),
  ).chat(name);
};

export const openaiModelResponseCreator = (
  name: string,
  provider: Provider,
): LanguageModelV3 => {
  if (provider.id !== 'openai') {
    assert(provider.api, `Provider ${provider.id} must have an api`);
  }
  const baseURL = getProviderBaseURL(provider);
  const apiKey = getProviderApiKey(provider);
  return createOpenAI(
    withProxyConfig(
      {
        baseURL,
        apiKey,
      },
      provider,
    ),
  ).responses(name);
};

export const createModelCreatorCompatible = (opts?: {
  headers?: Record<string, string>;
  fetch?: any;
  middlewares?: LanguageModelV3Middleware[];
}) => {
  return (name: string, provider: Provider): LanguageModelV3 => {
    if (provider.id !== 'openai') {
      assert(provider.api, `Provider ${provider.id} must have an api`);
    }
    const baseURL = getProviderBaseURL(provider);
    const apiKey = getProviderApiKey(provider);
    assert(baseURL, 'baseURL is required');
    const model = createOpenAICompatible(
      withProxyConfig(
        {
          name: provider.id,
          baseURL,
          apiKey,
          headers: opts?.headers,
          fetch: opts?.fetch,
        },
        provider,
      ),
    )(name);
    return model as unknown as LanguageModelV3;
  };
};

export const providers: ProvidersMap = {
  openai: {
    id: 'openai',
    source: 'built-in',
    env: ['OPENAI_API_KEY'],
    apiEnv: ['OPENAI_API_BASE'],
    name: 'OpenAI',
    doc: 'https://platform.openai.com/docs/models',
    models: {
      'glm-4.7': models['glm-4.7'],
      'gpt-4.1': models['gpt-4.1'],
      'gpt-4': models['gpt-4'],
      'gpt-4o': models['gpt-4o'],
      o3: models['o3'],
      'o3-mini': models['o3-mini'],
      'o4-mini': models['o4-mini'],
      'gpt-5.1': models['gpt-5.1'],
      'gpt-5.1-codex': models['gpt-5.1-codex'],
      'gpt-5.1-codex-mini': models['gpt-5.1-codex-mini'],
      'gpt-5.1-codex-max': models['gpt-5.1-codex-max'],
      'gpt-5': models['gpt-5'],
      'gpt-5-mini': models['gpt-5-mini'],
      'gpt-5-codex': models['gpt-5-codex'],
      'gpt-5.2': models['gpt-5.2'],
      'gpt-5.2-pro': models['gpt-5.2-pro'],
      'gpt-5.2-codex': models['gpt-5.2-codex'],
      'gpt-5.3-codex': models['gpt-5.3-codex'],
    },
    createModel: openaiModelCreator,
  },
  google: {
    id: 'google',
    source: 'built-in',
    env: ['GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
    apiEnv: ['GOOGLE_GENERATIVE_AI_API_BASE'],
    name: 'Google',
    doc: 'https://ai.google.dev/gemini-api/docs/pricing',
    models: {
      'gemini-2.5-flash': models['gemini-2.5-flash'],
      'gemini-2.5-flash-preview-09-2025':
        models['gemini-2.5-flash-preview-09-2025'],
      'gemini-2.5-flash-lite': models['gemini-2.5-flash-lite-preview-06-17'],
      'gemini-2.5-pro': models['gemini-2.5-pro'],
      'gemini-3-pro-preview': models['gemini-3-pro-preview'],
      'gemini-3-flash-preview': models['gemini-3-flash-preview'],
    },
    createModel(name, provider) {
      const baseURL = getProviderBaseURL(provider);
      const apiKey = getProviderApiKey(provider);
      return createGoogleGenerativeAI(
        withProxyConfig({ apiKey, baseURL }, provider),
      )(name);
    },
  },
  deepseek: {
    id: 'deepseek',
    source: 'built-in',
    env: ['DEEPSEEK_API_KEY'],
    name: 'DeepSeek',
    api: 'https://api.deepseek.com',
    apiEnv: ['DEEPSEEK_API_BASE'],
    doc: 'https://platform.deepseek.com/api-docs/pricing',
    models: {
      'deepseek-chat': models['deepseek-v3.2'],
      'deepseek-reasoner': models['deepseek-r1-0528'],
    },
    createModel: defaultModelCreator,
  },
  xai: {
    id: 'xai',
    source: 'built-in',
    env: ['XAI_API_KEY'],
    apiEnv: ['XAI_BASE_URL'],
    name: 'xAI',
    doc: 'https://xai.com/docs/models',
    models: {
      'grok-4-1-fast': models['grok-4.1-fast'],
      'grok-4-1-fast-non-reasoning': {
        ...models['grok-4.1-fast'],
        reasoning: false,
      },
      'grok-4': models['grok-4'],
      'grok-4-fast': models['grok-4-fast'],
      'grok-code-fast-1': models['grok-code-fast-1'],
    },
    createModel(name, provider) {
      const api = getProviderBaseURL(provider);
      const apiKey = getProviderApiKey(provider);
      return createXai({
        baseURL: api,
        apiKey,
      }).chat(name);
    },
  },
  anthropic: {
    id: 'anthropic',
    source: 'built-in',
    env: ['ANTHROPIC_API_KEY'],
    apiEnv: ['ANTHROPIC_API_BASE'],
    name: 'Anthropic',
    doc: 'https://docs.anthropic.com/en/docs/models',
    models: {
      'claude-opus-4-20250514': models['claude-4-opus'],
      'claude-opus-4-1-20250805': models['claude-4.1-opus'],
      'claude-sonnet-4-20250514': models['claude-4-sonnet'],
      'claude-sonnet-4-5-20250929': models['claude-4-5-sonnet'],
      'claude-3-7-sonnet-20250219': models['claude-3-7-sonnet'],
      'claude-3-7-sonnet-20250219-thinking': models['claude-3-7-sonnet'],
      'claude-3-5-sonnet-20241022': models['claude-3-5-sonnet-20241022'],
      'claude-haiku-4-5': models['claude-haiku-4-5'],
      'claude-opus-4-5': models['claude-opus-4-5'],
      'claude-opus-4-6': models['claude-opus-4-6'],
    },
    apiFormat: 'anthropic',
    headers: {
      'X-Title': 'OriCore',
      'HTTP-Referer': 'https://github.com/lyw405/oricore',
    },
    createModel: defaultAnthropicModelCreator,
  },
  aihubmix: {
    id: 'aihubmix',
    source: 'built-in',
    env: ['AIHUBMIX_API_KEY'],
    name: 'AIHubMix',
    api: 'https://aihubmix.com/v1',
    doc: 'https://docs.aihubmix.com/',
    models: {
      'gemini-2.5-pro': models['gemini-2.5-pro'],
      'gemini-2.5-flash': models['gemini-2.5-flash'],
      'gemini-2.5-flash-lite': models['gemini-2.5-flash-lite-preview-06-17'],
      'DeepSeek-R1': models['deepseek-r1-0528'],
      'DeepSeek-V3': models['deepseek-v3-0324'],
      'claude-opus-4-20250514': models['claude-4-opus'],
      'claude-opus-4-1': models['claude-4.1-opus'],
      'claude-sonnet-4-20250514': models['claude-4-sonnet'],
      'claude-sonnet-4-5': models['claude-4-5-sonnet'],
      'claude-3-7-sonnet-20250219': models['claude-3-7-sonnet'],
      'claude-3-5-sonnet-20241022': models['claude-3-5-sonnet-20241022'],
      'gpt-4.1': models['gpt-4.1'],
      'gpt-4': models['gpt-4'],
      'gpt-4o': models['gpt-4o'],
      o3: models['o3'],
      'o3-mini': models['o3-mini'],
      'o4-mini': models['o4-mini'],
      'gpt-5': models['gpt-5'],
      'gpt-5-mini': models['gpt-5-mini'],
      'glm-4.6': models['glm-4.6'],
      'kimi-k2-thinking': models['kimi-k2-thinking'],
      'kimi-k2-turbo-preview': models['kimi-k2-turbo-preview'],
    },
    createModel(name, provider) {
      const apiKey = getProviderApiKey(provider);
      return createAihubmix(
        withProxyConfig(
          {
            apiKey,
            headers: {
              'APP-Code': 'TPQW7551',
            },
          },
          provider,
        ),
      ).chat(name);
    },
  },
  openrouter: {
    id: 'openrouter',
    source: 'built-in',
    env: ['OPENROUTER_API_KEY', 'OPEN_ROUTER_API_KEY'],
    name: 'OpenRouter',
    doc: 'https://openrouter.ai/docs/models',
    models: {
      'anthropic/claude-3.5-sonnet': models['claude-3-5-sonnet-20241022'],
      'anthropic/claude-3.7-sonnet': models['claude-3-7-sonnet'],
      'anthropic/claude-sonnet-4': models['claude-4-sonnet'],
      'anthropic/claude-sonnet-4.5': models['claude-4-5-sonnet'],
      'anthropic/claude-haiku-4.5': models['claude-haiku-4-5'],
      'anthropic/claude-opus-4': models['claude-4-opus'],
      'anthropic/claude-opus-4.1': models['claude-4.1-opus'],
      'anthropic/claude-opus-4.5': models['claude-opus-4-5'],
      'anthropic/claude-opus-4.6': models['claude-opus-4-6'],
      'deepseek/deepseek-r1-0528': models['deepseek-r1-0528'],
      'deepseek/deepseek-chat-v3-0324': models['deepseek-v3-0324'],
      'deepseek/deepseek-chat-v3.1': models['deepseek-v3-1'],
      'deepseek/deepseek-v3.1-terminus': models['deepseek-v3-1-terminus'],
      'deepseek/deepseek-v3.2-exp': models['deepseek-v3-2-exp'],
      'deepseek/deepseek-v3.2': models['deepseek-v3.2'],
      'deepseek/deepseek-v3.2-speciale': models['deepseek-v3.2-speciale'],
      'openai/gpt-4.1': models['gpt-4.1'],
      'openai/gpt-4': models['gpt-4'],
      'openai/gpt-4o': models['gpt-4o'],
      'openai/o3': models['o3'],
      'openai/o3-pro': models['o3-pro'],
      'openai/o3-mini': models['o3-mini'],
      'openai/o4-mini': models['o4-mini'],
      'openai/gpt-oss-120b': models['gpt-oss-120b'],
      'openai/gpt-5.1-codex': models['gpt-5.1-codex'],
      'openai/gpt-5.1-codex-mini': models['gpt-5.1-codex-mini'],
      'openai/gpt-5.1-codex-max': models['gpt-5.1-codex-max'],
      'openai/gpt-5.1': models['gpt-5.1'],
      'openai/gpt-5': models['gpt-5'],
      'openai/gpt-5-mini': models['gpt-5-mini'],
      'openai/gpt-5-codex': models['gpt-5-codex'],
      'openai/gpt-5.2': models['gpt-5.2'],
      'openai/gpt-5.2-pro': models['gpt-5.2-pro'],
      'openai/gpt-5.2-codex': models['gpt-5.2-codex'],
      'openai/gpt-5.3-codex': models['gpt-5.3-codex'],
      'google/gemini-3-flash-preview': models['gemini-3-flash-preview'],
      'google/gemini-3-pro-preview': models['gemini-3-pro-preview'],
      'moonshotai/kimi-k2': models['kimi-k2'],
      'moonshotai/kimi-k2-0905': models['kimi-k2-0905'],
      'moonshotai/kimi-k2-thinking': models['kimi-k2-thinking'],
      'moonshotai/kimi-k2.5': models['kimi-k2.5'],
      'qwen/qwen3-coder': models['qwen3-coder-480b-a35b-instruct'],
      'qwen/qwen3-max': models['qwen3-max'],
      'x-ai/grok-code-fast-1': models['grok-code-fast-1'],
      'x-ai/grok-4': models['grok-4'],
      'x-ai/grok-4-fast': models['grok-4-fast'],
      'x-ai/grok-4.1-fast': models['grok-4.1-fast'],
      'z-ai/glm-4.5': models['glm-4.5'],
      'z-ai/glm-4.5v': models['glm-4.5v'],
      'z-ai/glm-4.6': models['glm-4.6'],
      'z-ai/glm-4.6v': models['glm-4.6v'],
      'z-ai/glm-4.7': models['glm-4.7'],
      'minimax/minimax-m2': models['minimax-m2'],
      'openrouter/sherlock-dash-alpha': models['sherlock-dash-alpha'],
      'openrouter/sherlock-think-alpha': models['sherlock-think-alpha'],
      'xiaomi/mimo-v2-flash:free': models['mimo-v2-flash'],
    },
    createModel(name, provider) {
      const baseURL = getProviderBaseURL(provider);
      const apiKey = getProviderApiKey(provider);
      return createOpenRouter(
        withProxyConfig(
          {
            apiKey,
            baseURL,
          },
          provider,
        ),
      ).chat(name) as unknown as LanguageModelV3;
    },
  },
  iflow: {
    id: 'iflow',
    source: 'built-in',
    env: ['IFLOW_API_KEY'],
    name: 'iFlow',
    api: 'https://apis.iflow.cn/v1/',
    doc: 'https://iflow.cn/',
    models: {
      'qwen3-coder-plus': models['qwen3-coder-plus'],
      'kimi-k2': models['kimi-k2'],
      'kimi-k2-0905': models['kimi-k2-0905'],
      'deepseek-v3': models['deepseek-v3-0324'],
      'deepseek-v3.2': models['deepseek-v3-2-exp'],
      'deepseek-r1': models['deepseek-r1-0528'],
      'glm-4.6': models['glm-4.6'],
      'glm-4.7': models['glm-4.7'],
      'minimax-m2.1': models['minimax-m2.1'],
      'qwen3-max': models['qwen3-max'],
    },
    createModel: createModelCreatorCompatible({
      fetch: (url: string, options: any) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'user-agent': 'iFlow-Cli',
          },
        });
      },
      middlewares: [
        mergeSystemMessagesMiddleware,
        extractReasoningMiddleware({
          tagName: 'think',
        }) as LanguageModelV3Middleware,
      ],
    }),
  },
  moonshotai: {
    id: 'moonshotai',
    source: 'built-in',
    env: ['MOONSHOT_API_KEY'],
    name: 'Moonshot',
    api: 'https://api.moonshot.ai/v1',
    doc: 'https://platform.moonshot.ai/docs/api/chat',
    models: {
      'kimi-k2-0905-preview': models['kimi-k2-0905'],
      'kimi-k2-turbo-preview': models['kimi-k2-turbo-preview'],
      'kimi-k2-thinking': models['kimi-k2-thinking'],
      'kimi-k2-thinking-turbo': models['kimi-k2-thinking-turbo'],
      'kimi-k2.5': models['kimi-k2.5'],
    },
    createModel: defaultModelCreator,
  },
  'moonshotai-cn': {
    id: 'moonshotai-cn',
    source: 'built-in',
    env: ['MOONSHOT_API_KEY'],
    name: 'MoonshotCN',
    api: 'https://api.moonshot.cn/v1',
    doc: 'https://platform.moonshot.cn/docs/api/chat',
    models: {
      'kimi-k2-0905-preview': models['kimi-k2-0905'],
      'kimi-k2-turbo-preview': models['kimi-k2-turbo-preview'],
      'kimi-k2-thinking': models['kimi-k2-thinking'],
      'kimi-k2-thinking-turbo': models['kimi-k2-thinking-turbo'],
      'kimi-k2.5': models['kimi-k2.5'],
    },
    createModel: defaultModelCreator,
  },
  groq: {
    id: 'groq',
    source: 'built-in',
    env: ['GROQ_API_KEY'],
    name: 'Groq',
    api: 'https://api.groq.com/openai/v1',
    doc: 'https://console.groq.com/docs/models',
    models: {},
    createModel: defaultModelCreator,
  },
  siliconflow: {
    id: 'siliconflow',
    source: 'built-in',
    env: ['SILICONFLOW_API_KEY'],
    name: 'SiliconFlow',
    api: 'https://api.siliconflow.com/v1',
    doc: 'https://docs.siliconflow.com',
    models: {
      'Qwen/Qwen3-235B-A22B-Instruct-2507': models['qwen3-235b-a22b-07-25'],
      'Qwen/Qwen3-Coder-480B-A35B-Instruct':
        models['qwen3-coder-480b-a35b-instruct'],
      'moonshotai/Kimi-K2-Instruct-0905': models['kimi-k2-0905'],
      'moonshotai/Kimi-K2-Instruct': models['kimi-k2'],
      'deepseek-ai/DeepSeek-R1': models['deepseek-r1-0528'],
      'deepseek-ai/DeepSeek-V3.1': models['deepseek-v3-1'],
      'deepseek-ai/DeepSeek-V3': models['deepseek-v3-0324'],
      'zai-org/GLM-4.5': models['glm-4.5'],
    },
    createModel: defaultModelCreator,
  },
  'siliconflow-cn': {
    id: 'siliconflow-cn',
    source: 'built-in',
    env: ['SILICONFLOW_API_KEY'],
    name: 'SiliconFlow CN',
    api: 'https://api.siliconflow.cn/v1',
    doc: 'https://docs.siliconflow.cn',
    models: {
      'Qwen/Qwen3-235B-A22B-Instruct-2507': models['qwen3-235b-a22b-07-25'],
      'Qwen/Qwen3-Coder-480B-A35B-Instruct':
        models['qwen3-coder-480b-a35b-instruct'],
      'moonshotai/Kimi-K2-Instruct-0905': models['kimi-k2-0905'],
      'moonshotai/Kimi-K2-Instruct': models['kimi-k2'],
      'deepseek-ai/DeepSeek-R1': models['deepseek-r1-0528'],
      'deepseek-ai/DeepSeek-V3.1': models['deepseek-v3-1'],
      'deepseek-ai/DeepSeek-V3': models['deepseek-v3-0324'],
      'zai-org/GLM-4.5': models['glm-4.5'],
    },
    createModel: defaultModelCreator,
  },
  modelscope: {
    id: 'modelscope',
    source: 'built-in',
    env: ['MODELSCOPE_API_KEY'],
    name: 'ModelScope',
    api: 'https://api-inference.modelscope.cn/v1',
    doc: 'https://modelscope.cn/docs/model-service/API-Inference/intro',
    models: {
      'Qwen/Qwen3-Coder-480B-A35B-Instruct':
        models['qwen3-coder-480b-a35b-instruct'],
      'Qwen/Qwen3-235B-A22B-Instruct-2507': models['qwen3-235b-a22b-07-25'],
      'ZhipuAI/GLM-4.5': models['glm-4.5'],
      'ZhipuAI/GLM-4.5V': models['glm-4.5v'],
      'ZhipuAI/GLM-4.6': models['glm-4.6'],
      'deepseek-ai/DeepSeek-V3.2': models['deepseek-v3.2'],
      'deepseek-ai/DeepSeek-V3.2-Speciale': models['deepseek-v3.2-speciale'],
    },
    createModel: defaultModelCreator,
  },
  volcengine: {
    id: 'volcengine',
    source: 'built-in',
    env: ['VOLCENGINE_API_KEY'],
    name: 'VolcEngine',
    api: 'https://ark.cn-beijing.volces.com/api/v3',
    doc: 'https://www.volcengine.com/docs/82379/1330310',
    models: {
      'deepseek-v3-1-250821': models['deepseek-v3-1'],
      'deepseek-v3-1-terminus': models['deepseek-v3-1-terminus'],
      'doubao-seed-1-6-250615': models['doubao-seed-1.6'],
      'kimi-k2-250905': models['kimi-k2-0905'],
    },
    createModel: defaultModelCreator,
  },
  'zai-coding-plan': {
    id: 'zai-coding-plan',
    source: 'built-in',
    env: ['ZHIPU_API_KEY'],
    name: 'Z.AI Coding Plan',
    api: 'https://api.z.ai/api/coding/paas/v4',
    doc: 'https://docs.z.ai/devpack/overview',
    models: {
      'glm-4.5-flash': models['glm-4.5-flash'],
      'glm-4.5': models['glm-4.5'],
      'glm-4.5-air': models['glm-4.5-air'],
      'glm-4.5v': models['glm-4.5v'],
      'glm-4.6': models['glm-4.6'],
      'glm-4.6v': models['glm-4.6v'],
      'glm-4.7': models['glm-4.7'],
    },
    createModel: defaultModelCreator,
  },
  'zhipuai-coding-plan': {
    id: 'zhipuai-coding-plan',
    source: 'built-in',
    env: ['ZHIPU_API_KEY'],
    name: 'Zhipu AI Coding Plan',
    api: 'https://open.bigmodel.cn/api/coding/paas/v4',
    doc: 'https://docs.bigmodel.cn/cn/coding-plan/overview',
    models: {
      'glm-4.6': models['glm-4.6'],
      'glm-4.5v': models['glm-4.5v'],
      'glm-4.5-air': models['glm-4.5-air'],
      'glm-4.5': models['glm-4.5'],
      'glm-4.5-flash': models['glm-4.5-flash'],
      'glm-4.6v': models['glm-4.6v'],
      'glm-4.7': models['glm-4.7'],
    },
    createModel: defaultModelCreator,
  },
  zhipuai: {
    id: 'zhipuai',
    source: 'built-in',
    env: ['ZHIPU_API_KEY'],
    name: 'Zhipu AI',
    api: 'https://open.bigmodel.cn/api/paas/v4',
    doc: 'https://docs.z.ai/guides/overview/pricing',
    models: {
      'glm-4.6': models['glm-4.6'],
      'glm-4.5v': models['glm-4.5v'],
      'glm-4.5-air': models['glm-4.5-air'],
      'glm-4.5': models['glm-4.5'],
      'glm-4.5-flash': models['glm-4.5-flash'],
      'glm-4.6v': models['glm-4.6v'],
      'glm-4.7': models['glm-4.7'],
    },
    createModel: defaultModelCreator,
  },
  zenmux: {
    id: 'zenmux',
    source: 'built-in',
    env: ['ZENMUX_API_KEY'],
    name: 'ZenMux',
    api: 'https://zenmux.ai/api/v1',
    doc: 'https://docs.zenmux.ai/',
    models: {
      'inclusionai/ling-1t': models['ling-1t'],
      'inclusionai/ring-1t': models['ring-1t'],
      'inclusionai/ring-flash-2.0': models['ring-flash-2.0'],
      'inclusionai/ling-flash-2.0': models['ling-flash-2.0'],
      'inclusionai/ring-mini-2.0': models['ring-mini-2.0'],
      'inclusionai/ling-mini-2.0': models['ling-mini-2.0'],
      'google/gemini-3-flash-preview': models['gemini-3-flash-preview'],
      'google/gemini-3-pro-preview': models['gemini-3-pro-preview'],
      'openai/gpt-5.1': models['gpt-5.1'],
      'openai/gpt-5.1-codex': models['gpt-5.1-codex'],
      'openai/gpt-5.1-codex-mini': models['gpt-5.1-codex-mini'],
      'openai/gpt-5.2': models['gpt-5.2'],
      'openai/gpt-5.2-pro': models['gpt-5.2-pro'],
      'openai/gpt-5.2-codex': models['gpt-5.2-codex'],
      'openai/gpt-5.3-codex': models['gpt-5.3-codex'],
      'anthropic/claude-sonnet-4.5': models['claude-4-5-sonnet'],
      'anthropic/claude-opus-4.1': models['claude-4.1-opus'],
      'anthropic/claude-opus-4.5': models['claude-opus-4-5'],
      'anthropic/claude-opus-4.6': models['claude-opus-4-6'],
      'z-ai/glm-4.6': models['glm-4.6'],
      'z-ai/glm-4.6v': models['glm-4.6v'],
      'z-ai/glm-4.6v-flash': models['glm-4.6v'],
      'deepseek/deepseek-v3.2-speciale': models['deepseek-v3.2-speciale'],
      'deepseek/deepseek-chat': models['deepseek-v3-2-exp'],
      'deepseek/deepseek-reasoner': models['deepseek-r1-0528'],
    },
    headers: {
      'X-Title': 'OriCore',
      'HTTP-Referer': 'https://github.com/lyw405/oricore',
    },
  },
  minimax: {
    id: 'minimax',
    source: 'built-in',
    env: ['MINIMAX_API_KEY'],
    name: 'Minimax',
    api: 'https://api.minimaxi.io/anthropic/v1',
    doc: 'https://platform.minimaxi.io/docs/guides/quickstart',
    models: {
      'minimax-m2': models['minimax-m2'],
      'minimax-m2.1': models['minimax-m2.1'],
    },
    createModel(name, provider) {
      const baseURL = getProviderBaseURL(provider);
      const apiKey = getProviderApiKey(provider);
      return createAnthropic(
        withProxyConfig({ baseURL, apiKey }, provider),
      ).chat(name);
    },
  },
  'minimax-cn': {
    id: 'minimax-cn',
    source: 'built-in',
    env: ['MINIMAX_API_KEY'],
    name: 'Minimax CN',
    api: 'https://api.minimaxi.com/anthropic/v1',
    doc: 'https://platform.minimaxi.com/docs/guides/quickstart',
    models: {
      'minimax-m2': models['minimax-m2'],
      'minimax-m2.1': models['minimax-m2.1'],
    },
    createModel(name, provider) {
      const baseURL = getProviderBaseURL(provider);
      const apiKey = getProviderApiKey(provider);
      return createAnthropic(
        withProxyConfig({ baseURL, apiKey }, provider),
      ).chat(name);
    },
  },
  xiaomi: {
    id: 'xiaomi',
    source: 'built-in',
    env: ['MIMO_API_KEY'],
    name: 'Xiaomi Mimo',
    api: 'https://api.xiaomimimo.com/v1',
    doc: 'https://platform.xiaomimimo.com/',
    models: {
      'mimo-v2-flash': models['mimo-v2-flash'],
    },
    createModel: createModelCreatorCompatible({}),
  },
  cerebras: {
    id: 'cerebras',
    source: 'built-in',
    env: ['CEREBRAS_API_KEY'],
    name: 'Cerebras',
    doc: 'https://cerebras.ai/docs',
    models: {
      'zai-glm-4.6': models['glm-4.6'],
      'zai-glm-4.7': {
        ...models['glm-4.7'],
        limit: { context: 64000, output: 40000 },
      },
      'gpt-oss-120b': {
        ...models['gpt-oss-120b'],
        limit: { context: 65000, output: 32000 },
      },
    },
    headers: {
      'X-Cerebras-3rd-Party-Integration': 'OriCore',
    },
    createModel(name, provider) {
      const apiKey = getProviderApiKey(provider);
      return createCerebras(
        withProxyConfig(
          {
            apiKey,
          },
          provider,
        ),
      )(name);
    },
  },
  huggingface: {
    id: 'huggingface',
    source: 'built-in',
    env: ['HUGGINGFACE_API_KEY'],
    name: 'Hugging Face',
    doc: 'https://huggingface.co/docs/inference-providers/index',
    models: {
      'zai-org/GLM-4.7': models['glm-4.7'],
      'XiaomiMiMo/MiMo-V2-Flash': models['mimo-v2-flash'],
      'Qwen/Qwen3-Coder-480B-A35B-Instruct':
        models['qwen3-coder-480b-a35b-instruct'],
    },
    createModel(name, provider) {
      const apiKey = getProviderApiKey(provider);
      return createHuggingFace({
        apiKey,
      }).languageModel(name) as unknown as LanguageModelV3;
    },
  },
  poe: {
    id: 'poe',
    source: 'built-in',
    env: ['POE_API_KEY'],
    name: 'Poe',
    api: 'https://api.poe.com/v1',
    doc: 'https://poe.com',
    models: {
      'Claude-Opus-4.5': models['claude-4-opus'],
      'Claude-Sonnet-4.5': models['claude-4-5-sonnet'],
      'Gemini-3-Pro': models['gemini-3-pro-preview'],
      'Gemini-2.5-Pro': models['gemini-2.5-pro'],
      'Gemini-2.5-Flash': models['gemini-2.5-flash'],
      'GPT-5.1': models['gpt-5.1'],
      'GPT-5.1-Codex': models['gpt-5.1-codex'],
      'Grok-4.1-Fast-Non-Reasoning': {
        ...models['grok-4.1-fast'],
        reasoning: false,
      },
      'Grok-4.1-Fast': models['grok-4.1-fast'],
    },
    createModel: defaultModelCreator,
  },
  nvidia: {
    id: 'nvidia',
    source: 'built-in',
    env: ['NVIDIA_API_KEY'],
    name: 'NVIDIA',
    api: 'https://integrate.api.nvidia.com/v1/',
    doc: 'https://nvidia.com/',
    models: {
      'z-ai/glm4.7': models['glm-4.7'],
      'minimaxai/minimax-m2.1': models['minimax-m2.1'],
      'moonshotai/kimi-k2-thinking': models['kimi-k2-thinking'],
      'openai/gpt-oss-120b': models['gpt-oss-120b'],
      'qwen/qwen3-coder-480b-a35b-instruct':
        models['qwen3-coder-480b-a35b-instruct'],
    },
    createModel: createModelCreatorCompatible({
      middlewares: [
        extractReasoningMiddleware({
          tagName: 'think',
        }) as LanguageModelV3Middleware,
      ],
    }),
  },
  canopywave: {
    id: 'canopywave',
    source: 'built-in',
    env: ['CANOPYWAVE_API_KEY'],
    name: 'CanopyWave',
    api: 'https://inference.canopywave.io/v1',
    doc: 'https://canopywave.io/',
    models: {
      'minimax/minimax-m2.1': models['minimax-m2.1'],
      'zai/glm-4.7': models['glm-4.7'],
      'moonshotai/kimi-k2-thinking': models['kimi-k2-thinking'],
      'moonshotai/kimi-k2.5': models['kimi-k2.5'],
      'deepseek/deepseek-chat-v3.2': models['deepseek-v3-2-exp'],
    },
    createModel: defaultModelCreator,
  },
  modelwatch: {
    id: 'modelwatch',
    source: 'built-in',
    env: ['MODELWATCH_API_KEY'],
    name: 'ModelWatch',
    api: 'https://hub.modelwatch.dev/v1/',
    doc: 'https://hub.modelwatch.dev/',
    models: {
      'qwen3-coder-plus': models['qwen3-coder-plus'],
      'glm-4.7': models['glm-4.7'],
      'gemini-2.5-flash': models['gemini-2.5-flash'],
      'gemini-3-flash': models['gemini-3-flash-preview'],
      'gemini-3-pro-preview': models['gemini-3-pro-preview'],
      'claude-4-5-sonnet': models['claude-4-5-sonnet'],
      'claude-haiku-4-5': models['claude-haiku-4-5'],
      'claude-opus-4-5': models['claude-opus-4-5'],
      'claude-opus-4-6': models['claude-opus-4-6'],
      'gpt-5.1': models['gpt-5.1'],
      'gpt-5.1-codex-max': models['gpt-5.1-codex-max'],
      'gpt-5.1-codex': models['gpt-5.1-codex'],
      'gpt-5.1-codex-mini': models['gpt-5.1-codex-mini'],
      'gpt-5.2': models['gpt-5.2'],
      'gpt-5.2-codex': models['gpt-5.2-codex'],
      'gpt-5.3-codex': models['gpt-5.3-codex'],
    },
    createModel: (name, provider) => {
      if (name.startsWith('claude-') || name.startsWith('gemini-')) {
        return defaultAnthropicModelCreator(name, provider);
      }
      if (name.startsWith('gpt-')) {
        return openaiModelResponseCreator(name, provider);
      }
      return defaultModelCreator(name, provider);
    },
  },
};
