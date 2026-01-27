/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates automated flaky test detection and diagnosis.
 * Flaky tests destroy trust in CI/CD pipelines and waste AI agent tokens
 * on trying to "fix" code that isn't broken.
 *
 * Key concepts:
 * - Common causes of flaky tests
 * - Automated detection through repeated runs
 * - Root cause categorization
 * - Targeted fixes for each category
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const client = new Anthropic();

// ============================================================================
// FLAKY TEST TYPES AND INTERFACES
// ============================================================================

/**
 * Categories of flaky test root causes
 */
export type FlakyCause =
  | "timing"
  | "order_dependent"
  | "external_service"
  | "random_data"
  | "date_time"
  | "resource_leak"
  | "shared_state";

/**
 * Fix strategies for each flaky cause
 */
export const FLAKY_FIX_STRATEGIES: Record<
  FlakyCause,
  { description: string; example: string }
> = {
  timing: {
    description: "Use waitFor/await properly, increase timeouts, use retry patterns",
    example: `// Before: Checks immediately
expect(screen.getByText('John')).toBeInTheDocument()

// After: Wait for element
await waitFor(() => {
  expect(screen.getByText('John')).toBeInTheDocument()
})`,
  },
  order_dependent: {
    description: "Reset state in beforeEach, use isolated test databases",
    example: `// Add to test file
beforeEach(async () => {
  await db.clear()
  await db.seed()
})`,
  },
  external_service: {
    description: "Mock external services with MSW or similar",
    example: `const server = setupServer(
  rest.get('https://api.weather.com/*', (req, res, ctx) => {
    return res(ctx.json({ temp: 20 }))
  })
)`,
  },
  random_data: {
    description: "Seed random generators, use deterministic test data",
    example: `beforeEach(() => {
  faker.seed(12345) // Consistent random data
})`,
  },
  date_time: {
    description: "Mock system time with fake timers",
    example: `beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-06-15'))
})

afterEach(() => {
  vi.useRealTimers()
})`,
  },
  resource_leak: {
    description: "Clean up resources in afterEach, use async disposal",
    example: `afterEach(async () => {
  await connection.close()
  await server.stop()
})`,
  },
  shared_state: {
    description: "Isolate test state, avoid global singletons",
    example: `// Create fresh instance per test
let service: UserService

beforeEach(() => {
  service = new UserService() // Fresh instance
})`,
  },
};

/**
 * Result of a single test run
 */
export interface TestRunResult {
  passed: boolean;
  duration: number; // milliseconds
  error?: string;
  timestamp: Date;
}

/**
 * Analysis of test flakiness
 */
export interface FlakyAnalysis {
  testPath: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  passRate: number;
  isFlaky: boolean;
  flakinessScore: number; // 0-1, higher = more flaky
  avgDuration: number;
  durationVariance: number;
  errors: string[];
}

/**
 * Diagnosed flaky test with root cause
 */
export interface DiagnosedFlakyTest extends FlakyAnalysis {
  likelyCause: FlakyCause;
  confidence: number;
  suggestedFix: string;
  fixExample: string;
}

// ============================================================================
// FLAKY TEST DETECTION
// ============================================================================

/**
 * Simulate running a test (for demonstration)
 * In production, this would actually execute the test
 */
export async function simulateTestRun(
  testPath: string,
  flakiness = 0.2
): Promise<TestRunResult> {
  // Simulate variable duration
  const baseDuration = 100;
  const variance = Math.random() * 50;
  const duration = baseDuration + variance;

  // Simulate flaky behavior
  const passed = Math.random() > flakiness;

  return {
    passed,
    duration,
    error: passed ? undefined : "Assertion failed: expected value to match",
    timestamp: new Date(),
  };
}

/**
 * Run a test multiple times to detect flakiness
 */
export async function detectFlakiness(
  testPath: string,
  iterations = 50,
  runTest: (path: string) => Promise<TestRunResult> = (p) =>
    simulateTestRun(p, 0.2)
): Promise<FlakyAnalysis> {
  const results: TestRunResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await runTest(testPath);
    results.push(result);
  }

  const passCount = results.filter((r) => r.passed).length;
  const failCount = iterations - passCount;
  const passRate = passCount / iterations;

  // Calculate duration statistics
  const durations = results.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
  const variance =
    durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) /
    iterations;

  // Collect unique errors
  const errors = [...new Set(results.filter((r) => r.error).map((r) => r.error!))];

  // Calculate flakiness score (0 = consistent, 1 = maximally flaky)
  // Peak flakiness at 50% pass rate
  const flakinessScore = 1 - Math.abs(passRate - 0.5) * 2;

  return {
    testPath,
    totalRuns: iterations,
    passCount,
    failCount,
    passRate,
    isFlaky: passRate > 0 && passRate < 1,
    flakinessScore: passRate > 0 && passRate < 1 ? flakinessScore : 0,
    avgDuration,
    durationVariance: variance,
    errors,
  };
}

