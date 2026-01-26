# OriCore 使用指南

[English](USAGE.md) | [中文文档](USAGE.zh-CN.md)

## 目录

- [快速开始](#快速开始)
- [模型提供商](#模型提供商)
- [配置选项](#配置选项)
- [工具审批系统](#工具审批系统)
- [MCP 集成](#mcp-集成)
- [技能系统](#技能系统)
- [自定义模式](#自定义模式)
- [会话管理](#会话管理)
- [流式响应](#流式响应)
- [错误处理](#错误处理)

---

## 快速开始

```typescript
import { createEngine } from 'oricore';

// 1. 创建引擎
const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

// 2. 初始化模型和 API Key
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});

// 3. 使用
const result = await engine.sendMessage({
  message: '帮我创建一个 TypeScript 函数',
  write: true,
});

console.log(result.data.text);

// 4. 清理
await engine.shutdown();
```

---

## 模型提供商

### 支持的提供商

| 提供商 | 模型格式 | API 地址 |
|----------|--------------|--------------|
| **智谱 AI** | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |
| **DeepSeek** | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| **OpenAI** | `openai/gpt-4o` | `https://api.openai.com/v1` |
| **Anthropic** | `anthropic/claude-sonnet-4` | `https://api.anthropic.com` |
| **Google** | `google/gemini-2.5-flash` | `https://generativelanguage.googleapis.com` |
| **Moonshot (Kimi)** | `moonshotai/kimi-k2` | `https://api.moonshot.cn/v1` |
| **Qwen (通义千问)** | `qwen/qwen3-max` | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

### 配置示例

**智谱 AI (Zhipu)**
```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: 'your-zhipu-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

**DeepSeek**
```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      apiKey: 'your-deepseek-api-key',
      baseURL: 'https://api.deepseek.com',
    },
  },
});
```

**OpenAI**
```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: 'your-openai-api-key',
      baseURL: 'https://api.openai.com/v1',
    },
  },
});
```

**Anthropic (Claude)**
```typescript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4',
  provider: {
    anthropic: {
      apiKey: 'your-anthropic-api-key',
      baseURL: 'https://api.anthropic.com',
    },
  },
});
```

**Google (Gemini)**
```typescript
await engine.initialize({
  model: 'google/gemini-2.5-flash',
  provider: {
    google: {
      apiKey: 'your-google-api-key',
      baseURL: 'https://generativelanguage.googleapis.com',
    },
  },
});
```

---

## 配置选项

### 可选依赖

OriCore 支持通过可选依赖来扩展功能：

#### PDF 支持

安装 `pdf-parse` 包后，`read` 工具可以解析 PDF 文件：

```bash
npm install pdf-parse
# 或
pnpm add pdf-parse
# 或
bun add pdf-parse
```

**PDF 读取限制：**
- 最大文件大小：5MB
- 最大页数：100
- 每页最大字符数：5,000
- 最大 token 数：15,000

**使用方法：**
```typescript
// 安装 pdf-parse 后，PDF 读取是自动的
const result = await engine.sendMessage({
  message: '阅读并总结 document.pdf',
  write: false,
});

// 如果未安装 pdf-parse，你会收到一个友好的错误提示：
// "PDF parsing requires the 'pdf-parse' package. Install it with: npm install pdf-parse"
```

**支持的 PDF 功能：**
- 文本提取
- 元数据提取（标题、作者、创建日期等）
- 多页文档
- 大文件自动截断

### 完整配置

```typescript
await engine.initialize({
  // 模型选择
  model: 'zhipuai/glm-4.7',
  planModel: 'zhipuai/glm-4.7',

  // 行为设置
  approvalMode: 'autoEdit',  // 'default' | 'autoEdit' | 'yolo'
  language: 'zh-CN',

  // 自定义提示词
  systemPrompt: '你是一个有用的编程助手。',
  appendSystemPrompt: '始终提供类型注解。',

  // 工具开关
  tools: {
    read: true,
    write: true,
    edit: true,
    bash: true,
    grep: true,
    glob: true,
  },

  // 提供商配置
  provider: {
    zhipuai: {
      apiKey: 'your-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

### 工具批准模式

- `default` - 每次工具执行前都询问批准
- `autoEdit` - 自动批准读/编辑工具，其他工具询问
- `yolo` - 自动批准所有工具

**有关审批系统的详细信息，请参阅 [APPROVAL.zh-CN.md](APPROVAL.zh-CN.md)**

---

## 工具审批系统

OriCore 提供了一个灵活的工具审批系统，具有三种内置模式和自定义审批处理程序。

### 快速概览

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',  // 'default' | 'autoEdit' | 'yolo'
});
```

### 审批模式

| 模式 | 读取 | 写入/编辑 | 命令 | 网络 | 用户问题 |
|------|------|-----------|------|-------|----------|
| `default` | ✅ 自动 | ❌ 询问 | ❌ 询问 | ❌ 询问 | ❌ 总是询问 |
| `autoEdit` | ✅ 自动 | ✅ 自动 | ❌ 询问 | ❌ 询问 | ❌ 总是询问 |
| `yolo` | ✅ 自动 | ✅ 自动 | ✅ 自动* | ✅ 自动 | ❌ 总是询问 |

*高危命令仍需批准

### 自定义审批处理程序

要完全控制，请提供 `onToolApprove` 回调：

```typescript
await engine.sendMessage({
  message: '重构代码',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`工具: ${toolUse.name}`);
    console.log(`参数:`, toolUse.params);

    // 向用户显示审批界面
    const approved = await showApprovalDialog(toolUse);

    return {
      approved,
      denyReason: approved ? undefined : '用户拒绝'
    };
  },
});
```

**重要提示：** `onToolApprove` 回调仅在内置审批逻辑未自动批准工具时才会被调用。审批流程遵循以下优先级：

1. **yolo 模式** → 自动批准（除了 `ask` 类别）
2. **read 类别** → 自动批准
3. **工具的 needsApproval** → 检查工具特定逻辑
4. **autoEdit 模式** → 自动批准写入操作
5. **会话白名单** → 自动批准白名单中的工具
6. **自定义回调** → 调用 `onToolApprove`

**请参阅 [APPROVAL.zh-CN.md](APPROVAL.zh-CN.md) 获取完整文档，包括：**
- 详细的审批流程说明
- 所有使用示例
- 工具类别及其行为
- 生产环境最佳实践
- 安全考虑

---

## MCP 集成

### Stdio 传输（本地服务器）

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: { zhipuai: { apiKey: 'your-key' } },
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: 'your-token' },
    },
  },
});
```

