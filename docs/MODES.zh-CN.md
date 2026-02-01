# 交互模式

OriCore 的 5 种专业交互模式文档。

[English](MODES.md) | [中文文档](MODES.zh-CN.md)

---

## 目录

- [模式概览](#模式概览)
- [内置模式](#内置模式)
- [使用模式](#使用模式)
- [自定义模式](#自定义模式)

---

## 模式概览

OriCore 提供 5 种针对不同任务优化的交互模式，每种模式有专门的系统提示词和行为配置。

### 模式对比

| 模式 | 用途 | 写文件 | 询问用户 | 任务管理 | 最大轮数 |
|------|------|--------|----------|----------|----------|
| `default` | 通用助手 | ✅ | ❌ | ✅ | 50 |
| `brainstorm` | 头脑风暴 | ❌ | ✅ | ❌ | 50 |
| `plan` | 制定计划 | ✅ | ✅ | ✅ | 50 |
| `review` | 代码审查 | ❌ | ❌ | ❌ | 10 |
| `debug` | 调试排查 | ✅ | ✅ | ✅ | 50 |

---

## 内置模式

### default - 通用助手模式

**用途：** 日常 AI 助手任务

**特点：**
- 完整功能
- 可以写文件
- 不询问用户
- 启用任务管理
- 启用 Agent
- 最多 50 轮对话

**系统提示词：**
```
You are a helpful AI assistant with coding capabilities.
```

**使用示例：**

```typescript
engine.setMode('default');

const result = await engine.sendMessageWithMode('创建一个 TypeScript 函数');
```

---

### brainstorm - 头脑风暴模式

**用途：** 创意探索和设计讨论

**特点：**
- 不写代码文件
- 频繁互动提问
- 不使用任务管理
- 不启动 Agent
- 最多 50 轮对话

**系统提示词：**
```
You are a design brainstorming partner. Ask questions to understand requirements, explore multiple approaches, and discuss trade-offs. Focus on ideation rather than implementation.
```

**使用示例：**

```typescript
engine.setMode('brainstorm');

const result = await engine.sendMessageWithMode('我想做一个任务管理 App，有什么建议？');
```

**典型对话流程：**
1. AI 询问项目目标、用户群体
2. 探讨不同的功能方案
3. 讨论技术栈选择
4. 分析优缺点

---

### plan - 规划模式

**用途：** 创建详细的实施计划

**特点：**
- 可以写文件（保存计划）
- 可以询问用户
- 启用任务管理
- 最多 50 轮对话

**系统提示词：**
```
You are an implementation planner. Create detailed, step-by-step implementation plans. Break down tasks into actionable steps with clear dependencies.
```

**使用示例：**

```typescript
engine.setMode('plan');

const result = await engine.sendMessageWithMode('制定用户认证模块的实施计划');
```

**输出格式：**
1. 任务分解
2. 依赖关系
3. 实施步骤
4. 验证标准

---

### review - 审查模式

**用途：** 代码审查和分析

**特点：**
- 只读，不写文件
- 不询问用户
- 不使用任务管理
- 不启动 Agent
- 最多 10 轮对话

**系统提示词：**
```
You are a code reviewer. Analyze code for quality, security, performance, and best practices. Provide constructive feedback with specific examples.
```

**使用示例：**

```typescript
engine.setMode('review');

const result = await engine.sendMessageWithMode('审查这段代码的性能问题：');
```

**审查维度：**
- 代码质量
- 安全性
- 性能
- 最佳实践
- 可维护性

---

### debug - 调试模式

**用途：** 故障排查和问题诊断

**特点：**
- 完整功能
- 可以写文件（修复代码）
- 可以询问用户
- 启用任务管理
- 最多 50 轮对话

**系统提示词：**
```
You are a debugging specialist. Help identify and fix issues. Ask relevant questions to understand the problem, analyze error messages, and provide solutions.
```

**使用示例：**

```typescript
engine.setMode('debug');

const result = await engine.sendMessageWithMode('帮我调试这个错误：TypeError: Cannot read property "x"');
```

**调试流程：**
1. 理解错误信息
2. 分析可能原因
3. 提供解决方案
4. 验证修复

---

## 使用模式

### 设置模式

```typescript
engine.setMode('brainstorm');
```

### 发送消息（使用当前模式）

```typescript
const result = await engine.sendMessageWithMode('讨论一下新功能的设计');
```

### 获取当前模式

```typescript
const currentMode = engine.getMode();
console.log(currentMode);  // 'brainstorm'
```

### 获取所有可用模式

```typescript
const modes = engine.getAvailableModes();

modes.forEach(mode => {
  console.log(`${mode.name}: ${mode.description}`);
});
```

---

## 自定义模式

### 注册自定义模式

```typescript
engine.registerMode({
  id: 'typescript-expert',
  name: 'TypeScript Expert',
  description: 'TypeScript 开发专家',
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
  systemPrompt: string;       // 系统提示词
  write?: boolean;            // 是否允许写文件
  todo?: boolean;             // 是否启用任务管理
  askUserQuestion?: boolean;  // 是否允许询问用户
  task?: boolean;             // 是否允许启动 Agent
  maxTurns?: number;          // 最大轮数
  model?: string;             // 使用模型
  temperature?: number;       // 温度参数
  autoCompact?: boolean;      // 是否自动压缩
}
```

### 完整示例：创建测试专家模式

```typescript
engine.registerMode({
  id: 'testing-expert',
  name: 'Testing Expert',
  description: '单元测试和集成测试专家',
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
    temperature: 0.3,  // 更确定性的输出
  },
});

// 使用自定义模式
engine.setMode('testing-expert');

const result = await engine.sendMessageWithMode('为这个函数写单元测试');
```

---

## 模式切换

### 动态切换

根据任务切换模式：

```typescript
// 设计阶段
engine.setMode('brainstorm');
await engine.sendMessageWithMode('讨论新功能的设计');

// 规划阶段
engine.setMode('plan');
await engine.sendMessageWithMode('制定实施计划');

// 开发阶段
engine.setMode('default');
await engine.sendMessageWithMode('开始实现功能');

// 审查阶段
engine.setMode('review');
await engine.sendMessageWithMode('审查代码');
```

---

## 更多文档

- **[API 参考](./API.md)** - 模式相关 API
- **[配置详解](./CONFIG.md)** - 模式配置
- **[教程](./TUTORIALS.md)** - 使用示例
