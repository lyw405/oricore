# 会话管理

OriCore 会话管理完整文档。

[English](SESSIONS.zh-CN.md) | [中文](SESSIONS.zh-CN.zh-CN.md)

---

## 目录

- [会话概览](#会话概览)
- [创建会话](#创建会话)
- [恢复会话](#恢复会话)
- [会话持久化](#会话持久化)
- [会话配置](#会话配置)
- [列出会话](#列出会话)
- [使用场景](#使用场景)
- [上下文压缩](#上下文压缩)
- [使用追踪](#使用追踪)

---

## 会话概览

会话（Session）是 OriCore 管理多轮对话的核心机制。通过会话，AI 可以记住之前的对话内容，实现上下文连续的多轮交互。

### 核心特性

- **持久化存储** - 会话自动保存到磁盘
- **上下文记忆** - AI 记住之前的对话
- **会话恢复** - 可从中断处继续
- **Token 追踪** - 自动追踪使用量
- **上下文压缩** - 自动压缩长对话

---

## 创建会话

### 方法 1：使用 sendMessage

最简单的方式是传入 `sessionId`：

```typescript
const sessionId = 'my-session-' + Date.now();

await engine.sendMessage({
  sessionId,
  message: '我叫 Alice',
  write: false,
});

// AI 记住了名字
const result = await engine.sendMessage({
  sessionId,
  message: '我叫什么名字？',
  write: false,
});

console.log(result.data.text);  // "你的名字是 Alice！"
```

### 方法 2：创建 Session 对象

```typescript
// 创建新会话
const session = await engine.createSession();
console.log('Session ID:', session.id);

// 使用会话
await engine.sendMessage({
  sessionId: session.id,
  message: '记住：我正在学习 TypeScript',
  write: false,
});
```

---

## 恢复会话

### SessionOptions

创建或恢复会话时可以使用以下选项：

```typescript
interface SessionOptions {
  sessionId?: string;     // 会话 ID（不提供则自动生成）
  resume?: string;        // 从指定会话 ID 恢复
  continue?: boolean;     // 继续最新的会话
}
```

### 通过 ID 恢复

```typescript
const session = await engine.createSession({
  resume: 'abc123def456',
});

console.log('已恢复会话:', session.id);
```

### 恢复最新会话

```typescript
const session = await engine.createSession({
  continue: true,
});

console.log('已恢复最新会话:', session.id);
```

### 继续已有会话

```typescript
// 直接使用已有的 sessionId 继续对话
await engine.sendMessage({
  sessionId: 'abc123def456',
  message: '继续之前的对话',
  write: false,
});
```

---

## 会话持久化

### 存储位置

会话自动保存到以下位置：

| 类型 | 路径 |
|------|------|
| 会话文件 | `~/.oricore/projects/<formatted-cwd>/<sessionId>.jsonl` |

**说明**：
- `<formatted-cwd>` 是当前工作目录的格式化版本（路径分隔符转换为 `-`，全小写）
- 如果 `sessionId` 以 `.` 开头或以 `.jsonl` 结尾，则使用相对路径

### JSONL 格式

每个会话存储为一个 JSONL 文件，包含两种类型的记录：

**1. 配置记录**（config）
```jsonl
{"type":"config","config":{...},"mode":"review"}
```

**2. 消息记录**（message）
```jsonl
{"type":"message","role":"user","content":"我叫 Alice"}
{"type":"message","role":"assistant","content":"你好 Alice！"}
{"type":"message","role":"user","content":"我叫什么名字？"}
{"type":"message","role":"assistant","content":"你的名字是 Alice！"}
```

**说明**：
- 每个会话文件以配置记录开始（包含会话配置和模式）
- 后续行都是消息记录
- 使用文件锁保证并发访问安全

---

## 会话配置

### SessionConfig

每个会话可以有自己的配置：

```typescript
interface SessionConfig {
  model?: string;                  // 使用的模型
  approvalMode?: ApprovalMode;     // 审批模式
  approvalTools: string[];         // 自动批准的工具列表（默认：[]）
  summary?: string;                // 会话摘要
  pastedTextMap?: Record<string, string>;   // 粘贴的文本（默认：{}）
  pastedImageMap?: Record<string, string>;  // 粘贴的图片（默认：{}）
  additionalDirectories?: string[];         // 额外的目录（默认：[]）
}
```

**默认配置**：
```typescript
{
  approvalMode: 'default',
  approvalTools: [],
  pastedTextMap: {},
  pastedImageMap: {},
  additionalDirectories: [],
}
```

### 会话模式

OriCore 支持不同的交互模式，模式通过引擎设置：

```typescript
// 设置当前交互模式
engine.setMode('review');

// 创建会话并使用当前模式
const session = await engine.createSession();

// 会话会继承引擎当前的模式配置
```

---

## 列出会话

### 获取所有会话

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

### SessionInfo

```typescript
interface SessionInfo {
  sessionId: string;       // 会话 ID
  messageCount: number;    // 消息数量
  summary: string;         // 会话摘要
  created: Date;           // 创建时间
  modified: Date;          // 修改时间
}
```

---

## 使用场景

### 1. 多轮对话

```typescript
const sessionId = 'conversation-' + Date.now();

await engine.sendMessage({
  sessionId,
  message: '帮我设计一个 REST API',
  write: false,
});

await engine.sendMessage({
  sessionId,
  message: '添加用户认证接口',
  write: false,
});

// AI 记住了之前的设计
await engine.sendMessage({
  sessionId,
  message: '现在给用户认证接口写测试',
  write: true,
});
```

### 2. 长任务拆分

```typescript
const sessionId = 'task-' + Date.now();

// 第一步
await engine.sendMessage({
  sessionId,
  message: '分析项目结构',
  write: false,
});

// 第二步 - AI 记住了项目结构
await engine.sendMessage({
  sessionId,
  message: '根据分析结果，重构 utils 目录',
  write: true,
});
```

### 3. 协作场景

```typescript
// 分享 sessionId 给团队成员
const sessionId = 'team-collaboration';

// 成员 A
await engine.sendMessage({
  sessionId,
  message: '记录：项目使用 TypeScript，目标优化性能',
  write: false,
});

// 成员 B - 可以看到之前的讨论
await engine.sendMessage({
  sessionId,
  message: '基于之前的讨论，我建议使用 Redis',
  write: false,
});
```

### 4. 调试会话历史

会话文件可以直接查看和调试：

```bash
# 列出所有项目的会话目录
ls ~/.oricore/projects/

# 查看特定会话文件
cat ~/.oricore/projects/formatted-project-path/session-id.jsonl

# 使用 jq 格式化查看（每行一个 JSON 对象）
jq . ~/.oricore/projects/formatted-project-path/session-id.jsonl

# 只查看消息记录
grep '"type":"message"' ~/.oricore/projects/formatted-project-path/session-id.jsonl | jq .
```

**说明**：项目路径会被格式化（路径分隔符转换为 `-`，全小写）

---

## 上下文压缩

当对话变长时，OriCore 会自动压缩上下文：

- **智能摘要** - 保留关键信息
- **Token 节省** - 降低 API 成本
- **自动触发** - 超过阈值时自动压缩

上下文压缩通过配置文件或模式设置启用。不同模式有不同的压缩策略：
- **plan 模式** - 禁用压缩，保留完整上下文
- **review 模式** - 启用压缩
- **default 模式** - 启用压缩

---

## 使用追踪

### 获取使用量

每次调用 `sendMessage` 的返回值中包含 Token 使用情况：

```typescript
const result = await engine.sendMessage({
  sessionId: 'my-session',
  message: '你好',
  write: false,
});

if (result.success) {
  console.log('Token 使用:', result.data.usage);
  // { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
}
```

### Usage 类型

```typescript
class Usage {
  promptTokens: number;     // 输入 Token 数量
  completionTokens: number; // 输出 Token 数量
  totalTokens: number;      // 总 Token 数量
}
```

---

## 更多文档

- **[API 参考](./API.md)** - 会话相关 API
- **[配置详解](./CONFIG.md)** - 配置选项
- **[工具系统](./TOOLS.md)** - 工具使用
