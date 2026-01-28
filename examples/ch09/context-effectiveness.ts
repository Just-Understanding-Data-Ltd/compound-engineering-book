/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * This file demonstrates context effectiveness measurement using mutual information
 * principles. By measuring output variance across multiple generations, you can
 * quantify how well your context constrains model behavior.
 *
 * Key concepts:
 * - Mutual information (MI) captures how much context determines output
 * - High MI = context strongly predicts output (1-2 unique outputs)
 * - Low MI = context barely affects output (6+ unique outputs)
 * - Multiple measurement methods provide comprehensive assessment
 *
 * Based on: mutual-information-context.md
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// CORE TYPES AND INTERFACES
// ============================================================================

/**
 * Result of measuring context effectiveness through output variance
 */
export interface ContextEffectivenessResult {
  /** Number of unique outputs produced */
  uniqueOutputs: number;
  /** Total number of generation attempts */
  totalGenerations: number;
  /** Estimated entropy in bits: log2(uniqueOutputs) */
  entropyEstimate: number;
  /** Context effectiveness rating */
  effectiveness: "high" | "medium" | "low";
  /** Sample outputs for inspection */
  samples: string[];
  /** Variance ratio (uniqueOutputs / totalGenerations) */
  varianceRatio: number;
}

/**
 * Test case for validating generated code
 */
export interface TestCase {
  /** Test name for identification */
  name: string;
  /** Validation function that returns true if code passes */
  validate: (code: string) => boolean;
}

/**
 * Test suite containing multiple test cases
 */
export interface TestSuite {
  /** Name of the test suite */
  name: string;
  /** Array of test cases */
  tests: TestCase[];
}

/**
 * Metrics from test pass rate measurement
 */
export interface TestPassRateMetrics {
  /** Percentage of tests that passed (0-1) */
  passRate: number;
  /** Names of consistently failing tests */
  failedTests: string[];
  /** Estimated mutual information based on pass rate */
  estimatedMI: "high" | "medium" | "low";
  /** Raw pass counts per test */
  passCountsByTest: Map<string, number>;
}

/**
 * Result of comparing two contexts
 */
export interface ABTestResult {
  /** Metrics for context A */
  contextA: {
    testPassRate: number;
    uniqueOutputs: number;
    samples: string[];
  };
  /** Metrics for context B */
  contextB: {
    testPassRate: number;
    uniqueOutputs: number;
    samples: string[];
  };
  /** Which context performed better */
  winner: "A" | "B" | "tie";
  /** Confidence level (0-1) */
  confidence: number;
  /** Improvement percentage from A to B */
  improvement: number;
}

/**
 * Semantic similarity measurement result
 */
export interface SimilarityMetrics {
  /** Average similarity score (0-1) */
  avgSimilarity: number;
  /** Minimum similarity observed */
  minSimilarity: number;
  /** Maximum similarity observed */
  maxSimilarity: number;
  /** Variance in similarity scores */
  variance: number;
  /** Estimated MI based on similarity */
  estimatedMI: "high" | "medium" | "low";
}

/**
 * Comprehensive context audit dashboard
 */
export interface ContextEffectivenessDashboard {
  /** Output variance measurement */
  varianceTest: ContextEffectivenessResult;
  /** Test pass rate measurement */
  testPassRate: TestPassRateMetrics;
  /** Semantic similarity (if reference provided) */
  semanticSimilarity?: SimilarityMetrics;
  /** Overall effectiveness score (0-100) */
  overallScore: number;
  /** Actionable recommendations */
  recommendations: string[];
  /** Timestamp of measurement */
  measuredAt: Date;
}

/**
 * Configuration for context effectiveness measurement
 */
export interface MeasurementConfig {
  /** Number of trials per measurement (default: 10) */
  numTrials?: number;
  /** Temperature for generation (default: 0.7) */
  temperature?: number;
  /** Maximum tokens per generation */
  maxTokens?: number;
  /** Working directory for agent */
  cwd?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize code by removing whitespace variations for structural comparison.
 * This ensures we compare semantic structure, not formatting.
 */
export function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/;\s*/g, ";") // Normalize semicolons
    .trim()
    .toLowerCase();
}

