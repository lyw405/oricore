# 5分钟上手 OriCore

本教程将带你快速了解 OriCore 的核心功能。

[English](QUICKSTART.md) | [中文文档](QUICKSTART.zh-CN.md)

---

## 第一步：安装

```bash
npm install oricore ai
```

---

## 第二步：创建你的第一个 AI 助手

创建一个新文件 `my-assistant.js`：

```javascript
import { createEngine } from 'oricore';

async function main() {
  // 1. 创建引擎
  const engine = createEngine({
    productName: 'MyAssistant',
    version: '1.0.0',
  });

  // 2. 初始化（使用 DeepSeek 作为示例）
  await engine.initialize({
    model: 'deepseek/deepseek-chat',
    provider: {
      deepseek: {
        options: {
          apiKey: process.env.DEEPSEEK_API_KEY,  // 从环境变量读取
          baseURL: 'https://api.deepseek.com',
        },
      },
    },
  });

  // 3. 发送消息
  const result = await engine.sendMessage({
    message: '用 TypeScript 写一个计算斐波那契数列的函数',
    write: true,  // 允许 AI 写文件
  });

  console.log(result.data.text);

  // 4. 清理
  await engine.shutdown();
}

main();
```

运行：

```bash
# 设置环境变量（推荐使用 .env 文件或直接导出）
export DEEPSEEK_API_KEY=your-key
node my-assistant.js
```

AI 将会：
1. 分析你的请求
2. 创建 TypeScript 文件
3. 写入代码

---

## 第三步：让 AI 读写文件

AI 可以读取和分析你的代码：

```javascript
const result = await engine.sendMessage({
  message: '分析 src/utils.ts 文件，找出可以优化的地方',
  write: false,  // 只读，不写文件
});
```

AI 可以修改现有文件：

```javascript
const result = await engine.sendMessage({
  message: '把 src/utils.ts 中的所有 var 改成 const',
  write: true,  // 允许修改
});
```

---

## 第四步：多轮对话（会话）

使用 `sessionId` 让 AI 记住上下文：

```javascript
const sessionId = 'my-session-' + Date.now();

// 第一轮
await engine.sendMessage({
  sessionId,
  message: '我叫 Alice，是一名前端开发者',
  write: false,
});

// 第二轮 - AI 记住了你的名字
const result = await engine.sendMessage({
  sessionId,
  message: '我叫什么名字？',
  write: false,
});

console.log(result.data.text);  // "你的名字是 Alice！"
```

---

## 第五步：使用交互模式

针对不同任务选择合适的模式：

```javascript
// 头脑风暴模式 - 探索创意
engine.setMode('brainstorm');
const design = await engine.sendMessageWithMode('我想做一个任务管理 App，有什么建议？');

// 规划模式 - 制定实施计划
engine.setMode('plan');
const plan = await engine.sendMessageWithMode('制定用户认证模块的实施计划');

// 审查模式 - 代码审查
engine.setMode('review');
const review = await engine.sendMessageWithMode('审查这段代码：...');
```

---

## 第六步：控制 AI 的权限

使用审批模式控制 AI 能做什么：

```javascript
await engine.initialize({
  model: 'deepseek/deepseek-chat',
  approvalMode: 'autoEdit',  // 允许读写，但命令需要确认

  provider: {
    deepseek: {
      options: { apiKey: process.env.DEEPSEEK_API_KEY }
    },
  },
});
```

审批模式说明：

| 模式 | 读文件 | 写文件 | 执行命令 |
|------|--------|--------|----------|
| `default` | ✅ 自动 | ❌ 需确认 | ❌ 需确认 |
| `autoEdit` | ✅ 自动 | ✅ 自动 | ❌ 需确认 |
| `yolo` | ✅ 自动 | ✅ 自动 | ✅ 自动（高风险命令除外） |

---

## 第七步：流式响应

实时获取 AI 的输出：

```javascript
const result = await engine.sendMessage({
  message: '解释 React 的 useCallback 是什么',
  write: false,

  onTextDelta: async (text) => {
    process.stdout.write(text);  // 实时输出
  },
});
```

---

## 常见配置

### 使用 OpenAI

```javascript
await engine.initialize({
  model: 'openai/gpt-4o',
  provider: {
    openai: {
      options: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      },
    },
  },
});
```

### 使用 Anthropic Claude

```javascript
await engine.initialize({
  model: 'anthropic/claude-sonnet-4-20250514',
  provider: {
    anthropic: {
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com',
      },
    },
  },
});
```

### 使用智谱 AI

```javascript
await engine.initialize({
  model: 'zhipuai/glm-4.7',
  provider: {
    zhipuai: {
      options: {
        apiKey: process.env.ZHIPUAI_API_KEY,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      },
    },
  },
});
```

---

## 下一步

现在你已经掌握了 OriCore 的基础！继续学习：

- **[API 参考](./API.md)** - 完整的 API 文档
- **[配置详解](./CONFIG.md)** - 所有配置选项
- **[工具系统](./TOOLS.md)** - 内置工具详解
- **[会话管理](./SESSIONS.md)** - 持久化与上下文压缩
- **[场景教程](./TUTORIALS.md)** - 实战示例

---

## 需要帮助？

- **GitHub**: [lyw405/oricore](https://github.com/lyw405/oricore)
- **问题反馈**: [Issues](https://github.com/lyw405/oricore/issues)
