import degit from 'degit';
import fs from 'fs';
import os from 'os';
import path from 'pathe';
import type { Context } from '../core/context';
import type { Paths } from '../core/paths';
import { PluginHookType } from '../core/plugin';
import { safeFrontMatter } from '../utils/safeFrontMatter';
import {
  bundledSkillRegistry,
  bundledSkillToMetadata,
  type BundledSkillDefinition,
} from './bundled';

/**
 * Check if a directory entry is a directory or a symlink pointing to a directory.
 */
function isDirOrSymlinkToDir(parentDir: string, entry: fs.Dirent): boolean {
  if (entry.isDirectory()) return true;
  if (entry.isSymbolicLink()) {
    try {
      return fs.statSync(path.join(parentDir, entry.name)).isDirectory();
    } catch {
      // broken symlink, skip
    }
  }
  return false;
}

export enum SkillSource {
  Plugin = 'plugin',
  GlobalClaude = 'global-claude',
  Global = 'global',
  ProjectClaude = 'project-claude',
  Project = 'project',
  Builtin = 'builtin',
}

export type SkillContext = 'inline' | 'fork';

export interface SkillMetadata {
  name: string;
  description: string;
  path: string;
  source: SkillSource;
  /**
   * Tools that this skill is allowed to use.
   * If specified, only these tools will be available when the skill executes.
   * Example: ['Read', 'Grep', 'Bash']
   */
  allowedTools?: string[];
  /**
   * Execution context for the skill.
   * - 'inline': Skill content is injected into current conversation (default)
   * - 'fork': Skill runs in an isolated sub-agent
   */
  context?: SkillContext;
  /**
   * Agent type to use when context is 'fork'.
   * If not specified, defaults to a general-purpose agent.
   */
  agent?: string;
  /**
   * File path patterns that trigger this skill's availability.
   * Example: ['src/asterisk/asterisk.ts', '*.test.js']
   */
  paths?: string[];
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
}

export interface SkillError {
  path: string;
  message: string;
}

export interface SkillLoadOutcome {
  skills: SkillMetadata[];
  errors: SkillError[];
}

export interface AddSkillOptions {
  global?: boolean;
  claude?: boolean;
  overwrite?: boolean;
  name?: string;
  targetDir?: string;
}

export interface SkillPreview {
  name: string;
  description: string;
  skillPath: string;
  skillDir: string;
}

export interface PreviewSkillsResult {
  tempDir: string;
  skills: SkillPreview[];
  errors: SkillError[];
}

export interface AddSkillResult {
  installed: SkillMetadata[];
  skipped: { name: string; reason: string }[];
  errors: SkillError[];
}

const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 2048;

export interface SkillManagerOpts {
  context: Context;
}

export class SkillManager {
  private skillsMap: Map<string, SkillMetadata> = new Map();
  private errors: SkillError[] = [];
  private paths: Paths;
  private context: Context;
  /**
   * Tracks which skills are currently "active" based on file operations.
   * Skills with `paths` frontmatter are activated when matching files are accessed.
   */
  private activeSkillNames: Set<string> = new Set();
  /**
   * Maps alias names to original skill names for bundled skills.
   */
  private aliasMap: Map<string, string> = new Map();

  constructor(opts: SkillManagerOpts) {
    this.context = opts.context;
    this.paths = opts.context.paths;
  }

  /**
   * Get all loaded skills.
   * @param options Filter options
   * @returns Array of skill metadata
   */
  getSkills(options?: {
    /** Only return skills that are user-invocable */
    userInvocable?: boolean;
    /** Only return skills that are model-invocable */
    modelInvocable?: boolean;
    /** Only return active skills (those with matching paths) */
    activeOnly?: boolean;
  }): SkillMetadata[] {
    let skills = Array.from(this.skillsMap.values());

    if (options?.userInvocable !== undefined) {
      skills = skills.filter(
        (s) => (s.userInvocable ?? true) === options.userInvocable,
      );
    }

    if (options?.modelInvocable !== undefined) {
      skills = skills.filter(
        (s) => (s.modelInvocable ?? true) === options.modelInvocable,
      );
    }

    if (options?.activeOnly) {
      skills = skills.filter((s) => this.activeSkillNames.has(s.name));
    }

    return skills;
  }

  /**
   * Get a specific skill by name.
   * Automatically resolves aliases to the original skill.
   * @param name Skill name or alias
   * @returns Skill metadata or undefined if not found
   */
  getSkill(name: string): SkillMetadata | undefined {
    // Check direct name first
    const skill = this.skillsMap.get(name);
    if (skill) return skill;

    // Check if it's an alias
    const originalName = this.aliasMap.get(name);
    if (originalName) {
      return this.skillsMap.get(originalName);
    }

    return undefined;
  }

