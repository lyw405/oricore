# Configuration Reference

Complete configuration options documentation for OriCore.

[English](CONFIG.md) | [中文文档](CONFIG.zh-CN.md)

---

## Table of Contents

- [Initialization Configuration](#initialization-configuration)
- [AI Provider Configuration](#ai-provider-configuration)
- [Tools Configuration](#tools-configuration)
- [Approval Mode](#approval-mode)
- [MCP Server Configuration](#mcp-server-configuration)
- [Plugin Configuration](#plugin-configuration)

---

## Initialization Configuration

### EngineConfig

Complete configuration options when initializing the engine.

```typescript
interface EngineConfig {
  // Model selection
  model?: string;               // Main model
  planModel?: string;           // Planning model

  // Behavior
  approvalMode?: ApprovalMode;  // Approval mode
  language?: string;            // Language

  // Prompts
  systemPrompt?: string;        // System prompt
  appendSystemPrompt?: string;  // Append prompt

  // Tools
  tools?: Record<string, boolean>;

  // Extensions
  mcpServers?: Record<string, McpServerConfig>;
  plugins?: (string | any)[];

  // AI providers
  provider?: Record<string, ProviderConfig>;
}
```

### Complete Configuration Example

```typescript
await engine.initialize({
  // Models
  model: 'deepseek/deepseek-chat',
  planModel: 'anthropic/claude-sonnet-4',

  // Behavior
  approvalMode: 'autoEdit',
  language: 'en',

  // Prompts
  systemPrompt: 'You are a helpful coding assistant.',
  appendSystemPrompt: 'Always provide type annotations.',

  // Tool toggles
  tools: {
    read: true,
    write: true,
    edit: true,
    bash: true,
    grep: true,
    glob: true,
    fetch: true,
    task: true,
    todo: true,
    askUserQuestion: true,
  },

  // MCP servers
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
  },

  // AI providers
  provider: {
    deepseek: {
      options: {
        apiKey: 'your-api-key',
        baseURL: 'https://api.deepseek.com',
      },
    },
  },
});
```

---

## AI Provider Configuration

### Supported AI Providers

OriCore supports 40+ AI providers, here are the most commonly used:

| Provider | Model Format | API Base URL |
|----------|-------------|--------------|
| DeepSeek | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| OpenAI | `openai/gpt-4o` | `https://api.openai.com/v1` |
| Anthropic | `anthropic/claude-sonnet-4` | `https://api.anthropic.com` |
| Google | `google/gemini-2.5-flash` | `https://generativelanguage.googleapis.com` |
| Zhipu AI | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |
| Moonshot AI | `moonshotai/kimi-k2` | `https://api.moonshot.ai/v1` |
| Alibaba Cloud | `qwen/qwen3-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Baichuan | `baichuan/baichuan-4` | `https://api.baichuan-ai.com/v1` |
| Baidu | `ernie/ernie-bot-4` | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat` |
| Minimax | `minimax/minimax-6b` | `https://api.minimax.chat/v1` |
| 01AI | `01ai/yi-large` | `https://api.lingyiwanwu.com/v1` |

### ProviderConfig

Provider configuration interface.

```typescript
interface ProviderConfig {
  options?: {
    apiKey?: string;              // API key
    baseURL?: string;            // API base URL
    headers?: Record<string, string>;
    httpProxy?: string;
  };
}
```

### DeepSeek Configuration

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      options: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      },
    },
  },
});
```

**Available models:**
- `deepseek/deepseek-chat`
- `deepseek/deepseek-coder`

### OpenAI Configuration

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      options: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      },
    },
  },
});
```

**Available models:**
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`

### Anthropic Configuration

```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com',
      },
    },
  },
});
```

**Available models:**
- `anthropic/claude-sonnet-4`
- `anthropic/claude-opus-4-5`
- `anthropic/claude-haiku-4`

### Google Configuration

```typescript
await engine.initialize({
  model: 'google/gemini-2.5-flash',
  provider: {
    google: {
      options: {
        apiKey: process.env.GOOGLE_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com',
      },
    },
  },
});
```

**Available models:**
- `google/gemini-2.5-flash`
- `google/gemini-2.5-pro`
- `google/gemini-1.5-pro`

### Zhipu AI Configuration

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      options: {
        apiKey: process.env.ZHIPUAI_API_KEY,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      },
    },
  },
});
```

**Available models:**
- `zhipuai/glm-4.7`
- `zhipuai/glm-4-plus`
- `zhipuai/glm-4-flash`
- `zhipuai/glm-4-air`

