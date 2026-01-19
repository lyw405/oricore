/**
 * Mode System
 *
 * AI interaction modes for different use cases
 */

// Export types
export * from './types';

// Export registry
export { ModeRegistryImpl as ModeRegistry, modeRegistry } from './registry';

// Export built-in modes
export {
  defaultMode,
  brainstormMode,
  planMode,
  reviewMode,
  debugMode,
  builtinModes,
  registerBuiltinModes,
} from './builtin';
