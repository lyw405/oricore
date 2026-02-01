/**
 * Model module - Re-exports for backward compatibility
 *
 * This file maintains backward compatibility with the original model.ts
 * by re-exporting all symbols from the split modules.
 */

// Types
export type {
  ModelModalities,
  Model,
  Provider,
  ProvidersMap,
  ModelMap,
  ModelAlias,
  ModelInfo,
} from './model/types';

// Data
export { models } from './model/models';
export { providers } from './model/providers';
export { modelAlias } from './model/aliases';

// Utilities
export { getProviderBaseURL } from './model/utils';

// Model creators are exported from providers
export {
  createModelCreatorCompatible,
} from './model/providers';

// Resolution functions
export {
  resolveModelWithContext,
  resolveModel,
} from './model/resolution';
