# Getting Started with OriCore in 5 Minutes

This tutorial will walk you through the core features of OriCore.

[English](QUICKSTART.md) | [中文文档](QUICKSTART.zh-CN.md)

---

## Step 1: Installation

```bash
npm install oricore ai
```

---

## Step 2: Create Your First AI Assistant

Create a new file `my-assistant.js`:

```javascript
import { createEngine } from 'oricore';

async function main() {
  // 1. Create the engine
  const engine = createEngine({
    productName: 'MyAssistant',
    version: '1.0.0',
  });

  // 2. Initialize (using DeepSeek as an example)
  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,  // Read from environment variable
        baseURL: 'https://api.deepseek.com',
      },
    },
  });

  // 3. Send a message
  const result = await engine.sendMessage({
    message: 'Write a TypeScript function to calculate Fibonacci sequence',
    write: true,  // Allow AI to write files
  });

  console.log(result.data.text);

  // 4. Cleanup
  await engine.shutdown();
}

main();
```

Run it:

```bash
# Set environment variable (recommended to use .env file or export directly)
export DEEPSEEK_API_KEY=your-key
node my-assistant.js
```

The AI will:
1. Analyze your request
2. Create a TypeScript file
3. Write the code

---

## Step 3: Let AI Read and Write Files

AI can read and analyze your code:

```javascript
const result = await engine.sendMessage({
  message: 'Analyze the src/utils.ts file and find areas for optimization',
  write: false,  // Read-only, no file writing
});
```

AI can modify existing files:

```javascript
const result = await engine.sendMessage({
  message: 'Change all var to const in src/utils.ts',
  write: true,  // Allow modifications
});
```

---

## Step 4: Multi-turn Conversations (Sessions)

Use `sessionId` to let AI remember context:

```javascript
const sessionId = 'my-session-' + Date.now();

// First turn
await engine.sendMessage({
  sessionId,
  message: 'My name is Alice, and I am a frontend developer',
  write: false,
});

// Second turn - AI remembers your name
const result = await engine.sendMessage({
  sessionId,
  message: 'What is my name?',
  write: false,
});

console.log(result.data.text);  // "Your name is Alice!"
```

---

## Step 5: Use Interaction Modes

Choose the right mode for different tasks:

```javascript
// Brainstorm mode - explore ideas
engine.setMode('brainstorm');
const design = await engine.sendMessageWithMode('I want to build a task management app, any suggestions?');

// Plan mode - create implementation plans
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('Create an implementation plan for user authentication module');

// Review mode - code review
engine.setMode('review');
const review = await engine.sendMessageWithMode('Review this code:...');
```

---

## Step 6: Control AI Permissions

Use approval mode to control what AI can do:

```javascript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  approvalMode: 'autoEdit',  // Allow read/write, but commands need confirmation

  provider: {
    deepseek: { apiKey: process.env.DEEPSEEK_API_KEY },
  },
});
```

Approval mode details:

| Mode | Read Files | Write Files | Execute Commands |
|------|------------|-------------|------------------|
| `default` | ✅ Auto | ❌ Confirm | ❌ Confirm |
| `autoEdit` | ✅ Auto | ✅ Auto | ❌ Confirm |
| `yolo` | ✅ Auto | ✅ Auto | ✅ Auto (except high-risk commands) |

---

## Step 7: Streaming Responses

Get AI output in real-time:

```javascript
const result = await engine.sendMessage({
  message: 'Explain what React useCallback is',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // Real-time output
  },
});
```

---

## Common Configurations

### Using OpenAI

```javascript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    },
  },
});
```

### Using Anthropic Claude

```javascript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4-20250514',
  provider: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: 'https://api.anthropic.com',
    },
  },
});
```

### Using Zhipu AI

```javascript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      apiKey: process.env.ZHIPUAI_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    },
  },
});
```

---

## Next Steps

Now you've mastered the basics of OriCore! Continue learning:

- **[API Reference](./API.md)** - Complete API documentation
- **[Configuration Guide](./CONFIG.md)** - All configuration options
- **[Tools System](./TOOLS.md)** - Built-in tools详解
- **[Session Management](./SESSIONS.md)** - Persistence and context compression
- **[Tutorials](./TUTORIALS.md)** - Practical examples

---

## Need Help?

- **GitHub**: [lyw405/oricore](https://github.com/lyw405/oricore)
- **Issues**: [Report a problem](https://github.com/lyw405/oricore/issues)
