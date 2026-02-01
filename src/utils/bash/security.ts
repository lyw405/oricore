/**
 * Bash command security validation utilities.
 * Provides functions to validate shell commands and detect security risks.
 */

import { BANNED_COMMANDS } from './constants';

/**
 * Extract the root command from a command string.
 * @example
 * getCommandRoot("git status") // "git"
 * getCommandRoot("/usr/bin/node test.js") // "node"
 */
export function getCommandRoot(command: string): string | undefined {
  const root = command
    .trim()
    .replace(/[{}()]/g, '')
    .split(/[\s;&|]+/)[0]
    ?.split(/[/\\]/)
    .pop();
  return root || undefined;
}

/**
 * Check if command contains command substitution ($() or backticks)
 * outside of safe contexts.
 *
 * Safe contexts:
 * - Inside single quotes (everything is literal)
 * - Escaped backticks inside double quotes
 *
 * @param command - The command string to check
 * @returns true if command substitution is detected
 */
export function hasCommandSubstitution(command: string): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (inSingleQuote) {
      continue;
    }

    if (char === '`') {
      return true;
    }

    if (char === '$' && command[i + 1] === '(') {
      return true;
    }
  }

  return false;
}

/**
 * Split command by pipe segments, handling quoted strings correctly.
 * @example
 * splitPipelineSegments('echo "test|value" | grep test')
 * // ["echo "test|value"", "grep test"]
 */
function splitPipelineSegments(command: string): string[] {
  const segments: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === '|' && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) {
        segments.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

/** High risk patterns for command segments. */
const HIGH_RISK_PATTERNS = [
  /rm\s+.*(-rf|--recursive)/i,
  /sudo/i,
  /dd\s+if=/i,
  /mkfs/i,
  /fdisk/i,
  /format/i,
  /del\s+.*\/[qs]/i,
];

/**
 * Check if a single command segment is high risk.
 */
function isSegmentHighRisk(segment: string): boolean {
  if (hasCommandSubstitution(segment)) {
    return true;
  }

  const commandRoot = getCommandRoot(segment);
  if (!commandRoot) {
    return true;
  }

  return (
    HIGH_RISK_PATTERNS.some((pattern) => pattern.test(segment)) ||
    BANNED_COMMANDS.includes(commandRoot.toLowerCase())
  );
}

/**
 * Check if command is high risk with pipeline segment fallback evaluation.
 *
 * Implements the same approach as codex PR #7544:
 * - First check the full command
 * - If command contains pipes, evaluate each segment separately
 * - If any segment is high risk, the entire command is high risk
 *
 * @param command - The command to check
 * @returns true if the command is high risk
 */
export function isHighRiskCommand(command: string): boolean {
  // Legacy patterns for specific dangerous combinations
  const legacyDangerousCombinations = [/curl.*\|.*sh/i, /wget.*\|.*sh/i];

  // Quick check for legacy dangerous combinations
  if (legacyDangerousCombinations.some((pattern) => pattern.test(command))) {
    return true;
  }

  // Check if command contains pipeline
  if (command.includes('|')) {
    // Split by pipeline and evaluate each segment
    const segments = splitPipelineSegments(command);

    // Fallback evaluation: check each segment independently
    for (const segment of segments) {
      if (isSegmentHighRisk(segment)) {
        return true;
      }
    }

    return false;
  }

  // For non-pipeline commands, use segment risk check
  return isSegmentHighRisk(command);
}

/**
 * Validate a command and return an error message if invalid.
 *
 * @param command - The command to validate
 * @returns null if valid, error message otherwise
 */
export function validateCommand(command: string): string | null {
  if (!command.trim()) {
    return 'Command cannot be empty.';
  }

  const commandRoot = getCommandRoot(command);
  if (!commandRoot) {
    return 'Could not identify command root.';
  }

  if (hasCommandSubstitution(command)) {
    return 'Command substitution is not allowed for security reasons.';
  }

  return null;
}

/**
 * Check if a command root is in the banned commands list.
 */
export function isBannedCommand(commandRoot: string): boolean {
  return BANNED_COMMANDS.includes(commandRoot.toLowerCase());
}
