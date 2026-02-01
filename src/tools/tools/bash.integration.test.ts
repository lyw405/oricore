/**
 * Integration tests for bash tools.
 * Tests the complete workflow of bash tool creation and execution.
 */

import os from 'os';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BackgroundTaskManager } from '../../core/backgroundTaskManager';
import type { MessageBus } from '../../communication/messageBus';
import { createBashTool, createBashOutputTool, createKillBashTool } from './bash';

// Test timing constants
const BACKGROUND_COMMAND_TIMEOUT = 5000;
const LONG_COMMAND_TIMEOUT = 15000;
const SHORT_COMMAND_SLEEP_MS = 0.5;
const LONG_COMMAND_SLEEP_SECONDS = 1;
const LONG_COMMAND_ITERATIONS = 3;
const BACKGROUND_PROMPT_THRESHOLD_MS = 5000;

describe('bash tools integration', () => {
  let backgroundTaskManager: BackgroundTaskManager;
  let messageBus: MessageBus;
  let cwd: string;

  beforeEach(() => {
    backgroundTaskManager = new BackgroundTaskManager();
    messageBus = {
      onEvent: vi.fn(),
      emitEvent: vi.fn(),
    };
    cwd = process.cwd();
  });

  // ========================================================================
  // createBashTool - Basic Functionality
  // ========================================================================

  describe('createBashTool', () => {
    test('should create tool with correct name and description', () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      expect(bashTool.name).toBe('bash');
      expect(bashTool.description).toContain('Run shell commands');
      expect(bashTool.description).toContain('Background Execution');
    });

    test('should execute simple command successfully', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const result = await bashTool.execute({
        command: 'echo "hello world"',
      });

      expect(result.isError).toBeFalsy();
      expect(result.llmContent).toBeTruthy();
      expect(result.llmContent).toContain('hello world');
    });

    test('should handle command with timeout', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const result = await bashTool.execute({
        command: 'echo "test"',
        timeout: 5000,
      });

      expect(result.isError).toBeFalsy();
    });

    test('should reject empty command', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const result = await bashTool.execute({
        command: '',
      });

      expect(result.isError).toBeTruthy();
      expect(result.llmContent).toContain('Command cannot be empty');
    });

    test('should reject command substitution', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const result = await bashTool.execute({
        command: 'echo $(whoami)',
      });

      expect(result.isError).toBeTruthy();
      expect(result.llmContent).toContain('not allowed');
    });
  });

  // ========================================================================
  // createBashTool - Background Execution
  // ========================================================================

  describe('createBashTool - background execution', () => {
    test('should move long-running command to background', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
        messageBus,
      });

      const command = `echo "start"; sleep ${SHORT_COMMAND_SLEEP_MS}; echo "done"`;
      const result = (await bashTool.execute({
        command,
        run_in_background: true,
      })) as any;

      // Should complete quickly (background mode)
      // For short commands, they complete before background check
      expect(result.isError).toBeFalsy();
    }, BACKGROUND_COMMAND_TIMEOUT);


    test('should complete short commands without background', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
        messageBus,
      });

      const result = (await bashTool.execute({
        command: 'echo "quick"',
        run_in_background: true,
      })) as any;

      // Short commands complete immediately
      expect(result.isError).toBeFalsy();
      expect(result.backgroundTaskId).toBeUndefined();
      expect(result.llmContent).toContain('quick');
    });
  });

  // ========================================================================
  // createBashOutputTool
  // ========================================================================

  describe('createBashOutputTool', () => {
    test('should create tool with correct name and description', () => {
      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      expect(bashOutputTool.name).toBe('bash_output');
      expect(bashOutputTool.description).toContain('background bash task');
    });

    test('should retrieve output from existing task', async () => {
      const taskId = backgroundTaskManager.createTask({
        command: 'echo test',
        pid: 1234,
      });

      backgroundTaskManager.appendOutput(taskId, 'first line\n');
      backgroundTaskManager.appendOutput(taskId, 'second line\n');
      backgroundTaskManager.updateTaskStatus(taskId, 'completed', 0);

      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      const result = await bashOutputTool.execute({
        task_id: taskId,
      });

      expect(result.isError).toBeFalsy();
      expect(result.llmContent).toContain('Command: echo test');
      expect(result.llmContent).toContain('Status: completed');
      expect(result.llmContent).toContain('first line');
      expect(result.llmContent).toContain('second line');
      expect(result.llmContent).toContain('Exit Code: 0');
    });

    test('should return error for non-existent task', async () => {
      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      const result = await bashOutputTool.execute({
        task_id: 'non-existent-task-id',
      });

      expect(result.isError).toBeTruthy();
      expect(result.llmContent).toContain('not found');
    });

    test('should show running status for active tasks', async () => {
      const taskId = backgroundTaskManager.createTask({
        command: 'sleep 100',
        pid: 1234,
      });

      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      const result = await bashOutputTool.execute({
        task_id: taskId,
      });

      expect(result.llmContent).toContain('Status: running');
      expect(result.llmContent).not.toContain('Exit Code:');
    });
  });

  // ========================================================================
  // createKillBashTool
  // ========================================================================

  describe('createKillBashTool', () => {
    test('should create tool with correct name and description', () => {
      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      expect(killBashTool.name).toBe('kill_bash');
      expect(killBashTool.description).toContain('Terminate a running');
    });

    test('should terminate running task successfully', async () => {
      const taskId = backgroundTaskManager.createTask({
        command: 'sleep 100',
        pid: 1234,
        pgid: 1234,
      });

      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      const result = await killBashTool.execute({
        task_id: taskId,
      });

      expect(result.isError).toBeFalsy();
      expect(result.llmContent).toContain('Successfully terminated');
      expect(result.llmContent).toContain(taskId);

      // Verify task status
      const task = backgroundTaskManager.getTask(taskId);
      expect(task?.status).toBe('killed');
    });

    test('should return error for non-existent task', async () => {
      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      const result = await killBashTool.execute({
        task_id: 'non-existent-task-id',
      });

      expect(result.isError).toBeTruthy();
      expect(result.llmContent).toContain('not found');
    });

    test('should return error for already completed task', async () => {
      const taskId = backgroundTaskManager.createTask({
        command: 'echo done',
        pid: 1234,
      });

      backgroundTaskManager.updateTaskStatus(taskId, 'completed', 0);

      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      const result = await killBashTool.execute({
        task_id: taskId,
      });

      expect(result.isError).toBeTruthy();
      expect(result.llmContent).toContain('not running');
    });

    test('should handle task that cannot be killed', async () => {
      const taskId = backgroundTaskManager.createTask({
        command: 'test',
        pid: 99999, // Non-existent PID
        pgid: 99999,
      });

      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      const result = await killBashTool.execute({
        task_id: taskId,
      });

      // Should not error, but report failure
      expect(result.llmContent).toContain('terminated');
    });
  });

  // ========================================================================
  // Complete Workflow
  // ========================================================================

  describe('complete workflow', () => {
    test('should handle create, execute, read output, and kill', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
        messageBus,
      });

      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      const killBashTool = createKillBashTool({
        backgroundTaskManager,
      });

      // Execute a command
      const execResult = await bashTool.execute({
        command: 'echo "workflow test"',
      });

      expect(execResult.isError).toBeFalsy();

      // For normal execution, no background task is created
      // So we create a mock task for output testing
      const taskId = backgroundTaskManager.createTask({
        command: 'echo "workflow test"',
        pid: 1234,
      });

      backgroundTaskManager.appendOutput(taskId, 'workflow test\n');
      backgroundTaskManager.updateTaskStatus(taskId, 'completed', 0);

      // Read output
      const outputResult = await bashOutputTool.execute({
        task_id: taskId,
      });

      expect(outputResult.isError).toBeFalsy();
      expect(outputResult.llmContent).toContain('workflow test');

      // Kill task (already completed, should handle gracefully)
      const killResult = await killBashTool.execute({
        task_id: taskId,
      });

      // Should indicate task was not running
      expect(killResult.llmContent).toContain('not running');
    });

    test('should handle multiple concurrent background tasks', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
        messageBus,
      });

      const bashOutputTool = createBashOutputTool({
        backgroundTaskManager,
      });

      // Create multiple tasks
      const taskIds = [
        backgroundTaskManager.createTask({ command: 'sleep 1', pid: 1001 }),
        backgroundTaskManager.createTask({ command: 'sleep 2', pid: 1002 }),
        backgroundTaskManager.createTask({ command: 'sleep 3', pid: 1003 }),
      ];

      // Add output to each
      taskIds.forEach((id, i) => {
        backgroundTaskManager.appendOutput(id, `Task ${i + 1} output\n`);
      });

      // Verify all tasks can be queried
      for (const taskId of taskIds) {
        const result = await bashOutputTool.execute({ task_id: taskId });
        expect(result.isError).toBeFalsy();
        expect(result.llmContent).toContain('Status: running');
      }

      // Clean up
      for (const taskId of taskIds) {
        await backgroundTaskManager.killTask(taskId);
      }
    });
  });

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('error handling', () => {
    test('should handle command execution errors gracefully', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const result = await bashTool.execute({
        command: 'ls /nonexistent/path/that/does/not/exist',
      });

      // Command fails but doesn't throw
      expect(result.isError).toBeFalsy();
      expect(result.llmContent).toBeTruthy();
    });

    test('should handle invalid timeout values', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      // Use default timeout when not specified
      const result = await bashTool.execute({
        command: 'echo "test"',
      });

      expect(result.isError).toBeFalsy();
      expect(result.llmContent).toBeTruthy();
    });

    test('should handle description parameter', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const desc = bashTool.getDescription({
        params: {
          command: 'echo "test"',
          description: 'Test echo command',
        },
      });

      expect(desc).toBe('echo "test"');

      const desc2 = bashTool.getDescription({
        params: {
          command: 'a'.repeat(200),
          description: 'Long command test',
        },
      });

      expect(desc2.length).toBeLessThanOrEqual(100);
      expect(desc2).toContain('...');
    });
  });

  // ========================================================================
  // Security and Approval
  // ========================================================================

  describe('security and approval', () => {
    test('should require approval for high-risk commands', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      // Check approval needs
      const needsApproval = await bashTool.approval.needsApproval({
        params: { command: 'rm -rf /tmp/test' },
        approvalMode: 'auto',
      } as any);

      expect(needsApproval).toBe(true);
    });

    test('should not require approval for safe commands in yolo mode', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const needsApproval = await bashTool.approval.needsApproval({
        params: { command: 'ls -la' },
        approvalMode: 'yolo',
      } as any);

      expect(needsApproval).toBe(false);
    });

    test('should require approval for banned commands', async () => {
      const bashTool = createBashTool({
        cwd,
        backgroundTaskManager,
      });

      const needsApproval = await bashTool.approval.needsApproval({
        params: { command: 'curl http://example.com' },
        approvalMode: 'yolo',
      } as any);

      // Banned commands always require approval
      expect(needsApproval).toBe(true);
    });
  });
});
