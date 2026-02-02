import type { Provider } from './types';
import { createProxyFetch } from '../../utils/proxy';

/**
 * Inject proxy support into AI SDK configuration.
 * Priority: Provider-level proxy > Global proxy
 * Also merges provider-level headers with config headers
 *
 * @param config - SDK configuration object
 * @param provider - Provider configuration
 * @returns Config with proxy fetch injected if proxy is configured
 */
function withProxyConfig<T extends Record<string, any>>(
  config: T,
  provider: Provider,
): T {
  const proxyUrl = provider.options?.httpProxy;
  const providerHeaders = provider.headers;
  const optionsHeaders = provider.options?.headers;

  const result: any = {
    ...config,
  };

  // Merge headers: provider.headers + provider.options.headers + config.headers
  if (providerHeaders || optionsHeaders || config.headers) {
    result.headers = {
      ...(providerHeaders || {}),
      ...(optionsHeaders || {}),
      ...(config.headers || {}),
    };
  }

  if (proxyUrl) {
    const proxyFetch = createProxyFetch(proxyUrl);
    result.fetch = proxyFetch;
  }

  return result;
}

export { withProxyConfig };