### HTTP 传输

```typescript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: { zhipuai: { apiKey: 'your-key' } },
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

---

## 技能系统

### 创建技能

创建 `.oricore/skills/my-skill/SKILL.md`：

```markdown
---
name: code-reviewer
description: TypeScript 项目专家代码审查员
---

你是一个 TypeScript 专家代码审查员。重点关注：
- 类型安全
- 最佳实践
- 性能
- 安全性

提供具有具体示例的建设性反馈。
```

### 从 GitHub 安装技能

```typescript
import { SkillManager } from 'oricore';

const context = engine.getContext();
const skillManager = new SkillManager({ context });

await skillManager.addSkill('github:user/repo', {
  global: false,
  name: 'my-skill',
});
```

---

## 自定义模式

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript 专家',
  description: '专注于 TypeScript 开发',
  config: {
    systemPrompt: '你是一个 TypeScript 专家。始终提供类型化示例。',
    write: true,
    askUserQuestion: true,
    maxTurns: 30,
  },
});

engine.setMode('typescript-expert');

const result = await engine.sendMessageWithMode('帮助设计一个类型安全的 API');
```

### 内置模式

- `default` - 通用编程助手
- `brainstorm` - 带问题的交互式设计
- `plan` - 创建实施计划
- `review` - 代码审查和分析
- `debug` - 故障排除和调试

---

## 会话管理

会话支持跨多次调用的持久化对话。AI 会记住同一会话中之前消息的上下文。

### 在 sendMessage 中使用会话

最简单的方法是向 `sendMessage` 传递 `sessionId`：

```typescript
// 开始新会话
const sessionId = 'my-conversation-' + Date.now();

// 第一条消息 - 建立上下文
await engine.sendMessage({
  sessionId,
  message: '记住我的名字是 Alice',
  write: false,
});

// 继续同一会话 - AI 记得住上下文
const result = await engine.sendMessage({
  sessionId,
  message: '我叫什么名字？',
  write: false,
});

console.log(result.data.text); // "你的名字是 Alice！"
```

### 会话存储

会话会自动持久化到磁盘：
- **全局会话**：`~/.oricore/projects/<格式化路径>/<sessionId>.jsonl`
- **自定义路径**：也可以使用绝对路径或相对路径作为 `sessionId`

### 列出会话

```typescript
// 获取当前项目的所有会话
const sessions = engine.getSessions();

sessions.forEach(session => {
  console.log(`会话: ${session.sessionId}`);
  console.log(`  消息数: ${session.messageCount}`);
  console.log(`  摘要: ${session.summary}`);
  console.log(`  修改时间: ${session.modified}`);
});
```

### 创建会话对象

也可以直接创建会话对象：

```typescript
// 创建新会话
const session = await engine.createSession();
console.log('会话 ID:', session.id);

// 从现有会话 ID 恢复
const session = await engine.createSession({
  resume: 'abc12345',
});

// 恢复最新会话
const session = await engine.createSession({
  continue: true,
});
```

### 会话使用场景

- **多轮对话**：在多个问题之间保持上下文
- **长时任务**：将复杂任务分解为多个步骤
- **团队协作**：与团队成员共享会话 ID
- **调试**：查看存储在 JSONL 文件中的对话历史

---

## 流式响应

```typescript
const result = await engine.sendMessage({
  message: '解释 React Hooks',
  write: false,
  onTextDelta: async (text) => {
    process.stdout.write(text);  // 流式输出
  },
  onToolUse: async (toolUse) => {
    console.log('使用工具:', toolUse.name);
  },
});
```

---

## 错误处理

```typescript
const result = await engine.sendMessage({
  message: '创建一个文件',
  write: true,
});

if (result.success) {
  console.log('成功:', result.data.text);
  console.log('使用的 Token:', result.data.usage);
} else {
  console.error('错误:', result.error.message);
}
```

---

## 支持

更多信息或报告问题，请访问 [GitHub Issues](https://github.com/lyw405/oricore/issues)。
