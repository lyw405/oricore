/**
 * Plugin System
 *
 * NOTE: Hook logger and notification plugins are CLI-specific.
 * This file provides the basic plugin interfaces.
 */

export interface Plugin {
  name: string;
  version?: string;
  init?: () => void;
  destroy?: () => void;
}

export const plugins: Plugin[] = [];
