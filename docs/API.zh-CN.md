# API 参考

OriCore 完整的 API 文档。

[English](API.md) | [中文文档](API.zh-CN.md)

---

## 目录

- [工厂函数](#工厂函数)
- [Engine 类](#engine-类)
  - [构造函数](#构造函数)
  - [初始化](#初始化)
  - [发送消息](#发送消息)
  - [会话管理](#会话管理)
  - [模式管理](#模式管理)
  - [生命周期](#生命周期)
  - [其他方法](#其他方法)
- [类型定义](#类型定义)
  - [EngineOptions](#engineoptions)
  - [EngineConfig](#engineconfig)
  - [SendMessageOptions](#sendmessageoptions)
  - [SessionOptions](#sessionoptions)
  - [LoopResult](#loopresult)
  - [Mode](#mode)

---

## 工厂函数

### `createEngine(options)`

创建一个新的 Engine 实例。

```typescript
function createEngine(options: EngineOptions): Engine
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `productName` | `string` | ✅ | 产品名称，用于标识 |
| `productASCIIArt` | `string` | ❌ | 启动时显示的 ASCII 艺术字 |
| `version` | `string` | ✅ | 版本号 |
| `cwd` | `string` | ❌ | 当前工作目录 |
| `fetch` | `typeof fetch` | ❌ | 自定义 fetch 函数 |
| `platform` | `PlatformAdapter` | ❌ | 平台适配器 |
| `messageBus` | `MessageBus` | ❌ | 消息总线实例 |

**返回值：** `Engine` 实例

**示例：**

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'MyAIAssistant',
  version: '1.0.0',
});
```

---

## Engine 类

### 构造函数

```typescript
class Engine {
  constructor(options: EngineOptions)
}
```

通常使用 `createEngine()` 工厂函数来创建实例，而不是直接使用构造函数。

---

### 初始化

#### `initialize(config)`

初始化引擎，配置 AI 模型和提供商。

```typescript
async initialize(config: EngineConfig = {}): Promise<void>
```

**参数：** [EngineConfig](#engineconfig)

**示例：**

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

---

### 发送消息

#### `sendMessage(options)`

发送消息给 AI 并获取响应。

```typescript
async sendMessage(options: SendMessageOptions): Promise<LoopResult>
```

**参数：** [SendMessageOptions](#sendmessageoptions)

**返回值：** [LoopResult](#loopresult)

**示例：**

```typescript
const result = await engine.sendMessage({
  message: '创建一个 TypeScript 函数',
  write: true,
});

if (result.success) {
  console.log(result.data.text);
} else {
  console.error(result.error.message);
}
```

#### `ask(message, options)`

快速询问问题，获取纯文本回复。

```typescript
async ask(message: string, options?: {
  model?: string;
  systemPrompt?: string;
}): Promise<string>
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `message` | `string` | 问题内容 |
| `model` | `string` | 可选，覆盖默认模型 |
| `systemPrompt` | `string` | 可选，系统提示词 |

**返回值：** `string` - AI 的回复文本

**示例：**

```typescript
const answer = await engine.ask('什么是 TypeScript？');
console.log(answer);
```

#### `sendMessageWithMode(message, options)`

使用当前模式发送消息。

```typescript
async sendMessageWithMode(
  message: string | NormalizedMessage[],
  options?: Partial<Omit<SendMessageOptions, 'message' | 'systemPrompt'>> & {
    systemPrompt?: string;
  }
): Promise<LoopResult>
```

**示例：**

```typescript
engine.setMode('brainstorm');
const result = await engine.sendMessageWithMode('我想做一个任务管理 App');
```

---

### 会话管理

#### `createSession(options)`

创建或恢复一个会话。

```typescript
async createSession(options?: SessionOptions): Promise<Session>
```

**参数：** [SessionOptions](#sessionoptions)

**返回值：** `Session` 实例

**示例：**

```typescript
// 创建新会话（自动生成 ID）
const session = await engine.createSession();
console.log('Session ID:', session.id);

// 恢复已有会话
const session = await engine.createSession({
  resume: 'abc123def456',
});

// 恢复最新会话
const session = await engine.createSession({
  continue: true,
});
```

**注意：** 如果需要在发送消息时使用指定的会话 ID，可以直接使用 `sessionId` 参数：

```typescript
await engine.sendMessage({
  sessionId: 'my-custom-session-id',
  message: 'Hello',
  write: false,
});
```

#### `getSessions()`

获取当前项目的所有会话列表。

```typescript
getSessions(): SessionInfo[]
```

**返回值：** `SessionInfo[]`

**示例：**

```typescript
const sessions = engine.getSessions();
sessions.forEach(session => {
  console.log(`Session: ${session.sessionId}`);
  console.log(`  Messages: ${session.messageCount}`);
  console.log(`  Summary: ${session.summary}`);
  console.log(`  Created: ${session.created}`);
  console.log(`  Modified: ${session.modified}`);
});
```

---

### 模式管理

#### `setMode(mode)`

设置当前交互模式。

```typescript
setMode(mode: ModeType): void
```

**参数：**

| 值 | 说明 |
|----|------|
| `'default'` | 通用助手模式 |
| `'brainstorm'` | 头脑风暴模式 |
| `'plan'` | 规划模式 |
| `'review'` | 审查模式 |
| `'debug'` | 调试模式 |

**示例：**

```typescript
engine.setMode('brainstorm');
```

#### `getMode()`

获取当前交互模式。

```typescript
getMode(): ModeType
```

#### `getAvailableModes()`

获取所有可用的交互模式。

```typescript
getAvailableModes(): Mode[]
```

**返回值：** `Mode[]`

**示例：**

```typescript
const modes = engine.getAvailableModes();
modes.forEach(mode => {
  console.log(`${mode.name}: ${mode.description}`);
});
```

#### `registerMode(mode)`

注册自定义模式。

```typescript
registerMode(mode: Mode): void
```

**参数：** [Mode](#mode)

**注意：** 自定义模式使用 `id: 'custom'`。

**示例：**

```typescript
engine.registerMode({
  id: 'custom',
  name: 'TypeScript Expert',
  description: 'TypeScript 开发专家',
  config: {
    systemPrompt: 'You are a TypeScript expert. Always provide typed examples.',
    write: true,
    askUserQuestion: true,
    maxTurns: 30,
  },
});
```

---

### 生命周期

#### `shutdown()`

关闭引擎，清理资源。

```typescript
async shutdown(): Promise<void>
```

**示例：**

```typescript
await engine.shutdown();
```

---

### 其他方法

#### `getMessageBus()`

获取消息总线实例。

```typescript
getMessageBus(): MessageBus
```

**示例：**

```typescript
const bus = engine.getMessageBus();
bus.registerHandler('toolApproval', async ({ toolUse }) => {
  // 处理工具审批
});
```

#### `getContext()`

获取上下文对象。

```typescript
getContext(): Context
```

---

## 类型定义

### EngineOptions

创建引擎时的选项。

```typescript
interface EngineOptions {
  productName: string;          // 产品名称
  productASCIIArt?: string;     // ASCII 艺术字
  version: string;              // 版本号
  cwd?: string;                 // 当前工作目录
  fetch?: typeof fetch;         // 自定义 fetch
  platform?: PlatformAdapter;   // 平台适配器
  messageBus?: MessageBus;      // 消息总线
}
```

---

### EngineConfig

初始化引擎时的配置。

```typescript
interface EngineConfig {
  // 模型选择
  model?: string;               // 主模型，如 'deepseek/deepseek-chat'
  planModel?: string;           // 规划模型，用于 plan 模式

  // 行为
  approvalMode?: 'default' | 'autoEdit' | 'yolo';  // 审批模式
  language?: string;            // 语言，如 'zh-CN'、'en'

  // 提示词
  systemPrompt?: string;        // 系统提示词
  appendSystemPrompt?: string;  // 追加的提示词

  // 工具
  tools?: Record<string, boolean>;  // 工具开关，如 { read: true, bash: false }

  // 扩展
  mcpServers?: Record<string, McpServerConfig>;  // MCP 服务器配置
  plugins?: (string | any)[];   // 插件列表

  // AI 提供商
  provider?: Record<string, ProviderConfig>;  // 提供商配置
}
```

**完整配置示例：**

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  planModel: 'anthropic/claude-sonnet-4-20250514',
  approvalMode: 'autoEdit',
  language: 'zh-CN',
  systemPrompt: 'You are a helpful coding assistant.',
  appendSystemPrompt: 'Always provide type annotations.',
  tools: {
    read: true,
    write: true,
    edit: true,
    bash: true,
    grep: true,
    glob: true,
    fetch: true,
  },
  provider: {
    deepseek: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.deepseek.com',
    },
    anthropic: {
      apiKey: 'your-anthropic-key',
      baseURL: 'https://api.anthropic.com',
    },
  },
});
```

---

### SendMessageOptions

发送消息时的选项。

```typescript
interface SendMessageOptions {
  // 消息内容
  message: string | NormalizedMessage[];  // 消息内容

  // 会话
  sessionId?: string;          // 会话 ID，用于多轮对话

  // 功能开关
  write?: boolean;             // 是否允许写文件
  todo?: boolean;              // 是否启用任务管理
  askUserQuestion?: boolean;   // 是否允许询问用户
  task?: boolean;              // 是否允许启动子 Agent

  // 模型
  model?: string;              // 覆盖默认模型
  maxTurns?: number;           // 最大轮数

  // 信号
  signal?: AbortSignal;        // 中断信号

  // 回调
  onTextDelta?: (text: string) => Promise<void>;     // 文本增量回调
  onText?: (text: string) => Promise<void>;         // 完整文本回调
  onReasoning?: (text: string) => Promise<void>;    // 推理过程回调
  onToolUse?: (toolUse: ToolUse) => Promise<ToolUse>;           // 工具使用回调
  onToolResult?: (toolUse: ToolUse, toolResult: ToolResult, approved: boolean) => Promise<ToolResult>;  // 工具结果回调
  onToolApprove?: (toolUse: ToolUse) => Promise<ToolApprovalResult>;  // 工具审批回调
  onTurn?: (turn: any) => Promise<void>;            // 每轮对话回调
}
```

**流式响应示例：**

```typescript
const result = await engine.sendMessage({
  message: '解释 React hooks',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // 实时输出
  },

  onToolUse: async (toolUse) => {
    console.log('使用工具:', toolUse.name);
    return toolUse;
  },
});
```

---

### SessionOptions

创建会话时的选项。

```typescript
interface SessionOptions {
  sessionId?: string;   // 指定会话 ID
  resume?: string;      // 恢复指定 ID 的会话
  continue?: boolean;   // 恢复最新会话
}
```

---

### SessionInfo

会话信息对象。

```typescript
interface SessionInfo {
  sessionId: string;     // 会话 ID
  messageCount: number;  // 消息数量
  summary: string;       // 会话摘要
  created: Date;         // 创建时间
  modified: Date;        // 修改时间
}
```

---

### LoopResult

发送消息的返回结果。

```typescript
type LoopResult =
  | {
      success: true;
      data: {
        text: string;       // AI 回复文本
        history: History;   // 对话历史
        usage: Usage;       // Token 使用情况
      };
      metadata: {
        turnsCount: number;       // 对话轮数
        toolCallsCount: number;   // 工具调用次数
        duration: number;         // 执行时长（毫秒）
      };
    }
  | {
      success: false;
      error: {
        type: 'tool_denied' | 'max_turns_exceeded' | 'api_error' | 'canceled';  // 错误类型
        message: string;    // 错误消息
        details?: Record<string, any>;  // 错误详情
      };
    };
```

**Usage 类型：**

```typescript
interface Usage {
  promptTokens: number;      // 输入 Token 数
  completionTokens: number;  // 输出 Token 数
  totalTokens: number;       // 总 Token 数
}
```

---

### Mode

交互模式定义。

```typescript
interface Mode {
  id: ModeType;              // 模式 ID
  name: string;              // 模式名称
  description: string;       // 模式描述
  config: ModeConfig;        // 模式配置
  buildPrompt?: (args: string) => string | NormalizedMessage[];  // 构建提示词
}
```

**ModeConfig 类型：**

```typescript
interface ModeConfig {
  systemPrompt: string;      // 系统提示词
  write?: boolean;           // 是否允许写文件
  todo?: boolean;            // 是否启用任务管理
  askUserQuestion?: boolean; // 是否允许询问用户
  task?: boolean;            // 是否允许启动子 Agent
  maxTurns?: number;         // 最大轮数
  model?: string;            // 使用模型
  temperature?: number;      // 温度参数
  autoCompact?: boolean;     // 是否自动压缩上下文
}
```

**ModeType 类型：**

```typescript
type ModeType =
  | 'default'
  | 'brainstorm'
  | 'plan'
  | 'review'
  | 'debug'
  | 'custom';
```

---

## 更多文档

- **[配置详解](./CONFIG.md)** - 完整的配置选项
- **[工具系统](./TOOLS.md)** - 内置工具详解
- **[交互模式](./MODES.md)** - 5 种专业模式
- **[会话管理](./SESSIONS.md)** - 持久化与上下文压缩
- **[事件系统](./EVENTS.md)** - 消息总线与事件
