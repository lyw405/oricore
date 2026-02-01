<div align="center">

# OriCore

**强大的 AI 引擎库，5 行代码构建智能助手**

[![npm version](https://badge.fury.io/js/oricore.svg)](https://www.npmjs.com/package/oricore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [中文文档](README.zh-CN.md)

</div>

---

## 什么是 OriCore？

OriCore 是一个功能完整的 **AI 引擎库**，让你可以轻松地在任何应用中集成强大的 AI 能力。

- 支持 **40+ AI 厂商**（OpenAI、Claude、DeepSeek、智谱等）
- 内置 **完整工具系统**（文件读写、代码搜索、Shell 命令、网络请求）
- **会话管理** + **上下文压缩**
- **MCP 协议** + **Skill 系统** 无限扩展
- **5 种专业交互模式**（头脑风暴、规划、审查、调试、默认）

只需要 **5 行代码**，就能给你的产品加上 AI：

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({ productName: 'MyApp', version: '1.0.0' });
await engine.initialize({ model: 'deepseek/deepseek-chat', provider: { deepseek: { apiKey: 'your-key' } } });

const result = await engine.sendMessage({ message: '帮我分析这个项目的结构', write: true });
console.log(result.data.text);
```

---

## 快速开始

```bash
npm install oricore ai
```

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({ productName: 'MyAIAssistant', version: '1.0.0' });
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: { deepseek: { apiKey: 'your-api-key' } },
});

const result = await engine.sendMessage({
  message: '创建一个 TypeScript 函数来计算斐波那契数列',
  write: true,
});

console.log(result.data.text);
await engine.shutdown();
```

[📖 5分钟上手指南](docs/QUICKSTART.zh-CN.md)

---

## 为什么选择 OriCore？

| 特性 | OriCore | LangChain | Vercel AI SDK | Claude Agent SDK |
|------|---------|-----------|---------------|------------------|
| **多厂商支持** | 40+ 提供商 | 多种提供商 | 通过 AI SDK | 仅 Anthropic |
| **内置工具** | 完整工具集 | 基础工具 | 需自己实现 | 有限 |
| **会话管理** | 持久化 + 上下文压缩 | 需手动实现 | 需自己实现 | |
| **MCP 支持** | 原生集成 | | | |
| **Skill 系统** | 支持本地/GitHub/GitLab | | | |
| **Agent 框架** | 专用 Agent | 复杂抽象 | | 基础 |
| **交互模式** | 5 种专业模式 | | | |

**核心优势：**
- 🎯 专为 AI 助手打造 - 每个功能都针对真实助手场景设计
- 🔧 完整的工具系统 - 生产就绪的工具集，开箱即用
- 🔄 MCP & Skill 双扩展 - 连接任何 MCP 服务器，加载自定义技能
- 🧠 专业交互模式 - 针对不同任务优化的模式
- 💾 生产级会话管理 - 持久化、压缩、成本追踪全部内置

---

## 内置工具

| 工具 | 功能 |
|------|------|
| `read` | 读取文件（支持文本、图片、PDF） |
| `write` | 写入文件 |
| `edit` | 编辑文件（搜索替换） |
| `glob` | 按模式查找文件 |
| `grep` | 搜索文件内容 |
| `bash` | 执行 Shell 命令 |
| `fetch` | 发起 HTTP 请求 |
| `task` | 启动专用 Agent |
| `todo` | 跟踪任务进度 |
| `askUserQuestion` | 与用户交互问答 |

[📖 工具系统详解](docs/TOOLS.md)

---

## 使用场景

- **构建自定义 AI 助手** - 聊天机器人、客服系统
- **IDE 集成** - 代码助手、智能补全
- **代码审查** - 自动化代码审查系统
- **调试工具** - 智能错误诊断
- **教育平台** - 编程教学助手
- **文档生成** - 自动化文档生成

---

## 文档导航

### 新手入门
- **[5分钟上手](docs/QUICKSTART.md)** - 快速了解 OriCore
- **[场景教程](docs/TUTORIALS.md)** - 实战示例

### 核心功能
- **[API 参考](docs/API.md)** - 完整的 API 文档
- **[配置详解](docs/CONFIG.md)** - 所有配置选项
- **[工具系统](docs/TOOLS.md)** - 内置工具详解
- **[交互模式](docs/MODES.md)** - 5 种专业模式

### 高级功能
- **[会话管理](docs/SESSIONS.md)** - 持久化与上下文压缩
- **[事件系统](docs/EVENTS.md)** - 消息总线与事件
- **[MCP 集成](docs/MCP.md)** - MCP 协议支持
- **[Skill 系统](docs/SKILLS.md)** - 自定义技能加载
- **[审批系统](docs/APPROVAL.md)** - 工具执行权限控制

---

## 许可证

MIT © [lyw405](https://github.com/lyw405)

---

## 支持

- **GitHub**: [lyw405/oricore](https://github.com/lyw405/oricore)
- **问题反馈**: [Issues](https://github.com/lyw405/oricore/issues)