/**
 * Extract text content from an SDK message
 */
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const content = message.message.content;
  if (typeof content === "string") return content;

  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

/**
 * Generate code using Claude Agent SDK
 */
async function generateCode(
  systemPrompt: string,
  userPrompt: string,
  config: MeasurementConfig = {}
): Promise<string> {
  const fullPrompt = systemPrompt
    ? `System context:\n${systemPrompt}\n\nUser request:\n${userPrompt}`
    : userPrompt;

  const response = query({
    prompt: fullPrompt,
    options: {
      cwd: config.cwd || process.cwd(),
      allowedTools: [],
    },
  });

  let code = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      code += extractTextContent(message);
    }
  }

  return code;
}

/**
 * Calculate simple cosine similarity between two strings
 * Uses character n-grams as features
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const n = 3; // Trigrams
  const getGrams = (text: string): Set<string> => {
    const grams = new Set<string>();
    const normalized = normalizeCode(text);
    for (let i = 0; i <= normalized.length - n; i++) {
      grams.add(normalized.slice(i, i + n));
    }
    return grams;
  };

  const grams1 = getGrams(text1);
  const grams2 = getGrams(text2);

  if (grams1.size === 0 || grams2.size === 0) return 0;

  let intersection = 0;
  for (const gram of grams1) {
    if (grams2.has(gram)) intersection++;
  }

  // Jaccard similarity
  const union = grams1.size + grams2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Perform statistical confidence calculation for A/B tests
 */
function calculateConfidence(
  passRateA: number,
  passRateB: number,
  numTrials: number
): number {
  // Simplified z-test for proportions
  const pooledP = (passRateA + passRateB) / 2;
  if (pooledP === 0 || pooledP === 1) return 0;

  const standardError = Math.sqrt(
    (2 * pooledP * (1 - pooledP)) / numTrials
  );

  if (standardError === 0) return 0;

  const zScore = Math.abs(passRateB - passRateA) / standardError;

  // Convert z-score to confidence (simplified)
  // z >= 1.96 corresponds to 95% confidence
  // z >= 2.58 corresponds to 99% confidence
  if (zScore >= 2.58) return 0.99;
  if (zScore >= 1.96) return 0.95;
  if (zScore >= 1.64) return 0.90;
  if (zScore >= 1.28) return 0.80;
  return Math.min(0.5 + zScore * 0.2, 0.79);
}

// ============================================================================
// METHOD 1: OUTPUT VARIANCE TESTING
// ============================================================================

/**
 * Measure context effectiveness through output variance.
 *
 * This is the simplest measurement: generate the same output multiple times
 * and count unique results.
 *
 * Interpretation:
 * - 1-2 unique outputs: High MI (context very effective)
 * - 3-5 unique outputs: Medium MI (context somewhat effective)
 * - 6+ unique outputs: Low MI (context needs improvement)
 *
 * @param context - The system prompt / context to test
 * @param prompt - The user prompt to generate with
 * @param config - Measurement configuration
 * @returns Context effectiveness result with metrics
 */
export async function measureContextEffectiveness(
  context: string,
  prompt: string,
  config: MeasurementConfig = {}
): Promise<ContextEffectivenessResult> {
  const numTrials = config.numTrials || 10;
  const outputs: string[] = [];

  for (let i = 0; i < numTrials; i++) {
    const code = await generateCode(context, prompt, config);
    outputs.push(code);
  }

  // Normalize and count unique outputs
  const normalizedOutputs = outputs.map(normalizeCode);
  const uniqueSet = new Set(normalizedOutputs);
  const uniqueOutputs = uniqueSet.size;

  // Calculate metrics
  const entropyEstimate = uniqueOutputs > 0 ? Math.log2(uniqueOutputs) : 0;
  const varianceRatio = uniqueOutputs / numTrials;

  // Determine effectiveness
  let effectiveness: "high" | "medium" | "low";
  if (uniqueOutputs <= 2) {
    effectiveness = "high";
  } else if (uniqueOutputs <= 5) {
    effectiveness = "medium";
  } else {
    effectiveness = "low";
  }

  return {
    uniqueOutputs,
    totalGenerations: numTrials,
    entropyEstimate,
    effectiveness,
    samples: outputs.slice(0, 3), // Keep first 3 for inspection
    varianceRatio,
  };
}

