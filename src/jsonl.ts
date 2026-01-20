import fs from 'fs';
import path from 'pathe';
import type { NormalizedMessage } from './core/message';
import { createUserMessage } from './core/message';

/**
 * JsonlLogger - Handles persistent logging of messages to JSONL files
 *
 * Each message is appended as a JSON line, enabling:
 * - Session persistence across restarts
 * - Message history recovery
 * - Debugging and auditing
 */
export class JsonlLogger {
  filePath: string;
  lastUuid: string | null = null;

  constructor(opts: { filePath: string }) {
    this.filePath = opts.filePath;
    this.lastUuid = this.getLatestUuid();
  }

  /**
   * Get the UUID of the last message in the log file
   * Used for chaining new messages to the conversation
   */
  getLatestUuid(): string | null {
    if (!fs.existsSync(this.filePath)) {
      return null;
    }
    try {
      const file = fs.readFileSync(this.filePath, 'utf8');
      const lines = file.split('\n').filter(Boolean);
      if (lines.length === 0) {
        return null;
      }
      const lastLine = lines[lines.length - 1];
      const message = JSON.parse(lastLine);
      return message.uuid || null;
    } catch {
      return null;
    }
  }

  /**
   * Add a message to the log file
   * Also updates the lastUuid for chaining
   */
  addMessage(opts: { message: NormalizedMessage & { sessionId: string } }): NormalizedMessage & { sessionId: string } {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const message = opts.message;
    fs.appendFileSync(this.filePath, JSON.stringify(message) + '\n');
    this.lastUuid = message.uuid;
    return message;
  }

  /**
   * Add a user message to the log file
   * Convenience method that creates a user message with proper chaining
   */
  addUserMessage(content: string, sessionId: string): NormalizedMessage & { sessionId: string } {
    const message = {
      ...createUserMessage(content, this.lastUuid),
      sessionId,
    };
    return this.addMessage({
      message,
    });
  }
}
