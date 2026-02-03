# MCP Integration

Documentation for OriCore's Model Context Protocol (MCP) integration.

[English](MCP.md) | [中文文档](MCP.zh-CN.md)

---

## Table of Contents

- [MCP Overview](#mcp-overview)
- [Configuring MCP Servers](#configuring-mcp-servers)
- [Transport Types](#transport-types)
- [Using MCP Tools](#using-mcp-tools)
- [Common MCP Servers](#common-mcp-servers)
- [Troubleshooting](#troubleshooting)

---

## MCP Overview

MCP (Model Context Protocol) is an open protocol that allows AI assistants to connect to external data sources and tools.

### Why Use MCP?

- **Unlimited Extensions** - Connect to any MCP server for new capabilities
- **Standardization** - Unified interface to access different services
- **Community Support** - Rich MCP ecosystem

### MCP in OriCore

OriCore natively supports MCP, enabling:
- Connect to multiple MCP servers
- Automatic discovery and conversion of MCP tools
- Seamless integration into AI conversations

---

## Configuring MCP Servers

### Configure During Initialization

```typescript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  provider: {
    deepseek: {
      options: {
        apiKey: 'your-key',
      },
    },
  },

  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
  },
});
```

### Multiple Servers

```typescript
await engine.initialize({
  mcpServers: {
    // File system
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },

    // GitHub
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    },

    // Database
    postgres: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://...'],
    },
  },
});
```

---

## Transport Types

### 1. Stdio - Local Command Line Server

The most common method, communicates via standard input/output.

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      type: 'stdio',          // Default, can be omitted
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
    },
  },
});
```

### 2. HTTP - HTTP Requests

Connect to a remote HTTP MCP server.

```typescript
await engine.initialize({
  mcpServers: {
    remoteServer: {
      type: 'http',
      url: 'https://mcp-server.example.com/mcp',
      headers: {
        'Authorization': 'Bearer your-token',
      },
    },
  },
});
```

### 3. SSE - Server-Sent Events

Connect to an SSE MCP server.

```typescript
await engine.initialize({
  mcpServers: {
    sseServer: {
      type: 'sse',
      url: 'https://mcp-server.example.com/sse',
      headers: {
        'Authorization': 'Bearer your-token',
      },
    },
  },
});
```

---

## Using MCP Tools

### Automatic Discovery

MCP tools are automatically added to the AI's toolset, with tool names formatted as `mcp__server_name__tool_name`.

```typescript
// AI can automatically use MCP tools
await engine.sendMessage({
  message: 'Use GitHub API to get repository information',
  write: false,
});
```

### Tool Naming Convention

| MCP Server | MCP Tool | OriCore Tool Name |
|-----------|---------|------------------|
| github | create_issue | `mcp__github__create_issue` |
| filesystem | read_file | `mcp__filesystem__read_file` |
| postgres | query | `mcp__postgres__query` |

---

## Common MCP Servers

### Filesystem Server

Provides enhanced file operation capabilities.

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
    },
  },
});
```

### GitHub Server

Access GitHub API.

```typescript
await engine.initialize({
  mcpServers: {
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    },
  },
});
```

### Database Server

Connect to PostgreSQL database.

```typescript
await engine.initialize({
  mcpServers: {
    postgres: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://user:pass@localhost/db'],
    },
  },
});
```

### Brave Search Server

Web search capabilities.

```typescript
await engine.initialize({
  mcpServers: {
    braveSearch: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY,
      },
    },
  },
});
```

---

## Troubleshooting

### Check Server Status

```typescript
const mcpManager = engine.getContext().mcpManager;

// Get all server statuses
const statuses = await mcpManager.getAllServerStatus();
console.log(statuses);
// {
//   filesystem: { status: 'connected', toolCount: 5 },
//   github: { status: 'failed', error: 'Authentication failed' }
// }
```

### Retry Connection

```typescript
await mcpManager.retryConnection('github');
```

### Disable Server

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
      disable: true,  // Disable this server
    },
  },
});
```

---

## Complete Example

```typescript
import { createEngine } from 'oricore';

async function main() {
  const engine = createEngine({
    productName: 'MyApp',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        options: {
          apiKey: 'your-key',
        },
      },
    },

    // Configure multiple MCP servers
    mcpServers: {
      // File system
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', './src'],
      },

      // GitHub
      github: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        },
      },

      // Remote HTTP server
      remoteTools: {
        type: 'http',
        url: 'https://api.example.com/mcp',
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
      },
    },
  });

  // Check status
  const mcpManager = engine.getContext().mcpManager;
  const statuses = await mcpManager.getAllServerStatus();
  console.log('MCP server statuses:', statuses);

  // Use AI + MCP tools
  const result = await engine.sendMessage({
    message: 'Check the latest issues in the GitHub repository',
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

main();
```

---

## More Resources

- **[MCP Protocol](https://modelcontextprotocol.io)** - Official documentation
- **[MCP Servers List](https://github.com/modelcontextprotocol/servers)** - Community servers
- **[Configuration Guide](./CONFIG.md)** - More configuration options
