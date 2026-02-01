# Interaction Modes

Documentation of OriCore's 5 specialized interaction modes.

[English](MODES.md) | [中文文档](MODES.zh-CN.md)

---

## Table of Contents

- [Mode Overview](#mode-overview)
- [Built-in Modes](#built-in-modes)
- [Using Modes](#using-modes)
- [Custom Modes](#custom-modes)

---

## Mode Overview

OriCore provides 5 interaction modes optimized for different tasks, each with specialized system prompts and behavior configurations.

### Mode Comparison

| Mode | Purpose | Write Files | Ask User | Task Mgmt | Max Turns |
|------|---------|-------------|----------|-----------|-----------|
| `default` | General assistant | ✅ | ❌ | ✅ | 50 |
| `brainstorm` | Brainstorming | ❌ | ✅ | ❌ | 50 |
| `plan` | Planning | ✅ | ✅ | ✅ | 50 |
| `review` | Code review | ❌ | ❌ | ❌ | 10 |
| `debug` | Debugging | ✅ | ✅ | ✅ | 50 |

---

## Built-in Modes

### default - General Assistant Mode

**Purpose:** Everyday AI assistant tasks

**Features:**
- Full functionality
- Can write files
- Does not ask user
- Task management enabled
- Agent enabled
- Max 50 turns

**System prompt:**
```
You are a helpful AI assistant with coding capabilities.
```

**Example:**

```typescript
engine.setMode('default');

const result = await engine.sendMessageWithMode('Create a TypeScript function');
```

---

### brainstorm - Brainstorming Mode

**Purpose:** Creative exploration and design discussion

**Features:**
- Does not write code files
- Frequent interactive questions
- No task management
- No agent
- Max 50 turns

**System prompt:**
```
You are a design brainstorming partner. Ask questions to understand requirements, explore multiple approaches, and discuss trade-offs. Focus on ideation rather than implementation.
```

**Example:**

```typescript
engine.setMode('brainstorm');

const result = await engine.sendMessageWithMode('I want to build a task management app, any suggestions?');
```

**Typical conversation flow:**
1. AI asks about project goals, target users
2. Explores different feature options
3. Discusses technology stack choices
4. Analyzes pros and cons

---

### plan - Planning Mode

**Purpose:** Create detailed implementation plans

**Features:**
- Can write files (save plans)
- Can ask user
- Task management enabled
- Max 50 turns

**System prompt:**
```
You are an implementation planner. Create detailed, step-by-step implementation plans. Break down tasks into actionable steps with clear dependencies.
```

**Example:**

```typescript
engine.setMode('plan');

const result = await engine.sendMessageWithMode('Create an implementation plan for user authentication module');
```

**Output format:**
1. Task breakdown
2. Dependencies
3. Implementation steps
4. Verification criteria

---

### review - Review Mode

**Purpose:** Code review and analysis

**Features:**
- Read-only, no file writing
- Does not ask user
- No task management
- No agent
- Max 10 turns

**System prompt:**
```
You are a code reviewer. Analyze code for quality, security, performance, and best practices. Provide constructive feedback with specific examples.
```

**Example:**

```typescript
engine.setMode('review');

const result = await engine.sendMessageWithMode('Review this code for performance issues:');
```

**Review dimensions:**
- Code quality
- Security
- Performance
- Best practices
- Maintainability

---

### debug - Debugging Mode

**Purpose:** Troubleshooting and problem diagnosis

**Features:**
- Full functionality
- Can write files (fix code)
- Can ask user
- Task management enabled
- Max 50 turns

**System prompt:**
```
You are a debugging specialist. Help identify and fix issues. Ask relevant questions to understand the problem, analyze error messages, and provide solutions.
```

**Example:**

```typescript
engine.setMode('debug');

const result = await engine.sendMessageWithMode('Help me debug this error: TypeError: Cannot read property "x"');
```

**Debugging process:**
1. Understand error message
2. Analyze possible causes
3. Provide solutions
4. Verify fixes

---

## Using Modes

### Set Mode

```typescript
engine.setMode('brainstorm');
```

### Send Message (using current mode)

```typescript
const result = await engine.sendMessageWithMode('Discuss the design of a new feature');
```

### Get Current Mode

```typescript
const currentMode = engine.getMode();
console.log(currentMode);  // 'brainstorm'
```

### Get All Available Modes

```typescript
const modes = engine.getAvailableModes();

modes.forEach(mode => {
  console.log(`${mode.name}: ${mode.description}`);
});
```

---

## Custom Modes

### Register Custom Mode

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript Expert',
  description: 'TypeScript development expert',
  config: {
    systemPrompt: 'You are a TypeScript expert. Always provide typed examples and explain type concepts clearly.',
    write: true,
    askUserQuestion: true,
    maxTurns: 50,
  },
});
```

### ModeConfig

```typescript
interface ModeConfig {
  systemPrompt: string;       // System prompt
  write?: boolean;            // Allow file writing
  todo?: boolean;             // Enable task management
  askUserQuestion?: boolean;  // Allow asking user
  task?: boolean;             // Allow launching Agent
  maxTurns?: number;          // Maximum turns
  model?: string;             // Model to use
  temperature?: number;       // Temperature parameter
  autoCompact?: boolean;      // Auto-compact conversations
}
```

### Complete Example: Create Testing Expert Mode

```typescript
engine.registerMode({
  id: 'testing-expert',
  name: 'Testing Expert',
  description: 'Unit testing and integration testing expert',
  config: {
    systemPrompt: `You are a testing expert. Specialize in:
- Writing unit tests with Jest/Vitest
- Integration testing
- Test-driven development (TDD)
- Mock and stub strategies
- Test coverage analysis

Always provide practical, runnable test examples.`,
    write: true,
    askUserQuestion: false,
    maxTurns: 40,
    temperature: 0.3,  // More deterministic output
  },
});

// Use custom mode
engine.setMode('testing-expert');

const result = await engine.sendMessageWithMode('Write unit tests for this function');
```

---

## Mode Switching

### Dynamic Switching

Switch modes based on task:

```typescript
// Design phase
engine.setMode('brainstorm');
await engine.sendMessageWithMode('Discuss the design of a new feature');

// Planning phase
engine.setMode('plan');
await engine.sendMessageWithMode('Create an implementation plan');

// Development phase
engine.setMode('default');
await engine.sendMessageWithMode('Start implementing the feature');

// Review phase
engine.setMode('review');
await engine.sendMessageWithMode('Review the code');
```

---

## More Documentation

- **[API Reference](./API.md)** - Mode-related APIs
- **[Configuration](./CONFIG.md)** - Mode configuration
- **[Tutorials](./TUTORIALS.md)** - Usage examples
