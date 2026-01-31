import type { LanguageModelV3Middleware } from '@ai-sdk/provider';

export const prependSystemMessageMiddleware: LanguageModelV3Middleware = {
  specificationVersion: 'v3',
  transformParams: async ({ params }) => {
    return {
      ...params,
      prompt: [
        {
          role: 'system' as const,
          content: "You are Claude Code, Anthropic's official CLI for Claude.",
        },
        ...params.prompt,
      ],
    };
  },
};
