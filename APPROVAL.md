# Tool Approval System

[English](APPROVAL.md) | [中文文档](APPROVAL.zh-CN.md)

## Table of Contents

- [Overview](#overview)
- [Approval Modes](#approval-modes)
- [Approval Flow](#approval-flow)
- [Usage Examples](#usage-examples)
- [Tool Categories](#tool-categories)
- [Custom Approval Handler](#custom-approval-handler)
- [Best Practices](#best-practices)

---

## Overview

OriCore provides a flexible tool approval system that controls when and how AI assistant can execute tools. You can use built-in approval modes or implement custom approval logic.

### Why Approval Matters

- **Security**: Prevent accidental execution of dangerous commands
- **Transparency**: Show users what operations are being performed
- **Control**: Give users granular control over AI behavior
- **Trust**: Build user confidence through visibility

---

## Approval Modes

OriCore supports three built-in approval modes:

### 1. `default` Mode

**Most operations require manual approval**

```typescript
await engine.initialize({
  approvalMode: 'default',
});
```

**Behavior:**
- ✅ Read operations (read, grep, glob): Auto-approved
- ❌ Write operations (write, edit): Requires approval
- ❌ Commands (bash): Requires approval
- ❌ Network requests (fetch): Requires approval
- ❌ User questions (askUserQuestion): Always requires user input

**Best for:** Production environments, cautious users, learning the system

### 2. `autoEdit` Mode

**Auto-approve file edits, ask for other operations**

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',
});
```

**Behavior:**
- ✅ Read operations: Auto-approved
- ✅ Write operations: Auto-approved
- ❌ Commands (bash): Requires approval
- ❌ Network requests (fetch): Requires approval
- ❌ User questions: Always requires user input

**Best for:** Development workflows, code refactoring tasks

### 3. `yolo` Mode

**Auto-approve everything except user questions**

```typescript
await engine.initialize({
  approvalMode: 'yolo',
});
```

**Behavior:**
- ✅ Read operations: Auto-approved
- ✅ Write operations: Auto-approved
- ✅ Commands: Auto-approved (except high-risk commands)
- ✅ Network requests: Auto-approved
- ❌ User questions: Always requires user input

**Best for:** Trusted environments, automated workflows, experienced users

---

## Approval Flow

The approval system follows a priority order. Each step can auto-approve tools before reaching the next step.

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Check yolo mode                                         │
│   if (approvalMode === 'yolo' && category !== 'ask')            │
│     → Auto-approve                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (not auto-approved)
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Check read category                                    │
│   if (category === 'read')                                      │
│     → Auto-approve                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (not auto-approved)
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Check tool's needsApproval                             │
│   if (tool.approval.needsApproval() === false)                 │
│     → Auto-approve                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (not auto-approved)
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Check autoEdit mode for write category                 │
│   if (category === 'write' && approvalMode === 'autoEdit')      │
│     → Auto-approve                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (not auto-approved)
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Check session whitelist                                │
│   if (tool in session.config.approvalTools)                    │
│     → Auto-approve                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (not auto-approved)
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Call custom approval callback                          │
│   result = await onToolApprove(toolUse)                         │
│   → Use callback result                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Important:** If you provide an `onToolApprove` callback, it will **only** be called when steps 1-5 don't auto-approve the tool.

---

## Usage Examples

### Example 1: Simple Default Mode

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
  approvalMode: 'default', // Manual approval for most operations
});

const result = await engine.sendMessage({
  message: 'Create a TypeScript function',
  write: true,
  // You'll be prompted to approve write operations
});

console.log(result.data.text);
```

### Example 2: AutoEdit for Development

```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
  approvalMode: 'autoEdit', // Auto-approve file edits
});

const result = await engine.sendMessage({
  message: 'Refactor all TypeScript files to use const',
  write: true,
  // File edits are auto-approved, but bash commands need approval
});
```

### Example 3: Yolo Mode for Automation

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  approvalMode: 'yolo', // Auto-approve everything
});

const result = await engine.sendMessage({
  message: 'Analyze codebase and create documentation',
  write: true,
  // All operations auto-approved except user questions
});
```

### Example 4: Custom Approval Handler

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  approvalMode: 'default', // Set default behavior
});

const result = await engine.sendMessage({
  message: 'Clean up temporary files',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`[Approval] Tool: ${toolUse.name}`);
    console.log(`[Params]`, JSON.stringify(toolUse.params, null, 2));

    // Show approval UI to user
    process.stdout.write(`\nApprove ${toolUse.name}? (y/n): `);

    // Read user input
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
    console.log(approved ? '✅ Approved' : '❌ Denied');

    return {
      approved,
      denyReason: approved ? undefined : 'User denied'
    };
  },
});
```

### Example 5: Web Application Approval

```typescript
await engine.sendMessage({
  message: userQuery,
  write: true,

  onToolApprove: async (toolUse) => {
    // Show a modal dialog in web UI
    const result = await showModal({
      title: `Approve ${toolUse.name}?`,
      content: (
        <div>
          <p>Tool: {toolUse.name}</p>
          <pre>{JSON.stringify(toolUse.params, null, 2)}</pre>
        </div>
      ),
      actions: [
        { label: 'Approve', value: 'approve' },
        { label: 'Deny', value: 'deny' },
      ],
    });

    return {
      approved: result === 'approve',
    };
  },
});
```

### Example 6: Conditional Approval Logic

```typescript
await engine.sendMessage({
  message: 'Optimize the database queries',
  write: true,

  onToolApprove: async (toolUse) => {
    // Always approve read operations
    if (toolUse.name === 'read' || toolUse.name === 'grep') {
      return { approved: true };
    }

    // Check bash commands for dangerous patterns
    if (toolUse.name === 'bash') {
      const command = toolUse.params.command as string;

      // Block dangerous commands
      if (command.includes('rm -rf') || command.includes('> /dev')) {
        return {
          approved: false,
          denyReason: 'Dangerous command detected',
        };
      }

      // Allow safe commands
      if (command.startsWith('git') || command.startsWith('ls')) {
        return { approved: true };
      }
    }

    // Ask user for other operations
    const confirmed = await showConfirmDialog({
      message: `Allow ${toolUse.name}?`,
      details: toolUse.params,
    });

    return { approved: confirmed };
  },
});
```

---

## Tool Categories

Each tool has a `category` that affects approval behavior:

| Category | Tools | Description |
|----------|-------|-------------|
| `read` | read, grep, glob, ls, bash_output, todo, task, skill | Read-only operations |
| `write` | write, edit | File modification operations |
| `command` | bash, kill_bash | Shell command execution |
| `network` | fetch | Network requests |
| `ask` | askUserQuestion | User interaction (always requires input) |

### Tool-Specific Approval Logic

Some tools have custom `needsApproval` logic:

**Bash Tool:**
```typescript
approval: {
  category: 'command',
  needsApproval: async (context) => {
    const { params, approvalMode } = context;
    const command = params.command as string;

    // High-risk commands always require approval
    if (isHighRiskCommand(command)) {
      return true;
    }

    // Banned commands are always rejected
    if (isBannedCommand(command)) {
      return true; // Will be denied
    }

    // Other commands respect approval mode
    return approvalMode !== 'yolo';
  },
}
```

---

## Custom Approval Handler

### Approval Callback Signature

```typescript
type ApprovalCallback = (toolUse: ToolUse) => Promise<ToolApprovalResult>;

interface ToolUse {
  name: string;        // Tool name (e.g., 'bash', 'write')
  params: Record<string, any>;  // Tool parameters
  callId: string;      // Unique call ID
}

type ToolApprovalResult =
  | boolean  // true = approved, false = denied
  | {
      approved: boolean;
      params?: Record<string, any>;  // Optional modified params
      denyReason?: string;  // Optional reason for denial
    };
```

### Advanced: Session Context with MessageBus

When using the `task` tool with agent subtasks, approval requests are sent via `MessageBus` with additional session context:

```typescript
// Agent tool approval via MessageBus (used internally)
const result = await messageBus.request('toolApproval', {
  toolUse: { name: 'bash', params: { command: 'ls' }, callId: '123' },
  category: 'command',
  sessionId: 'session-abc'  // Session ID for multi-session management
});
```

#### Registering a MessageBus Handler

```typescript
messageBus.registerHandler('toolApproval', async ({ toolUse, category, sessionId }) => {
  // sessionId enables:
  // 1. Session-specific logging: console.log(`[${sessionId}] Approval for ${toolUse.name}`)
  // 2. UI routing: Route approval dialog to the correct session window
  // 3. Multi-session management: Track approvals per session
  // 4. Session-level policies: Apply different rules per session

  console.log(`Session ${sessionId} requesting approval for ${toolUse.name}`);

  // Show approval UI
  const approved = await showApprovalDialog({
    tool: toolUse.name,
    params: toolUse.params,
    sessionId: sessionId  // Highlight which session initiated the request
  });

  return {
    approved,
    params: toolUse.params,
    denyReason: approved ? undefined : 'User denied'
  };
});
```

#### Backward Compatibility

Handlers that don't use `sessionId` remain compatible:

```typescript
// Old handler (still works)
messageBus.registerHandler('toolApproval', async ({ toolUse, category }) => {
  // sessionId is simply ignored
  return { approved: true };
});
```

### Return Values

```typescript
// Simple boolean
return true;   // Approved
return false;  // Denied

// Object with details
return {
  approved: true
};

return {
  approved: false,
  denyReason: 'Security policy violation'
};

// Approve with modified parameters
return {
  approved: true,
  params: {
    ...toolUse.params,
    // Modified parameters
  }
};
```

---

## Best Practices

### 1. Choose the Right Mode

```typescript
// ✅ Good: Match mode to use case
// Development workflow
approvalMode: 'autoEdit'

// Production with oversight
approvalMode: 'default'

// Trusted automation
approvalMode: 'yolo'
```

### 2. Implement Progressive Approval

```typescript
// ✅ Good: Start strict, relax over time
const approvalConfig = {
  newProject: 'default',
  trustedProject: 'autoEdit',
  automated: 'yolo',
};

await engine.initialize({
  approvalMode: approvalConfig[getTrustLevel(project)],
});
```

### 3. Provide Clear Feedback

```typescript
// ✅ Good: Show users what's happening
onToolApprove: async (toolUse) => {
  const result = await showApprovalUI({
    title: `Execute ${toolUse.name}?`,
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

### 4. Handle Errors Gracefully

```typescript
// ✅ Good: Handle approval failures
onToolApprove: async (toolUse) => {
  try {
    const approved = await getUserApproval(toolUse);
    return { approved };
  } catch (error) {
    console.error('Approval error:', error);
    // Fail closed for safety
    return {
      approved: false,
      denyReason: 'Approval system error'
    };
  }
}
```

### 5. Log Approval Decisions

```typescript
// ✅ Good: Maintain audit trail
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

### 6. Consider Context

```typescript
// ✅ Good: Adjust behavior based on context
onToolApprove: async (toolUse) => {
  // Auto-approve in test environment
  if (process.env.NODE_ENV === 'test') {
    return { approved: true };
  }

  // Require approval for production
  if (process.env.NODE_ENV === 'production') {
    return await requireProductionApproval(toolUse);
  }

  // Default behavior
  return await askUser(toolUse);
}
```

---

## Summary

| Feature | Description |
|---------|-------------|
| **Modes** | `default`, `autoEdit`, `yolo` |
| **Flow** | 6-step priority system |
| **Customization** | `onToolApprove` callback |
| **Categories** | `read`, `write`, `command`, `network`, `ask` |
| **Best For** | Security, transparency, control |

For more information, see:
- [USAGE.md](USAGE.md) - General usage guide
- [README.md](README.md) - Project overview
