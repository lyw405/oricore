# API Reference

Complete API documentation for OriCore.

[English](API.md) | [中文文档](API.zh-CN.md)

---

## Table of Contents

- [Factory Function](#factory-function)
- [Engine Class](#engine-class)
  - [Constructor](#constructor)
  - [Initialization](#initialization)
  - [Sending Messages](#sending-messages)
  - [Session Management](#session-management)
  - [Mode Management](#mode-management)
  - [Lifecycle](#lifecycle)
  - [Other Methods](#other-methods)
- [Type Definitions](#type-definitions)
  - [EngineOptions](#engineoptions)
  - [EngineConfig](#engineconfig)
  - [SendMessageOptions](#sendmessageoptions)
  - [SessionOptions](#sessionoptions)
  - [SessionInfo](#sessioninfo)
  - [LoopResult](#loopresult)
  - [Mode](#mode)

---

## Factory Function

### `createEngine(options)`

Create a new Engine instance.

```typescript
function createEngine(options: EngineOptions): Engine
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productName` | `string` | ✅ | Product name for identification |
| `productASCIIArt` | `string` | ❌ | ASCII art banner displayed on startup |
| `version` | `string` | ✅ | Version number |
| `cwd` | `string` | ❌ | Current working directory |
| `fetch` | `typeof fetch` | ❌ | Custom fetch function |
| `platform` | `PlatformAdapter` | ❌ | Platform adapter |
| `messageBus` | `MessageBus` | ❌ | Message bus instance |

**Returns:** `Engine` instance

**Example:**

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'MyAIAssistant',
  version: '1.0.0',
});
```

---

## Engine Class

### Constructor

```typescript
class Engine {
  constructor(options: EngineOptions)
}
```

Typically use the `createEngine()` factory function to create instances rather than using the constructor directly.

---

### Initialization

#### `initialize(config)`

Initialize the engine with AI model and provider configuration.

```typescript
async initialize(config: EngineConfig = {}): Promise<void>
```

**Parameters:** [EngineConfig](#engineconfig)

**Example:**

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider:
  {
    deepseek: {
      options: {
        apiKey: 'your-api-key',
      },
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

---

### Sending Messages

#### `sendMessage(options)`

Send a message to the AI and get a response.

```typescript
async sendMessage(options: SendMessageOptions): Promise<LoopResult>
```

**Parameters:** [SendMessageOptions](#sendmessageoptions)

**Returns:** [LoopResult](#loopresult)

**Example:**

```typescript
const result = await engine.sendMessage({
  message: 'Create a TypeScript function',
  write: true,
});

if (result.success) {
  console.log(result.data.text);
} else {
  console.error(result.error.message);
}
```

#### `ask(message, options)`

Quickly ask a question and get a plain text response.

```typescript
async ask(message: string, options?: {
  model?: string;
  systemPrompt?: string;
}): Promise<string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Question content |
| `model` | `string` | Optional, override default model |
| `systemPrompt` | `string` | Optional, system prompt |

**Returns:** `string` - AI's response text

**Example:**

```typescript
const answer = await engine.ask('What is TypeScript?');
console.log(answer);
```

#### `sendMessageWithMode(message, options)`

Send a message using the current mode.

```typescript
async sendMessageWithMode(
  message: string | NormalizedMessage[],
  options?: Partial<Omit<SendMessageOptions, 'message' | 'systemPrompt'>> & {
    systemPrompt?: string;
  }
): Promise<LoopResult>
```

**Example:**

```typescript
engine.setMode('brainstorm');
const result = await engine.sendMessageWithMode('I want to build a task management app');
```

---

### Session Management

#### `createSession(options)`

Create or resume a session.

```typescript
async createSession(options?: SessionOptions): Promise<Session>
```

**Parameters:** [SessionOptions](#sessionoptions)

**Returns:** `Session` instance

**Example:**

```typescript
// Create new session (auto-generate ID)
const session = await engine.createSession();
console.log('Session ID:', session.id);

// Resume existing session
const session = await engine.createSession({
  resume: 'abc123def456',
});

// Resume latest session
const session = await engine.createSession({
  continue: true,
});
```

**Note:** If you need to use a specific session ID when sending messages, use the `sessionId` parameter directly:

```typescript
await engine.sendMessage({
  sessionId: 'my-custom-session-id',
  message: 'Hello',
  write: false,
});
```

#### `getSessions()`

Get list of all sessions for the current project.

```typescript
getSessions(): SessionInfo[]
```

**Returns:** `SessionInfo[]`

**Example:**

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

### Mode Management

#### `setMode(mode)`

Set the current interaction mode.

```typescript
setMode(mode: ModeType): void
```

**Parameters:**

| Value | Description |
|-------|-------------|
| `'default'` | General assistant mode |
| `'brainstorm'` | Brainstorming mode |
| `'plan'` | Planning mode |
| `'review'` | Review mode |
| `'debug'` | Debugging mode |

**Example:**

```typescript
engine.setMode('brainstorm');
```

#### `getMode()`

Get the current interaction mode.

```typescript
getMode(): ModeType
```

#### `getAvailableModes()`

Get all available interaction modes.

```typescript
getAvailableModes(): Mode[]
```

**Returns:** `Mode[]`

**Example:**

```typescript
const modes = engine.getAvailableModes();
modes.forEach(mode => {
  console.log(`${mode.name}: ${mode.description}`);
});
```

#### `registerMode(mode)`

Register a custom mode.

```typescript
registerMode(mode: Mode): void
```

**Parameters:** [Mode](#mode)

**Note:** Custom modes use `id: 'custom'`.

**Example:**

```typescript
engine.registerMode({
  id: 'custom',
  name: 'TypeScript Expert',
  description: 'TypeScript development expert',
  config: {
    systemPrompt: 'You are a TypeScript expert. Always provide typed examples.',
    write: true,
    askUserQuestion: true,
    maxTurns: 30,
  },
});
```

---

### Lifecycle

#### `shutdown()`

Shutdown the engine and cleanup resources.

```typescript
async shutdown(): Promise<void>
```

**Example:**

```typescript
await engine.shutdown();
```

---

### Other Methods

#### `getMessageBus()`

Get the message bus instance.

```typescript
getMessageBus(): MessageBus
```

**Example:**

```typescript
const bus = engine.getMessageBus();
bus.registerHandler('toolApproval', async ({ toolUse }) => {
  // Handle tool approval
});
```

#### `getContext()`

Get the context object.

```typescript
getContext(): Context
```

---

## Type Definitions

### EngineOptions

Options when creating the engine.

```typescript
interface EngineOptions {
  productName: string;          // Product name
  productASCIIArt?: string;     // ASCII art banner
  version: string;              // Version number
  cwd?: string;                 // Current working directory
  fetch?: typeof fetch;         // Custom fetch
  platform?: PlatformAdapter;   // Platform adapter
  messageBus?: MessageBus;      // Message bus
}
```

---

### EngineConfig

Configuration when initializing the engine.

```typescript
interface EngineConfig {
  // Model selection
  model?: string;               // Main model, e.g., 'deepseek/deepseek-chat'
  planModel?: string;           // Planning model for plan mode

  // Behavior
  approvalMode?: 'default' | 'autoEdit' | 'yolo';  // Approval mode
  language?: string;            // Language, e.g., 'zh-CN', 'en'

  // Prompts
  systemPrompt?: string;        // System prompt
  appendSystemPrompt?: string;  // Additional prompt

  // Tools
  tools?: Record<string, boolean>;  // Tool switches, e.g., { read: true, bash: false }

  // Extensions
  mcpServers?: Record<string, McpServerConfig>;  // MCP server configuration
  plugins?: (string | any)[];   // Plugin list

  // AI Providers
  provider?: Record<string, ProviderConfig>;  // Provider configuration
}
```

**Complete configuration example:**

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
      options: {
        apiKey: 'your-api-key',
      },
      baseURL: 'https://api.deepseek.com',
    },
    anthropic: {
      apiKey: 'your-anthropic-key',
    },
  },
});
```

---

### SendMessageOptions

Options when sending a message.

```typescript
interface SendMessageOptions {
  // Message content
  message: string | NormalizedMessage[];  // Message content

  // Session
  sessionId?: string;          // Session ID for persistent conversations

  // Feature switches
  write?: boolean;             // Allow file writing
  todo?: boolean;              // Enable task management
  askUserQuestion?: boolean;   // Allow asking user
  task?: boolean;              // Allow starting sub-agents

  // Model
  model?: string;              // Override default model
  maxTurns?: number;           // Maximum turns

  // Signal
  signal?: AbortSignal;        // Abort signal

  // Callbacks
  onTextDelta?: (text: string) => Promise<void>;     // Text delta callback
  onText?: (text: string) => Promise<void>;         // Complete text callback
  onReasoning?: (text: string) => Promise<void>;    // Reasoning callback
  onToolUse?: (toolUse: ToolUse) => Promise<ToolUse>;           // Tool use callback
  onToolResult?: (toolUse: ToolUse, toolResult: ToolResult, approved: boolean) => Promise<ToolResult>;  // Tool result callback
  onToolApprove?: (toolUse: ToolUse) => Promise<ToolApprovalResult>;  // Tool approval callback
  onTurn?: (turn: any) => Promise<void>;            // Turn completion callback
}
```

**Streaming response example:**

```typescript
const result = await engine.sendMessage({
  message: 'Explain React hooks',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // Real-time output
  },

  onToolUse: async (toolUse) => {
    console.log('Using tool:', toolUse.name);
    return toolUse;
  },
});
```

---

### SessionOptions

Options when creating a session.

```typescript
interface SessionOptions {
  sessionId?: string;   // Specify session ID
  resume?: string;      // Resume session with specified ID
  continue?: boolean;   // Resume latest session
}
```

---

### SessionInfo

Session information object.

```typescript
interface SessionInfo {
  sessionId: string;     // Session ID
  messageCount: number;  // Message count
  summary: string;       // Session summary
  created: Date;         // Creation time
  modified: Date;        // Modification time
}
```

---

### LoopResult

Result of sending a message.

```typescript
type LoopResult =
  | {
      success: true;
      data: {
        text: string;       // AI response text
        history: History;   // Conversation history
        usage: Usage;       // Token usage
      };
      metadata: {
        turnsCount: number;       // Number of turns
        toolCallsCount: number;   // Number of tool calls
        duration: number;         // Execution duration (ms)
      };
    }
  | {
      success: false;
      error: {
        type: 'tool_denied' | 'max_turns_exceeded' | 'api_error' | 'canceled';  // Error type
        message: string;    // Error message
        details?: Record<string, any>;  // Error details
      };
    };
```

**Usage type:**

```typescript
interface Usage {
  promptTokens: number;      // Input token count
  completionTokens: number;  // Output token count
  totalTokens: number;       // Total token count
}
```

---

### Mode

Interaction mode definition.

```typescript
interface Mode {
  id: ModeType;              // Mode ID
  name: string;              // Mode name
  description: string;       // Mode description
  config: ModeConfig;        // Mode configuration
  buildPrompt?: (args: string) => string | NormalizedMessage[];  // Build prompt
}
```

**ModeConfig type:**

```typescript
interface ModeConfig {
  systemPrompt: string;      // System prompt
  write?: boolean;           // Allow file writing
  todo?: boolean;            // Enable task management
  askUserQuestion?: boolean; // Allow asking user
  task?: boolean;            // Allow starting sub-agents
  maxTurns?: number;         // Maximum turns
  model?: string;            // Model to use
  temperature?: number;      // Temperature parameter
  autoCompact?: boolean;     // Auto-compact context
}
```

**ModeType type:**

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

## More Documentation

- **[Configuration Guide](./CONFIG.md)** - Complete configuration options
- **[Tools System](./TOOLS.md)** - Built-in tools guide
- **[Interaction Modes](./MODES.md)** - 5 professional modes
- **[Session Management](./SESSIONS.md)** - Persistence & context compression
- **[Event System](./EVENTS.md)** - Message bus & events
