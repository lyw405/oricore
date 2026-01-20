import dotenv from 'dotenv';
import fs from 'fs';
import path from 'pathe';

/**
 * Load .env file from the specified directory
 * Searches for .env files in the following order:
 * 1. .env.local
 * 2. .env
 *
 * @param cwd - Current working directory
 */
export function loadEnvFile(cwd: string): void {
  const envLocalPath = path.join(cwd, '.env.local');
  const envPath = path.join(cwd, '.env');

  // Load .env.local first (highest priority for local overrides)
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }

  // Load .env (will be overridden by .env.local if both exist)
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
