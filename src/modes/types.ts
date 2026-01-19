/**
 * Mode System Types
 *
 * Defines the interface for AI interaction modes like brainstorming, planning, etc.
 */

import type { NormalizedMessage } from '../core/message';

export type ModeType = 'default' | 'brainstorm' | 'plan' | 'review' | 'debug' | 'custom';

export interface ModeConfig {
  /** System prompt for this mode */
  systemPrompt: string;
  /** Enable write tools */
  write?: boolean;
  /** Enable todo tools */
  todo?: boolean;
  /** Enable ask user question tool (important for interactive modes) */
  askUserQuestion?: boolean;
  /** Enable task/agent tool */
  task?: boolean;
  /** Maximum turns */
  maxTurns?: number;
  /** Model override for this mode */
  model?: string;
  /** Temperature for this mode */
  temperature?: number;
  /** Whether to enable conversation auto-compact */
  autoCompact?: boolean;
}

export interface Mode {
  /** Unique mode identifier */
  id: ModeType;
  /** Display name */
  name: string;
  /** Description of what this mode does */
  description: string;
  /** Mode configuration */
  config: ModeConfig;
  /** Optional custom prompt builder */
  buildPrompt?: (args: string) => string | NormalizedMessage[];
}

export interface ModeRegistry {
  /** Register a mode */
  register(mode: Mode): void;
  /** Unregister a mode */
  unregister(id: ModeType): void;
  /** Get a mode by ID */
  get(id: ModeType): Mode | undefined;
  /** Get all registered modes */
  getAll(): Mode[];
  /** Check if a mode exists */
  has(id: ModeType): boolean;
}
