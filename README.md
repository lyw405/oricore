<div align="center">

# OriCore

**A powerful, standalone AI coding engine with multi-model support, tool calling, and extensible architecture**

[![npm version](https://badge.fury.io/js/oricore.svg)](https://www.npmjs.com/package/oricore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## Features

- 🤖 **Multi-Model Support**: OpenAI, Anthropic, Google, DeepSeek, and 40+ providers
- 🛠️ **Rich Tool System**: read, write, edit, grep, glob, fetch, and more
- 🧠 **Interaction Modes**: brainstorm, plan, review, debug, and default modes
- 🔌 **MCP Integration**: Extensible via Model Context Protocol
- 🎯 **Agent System**: Built-in agents for complex tasks
- 💬 **Interactive**: Q&A tool for user interaction
- 📦 **Zero Configuration**: Works out of the box with sensible defaults
- 🔧 **Fully Typed**: Complete TypeScript support

## Installation

```bash
npm install oricore
```

```bash
# Using pnpm
pnpm add oricore

# Using bun
bun add oricore
```

## Quick Start

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({
  productName: 'MyApp',
  version: '1.0.0',
});

await engine.initialize({
  model: 'openai/gpt-4o',
});

const result = await engine.sendMessage({
  message: 'Create a TypeScript function to calculate fibonacci',
  write: true,
});

console.log(result.data.text);
```

## Usage

### Basic Chat

```typescript
const answer = await engine.ask('What is TypeScript?');
```

### Multi-Turn Conversation

```typescript
const result = await engine.sendMessage({
  message: 'Create a user class',
  write: true,
  maxTurns: 50,
});
```

### Brainstorming Mode

```typescript
engine.setMode('brainstorm');

const result = await engine.sendMessageWithMode(
  'I want to build a task management app',
  {
    onToolApprove: async (toolUse) => {
      if (toolUse.name === 'askUserQuestion') {
        const questions = toolUse.params.questions;
        // Collect user answers
        const answers = await collectAnswers(questions);
        return {
          approved: true,
          params: { ...toolUse.params, answers },
        };
      }
      return { approved: true };
    },
  }
);
```

### Custom Mode

```typescript
engine.registerMode({
  id: 'code-reviewer',
  name: 'Code Reviewer',
  config: {
    systemPrompt: 'You are a code reviewer...',
    write: false,
    askUserQuestion: false,
  },
});

engine.setMode('code-reviewer');
```

## Configuration

### Environment Variables

```bash
# OpenAI
export OPENAI_API_KEY=sk-...
export OPENAI_API_BASE=https://api.openai.com/v1

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# Google
export GOOGLE_API_KEY=...

# DeepSeek
export DEEPSEEK_API_KEY=...
```

### Initialize with Config

```typescript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: 'sk-...',
      baseURL: 'https://api.openai.com/v1'
    }
  }
});
```

## API

### Engine Class

```typescript
class Engine {
  constructor(options: EngineOptions)
  async initialize(config: EngineConfig): Promise<void>
  async sendMessage(options: SendMessageOptions): Promise<LoopResult>
  async ask(message: string): Promise<string>
  async createSession(options?: SessionOptions): Promise<Session>
  setMode(mode: ModeType): void
  sendMessageWithMode(message: string, options?: Partial<SendMessageOptions>): Promise<LoopResult>
  getContext(): Context
  getMessageBus(): MessageBus
  async shutdown(): Promise<void>
}
```

### Modes

- `default` - General purpose coding assistant
- `brainstorm` - Interactive design and ideation
- `plan` - Create implementation plans
- `review` - Code review and analysis
- `debug` - Troubleshooting and debugging

## Examples

See the `examples/` directory for more examples:

- `basic.ts` - Basic usage
- `modes.ts` - Using different modes
- `streaming.ts` - Streaming responses

## Documentation

For more detailed documentation, please visit the [USAGE.md](./USAGE.md) file.

## License

MIT © [lyw405](https://github.com/lyw405)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or issues, please [open an issue](https://github.com/lyw405/oricore/issues) on GitHub.
