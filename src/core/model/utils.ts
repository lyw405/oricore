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
 * Get the API key for a provider.
 * Priority: provider.options.apiKey > provider.env
 */
export function getProviderApiKey(provider: Provider): string {
  const apiKey = (() => {
    if (provider.options?.apiKey) {
      return provider.options.apiKey;
    }
    const envs = provider.env || [];
    for (const env of envs) {
      if (process.env[env]) {
        return process.env[env];
      }
    }
    return '';
  })();
  const key = rotateApiKey(apiKey);
  return key;
}
