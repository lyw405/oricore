import type { LanguageModelV3 } from '@ai-sdk/provider';

export interface ModelModalities {
  input: ('text' | 'image' | 'audio' | 'video' | 'pdf')[];
  output: ('text' | 'audio' | 'image')[];
}

interface ModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

interface ModelLimit {
  context: number;
  output: number;
}

export interface Model {
  id: string;
  name: string;
  shortName?: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  tool_call: boolean;
  knowledge: string;
  release_date: string;
  last_updated: string;
  modalities: ModelModalities;
  open_weights: boolean;
  cost: ModelCost;
  limit: ModelLimit;
  apiFormat?: 'anthropic' | 'openai' | 'responses';
  variants?: Record<string, any>;
}

export interface Provider {
  id: string;
  env: string[];
  name: string;
  apiEnv?: string[];
  api?: string;
  doc: string;
  models: Record<string, string | Omit<Model, 'id' | 'cost'>>;
  createModel?: (
    name: string,
    provider: Provider,
    options: {
      globalConfigDir: string;
      setGlobalConfig: (key: string, value: string, isGlobal: boolean) => void;
    },
  ) => Promise<LanguageModelV3> | LanguageModelV3;
  apiFormat?: 'anthropic' | 'openai' | 'responses';
  headers?: Record<string, string>;
  options?: {
    baseURL?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    httpProxy?: string;
  };
  source?: 'built-in' | string;
}

export type ProvidersMap = Record<string, Provider>;
export type ModelMap = Record<string, Omit<Model, 'id' | 'cost'>>;

export type ModelAlias = Record<string, string>;

export type ModelInfo = {
  provider: Provider;
  model: Omit<Model, 'cost'>;
  thinkingConfig?: Record<string, any>;
  _mCreator: () => Promise<LanguageModelV3>;
};