### Multi-Provider Configuration

You can configure multiple providers simultaneously:

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',      // Default model
  planModel: 'anthropic/claude-sonnet-4',  // Planning model

  provider: {
    deepseek: {
      options: {
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    },
    anthropic: {
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
    },
  },
});
```

---

## Tools Configuration

### Tool Toggles

Control which tools are available:

```typescript
await engine.initialize({
  tools: {
    read: true,           // Read files
    write: true,          // Write files
    edit: true,           // Edit files
    bash: true,           // Execute commands
    grep: true,           // Search content
    glob: true,           // Search files
    ls: true,             // List directories
    fetch: true,          // Network requests
    task: true,           // Launch Agent
    todo: true,           // Task management
    askUserQuestion: true, // Ask user
    skill: true,          // Execute skills
  },
});
```

### Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| `read` | read, grep, glob, ls | Read-only operations |
| `write` | write, edit | File modification |
| `command` | bash, kill_bash | Command execution |
| `network` | fetch | Network requests |
| `ask` | askUserQuestion | User interaction |
| `task` | task, todo, skill | Task & skill management |

---

## Approval Mode

### ApprovalMode

Controls approval behavior before tool execution.

```typescript
type ApprovalMode = 'default' | 'autoEdit' | 'yolo';
```

### Mode Comparison

| Mode | read | write | command | network | ask |
|------|------|-------|---------|---------|-----|
| `default` | ✅ Auto | ❌ Confirm | ❌ Confirm | ❌ Confirm | ❌ Always ask |
| `autoEdit` | ✅ Auto | ✅ Auto | ❌ Confirm | ❌ Confirm | ❌ Always ask |
| `yolo` | ✅ Auto | ✅ Auto | ✅ Auto* | ✅ Auto | ❌ Always ask |

*High-risk commands still require confirmation

### Usage Examples

```typescript
// Default mode - Safe
await engine.initialize({
  approvalMode: 'default',
});

// Development mode - Good for code refactoring
await engine.initialize({
  approvalMode: 'autoEdit',
});

// Auto mode - For trusted environments
await engine.initialize({
  approvalMode: 'yolo',
});
```

**Details:** [Approval System Documentation](./APPROVAL.md)

---

## MCP Server Configuration

### MCP Server Types

OriCore supports three MCP transport methods:

1. **Stdio** - Local command-line server
2. **SSE** - Server-Sent Events
3. **HTTP** - HTTP requests

### Stdio Configuration

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
    github: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    },
  },
});
```

### HTTP Configuration

```typescript
await engine.initialize({
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

### SSE Configuration

```typescript
await engine.initialize({
  mcpServers: {
    sseServer: {
      type: 'sse',
      url: 'https://mcp-server.example.com/sse',
      headers: {
        'Authorization': 'Bearer your-token',
      },
    },
  },
});
```

**Details:** [MCP Integration Documentation](./MCP.md)

---

## Plugin Configuration

### Plugin List

```typescript
await engine.initialize({
  plugins: [
    'plugin-name',           // String form
    {                        // Object form
      name: 'custom-plugin',
      options: { /* ... */ },
    },
  ],
});
```

### Plugin Types

Plugins can extend:
- Tools
- Skills
- Hooks

---

## Language Configuration

### Supported Languages

```typescript
await engine.initialize({
  language: 'en',     // English
  // or
  language: 'zh-CN',  // Chinese
});
```

**Supported languages:**
- `en` - English
- `zh-CN` - Simplified Chinese
- `ja` - Japanese
- `ko` - Korean
- `es` - Spanish
- `fr` - French
- `de` - German

---

## System Prompt Configuration

### Base Prompt

```typescript
await engine.initialize({
  systemPrompt: 'You are a helpful coding assistant.',
});
```

### Append Prompt

```typescript
await engine.initialize({
  systemPrompt: 'You are a coding assistant.',
  appendSystemPrompt: 'Always provide type annotations and error handling.',
});
```

### Mode Prompts

Different modes have specialized prompts, switch via `setMode()`:

```typescript
engine.setMode('review');  // Use review mode prompt
```

---

## More Documentation

- **[API Reference](./API.md)** - Complete API documentation
- **[Tools System](./TOOLS.md)** - Built-in tools details
- **[Approval System](./APPROVAL.md)** - Approval mode details
- **[MCP Integration](./MCP.md)** - MCP server configuration
