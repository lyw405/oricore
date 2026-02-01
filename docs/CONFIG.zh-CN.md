# 配置参考

OriCore 完整的配置选项文档。

---

## 目录

- [初始化配置](#初始化配置)
- [AI 提供商配置](#ai-提供商配置)
- [工具配置](#工具配置)
- [审批模式](#审批模式)
- [MCP 服务器配置](#mcp-服务器配置)
- [插件配置](#插件配置)

---

## 初始化配置

### EngineConfig

初始化引擎时的完整配置选项。

```typescript
interface EngineConfig {
  // 模型选择
  model?: string;               // 主模型
  planModel?: string;           // 规划模型

  // 行为
  approvalMode?: ApprovalMode;  // 审批模式
  language?: string;            // 语言

  // 提示词
  systemPrompt?: string;        // 系统提示词
  appendSystemPrompt?: string;  // 追加提示词

  // 工具
  tools?: Record<string, boolean>;

  // 扩展
  mcpServers?: Record<string, McpServerConfig>;
  plugins?: (string | any)[];

  // AI 提供商
  provider?: Record<string, ProviderConfig>;
}
```

### 完整配置示例

```typescript
await engine.initialize({
  // 模型
  model: 'deepseek/deepseek-chat',
  planModel: 'anthropic/claude-sonnet-4',

  // 行为
  approvalMode: 'autoEdit',
  language: 'zh-CN',

  // 提示词
  systemPrompt: 'You are a helpful coding assistant.',
  appendSystemPrompt: 'Always provide type annotations.',

  // 工具开关
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

  // MCP 服务器
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
  },

  // AI 提供商
  provider: {
    deepseek: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

---

## AI 提供商配置

### 支持的 AI 厂商

OriCore 支持 40+ AI 提供商，以下是最常用的：

| 提供商 | Model 格式 | API Base URL |
|--------|-----------|--------------|
| DeepSeek | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| OpenAI | `openai/gpt-4o` | `https://api.openai.com/v1` |
| Anthropic | `anthropic/claude-sonnet-4` | `https://api.anthropic.com` |
| Google | `google/gemini-2.5-flash` | `https://generativelanguage.googleapis.com` |
| 智谱 AI | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |
| 月之暗面 | `moonshotai/kimi-k2` | `https://api.moonshot.ai/v1` |
| 阿里云 | `qwen/qwen3-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 百川 | `baichuan/baichuan-4` | `https://api.baichuan-ai.com/v1` |
| 百度 | `ernie/ernie-bot-4` | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat` |
| Minimax | `minimax/minimax-6b` | `https://api.minimax.chat/v1` |
| 零一万物 | `01ai/yi-large` | `https://api.lingyiwanwu.com/v1` |

### ProviderConfig

提供商配置接口。

```typescript
interface ProviderConfig {
  apiKey: string;              // API 密钥
  baseURL?: string;            // API 基础 URL
}
```

### DeepSeek 配置

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

**可用模型：**
- `deepseek/deepseek-chat`
- `deepseek/deepseek-coder`

### OpenAI 配置

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    },
  },
});
```

**可用模型：**
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo`

### Anthropic 配置

```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: 'https://api.anthropic.com',
    },
  },
});
```

**可用模型：**
- `anthropic/claude-sonnet-4`
- `anthropic/claude-opus-4-5`
- `anthropic/claude-haiku-4`

### Google 配置

```typescript
await engine.initialize({
  model: 'google/gemini-2.5-flash',
  provider: {
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com',
    },
  },
});
```

**可用模型：**
- `google/gemini-2.5-flash`
- `google/gemini-2.5-pro`
- `google/gemini-1.5-pro`

### 智谱 AI 配置

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: process.env.ZHIPUAI_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

**可用模型：**
- `zhipuai/glm-4.7`
- `zhipuai/glm-4-plus`
- `zhipuai/glm-4-flash`
- `zhipuai/glm-4-air`

### 多提供商配置

可以同时配置多个提供商：

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',      // 默认模型
  planModel: 'anthropic/claude-sonnet-4',  // 规划模型

  provider: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
});
```

---

## 工具配置

### 工具开关

控制哪些工具可用：

```typescript
await engine.initialize({
  tools: {
    read: true,           // 读取文件
    write: true,          // 写入文件
    edit: true,           // 编辑文件
    bash: true,           // 执行命令
    grep: true,           // 搜索内容
    glob: true,           // 搜索文件
    ls: true,             // 列出目录
    fetch: true,          // 网络请求
    task: true,           // 启动 Agent
    todo: true,           // 任务管理
    askUserQuestion: true, // 询问用户
    skill: true,          // 执行技能
  },
});
```

### 工具分类

| 分类 | 工具 | 说明 |
|------|------|------|
| `read` | read, grep, glob, ls | 只读操作 |
| `write` | write, edit | 文件修改 |
| `command` | bash, kill_bash | 命令执行 |
| `network` | fetch | 网络请求 |
| `ask` | askUserQuestion | 用户交互 |
| `task` | task, todo, skill | 任务与技能管理 |

---

## 审批模式

### ApprovalMode

控制工具执行前的审批行为。

```typescript
type ApprovalMode = 'default' | 'autoEdit' | 'yolo';
```

### 模式对比

| 模式 | read 类 | write 类 | command 类 | network 类 | ask 类 |
|------|---------|----------|-----------|-----------|--------|
| `default` | ✅ 自动 | ❌ 需确认 | ❌ 需确认 | ❌ 需确认 | ❌ 总是询问 |
| `autoEdit` | ✅ 自动 | ✅ 自动 | ❌ 需确认 | ❌ 需确认 | ❌ 总是询问 |
| `yolo` | ✅ 自动 | ✅ 自动 | ✅ 自动* | ✅ 自动 | ❌ 总是询问 |

*高风险命令仍需确认

### 使用示例

```typescript
// 默认模式 - 安全
await engine.initialize({
  approvalMode: 'default',
});

