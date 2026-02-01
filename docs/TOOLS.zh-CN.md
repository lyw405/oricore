# 工具系统

OriCore 内置的完整工具集文档。

[English](TOOLS.md) | [中文文档](TOOLS.zh-CN.md)

---

## 目录

- [工具概览](#工具概览)
- [工具分类](#工具分类)
- [内置工具详解](#内置工具详解)
  - [read](#read-读取文件)
  - [write](#write-写入文件)
  - [edit](#edit-编辑文件)
  - [bash](#bash-执行命令)
  - [glob](#glob-文件搜索)
  - [grep](#grep-内容搜索)
  - [ls](#ls-列出目录)
  - [fetch](#fetch-网络请求)
  - [task](#task-启动-agent)
  - [todoWrite](#todowrite-任务管理)
  - [askUserQuestion](#askuserquestion-询问用户)
  - [skill](#skill-执行技能)
- [后台任务](#后台任务)
- [工具权限](#工具权限)

---

## 工具概览

OriCore 内置 **14 个工具**，涵盖文件操作、代码搜索、命令执行、网络请求等场景。

| 工具 | 功能 | 分类 |
|------|------|------|
| `read` | 读取文件 | read |
| `write` | 写入文件 | write |
| `edit` | 编辑文件 | write |
| `bash` | 执行命令 | command |
| `bash_output` | 获取后台任务输出 | read |
| `kill_bash` | 终止后台任务 | command |
| `glob` | 文件搜索 | read |
| `grep` | 内容搜索 | read |
| `ls` | 列出目录 | read |
| `fetch` | 网络请求 | network |
| `task` | 启动 Agent | - |
| `todoWrite` | 任务管理 | write |
| `askUserQuestion` | 询问用户 | ask |
| `skill` | 执行技能 | - |

---

## 工具分类

### read 类 - 只读操作

自动批准，无需用户确认。

- `read` - 读取文件
- `grep` - 搜索文件内容
- `glob` - 搜索文件
- `ls` - 列出目录
- `bash_output` - 获取后台任务输出

### write 类 - 文件修改

- `default` 模式：需要确认
- `autoEdit` 模式：自动批准
- `yolo` 模式：自动批准

- `write` - 写入文件
- `edit` - 编辑文件
- `todoWrite` - 任务管理

### command 类 - 命令执行

- `default` 模式：需要确认
- `autoEdit` 模式：需要确认
- `yolo` 模式：自动批准（高风险命令除外）

- `bash` - 执行命令
- `kill_bash` - 终止后台任务

### network 类 - 网络请求

- `default` 模式：需要确认
- `autoEdit` 模式：需要确认
- `yolo` 模式：自动批准

- `fetch` - 网络请求

### ask 类 - 用户交互

总是需要用户输入。

- `askUserQuestion` - 询问用户

---

## 内置工具详解

### read - 读取文件

读取文件内容，支持文本、图片和 PDF。

**参数：**

```typescript
{
  file_path: string;    // 文件路径（必填）
  offset?: number;      // 起始行号（可选）
  limit?: number;       // 读取行数（可选）
}
```

**示例：**

```typescript
// AI 自动调用
await engine.sendMessage({
  message: '读取 src/index.ts 文件的内容',
  write: false,
});
```

**支持的文件格式：**
- 文本文件（.ts, .js, .md, .txt 等）
- 图片（.png, .jpg, .jpeg, .gif, .webp）
- PDF（需安装 `pdf-parse`）

---

### write - 写入文件

创建新文件或覆盖已有文件。

**参数：**

```typescript
{
  file_path: string;    // 文件路径（必填）
  content: string;      // 文件内容（必填）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '创建一个 utils.ts 文件，包含一个日期格式化函数',
  write: true,
});
```

---

### edit - 编辑文件

在文件中执行精确的字符串替换。

**参数：**

```typescript
{
  file_path: string;    // 文件路径（必填）
  old_string: string;   // 要替换的字符串（必填）
  new_string: string;   // 新字符串（必填）
  replace_all?: boolean; // 是否替换所有匹配项（可选）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '把 src/utils.ts 中所有的 var 替换成 const',
  write: true,
});
```

---

### bash - 执行命令

执行 Shell 命令。

**参数：**

```typescript
{
  command: string;          // 命令（必填）
  timeout?: number;         // 超时时间（毫秒）
  run_in_background?: boolean;  // 是否后台运行
  description?: string;     // 命令描述
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '列出当前目录的所有文件',
  write: false,
});

// 后台运行
await engine.sendMessage({
  message: '后台运行 npm run dev',
  write: false,
});
```

**安全限制：**
- 高风险命令需要确认（如 `rm -rf`）
- 禁止的命令会被拒绝

---

### glob - 文件搜索

按模式匹配查找文件。

**参数：**

```typescript
{
  pattern: string;      // 匹配模式（必填）
  path?: string;        // 搜索路径（可选）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '查找所有 .ts 文件',
  write: false,
});

// 递归搜索
await engine.sendMessage({
  message: '在 src 目录下查找所有 .test.ts 文件',
  write: false,
});
```

**模式示例：**
- `*.ts` - 当前目录所有 .ts 文件
- `**/*.test.ts` - 递归查找所有测试文件
- `src/**/*.ts` - src 目录下所有 .ts 文件

---

### grep - 内容搜索

在文件中搜索内容（使用 ripgrep）。

**参数：**

```typescript
{
  pattern: string;              // 搜索模式（必填）
  search_path?: string;         // 搜索路径
  include?: string;             // 文件类型过滤
  limit?: number;               // 结果数量限制
  output_mode?: 'content' | 'files_with_matches' | 'count';
  before_context?: number;      // 前置行数
  after_context?: number;       // 后置行数
  context?: number;             // 上下文行数
  line_numbers?: boolean;       // 显示行号
  ignore_case?: boolean;        // 忽略大小写
  type?: string;                // 文件类型
  multiline?: boolean;          // 多行匹配
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '在代码中搜索 "TODO" 注释',
  write: false,
});

await engine.sendMessage({
  message: '在 src 目录搜索包含 "interface" 的 TypeScript 文件',
  write: false,
});
```

---

### ls - 列出目录

列出目录内容。

**参数：**

```typescript
{
  dir_path: string;     // 目录路径（必填）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '列出 src 目录的内容',
  write: false,
});
```

---

### fetch - 网络请求

发起 HTTP 请求获取内容。

**参数：**

```typescript
{
  url: string;          // URL（必填）
  prompt: string;       // 处理提示（必填）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '获取 https://api.github.com/lyw405/oricore 的信息',
  write: false,
});
```

---

### task - 启动 Agent

启动专用子 Agent 处理复杂任务。

**参数：**

```typescript
{
  description: string;      // 任务描述（必填）
  prompt: string;           // 任务提示（必填）
  subagent_type: string;    // Agent 类型
  resume?: string;          // 恢复 ID
}
```

**Agent 类型：**
- `explore` - 探索代码库
- `general-purpose` - 通用任务
- `plan` - 制定计划

**示例：**

```typescript
await engine.sendMessage({
  message: '探索这个项目的结构',
  write: false,
  task: true,
});
```

---

### todoWrite - 任务管理

创建和管理结构化任务列表。

**参数：**

```typescript
{
  todos: Array<{
    id: string;                                // 任务 ID
    content: string;                           // 任务内容
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';       // 优先级
  }>;
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '帮我规划一个博客系统的开发任务',
  write: true,
});
```

---

### askUserQuestion - 询问用户

与用户进行交互式问答。

**参数：**

```typescript
{
  questions: Array<{
    question: string;       // 问题
    header: string;         // 标题（最多 12 字符）
    options: Array<{
      label: string;        // 选项标签
      description: string;  // 选项描述
    }>;
    multiSelect?: boolean;  // 是否多选
  }>;
  answers?: Array<{
    question: string;
    answer: string;
  }>;
}
```

**示例：**

AI 会自动调用此工具来询问用户选择或确认。

---

### skill - 执行技能

执行自定义技能。

**参数：**

```typescript
{
  skill: string;        // 技能名称（必填）
}
```

**示例：**

```typescript
await engine.sendMessage({
  message: '使用 code-reviewer 技能审查这段代码',
  write: false,
});
```

---

## 后台任务

### bash_output - 获取后台任务输出

获取后台运行任务的输出。

**参数：**

```typescript
{
  task_id: string;      // 任务 ID（必填）
}
```

### kill_bash - 终止后台任务

终止后台运行的任务。

**参数：**

```typescript
{
  shell_id: string;     // Shell ID（必填）
}
```

---

## 工具权限

### 控制工具可用性

```typescript
await engine.initialize({
  tools: {
    read: true,      // 启用
    bash: false,     // 禁用
    fetch: true,     // 启用
  },
});
```

### 审批模式

```typescript
await engine.initialize({
  approvalMode: 'autoEdit',  // 写操作自动批准
});
```

**详情：** [English](TOOLS.md) | [中文文档](TOOLS.zh-CN.md)

---

## 自定义工具

可以通过 MCP 或 Skill 系统扩展工具。

**MCP 扩展：** [English](TOOLS.md) | [中文文档](TOOLS.zh-CN.md)
**Skill 扩展：** [English](TOOLS.md) | [中文文档](TOOLS.zh-CN.md)

---

## 更多文档

- **[API 参考](./API.md)** - 完整的 API 文档
- **[配置详解](./CONFIG.md)** - 配置选项
- **[审批系统](./APPROVAL.md)** - 权限控制
- **[MCP 集成](./MCP.md)** - 扩展工具
