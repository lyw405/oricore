# OriCore Usage Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Model Providers](#model-providers)
- [Configuration Options](#configuration-options)
- [MCP Integration](#mcp-integration)
- [Skill System](#skill-system)
- [Custom Modes](#custom-modes)
- [Session Management](#session-management)
- [Streaming Responses](#streaming-responses)
- [Error Handling](#error-handling)

---

## Quick Start

```typescript
import { createEngine } from 'oricore';

// 1. Create the engine
const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

// 2. Initialize with model and API key
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});

// 3. Use it
const result = await engine.sendMessage({
  message: '帮我创建一个 TypeScript 函数',
  write: true,
});

console.log(result.data.text);

// 4. Cleanup
await engine.shutdown();
```

---

## Model Providers

### Supported Providers

| Provider | Model Format | API Base URL |
|----------|--------------|--------------|
| **Zhipu AI** | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |
| **DeepSeek** | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| **OpenAI** | `openai/gpt-4o` | `https://api.openai.com/v1` |
| **Anthropic** | `anthropic/claude-sonnet-4` | `https://api.anthropic.com` |
| **Google** | `google/gemini-2.5-flash` | `https://generativelanguage.googleapis.com` |
| **Moonshot (Kimi)** | `moonshotai/kimi-k2` | `https://api.moonshot.cn/v1` |
| **Qwen** | `qwen/qwen3-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

### Configuration Examples

**Zhipu AI (智谱)**
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

## Configuration Options

### Full Configuration

```typescript
await engine.initialize({
  // Model selection
  model: 'zhipuai/glm-4.7',
  planModel: 'zhipuai/glm-4.7',

  // Behavior
  approvalMode: 'autoEdit',  // 'default' | 'autoEdit' | 'yolo'
  language: 'zh-CN',

  // Custom prompts
  systemPrompt: 'You are a helpful coding assistant.',
  appendSystemPrompt: 'Always provide type annotations.',

  // Tools
  tools: {
    read: true,
    write: true,
    edit: true,
    bash: true,
    grep: true,
    glob: true,
  },

  // Provider
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

### Tool Approval Modes

- `default` - Ask for approval before each tool execution
- `autoEdit` - Auto-approve read/edit tools, ask for others
- `yolo` - Auto-approve all tools

---

## MCP Integration

### Stdio Transport (Local Servers)

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

### HTTP Transport

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

## Skill System

### Create a Skill

Create `.oricore/skills/my-skill/SKILL.md`:

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

### Install Skills from GitHub

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

## Custom Modes

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript Expert',
  description: 'Specialized in TypeScript development',
  config: {
    systemPrompt: 'You are a TypeScript expert. Always provide typed examples.',
    write: true,
    askUserQuestion: true,
    maxTurns: 30,
  },
});

engine.setMode('typescript-expert');

const result = await engine.sendMessageWithMode('Help design a type-safe API');
```

### Built-in Modes

- `default` - General purpose coding assistant
- `brainstorm` - Interactive design with questions
- `plan` - Creates implementation plans
- `review` - Code review and analysis
- `debug` - Troubleshooting and debugging

---

## Session Management

```typescript
// Create a new session
const session = await engine.createSession();

// Resume from session ID
const session = await engine.createSession({
  resume: 'session-id-here',
});

// Resume latest session
const session = await engine.createSession({
  continue: true,
});
```

Sessions are stored in:
- Global: `~/.oricore/sessions/`
- Project: `.oricore/sessions/`

---

## Streaming Responses

```typescript
const result = await engine.sendMessage({
  message: 'Explain React hooks',
  write: false,
  onTextDelta: async (text) => {
    process.stdout.write(text);  // Stream output
  },
  onToolUse: async (toolUse) => {
    console.log('Using tool:', toolUse.name);
  },
});
```

---

## Error Handling

```typescript
const result = await engine.sendMessage({
  message: 'Create a file',
  write: true,
});

if (result.success) {
  console.log('Success:', result.data.text);
  console.log('Tokens used:', result.data.usage);
} else {
  console.error('Error:', result.error.message);
}
```

---

## Support

For more information or to report issues, visit [GitHub Issues](https://github.com/lyw405/oricore/issues).
