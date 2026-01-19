/**
 * OriCore
 *
 * Core AI engine for AI-powered coding assistance.
 * This package provides the core functionality for AI-powered coding assistance.
 *
 * @version 1.0.0
 */

// Main Engine API
export {
  Engine,
  createEngine,
  type EngineOptions,
  type EngineConfig,
  type SessionOptions,
  type SendMessageOptions,
} from './api/engine';

// Mode system
export * from './modes';

// Platform abstraction
export * from './platform';

// Communication layer
export * from './communication';

// Core utilities
export { randomUUID } from './utils/randomUUID';

// Paths
export { Paths, getGlobalDataPath } from './core/paths';

// Loop result type (for sendMessage return value)
export type { LoopResult } from './core/loop';

// Version
export const ENGINE_VERSION = '1.0.0';
