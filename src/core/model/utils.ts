import type { Provider } from './types';
import { rotateApiKey } from '../../utils/apiKeyRotation';

/**
 * Get the base URL for a provider.
 * Priority: provider.options.baseURL > provider.apiEnv > provider.api
 */
export function getProviderBaseURL(provider: Provider): string | undefined {
  if (provider.options?.baseURL) {
    return provider.options.baseURL;
  }
  let api = provider.api;
  for (const env of provider.apiEnv || []) {
    if (process.env[env]) {
      api = process.env[env];
      break;
    }
  }
  return api;
}

/**
 * Strip quotes from the beginning and end of a string.
 * Handles both single quotes (') and double quotes (").
 */
function stripQuotes(value: string): string {
  if (!value || value.length < 2) {
    return value;
  }

  const firstChar = value[0];
  const lastChar = value[value.length - 1];

  // Check if both ends have matching quotes
  if (
    (firstChar === '"' && lastChar === '"') ||
    (firstChar === "'" && lastChar === "'")
  ) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * Get the API key for a provider.
 * Priority: provider.options.apiKey > provider.env
 *
 * Automatically strips quotes from both ends of the API key
 * to handle cases where users accidentally include them.
 */
export function getProviderApiKey(provider: Provider): string {
  const apiKey = (() => {
    if (provider.options?.apiKey) {
      const key = provider.options.apiKey;
      // Strip quotes if present (handles user input like 'key' or "key")
      return stripQuotes(key);
    }
    const envs = provider.env || [];
    for (const env of envs) {
      if (process.env[env]) {
        const key = process.env[env];
        // Strip quotes if present (handles .env files with KEY='value')
        return stripQuotes(key);
      }
    }
    return '';
  })();
  const key = rotateApiKey(apiKey);
  return key;
}
