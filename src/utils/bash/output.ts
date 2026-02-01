/**
 * Bash output processing utilities.
 * Provides functions to format, truncate, and process command output.
 */

import { getErrorMessage } from '../error';
import {
  DEFAULT_OUTPUT_LIMIT,
  ENV_OUTPUT_LIMIT,
  MAX_OUTPUT_LIMIT,
} from './constants';

/**
 * Remove leading and trailing empty lines from content.
 * Preserves middle empty lines and indentation.
 *
 * @param content - The content to trim
 * @returns Content with leading/trailing empty lines removed
 */
export function trimEmptyLines(content: string): string {
  const lines = content.split('\n');

  let start = 0;
  while (start < lines.length && lines[start].trim() === '') {
    start++;
  }

  let end = lines.length - 1;
  while (end > start && lines[end].trim() === '') {
    end--;
  }

  return lines.slice(start, end + 1).join('\n');
}

/**
 * Get the maximum output limit from environment or default.
 *
 * @returns The maximum output limit in characters
 */
export function getMaxOutputLimit(): number {
  const envValue = process.env[ENV_OUTPUT_LIMIT];
  if (!envValue) return DEFAULT_OUTPUT_LIMIT;

  const limit = parseInt(envValue, 10);
  if (isNaN(limit) || limit <= 0) return DEFAULT_OUTPUT_LIMIT;

  return Math.min(limit, MAX_OUTPUT_LIMIT);
}

/**
 * Truncate output to specified limit, showing line count if truncated.
 *
 * @param content - The content to truncate
 * @param limit - Optional limit (defaults to getMaxOutputLimit())
 * @returns Truncated content with notice if truncated
 */
export function truncateOutput(content: string, limit?: number): string {
  const trimmed = trimEmptyLines(content);
  const maxLimit = limit ?? getMaxOutputLimit();

  if (trimmed.length <= maxLimit) {
    return trimmed;
  }

  const kept = trimmed.slice(0, maxLimit);
  const droppedContent = trimmed.slice(maxLimit);
  const droppedLines = droppedContent.split('\n').length;

  return `${kept}\n\n... [${droppedLines} lines truncated] ...`;
}

/**
 * Format shell execution result for display.
 *
 * @param result - The shell execution result
 * @param command - The original command
 * @param wrappedCommand - The wrapped command for shell execution
 * @param cwd - The current working directory
 * @param backgroundPIDs - List of background process IDs
 * @returns Formatted result with llmContent and returnDisplay
 */
export function formatExecutionResult(
  result: {
    output: string;
    stdout?: string;
    stderr?: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    error?: Error | null;
    pid?: number;
    cancelled?: boolean;
  },
  command: string,
  wrappedCommand: string,
  cwd: string,
  backgroundPIDs: number[],
): { llmContent: string; returnDisplay: string } {
  let llmContent = '';
  if (result.cancelled) {
    llmContent = 'Command execution timed out and was cancelled.';
    if (result.output.trim()) {
      llmContent += ` Below is the output (on stdout and stderr) before it was cancelled:\n${result.output}`;
    } else {
      llmContent += ' There was no output before it was cancelled.';
    }
  } else {
    const finalError = result.error
      ? result.error.message.replace(wrappedCommand, command)
      : '(none)';
    llmContent = [
      `Command: ${command}`,
      `Directory: ${cwd || '(root)'}`,
      `Stdout: ${result.stdout || '(empty)'}`,
      `Stderr: ${result.stderr || '(empty)'}`,
      `Error: ${finalError}`,
      `Exit Code: ${result.exitCode ?? '(none)'}`,
      `Signal: ${result.signal ?? '(none)'}`,
      `Background PIDs: ${
        backgroundPIDs.length ? backgroundPIDs.join(', ') : '(none)'
      }`,
      `Process Group PGID: ${result.pid ?? '(none)'}`,
    ].join('\n');
  }

  let message = '';
  if (result.output) {
    const safeOutput = typeof result.output === 'string' ? result.output : String(result.output);
    if (safeOutput.trim()) {
      message = truncateOutput(safeOutput);
    }
  } else if (result.cancelled) {
    message = 'Command execution timed out and was cancelled.';
  } else if (result.signal) {
    message = `Command execution was terminated by signal ${result.signal}.`;
  } else if (result.error) {
    message = `Command failed: ${getErrorMessage(result.error)}`;
  } else if (result.exitCode !== null && result.exitCode !== 0) {
    message = `Command exited with code: ${result.exitCode}`;
  } else {
    message = 'Command executed successfully.';
  }

  return { llmContent, returnDisplay: message };
}