  /**
   * Check if a skill is active (has matching paths for current context).
   * @param name Skill name
   */
  isSkillActive(name: string): boolean {
    return this.activeSkillNames.has(name);
  }

  /**
   * Activate skills based on file paths.
   * Skills with `paths` frontmatter that match the given paths will be activated.
   * @param filePaths Array of file paths to check
   * @returns Array of newly activated skill names
   */
  activateSkillsForPaths(filePaths: string[]): string[] {
    const newlyActivated: string[] = [];
    const minimatch = require('minimatch');

    for (const [name, skill] of this.skillsMap) {
      if (skill.paths && skill.paths.length > 0) {
        const isMatch = skill.paths.some((pattern) =>
          filePaths.some((filePath) => minimatch(filePath, pattern)),
        );

        if (isMatch && !this.activeSkillNames.has(name)) {
          this.activeSkillNames.add(name);
          newlyActivated.push(name);
        }
      }
    }

    return newlyActivated;
  }

  /**
   * Clear all active skill activations.
   * Useful when switching contexts or projects.
   */
  clearActiveSkills(): void {
    this.activeSkillNames.clear();
  }

  /**
   * Get all skills that have path-based conditional activation.
   * @returns Array of skills with paths defined
   */
  getConditionalSkills(): SkillMetadata[] {
    return Array.from(this.skillsMap.values()).filter(
      (s) => s.paths && s.paths.length > 0,
    );
  }

  getErrors(): SkillError[] {
    return this.errors;
  }

  /**
   * Read the body content of a skill.
   * For file-based skills, reads from disk.
   * For bundled skills, generates content via getPrompt.
   */
  async readSkillBody(skill: SkillMetadata, args: string = ''): Promise<string> {
    try {
      // Handle bundled skills
      if (skill.path.startsWith('bundled://')) {
        const bundledName = skill.path.replace('bundled://', '');
        const bundledSkill = bundledSkillRegistry.get(bundledName);
        if (!bundledSkill) {
          throw new Error(`Bundled skill "${bundledName}" not found in registry`);
        }
        return await bundledSkill.getPrompt(args, this.context);
      }

      // Handle file-based skills
      const content = fs.readFileSync(skill.path, 'utf-8');
      const { body } = safeFrontMatter(content, skill.path);
      return body;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error reading skill';
      throw new Error(`Failed to read skill ${skill.name}: ${message}`);
    }
  }

  /**
   * Get a bundled skill definition by name.
   * @param name Bundled skill name
   * @returns Bundled skill definition or undefined if not found
   */
  getBundledSkill(name: string): BundledSkillDefinition | undefined {
    return bundledSkillRegistry.get(name);
  }

  /**
   * Register a bundled skill programmatically.
   * @param definition Bundled skill definition
   */
  registerBundledSkill(definition: BundledSkillDefinition): void {
    bundledSkillRegistry.register(definition);
    // Reload to include the new skill
    this.loadBuiltinSkills();
  }

  async loadSkills(): Promise<void> {
    this.skillsMap.clear();
    this.errors = [];

    // Load builtin/bundled skills first
    this.loadBuiltinSkills();

    const pluginSkills = await this.context.apply({
      hook: 'skill',
      args: [],
      memo: [],
      type: PluginHookType.SeriesMerge,
    });

    if (Array.isArray(pluginSkills)) {
      for (const skillPath of pluginSkills) {
        if (typeof skillPath !== 'string') {
          this.errors.push({
            path: String(skillPath),
            message: 'Invalid skill path type: expected string',
          });
          continue;
        }
        if (!fs.existsSync(skillPath)) {
          this.errors.push({
            path: skillPath,
            message: 'Skill file not found',
          });
          continue;
        }
        this.loadSkillFile(skillPath, SkillSource.Plugin);
      }
    }

    const globalClaudeDir = path.join(
      path.dirname(this.paths.globalConfigDir),
      '.claude',
      'skills',
    );
    this.loadSkillsFromDirectory(globalClaudeDir, SkillSource.GlobalClaude);

    const globalDir = path.join(this.paths.globalConfigDir, 'skills');
    this.loadSkillsFromDirectory(globalDir, SkillSource.Global);

    const projectClaudeDir = path.join(
      path.dirname(this.paths.projectConfigDir),
      '.claude',
      'skills',
    );
    this.loadSkillsFromDirectory(projectClaudeDir, SkillSource.ProjectClaude);

    const projectDir = path.join(this.paths.projectConfigDir, 'skills');
    this.loadSkillsFromDirectory(projectDir, SkillSource.Project);
  }

