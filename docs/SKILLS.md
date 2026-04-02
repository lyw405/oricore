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
- [Advanced Features](#advanced-features)
  - [Fork Execution Mode](#fork-execution-mode)
  - [Tool Whitelist](#tool-whitelist)
  - [Conditional Activation](#conditional-activation)
  - [Bundled Skills](#bundled-skills)
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

---

## Skill Structure

### Frontmatter Metadata

```yaml
---
name: my-skill                    # Skill name (required)
description: Skill description    # Description (required)

# Advanced options:
allowedTools: Read, Grep, Bash    # Comma-separated tool whitelist (optional)
context: fork                     # Execution mode: 'inline' or 'fork' (optional)
agent: code-reviewer              # Agent type for fork mode (optional)
paths: "src/**/*.ts,*.test.js"    # Conditional activation patterns (optional)
userInvocable: true               # Allow user slash commands (default: true)
modelInvocable: true              # Allow model invocation (default: true)
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

---

## Advanced Features

### Fork Execution Mode

Skills can run in isolated sub-agents for complex tasks:

```markdown
---
name: complex-analysis
description: Perform complex code analysis
context: fork                    # Run in isolated sub-agent
agent: code-reviewer             # Use specific agent type
allowedTools: Read, Grep, Glob   # Limit available tools
---

Analyze the codebase structure and provide recommendations...
```

**Benefits of fork execution:**
- Complete isolation from main conversation
- Tool permission restrictions via `allowedTools`
- Specialized agent types for specific tasks
- Cleaner separation of concerns

### Tool Whitelist

Control which tools a skill can access:

```markdown
---
name: safe-reviewer
description: Code reviewer with limited tool access
allowedTools: Read, Grep         # Only read and search tools
---

You can only read files and search content. You cannot modify files or execute commands.
```

When `allowedTools` is specified:
- Only listed tools are available during skill execution
- Provides capability-based security
- Works in both `inline` and `fork` execution modes

### Conditional Activation

Skills can be automatically activated based on file paths:

```markdown
---
name: typescript-expert
description: TypeScript specialist
description: TypeScript specialist
paths: "src/**/*.ts,*.tsx"       # Activate when working with TypeScript files
---

You are a TypeScript expert. Provide type-safe solutions...
```

Activate skills programmatically:

```typescript
// When user opens/modifies files
const activated = skillManager.activateSkillsForPaths([
  'src/components/Button.tsx',
  'src/utils/helpers.ts'
]);
console.log('Activated skills:', activated);

// Get only active skills
const activeSkills = skillManager.getSkills({ activeOnly: true });

// Check if a skill is active
if (skillManager.isSkillActive('typescript-expert')) {
  // Skill is available for use
}
```

### Bundled Skills

Create TypeScript-encoded skills for dynamic behavior:

```typescript
import { registerBundledSkill, createBundledSkill } from 'oricore';

// Register a simple bundled skill
registerBundledSkill({
  name: 'dynamic-helper',
  description: 'A skill with dynamic content',
  prompt: async (args, context) => {
    const cwd = context.cwd;
    const files = await context.apply({
      hook: 'glob',
      args: [`${cwd}/src/**/*.ts`],
      memo: [],
      type: PluginHookType.SeriesMerge,
    });
    return `You are helping with ${files.length} TypeScript files...`;
  },
  allowedTools: ['Read', 'Grep'],
  context: 'fork',
});

// Or create and register separately
const mySkill = createBundledSkill({
  name: 'my-skill',
  description: 'My custom skill',
  prompt: 'You are a helpful assistant...',
  aliases: ['ms', 'my'],           // Alternative names
  whenToUse: 'Use this when...',   // Guidance for the model
  userInvocable: true,
  modelInvocable: true,
});
```

**Bundled Skill Features:**
- Dynamic prompt generation via `getPrompt` function
- Conditional enablement via `isEnabled`
- Aliases for alternative invocation names
- Embedded reference files
- Full TypeScript type safety

---

## Skill Sources

### SkillSource

```typescript
enum SkillSource {
  Builtin = 'builtin',           // Built-in bundled skills
  Plugin = 'plugin',             // Skills provided by plugins
  GlobalClaude = 'global-claude',     // Claude global directory (~/.claude/skills/)
  Global = 'global',             // OriCore global directory (~/.oricore/skills/)
  ProjectClaude = 'project-claude',   // Claude project directory (.claude/skills/)
  Project = 'project',           // OriCore project directory (.oricore/skills/)
}
```

### Loading Priority

Skills are loaded in the following order (later sources override earlier ones with the same name):

1. **Builtin** - Built-in bundled skills
2. **Plugin** - Plugin-provided skills
3. **GlobalClaude** - Claude global skills (`~/.claude/skills/`)
4. **Global** - OriCore global skills (`~/.oricore/skills/`)
5. **ProjectClaude** - Claude project skills (`.claude/skills/`)
6. **Project** - OriCore project skills (`.oricore/skills/`)

---

## Complete Example

### Method 1: File-Based Skills (Recommended)

**Important**: Skill files must exist **before** engine initialization to be auto-loaded.

#### Step 1: Create the Skill File

Create `.oricore/skills/security-audit/SKILL.md` **before running the code**:

```markdown
---
name: security-audit
description: Security audit specialist for Node.js projects
context: fork
agent: security-expert
allowedTools: Read, Grep, Glob
userInvocable: true
modelInvocable: true
paths: "package.json,package-lock.json"
---

You are a security audit specialist. Focus on:

## Audit Checklist

1. **Dependency vulnerabilities**
   - Check for known vulnerable packages
   - Review outdated dependencies

2. **Code security patterns**
   - SQL injection risks
   - XSS vulnerabilities
   - Unsafe eval usage

3. **Configuration issues**
   - Exposed secrets
   - Weak security headers
   - Missing CSRF protection

## Output Format

Provide findings as:
- Severity level (Critical/High/Medium/Low)
- Specific location
- Recommended fix with code example
```

#### Step 2: Initialize Engine and Use the Skill

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'SecureCode',
  version: '1.0.0',
});

// Skills are auto-loaded during initialization
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      options: {
        apiKey: 'your-key',
      },
    },
  },
});

// Verify the skill is loaded
const skillManager = engine.getContext().skillManager;
const skills = skillManager.getSkills();
console.log('Loaded skills:', skills.map(s => s.name));
// Output should include: ['security-audit', ...]

// Activate skills based on current files (for conditional activation)
skillManager.activateSkillsForPaths(['package.json', 'src/app.ts']);

// Use skill - will run in fork mode with restricted tools
const result = await engine.sendMessage({
  message: 'Run security-audit on this project',
  write: true,
});

console.log(result.data.text);

await engine.shutdown();
```

### Method 2: Dynamic Skill Installation

Use this when you need to add skills programmatically at runtime:

```typescript
import { createEngine } from 'oricore';
import * as fs from 'fs';
import * as path from 'path';

const engine = createEngine({
  productName: 'SecureCode',
  version: '1.0.0',
});

await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      options: {
        apiKey: 'your-key',
      },
    },
  },
});

// Option A: Install from a local directory
const skillManager = engine.getContext().skillManager;

// First, create the skill file
const skillDir = path.join(process.cwd(), '.oricore', 'skills', 'my-skill');
fs.mkdirSync(skillDir, { recursive: true });
fs.writeFileSync(
  path.join(skillDir, 'SKILL.md'),
  `---
name: my-skill
description: My custom skill
---

You are a helpful assistant specialized in...
`
);

// Then install it
await skillManager.addSkill(skillDir, { global: false });

// Verify installation
const skill = skillManager.getSkill('my-skill');
if (skill) {
  console.log('Skill installed:', skill.name);
}

// Option B: Install from GitHub
await skillManager.addSkill('github:username/repo', {
  global: false,
  name: 'github-skill',
});

await engine.shutdown();
```

### Method 3: Bundled Skills (Programmatic)

For skills that need dynamic behavior:

```typescript
import { createEngine, registerBundledSkill } from 'oricore';

// Register bundled skill BEFORE initializing engine
registerBundledSkill({
  name: 'dynamic-analyzer',
  description: 'Analyzes project structure dynamically',
  prompt: async (args, context) => {
    const files = await context.apply({
      hook: 'glob',
      args: [`${context.cwd}/src/**/*.ts`],
      memo: [],
      type: PluginHookType.SeriesMerge,
    });
    return `You are analyzing a project with ${files.length} TypeScript files. Args: ${args}`;
  },
  allowedTools: ['Read', 'Grep', 'Glob'],
  context: 'fork',
  userInvocable: true,
  modelInvocable: true,
});

const engine = createEngine({...});
await engine.initialize({...});

// The bundled skill is automatically available
const result = await engine.sendMessage({
  message: 'Use dynamic-analyzer to check the codebase',
});
```

---

## Best Practices

1. **Naming conventions** - Use kebab-case (e.g., `code-reviewer`)
2. **Clear descriptions** - Explain the skill's purpose and use cases
3. **Structured content** - Use sections and headings to organize
4. **Provide examples** - Include input/output examples
5. **Version control** - Use Git to manage skills
6. **Security** - Use `allowedTools` to limit capabilities
7. **Fork for complexity** - Use `context: fork` for complex, isolated tasks
8. **Conditional activation** - Use `paths` for context-aware skills

---

## More Documentation

- **[API Reference](./API.md)** - SkillManager API
- **[Configuration Guide](./CONFIG.md)** - Plugin configuration
- **[MCP Integration](./MCP.md)** - Another extension method