// ============================================================================
// METHOD 2: A/B TESTING CONTEXTS
// ============================================================================

/**
 * Compare two context versions through A/B testing.
 *
 * Generates outputs with both contexts and compares:
 * - Test pass rates (if test cases provided)
 * - Output variance
 * - Statistical confidence
 *
 * @param contextA - First context version
 * @param contextB - Second context version (usually improved)
 * @param prompt - The prompt to test with
 * @param testCases - Optional test cases for validation
 * @param config - Measurement configuration
 * @returns A/B test result with winner and confidence
 */
export async function abTestContexts(
  contextA: string,
  contextB: string,
  prompt: string,
  testCases: TestCase[] = [],
  config: MeasurementConfig = {}
): Promise<ABTestResult> {
  const numTrials = config.numTrials || 10;

  // Generate with context A
  const outputsA: string[] = [];
  let passedA = 0;
  for (let i = 0; i < numTrials; i++) {
    const code = await generateCode(contextA, prompt, config);
    outputsA.push(code);
    if (testCases.length === 0 || testCases.every((tc) => tc.validate(code))) {
      passedA++;
    }
  }

  // Generate with context B
  const outputsB: string[] = [];
  let passedB = 0;
  for (let i = 0; i < numTrials; i++) {
    const code = await generateCode(contextB, prompt, config);
    outputsB.push(code);
    if (testCases.length === 0 || testCases.every((tc) => tc.validate(code))) {
      passedB++;
    }
  }

  // Calculate metrics
  const passRateA = passedA / numTrials;
  const passRateB = passedB / numTrials;
  const uniqueA = new Set(outputsA.map(normalizeCode)).size;
  const uniqueB = new Set(outputsB.map(normalizeCode)).size;

  // Determine winner
  const passRateDiff = passRateB - passRateA;
  const confidence = calculateConfidence(passRateA, passRateB, numTrials);

  let winner: "A" | "B" | "tie";
  if (passRateDiff > 0.1 && confidence > 0.9) {
    winner = "B";
  } else if (passRateDiff < -0.1 && confidence > 0.9) {
    winner = "A";
  } else {
    winner = "tie";
  }

  const improvement = passRateA > 0
    ? ((passRateB - passRateA) / passRateA) * 100
    : passRateB > 0 ? 100 : 0;

  return {
    contextA: {
      testPassRate: passRateA,
      uniqueOutputs: uniqueA,
      samples: outputsA.slice(0, 2),
    },
    contextB: {
      testPassRate: passRateB,
      uniqueOutputs: uniqueB,
      samples: outputsB.slice(0, 2),
    },
    winner,
    confidence,
    improvement,
  };
}

// ============================================================================
// METHOD 3: TEST PASS RATE AS PROXY
// ============================================================================

/**
 * Use automated tests as a proxy for mutual information.
 * Higher pass rate indicates higher effective MI.
 *
 * Interpretation:
 * - >90% pass rate: High MI, context effective
 * - 70-90% pass rate: Medium MI, identify weak areas
 * - 50-70% pass rate: Low MI, major context gaps
 * - <50% pass rate: Very low MI, context may be counterproductive
 *
 * @param context - The context to test
 * @param prompt - The prompt to generate with
 * @param testSuite - Suite of test cases
 * @param config - Measurement configuration
 * @returns Test pass rate metrics with failing tests
 */