  /**
   * Load builtin/bundled skills from the registry.
   */
  private loadBuiltinSkills(): void {
    // Clear alias map when reloading
    this.aliasMap.clear();

    const bundledSkills = bundledSkillRegistry.getAll(this.context);
    for (const skill of bundledSkills) {
      const metadata = bundledSkillToMetadata(skill, SkillSource.Builtin);
      this.skillsMap.set(skill.name, metadata);

      // Register aliases in the alias map
      if (skill.aliases) {
        for (const alias of skill.aliases) {
          this.aliasMap.set(alias, skill.name);
        }
      }
    }
  }

  private loadSkillsFromDirectory(
    skillsDir: string,
    source: SkillSource,
  ): void {
    if (!fs.existsSync(skillsDir)) {
      return;
    }

    try {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (isDirOrSymlinkToDir(skillsDir, entry)) {
          const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillPath)) {
            this.loadSkillFile(skillPath, source);
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error scanning directory';
      this.errors.push({
        path: skillsDir,
        message: `Failed to scan skills directory: ${message}`,
      });
    }
  }

  private loadSkillFile(skillPath: string, source: SkillSource): void {
    try {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const parsed = this.parseSkillFile(content, skillPath);

      if (parsed) {
        this.skillsMap.set(parsed.name, { ...parsed, source });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error loading skill';
      this.errors.push({
        path: skillPath,
        message,
      });
    }
  }

  private parseSkillFile(
    content: string,
    skillPath: string,
  ): Omit<SkillMetadata, 'source'> | null {
    try {
      const { attributes } = safeFrontMatter<{
        name?: string;
        description?: string;
        allowedTools?: string | string[];
        context?: string;
        agent?: string;
        paths?: string | string[];
        userInvocable?: boolean;
        modelInvocable?: boolean;
      }>(content, skillPath);

      if (!attributes.name) {
        this.errors.push({
          path: skillPath,
          message: 'Missing required field: name',
        });
        return null;
      }

      if (!attributes.description) {
        this.errors.push({
          path: skillPath,
          message: 'Missing required field: description',
        });
        return null;
      }

      if (attributes.name.length > MAX_NAME_LENGTH) {
        this.errors.push({
          path: skillPath,
          message: `Name exceeds maximum length of ${MAX_NAME_LENGTH} characters`,
        });
        return null;
      }

      if (attributes.name.includes('\n')) {
        this.errors.push({
          path: skillPath,
          message: 'Name must be a single line',
        });
        return null;
      }

      if (attributes.description.length > MAX_DESCRIPTION_LENGTH) {
        this.errors.push({
          path: skillPath,
          message: `Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`,
        });
        return null;
      }

      // Parse allowedTools - supports both string and array formats
      const allowedTools = this.parseStringArrayField(attributes.allowedTools);

      // Parse context (inline or fork)
      const context: SkillContext | undefined =
        attributes.context === 'inline' || attributes.context === 'fork'
          ? attributes.context
          : undefined;

      // Parse paths - supports both string and array formats
      const paths = this.parseStringArrayField(attributes.paths);

      return {
        name: attributes.name,
        description: attributes.description,
        path: skillPath,
        allowedTools,
        context,
        agent: attributes.agent,
        paths,
        userInvocable: attributes.userInvocable ?? true,
        modelInvocable: attributes.modelInvocable ?? true,
      };
    } catch (error) {
      this.errors.push({
        path: skillPath,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to parse frontmatter',
      });
      return null;
    }
  }

  /**
   * Parse a field that can be either a comma-separated string or an array of strings.
   * @param value The value to parse
   * @returns Array of strings or undefined if empty
   */
  private parseStringArrayField(
    value: string | string[] | undefined,
  ): string[] | undefined {
    if (!value) return undefined;

    if (Array.isArray(value)) {
      return value
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return undefined;
  }

  async addSkill(
    source: string,
    options: AddSkillOptions = {},
  ): Promise<AddSkillResult> {
    const {
      global: isGlobal = false,
      claude: isClaude = false,
      overwrite = false,
      name,
      targetDir,
    } = options;
    const result: AddSkillResult = {
      installed: [],
      skipped: [],
      errors: [],
    };

    const tempDir = path.join(os.tmpdir(), `oricore-skill-${Date.now()}`);

    try {
      const normalizedSource = this.normalizeSource(source);
      const emitter = degit(normalizedSource, { force: true });
      await emitter.clone(tempDir);

      const skillPaths = this.scanForSkills(tempDir);

      if (skillPaths.length === 0) {
        result.errors.push({
          path: source,
          message: 'No skills found (no SKILL.md files)',
        });
        return result;
      }

      if (name && skillPaths.length > 1) {
        throw new Error(
          'Cannot use --name when source contains multiple skills',
        );
      }

      const targetBaseDir = targetDir
        ? targetDir
        : isClaude && isGlobal
          ? path.join(
              path.dirname(this.paths.globalConfigDir),
              '.claude',
              'skills',
            )
          : isClaude
            ? path.join(
                path.dirname(this.paths.projectConfigDir),
                '.claude',
                'skills',
              )
            : isGlobal
              ? path.join(this.paths.globalConfigDir, 'skills')
              : path.join(this.paths.projectConfigDir, 'skills');

      fs.mkdirSync(targetBaseDir, { recursive: true });

      for (const skillPath of skillPaths) {
        const skillDir = path.dirname(skillPath);
        const isRootSkill = skillDir === tempDir;
        const folderName =
          name ||
          (isRootSkill
            ? this.extractFolderName(source)
            : path.basename(skillDir));
        const targetDir = path.join(targetBaseDir, folderName);

        const content = fs.readFileSync(skillPath, 'utf-8');
        const parsed = this.parseSkillFileForAdd(content, skillPath);

        if (!parsed) {
          result.errors.push({
            path: skillPath,
            message: 'Invalid skill file',
          });
          continue;
        }

        if (fs.existsSync(targetDir)) {
          if (!overwrite) {
            result.skipped.push({
              name: parsed.name,
              reason: 'already exists',
            });
            continue;
          }
          fs.rmSync(targetDir, { recursive: true });
        }

        this.copyDirectory(skillDir, targetDir);

        result.installed.push({
          name: parsed.name,
          description: parsed.description,
          path: path.join(targetDir, 'SKILL.md'),
          source:
            isClaude && isGlobal
              ? SkillSource.GlobalClaude
              : isClaude
                ? SkillSource.ProjectClaude
                : isGlobal
                  ? SkillSource.Global
                  : SkillSource.Project,
        });
      }

      await this.loadSkills();
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }

    return result;
  }

  private normalizeSource(source: string): string {
    let normalized = source;

    if (
      normalized.startsWith('https://github.com/') ||
      normalized.startsWith('http://github.com/')
    ) {
      normalized = normalized.replace(/^https?:\/\/github\.com\//, '');
      const treeMatch = normalized.match(
        /^([^/]+\/[^/]+)\/tree\/([^/]+)(?:\/(.+))?$/,
      );
      if (treeMatch) {
        const [, repo, branch, subpath] = treeMatch;
        normalized = subpath
          ? `${repo}/${subpath}#${branch}`
          : `${repo}#${branch}`;
      }
      return `github:${normalized}`;
    }

    if (
      !normalized.startsWith('github:') &&
      !normalized.startsWith('gitlab:') &&
      !normalized.startsWith('bitbucket:')
    ) {
      return `github:${normalized}`;
    }
    return normalized;
  }

  private extractFolderName(source: string): string {
    let normalized = source
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/^github:/, '')
      .replace(/^gitlab:/, '')
      .replace(/^bitbucket:/, '');

    const treeMatchWithPath = normalized.match(
      /^[^/]+\/[^/]+\/tree\/[^/]+\/(.+)$/,
    );
    if (treeMatchWithPath) {
      normalized = treeMatchWithPath[1];
    } else {
      const treeMatchBranchOnly = normalized.match(
        /^([^/]+)\/([^/]+)\/tree\/[^/]+$/,
      );
      if (treeMatchBranchOnly) {
        normalized = treeMatchBranchOnly[2];
      }
    }

    normalized = normalized.replace(/#.*$/, '');
    const lastSegment = normalized.split('/').filter(Boolean).pop();
    return lastSegment || 'skill';
  }

  private scanForSkills(dir: string): string[] {
    const skills: string[] = [];

    const rootSkill = path.join(dir, 'SKILL.md');
    if (fs.existsSync(rootSkill)) {
      skills.push(rootSkill);
      return skills;
    }

    const skillsDir = path.join(dir, 'skills');
    if (fs.existsSync(skillsDir) && fs.statSync(skillsDir).isDirectory()) {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (isDirOrSymlinkToDir(skillsDir, entry)) {
          const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillPath)) {
            skills.push(skillPath);
          }
        }
      }
      if (skills.length > 0) {
        return skills;
      }
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (isDirOrSymlinkToDir(dir, entry)) {
        const skillPath = path.join(dir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          skills.push(skillPath);
        }
      }
    }

    return skills;
  }

