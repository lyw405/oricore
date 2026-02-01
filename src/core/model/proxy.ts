import type { Provider } from './types';
import { createProxyFetch } from '../../utils/proxy';

/**
 * Inject proxy support into AI SDK configuration.
 * Priority: Provider-level proxy > Global proxy
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

  if (proxyUrl) {
    const proxyFetch = createProxyFetch(proxyUrl);
    return {
      ...config,
      fetch: proxyFetch,
    };
  }

  return config;
}

export { withProxyConfig };
