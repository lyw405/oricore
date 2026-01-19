/**
 * Platform abstraction interface
 * Allows the engine to work across different environments (Node.js, browser, etc.)
 */

export interface PlatformAdapter {
  // File system - async
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;

  // File system - sync
  readFileSync(path: string): string;
  writeFileSync(path: string, content: string): void;
  existsSync(path: string): boolean;
  mkdirSync(path: string, options?: { recursive: boolean }): void;
  readdirSync(path: string): string[];
  statSync(path: string): Stats;

  // Process
  cwd(): string;
  env: Record<string, string | undefined>;
  platform: NodeJS.Platform;

  // Exec
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;

  // Paths
  join(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;
  resolve(...paths: string[]): string;

  // Configuration directories
  getConfigDir(): string;
  getDataDir(): string;
}

export interface Stats {
  size: number;
  mtime: number;
  birthtime: number;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
