# OriCore 使用指南

[English](USAGE.md) | [中文文档](USAGE.zh-CN.md)

## 目录

- [快速开始](#快速开始)
- [模型提供商](#模型提供商)
- [配置选项](#配置选项)
- [MCP 集成](#mcp-集成)
- [技能系统](#技能系统)
- [自定义模式](#自定义模式)
- [会话管理](#会话管理)
- [流式响应](#流式响应)
- [错误处理](#错误处理)

---

## 快速开始

```typescript
import { createEngine } from 'oricore';

// 1. 创建引擎
const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

// 2. 初始化模型和 API Key
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});

// 3. 使用
const result = await engine.sendMessage({
  message: '帮我创建一个 TypeScript 函数',
  write: true,
});

console.log(result.data.text);

// 4. 清理
await engine.shutdown();
```

---

## 模型提供商

### 支持的提供商

| 提供商 | 模型格式 | API 地址 |
|----------|--------------|--------------|
| **智谱 AI** | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |
| **DeepSeek** | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| **OpenAI** | `openai/gpt-4o` | `https://api.openai.com/v1` |
| **Anthropic** | `anthropic/claude-sonnet-4` | `https://api.anthropic.com` |
| **Google** | `google/gemini-2.5-flash` | `https://generativelanguage.googleapis.com` |
| **Moonshot (Kimi)** | `moonshotai/kimi-k2` | `https://api.moonshot.cn/v1` |
| **Qwen (通义千问)** | `qwen/qwen3-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

### 配置示例

**智谱 AI (Zhipu)**
```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: 'your-zhipu-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

**DeepSeek**
```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      apiKey: 'your-deepseek-api-key',
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

**OpenAI**
```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: 'your-openai-api-key',
      baseURL: 'https://api.openai.com/v1',
    },
  },
});
```

**Anthropic (Claude)**
```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      apiKey: 'your-anthropic-api-key',
      baseURL: 'https://api.anthropic.com',
    },
  },
});
```

**Google (Gemini)**
```typescript
await engine.initialize({
  model: 'google/gemini-2.5-flash',
  provider: {
    google: {
      apiKey: 'your-google-api-key',
      baseURL: 'https://generativelanguage.googleapis.com',
    },
  },
});
```

---

## 配置选项

### 完整配置

```typescript
await engine.initialize({
  // 模型选择
  model: 'zhipuai/glm-4.7',
  planModel: 'zhipuai/glm-4.7',

  // 行为设置
  approvalMode: 'autoEdit',  // 'default' | 'autoEdit' | 'yolo'
  language: 'zh-CN',

  // 自定义提示词
  systemPrompt: '你是一个有用的编程助手。',
  appendSystemPrompt: '始终提供类型注解。',

  // 工具开关
  tools: {
    read: true,
    write: true,
    edit: true,
    bash: true,
    grep: true,
    glob: true,
  },

  // 提供商配置
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

### 工具批准模式

- `default` - 每次工具执行前都询问批准
- `autoEdit` - 自动批准读/编辑工具，其他工具询问
- `yolo` - 自动批准所有工具

---

## MCP 集成

### Stdio 传输（本地服务器）

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: { zhipuai: { apiKey: 'your-key' } },
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: 'your-token' },
    },
  },
});
```

### HTTP 传输

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: { zhipuai: { apiKey: 'your-key' } },
  mcpServers: {
    remoteServer: {
      type: 'http',
      url: 'https://mcp-server.example.com/mcp',
      headers: {
        'Authorization': 'Bearer your-token',
      },
      timeout: 30000,
    },
  },
});
```

---

## 技能系统

### 创建技能

创建 `.oricore/skills/my-skill/SKILL.md`：

```markdown
---
name: code-reviewer
description: TypeScript 项目专家代码审查员
---

你是一个 TypeScript 专家代码审查员。重点关注：
- 类型安全
- 最佳实践
- 性能
- 安全性

提供具有具体示例的建设性反馈。
```

### 从 GitHub 安装技能

```typescript
import { SkillManager } from 'oricore';

const context = engine.getContext();
const skillManager = new SkillManager({ context });

await skillManager.addSkill('github:user/repo', {
  global: false,
  name: 'my-skill',
});
```

---

## 自定义模式

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript 专家',
  description: '专注于 TypeScript 开发',
  config: {
    systemPrompt: '你是一个 TypeScript 专家。始终提供类型化示例。',
    write: true,
    askUserQuestion: true,
    maxTurns: 30,
  },
});

engine.setMode('typescript-expert');

const result = await engine.sendMessageWithMode('帮助设计一个类型安全的 API');
```

### 内置模式

- `default` - 通用编程助手
- `brainstorm` - 带问题的交互式设计
- `plan` - 创建实施计划
- `review` - 代码审查和分析
- `debug` - 故障排除和调试

---

## 会话管理

```typescript
// 创建新会话
const session = await engine.createSession();

// 从会话 ID 恢复
const session = await engine.createSession({
  resume: 'session-id-here',
});

// 恢复最新会话
const session = await engine.createSession({
  continue: true,
});
```

会话存储位置：
- 全局：`~/.oricore/sessions/`
- 项目：`.oricore/sessions/`

---

## 流式响应

```typescript
const result = await engine.sendMessage({
  message: '解释 React Hooks',
  write: false,
  onTextDelta: async (text) => {
    process.stdout.write(text);  // 流式输出
  },
  onToolUse: async (toolUse) => {
    console.log('使用工具:', toolUse.name);
  },
});
```

---

## 错误处理

```typescript
const result = await engine.sendMessage({
  message: '创建一个文件',
  write: true,
});

if (result.success) {
  console.log('成功:', result.data.text);
  console.log('使用的 Token:', result.data.usage);
} else {
  console.error('错误:', result.error.message);
}
```

---

## 支持

更多信息或报告问题，请访问 [GitHub Issues](https://github.com/lyw405/oricore/issues)。