  private copyDirectory(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private parseSkillFileForAdd(
    content: string,
    skillPath: string,
  ): { name: string; description: string } | null {
    try {
      const { attributes } = safeFrontMatter<{
        name?: string;
        description?: string;
      }>(content, skillPath);

      if (!attributes.name || !attributes.description) {
        return null;
      }

      if (
        attributes.name.length > MAX_NAME_LENGTH ||
        attributes.name.includes('\n')
      ) {
        return null;
      }

      if (attributes.description.length > MAX_DESCRIPTION_LENGTH) {
        return null;
      }

      return {
        name: attributes.name,
        description: attributes.description,
      };
    } catch {
      return null;
    }
  }

  async previewSkills(source: string): Promise<PreviewSkillsResult> {
    const tempDir = path.join(os.tmpdir(), `oricore-skill-${Date.now()}`);
    const result: PreviewSkillsResult = {
      tempDir,
      skills: [],
      errors: [],
    };

    const normalizedSource = this.normalizeSource(source);
    const emitter = degit(normalizedSource, { force: true });
    await emitter.clone(tempDir);

    const skillPaths = this.scanForSkills(tempDir);

    if (skillPaths.length === 0) {
      result.errors.push({
        path: source,
        message: 'No skills found (no SKILL.md files)',
      });
      return result;
    }

    for (const skillPath of skillPaths) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const parsed = this.parseSkillFileForAdd(content, skillPath);

      if (!parsed) {
        result.errors.push({
          path: skillPath,
          message: 'Invalid skill file',
        });
        continue;
      }

      result.skills.push({
        name: parsed.name,
        description: parsed.description,
        skillPath,
        skillDir: path.dirname(skillPath),
      });
    }

    return result;
  }

