# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v1.3.0.html).

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
