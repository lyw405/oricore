<div align="center">

# OriCore

**Powerful AI Engine Library - Build Smart Assistants in 5 Lines of Code**

[![npm version](https://badge.fury.io/js/oricore.svg)](https://www.npmjs.com/package/oricore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [中文文档](README.zh-CN.md)

</div>

---

## What is OriCore?

OriCore is a fully-featured **AI Engine Library** that lets you easily integrate powerful AI capabilities into any application.

- **Support for 40+ AI providers** (OpenAI, Claude, DeepSeek, Zhipu AI, etc.)
- **Complete built-in tool system** (file read/write, code search, shell commands, network requests)
- **Session management** + **Context compression**
- **MCP protocol** + **Skill system** for unlimited extensions
- **5 professional interaction modes** (brainstorm, plan, review, debug, default)

Build AI-powered products with just **5 lines of code**:

```typescript
import { createEngine } from 'oricore';

const engine = createEngine({ productName: 'MyApp', version: '1.0.0' });
await engine.initialize({ model: 'deepseek/deepseek-chat', provider: { deepseek: { apiKey: 'your-key' } } });

const result = await engine.sendMessage({ message: 'Analyze this project structure', write: true });
console.log(result.data.text);
```

---

## Quick Start

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
  message: 'Create a TypeScript function to calculate Fibonacci',
  write: true,
});

console.log(result.data.text);
await engine.shutdown();
```

[📖 5-Minute Quick Start Guide](docs/QUICKSTART.md)

---

## Why OriCore?

| What You Need | OriCore | Others |
|---------------|---------|--------|
| **Build an AI assistant fast** | ✅ 5 lines of code | ❌ 100+ lines of setup |
| **Work with any AI provider** | ✅ 40+ providers unified | ⚠️ Provider-specific SDKs |
| **Ready-to-use tools** | ✅ File, shell, search, web | ❌ Build everything yourself |
| **Save on API costs** | ✅ Auto context compression | ❌ Pay for full context every time |
| **Extend with plugins** | ✅ MCP + Skills | ❌ Complex or impossible |
| **Switch AI providers** | ✅ Change 1 line of code | ❌ Rewrite integration code |

**Built for developers who need to ship AI features fast:**

- **5-minute setup** - Get a working AI assistant with file access, code search, and shell commands
- **No vendor lock-in** - Switch between OpenAI, Claude, DeepSeek, etc. anytime
- **Production-ready** - Built-in session persistence, cost tracking, and error handling
- **Extensible** - Add custom tools via MCP servers or local skill files
- **AI-aware** - Context compression and specialized modes for different tasks

---

## Built-in Tools

| Tool | Function |
|------|----------|
| `read` | Read files (text, images, PDF) |
| `write` | Write files |
| `edit` | Edit files (search & replace) |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `bash` | Execute shell commands |
| `fetch` | Make HTTP requests |
| `task` | Launch specialized agents |
| `todo` | Track task progress |
| `askUserQuestion` | Interactive Q&A with users |

[📖 Tools Documentation](docs/TOOLS.md)

---

## Use Cases

- **Build Custom AI Assistants** - Chatbots, customer service systems
- **IDE Integration** - Code assistants, smart autocomplete
- **Code Review** - Automated code review systems
- **Debugging Tools** - Intelligent error diagnosis
- **Education Platforms** - Programming teaching assistants
- **Documentation Generation** - Automated documentation generation

---

## Documentation

### Getting Started
- **[5-Minute Quick Start](docs/QUICKSTART.md)** - Get up to speed with OriCore
- **[Tutorials](docs/TUTORIALS.md)** - Practical examples

### Core Features
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Configuration Guide](docs/CONFIG.md)** - All configuration options
- **[Tools System](docs/TOOLS.md)** - Built-in tools guide
- **[Interaction Modes](docs/MODES.md)** - 5 professional modes

### Advanced Features
- **[Session Management](docs/SESSIONS.md)** - Persistence & context compression
- **[Event System](docs/EVENTS.md)** - Message bus & events
- **[MCP Integration](docs/MCP.md)** - MCP protocol support
- **[Skill System](docs/SKILLS.md)** - Custom skill loading
- **[Approval System](docs/APPROVAL.md)** - Tool execution permission control

---

## Acknowledgments

This project references the core architecture of the following excellent project:

**[neovate-code](https://github.com/neovateai/neovate-code)** - Core AI engine architecture

OriCore has been refactored and streamlined on this foundation, removing UI, CLI, and other peripheral features to focus on providing a powerful and standalone AI engine library that can be easily integrated into any project.

---

## License

MIT © [lyw405](https://github.com/lyw405)

---

## Support

- **GitHub**: [lyw405/oricore](https://github.com/lyw405/oricore)
- **Issues**: [Report a problem](https://github.com/lyw405/oricore/issues)
