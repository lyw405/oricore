/**
 * Engine API
 *
 * Main entry point for the OriCore package.
 * Provides a high-level API for AI-powered coding assistance.
 */

import type { Context } from '../core/context';
import { Context as createContext } from '../core/context';
import type { Config, ProviderConfig } from '../core/config';
import type { MessageBus as IMessageBus } from '../communication/messageBus';
import { MessageBus } from '../communication/messageBus';
import type { PlatformAdapter } from '../platform';
import { NodePlatform } from '../platform/node';
import type { Session } from '../session/session';
import { Session as createSession } from '../session/session';
import { JsonlLogger } from '../jsonl';
import { resolveModelWithContext } from '../core/model';
import { runLoop, type LoopResult } from '../core/loop';
import { resolveTools, Tools } from '../tools/tool';
import type { NormalizedMessage } from '../core/message';
import type { ToolUse, ToolResult, ToolApprovalResult } from '../tools/tool';
import { modeRegistry, registerBuiltinModes, type Mode, type ModeType } from '../modes';

/**
 * Engine initialization options
 */
export interface EngineOptions {
  /** Product name (e.g., "AI Engine") */
  productName: string;
  /** ASCII art banner for display */
  productASCIIArt?: string;
  /** Version string */
  version: string;
  /** Current working directory */
  cwd?: string;
  /** Fetch implementation (optional, uses globalThis.fetch by default) */
  fetch?: typeof globalThis.fetch;
  /** Platform implementation (defaults to Node.js) */
  platform?: PlatformAdapter;
  /** Message bus for event communication */
  messageBus?: MessageBus;
}

/**
 * Engine configuration
 */
export interface EngineConfig {
  /** Model to use for AI responses */
  model?: string;
  /** Model for planning mode */
  planModel?: string;
  /** Approval mode for tool usage */
  approvalMode?: 'default' | 'autoEdit' | 'yolo';
  /** System prompt override */
  systemPrompt?: string;
  /** Additional system prompt */
  appendSystemPrompt?: string;
  /** Language for responses */
  language?: string;
  /** MCP servers configuration */
  mcpServers?: Record<string, any>;
  /** Tools configuration */
  tools?: Record<string, boolean>;
  /** Plugins to load */
  plugins?: (string | any)[];
  /** Provider configuration (custom API endpoints, keys, etc.) */
  provider?: Record<string, ProviderConfig>;
}

/**
 * Session creation options
 */
export interface SessionOptions {
  /** Session ID (auto-generated if not provided) */
  sessionId?: string;
  /** Resume from existing session */
  resume?: string;
  /** Continue from latest session */
  continue?: boolean;
}

/**
 * Message sending options
 */
export interface SendMessageOptions {
  /** Message content (string or message array) */
  message: string | NormalizedMessage[];
  /** Session ID for persistent conversations */
  sessionId?: string;
  /** Enable write tools (default: true) */
  write?: boolean;
  /** Enable todo tools (default: true) */
  todo?: boolean;
  /** Enable ask user question tool (default: false) */
  askUserQuestion?: boolean;
  /** Enable task/agent tool (default: false) */
  task?: boolean;
  /** Override model for this message */
  model?: string;
  /** Maximum turns (default: 50) */
  maxTurns?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Callback for text delta (streaming) */
  onTextDelta?: (text: string) => Promise<void>;
  /** Callback for complete text */
  onText?: (text: string) => Promise<void>;
  /** Callback for reasoning */
  onReasoning?: (text: string) => Promise<void>;
  /** Callback for tool use */
  onToolUse?: (toolUse: ToolUse) => Promise<ToolUse>;
  /** Callback for tool result */
  onToolResult?: (toolUse: ToolUse, toolResult: ToolResult, approved: boolean) => Promise<ToolResult>;
  /** Callback for tool approval (return false to deny) */
  onToolApprove?: (toolUse: ToolUse) => Promise<ToolApprovalResult>;
  /** Callback for turn completion */
  onTurn?: (turn: any) => Promise<void>;
}

/**
 * Main Engine class
 *
 * The Engine is the primary interface for interacting with the AI coding assistant.
 * It manages initialization, configuration, and provides access to context.
 */
export class Engine {
  private context: Context | null = null;
  private platform: PlatformAdapter;
  private messageBus: MessageBus;
  private options: EngineOptions;
  private initialized = false;
  private currentMode: ModeType = 'default';
  private jsonlLoggers: Map<string, JsonlLogger> = new Map();

  constructor(options: EngineOptions) {
    this.options = options;
    this.platform = options.platform || new NodePlatform();
    this.messageBus = options.messageBus || new MessageBus();

    // Register built-in modes
    registerBuiltinModes(modeRegistry);
  }

  /**
   * Initialize the engine with configuration
   */
  async initialize(config: EngineConfig = {}): Promise<void> {
    const cwd = this.options.cwd || this.platform.cwd();

    this.context = await createContext.create({
      cwd,
      productName: this.options.productName,
      productASCIIArt: this.options.productASCIIArt,
      version: this.options.version,
      argvConfig: config,
      plugins: config.plugins || [],
      messageBus: this.messageBus,
      fetch: this.options.fetch,
    });

    await this.context.apply({
      hook: 'initialized',
      args: [{ cwd, quiet: false }],
      type: 'series' as any,
    });

    this.initialized = true;
  }

