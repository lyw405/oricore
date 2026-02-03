# 场景教程

OriCore 实战教程合集。

[English](TUTORIALS.md) | [中文文档](TUTORIALS.zh-CN.md)

---

## 教程目录

1. [构建聊天机器人](#教程-1-构建聊天机器人)
2. [代码审查助手](#教程-2-代码审查助手)
3. [自动化重构工具](#教程-3-自动化重构工具)
4. [文档生成器](#教程-4-文档生成器)
5. [多会话管理](#教程-5-多会话管理)

---

## 教程 1：构建聊天机器人

创建一个简单的 AI 聊天机器人。

### 完整代码

```typescript
import { createEngine } from 'oricore';
import readline from 'readline';

async function main() {
  // 1. 创建引擎
  const engine = createEngine({
    productName: 'ChatBot',
    version: '1.0.0',
  });

  // 2. 初始化
  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        options: {
          apiKey: process.env.DEEPSEEK_API_KEY,
        },
      },
    },
  });

  // 3. 创建 readline 界面
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const sessionId = 'chat-' + Date.now();

  // 4. 聊天循环
  const chat = async () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        await engine.shutdown();
        return;
      }

      // 5. 发送消息
      const result = await engine.sendMessage({
        sessionId,
        message: input,
        write: false,
      });

      console.log('Bot:', result.data.text);

      // 下一轮
      chat();
    });
  };

  console.log('聊天机器人已启动！输入 "exit" 退出。');
  chat();
}

main();
```

### 运行

```bash
DEEPSEEK_API_KEY=your-key node chatbot.js
```

### 扩展

- 添加流式响应（`onTextDelta`）
- 保存聊天历史
- 添加多模态支持（图片输入）

---

## 教程 2：代码审查助手

创建一个自动审查代码的工具。

### 完整代码

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
        options: {
          apiKey: process.env.ANTHROPIC_API_KEY,
        },
      },
    },
  });

  // 使用审查模式
  engine.setMode('review');

  // 读取文件
  const code = readFileSync(filePath, 'utf-8');

  // 审查代码
  const result = await engine.sendMessage({
    message: `审查以下代码的质量、安全性和性能：

\`\`\`typescript
${code}
\`\`\``,
    write: false,
  });

  console.log(result.data.text);

  await engine.shutdown();
}

// 使用
reviewCode('./src/utils.ts');
```

### 输出示例

```
## 代码审查报告

### 优点
- 使用 TypeScript 提供类型安全
- 函数职责单一，易于理解

### 问题
1. **安全性**: 用户输入未验证，可能导致注入攻击
2. **性能**: 使用嵌套循环，时间复杂度 O(n²)
3. **可维护性**: 缺少错误处理

### 建议
- 添加输入验证
- 使用 Map 优化查找
- 添加 try-catch 错误处理
```

---

## 教程 3：自动化重构工具

自动重构代码中的常见问题。

### 完整代码

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
        options: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      },
    },
    approvalMode: 'autoEdit',  // 自动批准写操作
  });

  // 查找所有文件
  const files = await glob(pattern);

  console.log(`找到 ${files.length} 个文件`);

  // 逐个重构
  for (const file of files) {
    console.log(`重构: ${file}`);

    const result = await engine.sendMessage({
      message: `重构这个文件：
1. 把所有 var 改成 const/let
2. 添加类型注解
3. 优化命名
4. 添加 JSDoc 注释

文件：${file}`,
      write: true,
    });

    if (result.success) {
      console.log('✅ 完成');
    } else {
      console.log('❌ 失败:', result.error?.message);
    }
  }

  await engine.shutdown();
}

// 使用：重构所有 TypeScript 文件
refactorCode('src/**/*.ts');
```

---

## 教程 4：文档生成器

自动生成项目文档。

### 完整代码

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
        options: {
          apiKey: process.env.DEEPSEEK_API_KEY,
        },
      },
    },
  });

  // 1. 读取 package.json
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

  // 2. 生成 README
  const readmeResult = await engine.sendMessage({
    message: `为以下项目生成一个完整的 README.md：

项目名称：${pkg.name}
版本：${pkg.version}
描述：${pkg.description}

依赖：${JSON.stringify(pkg.dependencies, null, 2)}

包含以下章节：
- 项目介绍
- 功能特性
- 安装说明
- 使用示例
- API 文档
- 贡献指南`,
    write: false,
  });

  // 3. 保存文档
  writeFileSync('README.md', readmeResult.data.text);

  console.log('✅ README.md 已生成');

  await engine.shutdown();
}

generateDocs();
```

---

## 教程 5：多会话管理

管理多个独立的对话会话。

### 完整代码

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
        options: {
          apiKey: process.env.DEEPSEEK_API_KEY,
        },
      },
    },
  });

  // 会话 1：代码助手
  const codeSessionId = 'code-' + Date.now();
  await engine.sendMessage({
    sessionId: codeSessionId,
    message: '记住：我正在做一个 React 项目，使用 TypeScript',
    write: false,
  });

  // 会话 2：翻译助手
  const translateSessionId = 'translate-' + Date.now();
  await engine.sendMessage({
    sessionId: translateSessionId,
    message: '你是一个专业翻译，中英互译',
    write: false,
  });

  // 使用不同的会话
  const codeResult = await engine.sendMessage({
    sessionId: codeSessionId,
    message: '创建一个 React 组件',
    write: false,
  });

  const translateResult = await engine.sendMessage({
    sessionId: translateSessionId,
    message: '把 "Hello World" 翻译成中文',
    write: false,
  });

  console.log('代码助手:', codeResult.data.text);
  console.log('翻译助手:', translateResult.data.text);

  // 列出所有会话
  const sessions = engine.getSessions();
  console.log('\n所有会话:');
  sessions.forEach(s => {
    console.log(`- ${s.sessionId}: ${s.messageCount} 条消息`);
  });

  await engine.shutdown();
}

multiSessionDemo();
```

---

## 进阶教程

### 流式响应聊天

```typescript
const result = await engine.sendMessage({
  message: '讲一个故事',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // 实时输出
  },
});
```

### 自定义审批处理

```typescript
const result = await engine.sendMessage({
  message: '执行一些操作',
  write: true,

  onToolApprove: async (toolUse) => {
    console.log(`工具: ${toolUse.name}`);
    const approved = await confirm(`批准 ${toolUse.name}?`);
    return { approved };
  },
});
```

### 使用交互模式

```typescript
// 规划模式
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('制定开发计划');

// 审查模式
engine.setMode('review');
const review = await engine.sendMessageWithMode('审查代码');
```

---

## 更多资源

- **[5分钟上手](./QUICKSTART.md)** - 快速入门
- **[API 参考](./API.md)** - 完整 API
- **[工具系统](./TOOLS.md)** - 工具详解
- **[会话管理](./SESSIONS.md)** - 会话详解
