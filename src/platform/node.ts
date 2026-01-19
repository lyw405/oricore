/**
 * Node.js platform implementation
 * Provides Node.js-specific implementations for the PlatformAdapter interface
 */

import fs from 'node:fs';
import path from 'pathe';
import { execSync } from 'node:child_process';
import os from 'node:os';
import type { PlatformAdapter, ExecOptions, ExecResult, Stats } from './types';

export class NodePlatform implements PlatformAdapter {
  // File system - async
  readFile = (path: string): Promise<string> =>
    fs.promises.readFile(path, 'utf-8');

  writeFile = (path: string, content: string): Promise<void> =>
    fs.promises.writeFile(path, content, 'utf-8');

  // File system - sync
  readFileSync = (path: string): string =>
    fs.readFileSync(path, 'utf-8');

  writeFileSync = (path: string, content: string): void =>
    fs.writeFileSync(path, content, 'utf-8');

  existsSync = (path: string): boolean =>
    fs.existsSync(path);

  mkdirSync = (path: string, options?: { recursive: boolean }): void => {
    fs.mkdirSync(path, options);
  };

  readdirSync = (path: string): string[] =>
    fs.readdirSync(path);

  statSync = (path: string): Stats => {
    const stats = fs.statSync(path);
    return {
      size: stats.size,
      mtime: stats.mtimeMs,
      birthtime: stats.birthtimeMs,
    };
  };

  // Process
  cwd = (): string => process.cwd();

  env = process.env;

  platform = process.platform;

  // Exec
  exec = async (command: string, options?: ExecOptions): Promise<ExecResult> => {
    try {
      const stdout = execSync(command, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        timeout: options?.timeout,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      return {
        stdout: stdout.toString(),
        stderr: '',
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message || '',
        exitCode: error.status || 1,
      };
    }
  };

  // Paths
  join = (...paths: string[]): string => path.join(...paths);

  dirname = (filePath: string): string => path.dirname(filePath);

  basename = (filePath: string): string => path.basename(filePath);

  resolve = (...paths: string[]): string => path.resolve(...paths);

  // Configuration directories
  getConfigDir = (): string => {
    const base = process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
        : path.join(os.homedir(), '.config');
    return base;
  };

  getDataDir = (): string => {
    const base = process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
        : path.join(os.homedir(), '.local', 'share');
    return base;
  };
}

// Export a singleton instance for convenience
export const nodePlatform = new NodePlatform();
