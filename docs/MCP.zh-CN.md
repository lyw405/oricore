# MCP 集成

OriCore 的 Model Context Protocol (MCP) 集成文档。

[English](MCP.md) | [中文文档](MCP.zh-CN.md)

---

## 目录

- [MCP 概览](#mcp-概览)
- [配置 MCP 服务器](#配置-mcp-服务器)
- [传输类型](#传输类型)
- [使用 MCP 工具](#使用-mcp-工具)
- [常见 MCP 服务器](#常见-mcp-服务器)
- [故障排查](#故障排查)

---

## MCP 概览

MCP (Model Context Protocol) 是一个开放协议，允许 AI 助手连接到外部数据源和工具。

### 为什么使用 MCP？

- **无限扩展** - 连接任何 MCP 服务器获取新能力
- **标准化** - 统一的接口访问不同服务
- **社区支持** - 丰富的 MCP 生态系统

### OriCore 中的 MCP

OriCore 原生支持 MCP，可以：
- 连接多个 MCP 服务器
- 自动发现和转换 MCP 工具
- 无缝集成到 AI 对话中

---

## 配置 MCP 服务器

### 在初始化时配置

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

### 多个服务器

```typescript
await engine.initialize({
  mcpServers: {
    // 文件系统
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

    // 数据库
    postgres: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://...'],
    },
  },
});
```

---

## 传输类型

### 1. Stdio - 本地命令行服务器

最常用的方式，通过标准输入/输出通信。

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      type: 'stdio',          // 默认可省略
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
    },
  },
});
```

### 2. HTTP - HTTP 请求

连接到远程 HTTP MCP 服务器。

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

连接到 SSE MCP 服务器。

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

## 使用 MCP 工具

### 自动发现

MCP 工具会自动添加到 AI 的工具集中，工具名格式为 `mcp__server_name__tool_name`。

```typescript
// AI 可以自动使用 MCP 工具
await engine.sendMessage({
  message: '使用 GitHub API 获取仓库信息',
  write: false,
});
```

### 工具命名规则

| MCP 服务器 | MCP 工具 | OriCore 工具名 |
|-----------|---------|---------------|
| github | create_issue | `mcp__github__create_issue` |
| filesystem | read_file | `mcp__filesystem__read_file` |
| postgres | query | `mcp__postgres__query` |

---

## 常见 MCP 服务器

### 文件系统服务器

提供增强的文件操作能力。

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

### GitHub 服务器

访问 GitHub API。

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

### 数据库服务器

连接 PostgreSQL 数据库。

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

### Brave Search 服务器

网络搜索能力。

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

## 故障排查

### 检查服务器状态

```typescript
const mcpManager = engine.getContext().mcpManager;

// 获取所有服务器状态
const statuses = await mcpManager.getAllServerStatus();
console.log(statuses);
// {
//   filesystem: { status: 'connected', toolCount: 5 },
//   github: { status: 'failed', error: 'Authentication failed' }
// }
```

### 重试连接

```typescript
await mcpManager.retryConnection('github');
```

### 禁用服务器

```typescript
await engine.initialize({
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
      disable: true,  // 禁用此服务器
    },
  },
});
```

---

## 完整示例

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

    // 配置多个 MCP 服务器
    mcpServers: {
      // 文件系统
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

      // 远程 HTTP 服务器
      remoteTools: {
        type: 'http',
        url: 'https://api.example.com/mcp',
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
      },
    },
  });

  // 检查状态
  const mcpManager = engine.getContext().mcpManager;
  const statuses = await mcpManager.getAllServerStatus();
  console.log('MCP 服务器状态:', statuses);

  // 使用 AI + MCP 工具
  const result = await engine.sendMessage({
    message: '查看 GitHub 仓库的最新 issues',
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

main();
```

---

## 更多资源

- **[MCP 协议](https://modelcontextprotocol.io)** - 官方文档
- **[MCP 服务器列表](https://github.com/modelcontextprotocol/servers)** - 社区服务器
- **[配置详解](./CONFIG.zh-CN.md)** - 更多配置选项