  async installFromPreview(
    preview: PreviewSkillsResult,
    selectedSkills: SkillPreview[],
    source: string,
    options: AddSkillOptions = {},
  ): Promise<AddSkillResult> {
    const {
      global: isGlobal = false,
      claude: isClaude = false,
      overwrite = false,
      name,
      targetDir,
    } = options;
    const result: AddSkillResult = {
      installed: [],
      skipped: [],
      errors: [],
    };

    if (name && selectedSkills.length > 1) {
      throw new Error('Cannot use --name when installing multiple skills');
    }

    const targetBaseDir = targetDir
      ? targetDir
      : isClaude && isGlobal
        ? path.join(
            path.dirname(this.paths.globalConfigDir),
            '.claude',
            'skills',
          )
        : isClaude
          ? path.join(
              path.dirname(this.paths.projectConfigDir),
              '.claude',
              'skills',
            )
          : isGlobal
            ? path.join(this.paths.globalConfigDir, 'skills')
            : path.join(this.paths.projectConfigDir, 'skills');

    fs.mkdirSync(targetBaseDir, { recursive: true });

    for (const skill of selectedSkills) {
      const isRootSkill = skill.skillDir === preview.tempDir;
      const folderName =
        name ||
        (isRootSkill
          ? this.extractFolderName(source)
          : path.basename(skill.skillDir));
      const skillTargetDir = path.join(targetBaseDir, folderName);

      if (fs.existsSync(skillTargetDir)) {
        if (!overwrite) {
          result.skipped.push({
            name: skill.name,
            reason: 'already exists',
          });
          continue;
        }
        fs.rmSync(skillTargetDir, { recursive: true });
      }

      this.copyDirectory(skill.skillDir, skillTargetDir);

      result.installed.push({
        name: skill.name,
        description: skill.description,
        path: path.join(skillTargetDir, 'SKILL.md'),
        source:
          isClaude && isGlobal
            ? SkillSource.GlobalClaude
            : isClaude
              ? SkillSource.ProjectClaude
              : isGlobal
                ? SkillSource.Global
                : SkillSource.Project,
      });
    }

    await this.loadSkills();
    return result;
  }

  cleanupPreview(preview: PreviewSkillsResult): void {
    if (fs.existsSync(preview.tempDir)) {
      fs.rmSync(preview.tempDir, { recursive: true });
    }
  }

  async removeSkill(
    name: string,
    targetDir?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const skillsDir =
      targetDir || path.join(this.paths.projectConfigDir, 'skills');
    const skillDir = path.join(skillsDir, name);

    if (!fs.existsSync(skillDir)) {
      return { success: false, error: 'Skill not found' };
    }

    const skillPath = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      return { success: false, error: 'Invalid skill directory (no SKILL.md)' };
    }

    fs.rmSync(skillDir, { recursive: true });
    await this.loadSkills();
    return { success: true };
  }
}
