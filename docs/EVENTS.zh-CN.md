# 事件系统

OriCore 消息总线与事件系统文档。

[English](EVENTS.md) | [中文文档](EVENTS.zh-CN.md)

---

## 目录

- [MessageBus 概览](#messagebus-概览)
- [事件类型](#事件类型)
- [发送请求](#发送请求)
- [注册处理器](#注册处理器)
- [监听事件](#监听事件)
- [使用示例](#使用示例)

---

## MessageBus 概览

MessageBus 是 OriCore 的消息传递系统，用于组件间通信。

### 获取 MessageBus

```typescript
const bus = engine.getMessageBus();
```

---

## 事件类型

### 核心事件

| 事件 | 说明 | 数据 |
|------|------|------|
| `toolApproval` | 工具执行审批请求 | `{ toolUse, category, sessionId }` |
| `agent.progress` | Agent 执行进度更新 | `{ sessionId, cwd, agentId, agentType, prompt, message, parentToolUseId, status, model, timestamp }` |
| `bash:prompt_background` | 后台任务提示 | `{ taskId, command, currentOutput }` |
| `bash:background_moved` | 后台任务已移动 | `{ taskId }` 或 `{}` |

---

## 发送请求

### request()

发送请求并等待响应。

```typescript
const result = await bus.request('methodName', {
  param1: 'value1',
  param2: 'value2',
});

// result 是响应数据
```

### request() 选项

```typescript
await bus.request('methodName', params, {
  timeout: 5000,      // 超时时间（毫秒），0 表示无超时
});
```

> **注意**: `sessionId` 应作为 `params` 的一部分传递，而非 `options` 参数。

---

## 注册处理器

### registerHandler()

注册请求处理器。

```typescript
bus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  console.log(`工具审批: ${toolUse.name}`);

  // 显示审批对话框
  const approved = await showApprovalDialog(toolUse);

  return {
    approved,
    denyReason: approved ? undefined : '用户拒绝',
  };
});
```

### 处理器签名

```typescript
type MessageHandler = (params: any) => Promise<any>;
```

处理器接收一个参数 `params`，其中包含请求的所有数据。`sessionId` 等信息包含在 `params` 中。

### 处理器返回值

对于 `toolApproval` 请求，处理器应返回：

```typescript
{
  approved: boolean,      // 是否批准
  params?: any,          // 可选的修改后参数
  denyReason?: string,   // 可选的拒绝原因
}
```

### 注销处理器

```typescript
bus.registerHandler('toolApproval', async (params) => {
  // ...
});

// 注销
bus.unregisterHandler('toolApproval');
```

---

## 监听事件

### onEvent()

监听事件。

```typescript
bus.onEvent('agent.progress', (data) => {
  console.log('Agent 状态:', data.status);
  console.log('Agent ID:', data.agentId);
});
```

### emitEvent()

发送事件。

```typescript
bus.emitEvent('custom.event', {
  message: 'Hello',
});
```

### offEvent()

取消事件监听。

```typescript
const handler = (data) => console.log(data);

// 注册监听
bus.onEvent('my.event', handler);

// 取消监听
bus.offEvent('my.event', handler);
```

---

## 使用示例

### 1. 工具审批处理器

```typescript
const bus = engine.getMessageBus();

bus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  console.log(`[${sessionId}] 审批工具: ${toolUse.name}`);
  console.log('参数:', toolUse.params);

  // 显示 UI 对话框
  const result = await showModal({
    title: `批准 ${toolUse.name}？`,
    content: toolUse.params,
  });

  return {
    approved: result.approved,
    params: result.params,
    denyReason: result.approved ? undefined : '用户取消',
  };
});
```

### 2. Agent 进度监听

```typescript
bus.onEvent('agent.progress', (data) => {
  console.log(`Agent ID: ${data.agentId}`);
  console.log(`状态: ${data.status}`);
  console.log(`模型: ${data.model}`);
  console.log(`会话: ${data.sessionId}`);
});
```

### 3. 后台任务管理

```typescript
// 监听后台任务提示
bus.onEvent('bash:prompt_background', async ({ taskId, command, currentOutput }) => {
  console.log(`后台任务 ${taskId}: ${command}`);
  console.log(`当前输出: ${currentOutput}`);

  const move = await confirm('移动到后台？');
  if (move) {
    await bus.request('bash:move_to_background', { taskId });
  }
});

// 监听后台任务已移动事件
bus.onEvent('bash:background_moved', ({ taskId }) => {
  console.log(`任务 ${taskId} 已移动到后台`);
});
```

### 4. 自定义事件

```typescript
// 发送自定义事件
bus.emitEvent('my.custom.event', {
  message: 'Hello from custom event',
});

// 监听自定义事件
bus.onEvent('my.custom.event', (data) => {
  console.log(data.message);  // "Hello from custom event"
});
```

### 5. 超时处理

```typescript
try {
  const result = await bus.request('slowOperation', {}, {
    timeout: 3000,  // 3 秒超时
  });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('操作超时');
  }
}
```

---

## 完整示例

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

  // 注册工具审批处理器
  bus.registerHandler('toolApproval', async ({ toolUse, sessionId }) => {
    console.log(`[${sessionId}] 工具: ${toolUse.name}`);
    console.log(`参数:`, toolUse.params);

    // 简单示例：自动批准读操作
    if (toolUse.name === 'read' || toolUse.name === 'grep') {
      return { approved: true };
    }

    // 其他操作需要确认
    const approved = await confirm(`批准 ${toolUse.name}?`);
    return { approved };
  });

  // 监听 Agent 进度
  bus.onEvent('agent.progress', (data) => {
    console.log(`Agent 状态: ${data.status}`);
    console.log(`Agent 类型: ${data.agentType}`);
  });

  // 使用引擎
  const result = await engine.sendMessage({
    message: '读取 package.json',
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

main();
```

---

## 更多文档

- **[API 参考](./API.md)** - 完整 API 文档
- **[会话管理](./SESSIONS.md)** - 会话与上下文
- **[工具系统](./TOOLS.md)** - 工具使用