// 开发模式 - 适合代码重构
await engine.initialize({
  approvalMode: 'autoEdit',
});

// 自动模式 - 适合可信环境
await engine.initialize({
  approvalMode: 'yolo',
});
```

**详情：** [English](CONFIG.md) | [中文文档](CONFIG.zh-CN.md)

---

## MCP 服务器配置

### MCP 服务器类型

OriCore 支持三种 MCP 传输方式：

1. **Stdio** - 本地命令行服务器
2. **SSE** - Server-Sent Events
3. **HTTP** - HTTP 请求

### Stdio 配置

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

### HTTP 配置

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

### SSE 配置

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

**详情：** [English](CONFIG.md) | [中文文档](CONFIG.zh-CN.md)

---

## 插件配置

### 插件列表

```typescript
await engine.initialize({
  plugins: [
    'plugin-name',           // 字符串形式
    {                        // 对象形式
      name: 'custom-plugin',
      options: { /* ... */ },
    },
  ],
});
```

### 插件类型

插件可以扩展：
- 工具（Tools）
- 技能（Skills）
- 钩子（Hooks）

---

## 语言配置

### 支持的语言

```typescript
await engine.initialize({
  language: 'zh-CN',  // 中文
  // 或
  language: 'en',     // 英文
});
```

**支持的语言：**
- `zh-CN` - 简体中文
- `en` - 英语
- `ja` - 日语
- `ko` - 韩语
- `es` - 西班牙语
- `fr` - 法语
- `de` - 德语

---

## 系统提示词配置

### 基础提示词

```typescript
await engine.initialize({
  systemPrompt: 'You are a helpful coding assistant.',
});
```

### 追加提示词

```typescript
await engine.initialize({
  systemPrompt: 'You are a coding assistant.',
  appendSystemPrompt: 'Always provide type annotations and error handling.',
});
```

### 模式提示词

不同模式有专门的提示词，通过 `setMode()` 切换：

```typescript
engine.setMode('review');  // 使用审查模式的提示词
```

---

## 更多文档

- **[API 参考](./API.md)** - 完整的 API 文档
- **[工具系统](./TOOLS.md)** - 内置工具详解
- **[审批系统](./APPROVAL.md)** - 审批模式详解
- **[MCP 集成](./MCP.md)** - MCP 服务器配置
