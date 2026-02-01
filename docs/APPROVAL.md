# 审批系统

控制 AI 工具执行权限的安全系统。

[English](APPROVAL.md) | [中文文档](APPROVAL.zh-CN.md)

---

## 目录

- [审批模式](#审批模式)
- [审批流程](#审批流程)
- [自定义审批](#自定义审批)
- [最佳实践](#最佳实践)

---

## 审批模式

### 三种内置模式

| 模式 | read 类 | write 类 | command 类 | network 类 | ask 类 | 适用场景 |
|------|---------|----------|-----------|-----------|--------|----------|
| `default` | ✅ 自动 | ❌ 需确认 | ❌ 需确认 | ❌ 需确认 | ❌ 需确认 | 生产环境、谨慎使用 |
| `autoEdit` | ✅ 自动 | ✅ 自动 | ❌ 需确认 | ❌ 需确认 | ❌ 需确认 | 开发环境、代码重构 |
| `yolo` | ✅ 自动 | ✅ 自动 | ✅ 自动* | ✅ 自动 | ❌ 需确认 | 自动化、可信环境 |

**\***高风险命令（如 `rm -rf`、`dd` 等）即使在 yolo 模式下仍需确认。

### 配置模式

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',  // 或 'default' | 'yolo'
});
```

---

## 审批流程

### 审批决策流程

工具执行的审批决策按以下顺序进行：

```
1. 检查工具的 needsApproval 函数
   ├─ 如果返回 true → 需要用户确认
   ├─ 如果返回 false → 自动批准
   └─ 如果未定义 → 继续下一步

2. 检查 approvalMode 配置
   ├─ yolo 模式 → 自动批准（除 ask 类和高风险命令）
   ├─ autoEdit 模式 → read/write 自动批准，command/network 需确认
   └─ default 模式 → 除 read 类外，其他都需确认

3. 调用 onToolApprove 回调（如果提供）
   └─ 用户自定义逻辑决定最终结果
```

### 工具分类

| 分类 | 工具 | 审批行为 |
|------|------|----------|
| `read` | read, grep, glob, ls, bash_output, todo, skill, task | 总是自动批准 |
| `write` | write, edit | default 模式需确认 |
| `command` | bash, kill_bash | default/autoEdit 需确认，yolo 大部分自动 |
| `network` | fetch | default/autoEdit 需确认 |
| `ask` | askUserQuestion | 总是需要用户交互 |

### Bash 工具的特殊审批逻辑

`bash` 工具有额外的安全检查：

```typescript
// bash 工具的内置审批逻辑
needsApproval: async (context) => {
  const { params, approvalMode } = context;
  const command = params.command;

  // 1. 高风险命令总是需要审批
  if (isHighRiskCommand(command)) {
    return true;  // 即使 yolo 模式也需要确认
  }

  // 2. 禁用命令会被拒绝
  if (isBannedCommand(getCommandRoot(command))) {
    return true;  // 返回 true 但会被拒绝
  }

  // 3. 其他命令根据 approvalMode 决定
  return approvalMode !== 'yolo';
}
```

---

## 自定义审批

### onToolApprove 回调

`onToolApprove` 回调在每个工具执行前被调用，可以完全自定义审批行为。

```typescript
const result = await engine.sendMessage({
  message: '执行一些操作',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`工具: ${toolUse.name}`);
    console.log(`参数:`, toolUse.params);

    // 显示审批对话框
    const approved = await showApprovalDialog(toolUse);

    return {
      approved,
      denyReason: approved ? undefined : '用户拒绝',
    };
  },
});
```

### ToolUse 参数

```typescript
type ToolUse = {
  name: string;      // 工具名称，如 'bash', 'read'
  params: Record<string, any>;  // 工具参数
  callId: string;    // 调用 ID
};
```

### 返回值类型

```typescript
// 1. 简单布尔值
return true;   // 批准
return false;  // 拒绝

// 2. 对象形式 - 批准
return {
  approved: true
};

// 3. 对象形式 - 拒绝并说明原因
return {
  approved: false,
  denyReason: '安全策略禁止'
};

// 4. 批准但修改参数（如限制命令超时时间）
return {
  approved: true,
  params: {
    ...toolUse.params,
    timeout: 30000,  // 覆盖原始超时设置
  }
};
```

---

## 使用示例

### 1. 默认模式

```typescript
await engine.initialize({
  approvalMode: 'default',  // 大部分操作需要确认
});

