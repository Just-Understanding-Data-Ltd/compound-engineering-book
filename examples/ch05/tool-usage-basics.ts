/**
 * Tool Usage Basics - Beginner-Friendly Introduction
 *
 * This file provides a progressive, step-by-step guide to understanding
 * tool usage with the Anthropic SDK. Each section builds on the previous one.
 *
 * Run with: bun examples/ch05/tool-usage-basics.ts
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ============================================================================
// SECTION 1: What Are Tools?
// ============================================================================
// Tools let Claude perform actions beyond text generation. Instead of just
// answering questions, Claude can:
// - Look up real data (weather, databases, APIs)
// - Perform calculations
// - Execute code
// - Interact with external systems
//
// When you give Claude tools, it decides WHAT to do. Your code decides HOW.

// ============================================================================
// SECTION 2: Basic Tool Definition
// ============================================================================
// A tool has three parts:
// 1. name: A unique identifier (snake_case recommended)
// 2. description: What the tool does (Claude reads this to decide when to use it)
// 3. input_schema: JSON Schema defining what parameters the tool accepts

export const calculatorTool: Anthropic.Tool = {
  name: 'calculator',
  description: 'Perform basic arithmetic operations: add, subtract, multiply, divide',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform',
      },
      a: {
        type: 'number',
        description: 'The first operand',
      },
      b: {
        type: 'number',
        description: 'The second operand',
      },
    },
    required: ['operation', 'a', 'b'],
  },
};

// ============================================================================
// SECTION 3: Tool Execution Function
// ============================================================================
// When Claude decides to use a tool, you receive a structured JSON object.
// Your code handles the actual execution.

export interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

export function executeCalculator(input: CalculatorInput): string {
  switch (input.operation) {
    case 'add':
      return `${input.a + input.b}`;
    case 'subtract':
      return `${input.a - input.b}`;
    case 'multiply':
      return `${input.a * input.b}`;
    case 'divide':
      if (input.b === 0) return 'Error: Division by zero';
      return `${input.a / input.b}`;
    default:
      return 'Error: Unknown operation';
  }
}

// ============================================================================
// SECTION 4: Simple Tool Call (One Round)
// ============================================================================
// The simplest pattern: ask Claude a question, it uses a tool, you return the result.

export async function simpleToolCall(): Promise<string> {
  console.log('\n--- Simple Tool Call Demo ---\n');

  // Step 1: Send message with tools available
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'What is 42 multiplied by 17?',
      },
    ],
    tools: [calculatorTool],
  });

  console.log('Claude response type:', message.stop_reason);

  // Step 2: Check if Claude wants to use a tool
  if (message.stop_reason === 'tool_use') {
    // Find the tool use block in the response
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUse) {
      console.log('Claude wants to use:', toolUse.name);
      console.log('With parameters:', JSON.stringify(toolUse.input, null, 2));

      // Step 3: Execute the tool
      const result = executeCalculator(toolUse.input as CalculatorInput);
      console.log('Tool result:', result);

      // Step 4: Send the result back to Claude
      const finalResponse = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: 'What is 42 multiplied by 17?' },
          { role: 'assistant', content: message.content },
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
              },
            ],
          },
        ],
        tools: [calculatorTool],
      });

      // Extract text response
      const textBlock = finalResponse.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      console.log('\nClaude final answer:', textBlock?.text);
      return textBlock?.text ?? 'No response';
    }
  }

  // If Claude responded with text directly (no tool use)
  const textBlock = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  return textBlock?.text ?? 'No response';
}

// ============================================================================
// SECTION 5: Multiple Tools
// ============================================================================
// Real applications often provide multiple tools. Claude chooses the right one.

export const weatherTool: Anthropic.Tool = {
  name: 'get_weather',
  description: 'Get the current weather for a location',
  input_schema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city name, e.g., "San Francisco"',
      },
    },
    required: ['location'],
  },
};

export const databaseTool: Anthropic.Tool = {
  name: 'query_database',
  description: 'Query the customer database for user information',
  input_schema: {
    type: 'object',
    properties: {
      query_type: {
        type: 'string',
        enum: ['count_users', 'get_user', 'list_recent'],
        description: 'Type of database query',
      },
      user_id: {
        type: 'string',
        description: 'User ID for get_user queries (optional)',
      },
    },
    required: ['query_type'],
  },
};

// Mock implementations
export function executeWeather(input: { location: string }): string {
  const conditions: Record<string, string> = {
    'San Francisco': 'Foggy, 62F',
    'New York': 'Cloudy, 55F',
    'Los Angeles': 'Sunny, 78F',
  };
  return conditions[input.location] ?? `Weather data unavailable for ${input.location}`;
}

export function executeDatabase(input: { query_type: string; user_id?: string }): string {
  switch (input.query_type) {
    case 'count_users':
      return 'Total users: 1,542';
    case 'get_user':
      return JSON.stringify({ id: input.user_id, name: 'Jane Smith', status: 'active' });
    case 'list_recent':
      return 'Recent signups: user_101, user_102, user_103';
    default:
      return 'Unknown query type';
  }
}

// Generic tool executor that routes to the right function
export function executeTool(name: string, input: unknown): string {
  const params = input as Record<string, unknown>;
  switch (name) {
    case 'calculator':
      return executeCalculator({
        operation: params.operation as CalculatorInput['operation'],
        a: params.a as number,
        b: params.b as number,
      });
    case 'get_weather':
      return executeWeather({ location: params.location as string });
    case 'query_database':
      return executeDatabase({
        query_type: params.query_type as string,
        user_id: params.user_id as string | undefined,
      });
    default:
      return `Unknown tool: ${name}`;
  }
}

export async function multipleToolsDemo(): Promise<void> {
  console.log('\n--- Multiple Tools Demo ---\n');

  const tools = [calculatorTool, weatherTool, databaseTool];

  // Ask something that requires the database tool
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'How many users do we have in our database?',
      },
    ],
    tools,
  });

  if (message.stop_reason === 'tool_use') {
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUse) {
      console.log('Claude chose tool:', toolUse.name);
      console.log('This shows Claude selects the appropriate tool for the task.');

      const result = executeTool(toolUse.name, toolUse.input);
      console.log('Result:', result);
    }
  }
}

// ============================================================================
// SECTION 6: Tool Call Loop (Multiple Rounds)
// ============================================================================
// Complex tasks may require multiple tool calls. This pattern loops until done.

export async function toolCallLoop(): Promise<string> {
  console.log('\n--- Tool Call Loop Demo ---\n');

  const tools = [calculatorTool, weatherTool];

  // A question that might need multiple tool calls
  const userMessage = 'What is the weather in San Francisco, and also what is 156 divided by 12?';

  let messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  let iterations = 0;
  const maxIterations = 10; // Safety limit

  while (iterations < maxIterations) {
    iterations++;
    console.log(`\n--- Iteration ${iterations} ---`);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages,
      tools,
    });

    console.log('Stop reason:', response.stop_reason);

    // If Claude is done (end_turn), extract the final text
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      console.log('\n=== Final Answer ===\n', textBlock?.text);
      return textBlock?.text ?? 'No final response';
    }

    // If Claude wants to use tools, execute them all
    if (response.stop_reason === 'tool_use') {
      // Add Claude's response to conversation
      messages.push({ role: 'assistant', content: response.content });

      // Find all tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((toolUse) => {
        console.log(`Executing ${toolUse.name}:`, JSON.stringify(toolUse.input));
        const result = executeTool(toolUse.name, toolUse.input);
        console.log(`Result: ${result}`);

        return {
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: result,
        };
      });

      // Add tool results to conversation
      messages.push({ role: 'user', content: toolResults });
    }
  }

  return 'Max iterations reached';
}

// ============================================================================
// SECTION 7: Error Handling
// ============================================================================
// Tools can fail. Good error handling makes agents more reliable.

export async function errorHandlingDemo(): Promise<void> {
  console.log('\n--- Error Handling Demo ---\n');

  const riskyTool: Anthropic.Tool = {
    name: 'divide_numbers',
    description: 'Divide two numbers',
    input_schema: {
      type: 'object',
      properties: {
        numerator: { type: 'number' },
        denominator: { type: 'number' },
      },
      required: ['numerator', 'denominator'],
    },
  };

  function executeDivision(input: { numerator: number; denominator: number }): {
    success: boolean;
    result?: string;
    error?: string;
  } {
    if (input.denominator === 0) {
      return { success: false, error: 'Cannot divide by zero' };
    }
    return { success: true, result: `${input.numerator / input.denominator}` };
  }

  // Ask for something that will fail
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'What is 42 divided by 0?' },
    ],
    tools: [riskyTool],
  });

  if (message.stop_reason === 'tool_use') {
    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUse) {
      const result = executeDivision(toolUse.input as { numerator: number; denominator: number });

      // Always return a result to Claude, even on error
      const toolResult: Anthropic.ToolResultBlockParam = {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result.success
          ? result.result!
          : `Error: ${result.error}`,
        is_error: !result.success, // Mark as error so Claude knows
      };

      console.log('Tool result:', toolResult);

      // Claude will gracefully handle the error
      const finalResponse = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: 'What is 42 divided by 0?' },
          { role: 'assistant', content: message.content },
          { role: 'user', content: [toolResult] },
        ],
        tools: [riskyTool],
      });

      const textBlock = finalResponse.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      console.log('\nClaude handles the error:', textBlock?.text);
    }
  }
}

// ============================================================================
// SECTION 8: Common Tool Use Patterns
// ============================================================================

// Pattern 1: Data Lookup Tool
// Use when Claude needs to access external data
const lookupPattern: Anthropic.Tool = {
  name: 'lookup_product',
  description: 'Look up product details by SKU',
  input_schema: {
    type: 'object',
    properties: {
      sku: { type: 'string', description: 'Product SKU code' },
    },
    required: ['sku'],
  },
};

// Pattern 2: Action Tool
// Use when Claude needs to perform side effects
const actionPattern: Anthropic.Tool = {
  name: 'send_email',
  description: 'Send an email to a recipient',
  input_schema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' },
    },
    required: ['to', 'subject', 'body'],
  },
};

// Pattern 3: Confirmation Tool
// Use to get human approval before risky actions
const confirmationPattern: Anthropic.Tool = {
  name: 'request_approval',
  description: 'Request human approval before proceeding',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'What action needs approval' },
      reason: { type: 'string', description: 'Why approval is needed' },
      urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['action', 'reason'],
  },
};

// Export pattern examples for reference
export const commonPatterns = {
  lookup: lookupPattern,
  action: actionPattern,
  confirmation: confirmationPattern,
};

// ============================================================================
// MAIN: Run All Demos
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Tool Usage Basics - Interactive Examples');
  console.log('='.repeat(60));

  try {
    // Run each demo
    await simpleToolCall();
    await multipleToolsDemo();
    await toolCallLoop();
    await errorHandlingDemo();

    console.log('\n' + '='.repeat(60));
    console.log('All demos completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error running demos:', error);
  }
}

// Only run main if this file is executed directly
if (import.meta.main) {
  main();
}
