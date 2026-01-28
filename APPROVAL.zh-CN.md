# 工具审批系统

[English](APPROVAL.md) | [中文文档](APPROVAL.zh-CN.md)

## 目录

- [概述](#概述)
- [审批模式](#审批模式)
- [审批流程](#审批流程)
- [使用示例](#使用示例)
- [工具分类](#工具分类)
- [自定义审批处理](#自定义审批处理)
- [最佳实践](#最佳实践)

---

## 概述

OriCore 提供了一个灵活的工具审批系统，用于控制 AI 助手何时以及如何执行工具。您可以使用内置的审批模式或实现自定义审批逻辑。

### 为什么需要审批

- **安全性**：防止意外执行危险命令
- **透明度**：向用户展示正在执行的操作
- **控制权**：给予用户对 AI 行为的细粒度控制
- **信任**：通过可见性建立用户信心

---

## 审批模式

OriCore 支持三种内置审批模式：

### 1. `default` 模式（默认）

**大多数操作需要手动批准**

```typescript
await engine.initialize({
  approvalMode: 'default',
});
```

**行为：**
- ✅ 读取操作（read、grep、glob）：自动批准
- ❌ 写入操作（write、edit）：需要批准
- ❌ 命令执行（bash）：需要批准
- ❌ 网络请求（fetch）：需要批准
- ❌ 用户问题（askUserQuestion）：总是需要用户输入

**适用于：** 生产环境、谨慎的用户、学习系统

### 2. `autoEdit` 模式

**自动批准文件编辑，其他操作需要批准**

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',
});
```

**行为：**
- ✅ 读取操作：自动批准
- ✅ 写入操作：自动批准
- ❌ 命令执行（bash）：需要批准
- ❌ 网络请求（fetch）：需要批准
- ❌ 用户问题：总是需要用户输入

**适用于：** 开发工作流、代码重构任务

### 3. `yolo` 模式

**自动批准所有操作（除了用户问题）**

```typescript
await engine.initialize({
  approvalMode: 'yolo',
});
```

**行为：**
- ✅ 读取操作：自动批准
- ✅ 写入操作：自动批准
- ✅ 命令执行：自动批准（高危命令除外）
- ✅ 网络请求：自动批准
- ❌ 用户问题：总是需要用户输入

**适用于：** 可信环境、自动化工作流、有经验的用户

---

## 审批流程

审批系统遵循优先级顺序。每一步都可以在进入下一步之前自动批准工具。

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 1: 检查 yolo 模式                                          │
│   if (approvalMode === 'yolo' && category !== 'ask')            │
│     → 自动批准                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (未自动批准)
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 2: 检查 read 类别                                          │
│   if (category === 'read')                                      │
│     → 自动批准                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (未自动批准)
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 3: 检查工具的 needsApproval                                │
│   if (tool.approval.needsApproval() === false)                 │
│     → 自动批准                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (未自动批准)
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 4: 检查 autoEdit 模式的 write 类别                         │
│   if (category === 'write' && approvalMode === 'autoEdit')      │
│     → 自动批准                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (未自动批准)
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 5: 检查会话白名单                                           │
│   if (tool in session.config.approvalTools)                    │
│     → 自动批准                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (未自动批准)
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 6: 调用自定义审批回调                                       │
│   result = await onToolApprove(toolUse)                         │
│   → 使用回调结果                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**重要提示：** 如果您提供了 `onToolApprove` 回调，它**仅在**步骤 1-5 未自动批准工具时才会被调用。

---

## 使用示例

### 示例 1: 简单的默认模式

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: process.env.ZHIPUAI_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
  approvalMode: 'default', // 大多数操作需要手动批准
});

const result = await engine.sendMessage({
  message: '创建一个 TypeScript 函数',
  write: true,
  // 您将被提示批准写入操作
});

console.log(result.data.text);
```

### 示例 2: 开发环境的 AutoEdit 模式

```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
  approvalMode: 'autoEdit', // 自动批准文件编辑
});

const result = await engine.sendMessage({
  message: '将所有 TypeScript 文件重构为使用 const',
  write: true,
  // 文件编辑自动批准，但 bash 命令需要批准
});
```

### 示例 3: 自动化场景的 Yolo 模式

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
  },
  approvalMode: 'yolo', // 自动批准所有操作
});

const result = await engine.sendMessage({
  message: '分析代码库并创建文档',
  write: true,
  // 所有操作自动批准，除了用户问题
});
```

### 示例 4: 自定义审批处理

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  approvalMode: 'default', // 设置默认行为
});

const result = await engine.sendMessage({
  message: '清理临时文件',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`[审批] 工具: ${toolUse.name}`);
    console.log(`[参数]`, JSON.stringify(toolUse.params, null, 2));

    // 向用户显示审批界面
    process.stdout.write(`\n是否批准 ${toolUse.name}? (y/n): `);

    // 读取用户输入
    const answer = await new Promise<string>((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', (data) => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(data.toString().trim().toLowerCase());
      });
    });

    const approved = answer === 'y';
    console.log(approved ? '✅ 已批准' : '❌ 已拒绝');

    return {
      approved,
      denyReason: approved ? undefined : '用户拒绝'
    };
  },
});
```

### 示例 5: Web 应用审批

```typescript
await engine.sendMessage({
  message: userQuery,
  write: true,

  onToolApprove: async (toolUse) => {
    // 在 Web UI 中显示模态对话框
    const result = await showModal({
      title: `批准 ${toolUse.name}?`,
      content: (
        <div>
          <p>工具: {toolUse.name}</p>
          <pre>{JSON.stringify(toolUse.params, null, 2)}</pre>
        </div>
      ),
      actions: [
        { label: '批准', value: 'approve' },
        { label: '拒绝', value: 'deny' },
      ],
    });

    return {
      approved: result === 'approve',
    };
  },
});
```

### 示例 6: 条件审批逻辑

```typescript
await engine.sendMessage({
  message: '优化数据库查询',
  write: true,

  onToolApprove: async (toolUse) => {
    // 总是批准读取操作
    if (toolUse.name === 'read' || toolUse.name === 'grep') {
      return { approved: true };
    }

    // 检查 bash 命令的危险模式
    if (toolUse.name === 'bash') {
      const command = toolUse.params.command as string;

      // 阻止危险命令
      if (command.includes('rm -rf') || command.includes('> /dev')) {
        return {
          approved: false,
          denyReason: '检测到危险命令',
        };
      }

      // 允许安全命令
      if (command.startsWith('git') || command.startsWith('ls')) {
        return { approved: true };
      }
    }

    // 其他操作询问用户
    const confirmed = await showConfirmDialog({
      message: `允许 ${toolUse.name}?`,
      details: toolUse.params,
    });

    return { approved: confirmed };
  },
});
```

---

## 工具分类

每个工具都有一个 `category`，影响审批行为：

| 类别 | 工具 | 描述 |
|------|------|-------------|
| `read` | read、grep、glob、ls、bash_output、todo、task、skill | 只读操作 |
| `write` | write、edit | 文件修改操作 |
| `command` | bash、kill_bash | Shell 命令执行 |
| `network` | fetch | 网络请求 |
| `ask` | askUserQuestion | 用户交互（总是需要输入） |

### 工具特定的审批逻辑

某些工具有自定义的 `needsApproval` 逻辑：

**Bash 工具：**
```typescript
approval: {
  category: 'command',
  needsApproval: async (context) => {
    const { params, approvalMode } = context;
    const command = params.command as string;

    // 高危命令总是需要批准
    if (isHighRiskCommand(command)) {
      return true;
    }

    // 禁用的命令总是被拒绝
    if (isBannedCommand(command)) {
      return true; // 将被拒绝
    }

    // 其他命令遵循审批模式
    return approvalMode !== 'yolo';
  },
}
```

---

## 自定义审批处理

### 审批回调签名

```typescript
type ApprovalCallback = (toolUse: ToolUse) => Promise<ToolApprovalResult>;

interface ToolUse {
  name: string;        // 工具名称（如 'bash'、'write'）
  params: Record<string, any>;  // 工具参数
  callId: string;      // 唯一调用 ID
}

type ToolApprovalResult =
  | boolean  // true = 批准，false = 拒绝
  | {
      approved: boolean;
      params?: Record<string, any>;  // 可选的修改后的参数
      denyReason?: string;  // 可选的拒绝原因
    };
```

### 高级：使用 MessageBus 的会话上下文

当使用 `task` 工具与 Agent 子任务时，审批请求通过 `MessageBus` 发送，并带有额外的会话上下文：

```typescript
// 通过 MessageBus 进行的 Agent 工具审批（内部使用）
const result = await messageBus.request('toolApproval', {
  toolUse: { name: 'bash', params: { command: 'ls' }, callId: '123' },
  category: 'command',
  sessionId: 'session-abc'  // 用于多会话管理的会话 ID
});
```

#### 注册 MessageBus 处理器

```typescript
messageBus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  // sessionId 的作用：
  // 1. 会话特定日志：console.log(`[${sessionId}] ${toolUse.name} 的审批请求`)
  // 2. UI 路由：将审批对话框路由到正确的会话窗口
  // 3. 多会话管理：跟踪每个会话的审批记录
  // 4. 会话级策略：为每个会话应用不同的规则

  console.log(`会话 ${sessionId} 请求审批 ${toolUse.name}`);

  // 显示审批 UI
  const approved = await showApprovalDialog({
    tool: toolUse.name,
    params: toolUse.params,
    sessionId: sessionId  // 高亮显示发起请求的会话
  });

  return {
    approved,
    params: toolUse.params,
    denyReason: approved ? undefined : '用户拒绝'
  };
});
```

#### 向后兼容性

不使用 `sessionId` 的处理器仍然兼容：

```typescript
// 旧式处理器（仍然有效）
messageBus.registerHandler('toolApproval', async ({ toolUse, category }) => {
  // sessionId 会被忽略
  return { approved: true };
});
```

### 返回值

```typescript
// 简单布尔值
return true;   // 批准
return false;  // 拒绝

// 包含详细信息的对象
return {
  approved: true
};

return {
  approved: false,
  denyReason: '违反安全策略'
};

// 批准并修改参数
return {
  approved: true,
  params: {
    ...toolUse.params,
    // 修改后的参数
  }
};
```

---

## 最佳实践

### 1. 选择正确的模式

```typescript
// ✅ 好：根据使用场景匹配模式
// 开发工作流
approvalMode: 'autoEdit'

// 生产环境需要监督
approvalMode: 'default'

// 可信的自动化
approvalMode: 'yolo'
```

### 2. 实施渐进式审批

```typescript
// ✅ 好：从严格开始，逐步放宽
const approvalConfig = {
  newProject: 'default',
  trustedProject: 'autoEdit',
  automated: 'yolo',
};

await engine.initialize({
  approvalMode: approvalConfig[getTrustLevel(project)],
});
```

### 3. 提供清晰的反馈

```typescript
// ✅ 好：向用户展示正在发生什么
onToolApprove: async (toolUse) => {
  const result = await showApprovalUI({
    title: `执行 ${toolUse.name}?`,
    details: {
      tool: toolUse.name,
      description: getToolDescription(toolUse.name),
      params: toolUse.params,
      risk: assessRisk(toolUse),
    },
  });

  return result;
}
```

### 4. 优雅地处理错误

```typescript
// ✅ 好：处理审批失败
onToolApprove: async (toolUse) => {
  try {
    const approved = await getUserApproval(toolUse);
    return { approved };
  } catch (error) {
    console.error('审批错误:', error);
    // 为了安全，失败时拒绝
    return {
      approved: false,
      denyReason: '审批系统错误'
    };
  }
}
```

### 5. 记录审批决策

```typescript
// ✅ 好：维护审计跟踪
onToolApprove: async (toolUse) => {
  const decision = await askUser(toolUse);

  await logApproval({
    tool: toolUse.name,
    params: toolUse.params,
    approved: decision.approved,
    timestamp: new Date(),
    user: getCurrentUser(),
  });

  return decision;
}
```

### 6. 考虑上下文

```typescript
// ✅ 好：根据上下文调整行为
onToolApprove: async (toolUse) => {
  // 测试环境自动批准
  if (process.env.NODE_ENV === 'test') {
    return { approved: true };
  }

  // 生产环境需要批准
  if (process.env.NODE_ENV === 'production') {
    return await requireProductionApproval(toolUse);
  }

  // 默认行为
  return await askUser(toolUse);
}
```

---

## 总结

| 特性 | 描述 |
|---------|-------------|
| **模式** | `default`、`autoEdit`、`yolo` |
| **流程** | 6 步优先级系统 |
| **自定义** | `onToolApprove` 回调 |
| **分类** | `read`、`write`、`command`、`network`、`ask` |
| **适用于** | 安全性、透明度、控制 |

更多信息请参阅：
- [USAGE.zh-CN.md](USAGE.zh-CN.md) - 一般使用指南
- [README.zh-CN.md](README.zh-CN.md) - 项目概述