const result = await engine.sendMessage({
  message: '创建一个新文件',
  write: true,
  // write 工具会触发确认对话框
});
```

### 2. 自动编辑模式

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',  // 文件操作自动批准
});

const result = await engine.sendMessage({
  message: '重构所有 TypeScript 文件',
  write: true,
  // write/edit 自动执行，bash 仍需确认
});
```

### 3. 根据工具类型自定义

```typescript
await engine.sendMessage({
  message: '优化数据库查询',
  write: true,

  onToolApprove: async (toolUse) => {
    // read 类工具自动批准
    const readTools = ['read', 'grep', 'glob', 'ls', 'bash_output'];
    if (readTools.includes(toolUse.name)) {
      return { approved: true };
    }

    // write 类工具自动批准
    const writeTools = ['write', 'edit'];
    if (writeTools.includes(toolUse.name)) {
      return { approved: true };
    }

    // bash 工具检查危险命令
    if (toolUse.name === 'bash') {
      const cmd = toolUse.params.command;
      const dangerous = ['rm -rf', 'dd', 'mkfs', '> /dev/', 'format'];
      if (dangerous.some(pattern => cmd.includes(pattern))) {
        return {
          approved: false,
          denyReason: '危险命令被拒绝',
        };
      }
    }

    // 其他工具询问用户
    return await askUser(toolUse);
  },
});
```

### 4. Web 应用审批 UI

```typescript
await engine.sendMessage({
  message: userQuery,
  write: true,

  onToolApprove: async (toolUse) => {
    // 显示模态对话框
    const result = await showModal({
      title: `批准 ${toolUse.name}？`,
      content: (
        <div>
          <p>工具: <strong>{toolUse.name}</strong></p>
          <pre>{JSON.stringify(toolUse.params, null, 2)}</pre>
        </div>
      ),
      actions: [
        { label: '批准', value: 'approve', primary: true },
        { label: '拒绝', value: 'deny' },
      ],
    });

    return { approved: result === 'approve' };
  },
});
```

### 5. 带审计日志的审批

```typescript
await engine.sendMessage({
  message: '执行操作',
  write: true,

  onToolApprove: async (toolUse) => {
    const startTime = Date.now();

    // 获取用户决定
    const decision = await askUser(toolUse);

    // 记录审计日志
    await auditLog.create({
      tool: toolUse.name,
      params: toolUse.params,
      approved: decision.approved,
      denyReason: decision.denyReason,
      duration: Date.now() - startTime,
      user: getCurrentUser(),
      timestamp: new Date().toISOString(),
    });

    return decision;
  },
});
```

---

## 最佳实践

### 1. 根据环境选择模式

```typescript
const approvalMode = {
  development: 'autoEdit',   // 开发环境：文件自动批准
  staging: 'default',        // 预发环境：谨慎确认
  production: 'default',     // 生产环境：谨慎确认
}[process.env.NODE_ENV] || 'default';

await engine.initialize({ approvalMode });
```

### 2. 审计日志

```typescript
onToolApprove: async (toolUse) => {
  const decision = await askUser(toolUse);

  await logAudit({
    tool: toolUse.name,
    params: toolUse.params,
    approved: decision.approved,
    timestamp: new Date(),
    user: getCurrentUser(),
  });

  return decision;
}
```

### 3. 错误处理

```typescript
onToolApprove: async (toolUse) => {
  try {
    return await getUserApproval(toolUse);
  } catch (error) {
    console.error('审批错误:', error);
    // 失败时拒绝，确保安全
    return {
      approved: false,
      denyReason: '审批系统错误'
    };
  }
}
```

### 4. 敏感操作额外确认

```typescript
onToolApprove: async (toolUse) => {
  // 生产环境的写操作需要二次确认
  if (process.env.NODE_ENV === 'production') {
    const sensitiveTools = ['bash', 'write', 'edit'];
    if (sensitiveTools.includes(toolUse.name)) {
      const firstConfirm = await askUser(toolUse);
      if (!firstConfirm.approved) return firstConfirm;

      const secondConfirm = await askUser({
        ...toolUse,
        params: {
          message: '⚠️ 生产环境操作，请再次确认',
        },
      });

      return secondConfirm;
    }
  }

  return await askUser(toolUse);
}
```

---

## 更多文档

- **[配置详解](./CONFIG.md)** - 审批模式配置
- **[工具系统](./TOOLS.md)** - 工具分类详解
- **[API 参考](./API.md)** - SendMessageOptions 完整定义
