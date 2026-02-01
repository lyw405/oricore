/**
 * Bash tool implementation.
 *
 * Provides shell command execution with security validation and background task support.
 *
 * Architecture:
 * - Security validation: bash-security.ts
 * - Output processing: bash-output.ts
 * - Constants: bash-constants.ts
 * - Tool creation and command execution: this file
 */
import crypto from 'crypto';
import createDebug from 'debug';
import fs from 'fs';
import os from 'os';
import path from 'pathe';
import { z } from 'zod';
import type { BackgroundTaskManager } from '../../core/backgroundTaskManager';
import { BASH_EVENTS, TOOL_NAMES } from '../../core/constants';
import type { MessageBus } from '../../communication/messageBus';
import { createTool } from '../tool';
import { shouldRunInBackground } from '../../utils/background-detection';
import { getErrorMessage } from '../../utils/error';
import { shellExecute } from '../../utils/shell-execution';
// Import security functions
import {
  getCommandRoot,
  hasCommandSubstitution,
  isBannedCommand,
  isHighRiskCommand,
  validateCommand,
} from '../../utils/bash-security';
// Import output functions
import {
  formatExecutionResult,
  getMaxOutputLimit,
  trimEmptyLines,
  truncateOutput,
} from '../../utils/bash-output';
// Import constants
import {
  BANNED_COMMANDS,
  BACKGROUND_CHECK_INTERVAL,
  DEFAULT_TIMEOUT,
  MAX_TIMEOUT,
} from '../../utils/bash-constants';

// Re-export functions for testing compatibility
export {
  getCommandRoot,
  hasCommandSubstitution,
  isHighRiskCommand,
};
export { getMaxOutputLimit, trimEmptyLines, truncateOutput };

const debug = createDebug('oricore:tools:bash');

// ============================================================================
// Local Types
// ============================================================================

/** Local type definition for bash background events. */
type BashPromptBackgroundEvent = {
  taskId: string;
  command: string;
  currentOutput: string;
};

// ============================================================================
// Background Task Helpers
// ============================================================================

/**
 * Extract background PIDs from temp file created by pgrep.
 * Returns non-PID lines via console.error for debugging.
 */
function extractBackgroundPIDs(
  tempFilePath: string,
  mainPid: number | null | undefined,
  isWindows: boolean,
): number[] {
  if (isWindows || !fs.existsSync(tempFilePath)) {
    return [];
  }

  const pgrepLines = fs
    .readFileSync(tempFilePath, 'utf8')
    .split('\n')
    .filter(Boolean);

  const backgroundPIDs: number[] = [];
  for (const line of pgrepLines) {
    if (/^\d+$/.test(line)) {
      const pgrepPid = Number(line);
      if (pgrepPid !== mainPid) {
        backgroundPIDs.push(pgrepPid);
      }
    }
  }

  return backgroundPIDs;
}

/**
 * Create result object for background task.
 */
function createBackgroundResult(
  command: string,
  backgroundTaskId: string,
  outputBuffer: string,
): { shouldReturn: true; result: { llmContent: string; backgroundTaskId: string } } {
  const truncated = truncateOutput(outputBuffer);
  return {
    shouldReturn: true,
    result: {
      llmContent: [
        'Command has been moved to background execution.',
        `Task ID: ${backgroundTaskId}`,
        `Command: ${command}`,
        '',
        'Initial output:',
        truncated,
        '',
        'Use bash_output tool with task_id to read further output.',
        'Use kill_bash tool with task_id to terminate the task.',
      ].join('\n'),
      backgroundTaskId,
    },
  };
}

/**
 * Create a promise that resolves when background transition occurs or command completes.
 */
