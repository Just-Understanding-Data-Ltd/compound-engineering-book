/**
 * Incremental Development Pattern - Step-by-Step Feature Building
 *
 * Breaking large feature requests into smallest possible increments
 * reduces error rates by 90% through:
 * - Context accumulation (each step builds on prior success)
 * - Immediate error isolation (problems caught in small scope)
 * - Validation loops after each step
 *
 * This pattern prevents the "1000+ lines of code to debug" problem.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Increment represents a single step in the development process
interface Increment {
  number: number;
  description: string;
  expectedOutput: string;
  verificationCriteria: string[];
  dependsOn?: number[];
}

// Result of executing an increment
interface IncrementResult {
  increment: Increment;
  success: boolean;
  output: string;
  verificationResults: { criterion: string; passed: boolean; details?: string }[];
  generatedCode?: string;
  error?: string;
}

// Feature specification with increments
interface IncrementalFeature {
  name: string;
  description: string;
  increments: Increment[];
}

/**
 * Calculates error probability for a given code size.
 * Demonstrates why incremental development reduces errors.
 */
export function calculateErrorProbability(linesOfCode: number, errorRatePer100Lines = 0.1): number {
  // Each 100-line chunk has errorRatePer100Lines chance of containing an error
  const chunks = linesOfCode / 100;
  // Probability of NO errors = (1 - errorRate)^chunks
  // Probability of AT LEAST ONE error = 1 - (1 - errorRate)^chunks
  return 1 - Math.pow(1 - errorRatePer100Lines, chunks);
}

/**
 * Decomposes a large feature request into smaller increments.
 * Returns an ordered list of implementation steps.
 */
export async function decomposeFeature(featureDescription: string): Promise<IncrementalFeature> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Break down this feature into the smallest possible increments:

${featureDescription}

Rules for increments:
1. Each increment should be 20-50 lines of code maximum
2. Each increment must be independently testable/verifiable
3. Order increments so each builds on previous ones
4. Include type definitions before implementations
5. Include tests as separate increments

Output as JSON:
{
  "name": "feature name",
  "description": "what it does",
  "increments": [
    {
      "number": 1,
      "description": "what this step does",
      "expectedOutput": "what files/code this produces",
      "verificationCriteria": ["how to verify step worked"],
      "dependsOn": [/* increment numbers this depends on */]
    }
  ]
}`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Expected text response");
  }

  let jsonText = (content as { type: "text"; text: string }).text;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  return JSON.parse(jsonText.trim()) as IncrementalFeature;
}

/**
 * Executes a single increment, returning the result.
 * Includes generated code and verification status.
 */
export async function executeIncrement(
  feature: IncrementalFeature,
  increment: Increment,
  priorContext: string[]
): Promise<IncrementResult> {
  // Build context from prior increments
  const contextSection =
    priorContext.length > 0
      ? `\n\nCode from previous increments (use as reference):\n${priorContext.join("\n\n---\n\n")}`
      : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Feature: ${feature.name}

Current increment (#${increment.number}): ${increment.description}

Expected output: ${increment.expectedOutput}

Verification criteria:
${increment.verificationCriteria.map((c) => `- ${c}`).join("\n")}

${contextSection}

Implement ONLY this increment. Output:
1. The code for this increment
2. How it satisfies each verification criterion

Keep the code focused and minimal (20-50 lines target).`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    return {
      increment,
      success: false,
      output: "",
      verificationResults: [],
      error: "Unexpected response type",
    };
  }

  const output = (content as { type: "text"; text: string }).text;

  // Extract code blocks from response
  const codeMatch = output.match(/```(?:typescript|ts)?\n?([\s\S]*?)\n?```/);
  const generatedCode = codeMatch ? codeMatch[1] : undefined;

  // Simple verification: check if criteria are mentioned in response
  const verificationResults = increment.verificationCriteria.map((criterion) => ({
    criterion,
    passed: output.toLowerCase().includes(criterion.toLowerCase().substring(0, 20)),
    details: "Mentioned in response",
  }));

  const allPassed = verificationResults.every((v) => v.passed);

  return {
    increment,
    success: allPassed,
    output,
    verificationResults,
    generatedCode,
  };
}

/**
 * Runs the complete incremental development process.
 * Executes each increment in order, accumulating context.
 */
export async function runIncrementalDevelopment(
  feature: IncrementalFeature,
  options?: {
    onIncrementStart?: (increment: Increment) => void;
    onIncrementComplete?: (result: IncrementResult) => void;
    stopOnFailure?: boolean;
  }
): Promise<{
  success: boolean;
  completedIncrements: number;
  results: IncrementResult[];
  failedAt?: number;
}> {
  const results: IncrementResult[] = [];
  const priorContext: string[] = [];

  for (const increment of feature.increments) {
    options?.onIncrementStart?.(increment);

    const result = await executeIncrement(feature, increment, priorContext);
    results.push(result);

    options?.onIncrementComplete?.(result);

    if (result.success && result.generatedCode) {
      // Add successful code to context for next increments
      priorContext.push(`// Increment ${increment.number}: ${increment.description}\n${result.generatedCode}`);
    }

    if (!result.success && options?.stopOnFailure !== false) {
      return {
        success: false,
        completedIncrements: results.filter((r) => r.success).length,
        results,
        failedAt: increment.number,
      };
    }
  }

  return {
    success: results.every((r) => r.success),
    completedIncrements: results.filter((r) => r.success).length,
    results,
  };
}

/**
 * Example: Authentication system increments.
 * This is what the "big-bang" request would decompose into.
 */
