<div align="center">

# OriCore

**强大的独立 AI 引擎，支持多模型、工具调用和可扩展架构**

[![npm version](https://badge.fury.io/js/oricore.svg)](https://www.npmjs.com/package/oricore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [中文文档](README.zh-CN.md)

</div>

## 关于 OriCore

OriCore 是一个全面的 AI 引擎，为构建智能助手提供核心功能。它拥有丰富的工具集、多模型支持，以及通过 MCP（模型上下文协议）和 Skills 实现的可扩展架构。

### 核心特性

- **多模型支持**：兼容 40+ AI 提供商，包括 OpenAI、Anthropic、Google、DeepSeek 等
- **丰富的工具系统**：内置文件操作（读、写、编辑）、代码搜索（grep、glob）、Shell 命令和 Web 请求工具
- **交互模式**：针对不同任务的专用模式 - 头脑风暴、规划、代码审查、调试和默认模式
- **MCP 集成**：通过模型上下文协议扩展自定义工具和功能
- **技能系统**：从本地或远程源（GitHub、GitLab）加载和使用自定义技能
- **Agent 框架**：用于复杂多步骤任务的内置 Agent（探索、通用）
- **会话管理**：持久的对话历史，支持会话恢复
- **流式支持**：实时文本增量流式传输，提供响应式交互
- **完整的类型支持**：全面的 TypeScript 支持和类型定义
- **零配置**：使用合理的默认值即可开箱即用

### 使用场景

- 构建自定义 AI 助手
- 将 AI 功能集成到 IDE 扩展中
- 创建自动化代码审查系统
- 开发智能调试工具
- 构建教育平台
- 实现自动化文档生成

## 安装

```bash
npm install oricore
```

```bash
# 使用 pnpm
pnpm add oricore

# 使用 bun
bun add oricore
```

### 可选依赖

OriCore 支持通过可选依赖来扩展功能：

**PDF 支持**
```bash
npm install pdf-parse
```
安装 `pdf-parse` 后，`read` 工具可以解析 PDF 文件。未安装时，PDF 读取功能将被禁用。

## 快速开始

```typescript
import { createEngine } from 'oricore';

// 1. 创建引擎
const engine = createEngine({
  productName: 'MyAIAssistant',
  version: '1.0.0',
});

// 2. 初始化模型和 API Key
await engine.initialize({
  model: 'openai/gpt-5.2-codex',
  provider: {
    openai: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.openai.com/v1',
    },
  },
});

// 3. 发送消息
const result = await engine.sendMessage({
  message: '创建一个 TypeScript 函数来计算斐波那契数列',
  write: true,
});

console.log(result.data.text);

// 4. 清理
await engine.shutdown();
```

## 交互模式

OriCore 提供针对不同任务的专用模式：

```typescript
// 头脑风暴模式 - 交互式设计探索
engine.setMode('brainstorm');
const design = await engine.sendMessageWithMode('我想构建一个任务管理应用');

// 计划模式 - 创建实施计划
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('制定用户认证系统的实施计划');

// 审查模式 - 代码审查和分析
engine.setMode('review');
const review = await engine.sendMessageWithMode('审查这段代码的性能');

// 调试模式 - 故障排除
engine.setMode('debug');
const fix = await engine.sendMessageWithMode('帮我调试这个错误');
```

## 内置工具

OriCore 包含一套完整的工具：

| 工具 | 描述 |
|------|------|
| `read` | 读取文件内容（支持文本、图片和 PDF*） |
| `write` | 写入新文件 |
| `edit` | 编辑现有文件（搜索/替换） |
| `glob` | 按模式查找文件 |
| `grep` | 搜索文件内容 |
| `bash` | 执行 Shell 命令 |
| `fetch` | 发起 HTTP 请求 |
| `askUserQuestion` | 与用户交互式问答 |
| `task` | 启动专用 Agent |
| `todo` | 跟踪任务进度 |

*PDF 支持需要安装可选的 `pdf-parse` 包（见上文）

## 配置

### 完整配置示例

```typescript
await engine.initialize({
  model: 'openai/gpt-5.2-codex',
  planModel: 'openai/gpt-5.2-codex',
  approvalMode: 'autoEdit',
  language: 'zh-CN',
  tools: {
    read: true,
    write: true,
    bash: true,
  },
  provider: {
    openai: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.openai.com/v1',
    },
  },
});
```

### 支持的提供商

| 提供商 | 模型示例 | API 地址 |
|----------|---------------|--------------|
| OpenAI | `openai/gpt-5.2-codex` | `https://api.openai.com/v1` |
| Anthropic | `anthropic/claude-opus-4-5` | `https://api.anthropic.com` |
| Google | `google/gemini-3-flash-preview` | `https://generativelanguage.googleapis.com` |
| DeepSeek | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| 智谱 AI | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |

更多配置选项请参阅 [USAGE.zh-CN.md](./USAGE.zh-CN.md)。

**工具审批系统：** 有关审批系统的详细信息，包括审批模式（`default`、`autoEdit`、`yolo`）、自定义审批处理程序和最佳实践，请参阅 [APPROVAL.zh-CN.md](./APPROVAL.zh-CN.md)。

## 项目结构

```
oricore/
├── src/
│   ├── api/           # 核心 API
│   ├── core/          # 核心功能（循环、上下文、配置）
│   ├── tools/         # 内置工具
│   ├── modes/         # 交互模式
│   ├── mcp/           # MCP 集成
│   ├── skill/         # 技能系统
│   ├── agent/         # Agent 框架
│   ├── session/       # 会话管理
│   └── utils/         # 工具函数
├── examples/          # 使用示例
└── dist/              # 编译输出
```

## 声明

本项目参考了以下优秀项目的核心架构：
- **[neovate-code](https://github.com/neovateai/neovate-code)** - 核心 AI 引擎架构

OriCore 在此基础上进行了重新封装和精简，移除了 UI、CLI 等周边功能，专注于提供一个轻量、独立的 AI 引擎库，可轻松集成到任何项目中。

## 许可证

MIT © [lyw405](https://github.com/lyw405)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题或建议，请访问 [GitHub Issues](https://github.com/lyw405/oricore/issues)。