function createBackgroundCheckPromise(
  movedToBackgroundRef: { value: boolean },
  backgroundTaskIdRef: { value: string | undefined },
  outputBufferRef: { value: string },
  command: string,
  resultPromise: Promise<any>,
): Promise<{ shouldReturn: boolean; result: any }> {
  return new Promise<{ shouldReturn: boolean; result: any }>((resolve) => {
    let checkInterval: NodeJS.Timeout | null = null;

    checkInterval = setInterval(() => {
      if (movedToBackgroundRef.value && backgroundTaskIdRef.value) {
        if (checkInterval) clearInterval(checkInterval);
        resolve(
          createBackgroundResult(
            command,
            backgroundTaskIdRef.value,
            outputBufferRef.value,
          ),
        );
      }
    }, 100);

    resultPromise
      .then(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (!movedToBackgroundRef.value) {
          resolve({ shouldReturn: false, result: null });
        }
      })
      .catch(() => {
        if (checkInterval) clearInterval(checkInterval);
        resolve({ shouldReturn: false, result: null });
      });
  });
}

// ============================================================================
// Command Execution
// ============================================================================

async function executeCommand(
  command: string,
  timeout: number,
  cwd: string,
  runInBackground: boolean | undefined,
  backgroundTaskManager: BackgroundTaskManager,
  messageBus: MessageBus | undefined,
  pendingBackgroundMoves: Map<string, { moveToBackground: () => void }>,
) {
  const actualTimeout = Math.min(timeout, MAX_TIMEOUT);

  // Validate command
  const validationError = validateCommand(command);
  if (validationError) {
    return {
      isError: true,
      llmContent: validationError,
    };
  }

  // Setup execution environment
  const isWindows = os.platform() === 'win32';
  const tempFileName = `shell_pgrep_${crypto.randomBytes(6).toString('hex')}.tmp`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  const shell = process.env.SHELL || '/bin/bash';
  const isFish = !isWindows && shell.endsWith('/fish');

  // Generate wrapped command for shell execution
  const wrappedCommand = isWindows
    ? command
    : (() => {
        let cmd = command.trim();
        if (!cmd.endsWith('&')) cmd += ';';
        if (isFish) {
          return `begin; ${cmd} end; set __code $status; pgrep -g 0 >${tempFilePath} 2>&1; exit $__code`;
        }
        return `{ ${cmd} }; __code=$?; pgrep -g 0 >${tempFilePath} 2>&1; exit $__code;`;
      })();

  debug('wrappedCommand', wrappedCommand);

  // Cleanup function
  const cleanupTempFile = () => {
    try {
      if (!isWindows && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  // State management
  const startTime = Date.now();
  let hasOutput = false;
  const outputBufferRef = { value: '' };
  const movedToBackgroundRef = { value: false };
  const backgroundTaskIdRef: { value: string | undefined } = { value: undefined };
  const isCommandCompletedRef = { value: false };
  let backgroundCheckInterval: ReturnType<typeof setInterval> | null = null;
  let backgroundPromptEmitted = false;

  // Execute command
  const { result: resultPromise, pid } = shellExecute(
    wrappedCommand,
    cwd,
    actualTimeout,
    (event) => {
      if (movedToBackgroundRef.value) {
        if (event.type === 'data' && backgroundTaskIdRef.value) {
          backgroundTaskManager.appendOutput(
            backgroundTaskIdRef.value,
            event.chunk,
          );
        }
        return;
      }

      if (event.type === 'data') {
        hasOutput = true;
        outputBufferRef.value += event.chunk;

        // Start background check if not already started
        if (!backgroundCheckInterval) {
          backgroundCheckInterval = setInterval(() => {
            if (movedToBackgroundRef.value || isCommandCompletedRef.value) {
              if (backgroundCheckInterval) clearInterval(backgroundCheckInterval);
              backgroundCheckInterval = null;
              return;
            }

            const elapsed = Date.now() - startTime;
            if (
              shouldRunInBackground(
                command,
                elapsed,
                hasOutput,
                isCommandCompletedRef.value,
                runInBackground,
              ) &&
              !backgroundPromptEmitted
            ) {
              backgroundPromptEmitted = true;

              // Trigger background transition
              if (runInBackground === true) {
                if (!movedToBackgroundRef.value) {
                  movedToBackgroundRef.value = true;
                  const backgroundPIDs = extractBackgroundPIDs(
                    tempFilePath,
                    pid,
                    isWindows,
                  );
                  const pgid =
                    backgroundPIDs.length > 0
                      ? backgroundPIDs[0]
                      : (pid ?? undefined);
                  const backgroundTaskId =
                    backgroundTaskManager.createTask({
                      command,
                      pid: pid ?? 0,
                      pgid,
                    });

                  resultPromise.then((result) => {
                    const status = result.cancelled
                      ? 'killed'
                      : result.exitCode === 0
                        ? 'completed'
                        : 'failed';
                    backgroundTaskManager.updateTaskStatus(
                      backgroundTaskId,
                      status,
                      result.exitCode,
                    );
                  });

                  backgroundTaskIdRef.value = backgroundTaskId;
                }
              } else if (messageBus) {
                const tempTaskId = `temp_${crypto
                  .randomBytes(6)
                  .toString('hex')}`;
                pendingBackgroundMoves.set(tempTaskId, {
                  moveToBackground: () => {
                    movedToBackgroundRef.value = true;
                    const backgroundPIDs = extractBackgroundPIDs(
                      tempFilePath,
                      pid,
                      isWindows,
                    );
                    const pgid =
                      backgroundPIDs.length > 0
                        ? backgroundPIDs[0]
                        : (pid ?? undefined);
                    const backgroundTaskId =
                      backgroundTaskManager.createTask({
                        command,
                        pid: pid ?? 0,
                        pgid,
                      });

                    resultPromise.then((result) => {
                      const status = result.cancelled
                        ? 'killed'
                        : result.exitCode === 0
                          ? 'completed'
                          : 'failed';
                      backgroundTaskManager.updateTaskStatus(
                        backgroundTaskId,
                        status,
                        result.exitCode,
                      );
                    });

                    backgroundTaskIdRef.value = backgroundTaskId;
                  },
                });

                const promptEvent: BashPromptBackgroundEvent = {
                  taskId: tempTaskId,
                  command,
                  currentOutput: outputBufferRef.value,
                };

                messageBus.emitEvent(BASH_EVENTS.PROMPT_BACKGROUND, promptEvent);
              }

              if (backgroundCheckInterval) clearInterval(backgroundCheckInterval);
              backgroundCheckInterval = null;
            }
          }, BACKGROUND_CHECK_INTERVAL);
        }
      }
    },
  );

  // Monitor command completion
  resultPromise.finally(() => {
    isCommandCompletedRef.value = true;
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
      backgroundCheckInterval = null;
    }
  });

  // Clear background prompt if needed
  const clearBackgroundPromptIfNeeded = () => {
    if (backgroundPromptEmitted && messageBus && !movedToBackgroundRef.value) {
      messageBus.emitEvent(BASH_EVENTS.BACKGROUND_MOVED, {});
    }
  };

  // Wait for background transition or command completion
  try {
    const backgroundCheckResult = await Promise.race([
      createBackgroundCheckPromise(
        movedToBackgroundRef,
        backgroundTaskIdRef,
        outputBufferRef,
        command,
        resultPromise,
      ),
      resultPromise.then(() => ({ shouldReturn: false, result: null })),
    ]);

    if (backgroundCheckResult.shouldReturn) {
      cleanupTempFile();
      clearBackgroundPromptIfNeeded();
      return backgroundCheckResult.result;
    }
  } catch (error) {
    cleanupTempFile();
    clearBackgroundPromptIfNeeded();
    throw error;
  }

  const result = await resultPromise;
  cleanupTempFile();
  clearBackgroundPromptIfNeeded();

  const backgroundPIDs = extractBackgroundPIDs(tempFilePath, result.pid, isWindows);

  const formatted = formatExecutionResult(
    result,
    command,
    wrappedCommand,
    cwd,
    backgroundPIDs,
  );
  debug('llmContent', formatted.llmContent);

  return formatted;
}

// ============================================================================
// Tool Creation Functions
// ============================================================================

export function createBashOutputTool(opts: {
  backgroundTaskManager: BackgroundTaskManager;
}) {
  const { backgroundTaskManager } = opts;

  return createTool({
    name: TOOL_NAMES.BASH_OUTPUT,
    description: `Retrieve output from a background bash task.

Usage:
- Accepts a task_id parameter to identify the background task
- Returns the accumulated stdout and stderr output
- Shows current task status (running/completed/killed/failed)
- Use this to monitor or check output from long-running background tasks
- Task IDs are returned when commands are moved to background`,
    parameters: z.object({
      task_id: z.string().describe('The ID of the background task'),
    }),
    getDescription: ({ params }) => {
      if (!params.task_id || typeof params.task_id !== 'string') {
        return 'Read background task output';
      }
      return `Read output from task: ${params.task_id}`;
    },
    execute: async ({ task_id }) => {
      const task = backgroundTaskManager.getTask(task_id);
      if (!task) {
        return {
          isError: true,
          llmContent: `Task ${task_id} not found. Use bash tool to see available tasks.`,
        };
      }

      const lines = [
        `Command: ${task.command}`,
        `Status: ${task.status}`,
        `PID: ${task.pid}`,
        `Created: ${new Date(task.createdAt).toISOString()}`,
        '',
        'Output:',
        task.output || '(no output yet)',
      ];

      if (task.exitCode !== null) {
        lines.push('', `Exit Code: ${task.exitCode}`);
      }

      return {
        llmContent: lines.join('\n'),
      };
    },
    approval: {
      category: 'read',
      needsApproval: async () => false,
    },
  });
}

export function createKillBashTool(opts: {
  backgroundTaskManager: BackgroundTaskManager;
}) {
  const { backgroundTaskManager } = opts;

  return createTool({
    name: TOOL_NAMES.KILL_BASH,
    description: `Terminate a running background bash task.

Usage:
- Accepts a task_id parameter to identify the task to kill
- Sends SIGTERM first, then SIGKILL if needed (Unix-like systems)
- Returns success or failure status
- Use this when you need to stop a long-running background task`,
    parameters: z.object({
      task_id: z
        .string()
        .describe('The ID of the background task to terminate'),
    }),
    getDescription: ({ params }) => {
      if (!params.task_id || typeof params.task_id !== 'string') {
        return 'Terminate background task';
      }
      return `Terminate task: ${params.task_id}`;
    },
    execute: async ({ task_id }) => {
      const task = backgroundTaskManager.getTask(task_id);
      if (!task) {
        return {
          isError: true,
          llmContent: `Task ${task_id} not found. Use bash tool to see available tasks.`,
        };
      }

      if (task.status !== 'running') {
        return {
          isError: true,
          llmContent: `Task ${task_id} is not running (status: ${task.status}). Cannot terminate.`,
        };
      }

      const success = await backgroundTaskManager.killTask(task_id);
      return {
        llmContent: success
          ? `Successfully terminated task ${task_id} (${task.command})`
          : `Failed to terminate task ${task_id}. Process may have already exited.`,
        isError: !success,
      };
    },
    approval: {
      category: 'command',
      needsApproval: async (context) => {
        return context.approvalMode !== 'yolo';
      },
    },
  });
}

export function createBashTool(opts: {
  cwd: string;
  backgroundTaskManager: BackgroundTaskManager;
  messageBus?: MessageBus;
}) {
  const { cwd, backgroundTaskManager, messageBus } = opts;

  // Track pending background moves
  const pendingBackgroundMoves = new Map<
    string,
    { moveToBackground: () => void }
  >();

  // Add background move listener only if messageBus is available
  if (messageBus) {
    messageBus.onEvent(
      BASH_EVENTS.MOVE_TO_BACKGROUND,
      ({ taskId }: { taskId: string }) => {
        const pendingMove = pendingBackgroundMoves.get(taskId);
        if (pendingMove) {
          pendingMove.moveToBackground();
          pendingBackgroundMoves.delete(taskId);
          messageBus.emitEvent(BASH_EVENTS.BACKGROUND_MOVED, { taskId });
        }
      },
    );
  }

  return createTool({
    name: TOOL_NAMES.BASH,
    description:
      `Run shell commands in the terminal, ensuring proper handling and security measures.

Background Execution:
- Set run_in_background=true to force background execution
- Background tasks return a task_id for use with ${
        TOOL_NAMES.BASH_OUTPUT
      } and ${TOOL_NAMES.KILL_BASH} tools
- Initial output shown when moved to background

Before using this tool, please follow these steps:
- Verify that the command is not one of the banned commands: ${BANNED_COMMANDS.join(
        ', ',
      )}.
- Always quote file paths that contain spaces with double quotes (e.g., cd "path with spaces/file.txt")
- Capture the output of the command.

Notes:
- The command argument is required.
- You can specify an optional timeout in milliseconds (up to ${MAX_TIMEOUT}ms / 10 minutes). If not specified, commands will timeout after 2 minutes.
- VERY IMPORTANT: You MUST avoid using search commands like \`find\` and \`grep\`. Instead use grep and glob tool to search. You MUST avoid read tools like \`cat\`, \`head\`, \`tail\`, and \`ls\`, and use \`read\` and \`ls\` tool to read files.
- If you _still_ need to run \`grep\`, STOP. ALWAYS USE ripgrep at \`rg\` first, which all users have pre-installed.
- When issuing multiple commands, use the ';' or '&&' operator to separate them. DO NOT use newlines (newlines are ok in quoted strings).
- Try to maintain your current working directory throughout the session by using absolute paths and avoiding usage of \`cd\`. You may use \`cd\` if the User explicitly requests it.
- Don't add \`<command>\` wrapper to the command.

<good-example>
pytest /foo/bar/tests
</good-example>
<bad-example>
cd /foo/bar && pytest tests
</bad-example>
<bad-example>
<command>pytest /foo/bar/tests</command>
</bad-example>
`.trim(),
    parameters: z.object({
      command: z.string().describe('The command to execute'),
      timeout: z
        .number()
        .optional()
        .describe(`Optional timeout in milliseconds (max ${MAX_TIMEOUT})`),
      run_in_background: z
        .boolean()
        .optional()
        .describe(
          'Set to true to run this command in the background. Use bash_output to read output later.',
        ),
      description: z
        .string()
        .optional()
        .describe(`Clear, concise description of what this command does in 5-10 words, in active voice. Examples:
Input: ls
Output: List files in current directory

Input: git status
Output: Show working tree status

Input: npm install
Output: Install package dependencies

Input: mkdir foo
Output: Create directory 'foo'
          `),
    }),
    getDescription: ({ params }) => {
      if (!params.command || typeof params.command !== 'string') {
        return 'No command provided';
      }
      const command = params.command.trim();
      return command.length > 100 ? `${command.substring(0, 97)}...` : command;
    },
    execute: async ({
      command,
      timeout = DEFAULT_TIMEOUT,
      run_in_background,
    }) => {
      try {
        if (!command) {
          return {
            llmContent: 'Error: Command cannot be empty.',
            isError: true,
          };
        }
        return await executeCommand(
          command,
          timeout || DEFAULT_TIMEOUT,
          cwd,
          run_in_background,
          backgroundTaskManager,
          messageBus,
          pendingBackgroundMoves,
        );
      } catch (e) {
        return {
          isError: true,
          llmContent:
            e instanceof Error
              ? `Command execution failed: ${getErrorMessage(e)}`
              : 'Command execution failed.',
        };
      }
    },
    approval: {
      category: 'command',
      needsApproval: async (context) => {
        const { params, approvalMode } = context;
        const command = params.command as string;
        if (!command) {
          return false;
        }
        // Always require approval for high-risk commands
        if (isHighRiskCommand(command)) {
          return true;
        }
        // Check if command is banned (these should never be approved)
        const commandRoot = getCommandRoot(command);
        if (commandRoot && isBannedCommand(commandRoot)) {
          return true; // This will be denied by approval system
        }
        // For other commands, defer to approval mode settings
        return approvalMode !== 'yolo';
      },
    },
  });
}