export async function measureViaTestPassRate(
  context: string,
  prompt: string,
  testSuite: TestSuite,
  config: MeasurementConfig = {}
): Promise<TestPassRateMetrics> {
  const numTrials = config.numTrials || 10;
  let totalPassed = 0;
  const passCountsByTest = new Map<string, number>();

  // Initialize pass counts
  for (const test of testSuite.tests) {
    passCountsByTest.set(test.name, 0);
  }

  // Run trials
  for (let i = 0; i < numTrials; i++) {
    const code = await generateCode(context, prompt, config);

    for (const test of testSuite.tests) {
      try {
        const passed = test.validate(code);
        if (passed) {
          totalPassed++;
          passCountsByTest.set(
            test.name,
            (passCountsByTest.get(test.name) || 0) + 1
          );
        }
      } catch {
        // Test threw an error, count as failure
      }
    }
  }

  const totalTests = testSuite.tests.length * numTrials;
  const passRate = totalTests > 0 ? totalPassed / totalTests : 0;

  // Find consistently failing tests (fail more than 50% of the time)
  const failedTests = [...passCountsByTest.entries()]
    .filter(([, count]) => count < numTrials * 0.5)
    .map(([name]) => name);

  // Estimate MI from pass rate
  let estimatedMI: "high" | "medium" | "low";
  if (passRate > 0.9) {
    estimatedMI = "high";
  } else if (passRate > 0.7) {
    estimatedMI = "medium";
  } else {
    estimatedMI = "low";
  }

  return {
    passRate,
    failedTests,
    estimatedMI,
    passCountsByTest,
  };
}

// ============================================================================
// METHOD 4: SEMANTIC SIMILARITY SCORING
// ============================================================================

/**
 * Measure how semantically similar outputs are to a reference implementation.
 *
 * Best for:
 * - Prose generation (documentation, explanations)
 * - Code that should match a specific style
 * - Translations or transformations
 *
 * @param context - The context to test
 * @param prompt - The prompt to generate with
 * @param referenceOutput - The expected/ideal output
 * @param config - Measurement configuration
 * @returns Similarity metrics with MI estimate
 */
export async function measureSemanticSimilarity(
  context: string,
  prompt: string,
  referenceOutput: string,
  config: MeasurementConfig = {}
): Promise<SimilarityMetrics> {
  const numTrials = config.numTrials || 10;
  const similarities: number[] = [];

  for (let i = 0; i < numTrials; i++) {
    const output = await generateCode(context, prompt, config);
    const similarity = calculateTextSimilarity(output, referenceOutput);
    similarities.push(similarity);
  }

  const avg =
    similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const variance =
    similarities.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) /
    similarities.length;

  // Estimate MI based on similarity and variance
  let estimatedMI: "high" | "medium" | "low";
  if (avg > 0.85 && variance < 0.01) {
    estimatedMI = "high";
  } else if (avg > 0.7 && variance < 0.05) {
    estimatedMI = "medium";
  } else {
    estimatedMI = "low";
  }

  return {
    avgSimilarity: avg,
    minSimilarity: Math.min(...similarities),
    maxSimilarity: Math.max(...similarities),
    variance,
    estimatedMI,
  };
}

// ============================================================================
// COMBINED MEASUREMENT DASHBOARD
// ============================================================================

/**
 * Perform comprehensive context effectiveness audit using all methods.
 *
 * Combines:
 * - Output variance testing
 * - Test pass rate measurement
 * - Semantic similarity (if reference provided)
 *
 * @param context - The context to audit
 * @param prompt - The prompt to test with
 * @param testSuite - Test suite for validation
 * @param referenceOutput - Optional reference for similarity measurement
 * @param config - Measurement configuration
 * @returns Dashboard with overall score and recommendations
 */
