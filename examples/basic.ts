/**
 * Basic Example - OriCore
 *
 * This demonstrates the simplest way to use the AI engine.
 */

import { createEngine } from 'oricore';

async function basicExample() {
  console.log('=== Basic AI Engine Example ===\n');

  // 1. Create engine
  const engine = createEngine({
    productName: 'AIEngineExample',
    version: '1.0.0',
  });

  console.log('✓ Engine created');

  // 2. Initialize with configuration
  await engine.initialize({
    model: 'openai/gpt-4o',
  });

  console.log('✓ Engine initialized');

  // 3. Simple Q&A (no tools)
  console.log('\n--- Simple Q&A ---');
  const answer = await engine.ask('What is TypeScript?');
  console.log('Answer:', answer);

  // 4. Multi-turn conversation with tools
  console.log('\n--- Multi-turn Conversation ---');
  const result = await engine.sendMessage({
    message: 'Create a simple TypeScript function',
    write: true,
    maxTurns: 10,
    onTextDelta: async (text) => {
      process.stdout.write(text);
    },
  });

  if (result.success) {
    console.log('\n\n✓ Conversation completed');
    console.log('Tokens used:', result.data.usage);
  } else {
    console.error('Error:', result.error.message);
  }

  // 5. Cleanup
  await engine.shutdown();
  console.log('\n✓ Engine shut down');
}

// Run the example
basicExample().catch(console.error);
