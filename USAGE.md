# OriCore 使用指南

## 项目概述

OriCore 是一个完全独立的 AI 编码引擎包，从 neovate-code以及claude code 项目中提取出来。它提供了核心的 AI 编程助手功能，可以在任何 Node.js/Bun 项目中使用。

## 安装

```bash
# 使用 npm
npm install oricore ai

# 使用 pnpm
pnpm add oricore ai

# 使用 bun
bun add oricore ai
```

## 快速开始

```typescript
import { createEngine } from 'oricore';

async function main() {
  // 创建引擎实例
  const engine = createEngine({
    productName: 'MyApp',
    version: '1.0.0',
  });

  // 初始化引擎
  await engine.initialize({
    model: 'openai/gpt-4o', // 或其他支持的模型
  });

  // 发送消息
  const result = await engine.sendMessage({
    message: '解释一下 TypeScript 的泛型',
    write: false,
  });

  if (result.success) {
    console.log('AI 回复:', result.response);
  }

  // 关闭引擎
  await engine.shutdown();
}

main().catch(console.error);
```

## 核心功能

### 1. 多轮对话

引擎支持多轮对话，AI 可以连续调用工具直到任务完成：

```typescript
const result = await engine.sendMessage({
  message: '帮我创建一个 TypeScript 函数来计算斐波那契数列',
  write: true, // 允许 AI 写入文件
});
```

### 2. 模式系统

内置 5 种 AI 交互模式：

```typescript
// 头脑风暴模式 - 交互式设计
engine.setMode('brainstorm');
const brainstormResult = await engine.sendMessageWithMode(
  '我想构建一个待办事项应用',
  {
    onToolApprove: async (toolUse) => {
      // 处理 AI 的提问
      if (toolUse.name === 'askUserQuestion') {
        const questions = toolUse.params.questions;
        // 收集用户答案...
        return { approved: true, params: { ...toolUse.params, answers } };
      }
      return { approved: true };
    },
  }
);

// 计划模式
engine.setMode('plan');
await engine.sendMessageWithMode('制定用户认证系统的实现计划');

// 代码审查模式
engine.setMode('review');
await engine.sendMessageWithMode('审查这段代码的性能');

// 调试模式
engine.setMode('debug');
await engine.sendMessageWithMode('帮我调试这个错误');

// 默认模式
engine.setMode('default');
```

### 3. 流式响应

```typescript
const result = await engine.sendMessage({
  message: '解释 React 的 useEffect',
  write: false,
  onTextDelta: async (text) => {
    // 实时流式输出
    process.stdout.write(text);
  },
});
```

### 4. 自定义模式

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript 专家',
  description: '专注于 TypeScript 开发',
  config: {
    systemPrompt: '你是一个 TypeScript 专家...',
    write: false,
    askUserQuestion: false,
    maxTurns: 10,
  },
});

engine.setMode('typescript-expert');
```

## 模型配置

### 通过环境变量

```bash
export OPENAI_API_KEY=sk-xxx
export ANTHROPIC_API_KEY=sk-ant-xxx
```

### 通过 initialize 配置

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  planModel: 'anthropic/claude-3-5-sonnet-20241022',

  // 自定义提供商
  providers: {
    'my-provider': {
      api: 'https://my-api.example.com/v1',
      env: ['MY_API_KEY'],
      models: {
        'my-model': 'gpt-4',
      },
    },
  },
});
```

### 支持的提供商

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Haiku, Opus)
- Google (Gemini Pro)
- OpenRouter
- xAI (Grok)
- Cerebras
- HuggingFace
- 自定义 OpenAI 兼容 API

## 工具系统

引擎内置以下工具：

- `read` - 读取文件
- `write` - 写入文件
- `edit` - 编辑文件（基于 diff）
- `bash` - 执行 shell 命令
- `grep` - 搜索文件内容
- `glob` - 查找文件
- `fetch` - HTTP 请求
- `ask` - 简单问答

## 事件系统

```typescript
const messageBus = engine.getMessageBus();

// 监听事件
messageBus.onEvent('tool:start', (data) => {
  console.log('工具开始执行:', data.tool);
});

messageBus.onEvent('tool:end', (data) => {
  console.log('工具执行完成:', data.tool);
});

messageBus.onEvent('error', (error) => {
  console.error('发生错误:', error);
});
```

## CLI 工具

安装后可以使用内置 CLI：

```bash
# 基本使用
oricore "解释一下 async/await"

# 使用特定模式
oricore --mode brainstorm "设计一个博客系统"

# 简单问答
oricore --ask "什么是 TypeScript？"

# 列出所有模式
oricore --list-modes
```

