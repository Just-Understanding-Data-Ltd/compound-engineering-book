/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * This file demonstrates context-efficient backpressure patterns.
 * When tests pass, verbose output wastes context. The run_silent pattern
 * swallows success output and only dumps details on failure.
 *
 * Key concepts:
 * - Suppress output on success to preserve context budget
 * - Dump full details on failure for debugging
 * - Progressive refinement with fail-fast patterns
 * - Keep context within optimal 75K token range
 */

import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "child_process";

const client = new Anthropic();

// ============================================================================
// BACKPRESSURE TYPES AND INTERFACES
// ============================================================================

/**
 * Result of a command execution
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Exit code */
  exitCode: number;
  /** Command that was run */
  command: string;
  /** Description of the command */
  description: string;
  /** Full output (stdout + stderr) */
  fullOutput: string;
  /** Compressed output for context */
  compressedOutput: string;
  /** Token estimate for full output */
  fullTokens: number;
  /** Token estimate for compressed output */
  compressedTokens: number;
}

/**
 * Batch execution result
 */
export interface BatchResult {
  /** Individual command results */
  results: CommandResult[];
  /** Total commands run */
  total: number;
  /** Number of successes */
  passed: number;
  /** Number of failures */
  failed: number;
  /** Token savings from compression */
  tokenSavings: number;
  /** Context-efficient summary */
  summary: string;
}

/**
 * Context budget tracking
 */
export interface ContextBudget {
  /** Maximum tokens allowed */
  maxTokens: number;
  /** Tokens used so far */
  usedTokens: number;
  /** Remaining tokens */
  remainingTokens: number;
  /** Usage percentage */
  usagePercent: number;
  /** Whether we're in the optimal range (under 75K) */
  isOptimal: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Optimal context window thresholds
 */
export const CONTEXT_THRESHOLDS = {
  /** Maximum recommended context for accuracy */
  optimalMax: 75000,
  /** Context window limit */
  absoluteMax: 200000,
  /** Tokens per character estimate */
  tokensPerChar: 0.25,
  /** Success indicator token cost */
  successTokens: 10,
  /** Failure dump token multiplier */
  failureMultiplier: 1.0,
};

// ============================================================================
// RUN_SILENT PATTERN
// ============================================================================

/**
 * Estimate token count from text length
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length * CONTEXT_THRESHOLDS.tokensPerChar);
}

/**
 * Run a command with the run_silent pattern
 * - Success: Return minimal output (checkmark + description)
 * - Failure: Return full output for debugging
 */
export async function runSilent(
  description: string,
  command: string
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const chunks: string[] = [];

    const proc = spawn(command, [], {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      chunks.push(data.toString());
    });

    proc.stderr.on("data", (data: Buffer) => {
      chunks.push(data.toString());
    });

    proc.on("close", (code) => {
      const fullOutput = chunks.join("");
      const exitCode = code ?? 1;
      const success = exitCode === 0;

      // Compressed output: just success/failure indicator
      const compressedOutput = success
        ? `  ✓ ${description}`
        : `  ✗ ${description}\n\n${fullOutput}`;

      resolve({
        success,
        exitCode,
        command,
        description,
        fullOutput,
        compressedOutput,
        fullTokens: estimateTokens(fullOutput),
        compressedTokens: estimateTokens(compressedOutput),
      });
    });

    proc.on("error", (error) => {
      resolve({
        success: false,
        exitCode: 1,
        command,
        description,
        fullOutput: error.message,
        compressedOutput: `  ✗ ${description}\n\n${error.message}`,
        fullTokens: estimateTokens(error.message),
        compressedTokens: estimateTokens(`  ✗ ${description}\n\n${error.message}`),
      });
    });
  });
}

/**
 * Run multiple commands with run_silent pattern
 */
