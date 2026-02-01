# Tools System

Complete documentation of OriCore's built-in tool set.

[English](TOOLS.md) | [中文文档](TOOLS.zh-CN.md)

---

## Table of Contents

- [Tool Overview](#tool-overview)
- [Tool Categories](#tool-categories)
- [Built-in Tools](#built-in-tools)
  - [read](#read-read-files)
  - [write](#write-write-files)
  - [edit](#edit-edit-files)
  - [bash](#bash-execute-commands)
  - [glob](#glob-file-search)
  - [grep](#grep-content-search)
  - [ls](#ls-list-directories)
  - [fetch](#fetch-network-requests)
  - [task](#task-launch-agent)
  - [todoWrite](#todowrite-task-management)
  - [askUserQuestion](#askuserquestion-ask-user)
  - [skill](#skill-execute-skills)
- [Background Tasks](#background-tasks)
- [Tool Permissions](#tool-permissions)

---

## Tool Overview

OriCore includes **14 built-in tools** covering file operations, code search, command execution, network requests, and more.

| Tool | Function | Category |
|------|----------|----------|
| `read` | Read files | read |
| `write` | Write files | write |
| `edit` | Edit files | write |
| `bash` | Execute commands | command |
| `bash_output` | Get background task output | read |
| `kill_bash` | Terminate background tasks | command |
| `glob` | File search | read |
| `grep` | Content search | read |
| `ls` | List directories | read |
| `fetch` | Network requests | network |
| `task` | Launch Agent | - |
| `todoWrite` | Task management | write |
| `askUserQuestion` | Ask user | ask |
| `skill` | Execute skills | - |

---

## Tool Categories

### read - Read-only Operations

Automatically approved, no user confirmation required.

- `read` - Read files
- `grep` - Search file content
- `glob` - Search files
- `ls` - List directories
- `bash_output` - Get background task output

### write - File Modification

- `default` mode: Requires confirmation
- `autoEdit` mode: Auto-approved
- `yolo` mode: Auto-approved

- `write` - Write files
- `edit` - Edit files
- `todoWrite` - Task management

### command - Command Execution

- `default` mode: Requires confirmation
- `autoEdit` mode: Requires confirmation
- `yolo` mode: Auto-approved (except high-risk commands)

- `bash` - Execute commands
- `kill_bash` - Terminate background tasks

### network - Network Requests

- `default` mode: Requires confirmation
- `autoEdit` mode: Requires confirmation
- `yolo` mode: Auto-approved

- `fetch` - Network requests

### ask - User Interaction

Always requires user input.

- `askUserQuestion` - Ask user

---

## Built-in Tools

### read - Read Files

Read file content, supports text, images, and PDF.

**Parameters:**

```typescript
{
  file_path: string;    // File path (required)
  offset?: number;      // Start line number (optional)
  limit?: number;       // Number of lines to read (optional)
}
```

**Example:**

```typescript
// AI automatically calls
await engine.sendMessage({
  message: 'Read the content of src/index.ts',
  write: false,
});
```

**Supported file formats:**
- Text files (.ts, .js, .md, .txt, etc.)
- Images (.png, .jpg, .jpeg, .gif, .webp)
- PDF (requires `pdf-parse`)

---

### write - Write Files

Create new files or overwrite existing files.

**Parameters:**

```typescript
{
  file_path: string;    // File path (required)
  content: string;      // File content (required)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Create a utils.ts file with a date formatting function',
  write: true,
});
```

---

### edit - Edit Files

Perform exact string replacements in files.

**Parameters:**

```typescript
{
  file_path: string;    // File path (required)
  old_string: string;   // String to replace (required)
  new_string: string;   // New string (required)
  replace_all?: boolean; // Replace all matches (optional)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Replace all var with const in src/utils.ts',
  write: true,
});
```

---

### bash - Execute Commands

Execute shell commands.

**Parameters:**

```typescript
{
  command: string;          // Command (required)
  timeout?: number;         // Timeout (milliseconds)
  run_in_background?: boolean;  // Run in background
  description?: string;     // Command description
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'List all files in the current directory',
  write: false,
});

// Run in background
await engine.sendMessage({
  message: 'Run npm run dev in background',
  write: false,
});
```

**Security limits:**
- High-risk commands require confirmation (e.g., `rm -rf`)
- Banned commands will be rejected

---

### glob - File Search

Find files by pattern matching.

**Parameters:**

```typescript
{
  pattern: string;      // Match pattern (required)
  path?: string;        // Search path (optional)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Find all .ts files',
  write: false,
});

// Recursive search
await engine.sendMessage({
  message: 'Find all .test.ts files in src directory',
  write: false,
});
```

**Pattern examples:**
- `*.ts` - All .ts files in current directory
- `**/*.test.ts` - Recursively find all test files
- `src/**/*.ts` - All .ts files in src directory

---

### grep - Content Search

Search content in files (using ripgrep).

**Parameters:**

```typescript
{
  pattern: string;              // Search pattern (required)
  search_path?: string;         // Search path
  include?: string;             // File type filter
  limit?: number;               // Result count limit
  output_mode?: 'content' | 'files_with_matches' | 'count';
  before_context?: number;      // Lines before match
  after_context?: number;       // Lines after match
  context?: number;             // Context lines
  line_numbers?: boolean;       // Show line numbers
  ignore_case?: boolean;        // Ignore case
  type?: string;                // File type
  multiline?: boolean;          // Multiline match
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Search for "TODO" comments in the code',
  write: false,
});

await engine.sendMessage({
  message: 'Search for "interface" in TypeScript files in src directory',
  write: false,
});
```

---

### ls - List Directories

List directory contents.

**Parameters:**

```typescript
{
  dir_path: string;     // Directory path (required)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'List contents of src directory',
  write: false,
});
```

---

### fetch - Network Requests

Make HTTP requests to fetch content.

**Parameters:**

```typescript
{
  url: string;          // URL (required)
  prompt: string;       // Processing prompt (required)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Get information from https://api.github.com/lyw405/oricore',
  write: false,
});
```

---

### task - Launch Agent

Launch specialized sub-agents for complex tasks.

**Parameters:**

```typescript
{
  description: string;      // Task description (required)
  prompt: string;           // Task prompt (required)
  subagent_type: string;    // Agent type
  resume?: string;          // Resume ID
}
```

**Agent types:**
- `explore` - Explore codebase
- `general-purpose` - General tasks
- `plan` - Create plans

**Example:**

```typescript
await engine.sendMessage({
  message: 'Explore the structure of this project',
  write: false,
  task: true,
});
```

---

### todoWrite - Task Management

Create and manage structured task lists.

**Parameters:**

```typescript
{
  todos: Array<{
    id: string;                                // Task ID
    content: string;                           // Task content
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';       // Priority
  }>;
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Help me plan the development tasks for a blog system',
  write: true,
});
```

---

### askUserQuestion - Ask User

Interactive Q&A with users.

**Parameters:**

```typescript
{
  questions: Array<{
    question: string;       // Question
    header: string;         // Header (max 12 chars)
    options: Array<{
      label: string;        // Option label
      description: string;  // Option description
    }>;
    multiSelect?: boolean;  // Allow multiple selections
  }>;
  answers?: Array<{
    question: string;
    answer: string;
  }>;
}
```

**Example:**

AI automatically calls this tool to ask user for selections or confirmations.

---

### skill - Execute Skills

Execute custom skills.

**Parameters:**

```typescript
{
  skill: string;        // Skill name (required)
}
```

**Example:**

```typescript
await engine.sendMessage({
  message: 'Use code-reviewer skill to review this code',
  write: false,
});
```

---

## Background Tasks

### bash_output - Get Background Task Output

Get output from background running tasks.

**Parameters:**

```typescript
{
  task_id: string;      // Task ID (required)
}
```

### kill_bash - Terminate Background Tasks

Terminate background running tasks.

**Parameters:**

```typescript
{
  shell_id: string;     // Shell ID (required)
}
```

---

## Tool Permissions

### Control Tool Availability

```typescript
await engine.initialize({
  tools: {
    read: true,      // Enable
    bash: false,     // Disable
    fetch: true,     // Enable
  },
});
```

### Approval Mode

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',  // Auto-approve write operations
});
```

**Details:** [Approval System Documentation](./APPROVAL.md)

---

## Custom Tools

Tools can be extended via MCP or Skill system.

**MCP Extension:** [MCP Integration Documentation](./MCP.md)
**Skill Extension:** [Skill System Documentation](./SKILLS.md)

---

## More Documentation

- **[API Reference](./API.md)** - Complete API documentation
- **[Configuration](./CONFIG.md)** - Configuration options
- **[Approval System](./APPROVAL.md)** - Permission control
- **[MCP Integration](./MCP.md)** - Extend tools
