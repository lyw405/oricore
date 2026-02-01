# Skill System

Documentation for OriCore's custom skill system.

[English](SKILLS.md) | [中文文档](SKILLS.zh-CN.md)

---

## Table of Contents

- [Skill Overview](#skill-overview)
- [Creating Skills](#creating-skills)
- [Skill Structure](#skill-structure)
- [Installing Skills](#installing-skills)
- [Using Skills](#using-skills)
- [Skill Sources](#skill-sources)

---

## Skill Overview

Skills are OriCore's custom capability extension system, allowing you to create reusable AI behavior patterns.

### Skill vs MCP

| Feature | Skill | MCP |
|---------|-------|-----|
| Purpose | Custom AI behavior | External tools and data |
| Deployment | Local files or Git repos | Standalone server |
| Complexity | Simple | Medium |
| Use Cases | Prompt templates, role settings | API integration, databases |

---

## Creating Skills

### Skill File Structure

A skill is a Markdown file with frontmatter:

```markdown
---
name: code-reviewer
description: Expert code reviewer for TypeScript projects
---

You are an expert TypeScript code reviewer. Focus on:
- Type safety
- Best practices
- Performance
- Security

Provide constructive feedback with specific examples.
```

### Skill Locations

Skills can be placed in the following locations:

| Location | Path | SkillSource |
|----------|------|-------------|
| Claude project skill | `.claude/skills/*/SKILL.md` | `ProjectClaude` |
| OriCore project skill | `.oricore/skills/*/SKILL.md` | `Project` |
| Claude global skill | `~/.claude/skills/*/SKILL.md` | `GlobalClaude` |
| OriCore global skill | `~/.oricore/skills/*/SKILL.md` | `Global` |

### Example: Creating a Testing Expert Skill

Create `.oricore/skills/testing-expert/SKILL.md`:

```markdown
---
name: testing-expert
description: Unit testing and integration testing specialist
---

You are a testing expert. Specialize in:

- Writing unit tests with Jest/Vitest
- Integration testing strategies
- Test-driven development (TDD)
- Mock and stub strategies
- Test coverage analysis

## Guidelines

1. Always provide runnable test examples
2. Explain testing concepts clearly
3. Suggest appropriate test cases
4. Consider edge cases in tests
5. Balance between coverage and practicality

## Output Format

Provide code examples with:
- Test framework setup
- Test cases
- Mock/stub examples
- Expected outputs
```

---

## Skill Structure

### Frontmatter Metadata

```yaml
---
name: my-skill              # Skill name (required)
description: Skill description  # Description (required)
version: 1.0.0             # Version (optional)
author: Your Name          # Author (optional)
tags: [testing, typescript]  # Tags (optional)
---
```

### Skill Content

The content section is the system prompt, supporting:

- Markdown format
- Code blocks
- Sections (using ## headings)
- Guidelines
- Output formats

---

## Installing Skills

### Install from Local

```typescript
import { SkillManager } from 'oricore';

const context = engine.getContext();
const skillManager = new SkillManager({ context });

await skillManager.addSkill('/path/to/skill', {
  global: false,  // Project-level
});
```

### Install from GitHub

```typescript
await skillManager.addSkill('github:username/repo', {
  global: false,
  name: 'my-skill',  // Specify skill name
});
```

### Install from GitLab

```typescript
await skillManager.addSkill('gitlab:username/repo', {
  global: false,
});
```

### Installation Options

```typescript
interface AddSkillOptions {
  global?: boolean;     // true=global install (~/.oricore/skills/), false=project install (.oricore/skills/)
  claude?: boolean;     // true=install to Claude directory (~/.claude/skills/ or .claude/skills/)
  overwrite?: boolean;  // true=overwrite existing skill, false=skip
  name?: string;        // Custom skill folder name
  targetDir?: string;   // Custom installation target directory (overrides global/claude settings)
}
```

### Preview Before Install

```typescript
// Preview skills
const preview = await skillManager.previewSkills('github:username/repo');
console.log('Found skills:', preview.skills);

// Selective install
await skillManager.installFromPreview(
  preview,
  [
    preview.skills[0],  // Only install the first one
  ],
  'github:username/repo',
  {
    global: false,     // Optional: installation options
    overwrite: false,
  }
);

// Clean up preview temporary files
skillManager.cleanupPreview(preview);
```

---

## Using Skills

### Using in Conversations

```typescript
// Method 1: Direct skill reference
await engine.sendMessage({
  message: 'Use testing-expert skill to write tests for this function',
  write: true,
});

// Method 2: Using skill tool
await engine.sendMessage({
  message: 'Invoke code-reviewer skill to review this code',
  write: false,
});
```

### List Installed Skills

```typescript
const skillManager = new SkillManager({ context });
const skills = skillManager.getSkills();

skills.forEach(skill => {
  console.log(`${skill.name}: ${skill.description}`);
  console.log(`  Source: ${skill.source}`);
  console.log(`  Path: ${skill.path}`);
});
```

### Uninstall Skills

```typescript
await skillManager.removeSkill('testing-expert');
```

### Other Utility Methods

```typescript
// Get single skill
const skill = skillManager.getSkill('testing-expert');
if (skill) {
  console.log(`Skill: ${skill.name}`);
  console.log(`Description: ${skill.description}`);
  console.log(`Source: ${skill.source}`);
  console.log(`Path: ${skill.path}`);
}

// Get loading errors
const errors = skillManager.getErrors();
errors.forEach(error => {
  console.error(`[${error.path}] ${error.message}`);
});

// Read skill content (without frontmatter)
const body = await skillManager.readSkillBody(skill);
console.log(body);

// Remove skill (specify directory)
await skillManager.removeSkill('testing-expert', '/custom/path');
```

---

## Skill Sources

### SkillSource

```typescript
enum SkillSource {
  Plugin = 'plugin',           // Skills provided by plugins
  GlobalClaude = 'global-claude',   // Claude global directory (~/.claude/skills/)
  Global = 'global',           // OriCore global directory (~/.oricore/skills/)
  ProjectClaude = 'project-claude', // Claude project directory (.claude/skills/)
  Project = 'project',         // OriCore project directory (.oricore/skills/)
}
```

### Loading Priority

Skills are loaded in the following order (later sources override earlier ones with the same name):

1. **Plugin** - Plugin-provided skills
2. **GlobalClaude** - Claude global skills (`~/.claude/skills/`)
3. **Global** - OriCore global skills (`~/.oricore/skills/`)
4. **ProjectClaude** - Claude project skills (`.claude/skills/`)
5. **Project** - OriCore project skills (`.oricore/skills/`)

---

## Complete Example

### 1. Create a Skill

Create `.oricore/skills/ts-refactoring/SKILL.md`:

```markdown
---
name: ts-refactoring
description: TypeScript code refactoring specialist
---

You are a TypeScript refactoring expert. Focus on:

## Refactoring Principles

1. **Improve readability** - Make code self-documenting
2. **Reduce complexity** - Simplify complex logic
3. **Enhance maintainability** - Easier to modify
4. **Preserve behavior** - Same functionality, better code
5. **Leverage TypeScript** - Use type system effectively

## Refactoring Steps

1. Identify code smells
2. Suggest specific improvements
3. Explain why each change helps
4. Provide before/after examples
5. Suggest testing approach

## Common Patterns

- Extract functions/methods
- Rename for clarity
- Reduce nesting
- Use appropriate types
- Eliminate duplication
```

### 2. Use the Skill

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'RefactorTool',
  version: '1.0.0',
});

await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: { deepseek: { apiKey: 'your-key' } },
});

// Use skill
const result = await engine.sendMessage({
  message: 'Use ts-refactoring skill to refactor this function',
  write: true,
});

console.log(result.data.text);

await engine.shutdown();
```

---

## Advanced Features

### Dynamic Skill Loading

```typescript
const skillManager = new SkillManager({ context });

// Load from multiple sources
await Promise.all([
  skillManager.addSkill('github:user/repo1'),
  skillManager.addSkill('gitlab:user/repo2'),
  skillManager.addSkill('/local/path/skill3'),
]);
```

### Skill Error Handling

```typescript
const result = await skillManager.addSkill('github:user/repo');

if (result.errors?.length) {
  console.error('Installation failed:', result.errors);
}

if (result.installed?.length) {
  console.log('Installed:', result.installed);
}

if (result.skipped?.length) {
  console.log('Skipped:', result.skipped);
  // Example output: [{ name: 'my-skill', reason: 'already exists' }]
}
```

### Installation Return Value

```typescript
interface AddSkillResult {
  installed: SkillMetadata[];              // Successfully installed skills
  skipped: { name: string; reason: string }[];  // Skipped skills (already exist)
  errors: SkillError[];                    // Installation errors
}

interface SkillError {
  path: string;
  message: string;
}
```

---

## Best Practices

1. **Naming conventions** - Use kebab-case (e.g., `code-reviewer`)
2. **Clear descriptions** - Explain the skill's purpose and use cases
3. **Structured content** - Use sections and headings to organize
4. **Provide examples** - Include input/output examples
5. **Version control** - Use Git to manage skills

---

## More Documentation

- **[API Reference](./API.md)** - SkillManager API
- **[Configuration Guide](./CONFIG.md)** - Plugin configuration
- **[MCP Integration](./MCP.md)** - Another extension method