export async function runBatch(
  commands: Array<{ description: string; command: string }>,
  failFast: boolean = false
): Promise<BatchResult> {
  const results: CommandResult[] = [];
  let totalFullTokens = 0;
  let totalCompressedTokens = 0;

  for (const cmd of commands) {
    const result = await runSilent(cmd.description, cmd.command);
    results.push(result);
    totalFullTokens += result.fullTokens;
    totalCompressedTokens += result.compressedTokens;

    if (failFast && !result.success) {
      break; // Stop at first failure
    }
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  // Build context-efficient summary
  const summary = results.map((r) => r.compressedOutput).join("\n");

  return {
    results,
    total: results.length,
    passed,
    failed,
    tokenSavings: totalFullTokens - totalCompressedTokens,
    summary,
  };
}

// ============================================================================
// CONTEXT BUDGET MANAGEMENT
// ============================================================================

/**
 * Track and manage context budget
 */
export function createContextBudget(maxTokens: number = CONTEXT_THRESHOLDS.optimalMax): ContextBudget {
  return {
    maxTokens,
    usedTokens: 0,
    remainingTokens: maxTokens,
    usagePercent: 0,
    isOptimal: true,
  };
}

/**
 * Update budget after adding content
 */
export function updateBudget(budget: ContextBudget, tokensUsed: number): ContextBudget {
  const usedTokens = budget.usedTokens + tokensUsed;
  const remainingTokens = Math.max(0, budget.maxTokens - usedTokens);
  const usagePercent = (usedTokens / budget.maxTokens) * 100;
  const isOptimal = usedTokens <= CONTEXT_THRESHOLDS.optimalMax;

  return {
    maxTokens: budget.maxTokens,
    usedTokens,
    remainingTokens,
    usagePercent,
    isOptimal,
  };
}

/**
 * Check if adding content would exceed budget
 */
export function wouldExceedBudget(budget: ContextBudget, tokensToAdd: number): boolean {
  return budget.usedTokens + tokensToAdd > budget.maxTokens;
}

/**
 * Get budget recommendation
 */
export function getBudgetRecommendation(budget: ContextBudget): string {
  if (budget.usagePercent < 50) {
    return "Budget healthy - room for more detailed context";
  } else if (budget.usagePercent < 75) {
    return "Budget moderate - prioritize high-information content";
  } else if (budget.isOptimal) {
    return "Budget tight - use run_silent for remaining commands";
  } else {
    return "Budget exceeded optimal range - consider summarization";
  }
}

// ============================================================================
// PROGRESSIVE REFINEMENT
// ============================================================================

/**
 * Progressive test execution with increasing detail on failure
 *
 * Level 1: Run all tests, show only pass/fail counts
 * Level 2: On failure, rerun failing tests with output
 * Level 3: On continued failure, show full debug information
 */
export interface ProgressiveTestResult {
  level: 1 | 2 | 3;
  passed: boolean;
  summary: string;
  tokensUsed: number;
  detailLevel: "minimal" | "moderate" | "full";
}

/**
 * Simulate progressive test execution
 */
export function simulateProgressiveTests(
  totalTests: number,
  failingTests: number
): ProgressiveTestResult {
  const passed = failingTests === 0;

  if (passed) {
    // Level 1: Minimal output on success
    return {
      level: 1,
      passed: true,
      summary: `✓ All ${totalTests} tests passed`,
      tokensUsed: 10,
      detailLevel: "minimal",
    };
  }

  // Level 2: Moderate detail for failures
  const failingSummary = Array.from({ length: failingTests }, (_, i) =>
    `  ✗ Test ${i + 1}: assertion failed`
  ).join("\n");

  if (failingTests <= 3) {
    return {
      level: 2,
      passed: false,
      summary: `✗ ${failingTests}/${totalTests} tests failed\n\n${failingSummary}`,
      tokensUsed: 50 + failingTests * 20,
      detailLevel: "moderate",
    };
  }

  // Level 3: Full detail for many failures
  return {
    level: 3,
    passed: false,
    summary: `✗ ${failingTests}/${totalTests} tests failed\n\n${failingSummary}\n\n[Full stack traces available]`,
    tokensUsed: 100 + failingTests * 50,
    detailLevel: "full",
  };
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Execute with context budget awareness
 */
export async function executeWithBudget(
  task: string,
  contextBudget: ContextBudget
): Promise<{ response: string; budgetAfter: ContextBudget }> {
  const taskTokens = estimateTokens(task);

  if (wouldExceedBudget(contextBudget, taskTokens)) {
    throw new Error(`Task would exceed context budget (${taskTokens} tokens needed, ${contextBudget.remainingTokens} available)`);
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: task }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";
  const responseTokens = response.usage.output_tokens;

  const budgetAfter = updateBudget(
    updateBudget(contextBudget, taskTokens),
    responseTokens
  );

  return {
    response: responseText,
    budgetAfter,
  };
}

/**
 * Run tests with context-efficient reporting
 */
export async function reportTestResults(
  testResults: BatchResult
): Promise<string> {
  const prompt = `Summarize these test results concisely (max 3 sentences):

${testResults.summary}

Total: ${testResults.total} tests, ${testResults.passed} passed, ${testResults.failed} failed`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  return textContent ? textContent.text : "";
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate context backpressure patterns
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Context-Efficient Backpressure ===\n");

  // Example 1: Token estimation
  console.log("1. Token Estimation");
  const shortText = "Test passed";
  const longText = "Error: Expected value 42 but received undefined. Stack trace: at test.js:15:3...".repeat(10);
  console.log(`   Short text (${shortText.length} chars): ~${estimateTokens(shortText)} tokens`);
  console.log(`   Long text (${longText.length} chars): ~${estimateTokens(longText)} tokens`);

  // Example 2: Simulated run_silent pattern
  console.log("\n2. Run Silent Pattern (simulated)");
  const mockResults: CommandResult[] = [
    {
      success: true,
      exitCode: 0,
      command: "pytest tests/auth/",
      description: "Auth tests",
      fullOutput: "...collected 15 items...15 passed in 2.3s",
      compressedOutput: "  ✓ Auth tests",
      fullTokens: 50,
      compressedTokens: 5,
    },
    {
      success: true,
      exitCode: 0,
      command: "pytest tests/utils/",
      description: "Utils tests",
      fullOutput: "...collected 8 items...8 passed in 0.5s",
      compressedOutput: "  ✓ Utils tests",
      fullTokens: 40,
      compressedTokens: 5,
    },
    {
      success: false,
      exitCode: 1,
      command: "pytest tests/api/",
      description: "API tests",
      fullOutput: "FAIL test_users.py::test_validate_email\nExpected: true\nReceived: false",
      compressedOutput: "  ✗ API tests\n\nFAIL test_users.py::test_validate_email\nExpected: true\nReceived: false",
      fullTokens: 100,
      compressedTokens: 30,
    },
  ];

  console.log("   Success output:");
  for (const r of mockResults.filter((r) => r.success)) {
    console.log(`   ${r.compressedOutput}`);
  }
  console.log("   Failure output:");
  for (const r of mockResults.filter((r) => !r.success)) {
    console.log(`   ${r.compressedOutput}`);
  }

  const totalFull = mockResults.reduce((sum, r) => sum + r.fullTokens, 0);
  const totalCompressed = mockResults.reduce((sum, r) => sum + r.compressedTokens, 0);
  console.log(`\n   Token comparison:`);
  console.log(`   - Full output: ${totalFull} tokens`);
  console.log(`   - Compressed: ${totalCompressed} tokens`);
  console.log(`   - Savings: ${totalFull - totalCompressed} tokens (${Math.round((1 - totalCompressed / totalFull) * 100)}%)`);

  // Example 3: Context budget management
  console.log("\n3. Context Budget Management");
  let budget = createContextBudget(75000);
  console.log(`   Initial budget: ${budget.maxTokens} tokens`);

  budget = updateBudget(budget, 10000);
  console.log(`   After adding 10K: ${budget.usedTokens} used, ${budget.usagePercent.toFixed(1)}%`);
  console.log(`   Recommendation: ${getBudgetRecommendation(budget)}`);

  budget = updateBudget(budget, 50000);
  console.log(`   After adding 50K more: ${budget.usedTokens} used, ${budget.usagePercent.toFixed(1)}%`);
  console.log(`   Recommendation: ${getBudgetRecommendation(budget)}`);
  console.log(`   Still optimal: ${budget.isOptimal}`);

  budget = updateBudget(budget, 20000);
  console.log(`   After adding 20K more: ${budget.usedTokens} used`);
  console.log(`   Recommendation: ${getBudgetRecommendation(budget)}`);
  console.log(`   Still optimal: ${budget.isOptimal}`);

  // Example 4: Progressive test refinement
  console.log("\n4. Progressive Test Refinement");
  const allPass = simulateProgressiveTests(50, 0);
  console.log(`   All pass: Level ${allPass.level}, ${allPass.tokensUsed} tokens`);
  console.log(`   Output: ${allPass.summary}`);

  const fewFail = simulateProgressiveTests(50, 2);
  console.log(`\n   Few failures: Level ${fewFail.level}, ${fewFail.tokensUsed} tokens`);
  console.log(`   Output: ${fewFail.summary.split("\n").slice(0, 2).join("\n")}...`);

  const manyFail = simulateProgressiveTests(50, 10);
  console.log(`\n   Many failures: Level ${manyFail.level}, ${manyFail.tokensUsed} tokens`);
  console.log(`   Detail level: ${manyFail.detailLevel}`);

  // Example 5: Fail-fast pattern
  console.log("\n5. Fail-Fast Pattern Benefits");
  console.log("   Without fail-fast: Run all 50 tests, show all failures");
  console.log("   With fail-fast: Stop at first failure, fix one thing at a time");
  console.log("   Context savings: Process one failure (~50 tokens) vs all failures (~500 tokens)");

  // Example 6: Live execution (requires API key and shell access)
  console.log("\n6. Live Command Execution");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await runSilent("Echo test", "echo 'Hello, backpressure!'");
      console.log(`   ${result.compressedOutput}`);
      console.log(`   Full tokens: ${result.fullTokens}, Compressed: ${result.compressedTokens}`);
    } catch (error) {
      console.log("   (Command execution skipped)");
    }
  } else {
    console.log("   (API key not set - skipping live demonstration)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
