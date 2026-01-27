/**
 * Context Impact Demo
 *
 * Demonstrates how context in system prompts affects Claude's code generation.
 * This example shows the difference between asking Claude to generate code
 * with and without project-specific context.
 *
 * Related to Chapter 4 sections:
 * - "Why CLAUDE.md Matters"
 * - "The Instruction-Following Degradation Curve"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Type alias for content blocks
type ContentBlock = Anthropic.Messages.ContentBlock;

// Example project context (simulates content from a CLAUDE.md file)
const PROJECT_CONTEXT = `
# Project Context

## Stack
- TypeScript with strict mode
- FastAPI backend (Python) in /api
- Factory functions, never classes
- Result types for error handling (never throw)

## Conventions
- Use bun, not npm
- API routes follow: /api/v1/{resource}/{action}
- All async functions return Promise<Result<T, E>>
`;

// The same task, asked with different context levels
const TASK = 'Create a function to validate user email addresses';

interface GenerationResult {
  context: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Generate code without project context
 */
async function generateWithoutContext(): Promise<GenerationResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: `${TASK}. Write TypeScript code.` }
    ],
  });

  const textContent = message.content.find((block: ContentBlock) => block.type === 'text');
  return {
    context: 'none',
    response: textContent?.type === 'text' ? textContent.text : '',
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/**
 * Generate code with project context in system prompt
 */
async function generateWithContext(): Promise<GenerationResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: PROJECT_CONTEXT,
    messages: [
      { role: 'user', content: TASK }
    ],
  });

  const textContent = message.content.find((block: ContentBlock) => block.type === 'text');
  return {
    context: 'full',
    response: textContent?.type === 'text' ? textContent.text : '',
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/**
 * Analyze whether generated code follows project conventions
 */
function analyzeConformance(code: string): {
  usesFactoryFunction: boolean;
  usesResultType: boolean;
  usesClasses: boolean;
  throwsExceptions: boolean;
} {
  return {
    usesFactoryFunction: /(?:export\s+)?(?:const|function)\s+\w+\s*=?\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*{)/i.test(code),
    usesResultType: /Result<|success:|error:/i.test(code),
    usesClasses: /\bclass\s+\w+/i.test(code),
    throwsExceptions: /\bthrow\s+(?:new\s+)?(?:Error|Exception)/i.test(code),
  };
}

/**
 * Main demo function
 */
export async function runContextImpactDemo(): Promise<{
  withoutContext: GenerationResult & { conformance: ReturnType<typeof analyzeConformance> };
  withContext: GenerationResult & { conformance: ReturnType<typeof analyzeConformance> };
}> {
  console.log('Running Context Impact Demo...\n');
  console.log('Task:', TASK);
  console.log('---\n');

  // Generate without context
  console.log('1. Generating WITHOUT project context...');
  const withoutContext = await generateWithoutContext();
  const conformanceWithout = analyzeConformance(withoutContext.response);

  console.log('   Tokens used:', withoutContext.inputTokens, 'input,', withoutContext.outputTokens, 'output');
  console.log('   Uses factory function:', conformanceWithout.usesFactoryFunction);
  console.log('   Uses Result type:', conformanceWithout.usesResultType);
  console.log('   Uses classes:', conformanceWithout.usesClasses);
  console.log('   Throws exceptions:', conformanceWithout.throwsExceptions);
  console.log();

  // Generate with context
  console.log('2. Generating WITH project context...');
  const withContext = await generateWithContext();
  const conformanceWith = analyzeConformance(withContext.response);

  console.log('   Tokens used:', withContext.inputTokens, 'input,', withContext.outputTokens, 'output');
  console.log('   Uses factory function:', conformanceWith.usesFactoryFunction);
  console.log('   Uses Result type:', conformanceWith.usesResultType);
  console.log('   Uses classes:', conformanceWith.usesClasses);
  console.log('   Throws exceptions:', conformanceWith.throwsExceptions);
  console.log();

  // Summary
  console.log('Summary:');
  console.log('  Context tokens cost:', withContext.inputTokens - withoutContext.inputTokens, 'additional input tokens');
  console.log('  Convention conformance improved:',
    (conformanceWith.usesResultType && !conformanceWithout.usesResultType) ||
    (!conformanceWith.usesClasses && conformanceWithout.usesClasses) ||
    (!conformanceWith.throwsExceptions && conformanceWithout.throwsExceptions)
  );

  return {
    withoutContext: { ...withoutContext, conformance: conformanceWithout },
    withContext: { ...withContext, conformance: conformanceWith },
  };
}

// Run if executed directly
if (import.meta.main) {
  runContextImpactDemo().catch(console.error);
}
