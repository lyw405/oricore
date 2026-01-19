/**
 * Modes Example - OriCore
 *
 * This demonstrates how to use different interaction modes.
 */

import { createEngine } from 'oricore';

async function modesExample() {
  console.log('=== AI Engine Modes Example ===\n');

  const engine = createEngine({
    productName: 'ModesExample',
    version: '1.0.0',
  });

  await engine.initialize({
    model: 'openai/gpt-4o',
  });

  // List all available modes
  console.log('Available modes:');
  const modes = engine.getAvailableModes();
  for (const mode of modes) {
    console.log(`  - ${mode.id}: ${mode.description}`);
  }
  console.log();

  // Example 1: Brainstorm mode (interactive)
  console.log('=== Brainstorm Mode ===');
  console.log('This mode asks questions to understand your requirements\n');

  engine.setMode('brainstorm');

  const brainstormResult = await engine.sendMessageWithMode(
    'I want to build a simple todo app',
    {
      onToolApprove: async (toolUse) => {
        if (toolUse.name === 'askUserQuestion') {
          const questions = toolUse.params.questions;

          console.log('\n🤔 AI asks:');
          for (const q of questions) {
            console.log(`\n[${q.header}]`);
            console.log(`  ${q.question}`);
            q.options.forEach((o, i) => {
              console.log(`  ${i + 1}. ${o.label}`);
            });
          }

          // For demo, auto-select first option
          console.log('\n→ Auto-selecting first option for demo...\n');

          const answers = questions.map(q => ({
            question: q.question,
            answer: q.options[0].label,
          }));

          return {
            approved: true,
            params: { ...toolUse.params, answers },
          };
        }
        return { approved: true };
      },
    }
  );

  if (brainstormResult.success) {
    console.log('\n✓ Design completed');
  }

  // Example 2: Plan mode
  console.log('\n\n=== Plan Mode ===\n');
  engine.setMode('plan');

  const planResult = await engine.sendMessageWithMode(
    'Create a plan for implementing user authentication'
  );

  if (planResult.success) {
    console.log('Plan created successfully');
  }

  // Example 3: Custom mode
  console.log('\n\n=== Custom Mode ===\n');

  engine.registerMode({
    id: 'typescript-expert',
    name: 'TypeScript Expert',
    description: 'Specialized in TypeScript development',
    config: {
      systemPrompt: `You are a TypeScript expert.
      Focus on type safety, best practices, and modern TypeScript features.
      Always provide typed examples.`,
      write: false,
      askUserQuestion: false,
      maxTurns: 10,
    },
  });

  engine.setMode('typescript-expert');

  const expertResult = await engine.sendMessageWithMode(
    'Explain TypeScript utility types'
  );

  if (expertResult.success) {
    console.log('✓ Expert advice received');
  }

  await engine.shutdown();
  console.log('\n✓ All examples completed!');
}

modesExample().catch(console.error);
