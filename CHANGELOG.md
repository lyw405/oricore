# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v1.3.0.html).

## [1.3.5] - Unreleased

### Added

- **Loop**: External signal synchronization for immediate cancellation
  - Added event-driven abort signal handling in `runLoop` via `addEventListener`
  - LLM requests now abort immediately when `session.cancel` is triggered
  - Automatic cleanup of event listeners prevents memory leaks
  - Improves responsiveness and resource efficiency during cancellation

- **Models**: Added Kimi K2.5 model support
  - New model: `moonshotai/kimi-k2.5` with multimodal capabilities (text, image, video)
  - Added to providers: `openrouter`, `moonshotai`, `moonshotai-cn`, `canopywave`
  - Features: reasoning support, tool calling, 262K context window

- **Tool Approval**: Enhanced session context with `sessionId`
  - `toolApproval` requests now include `sessionId` parameter
  - Enables session-specific logging, UI routing, and multi-session management
  - Backward compatible - existing handlers can ignore the new parameter
  - Updated JSDoc documentation for `MessageBus.request()` and `MessageBus.registerHandler()`

- **Grep Tool**: Enhanced result truncation and token management
  - Added intelligent truncation based on line count (max 1000 lines)
  - Added line length truncation (max 2000 chars per line)
  - Added content length truncation (max 262K chars)
  - Added token-based truncation (max 25K tokens using gpt-tokenizer)
  - Improved return display with truncation reason and hints

### Changed

- **Documentation**: Enhanced tool approval API documentation
  - Added comprehensive JSDoc comments with usage examples
  - Documented `sessionId` parameter and its use cases
  - Provided backward compatibility notes

- **Models**: Renamed `createModelType` to `apiFormat` for clarity
  - Changed from `createModelType?: 'anthropic'` to `apiFormat?: 'anthropic' | 'openai' | 'responses'`
  - Better reflects the purpose of specifying API format
  - Affects provider configuration and thinking config detection

- **Models**: Added `source` field to Provider interface
  - Tracks provider origin (`'built-in'` or custom string)
  - Helps distinguish between built-in and user-configured providers
  - Applied to all 27 built-in providers

### Fixed

- **History**: Fixed crash when model has no `limit` property
  - Added fallback `{ context: 0, output: 0 }` for models without limit definition
  - Prevents `Cannot read property 'context' of undefined` errors
  - Improves compatibility with custom model configurations

- **Thinking Config**: Fixed provider format detection
  - Updated detection from `createModelType` to `apiFormat`
  - Ensures correct Anthropic reasoning model detection
  - Affects models with `reasoning: true` flag

## [1.3.3] - 2025-01-26

### Added

- **Documentation**: Tool Approval System documentation
  - New comprehensive documentation: `APPROVAL.md` (English) and `APPROVAL.zh-CN.md` (Chinese)
  - Documents three approval modes: `default`, `autoEdit`, `yolo`
  - 6-step approval flow explanation with priority order
  - Custom approval handler examples (CLI, web, conditional logic)
  - Tool categories (`read`, `write`, `command`, `network`, `ask`)
  - Best practices for production use
  - Added approval system section to USAGE.md and USAGE.zh-CN.md
  - Added approval documentation links to README.md and README.zh-CN.md

### Changed

- **Skill**: Increase description max length from 1024 to 2048 characters
  - Allows for more detailed skill descriptions

- **Skill**: Remove single-line restriction for skill descriptions
  - Multi-line descriptions are now supported for better documentation

- **Tools**: Add plugin hook support for tool injection
  - Plugins can now inject custom tools via the `tool` hook
  - Hook uses `SeriesMerge` type to combine plugin tools with built-in tools
  - Added `isPlan` parameter to `resolveTools` for better context awareness
  - Tool filtering now applies to both built-in and plugin-injected tools

## [1.3.2] - 2025-01-23

### Fixed

- **safeParseJson**: Add jsonrepair fallback for malformed JSON
  - When JSON.parse fails, attempts to repair using jsonrepair library
  - Prevents data loss from malformed JSON responses

- **MCP**: Fix Windows npx/npm/pnpm/bun/bunx ENOENT error
  - Shell commands now wrapped with cmd.exe on win32 platform
  - Resolves command spawning failures on Windows

- **Loop**: Record results for remaining tools on denial
  - Added helper to ensure all tool calls get results even when earlier tools are denied
  - Prevents tool result loss and improves LLM context

- **Model**: Update cerebras free tier context limits
  - zai-glm-4.7: context 64000, output 40000
  - gpt-oss-120b: context 65000, output 32000

## [1.3.0] - 2025-01-21

### ⚠️ BREAKING CHANGES

- **SessionConfigManager.write() is now async**
  - `write()` now returns `Promise<void>` instead of `void`
  - All calls to `sessionConfigManager.write()` must be awaited
  - Migration: Change `sessionConfigManager.write()` to `await sessionConfigManager.write()`

  **Reason:** Added file locking for concurrent write safety. This prevents race conditions when multiple processes write to the same session file.

  **Before:**
  ```typescript
  const manager = new SessionConfigManager({ logPath });
  manager.config.approvalMode = 'autoEdit';
  manager.write();
  ```

  **After:**
  ```typescript
  const manager = new SessionConfigManager({ logPath });
  manager.config.approvalMode = 'autoEdit';
  await manager.write();
  ```

### Added

- **File Locking** (`src/utils/fileLock.ts`)
  - File-based locking mechanism for concurrent write safety
  - Automatic lock expiration (30 seconds)
  - Global lock registry to prevent deadlocks

- **Mode Persistence** (`src/session/session.ts`)
  - `SessionConfigManager.setMode(mode)` - Set current interaction mode
  - `SessionConfigManager.getMode()` - Get current interaction mode
  - Mode is now persisted to session config and restored on resume

- **PDF Support** (`src/utils/pdf-parser.ts`)
  - PDF file parsing via `read` tool
  - Requires optional `pdf-parse` dependency
  - Supports text extraction, metadata extraction, multi-page documents
  - Limits: 5MB max size, 100 pages, 15K tokens

- **History Compression Fallback** (`src/core/history.ts`)
  - Graceful degradation when AI compression fails
  - Automatic fallback summary generation
  - Returns `fallback: true` flag and error details

- **Runtime Config Validation** (`src/core/configValidation.ts`)
  - Zod-based schema validation for configuration
  - MCP server, provider, and agent validation
  - `ConfigManager.enableValidation()` / `disableValidation()`
  - `ConfigManager.validate()` - Returns validation result
  - `ConfigManager.getValidationErrors()` - Get formatted errors

### Changed

- **Better Error Messages**
  - PDF parsing errors now include installation instructions
  - Validation errors include path, message, and value

- **Improved Resilience**
  - Session continues even when history compression fails
  - Better handling of large PDF files with truncation

### Fixed

- Race condition in `SessionConfigManager.write()` when called concurrently
- Empty summary handling in history compression
- Configuration validation was missing at runtime

## [1.2.0] - Previous

### Features
- Multi-model support (40+ providers)
- Rich tool system (read, write, edit, bash, grep, glob, fetch)
- Interaction modes (default, brainstorm, plan, review, debug)
- MCP integration
- Skill system
- Agent framework
- Session management
- Streaming support
