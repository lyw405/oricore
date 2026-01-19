/**
 * Streaming Example - OriCore
 *
 * This demonstrates how to use streaming responses.
 */

import { createEngine } from 'oricore';

async function streamingExample() {
  console.log('=== Streaming Response Example ===\n');

  const engine = createEngine({
    productName: 'StreamingExample',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'openai/gpt-4o',
  });

  console.log('--- Streaming Explanation ---\n');
  console.log('Question: What are JavaScript Promises?\n');
  console.log('Answer:\n');

  const result = await engine.sendMessage({
    message: 'Explain JavaScript Promises in simple terms',
    write: false,
    onTextDelta: async (text) => {
      // Stream the text as it arrives
      process.stdout.write(text);
    },
    onText: async (text) => {
      // Called when complete text is ready
      console.log('\n\n[Complete text received, length:', text.length, ']');
    },
    onTurn: async (turn) => {
      console.log('\n[Turn completed, tokens:', turn.usage?.completionTokens || 0, ']');
    },
  });

  if (result.success) {
    console.log('\n✓ Streaming completed');
  }

  await engine.shutdown();
}

streamingExample().catch(console.error);
