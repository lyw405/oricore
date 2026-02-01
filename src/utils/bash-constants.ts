/**
 * Bash tool constants.
 * Centralized configuration for timeout, output limits, and background check intervals.
 */

/** Default timeout for command execution (2 minutes). */
export const DEFAULT_TIMEOUT = 2 * 60 * 1000;

/** Maximum timeout allowed for command execution (10 minutes). */
export const MAX_TIMEOUT = 10 * 60 * 1000;

/** Background task check interval in milliseconds. */
export const BACKGROUND_CHECK_INTERVAL = 500;

/** Default output limit in characters. */
export const DEFAULT_OUTPUT_LIMIT = 30_000;

/** Maximum output limit in characters. */
export const MAX_OUTPUT_LIMIT = 150_000;

/** Environment variable name for custom output limit. */
export const ENV_OUTPUT_LIMIT = 'BASH_MAX_OUTPUT_LENGTH';

/**
 * List of banned commands that should never be executed.
 */
export const BANNED_COMMANDS: readonly string[] = [
  'alias',
  'aria2c',
  'axel',
  'bash',
  'chrome',
  'curl',
  'curlie',
  'eval',
  'firefox',
  'fish',
  'http-prompt',
  'httpie',
  'links',
  'lynx',
  'nc',
  'rm',
  'safari',
  'sh',
  'source',
  'telnet',
  'w3m',
  'wget',
  'xh',
  'zsh',
];
