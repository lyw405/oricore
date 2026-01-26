<div align="center">

# OriCore

**A powerful, standalone AI engine with multi-model support, tool calling, and extensible architecture**

[![npm version](https://badge.fury.io/js/oricore.svg)](https://www.npmjs.com/package/oricore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [中文文档](README.zh-CN.md)

</div>

## About OriCore

OriCore is a comprehensive AI engine that provides the core functionality for building intelligent assistants. It offers a rich set of tools, multi-model support, and extensible architecture through MCP (Model Context Protocol) and Skills.

### Key Features

- **Multi-Model Support**: Compatible with 40+ AI providers including OpenAI, Anthropic, Google, DeepSeek, and more
- **Rich Tool System**: Built-in tools for file operations (read, write, edit), code search (grep, glob), shell commands, and web requests
- **Interaction Modes**: Specialized modes for different tasks - brainstorming, planning, code review, debugging, and default
- **MCP Integration**: Extensible via Model Context Protocol for custom tools and capabilities
- **Skill System**: Load and use custom skills from local or remote sources (GitHub, GitLab)
- **Agent Framework**: Built-in agents for complex multi-step tasks (explore, general-purpose)
- **Session Management**: Persistent conversation history with session resumption
- **Streaming Support**: Real-time text delta streaming for responsive interactions
- **Fully Typed**: Complete TypeScript support with comprehensive type definitions
- **Zero Configuration**: Works out of the box with sensible defaults

### Use Cases

- Build custom AI assistants
- Integrate AI capabilities into IDE extensions
- Create automated code review systems
- Develop intelligent debugging tools
- Build educational platforms
- Implement automated documentation generation

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

### Optional Dependencies

OriCore has support for additional features through optional dependencies:

**PDF Support**
```bash
npm install pdf-parse
```
The `read` tool can parse PDF files when `pdf-parse` is installed. Without it, PDF reading will be disabled.

## Quick Start

```typescript
import { createEngine } from 'oricore';

// 1. Create the engine
const engine = createEngine({
  productName: 'MyAIAssistant',
  version: '1.0.0',
});

// 2. Initialize with model and API key
await engine.initialize({
  model: 'openai/gpt-5.2-codex',
  provider: {
    openai: {
      apiKey: 'your-api-key',
      baseURL: 'https://api.openai.com/v1',
    },
  },
});

// 3. Send a message
const result = await engine.sendMessage({
  message: 'Create a TypeScript function to calculate fibonacci',
  write: true,
});

console.log(result.data.text);

// 4. Cleanup
await engine.shutdown();
```

## Interaction Modes

OriCore provides specialized modes for different tasks:

```typescript
// Brainstorm mode - interactive design exploration
engine.setMode('brainstorm');
const design = await engine.sendMessageWithMode('I want to build a task management app');

// Plan mode - create implementation plans
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('Create a plan for adding user authentication');

// Review mode - code review and analysis
engine.setMode('review');
const review = await engine.sendMessageWithMode('Review this code: ...');

// Debug mode - troubleshooting
engine.setMode('debug');
const fix = await engine.sendMessageWithMode('Help debug this error: ...');
```

## Built-in Tools

OriCore includes a comprehensive set of tools:

| Tool | Description |
|------|-------------|
| `read` | Read file contents (supports text, images, and PDF*) |
| `write` | Write new files |
| `edit` | Edit existing files with search/replace |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `bash` | Execute shell commands |
| `fetch` | Make HTTP requests |
| `askUserQuestion` | Interactive Q&A with users |
| `task` | Spawn specialized agents |
| `todo` | Track task progress |

*PDF support requires the optional `pdf-parse` package (see below)

## Configuration

### Full Configuration Example

```typescript
await engine.initialize({
  model: 'openai/gpt-5.2-codex',
  planModel: 'openai/gpt-5.2-codex',
  approvalMode: 'autoEdit',
  language: 'en',
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

### Supported Providers

| Provider | Model Example | API Base URL |
|----------|---------------|--------------|
| OpenAI | `openai/gpt-5.2-codex` | `https://api.openai.com/v1` |
| Anthropic | `anthropic/claude-opus-4-5` | `https://api.anthropic.com` |
| Google | `google/gemini-3-flash-preview` | `https://generativelanguage.googleapis.com` |
| DeepSeek | `deepseek/deepseek-chat` | `https://api.deepseek.com` |
| Zhipu AI | `zhipuai/glm-4.7` | `https://open.bigmodel.cn/api/paas/v4` |

See [USAGE.md](./USAGE.md) for more configuration options.

**Tool Approval System:** See [APPROVAL.md](./APPROVAL.md) for detailed information about the approval system, including approval modes (`default`, `autoEdit`, `yolo`), custom approval handlers, and best practices.

## Project Structure

```
oricore/
├── src/
│   ├── api/           # Main Engine API
│   ├── core/          # Core functionality (loop, context, config)
│   ├── tools/         # Built-in tools
│   ├── modes/         # Interaction modes
│   ├── mcp/           # MCP integration
│   ├── skill/         # Skill system
│   ├── agent/         # Agent framework
│   ├── session/       # Session management
│   └── utils/         # Utilities
├── examples/          # Usage examples
└── dist/              # Compiled output
```

## Statement

This project references the core architecture of the following excellent project:
- **[neovate-code](https://github.com/neovateai/neovate-code)** - Core AI engine architecture

OriCore has been refactored and streamlined on this foundation, removing UI, CLI, and other peripheral features to focus on providing a lightweight, standalone AI engine library that can be easily integrated into any project.

## License

MIT © [lyw405](https://github.com/lyw405)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or issues, please [open an issue](https://github.com/lyw405/oricore/issues) on GitHub.
