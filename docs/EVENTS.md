# Event System

OriCore Message Bus and Event System Documentation.

[English](EVENTS.md) | [中文文档](EVENTS.zh-CN.md)

---

## Table of Contents

- [MessageBus Overview](#messagebus-overview)
- [Event Types](#event-types)
- [Sending Requests](#sending-requests)
- [Registering Handlers](#registering-handlers)
- [Listening to Events](#listening-to-events)
- [Usage Examples](#usage-examples)

---

## MessageBus Overview

MessageBus is OriCore's messaging system for inter-component communication.

### Getting MessageBus

```typescript
const bus = engine.getMessageBus();
```

---

## Event Types

### Core Events

| Event | Description | Data |
|------|-------------|------|
| `toolApproval` | Tool execution approval request | `{ toolUse, category, sessionId }` |
| `agent.progress` | Agent execution progress update | `{ sessionId, cwd, agentId, agentType, prompt, message, parentToolUseId, status, model, timestamp }` |
| `bash:prompt_background` | Background task prompt | `{ taskId, command, currentOutput }` |
| `bash:background_moved` | Background task moved | `{ taskId }` or `{}` |

---

## Sending Requests

### request()

Send a request and wait for a response.

```typescript
const result = await bus.request('methodName', {
  param1: 'value1',
  param2: 'value2',
});

// result is the response data
```

### request() Options

```typescript
await bus.request('methodName', params, {
  timeout: 5000,      // Timeout in milliseconds, 0 means no timeout
});
```

> **Note**: `sessionId` should be passed as part of `params`, not in `options`.

---

## Registering Handlers

### registerHandler()

Register a request handler.

```typescript
bus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  console.log(`Tool approval: ${toolUse.name}`);

  // Show approval dialog
  const approved = await showApprovalDialog(toolUse);

  return {
    approved,
    denyReason: approved ? undefined : 'User denied',
  };
});
```

### Handler Signature

```typescript
type MessageHandler = (params: any) => Promise<any>;
```

The handler receives one parameter `params` containing all request data. `sessionId` and other information are included in `params`.

### Handler Return Value

For `toolApproval` requests, the handler should return:

```typescript
{
  approved: boolean,      // Whether approved
  params?: any,          // Optional modified parameters
  denyReason?: string,   // Optional denial reason
}
```

### Unregistering Handlers

```typescript
bus.registerHandler('toolApproval', async (params) => {
  // ...
});

// Unregister
bus.unregisterHandler('toolApproval');
```

---

## Listening to Events

### onEvent()

Listen to events.

```typescript
bus.onEvent('agent.progress', (data) => {
  console.log('Agent status:', data.status);
  console.log('Agent ID:', data.agentId);
});
```

### emitEvent()

Send events.

```typescript
bus.emitEvent('custom.event', {
  message: 'Hello',
});
```

### offEvent()

Remove event listener.

```typescript
const handler = (data) => console.log(data);

// Register listener
bus.onEvent('my.event', handler);

// Remove listener
bus.offEvent('my.event', handler);
```

---

## Usage Examples

### 1. Tool Approval Handler

```typescript
const bus = engine.getMessageBus();

bus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  console.log(`[${sessionId}] Approving tool: ${toolUse.name}`);
  console.log('Parameters:', toolUse.params);

  // Show UI dialog
  const result = await showModal({
    title: `Approve ${toolUse.name}?`,
    content: toolUse.params,
  });

  return {
    approved: result.approved,
    params: result.params,
    denyReason: result.approved ? undefined : 'User cancelled',
  };
});
```

### 2. Agent Progress Monitoring

```typescript
bus.onEvent('agent.progress', (data) => {
  console.log(`Agent ID: ${data.agentId}`);
  console.log(`Status: ${data.status}`);
  console.log(`Model: ${data.model}`);
  console.log(`Session: ${data.sessionId}`);
});
```

### 3. Background Task Management

```typescript
// Listen for background task prompts
bus.onEvent('bash:prompt_background', async ({ taskId, command, currentOutput }) => {
  console.log(`Background task ${taskId}: ${command}`);
  console.log(`Current output: ${currentOutput}`);

  const move = await confirm('Move to background?');
  if (move) {
    await bus.request('bash:move_to_background', { taskId });
  }
});

// Listen for background task moved event
bus.onEvent('bash:background_moved', ({ taskId }) => {
  console.log(`Task ${taskId} moved to background`);
});
```

### 4. Custom Events

```typescript
// Send custom event
bus.emitEvent('my.custom.event', {
  message: 'Hello from custom event',
});

// Listen to custom event
bus.onEvent('my.custom.event', (data) => {
  console.log(data.message);  // "Hello from custom event"
});
```

### 5. Timeout Handling

```typescript
try {
  const result = await bus.request('slowOperation', {}, {
    timeout: 3000,  // 3 second timeout
  });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Operation timed out');
  }
}
```

---

## Complete Example

```typescript
import { createEngine } from 'oricore';

async function main() {
  const engine = createEngine({
    productName: 'MyApp',
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

  const bus = engine.getMessageBus();

  // Register tool approval handler
  bus.registerHandler('toolApproval', async ({ toolUse, sessionId }) => {
    console.log(`[${sessionId}] Tool: ${toolUse.name}`);
    console.log(`Parameters:`, toolUse.params);

    // Simple example: auto-approve read operations
    if (toolUse.name === 'read' || toolUse.name === 'grep') {
      return { approved: true };
    }

    // Other operations require confirmation
    const approved = await confirm(`Approve ${toolUse.name}?`);
    return { approved };
  });

  // Listen to Agent progress
  bus.onEvent('agent.progress', (data) => {
    console.log(`Agent status: ${data.status}`);
    console.log(`Agent type: ${data.agentType}`);
  });

  // Use the engine
  const result = await engine.sendMessage({
    message: 'Read package.json',
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

main();
```

---

## More Documentation

- **[API Reference](./API.md)** - Complete API documentation
- **[Session Management](./SESSIONS.md)** - Sessions and context
- **[Tool System](./TOOLS.md)** - Tool usage
