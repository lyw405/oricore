/**
 * Unit tests for bash-output.ts
 * Tests for output processing, formatting, and truncation.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  trimEmptyLines,
  getMaxOutputLimit,
  truncateOutput,
  formatExecutionResult,
} from './bash-output';

describe('bash-output', () => {
  // ========================================================================
  // trimEmptyLines
  // ========================================================================

  describe('trimEmptyLines', () => {
    test('should remove leading empty lines', () => {
      expect(trimEmptyLines('\n\n\nhello')).toBe('hello');
      expect(trimEmptyLines('\nhello')).toBe('hello');
      expect(trimEmptyLines('\n\n\ntest')).toBe('test');
    });

    test('should remove trailing empty lines', () => {
      expect(trimEmptyLines('hello\n\n\n')).toBe('hello');
      expect(trimEmptyLines('hello\n')).toBe('hello');
      expect(trimEmptyLines('test\n\n')).toBe('test');
    });

    test('should remove both leading and trailing empty lines', () => {
      expect(trimEmptyLines('\n\n  hello\nworld  \n\n')).toBe('  hello\nworld  ');
      expect(trimEmptyLines('\nline1\nline2\n')).toBe('line1\nline2');
    });

    test('should preserve middle empty lines', () => {
      expect(trimEmptyLines('line1\n\nline3')).toBe('line1\n\nline3');
      expect(trimEmptyLines('a\n\n\nb')).toBe('a\n\n\nb');
    });

    test('should preserve indentation', () => {
      expect(trimEmptyLines('\n  indented\n')).toBe('  indented');
      expect(trimEmptyLines('\n\ttabs\n')).toBe('\ttabs');
      expect(trimEmptyLines('  mixed \n  spaces\tand\ttabs\n')).toBe('  mixed \n  spaces\tand\ttabs');
    });

    test('should handle empty string', () => {
      expect(trimEmptyLines('')).toBe('');
    });

    test('should handle whitespace-only lines as empty', () => {
      expect(trimEmptyLines('   \n\thello\n   ')).toBe('\thello');
      expect(trimEmptyLines(' \n \n \n')).toBe('');
    });

    test('should handle single line', () => {
      expect(trimEmptyLines('single line')).toBe('single line');
      expect(trimEmptyLines('\nsingle line')).toBe('single line');
      expect(trimEmptyLines('single line\n')).toBe('single line');
    });

    test('should handle only empty lines', () => {
      expect(trimEmptyLines('\n\n\n')).toBe('');
      expect(trimEmptyLines('\n')).toBe('');
    });
  });

  // ========================================================================
  // getMaxOutputLimit
  // ========================================================================

  describe('getMaxOutputLimit', () => {
    const originalEnv = process.env.BASH_MAX_OUTPUT_LENGTH;

    beforeEach(() => {
      // Reset to default before each test
      delete process.env.BASH_MAX_OUTPUT_LENGTH;
    });

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.BASH_MAX_OUTPUT_LENGTH;
      } else {
        process.env.BASH_MAX_OUTPUT_LENGTH = originalEnv;
      }
    });

    test('should return default 30000 when env not set', () => {
      delete process.env.BASH_MAX_OUTPUT_LENGTH;
      expect(getMaxOutputLimit()).toBe(30_000);
    });

    test('should read valid env value', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = '50000';
      expect(getMaxOutputLimit()).toBe(50_000);

      process.env.BASH_MAX_OUTPUT_LENGTH = '100000';
      expect(getMaxOutputLimit()).toBe(100_000);
    });

    test('should fallback to default for invalid value', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = 'invalid';
      expect(getMaxOutputLimit()).toBe(30_000);

      process.env.BASH_MAX_OUTPUT_LENGTH = 'abc123';
      expect(getMaxOutputLimit()).toBe(30_000);
    });

    test('should fallback to default for zero', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = '0';
      expect(getMaxOutputLimit()).toBe(30_000);
    });

    test('should fallback to default for negative value', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = '-100';
      expect(getMaxOutputLimit()).toBe(30_000);

      process.env.BASH_MAX_OUTPUT_LENGTH = '-1';
      expect(getMaxOutputLimit()).toBe(30_000);
    });

    test('should cap at 150000 for values exceeding max', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = '200000';
      expect(getMaxOutputLimit()).toBe(150_000);

      process.env.BASH_MAX_OUTPUT_LENGTH = '999999';
      expect(getMaxOutputLimit()).toBe(150_000);
    });

    test('should handle edge of max limit', () => {
      process.env.BASH_MAX_OUTPUT_LENGTH = '150000';
      expect(getMaxOutputLimit()).toBe(150_000);

      process.env.BASH_MAX_OUTPUT_LENGTH = '150001';
      expect(getMaxOutputLimit()).toBe(150_000);
    });
  });

  // ========================================================================
  // truncateOutput
  // ========================================================================

  describe('truncateOutput', () => {
    test('should return content unchanged when under limit', () => {
      const content = 'short content';
      expect(truncateOutput(content, 1000)).toBe('short content');
      expect(truncateOutput('test', 10)).toBe('test');
    });

    test('should trim empty lines before checking limit', () => {
      const content = '\n\n  hello  \n\n';
      expect(truncateOutput(content, 1000)).toBe('  hello  ');
    });

    test('should truncate and show line count when over limit', () => {
      const content = 'a'.repeat(100);
      const result = truncateOutput(content, 50);
      expect(result).toContain('a'.repeat(50));
      expect(result).toContain('... [1 lines truncated] ...');
      expect(result.length).toBeGreaterThan(50);
    });

    test('should correctly count dropped lines', () => {
      const content = 'line1\nline2\nline3\nline4\nline5';
      const result = truncateOutput(content, 12);
      expect(result).toContain('lines truncated');
      // 12 chars = "line1\nline2\n" (12 chars), remaining 3 lines truncated
    });

    test('should handle multiline truncation', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = truncateOutput(lines, 50);
      expect(result).toContain('lines truncated');
      expect(result.length).toBeLessThan(lines.length);
    });

    test('should use default limit when not specified', () => {
      const content = 'x'.repeat(100);
      const result = truncateOutput(content);
      expect(result).toBe(content);
    });

    test('should handle content exactly at limit', () => {
      const content = 'a'.repeat(50);
      const result = truncateOutput(content, 50);
      expect(result).toBe(content);
      expect(result).not.toContain('truncated');
    });

    test('should handle content one char over limit', () => {
      const content = 'a'.repeat(51);
      const result = truncateOutput(content, 50);
      expect(result.length).toBeGreaterThan(50);
      expect(result).toContain('truncated');
    });

    test('should handle very long single line', () => {
      const content = 'a'.repeat(10000);
      const result = truncateOutput(content, 100);
      expect(result.startsWith('a'.repeat(100))).toBe(true);
      expect(result).toContain('truncated');
    });

    test('should handle empty content', () => {
      expect(truncateOutput('', 100)).toBe('');
      expect(truncateOutput('  ', 100)).toBe('');
    });
  });

  // ========================================================================
  // formatExecutionResult
  // ========================================================================

  describe('formatExecutionResult', () => {
    test('should format successful command execution', () => {
      const result = {
        output: 'test output',
        stdout: 'test output',
        stderr: '',
        exitCode: 0,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'echo test',
        'echo test',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('Command: echo test');
      expect(formatted.llmContent).toContain('Exit Code: 0');
      expect(formatted.llmContent).toContain('Stdout: test output');
      expect(formatted.returnDisplay).toBe('test output');
    });

    test('should format failed command execution', () => {
      const result = {
        output: '',
        stdout: '',
        stderr: 'error: file not found',
        exitCode: 1,
        signal: null,
        error: new Error('Command failed'),
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'cat nonexistent.txt',
        'cat nonexistent.txt',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('Exit Code: 1');
      expect(formatted.llmContent).toContain('Stderr: error: file not found');
      expect(formatted.returnDisplay).toContain('Command failed');
    });

    test('should format cancelled command', () => {
      const result = {
        output: 'partial output',
        stdout: 'partial output',
        stderr: '',
        exitCode: null,
        signal: 'SIGTERM' as NodeJS.Signals,
        error: null,
        pid: 12345,
        cancelled: true,
      };

      const formatted = formatExecutionResult(
        result,
        'sleep 100',
        'sleep 100',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('timed out and was cancelled');
      expect(formatted.llmContent).toContain('partial output');
      // returnDisplay shows the output when present, not cancellation message
      expect(formatted.returnDisplay).toBe('partial output');
    });

    test('should format command terminated by signal', () => {
      const result = {
        output: '',
        stdout: '',
        stderr: '',
        exitCode: null,
        signal: 'SIGKILL' as NodeJS.Signals,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'kill -9 $$',
        'kill -9 $$',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('Signal: SIGKILL');
      expect(formatted.returnDisplay).toContain('terminated by signal SIGKILL');
    });

    test('should format command with error', () => {
      const error = new Error('Permission denied');
      const result = {
        output: '',
        stdout: '',
        stderr: 'Permission denied',
        exitCode: 126,
        signal: null,
        error,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        './script.sh',
        '{ ./script.sh; }',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('Error: Permission denied');
      // Wrapped command should be replaced with original command in error
      expect(formatted.llmContent).not.toContain('{ ./script.sh; }');
      expect(formatted.returnDisplay).toContain('Permission denied');
    });

    test('should include background PIDs when present', () => {
      const result = {
        output: '',
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'npm run dev &',
        'npm run dev &',
        '/tmp',
        [12346, 12347],
      );

      expect(formatted.llmContent).toContain('Background PIDs: 12346, 12347');
      expect(formatted.llmContent).toContain('Process Group PGID: 12345');
    });

    test('should handle no output for successful command', () => {
      const result = {
        output: '',
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'true',
        'true',
        '/tmp',
        [],
      );

      expect(formatted.returnDisplay).toBe('Command executed successfully.');
    });

    test('should handle cancelled command with no output', () => {
      const result = {
        output: '',
        stdout: '',
        stderr: '',
        exitCode: null,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: true,
      };

      const formatted = formatExecutionResult(
        result,
        'sleep 100',
        'sleep 100',
        '/tmp',
        [],
      );

      expect(formatted.llmContent).toContain('no output before it was cancelled');
      expect(formatted.returnDisplay).toContain('Command execution timed out and was cancelled');
    });

    test('should handle non-string output', () => {
      const result = {
        output: {} as any,
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'echo test',
        'echo test',
        '/tmp',
        [],
      );

      expect(formatted.returnDisplay).toBeTruthy();
    });

    test('should show root for directory', () => {
      const result = {
        output: 'test',
        stdout: 'test',
        stderr: '',
        exitCode: 0,
        signal: null,
        error: null,
        pid: 12345,
        cancelled: false,
      };

      const formatted = formatExecutionResult(
        result,
        'pwd',
        'pwd',
        '',
        [],
      );

      expect(formatted.llmContent).toContain("Directory: (root)");
    });
  });
});
