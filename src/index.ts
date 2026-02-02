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

// Session management
export { Session, type SessionId, type SessionConfig, SessionConfigManager, loadSessionMessages } from './session/session';
export { JsonlLogger } from './jsonl';
export { History } from './core/history';
export { Usage } from './core/usage';

// Compression
export { Compression, isOverflow } from './compression';
export type { CompressionConfig, PruneResult } from './compression';

// Core utilities
export { randomUUID } from './utils/randomUUID';

// Paths
export { Paths, getGlobalDataPath } from './core/paths';

// GlobalData
export { GlobalData } from './core/globalData';

// Skill system
export { SkillManager } from './skill/skill';
export type {
  SkillManagerOpts,
  SkillMetadata,
  SkillError,
  SkillLoadOutcome,
  AddSkillOptions,
  SkillPreview,
  PreviewSkillsResult,
  AddSkillResult,
} from './skill/skill';
export { SkillSource } from './skill/skill';

// Loop result type (for sendMessage return value)
export type { LoopResult } from './core/loop';

// Version
export const ENGINE_VERSION = '1.0.0';