export const EXAMPLE_AUTH_INCREMENTS: Increment[] = [
  {
    number: 1,
    description: "Create User interface with id, email, passwordHash fields",
    expectedOutput: "types/user.ts with User interface",
    verificationCriteria: ["Interface exports correctly", "All required fields present", "Types compile"],
  },
  {
    number: 2,
    description: "Add hashPassword and verifyPassword functions using bcrypt",
    expectedOutput: "lib/password.ts with hash/verify functions",
    verificationCriteria: ["Functions return promises", "Hashing produces different output than input", "Verification works"],
    dependsOn: [1],
  },
  {
    number: 3,
    description: "Create UserRepository interface with findByEmail and create methods",
    expectedOutput: "repositories/user.ts with UserRepository interface",
    verificationCriteria: ["Interface exports correctly", "Methods have proper types", "Uses User type"],
    dependsOn: [1],
  },
  {
    number: 4,
    description: "Implement in-memory UserRepository for testing",
    expectedOutput: "repositories/user-memory.ts with InMemoryUserRepository",
    verificationCriteria: ["Implements UserRepository interface", "Can create users", "Can find by email"],
    dependsOn: [3],
  },
  {
    number: 5,
    description: "Create AuthService with register and login methods",
    expectedOutput: "services/auth.ts with AuthService class",
    verificationCriteria: ["Uses UserRepository", "Uses password hashing", "Returns appropriate responses"],
    dependsOn: [2, 4],
  },
  {
    number: 6,
    description: "Add JWT token generation and validation",
    expectedOutput: "lib/jwt.ts with generateToken and validateToken functions",
    verificationCriteria: ["Tokens are signed", "Validation checks signature", "Expiration is handled"],
    dependsOn: [1],
  },
  {
    number: 7,
    description: "Integrate JWT into AuthService",
    expectedOutput: "Updated services/auth.ts with token handling",
    verificationCriteria: ["Login returns token", "Token contains user info", "Refresh flow works"],
    dependsOn: [5, 6],
  },
  {
    number: 8,
    description: "Write unit tests for AuthService",
    expectedOutput: "services/auth.test.ts with comprehensive tests",
    verificationCriteria: ["Tests pass", "Covers happy path", "Covers error cases"],
    dependsOn: [7],
  },
];

/**
 * Compares big-bang vs incremental error probability.
 */
export function compareApproaches(totalLines: number, incrementSize: number): {
  bigBang: { lines: number; errorProbability: number };
  incremental: { increments: number; avgErrorProb: number; worstCaseTotalErrors: number };
  improvement: string;
} {
  const bigBangErrorProb = calculateErrorProbability(totalLines);
  const numIncrements = Math.ceil(totalLines / incrementSize);
  const incrementErrorProb = calculateErrorProbability(incrementSize);

  // In incremental, each step can have an error, but errors are isolated
  // Worst case: every increment has an error (unlikely)
  // But each error affects only incrementSize lines, not totalLines

  return {
    bigBang: {
      lines: totalLines,
      errorProbability: bigBangErrorProb,
    },
    incremental: {
      increments: numIncrements,
      avgErrorProb: incrementErrorProb,
      worstCaseTotalErrors: numIncrements * incrementErrorProb,
    },
    improvement: `With ${totalLines} lines: Big-bang has ${(bigBangErrorProb * 100).toFixed(1)}% chance of error in ${totalLines} lines to debug. Incremental has ${(incrementErrorProb * 100).toFixed(1)}% chance per ${incrementSize}-line increment (${numIncrements} increments).`,
  };
}

/**
 * Validates that increments form a valid dependency graph.
 */
export function validateIncrementDependencies(increments: Increment[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const incrementNumbers = new Set(increments.map((i) => i.number));

  for (const increment of increments) {
    // Check dependencies exist
    if (increment.dependsOn) {
      for (const dep of increment.dependsOn) {
        if (!incrementNumbers.has(dep)) {
          issues.push(`Increment ${increment.number} depends on non-existent increment ${dep}`);
        }
        if (dep >= increment.number) {
          issues.push(`Increment ${increment.number} depends on later increment ${dep}`);
        }
      }
    }

    // Check for circular dependencies (simplified)
    if (increment.dependsOn?.includes(increment.number)) {
      issues.push(`Increment ${increment.number} depends on itself`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Demo: Compare big-bang vs incremental
async function demo() {
  console.log("=== Incremental Development Demo ===\n");

  // Show error probability comparison
  console.log("Error Probability Comparison:");
  const comparison = compareApproaches(1000, 50);
  console.log(comparison.improvement);

  console.log("\n=== Example Auth Increments ===");
  console.log(`Total increments: ${EXAMPLE_AUTH_INCREMENTS.length}`);

  // Validate dependencies
  const validation = validateIncrementDependencies(EXAMPLE_AUTH_INCREMENTS);
  console.log(`Dependency graph valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log("Issues:", validation.issues);
  }

  // Show increments
  console.log("\nIncrement order:");
  EXAMPLE_AUTH_INCREMENTS.forEach((inc) => {
    const deps = inc.dependsOn ? ` (depends on: ${inc.dependsOn.join(", ")})` : "";
    console.log(`  ${inc.number}. ${inc.description}${deps}`);
  });

  // Optional: Run actual incremental development
  // Uncomment to run with API calls:
  //
  // const feature: IncrementalFeature = {
  //   name: "User Authentication",
  //   description: "JWT-based authentication system",
  //   increments: EXAMPLE_AUTH_INCREMENTS,
  // };
  //
  // const result = await runIncrementalDevelopment(feature, {
  //   onIncrementStart: (inc) => console.log(`\nStarting increment ${inc.number}...`),
  //   onIncrementComplete: (res) => console.log(`  ${res.success ? "✓" : "✗"} Completed`),
  // });
  //
  // console.log(`\nCompleted ${result.completedIncrements}/${feature.increments.length} increments`);
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