## API 参考

### Engine

```typescript
class Engine {
  // 创建引擎实例
  constructor(options: EngineOptions)

  // 初始化
  async initialize(config: EngineConfig): Promise<void>

  // 发送消息（使用当前模式）
  async sendMessage(options: SendMessageOptions): Promise<LoopResult>

  // 发送消息（指定模式）
  async sendMessageWithMode(
    message: string,
    options?: Partial<SendMessageOptions>
  ): Promise<LoopResult>

  // 简单问答
  async ask(question: string): Promise<string>

  // 模式管理
  setMode(mode: ModeType): void
  getMode(): ModeType
  getAvailableModes(): Mode[]
  registerMode(mode: Mode): void

  // 工具管理
  async getTools(): Promise<Tool[]>

  // 事件系统
  getMessageBus(): MessageBus

  // 生命周期
  async shutdown(): Promise<void>
}
```

### 类型定义

```typescript
interface EngineOptions {
  productName: string;
  productASCIIArt?: string;
  version: string;
  cwd?: string;
  platform?: PlatformAdapter;
  messageBus?: MessageBus;
}

interface EngineConfig {
  model?: string;
  planModel?: string;
  approvalMode?: ApprovalMode;
  mcpServers?: Record<string, MCPConfig>;
  tools?: Record<string, boolean>;
  providers?: Record<string, ProviderConfig>;
}

interface SendMessageOptions {
  message: string | NormalizedMessage[];
  write?: boolean;
  todo?: boolean;
  askUserQuestion?: boolean;
  systemPrompt?: string;
  onTextDelta?: (text: string) => Promise<void>;
  onText?: (text: string) => Promise<void>;
  onTurn?: (turn: Turn) => Promise<void>;
  onToolApprove?: (toolUse: ToolUse) => Promise<ToolApproval>;
}
```

## 完整示例

```typescript
import { createEngine } from 'oricore';

async function codeAssistant() {
  const engine = createEngine({
    productName: 'CodeAssistant',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'openai/gpt-4o',
  });

  // 交互式头脑风暴
  engine.setMode('brainstorm');

  const result = await engine.sendMessageWithMode(
    '帮我设计一个用户认证系统',
    {
      onTextDelta: async (text) => {
        process.stdout.write(text);
      },
      onToolApprove: async (toolUse) => {
        if (toolUse.name === 'askUserQuestion') {
          const questions = toolUse.params.questions;

          console.log('\n\nAI 提出了以下问题：');
          for (const q of questions) {
            console.log(`\n[${q.header}]`);
            console.log(`  ${q.question}`);
            q.options.forEach((o, i) => {
              console.log(`  ${i + 1}. ${o.label}`);
            });
          }

          // 这里可以收集用户输入
          // 为了示例，我们自动选择第一个选项
          const answers = questions.map(q => ({
            question: q.question,
            answer: q.options[0].label,
          }));

          return {
            approved: true,
            params: { ...toolUse.params, answers },
          };
        }

        // 自动批准其他工具
        return { approved: true };
      },
    }
  );

  if (result.success) {
    console.log('\n\n✓ 设计完成！');
  } else {
    console.error('\n✗ 错误:', result.error.message);
  }

  await engine.shutdown();
}

codeAssistant().catch(console.error);
```

## 配置优先级

模型配置的优先级（从低到高）：

1. 环境变量 (最低)
2. 配置文件 (~/.productName/config.json)
3. initialize 配置
4. 自定义 provider (最高)

## 注意事项

1. **依赖**: 需要安装 `ai` 包作为 peer dependency
2. **Node 版本**: 需要 Node.js 18+
3. **API 密钥**: 使用前需要配置相应的 API 密钥
4. **文件操作**: 启用 `write: true` 时，AI 可以修改文件系统
5. **模式选择**: 不同模式有不同的行为，选择合适的模式很重要

## 项目结构

```
oricore/
├── src/
│   ├── api/           # 公共 API
│   ├── core/          # 核心逻辑
│   ├── modes/         # 模式系统
│   ├── tools/         # 工具系统
│   ├── platform/      # 平台抽象
│   ├── mcp/           # MCP 集成
│   ├── agent/         # Agent 系统
│   ├── skill/         # 技能系统
│   ├── communication/ # 通信层
│   └── utils/         # 工具函数
├── examples/          # 示例代码
├── test/             # 测试
└── dist/             # 构建输出
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
