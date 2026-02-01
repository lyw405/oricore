# Tutorials

OriCore practical tutorial collection.

[English](TUTORIALS.md) | [中文文档](TUTORIALS.zh-CN.md)

---

## Table of Contents

1. [Build a Chatbot](#tutorial-1-build-a-chatbot)
2. [Code Review Assistant](#tutorial-2-code-review-assistant)
3. [Automated Refactoring Tool](#tutorial-3-automated-refactoring-tool)
4. [Documentation Generator](#tutorial-4-documentation-generator)
5. [Multi-Session Management](#tutorial-5-multi-session-management)

---

## Tutorial 1: Build a Chatbot

Create a simple AI chatbot.

### Complete Code

```typescript
import { createEngine } from 'oricore';
import readline from 'readline';

async function main() {
  // 1. Create engine
  const engine = createEngine({
    productName: 'ChatBot',
    version: '1.0.0',
  });

  // 2. Initialize
  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    },
  });

  // 3. Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const sessionId = 'chat-' + Date.now();

  // 4. Chat loop
  const chat = async () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        await engine.shutdown();
        return;
      }

      // 5. Send message
      const result = await engine.sendMessage({
        sessionId,
        message: input,
        write: false,
      });

      console.log('Bot:', result.data.text);

      // Next turn
      chat();
    });
  };

  console.log('Chatbot started! Type "exit" to quit.');
  chat();
}

main();
```

### Run

```bash
DEEPSEEK_API_KEY=your-key node chatbot.js
```

### Extensions

- Add streaming responses (`onTextDelta`)
- Save chat history
- Add multimodal support (image input)

---

## Tutorial 2: Code Review Assistant

Create an automated code review tool.

### Complete Code

```typescript
import { createEngine } from 'oricore';
import { readFileSync } from 'fs';

async function reviewCode(filePath: string) {
  const engine = createEngine({
    productName: 'CodeReviewer',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'anthropic/claude-sonnet-4-20250514',
    provider: {
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
    },
  });

  // Use review mode
  engine.setMode('review');

  // Read file
  const code = readFileSync(filePath, 'utf-8');

  // Review code
  const result = await engine.sendMessage({
    message: `Review the following code for quality, security, and performance:

\`\`\`typescript
${code}
\`\`\``,
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

// Usage
reviewCode('./src/utils.ts');
```

### Example Output

```
## Code Review Report

### Pros
- Uses TypeScript for type safety
- Single responsibility functions, easy to understand

### Issues
1. **Security**: User input not validated, potential injection attacks
2. **Performance**: Uses nested loops, O(n²) time complexity
3. **Maintainability**: Missing error handling

### Recommendations
- Add input validation
- Use Map for optimized lookups
- Add try-catch error handling
```

---

## Tutorial 3: Automated Refactoring Tool

Automatically refactor common code issues.

### Complete Code

```typescript
import { createEngine } from 'oricore';
import { glob } from 'glob';

async function refactorCode(pattern: string) {
  const engine = createEngine({
    productName: 'AutoRefactor',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'openai/gpt-4o',
    provider: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
    approvalMode: 'autoEdit',  // Auto-approve write operations
  });

  // Find all files
  const files = await glob(pattern);

  console.log(`Found ${files.length} files`);

  // Refactor each file
  for (const file of files) {
    console.log(`Refactoring: ${file}`);

    const result = await engine.sendMessage({
      message: `Refactor this file:
1. Change all var to const/let
2. Add type annotations
3. Optimize naming
4. Add JSDoc comments

File: ${file}`,
      write: true,
    });

    if (result.success) {
      console.log('✅ Done');
    } else {
      console.log('❌ Failed:', result.error?.message);
    }
  }

  await engine.shutdown();
}

// Usage: Refactor all TypeScript files
refactorCode('src/**/*.ts');
```

---

## Tutorial 4: Documentation Generator

Automatically generate project documentation.

### Complete Code

```typescript
import { createEngine } from 'oricore';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function generateDocs() {
  const engine = createEngine({
    productName: 'DocGenerator',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    },
  });

  // 1. Read package.json
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

  // 2. Generate README
  const readmeResult = await engine.sendMessage({
    message: `Generate a complete README.md for the following project:

Project Name: ${pkg.name}
Version: ${pkg.version}
Description: ${pkg.description}

Dependencies: ${JSON.stringify(pkg.dependencies, null, 2)}

Include these sections:
- Project Introduction
- Features
- Installation Instructions
- Usage Examples
- API Documentation
- Contributing Guidelines`,
    write: false,
  });

  // 3. Save documentation
  writeFileSync('README.md', readmeResult.data.text);

  console.log('✅ README.md generated');

  await engine.shutdown();
}

generateDocs();
```

---

## Tutorial 5: Multi-Session Management

Manage multiple independent conversation sessions.

### Complete Code

```typescript
import { createEngine } from 'oricore';

async function multiSessionDemo() {
  const engine = createEngine({
    productName: 'MultiSession',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    },
  });

  // Session 1: Code assistant
  const codeSessionId = 'code-' + Date.now();
  await engine.sendMessage({
    sessionId: codeSessionId,
    message: 'Remember: I am working on a React project using TypeScript',
    write: false,
  });

  // Session 2: Translation assistant
  const translateSessionId = 'translate-' + Date.now();
  await engine.sendMessage({
    sessionId: translateSessionId,
    message: 'You are a professional translator, translate between Chinese and English',
    write: false,
  });

  // Use different sessions
  const codeResult = await engine.sendMessage({
    sessionId: codeSessionId,
    message: 'Create a React component',
    write: false,
  });

  const translateResult = await engine.sendMessage({
    sessionId: translateSessionId,
    message: 'Translate "Hello World" to Chinese',
    write: false,
  });

  console.log('Code Assistant:', codeResult.data.text);
  console.log('Translation Assistant:', translateResult.data.text);

  // List all sessions
  const sessions = engine.getSessions();
  console.log('\nAll Sessions:');
  sessions.forEach(s => {
    console.log(`- ${s.sessionId}: ${s.messageCount} messages`);
  });

  await engine.shutdown();
}

multiSessionDemo();
```

---

## Advanced Tutorials

### Streaming Response Chat

```typescript
const result = await engine.sendMessage({
  message: 'Tell me a story',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // Real-time output
  },
});
```

### Custom Approval Handling

```typescript
const result = await engine.sendMessage({
  message: 'Execute some operations',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`Tool: ${toolUse.name}`);
    const approved = await confirm(`Approve ${toolUse.name}?`);
    return { approved };
  },
});
```

### Using Interaction Modes

```typescript
// Plan mode
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('Create a development plan');

// Review mode
engine.setMode('review');
const review = await engine.sendMessageWithMode('Review the code');
```

---

## More Resources

- **[5-Minute Quick Start](./QUICKSTART.md)** - Get started quickly
- **[API Reference](./API.md)** - Complete API documentation
- **[Tools System](./TOOLS.md)** - Tools guide
- **[Session Management](./SESSIONS.md)** - Sessions guide
