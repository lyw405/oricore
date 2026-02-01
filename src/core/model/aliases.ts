import type { ModelAlias } from './types';

// value format: provider/model
export const modelAlias: ModelAlias = {
  flash: 'google/gemini-2.5-flash',
  gemini: 'google/gemini-3-pro-preview',
  glm: 'openai/glm-4.7',
  grok: 'xai/grok-4-1-fast',
  sonnet: 'anthropic/claude-sonnet-4-5-20250929',
  haiku: 'anthropic/claude-haiku-4-5',
  opus: 'anthropic/claude-opus-4-5',
};