/**
 * Analyze code to determine likely flaky cause
 */
export function analyzeTestCode(testCode: string): {
  cause: FlakyCause;
  confidence: number;
  indicators: string[];
}[] {
  const results: { cause: FlakyCause; confidence: number; indicators: string[] }[] =
    [];

  // Timing indicators
  const timingIndicators: string[] = [];
  if (testCode.includes("setTimeout") || testCode.includes("setInterval")) {
    timingIndicators.push("Uses setTimeout/setInterval");
  }
  if (testCode.includes("sleep") || testCode.includes("delay")) {
    timingIndicators.push("Uses sleep/delay");
  }
  if (!testCode.includes("waitFor") && testCode.includes("expect")) {
    timingIndicators.push("Missing waitFor for assertions");
  }
  if (timingIndicators.length > 0) {
    results.push({
      cause: "timing",
      confidence: Math.min(timingIndicators.length * 0.3, 0.9),
      indicators: timingIndicators,
    });
  }

  // External service indicators
  const externalIndicators: string[] = [];
  if (testCode.includes("fetch(") || testCode.includes("axios")) {
    externalIndicators.push("Makes HTTP requests");
  }
  if (testCode.match(/https?:\/\//)) {
    externalIndicators.push("Contains external URLs");
  }
  if (!testCode.includes("mock") && !testCode.includes("setupServer")) {
    externalIndicators.push("No mocking detected");
  }
  if (externalIndicators.length > 0) {
    results.push({
      cause: "external_service",
      confidence: Math.min(externalIndicators.length * 0.35, 0.9),
      indicators: externalIndicators,
    });
  }

  // Random data indicators
  const randomIndicators: string[] = [];
  if (testCode.includes("Math.random()")) {
    randomIndicators.push("Uses Math.random()");
  }
  if (testCode.includes("faker") && !testCode.includes("seed")) {
    randomIndicators.push("Uses faker without seed");
  }
  if (testCode.includes("uuid") || testCode.includes("nanoid")) {
    randomIndicators.push("Uses random ID generator");
  }
  if (randomIndicators.length > 0) {
    results.push({
      cause: "random_data",
      confidence: Math.min(randomIndicators.length * 0.4, 0.9),
      indicators: randomIndicators,
    });
  }

  // Date/time indicators
  const dateIndicators: string[] = [];
  if (testCode.includes("new Date()") || testCode.includes("Date.now()")) {
    dateIndicators.push("Uses current date/time");
  }
  if (!testCode.includes("useFakeTimers") && !testCode.includes("mockDate")) {
    dateIndicators.push("No time mocking detected");
  }
  if (dateIndicators.length > 0) {
    results.push({
      cause: "date_time",
      confidence: Math.min(dateIndicators.length * 0.4, 0.85),
      indicators: dateIndicators,
    });
  }

  // Order dependency indicators
  const orderIndicators: string[] = [];
  if (!testCode.includes("beforeEach")) {
    orderIndicators.push("No beforeEach setup");
  }
  if (testCode.includes("global") || testCode.includes("singleton")) {
    orderIndicators.push("Uses global/singleton state");
  }
  if (orderIndicators.length > 0) {
    results.push({
      cause: "order_dependent",
      confidence: Math.min(orderIndicators.length * 0.35, 0.8),
      indicators: orderIndicators,
    });
  }

  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Diagnose a flaky test with root cause analysis
 */
export function diagnoseFlakyTest(
  analysis: FlakyAnalysis,
  testCode: string
): DiagnosedFlakyTest {
  const codeAnalysis = analyzeTestCode(testCode);
  const topCause = codeAnalysis[0] || {
    cause: "timing" as FlakyCause,
    confidence: 0.3,
    indicators: ["Unable to determine cause from code"],
  };

  const fixStrategy = FLAKY_FIX_STRATEGIES[topCause.cause];

  return {
    ...analysis,
    likelyCause: topCause.cause,
    confidence: topCause.confidence,
    suggestedFix: fixStrategy.description,
    fixExample: fixStrategy.example,
  };
}

// ============================================================================
// BATCH FLAKY TEST DETECTION
// ============================================================================

/**
 * Configuration for batch flaky detection
 */
export interface BatchDetectionConfig {
  iterations: number;
  parallelism: number;
  flakinessThreshold: number; // Minimum flakiness score to report
}

/**
 * Result of batch flaky test detection
 */
export interface BatchDetectionResult {
  totalTests: number;
  flakyTests: DiagnosedFlakyTest[];
  stableTests: string[];
  detectionDuration: number;
  summary: {
    byCause: Record<FlakyCause, number>;
    averagePassRate: number;
    worstOffenders: string[];
  };
}

/**
 * Detect flaky tests across multiple test files
 */
export async function batchDetectFlaky(
  testPaths: string[],
  testCodes: Map<string, string>,
  config: Partial<BatchDetectionConfig> = {}
): Promise<BatchDetectionResult> {
  const { iterations = 20, flakinessThreshold = 0.1 } = config;

  const startTime = Date.now();
  const flakyTests: DiagnosedFlakyTest[] = [];
  const stableTests: string[] = [];

  for (const testPath of testPaths) {
    const analysis = await detectFlakiness(testPath, iterations);

    if (analysis.isFlaky && analysis.flakinessScore >= flakinessThreshold) {
      const testCode = testCodes.get(testPath) || "";
      const diagnosed = diagnoseFlakyTest(analysis, testCode);
      flakyTests.push(diagnosed);
    } else if (!analysis.isFlaky) {
      stableTests.push(testPath);
    }
  }

  // Generate summary
  const byCause: Record<FlakyCause, number> = {
    timing: 0,
    order_dependent: 0,
    external_service: 0,
    random_data: 0,
    date_time: 0,
    resource_leak: 0,
    shared_state: 0,
  };

  for (const test of flakyTests) {
    byCause[test.likelyCause]++;
  }

  const averagePassRate =
    flakyTests.length > 0
      ? flakyTests.reduce((sum, t) => sum + t.passRate, 0) / flakyTests.length
      : 1;

  const worstOffenders = [...flakyTests]
    .sort((a, b) => a.passRate - b.passRate)
    .slice(0, 3)
    .map((t) => t.testPath);

  return {
    totalTests: testPaths.length,
    flakyTests,
    stableTests,
    detectionDuration: Date.now() - startTime,
    summary: {
      byCause,
      averagePassRate,
      worstOffenders,
    },
  };
}

// ============================================================================
// SDK-POWERED FLAKY TEST DIAGNOSIS
// ============================================================================

/**
 * Use Claude to diagnose a flaky test
 */
export async function diagnoseWithClaude(
  testPath: string,
  testCode: string,
  passRate: number,
  errors: string[]
): Promise<{
  cause: FlakyCause;
  confidence: number;
  explanation: string;
  suggestedFix: string;
}> {
  const diagnosisPrompt = `Diagnose this flaky test:

Test: ${testPath}
Pass rate: ${(passRate * 100).toFixed(1)}%

Test code:
\`\`\`typescript
${testCode}
\`\`\`

Errors observed:
${errors.map((e) => `- ${e}`).join("\n")}

Common flaky test causes:
1. timing - Race conditions, async timing issues
2. order_dependent - Tests depend on previous test's state
3. external_service - Real network calls to external APIs
4. random_data - Random values change each run
5. date_time - Tests depend on current date/time
6. resource_leak - Resources not cleaned up between tests
7. shared_state - Global or singleton state pollution

Respond in JSON format:
{
  "cause": "timing|order_dependent|external_service|random_data|date_time|resource_leak|shared_state",
  "confidence": 0.0-1.0,
  "explanation": "Why this is the likely cause",
  "suggestedFix": "Code or approach to fix"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: diagnosisPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flaky test diagnosis");
  }

  const diagnosis = JSON.parse(jsonMatch[0]);
  return {
    cause: diagnosis.cause as FlakyCause,
    confidence: diagnosis.confidence,
    explanation: diagnosis.explanation,
    suggestedFix: diagnosis.suggestedFix,
  };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate a flaky test report
 */
export function generateFlakyReport(result: BatchDetectionResult): string {
  const lines: string[] = [
    "# Flaky Test Detection Report",
    "",
    `**Date**: ${new Date().toISOString().split("T")[0]}`,
    `**Tests Analyzed**: ${result.totalTests}`,
    `**Flaky Tests Found**: ${result.flakyTests.length}`,
    `**Detection Duration**: ${result.detectionDuration}ms`,
    "",
    "## Summary",
    "",
    `**Average Pass Rate** (flaky tests): ${(result.summary.averagePassRate * 100).toFixed(1)}%`,
    "",
    "### By Root Cause",
    "",
  ];

  for (const [cause, count] of Object.entries(result.summary.byCause)) {
    if (count > 0) {
      lines.push(`- **${cause}**: ${count} tests`);
    }
  }

  if (result.summary.worstOffenders.length > 0) {
    lines.push("");
    lines.push("### Worst Offenders");
    lines.push("");
    for (const path of result.summary.worstOffenders) {
      lines.push(`- ${path}`);
    }
  }

  lines.push("");
  lines.push("## Detailed Findings");
  lines.push("");

  for (const test of result.flakyTests) {
    lines.push(`### ${test.testPath}`);
    lines.push("");
    lines.push(`- **Pass Rate**: ${(test.passRate * 100).toFixed(1)}%`);
    lines.push(`- **Likely Cause**: ${test.likelyCause}`);
    lines.push(`- **Confidence**: ${(test.confidence * 100).toFixed(0)}%`);
    lines.push("");
    lines.push("**Suggested Fix**:");
    lines.push("```typescript");
    lines.push(test.fixExample);
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate flaky test detection
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 8: Flaky Test Detection ===\n");

  // Example test code with timing issues
  const flakyTestCode = `
test('updates UI after fetch', async () => {
  render(<UserProfile userId="1" />)
  // Missing waitFor - timing issue!
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})`;

  // Example test code with random data
  const randomTestCode = `
test('generates unique IDs', () => {
  const id1 = generateId() // Uses Math.random()
  const id2 = generateId()
  expect(id1).not.toBe(id2)
})`;

  console.log("1. Analyzing Test Code for Flakiness Indicators");
  console.log("\n   Timing Test Analysis:");
  const timingAnalysis = analyzeTestCode(flakyTestCode);
  for (const a of timingAnalysis) {
    console.log(`   - ${a.cause}: ${(a.confidence * 100).toFixed(0)}% confidence`);
    console.log(`     Indicators: ${a.indicators.join(", ")}`);
  }

  console.log("\n   Random Data Test Analysis:");
  const randomAnalysis = analyzeTestCode(randomTestCode);
  for (const a of randomAnalysis) {
    console.log(`   - ${a.cause}: ${(a.confidence * 100).toFixed(0)}% confidence`);
    console.log(`     Indicators: ${a.indicators.join(", ")}`);
  }

  // Simulate flaky detection
  console.log("\n2. Running Flaky Detection (20 iterations)");
  const analysis = await detectFlakiness("user-profile.test.ts", 20);
  console.log(`   Test: ${analysis.testPath}`);
  console.log(`   Pass Rate: ${(analysis.passRate * 100).toFixed(1)}%`);
  console.log(`   Is Flaky: ${analysis.isFlaky}`);
  console.log(`   Flakiness Score: ${(analysis.flakinessScore * 100).toFixed(1)}%`);

  // Diagnose
  console.log("\n3. Diagnosing Flaky Test");
  const diagnosed = diagnoseFlakyTest(analysis, flakyTestCode);
  console.log(`   Likely Cause: ${diagnosed.likelyCause}`);
  console.log(`   Confidence: ${(diagnosed.confidence * 100).toFixed(0)}%`);
  console.log(`   Fix: ${diagnosed.suggestedFix}`);

  // Fix strategies
  console.log("\n4. Fix Strategies by Cause");
  for (const [cause, strategy] of Object.entries(FLAKY_FIX_STRATEGIES).slice(
    0,
    3
  )) {
    console.log(`   ${cause}:`);
    console.log(`   ${strategy.description.substring(0, 60)}...`);
  }

  // Batch detection
  console.log("\n5. Batch Detection Simulation");
  const testPaths = [
    "auth.test.ts",
    "user.test.ts",
    "api.test.ts",
    "ui.test.ts",
  ];
  const testCodes = new Map<string, string>([
    ["auth.test.ts", flakyTestCode],
    ["user.test.ts", randomTestCode],
    ["api.test.ts", "test('stable', () => { expect(1).toBe(1) })"],
    ["ui.test.ts", flakyTestCode],
  ]);

  const batchResult = await batchDetectFlaky(testPaths, testCodes, {
    iterations: 10,
  });
  console.log(`   Total Tests: ${batchResult.totalTests}`);
  console.log(`   Flaky: ${batchResult.flakyTests.length}`);
  console.log(`   Stable: ${batchResult.stableTests.length}`);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