  /**
   * Create or resume a session
   */
  async createSession(options: SessionOptions = {}): Promise<Session> {
    if (!this.initialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    if (!this.context) {
      throw new Error('Context not available');
    }

    const paths = this.context.paths;
    const sessionId = options.sessionId || (() => {
      if (options.resume) {
        return options.resume;
      }
      if (options.continue) {
        return paths.getLatestSessionId() || this.generateSessionId();
      }
      return this.generateSessionId();
    })();

    if (options.resume || options.continue) {
      const logPath = paths.getSessionLogPath(sessionId);
      return createSession.resume({ id: sessionId, logPath });
    }

    return createSession.create();
  }

  /**
   * Get the MessageBus for event communication
   */
  getMessageBus(): MessageBus {
    return this.messageBus;
  }

  /**
   * Get the current context
   */
  getContext(): Context {
    if (!this.context) {
      throw new Error('Engine not initialized');
    }
    return this.context;
  }

  /**
   * Shutdown the engine and cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.context) {
      await this.context.destroy();
      this.context = null;
    }
    this.jsonlLoggers.clear();
    this.initialized = false;
  }

  /**
   * Get or create a JsonlLogger for a session
   */
  private getLogger(sessionId: string): JsonlLogger {
    if (!this.jsonlLoggers.has(sessionId)) {
      if (!this.context) {
        throw new Error('Context not available');
      }
      const logPath = this.context.paths.getSessionLogPath(sessionId);
      this.jsonlLoggers.set(sessionId, new JsonlLogger({ filePath: logPath }));
    }
    return this.jsonlLoggers.get(sessionId)!;
  }

  /**
   * Get list of all sessions
   */
  getSessions() {
    if (!this.context) {
      throw new Error('Context not available');
    }
    return this.context.paths.getAllSessions();
  }

  /**
   * Send a message to the AI and get a response
   *
   * This is the main method for interacting with the AI engine.
   * It handles the full conversation loop including tool execution.
   *
   * @param options - Message sending options
   * @returns Promise<LoopResult> - The result of the conversation loop
   */
  async sendMessage(options: SendMessageOptions): Promise<LoopResult> {
    if (!this.initialized || !this.context) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const context = this.context;
    const modelId = options.model || context.config.model;
    const resolvedModel = await resolveModelWithContext(modelId, context);

    if (!resolvedModel.model) {
      throw new Error(`Failed to resolve model: ${modelId}`);
    }

    // Get or create session ID
    const sessionId = options.sessionId || this.generateSessionId();

    // Get logger for this session
    const logger = this.getLogger(sessionId);

    // Resolve available tools
    const toolsList = await resolveTools({
      context,
      sessionId,
      write: options.write !== false,
      todo: options.todo !== false,
      askUserQuestion: options.askUserQuestion || false,
      task: options.task || false,
      signal: options.signal,
    });

    // Get system prompt from config
    const systemPrompt = context.config.systemPrompt || '';

    // Load existing session history if session exists
    let sessionHistory: import('../core/history').History | undefined = undefined;
    if (options.sessionId) {
      const { loadSessionMessages } = await import('../session/session');
      const logPath = context.paths.getSessionLogPath(sessionId);
      try {
        const existingMessages = loadSessionMessages({ logPath });
        if (existingMessages.length > 0) {
          const { History } = await import('../core/history');
          sessionHistory = new History({
            messages: existingMessages,
          });
        }
      } catch {
        // Session doesn't exist yet, will be created
      }
    }

    // Create the persistence callback that will be used by history.addMessage
    const onMessageCallback = async (message: import('../core/message').NormalizedMessage) => {
      // Persist all messages (user, assistant, tool) to session log
      // We add sessionId here for tracking
      logger.addMessage({ message: { ...message, sessionId } });
    };

    // If we have session history, set its onMessage callback
    if (sessionHistory && !sessionHistory.onMessage) {
      sessionHistory.onMessage = onMessageCallback;
    }

    // Run the conversation loop
    // The history's onMessage callback will handle persistence
    const result = await runLoop({
      input: options.message,
      history: sessionHistory,
      model: resolvedModel.model,
      tools: new Tools(toolsList),
      cwd: context.cwd,
      systemPrompt,
      maxTurns: options.maxTurns,
      signal: options.signal,
      onTextDelta: options.onTextDelta,
      onText: options.onText,
      onReasoning: options.onReasoning,
      onToolUse: options.onToolUse,
      onToolResult: options.onToolResult,
      onToolApprove: options.onToolApprove,
      onTurn: options.onTurn,
      onMessage: sessionHistory?.onMessage || onMessageCallback,
    });

    // Record the model usage if successful
    if (result.success && modelId) {
      context.globalData.addRecentModel(modelId);
    }

    return result;
  }

  /**
   * Create a simple request-response interaction (single turn)
   *
   * This is a simplified version of sendMessage that returns just the text response.
   * Tools are disabled by default for simple requests.
   *
   * @param message - The message to send
   * @param options - Optional configuration
   * @returns Promise<string> - The AI's text response
   */
  async ask(
    message: string,
    options?: {
      model?: string;
      systemPrompt?: string;
    },
  ): Promise<string> {
    const result = await this.sendMessage({
      message,
      model: options?.model,
      write: false,
      todo: false,
      askUserQuestion: false,
      task: false,
      maxTurns: 1,
    });

    if (result.success) {
      return result.data.text || '';
    }

    throw new Error(result.error.message);
  }

  /**
   * Set the current interaction mode
   *
   * @param mode - The mode to set (e.g., 'brainstorm', 'plan', 'review')
   */
  setMode(mode: ModeType): void {
    if (!modeRegistry.has(mode)) {
      throw new Error(`Unknown mode: ${mode}. Available modes: ${modeRegistry.getAll().map(m => m.id).join(', ')}`);
    }
    this.currentMode = mode;
  }

  /**
   * Get the current mode
   */
  getMode(): ModeType {
    return this.currentMode;
  }

  /**
   * Get all available modes
   */
  getAvailableModes(): Mode[] {
    return modeRegistry.getAll();
  }

  /**
   * Register a custom mode
   *
   * @param mode - The mode to register
   */
  registerMode(mode: Mode): void {
    modeRegistry.register(mode);
  }

  /**
   * Send a message using the current mode
   *
   * This is a convenience method that applies the current mode's configuration
   *
   * @param message - The message to send
   * @param options - Optional overrides for this specific message
   * @returns Promise<LoopResult> - The result of the conversation loop
   */
  async sendMessageWithMode(
    message: string | NormalizedMessage[],
    options?: Partial<Omit<SendMessageOptions, 'message' | 'systemPrompt'>> & {
      systemPrompt?: string;
    },
  ): Promise<LoopResult> {
    const mode = modeRegistry.get(this.currentMode);
    if (!mode) {
      throw new Error(`Current mode ${this.currentMode} not found`);
    }

    const modeConfig = mode.config;

    // Build options with mode config as defaults
    const sendOptions: Omit<SendMessageOptions, 'message'> = {
      write: options?.write ?? modeConfig.write,
      todo: options?.todo ?? modeConfig.todo,
      askUserQuestion: options?.askUserQuestion ?? modeConfig.askUserQuestion,
      task: options?.task ?? modeConfig.task,
      maxTurns: options?.maxTurns ?? modeConfig.maxTurns,
      model: options?.model ?? modeConfig.model,
      onTextDelta: options?.onTextDelta,
      onText: options?.onText,
      onReasoning: options?.onReasoning,
      onToolUse: options?.onToolUse,
      onToolResult: options?.onToolResult,
      onToolApprove: options?.onToolApprove,
      onTurn: options?.onTurn,
      signal: options?.signal,
    };

    // Special handling for system prompt
    const finalSystemPrompt = options?.systemPrompt ?? modeConfig.systemPrompt;

    return this._sendMessageWithSystemPrompt(message, sendOptions, finalSystemPrompt);
  }

  /**
   * Internal method to send message with custom system prompt
   */
  private async _sendMessageWithSystemPrompt(
    message: string | NormalizedMessage[],
    options: Omit<SendMessageOptions, 'message'>,
    systemPrompt: string,
  ): Promise<LoopResult> {
    if (!this.initialized || !this.context) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const context = this.context;
    const modelId = options.model || context.config.model;
    const resolvedModel = await resolveModelWithContext(modelId, context);

    if (!resolvedModel.model) {
      throw new Error(`Failed to resolve model: ${modelId}`);
    }

    // Resolve available tools
    const toolsList = await resolveTools({
      context,
      sessionId: this.generateSessionId(),
      write: options.write !== false,
      todo: options.todo !== false,
      askUserQuestion: options.askUserQuestion || false,
      task: options.task || false,
      signal: options.signal,
    });

    // Run the conversation loop with custom system prompt
    const result = await runLoop({
      input: message,
      model: resolvedModel.model,
      tools: new Tools(toolsList),
      cwd: context.cwd,
      systemPrompt,
      maxTurns: options.maxTurns,
      signal: options.signal,
      onTextDelta: options.onTextDelta,
      onText: options.onText,
      onReasoning: options.onReasoning,
      onToolUse: options.onToolUse,
      onToolResult: options.onToolResult,
      onToolApprove: options.onToolApprove,
      onTurn: options.onTurn,
    });

    // Record the model usage if successful
    if (result.success && modelId) {
      context.globalData.addRecentModel(modelId);
    }

    return result;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

/**
 * Create a new Engine instance
 */
export function createEngine(options: EngineOptions): Engine {
  return new Engine(options);
}

// Re-export commonly used types
export type { Config, ApprovalMode } from '../core/config';
export type { Session, SessionId } from '../session/session';
export type { Tool, ToolUse, ToolResult } from '../tools/tool';
export type { Message, NormalizedMessage, UserMessage, AssistantMessage } from '../core/message';
export type { Plugin, PluginHookType } from '../core/plugin';
