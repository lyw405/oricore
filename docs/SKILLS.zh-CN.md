# Skill 系统

OriCore 的自定义技能系统文档。

[English](SKILLS.md) | [中文文档](SKILLS.zh-CN.md)

---

## 目录

- [Skill 概览](#skill-概览)
- [创建 Skill](#创建-skill)
- [Skill 结构](#skill-结构)
- [安装 Skill](#安装-skill)
- [使用 Skill](#使用-skill)
- [高级功能](#高级功能)
  - [Fork 执行模式](#fork-执行模式)
  - [工具白名单](#工具白名单)
  - [条件激活](#条件激活)
  - [Bundled Skills](#bundled-skills)
- [Skill 源](#skill-源)

---

## Skill 概览

Skill 是 OriCore 的自定义能力扩展系统，允许你创建可复用的 AI 行为模式。

### Skill vs MCP

| 特性 | Skill | MCP |
|------|-------|-----|
| 用途 | 自定义 AI 行为 | 外部工具和数据 |
| 部署 | 本地文件或 Git 仓库 | 独立服务器 |
| 复杂度 | 简单 | 中等 |
| 适用场景 | 提示词模板、角色设定 | API 集成、数据库 |

---

## 创建 Skill

### Skill 文件结构

Skill 是一个包含 frontmatter 的 Markdown 文件：

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

### 创建位置

Skill 可以放在以下位置：

| 位置 | 路径 | SkillSource |
|------|------|-------------|
| Claude 项目 Skill | `.claude/skills/*/SKILL.md` | `ProjectClaude` |
| OriCore 项目 Skill | `.oricore/skills/*/SKILL.md` | `Project` |
| Claude 全局 Skill | `~/.claude/skills/*/SKILL.md` | `GlobalClaude` |
| OriCore 全局 Skill | `~/.oricore/skills/*/SKILL.md` | `Global` |

---

## Skill 结构

### Frontmatter 元数据

```yaml
---
name: my-skill                    # Skill 名称（必填）
description: Skill description    # 描述（必填）

# 高级选项：
allowedTools: Read, Grep, Bash    # 工具白名单，逗号分隔（可选）
context: fork                     # 执行模式：'inline' 或 'fork'（可选）
agent: code-reviewer              # Fork 模式下使用的 Agent 类型（可选）
paths: "src/**/*.ts,*.test.js"    # 条件激活模式（可选）
userInvocable: true               # 允许用户斜杠命令调用（默认：true）
modelInvocable: true              # 允许模型调用（默认：true）
---
```

### Skill 内容

内容部分是系统提示词，支持：

- Markdown 格式
- 代码块
- 章节（用 ## 标题）
- 指导原则
- 输出格式

---

## 安装 Skill

### 从本地安装

```typescript
import { SkillManager } from 'oricore';

const context = engine.getContext();
const skillManager = new SkillManager({ context });

await skillManager.addSkill('/path/to/skill', {
  global: false,  // 项目级别
});
```

### 从 GitHub 安装

```typescript
await skillManager.addSkill('github:username/repo', {
  global: false,
  name: 'my-skill',  // 指定 Skill 名称
});
```

### 安装选项说明

```typescript
interface AddSkillOptions {
  global?: boolean;     // true=全局安装 (~/.oricore/skills/), false=项目安装 (.oricore/skills/)
  claude?: boolean;     // true=安装到 Claude 目录 (~/.claude/skills/ 或 .claude/skills/)
  overwrite?: boolean;  // true=覆盖已存在的 Skill, false=跳过
  name?: string;        // 自定义 Skill 文件夹名称
  targetDir?: string;   // 自定义安装目标目录（覆盖 global/claude 设置）
}
```

---

## 使用 Skill

### 在对话中使用

```typescript
// 方法 1：直接指定 Skill
await engine.sendMessage({
  message: '使用 testing-expert 技能为这个函数写测试',
  write: true,
});

// 方法 2：使用 skill 工具
await engine.sendMessage({
  message: '调用 code-reviewer 技能审查这段代码',
  write: false,
});
```

### 列出已安装的 Skills

```typescript
const skillManager = new SkillManager({ context });
const skills = skillManager.getSkills();

skills.forEach(skill => {
  console.log(`${skill.name}: ${skill.description}`);
  console.log(`  来源: ${skill.source}`);
  console.log(`  路径: ${skill.path}`);
});
```

### 卸载 Skill

```typescript
await skillManager.removeSkill('testing-expert');
```

---

## 高级功能

### Fork 执行模式

Skill 可以在隔离的子 Agent 中运行，用于复杂任务：

```markdown
---
name: complex-analysis
description: Perform complex code analysis
context: fork                    # 在隔离的子 Agent 中运行
agent: code-reviewer             # 使用特定的 Agent 类型
allowedTools: Read, Grep, Glob   # 限制可用工具
---

Analyze the codebase structure and provide recommendations...
```

**Fork 执行的优势：**
- 与主对话完全隔离
- 通过 `allowedTools` 限制工具权限
- 针对特定任务使用专门的 Agent 类型
- 更清晰的职责分离

### 工具白名单

控制 Skill 可以访问哪些工具：

```markdown
---
name: safe-reviewer
description: Code reviewer with limited tool access
allowedTools: Read, Grep         # 只允许读取和搜索工具
---

You can only read files and search content. You cannot modify files or execute commands.
```

当指定了 `allowedTools` 时：
- Skill 执行期间只有列出的工具可用
- 提供基于能力的权限控制
- 在 `inline` 和 `fork` 执行模式下都有效

### 条件激活

Skill 可以根据文件路径自动激活：

```markdown
---
name: typescript-expert
description: TypeScript specialist
paths: "src/**/*.ts,*.tsx"       # 处理 TypeScript 文件时激活
---

You are a TypeScript expert. Provide type-safe solutions...
```

以编程方式激活 Skill：

```typescript
// 当用户打开/修改文件时
const activated = skillManager.activateSkillsForPaths([
  'src/components/Button.tsx',
  'src/utils/helpers.ts'
]);
console.log('Activated skills:', activated);

// 只获取已激活的 Skills
const activeSkills = skillManager.getSkills({ activeOnly: true });

// 检查 Skill 是否已激活
if (skillManager.isSkillActive('typescript-expert')) {
  // Skill 可用
}
```

### Bundled Skills

创建 TypeScript 编码的 Skill，实现动态行为：

```typescript
import { registerBundledSkill, createBundledSkill } from 'oricore';

// 注册简单的 bundled skill
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

// 或者分开创建和注册
const mySkill = createBundledSkill({
  name: 'my-skill',
  description: 'My custom skill',
  prompt: 'You are a helpful assistant...',
  aliases: ['ms', 'my'],           // 替代名称
  whenToUse: 'Use this when...',   // 给模型的使用指导
  userInvocable: true,
  modelInvocable: true,
});
```

**Bundled Skill 特性：**
- 通过 `getPrompt` 函数动态生成提示词
- 通过 `isEnabled` 条件启用
- 别名用于替代调用名称
- 嵌入参考文件
- 完整的 TypeScript 类型安全

---

## Skill 源

### SkillSource

```typescript
enum SkillSource {
  Builtin = 'builtin',           // 内置 bundled skills
  Plugin = 'plugin',             // 插件提供的 Skill
  GlobalClaude = 'global-claude',     // Claude 全局目录 (~/.claude/skills/)
  Global = 'global',             // OriCore 全局目录 (~/.oricore/skills/)
  ProjectClaude = 'project-claude',   // Claude 项目目录 (.claude/skills/)
  Project = 'project',           // OriCore 项目目录 (.oricore/skills/)
}
```

### 加载优先级

Skill 按以下顺序加载（后面的会覆盖前面的同名 Skill）：

1. **Builtin** - 内置 bundled skills
2. **Plugin** - 插件提供的 Skill
3. **GlobalClaude** - Claude 全局 Skill (`~/.claude/skills/`)
4. **Global** - OriCore 全局 Skill (`~/.oricore/skills/`)
5. **ProjectClaude** - Claude 项目 Skill (`.claude/skills/`)
6. **Project** - OriCore 项目 Skill (`.oricore/skills/`)

---

## 完整示例

### 方式一：基于文件的 Skill（推荐）

**重要**：Skill 文件必须在引擎初始化**之前**就存在，才能被自动加载。

#### 步骤 1：创建 Skill 文件

在运行代码**之前**，先创建 `.oricore/skills/security-audit/SKILL.md`：

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

#### 步骤 2：初始化引擎并使用 Skill

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'SecureCode',
  version: '1.0.0',
});

// Skills 在初始化期间自动加载
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

// 验证 skill 是否已加载
const skillManager = engine.getContext().skillManager;
const skills = skillManager.getSkills();
console.log('已加载的 skills:', skills.map(s => s.name));
// 输出应该包含: ['security-audit', ...]

// 根据当前文件激活 Skills（用于条件激活）
skillManager.activateSkillsForPaths(['package.json', 'src/app.ts']);

// 使用 Skill - 将在 Fork 模式下运行，工具受限
const result = await engine.sendMessage({
  message: 'Run security-audit on this project',
  write: true,
});

console.log(result.data.text);

await engine.shutdown();
```

### 方式二：动态安装 Skill

当你需要在运行时以编程方式添加 skills 时使用：

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

// 选项 A：从本地目录安装
const skillManager = engine.getContext().skillManager;

// 首先，创建 skill 文件
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

// 然后安装它
await skillManager.addSkill(skillDir, { global: false });

// 验证安装
const skill = skillManager.getSkill('my-skill');
if (skill) {
  console.log('Skill 已安装:', skill.name);
}

// 选项 B：从 GitHub 安装
await skillManager.addSkill('github:username/repo', {
  global: false,
  name: 'github-skill',
});

await engine.shutdown();
```

### 方式三：Bundled Skills（程序化）

适用于需要动态行为的 skills：

```typescript
import { createEngine, registerBundledSkill } from 'oricore';

// 在初始化引擎**之前**注册 bundled skill
registerBundledSkill({
  name: 'dynamic-analyzer',
  description: '动态分析项目结构',
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

// Bundled skill 自动可用
const result = await engine.sendMessage({
  message: 'Use dynamic-analyzer to check the codebase',
});
```

---

## 最佳实践

1. **命名规范** - 使用 kebab-case（如 `code-reviewer`）
2. **清晰描述** - 说明 Skill 的用途和场景
3. **结构化内容** - 使用章节和标题组织
4. **提供示例** - 包含输入输出示例
5. **版本控制** - 使用 Git 管理 Skill
6. **安全性** - 使用 `allowedTools` 限制能力
7. **复杂任务用 Fork** - 复杂、隔离的任务使用 `context: fork`
8. **条件激活** - 使用 `paths` 实现上下文感知的 Skills

---

## 更多文档

- **[API 参考](./API.zh-CN.md)** - SkillManager API
- **[配置详解](./CONFIG.zh-CN.md)** - 插件配置
- **[MCP 集成](./MCP.zh-CN.md)** - 另一种扩展方式
