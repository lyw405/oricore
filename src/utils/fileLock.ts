import fs from 'fs';
import path from 'pathe';
import { randomUUID } from './randomUUID';

const LOCK_TIMEOUT = 30_000; // 30 seconds
const LOCK_POLL_INTERVAL = 100; // 100ms

/**
 * File-based lock for concurrent write safety
 * Uses lock files with unique identifiers to prevent race conditions
 */
export class FileLock {
  private lockFilePath: string;
  private lockId: string | null = null;
  private acquired = false;

  constructor(filePath: string) {
    // Lock file is the original file path with .lock extension
    this.lockFilePath = `${filePath}.lock`;
  }

  /**
   * Attempt to acquire the lock
   * @returns true if lock was acquired, false otherwise
   */
  async acquire(): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < LOCK_TIMEOUT) {
      try {
        // Try to create lock file exclusively
        const lockId = randomUUID();
        const lockContent = JSON.stringify({
          lockId,
          pid: process.pid,
          timestamp: Date.now(),
        });

        // Check if lock file exists and is valid
        if (fs.existsSync(this.lockFilePath)) {
          const existingLock = this.readLockFile();
          if (existingLock && !this.isLockExpired(existingLock)) {
            // Lock is held by another process and not expired
            await new Promise((resolve) =>
              setTimeout(resolve, LOCK_POLL_INTERVAL),
            );
            continue;
          }
          // Lock is expired or invalid, try to remove it
          try {
            fs.unlinkSync(this.lockFilePath);
          } catch {
            // Ignore errors, another process might have removed it
          }
        }

        // Try to create lock file atomically
        fs.writeFileSync(this.lockFilePath, lockContent, {
          flag: 'wx', // Exclusive create (fail if exists)
        });

        this.lockId = lockId;
        this.acquired = true;
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, wait and retry
          await new Promise((resolve) =>
            setTimeout(resolve, LOCK_POLL_INTERVAL),
          );
          continue;
        }
        // Other error, fail fast
        return false;
      }
    }

    // Timeout exceeded
    return false;
  }

  /**
   * Release the lock
   * Only releases if this instance holds the lock (matching lockId)
   */
  release(): void {
    if (!this.acquired || !this.lockId) {
      return;
    }

    try {
      const existingLock = this.readLockFile();
      if (existingLock && existingLock.lockId === this.lockId) {
        fs.unlinkSync(this.lockFilePath);
      }
    } catch {
      // Ignore errors during release
    } finally {
      this.acquired = false;
      this.lockId = null;
    }
  }

  /**
   * Execute a callback while holding the lock
   * Automatically acquires and releases the lock
   */
  async withLock<T>(callback: () => T | Promise<T>): Promise<T> {
    const acquired = await this.acquire();
    if (!acquired) {
      throw new Error(
        `Failed to acquire lock for ${this.lockFilePath} after ${LOCK_TIMEOUT}ms`,
      );
    }

    try {
      return await callback();
    } finally {
      this.release();
    }
  }

  /**
   * Read and parse the lock file
   */
  private readLockFile():
    | { lockId: string; pid: number; timestamp: number }
    | null {
    try {
      const content = fs.readFileSync(this.lockFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Check if a lock has expired (older than timeout)
   */
  private isLockExpired(lock: {
    lockId: string;
    pid: number;
    timestamp: number;
  }): boolean {
    return Date.now() - lock.timestamp > LOCK_TIMEOUT;
  }

  /**
   * Force release any existing lock (use with caution)
   * This can be used to recover from stale locks
   */
  forceRelease(): void {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath);
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Global lock registry to manage multiple locks
 * Helps prevent deadlocks and track active locks
 */
class LockRegistry {
  private locks = new Map<string, FileLock>();

  /**
   * Get or create a lock for a file path
   */
  getLock(filePath: string): FileLock {
    if (!this.locks.has(filePath)) {
      this.locks.set(filePath, new FileLock(filePath));
    }
    return this.locks.get(filePath)!;
  }

  /**
   * Release all locks (useful for cleanup)
   */
  releaseAll(): void {
    for (const lock of this.locks.values()) {
      lock.release();
    }
    this.locks.clear();
  }
}

export const lockRegistry = new LockRegistry();
