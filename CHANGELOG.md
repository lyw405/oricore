# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v1.3.0.html).

## [Unreleased]

### Added

## [1.4.0] - 2026-02-03

### ⚠️ BREAKING CHANGES

- **Removed OAuth Providers**: GitHub Copilot and Antigravity providers removed
  - `github-copilot` provider (18 models) removed
  - `antigravity` provider (11 models) removed
  - `oauth-providers` dependency removed
  - Use alternative providers for affected models

### Added

- **CJS Support**: Added CommonJS build output
  - `package.json` now exports both ESM (`import`) and CJS (`require`) formats
  - Build system migrated from `bun build` to `tsup`
  - Automatic `.d.ts` and `.d.cts` type declaration generation

### Changed

- **Build System**: Migrated to tsup
  - Replaced `bun build` with `tsup` for better dual-format support
  - Sourcemaps enabled for both ESM and CJS builds
  - All dependencies remain external (not bundled)

- **API Key Handling**: Improved quote handling
  - API keys now automatically stripped of surrounding quotes
  - Handles user input like `'key'` or `"key"`
  - Handles `.env` files with `KEY='value'` format

### Fixed

- **ESM/CJS Compatibility**: Fixed module compatibility issues
  - `ripgrep.ts`: Updated to work in both ESM and CJS contexts
  - `context.ts`: Fixed jiti initialization to use `cwd` instead of `import.meta.url`
  - Removed `@ts-ignore` comments in favor of proper type declarations

- **Package Exports**: Cleaned up redundant export conditions
  - Removed redundant `default` export (handled by `import`)

## [1.3.7] - 2026-02-02

### Added

- **Recent Models Tracking**: Track recently used models (max 5) in GlobalData
  - Add `getRecentModels()` and `addRecentModel()` methods to `GlobalData` class
  - Automatically record model usage when `sendMessage()` or `sendMessageWithMode()` succeeds
  - Export `GlobalData` from main index
  - Follows LRU semantics: most recent first, duplicates moved to front, capped at 5 entries

- **Model Configuration**: Add `variants` field to Model interface for provider-specific reasoning configs
  - Models now include pre-computed reasoning variants (low/medium/high/max)
  - Each provider (Anthropic, OpenAI, Google, etc.) gets tailored reasoning configurations
  - Variants computed at model initialization instead of runtime

- **Provider Headers**: Add `headers` field to Provider interface
  - Providers can now specify custom request headers
  - OriCore branding headers added to major providers (anthropic, openai, deepseek, cerebras)

### Fixed

- **Build**: Fixed TypeScript error in `loop.ts:485`
  - Changed `metadata` type from `unknown` to `Record<string, unknown>`
  - Resolves spread operator error with object types

### Changed

- **Thinking Config Architecture**: Restructure reasoning configuration system
  - Move thinking config generation from runtime to model definition phase
  - Add `transformVariants()` function in `resolution.ts` to generate provider-specific configs
  - Add `normalizeModel()` function to auto-populate model definitions with variants
  - Remove `src/core/thinking-config.ts` (logic migrated to `resolution.ts`)

- **Prompt Cache**: Extend cache control support to multiple providers
  - Now supports: anthropic, openrouter, bedrock, openaiCompatible
  - Cache strategy: first 2 system messages + last 2 non-system messages

- **Proxy Config**: Enhanced header merging
  - Headers now merge from three levels with priority: provider.headers → provider.options.headers → config.headers

### Internal

- Remove `src/core/thinking-config.ts` - logic migrated to `src/core/model/resolution.ts`
- Add `ReasoningEffort` and `ThinkingConfig` types to `src/core/loop.ts`

## [1.3.6] - 2025-01-31

### ⚠️ BREAKING CHANGES

- **AI SDK Upgrade**: Migrated from AI SDK v2 to v3
  - All `LanguageModelV2*` types renamed to `LanguageModelV3*`
  - Middleware interface changed from `LanguageModelMiddleware` to `LanguageModelV3Middleware`
  - Middleware implementations now require `specificationVersion: 'v3'` property
  - Usage handling updated to support new V3 format (nested token objects with `.total` property)

### Added

- **Compression System**: New intelligent context overflow management (`src/compression.ts`)
  - `Compression.prune()` - Prune historical tool outputs to reduce token usage
  - `isOverflow()` - Determine when context compression is needed
  - `CompressionConfig` interface with configurable thresholds and protected tools
  - Two-phase compression: Pruning (fast) → Compaction (LLM-based summary)
  - Protected tools list (`SKILL`, `TASK`) to preserve critical context
  - Configurable protection threshold (40k tokens), minimum prune amount (20k tokens)
  - Protected recent conversation turns (default: 2 turns)

- **History Compression**: Enhanced with two-phase strategy
  - Phase 1: Prune tool outputs (excluding protected tools like SKILL/TASK)
  - Phase 2: Compact messages if still over limit after pruning
  - Returns `pruned` and `pruneResult` in compression result
  - Language-aware compaction prompts support

- **Language Support**: Multilingual compaction prompts
  - `language` config parameter passed through loop → history → compact pipeline
  - `getLanguageInstruction()` utility for localized instructions
  - `buildCompactSystemPrompt()` integrates language instructions

- **Tool Constants**: Added `TOOL_NAMES.SKILL` constant

- **Export Compression APIs**: Public API exports
  - `Compression` namespace with `DEFAULT_CONFIG` and `prune()` method
  - `isOverflow()` function for overflow detection
  - `CompressionConfig` and `PruneResult` types

### Changed

- **Dependencies**: Upgraded all AI SDK packages to v3
  - `@ai-sdk/anthropic`: ^2.0.56 → ^3.0.29
  - `@ai-sdk/cerebras`: ^1.0.33 → ^2.0.24
  - `@ai-sdk/google`: ^2.0.46 → ^3.0.16
  - `@ai-sdk/huggingface`: ^0.0.12 → ^1.0.23
  - `@ai-sdk/mcp`: ^0.0.12 → ^1.0.14
  - `@ai-sdk/openai`: ^2.0.86 → ^3.0.21
  - `@ai-sdk/openai-compatible`: ^1.0.29 → ^2.0.22
  - `@ai-sdk/xai`: ^2.0.40 → ^3.0.41
  - `@aihubmix/ai-sdk-provider`: ^0.0.6 → ^1.0.3
  - `ai`: ^5.0.113 → ^6.0.59 (peer dependency)

- **Model Resolution**: Improved model alias handling
  - Model aliases now get default limit if not defined in models registry
  - Prevents crashes for undefined model configurations

- **Background Detection**: Added tnpm and cnpm to dev command list

### Fixed

- **Session Config**: Fixed mutability issue in `SessionConfigManager.load()`
  - Now returns a copy of `DEFAULT_SESSION_CONFIG` instead of reference
  - Prevents accidental mutation of default config

- **Middleware**: Updated middleware implementations for V3 compatibility
  - `mergeSystemMessagesMiddleware`: Added `specificationVersion: 'v3'`
  - `prependSystemMessageMiddleware`: Added `specificationVersion: 'v3'`
  - Type imports changed from `ai` to `@ai-sdk/provider`

- **Usage**: Fixed token parsing for AI SDK v6 format
  - Handles nested token objects (e.g., `inputTokens.total`)
  - Maintains backward compatibility with v5 format

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
