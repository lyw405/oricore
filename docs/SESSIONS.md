# Session Management

Complete guide to OriCore session management.

[English](SESSIONS.md) | [中文文档](SESSIONS.zh-CN.md)

---

## Table of Contents

- [Session Overview](#session-overview)
- [Creating Sessions](#creating-sessions)
- [Resuming Sessions](#resuming-sessions)
- [Session Persistence](#session-persistence)
- [Session Configuration](#session-configuration)
- [Listing Sessions](#listing-sessions)
- [Use Cases](#use-cases)
- [Context Compression](#context-compression)
- [Usage Tracking](#usage-tracking)

---

## Session Overview

Sessions are the core mechanism for managing multi-turn conversations in OriCore. Through sessions, AI can remember previous conversations and enable continuous multi-turn interactions.

### Core Features

- **Persistent Storage** - Sessions automatically save to disk
- **Context Memory** - AI remembers previous conversations
- **Session Resumption** - Continue from where you left off
- **Token Tracking** - Automatic usage tracking
- **Context Compression** - Automatic compression of long conversations

---

## Creating Sessions

### Method 1: Using sendMessage

The simplest way is to pass a `sessionId`:

```typescript
const sessionId = 'my-session-' + Date.now();

await engine.sendMessage({
  sessionId,
  message: 'My name is Alice',
  write: false,
});

// AI remembers the name
const result = await engine.sendMessage({
  sessionId,
  message: 'What is my name?',
  write: false,
});

console.log(result.data.text);  // "Your name is Alice!"
```

### Method 2: Creating a Session Object

```typescript
// Create a new session
const session = await engine.createSession();
console.log('Session ID:', session.id);

// Use the session
await engine.sendMessage({
  sessionId: session.id,
  message: 'Remember: I am learning TypeScript',
  write: false,
});
```

---

## Resuming Sessions

### SessionOptions

When creating or resuming sessions, you can use the following options:

```typescript
interface SessionOptions {
  sessionId?: string;     // Session ID (auto-generated if not provided)
  resume?: string;        // Resume from specific session ID
  continue?: boolean;     // Continue the latest session
}
```

### Resume by ID

```typescript
const session = await engine.createSession({
  resume: 'abc123def456',
});

console.log('Resumed session:', session.id);
```

### Resume Latest Session

```typescript
const session = await engine.createSession({
  continue: true,
});

console.log('Resumed latest session:', session.id);
```

### Continue Existing Session

```typescript
// Directly use existing sessionId to continue conversation
await engine.sendMessage({
  sessionId: 'abc123def456',
  message: 'Continue the previous conversation',
  write: false,
});
```

---

## Session Persistence

### Storage Location

Sessions are automatically saved to the following location:

| Type | Path |
|------|------|
| Session File | `~/.oricore/projects/<formatted-cwd>/<sessionId>.jsonl` |

**Notes**:
- `<formatted-cwd>` is the formatted version of the current working directory (path separators converted to `-`, lowercase)
- If `sessionId` starts with `.` or ends with `.jsonl`, a relative path is used

### JSONL Format

Each session is stored as a JSONL file containing two types of records:

**1. Config Record**
```jsonl
{"type":"config","config":{...},"mode":"review"}
```

**2. Message Record**
```jsonl
{"type":"message","role":"user","content":"My name is Alice"}
{"type":"message","role":"assistant","content":"Hello Alice!"}
{"type":"message","role":"user","content":"What is my name?"}
{"type":"message","role":"assistant","content":"Your name is Alice!"}
```

**Notes**:
- Each session file starts with a config record (containing session config and mode)
- Subsequent lines are message records
- File locks are used to ensure safe concurrent access

---

## Session Configuration

### SessionConfig

Each session can have its own configuration:

```typescript
interface SessionConfig {
  model?: string;                  // Model to use
  approvalMode?: ApprovalMode;     // Approval mode
  approvalTools: string[];         // Auto-approve tool list (default: [])
  summary?: string;                // Session summary
  pastedTextMap?: Record<string, string>;   // Pasted text (default: {})
  pastedImageMap?: Record<string, string>;  // Pasted images (default: {})
  additionalDirectories?: string[];         // Additional directories (default: [])
}
```

**Default Configuration**:
```typescript
{
  approvalMode: 'default',
  approvalTools: [],
  pastedTextMap: {},
  pastedImageMap: {},
  additionalDirectories: [],
}
```

### Session Modes

OriCore supports different interaction modes, set via the engine:

```typescript
// Set current interaction mode
engine.setMode('review');

// Create session with current mode
const session = await engine.createSession();

// Session inherits engine's current mode configuration
```

---

## Listing Sessions

### Get All Sessions

```typescript
const sessions = engine.getSessions();

sessions.forEach(session => {
  console.log(`Session: ${session.sessionId}`);
  console.log(`  Messages: ${session.messageCount}`);
  console.log(`  Summary: ${session.summary}`);
  console.log(`  Created: ${session.created}`);
  console.log(`  Modified: ${session.modified}`);
});
```

### SessionInfo

```typescript
interface SessionInfo {
  sessionId: string;       // Session ID
  messageCount: number;    // Number of messages
  summary: string;         // Session summary
  created: Date;           // Creation time
  modified: Date;          // Modification time
}
```

---

## Use Cases

### 1. Multi-Turn Conversations

```typescript
const sessionId = 'conversation-' + Date.now();

await engine.sendMessage({
  sessionId,
  message: 'Help me design a REST API',
  write: false,
});

await engine.sendMessage({
  sessionId,
  message: 'Add user authentication endpoint',
  write: false,
});

// AI remembers the previous design
await engine.sendMessage({
  sessionId,
  message: 'Now write tests for the user authentication endpoint',
  write: true,
});
```

### 2. Long Task Breakdown

```typescript
const sessionId = 'task-' + Date.now();

// Step 1
await engine.sendMessage({
  sessionId,
  message: 'Analyze project structure',
  write: false,
});

// Step 2 - AI remembers the project structure
await engine.sendMessage({
  sessionId,
  message: 'Based on the analysis, refactor the utils directory',
  write: true,
});
```

### 3. Collaboration Scenarios

```typescript
// Share sessionId with team members
const sessionId = 'team-collaboration';

// Member A
await engine.sendMessage({
  sessionId,
  message: 'Note: Project uses TypeScript, goal is to optimize performance',
  write: false,
});

// Member B - can see previous discussions
await engine.sendMessage({
  sessionId,
  message: 'Based on previous discussions, I suggest using Redis',
  write: false,
});
```

### 4. Debugging Session History

Session files can be viewed and debugged directly:

```bash
# List all project session directories
ls ~/.oricore/projects/

# View specific session file
cat ~/.oricore/projects/formatted-project-path/session-id.jsonl

# Use jq to format view (one JSON object per line)
jq . ~/.oricore/projects/formatted-project-path/session-id.jsonl

# View only message records
grep '"type":"message"' ~/.oricore/projects/formatted-project-path/session-id.jsonl | jq .
```

**Note**: Project paths are formatted (path separators converted to `-`, lowercase)

---

## Context Compression

When conversations become long, OriCore automatically compresses context:

- **Smart Summary** - Preserves key information
- **Token Savings** - Reduces API costs
- **Auto Trigger** - Automatically compresses when threshold is exceeded

Context compression is enabled through configuration files or mode settings. Different modes have different compression strategies:
- **plan mode** - Compression disabled, keeps full context
- **review mode** - Compression enabled
- **default mode** - Compression enabled

---

## Usage Tracking

### Get Usage

Each call to `sendMessage` returns token usage in the result:

```typescript
const result = await engine.sendMessage({
  sessionId: 'my-session',
  message: 'Hello',
  write: false,
});

if (result.success) {
  console.log('Token usage:', result.data.usage);
  // { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
}
```

### Usage Type

```typescript
class Usage {
  promptTokens: number;     // Input token count
  completionTokens: number; // Output token count
  totalTokens: number;      // Total token count
}
```

---

## More Documentation

- **[API Reference](./API.md)** - Session-related APIs
- **[Configuration Guide](./CONFIG.md)** - Configuration options
- **[Tool System](./TOOLS.md)** - Tool usage
