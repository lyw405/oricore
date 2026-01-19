/**
 * Mode Registry
 *
 * Manages AI interaction modes
 */

import type { Mode, ModeRegistry, ModeType } from './types';

export class ModeRegistryImpl implements ModeRegistry {
  private modes = new Map<ModeType, Mode>();

  register(mode: Mode): void {
    if (this.modes.has(mode.id)) {
      throw new Error(`Mode ${mode.id} is already registered`);
    }
    this.modes.set(mode.id, mode);
  }

  unregister(id: ModeType): void {
    this.modes.delete(id);
  }

  get(id: ModeType): Mode | undefined {
    return this.modes.get(id);
  }

  getAll(): Mode[] {
    return Array.from(this.modes.values());
  }

  has(id: ModeType): boolean {
    return this.modes.has(id);
  }
}

/**
 * Global mode registry instance
 */
export const modeRegistry = new ModeRegistryImpl();