export async function fullContextAudit(
  context: string,
  prompt: string,
  testSuite: TestSuite,
  referenceOutput?: string,
  config: MeasurementConfig = {}
): Promise<ContextEffectivenessDashboard> {
  // Run all measurements
  const varianceTest = await measureContextEffectiveness(context, prompt, config);
  const testPassRate = await measureViaTestPassRate(
    context,
    prompt,
    testSuite,
    config
  );

  let semanticSimilarity: SimilarityMetrics | undefined;
  if (referenceOutput) {
    semanticSimilarity = await measureSemanticSimilarity(
      context,
      prompt,
      referenceOutput,
      config
    );
  }

  // Calculate overall score (0-100)
  const varianceScore =
    varianceTest.effectiveness === "high"
      ? 100
      : varianceTest.effectiveness === "medium"
        ? 70
        : 40;
  const testScore = testPassRate.passRate * 100;
  const similarityScore = semanticSimilarity
    ? semanticSimilarity.avgSimilarity * 100
    : testScore;

  const overallScore = Math.round(
    (varianceScore + testScore + similarityScore) / 3
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (varianceTest.uniqueOutputs > 5) {
    recommendations.push(
      "Add more specific examples to reduce output variance"
    );
  }

  if (varianceTest.uniqueOutputs > 2 && varianceTest.uniqueOutputs <= 5) {
    recommendations.push(
      "Add type signatures or test cases to further constrain outputs"
    );
  }

  if (testPassRate.failedTests.length > 0) {
    recommendations.push(
      `Address failing tests: ${testPassRate.failedTests.join(", ")}`
    );
  }

  if (semanticSimilarity && semanticSimilarity.avgSimilarity < 0.7) {
    recommendations.push(
      "Include reference output in context to improve similarity"
    );
  }

  if (semanticSimilarity && semanticSimilarity.variance > 0.05) {
    recommendations.push(
      "High variance in similarity scores. Add anti-patterns to constrain output style."
    );
  }

  if (testPassRate.passRate < 0.5) {
    recommendations.push(
      "Context may be counterproductive. Consider starting fresh with concrete examples."
    );
  }

  if (recommendations.length === 0 && overallScore > 80) {
    recommendations.push("Context is well-optimized. No immediate improvements needed.");
  }

  return {
    varianceTest,
    testPassRate,
    semanticSimilarity,
    overallScore,
    recommendations,
    measuredAt: new Date(),
  };
}

// ============================================================================
// CONTEXT IMPROVEMENT UTILITIES
// ============================================================================

/**
 * Suggestions for improving low-MI context based on measurement results
 */
export interface ContextImprovementSuggestion {
  /** What to improve */
  area: "examples" | "anti-patterns" | "types" | "tests";
  /** Specific suggestion */
  suggestion: string;
  /** Expected MI improvement */
  expectedImpact: "high" | "medium" | "low";
}

/**
 * Generate specific improvement suggestions based on audit results
 */
export function generateImprovementSuggestions(
  dashboard: ContextEffectivenessDashboard
): ContextImprovementSuggestion[] {
  const suggestions: ContextImprovementSuggestion[] = [];

  // High variance indicates missing examples
  if (dashboard.varianceTest.uniqueOutputs > 5) {
    suggestions.push({
      area: "examples",
      suggestion:
        "Add 2-3 working code examples showing the exact output format expected",
      expectedImpact: "high",
    });
  }

  // Medium variance can be improved with anti-patterns
  if (
    dashboard.varianceTest.uniqueOutputs > 2 &&
    dashboard.varianceTest.uniqueOutputs <= 5
  ) {
    suggestions.push({
      area: "anti-patterns",
      suggestion:
        'Add "DO NOT" examples showing incorrect patterns to avoid',
      expectedImpact: "medium",
    });
  }

  // Failing tests indicate missing constraints
  if (dashboard.testPassRate.failedTests.length > 0) {
    for (const failedTest of dashboard.testPassRate.failedTests) {
      if (failedTest.toLowerCase().includes("error")) {
        suggestions.push({
          area: "examples",
          suggestion: `Add error handling example to address "${failedTest}"`,
          expectedImpact: "high",
        });
      } else if (failedTest.toLowerCase().includes("type")) {
        suggestions.push({
          area: "types",
          suggestion: `Add type signature to address "${failedTest}"`,
          expectedImpact: "high",
        });
      } else {
        suggestions.push({
          area: "tests",
          suggestion: `Add example test case matching "${failedTest}" to context`,
          expectedImpact: "medium",
        });
      }
    }
  }

  // Low similarity indicates missing style guidance
  if (
    dashboard.semanticSimilarity &&
    dashboard.semanticSimilarity.avgSimilarity < 0.7
  ) {
    suggestions.push({
      area: "examples",
      suggestion: "Include the reference implementation as an example in context",
      expectedImpact: "high",
    });
  }

  return suggestions;
}

// ============================================================================
// QUALITY GATE VALIDATION
// ============================================================================

/**
 * Validate that a context change does not decrease effectiveness
 */
export async function validateContextChange(
  oldContext: string,
  newContext: string,
  prompt: string,
  testSuite: TestSuite,
  config: MeasurementConfig = {}
): Promise<{
  approved: boolean;
  reason: string;
  oldScore: number;
  newScore: number;
}> {
  const oldMetrics = await fullContextAudit(oldContext, prompt, testSuite, undefined, config);
  const newMetrics = await fullContextAudit(newContext, prompt, testSuite, undefined, config);

  // Gate 1: New context must not decrease effectiveness significantly
  if (newMetrics.overallScore < oldMetrics.overallScore - 5) {
    return {
      approved: false,
      reason: `Context change decreases effectiveness (${oldMetrics.overallScore} -> ${newMetrics.overallScore})`,
      oldScore: oldMetrics.overallScore,
      newScore: newMetrics.overallScore,
    };
  }

  // Gate 2: Minimum score threshold
  if (newMetrics.overallScore < 70) {
    return {
      approved: false,
      reason: `Context below minimum quality threshold (${newMetrics.overallScore} < 70)`,
      oldScore: oldMetrics.overallScore,
      newScore: newMetrics.overallScore,
    };
  }

  // Gate 3: Variance must not increase significantly
  if (
    newMetrics.varianceTest.uniqueOutputs >
    oldMetrics.varianceTest.uniqueOutputs + 2
  ) {
    return {
      approved: false,
      reason: `Context change increases output variance (${oldMetrics.varianceTest.uniqueOutputs} -> ${newMetrics.varianceTest.uniqueOutputs})`,
      oldScore: oldMetrics.overallScore,
      newScore: newMetrics.overallScore,
    };
  }

  return {
    approved: true,
    reason: "Context change approved. Effectiveness maintained or improved.",
    oldScore: oldMetrics.overallScore,
    newScore: newMetrics.overallScore,
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate context effectiveness measurement concepts
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Context Effectiveness Measurement ===\n");

  // Example 1: Compare vague vs specific context
  console.log("1. Context Comparison Example");

  const vagueContext = `
Write clean code.
Use TypeScript.
Handle errors properly.
`;

  const specificContext = `
Write TypeScript functions that:
- Return Result<T, Error> for operations that can fail
- Use strict null checks
- Follow this pattern:

function processUser(user: User): Result<ProcessedUser, ValidationError> {
  if (!user.email) {
    return { success: false, error: new ValidationError('Email required') };
  }
  return { success: true, data: { ...user, processed: true } };
}

DO NOT:
- throw new Error() in business logic
- return null for errors
- swallow errors silently
`;

  console.log("   Vague context:");
  console.log("   - 'Write clean code. Use TypeScript. Handle errors properly.'");
  console.log("\n   Specific context:");
  console.log("   - Includes Result<T, Error> pattern");
  console.log("   - Shows concrete example");
  console.log("   - Includes anti-patterns (DO NOT)");

  // Example 2: Test suite for validation
  console.log("\n2. Test Suite Definition");

  const testSuite: TestSuite = {
    name: "Error Handling Validation",
    tests: [
      {
        name: "Returns Result type",
        validate: (code) =>
          code.includes("Result<") ||
          code.includes("success:") ||
          code.includes("success ="),
      },
      {
        name: "No throw statements",
        validate: (code) => !code.includes("throw new"),
      },
      {
        name: "Handles null input",
        validate: (code) =>
          code.includes("null") ||
          code.includes("undefined") ||
          code.includes("!user") ||
          code.includes("!email"),
      },
    ],
  };

  console.log(`   Suite: ${testSuite.name}`);
  for (const test of testSuite.tests) {
    console.log(`   - ${test.name}`);
  }

  // Example 3: Simulated measurement results
  console.log("\n3. Expected Measurement Results");

  console.log("\n   Vague context (expected):");
  console.log("   - Unique outputs: 6-8 of 10");
  console.log("   - Entropy: 2.6-3.0 bits");
  console.log("   - Effectiveness: LOW");
  console.log("   - Test pass rate: 40-60%");

  console.log("\n   Specific context (expected):");
  console.log("   - Unique outputs: 1-2 of 10");
  console.log("   - Entropy: 0-1 bits");
  console.log("   - Effectiveness: HIGH");
  console.log("   - Test pass rate: 85-95%");

  // Example 4: Improvement suggestions
  console.log("\n4. Improvement Suggestions for Low-MI Context");

  const lowMIDashboard: ContextEffectivenessDashboard = {
    varianceTest: {
      uniqueOutputs: 7,
      totalGenerations: 10,
      entropyEstimate: 2.8,
      effectiveness: "low",
      samples: [],
      varianceRatio: 0.7,
    },
    testPassRate: {
      passRate: 0.5,
      failedTests: ["Returns correct error type", "Handles null input"],
      estimatedMI: "low",
      passCountsByTest: new Map(),
    },
    overallScore: 50,
    recommendations: [],
    measuredAt: new Date(),
  };

  const suggestions = generateImprovementSuggestions(lowMIDashboard);
  console.log("   Suggestions:");
  for (const suggestion of suggestions) {
    console.log(`   [${suggestion.area}] ${suggestion.suggestion}`);
    console.log(`      Expected impact: ${suggestion.expectedImpact}`);
  }

  // Example 5: Live measurement (requires API key)
  console.log("\n5. Live Measurement");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log("   Running live A/B test with 3 trials per context...");
      const result = await abTestContexts(
        vagueContext,
        specificContext,
        "Write a function to validate a payment method",
        testSuite.tests,
        { numTrials: 3 }
      );

      console.log(`\n   Results:`);
      console.log(`   Context A (vague):`);
      console.log(`   - Unique outputs: ${result.contextA.uniqueOutputs}`);
      console.log(`   - Test pass rate: ${(result.contextA.testPassRate * 100).toFixed(0)}%`);

      console.log(`   Context B (specific):`);
      console.log(`   - Unique outputs: ${result.contextB.uniqueOutputs}`);
      console.log(`   - Test pass rate: ${(result.contextB.testPassRate * 100).toFixed(0)}%`);

      console.log(`\n   Winner: ${result.winner}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   Improvement: ${result.improvement.toFixed(0)}%`);
    } catch (error) {
      console.log("   (API call failed - check API key)");
    }
  } else {
    console.log("   (API key not set - skipping live demonstration)");
  }

  // Summary
  console.log("\n6. Key Takeaways");
  console.log("   - High MI = Context strongly predicts output");
  console.log("   - Measure with multiple methods for complete picture");
  console.log("   - Output variance is the simplest, most universal metric");
  console.log("   - Test pass rate connects MI to practical correctness");
  console.log("   - Track metrics over time to catch regressions");
  console.log("   - Set quality gates to prevent context degradation");

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
