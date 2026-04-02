import type { Context } from '../core/context';
import type { SkillMetadata, SkillSource } from './skill';

/**
 * Bundled skill definition for TypeScript-encoded skills.
 * This allows skills to be defined programmatically with dynamic behavior.
 */
export interface BundledSkillDefinition {
  /** Unique skill name */
  name: string;
  /** Skill description */
  description: string;
  /**
   * Tools that this skill is allowed to use.
   * If specified, only these tools will be available when the skill executes.
   */
  allowedTools?: string[];
  /**
   * Execution context for the skill.
   * - 'inline': Skill content is injected into current conversation (default)
   * - 'fork': Skill runs in an isolated sub-agent
   */
  context?: 'inline' | 'fork';
  /**
   * Agent type to use when context is 'fork'.
   * If not specified, defaults to 'general-purpose'.
   */
  agent?: string;
  /**
   * Whether this skill can be invoked by users via slash commands.
   * @default true
   */
  userInvocable?: boolean;
  /**
   * Whether this skill can be invoked by the model via SkillTool.
   * @default true
   */
  modelInvocable?: boolean;
  /**
   * Aliases for the skill name.
   * Allows the skill to be invoked by alternative names.
   */
  aliases?: string[];
  /**
   * When to use this skill.
   * Provides guidance to the model about when to invoke this skill.
   */
  whenToUse?: string;
  /**
   * Hint for arguments that can be passed to the skill.
   * Example: '[file_path] [issue_description]'
   */
  argumentHint?: string;
  /**
   * Function to determine if this skill is enabled in the current context.
   * Can be a boolean or a function that receives the context.
   */
  isEnabled?: boolean | ((context: Context) => boolean);
  /**
   * Embedded reference files that will be extracted when the skill runs.
   * Key is the filename, value is the file content.
   */
  files?: Record<string, string>;
  /**
   * Generate the skill prompt content.
   * This function is called when the skill is invoked.
   * @param args Arguments passed to the skill
   * @param context The execution context
   * @returns Promise resolving to the skill prompt content
   */
  getPrompt: (args: string, context: Context) => Promise<string> | string;
}

/**
 * Registry for bundled skills.
 * Skills registered here are built into the engine binary.
 */
class BundledSkillRegistry {
  private skills: Map<string, BundledSkillDefinition> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Register a bundled skill.
   * @param definition The skill definition
   */
  register(definition: BundledSkillDefinition): void {
    if (!definition.name) {
      throw new Error('Bundled skill must have a name');
    }
    if (!definition.description) {
      throw new Error('Bundled skill must have a description');
    }
    if (!definition.getPrompt) {
      throw new Error('Bundled skill must have a getPrompt function');
    }

    this.skills.set(definition.name, definition);

    // Register aliases
    if (definition.aliases) {
      for (const alias of definition.aliases) {
        this.aliases.set(alias, definition.name);
      }
    }
  }

  /**
   * Get a bundled skill by name or alias.
   * @param name Skill name or alias
   * @returns The skill definition or undefined if not found
   */
  get(name: string): BundledSkillDefinition | undefined {
    // Check direct name first
    const skill = this.skills.get(name);
    if (skill) return skill;

    // Check aliases
    const aliasedName = this.aliases.get(name);
    if (aliasedName) {
      return this.skills.get(aliasedName);
    }

    return undefined;
  }

  /**
   * Get all registered bundled skills.
   * @param context Optional context to filter by isEnabled
   * @returns Array of skill definitions
   */
  getAll(context?: Context): BundledSkillDefinition[] {
    return Array.from(this.skills.values()).filter((skill) => {
      if (skill.isEnabled === undefined) return true;
      if (typeof skill.isEnabled === 'boolean') return skill.isEnabled;
      if (typeof skill.isEnabled === 'function' && context) {
        return skill.isEnabled(context);
      }
      return true;
    });
  }

  /**
   * Check if a skill is registered.
   * @param name Skill name or alias
   */
  has(name: string): boolean {
    return this.skills.has(name) || this.aliases.has(name);
  }

  /**
   * Unregister a skill.
   * @param name Skill name
   */
  unregister(name: string): void {
    const skill = this.skills.get(name);
    if (skill && skill.aliases) {
      for (const alias of skill.aliases) {
        this.aliases.delete(alias);
      }
    }
    this.skills.delete(name);
  }

  /**
   * Clear all registered skills.
   */
  clear(): void {
    this.skills.clear();
    this.aliases.clear();
  }
}

// Global registry instance
export const bundledSkillRegistry = new BundledSkillRegistry();

/**
 * Convert a bundled skill definition to SkillMetadata format.
 * This is used internally when loading bundled skills into the SkillManager.
 */
export function bundledSkillToMetadata(
  definition: BundledSkillDefinition,
  source: SkillSource = 'builtin' as SkillSource,
): SkillMetadata {
  return {
    name: definition.name,
    description: definition.description,
    path: `bundled://${definition.name}`,
    source,
    allowedTools: definition.allowedTools,
    context: definition.context,
    agent: definition.agent,
    userInvocable: definition.userInvocable ?? true,
    modelInvocable: definition.modelInvocable ?? true,
    // Note: bundled skills don't support 'paths' conditional activation
  };
}

/**
 * Helper function to create a simple bundled skill.
 */
export function createBundledSkill(
  config: Omit<BundledSkillDefinition, 'getPrompt'> & {
    prompt: string | ((args: string, context: Context) => Promise<string> | string);
  },
): BundledSkillDefinition {
  return {
    ...config,
    getPrompt:
      typeof config.prompt === 'string'
        ? () => config.prompt as string
        : config.prompt,
  };
}

/**
 * Register a bundled skill using a simplified configuration.
 */
export function registerBundledSkill(
  config: Omit<BundledSkillDefinition, 'getPrompt'> & {
    prompt: string | ((args: string, context: Context) => Promise<string> | string);
  },
): void {
  const skill = createBundledSkill(config);
  bundledSkillRegistry.register(skill);
}
