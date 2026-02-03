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

### 示例：创建测试专家 Skill

创建 `.oricore/skills/testing-expert/SKILL.md`：

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

## Skill 结构

### Frontmatter 元数据

```yaml
---
name: my-skill              # Skill 名称（必填）
description: Skill description  # 描述（必填）
version: 1.0.0             # 版本（可选）
author: Your Name          # 作者（可选）
tags: [testing, typescript]  # 标签（可选）
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

### 从 GitLab 安装

```typescript
await skillManager.addSkill('gitlab:username/repo', {
  global: false,
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

### 预览再安装

```typescript
// 预览 Skill
const preview = await skillManager.previewSkills('github:username/repo');
console.log('发现的 Skills:', preview.skills);

// 选择性安装
await skillManager.installFromPreview(
  preview,
  [
    preview.skills[0],  // 只安装第一个
  ],
  'github:username/repo',
  {
    global: false,     // 可选：安装选项
    overwrite: false,
  }
);

// 清理预览临时文件
skillManager.cleanupPreview(preview);
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

### 其他实用方法

```typescript
// 获取单个 Skill
const skill = skillManager.getSkill('testing-expert');
if (skill) {
  console.log(`Skill: ${skill.name}`);
  console.log(`描述: ${skill.description}`);
  console.log(`来源: ${skill.source}`);
  console.log(`路径: ${skill.path}`);
}

// 获取加载错误
const errors = skillManager.getErrors();
errors.forEach(error => {
  console.error(`[${error.path}] ${error.message}`);
});

// 读取 Skill 内容（不包含 frontmatter）
const body = await skillManager.readSkillBody(skill);
console.log(body);

// 移除 Skill（指定目录）
await skillManager.removeSkill('testing-expert', '/custom/path');
```

---

## Skill 源

### SkillSource

```typescript
enum SkillSource {
  Plugin = 'plugin',           // 插件提供的 Skill
  GlobalClaude = 'global-claude',   // Claude 全局目录 (~/.claude/skills/)
  Global = 'global',           // OriCore 全局目录 (~/.oricore/skills/)
  ProjectClaude = 'project-claude', // Claude 项目目录 (.claude/skills/)
  Project = 'project',         // OriCore 项目目录 (.oricore/skills/)
}
```

### 加载优先级

Skill 按以下顺序加载（后面的会覆盖前面的同名 Skill）：

1. **Plugin** - 插件提供的 Skill
2. **GlobalClaude** - Claude 全局 Skill (`~/.claude/skills/`)
3. **Global** - OriCore 全局 Skill (`~/.oricore/skills/`)
4. **ProjectClaude** - Claude 项目 Skill (`.claude/skills/`)
5. **Project** - OriCore 项目 Skill (`.oricore/skills/`)

---

## 完整示例

### 1. 创建 Skill

创建 `.oricore/skills/ts-refactoring/SKILL.md`：

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

### 2. 使用 Skill

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'RefactorTool',
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

// 使用 Skill
const result = await engine.sendMessage({
  message: '使用 ts-refactoring 技能重构这个函数',
  write: true,
});

console.log(result.data.text);

await engine.shutdown();
```

---

## 高级功能

### 动态加载 Skill

```typescript
const skillManager = new SkillManager({ context });

// 从多个来源加载
await Promise.all([
  skillManager.addSkill('github:user/repo1'),
  skillManager.addSkill('gitlab:user/repo2'),
  skillManager.addSkill('/local/path/skill3'),
]);
```

### Skill 错误处理

```typescript
const result = await skillManager.addSkill('github:user/repo');

if (result.errors?.length) {
  console.error('安装失败:', result.errors);
}

if (result.installed?.length) {
  console.log('已安装:', result.installed);
}

if (result.skipped?.length) {
  console.log('已跳过:', result.skipped);
  // 输出示例: [{ name: 'my-skill', reason: 'already exists' }]
}
```

### 安装返回值说明

```typescript
interface AddSkillResult {
  installed: SkillMetadata[];              // 成功安装的 Skills
  skipped: { name: string; reason: string }[];  // 跳过的 Skills（已存在）
  errors: SkillError[];                    // 安装失败的错误
}

interface SkillError {
  path: string;
  message: string;
}
```

---

## 最佳实践

1. **命名规范** - 使用 kebab-case（如 `code-reviewer`）
2. **清晰描述** - 说明 Skill 的用途和场景
3. **结构化内容** - 使用章节和标题组织
4. **提供示例** - 包含输入输出示例
5. **版本控制** - 使用 Git 管理 Skill

---

## 更多文档

- **[API 参考](./API.zh-CN.md)** - SkillManager API
- **[配置详解](./CONFIG.zh-CN.md)** - 插件配置
- **[MCP 集成](./MCP.zh-CN.md)** - 另一种扩展方式
