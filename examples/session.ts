/**
 * Session Example - OriCore
 *
 * This demonstrates how to use sessions for persistent conversations.
 * Sessions allow you to continue conversations across multiple calls.
 */

import { createEngine } from 'oricore';

async function sessionExample() {
  console.log('=== Session Management Example ===\n');

  // 1. Create engine
  const engine = createEngine({
    productName: 'SessionExample',
    version: '1.0.0',
  });

  console.log('✓ Engine created');

  // 2. Initialize with configuration
  await engine.initialize({
    model: 'openai/gpt-4o',
  });

  console.log('✓ Engine initialized\n');

  // 3. Create a new session
  const sessionId = 'my-conversation-' + Date.now();
  console.log(`--- Starting new session: ${sessionId} ---\n`);

  // First message in session
  const result1 = await engine.sendMessage({
    sessionId,
    message: 'Remember that my favorite color is blue',
    write: false,
    maxTurns: 1,
  });

  if (result1.success) {
    console.log('Assistant:', result1.data.text);
  }

  console.log('\n--- Continuing same session ---\n');

  // Second message - the assistant should remember the context
  const result2 = await engine.sendMessage({
    sessionId,
    message: 'What is my favorite color?',
    write: false,
    maxTurns: 1,
  });

  if (result2.success) {
    console.log('Assistant:', result2.data.text);
  }

  console.log('\n--- Listing all sessions ---\n');

  // List all sessions
  const sessions = engine.getSessions();
  console.log(`Total sessions: ${sessions.length}`);
  sessions.forEach((session: any) => {
    console.log(`- ${session.sessionId}: ${session.messageCount} messages`);
  });

  // 4. Cleanup
  await engine.shutdown();
  console.log('\n✓ Engine shut down');
}

// Run the example
sessionExample().catch(console.error);
