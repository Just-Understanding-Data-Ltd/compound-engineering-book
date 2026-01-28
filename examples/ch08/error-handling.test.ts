/**
 * Chapter 8: Error Handling & Debugging - Tests
 *
 * Comprehensive test suite for error diagnostic, ERRORS.md management,
 * flaky test detection, and clean slate recovery patterns.
 */

import { describe, test, expect, beforeEach } from "bun:test";

// Import from error-diagnostic.ts
import {
  ERROR_DISTRIBUTION,
  ERROR_SYMPTOMS,
  CONTEXT_LAYERS,
  calculateExpectedDebugTime,
  diagnoseErrorCategory,
  getFixApproach,
  getPreventionStrategy,
  formatDiagnosticReport,
  analyzeDebuggingEfficiency,
  type ErrorCategory,
  type DiagnosedError,
} from "./error-diagnostic";

// Import from errors-md-manager.ts
import {
  ErrorsManager,
  COMMON_ERROR_PATTERNS,
  generateErrorContext,
  type ErrorEntry,
  type ErrorSeverity,
  type PreventionType,
} from "./errors-md-manager";

// Import from flaky-test-detector.ts
import {
  FLAKY_FIX_STRATEGIES,
  simulateTestRun,
  detectFlakiness,
  analyzeTestCode,
  diagnoseFlakyTest,
  batchDetectFlaky,
  generateFlakyReport,
  type FlakyCause,
  type FlakyAnalysis,
} from "./flaky-test-detector";

// Import from clean-slate-recovery.ts
import {
  CONTEXT_ROT_SYMPTOMS,
  CLEAN_SLATE_THRESHOLDS,
  detectContextRot,
  SessionTracker,
  extractConstraints,
  analyzeCostBenefit,
  documentSession,
  type FailedAttempt,
  type SessionState,
} from "./clean-slate-recovery";

// Import from circuit-breaker.ts
import {
  CircuitBreaker,
  DEFAULT_CONFIG,
  DEFAULT_TIMEOUT_CONFIG,
  getCircuitBreaker,
  getAllBreakerMetrics,
  resetAllBreakers,
  withTimeout,
  calculateOverallReliability,
  requiredPerActionReliability,
  analyzeReliability,
  type CircuitState,
  type CircuitBreakerConfig,
  type CircuitEvent,
  type CircuitMetrics,
} from "./circuit-breaker";

// Import from timeout-protection.ts
import {
  MODEL_COSTS,
  MODEL_IDS,
  DEFAULT_INPUT_LIMITS,
  DEFAULT_BUDGET,
  DEFAULT_TIMEOUT,
  TOKEN_LIMITS_BY_TASK,
  logUsage,
  getUsage,
  resetUsage,
  checkBudget,
  estimateTokens,
  truncateFile,
  matchesExcludePattern,
  processFilesWithLimits,
  selectModelForTask,
  estimateCost,
  createTimeout,
  withTimeout as withTimeoutProtection,
  calculateBackoffDelay,
  withRetry,
  isRetryableError,
  calculateOperationCost,
  calculateMonthlyCost,
  generateUsageReport,
  type ModelTier,
  type BudgetStatus,
  type UsageMetrics,
  type FileContent,
  type RetryResult,
} from "./timeout-protection";

// ============================================================================
// ERROR DIAGNOSTIC TESTS
// ============================================================================

describe("Error Diagnostic Framework", () => {
  describe("ERROR_DISTRIBUTION", () => {
    test("should sum to 1.0 (100%)", () => {
      const total = Object.values(ERROR_DISTRIBUTION).reduce(
        (sum, val) => sum + val,
        0
      );
      expect(total).toBe(1.0);
    });

    test("context should be highest probability", () => {
      expect(ERROR_DISTRIBUTION.context).toBe(0.6);
      expect(ERROR_DISTRIBUTION.context).toBeGreaterThan(
        ERROR_DISTRIBUTION.model
      );
      expect(ERROR_DISTRIBUTION.context).toBeGreaterThan(
        ERROR_DISTRIBUTION.rules
      );
    });

    test("quality_gate should be lowest probability", () => {
      expect(ERROR_DISTRIBUTION.quality_gate).toBe(0.05);
      for (const [category, prob] of Object.entries(ERROR_DISTRIBUTION)) {
        if (category !== "quality_gate") {
          expect(prob).toBeGreaterThan(ERROR_DISTRIBUTION.quality_gate);
        }
      }
    });
  });

  describe("ERROR_SYMPTOMS", () => {
    test("should have symptoms for all categories", () => {
      const categories: ErrorCategory[] = [
        "context",
        "model",
        "rules",
        "testing",
        "quality_gate",
      ];
      for (const category of categories) {
        expect(ERROR_SYMPTOMS[category]).toBeDefined();
        expect(ERROR_SYMPTOMS[category].length).toBeGreaterThan(0);
      }
    });

    test("context symptoms should mention patterns and files", () => {
      const contextSymptoms = ERROR_SYMPTOMS.context.join(" ").toLowerCase();
      expect(contextSymptoms).toContain("pattern");
      expect(contextSymptoms).toContain("file");
    });
  });

  describe("CONTEXT_LAYERS", () => {
    test("should have 4 layers", () => {
      expect(CONTEXT_LAYERS).toHaveLength(4);
    });

    test("layers should be ordered by probability", () => {
      expect(CONTEXT_LAYERS[0]!.probability).toBe(0.6); // Context
      expect(CONTEXT_LAYERS[1]!.probability).toBe(0.25); // Prompting
      expect(CONTEXT_LAYERS[2]!.probability).toBe(0.1); // Model Power
      expect(CONTEXT_LAYERS[3]!.probability).toBe(0.05); // Manual Override
    });

    test("layer probabilities should sum to 1.0", () => {
      const total = CONTEXT_LAYERS.reduce(
        (sum, layer) => sum + layer.probability,
        0
      );
      expect(total).toBe(1.0);
    });

    test("each layer should have check items", () => {
      for (const layer of CONTEXT_LAYERS) {
        expect(layer.checkItems.length).toBeGreaterThan(0);
      }
    });
  });

  describe("calculateExpectedDebugTime", () => {
    test("should calculate weighted average correctly", () => {
      // 0.6 * 5 + 0.25 * 10 + 0.1 * 20 + 0.05 * 30 = 3 + 2.5 + 2 + 1.5 = 9
      const expected = calculateExpectedDebugTime();
      expect(expected).toBe(9);
    });
  });

  describe("diagnoseErrorCategory", () => {
    test("should identify context problems", () => {
      // Use symptoms that match ERROR_SYMPTOMS more directly
      const symptoms = ["Code doesn't match existing project patterns", "non-existent files"];
      const results = diagnoseErrorCategory(symptoms);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.category).toBe("context");
      expect(results[0]!.confidence).toBeGreaterThan(0);
    });

    test("should identify rules problems", () => {
      const symptoms = ["Convention violations", "Missing edge case"];
      const results = diagnoseErrorCategory(symptoms);

      expect(results.length).toBeGreaterThan(0);
      const rulesResult = results.find((r) => r.category === "rules");
      expect(rulesResult).toBeDefined();
    });

    test("should return empty for unmatched symptoms", () => {
      const symptoms = ["completely unrelated symptom xyz123"];
      const results = diagnoseErrorCategory(symptoms);
      expect(results.length).toBe(0);
    });

    test("should sort by confidence descending", () => {
      const symptoms = [
        "pattern",
        "convention",
        "tests pass but production fails",
      ];
      const results = diagnoseErrorCategory(symptoms);

      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1]!.confidence).toBeGreaterThanOrEqual(
            results[i]!.confidence
          );
        }
      }
    });
  });

  describe("getFixApproach", () => {
    test("should return approach for each category", () => {
      const categories: ErrorCategory[] = [
        "context",
        "model",
        "rules",
        "testing",
        "quality_gate",
      ];
      for (const category of categories) {
        const approach = getFixApproach(category);
        expect(approach).toBeDefined();
        expect(approach.length).toBeGreaterThan(10);
      }
    });

    test("context approach should mention files or examples", () => {
      const approach = getFixApproach("context");
      expect(
        approach.toLowerCase().includes("file") ||
          approach.toLowerCase().includes("example")
      ).toBe(true);
    });
  });

  describe("getPreventionStrategy", () => {
    test("should return strategy with location and example", () => {
      const categories: ErrorCategory[] = [
        "context",
        "model",
        "rules",
        "testing",
        "quality_gate",
      ];
      for (const category of categories) {
        const prevention = getPreventionStrategy(category);
        expect(prevention.strategy).toBeDefined();
        expect(prevention.location).toBeDefined();
        expect(prevention.example).toBeDefined();
      }
    });

    test("rules prevention should mention CLAUDE.md", () => {
      const prevention = getPreventionStrategy("rules");
      expect(prevention.location.toLowerCase()).toContain("claude.md");
    });
  });

  describe("formatDiagnosticReport", () => {
    test("should format a readable report", () => {
      const diagnosis: DiagnosedError = {
        description: "Password stored in plain text",
        category: "rules",
        confidence: 0.85,
        matchedSymptoms: ["security requirements ignored"],
        fixApproach: "Add CLAUDE.md rule about password hashing",
        preventionStrategy: "Document bcrypt usage in security section",
      };

      const report = formatDiagnosticReport(diagnosis);

      expect(report).toContain("Password stored in plain text");
      expect(report).toContain("RULES");
      expect(report).toContain("85%");
      expect(report).toContain("security requirements ignored");
    });
  });

  describe("analyzeDebuggingEfficiency", () => {
    test("should identify efficient debugging", () => {
      const result = analyzeDebuggingEfficiency(1, 5); // Layer 1, 5 min
      expect(result.efficiency).toContain("Good");
    });

    test("should identify slow debugging", () => {
      const result = analyzeDebuggingEfficiency(3, 30); // Layer 3, 30 min
      expect(result.efficiency).toContain("Slow");
    });

    test("should recommend layer 1 when skipping", () => {
      const result = analyzeDebuggingEfficiency(3, 15);
      expect(result.recommendation).toContain("Layer 1");
    });
  });
});

// ============================================================================
// ERRORS.MD MANAGER TESTS
// ============================================================================

describe("ERRORS.md Manager", () => {
  let manager: ErrorsManager;

  beforeEach(() => {
    manager = new ErrorsManager();
  });

  describe("ErrorsManager.addError", () => {
    test("should add new error with generated id", () => {
      const entry = manager.addError({
        title: "Test Error",
        severity: "medium",
        lastOccurrence: new Date(),
        symptoms: ["symptom1"],
        badPattern: "bad code",
        correctFix: "good code",
        preventionStrategies: [],
        tags: ["test"],
      });

      expect(entry.id).toMatch(/^error-\d+-/);
      expect(entry.frequency).toBe(1);
      expect(entry.title).toBe("Test Error");
    });

    test("should increment frequency for duplicate errors", () => {
      const first = manager.addError({
        title: "Duplicate Error",
        severity: "high",
        lastOccurrence: new Date(),
        symptoms: [],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [],
        tags: [],
      });

      const second = manager.addError({
        title: "Duplicate Error", // Same title
        severity: "high",
        lastOccurrence: new Date(),
        symptoms: ["new symptom"],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [],
        tags: [],
      });

      expect(first.id).toBe(second.id); // Same entry
      expect(second.frequency).toBe(2);
      expect(second.symptoms).toContain("new symptom");
    });
  });

  describe("ErrorsManager.getTopErrors", () => {
    test("should return errors sorted by frequency", () => {
      // Add multiple errors with different frequencies
      for (let i = 0; i < 3; i++) {
        manager.addError({
          title: "High Freq Error",
          severity: "high",
          lastOccurrence: new Date(),
          symptoms: [],
          badPattern: "bad1",
          correctFix: "good1",
          preventionStrategies: [],
          tags: [],
        });
      }

      manager.addError({
        title: "Low Freq Error",
        severity: "low",
        lastOccurrence: new Date(),
        symptoms: [],
        badPattern: "bad2",
        correctFix: "good2",
        preventionStrategies: [],
        tags: [],
      });

      const top = manager.getTopErrors(2);
      expect(top[0]!.title).toBe("High Freq Error");
      expect(top[0]!.frequency).toBe(3);
    });
  });

  describe("ErrorsManager.getErrorsNeedingPrevention", () => {
    test("should return high-frequency errors without prevention", () => {
      // Add error with high frequency
      for (let i = 0; i < 5; i++) {
        manager.addError({
          title: "Needs Prevention",
          severity: "high",
          lastOccurrence: new Date(),
          symptoms: [],
          badPattern: "bad",
          correctFix: "good",
          preventionStrategies: [
            {
              type: "eslint_rule",
              description: "Add rule",
              implemented: false,
            },
          ],
          tags: [],
        });
      }

      const needsPrevention = manager.getErrorsNeedingPrevention(5);
      expect(needsPrevention.length).toBe(1);
      expect(needsPrevention[0]!.title).toBe("Needs Prevention");
    });

    test("should exclude errors with implemented prevention", () => {
      // Add error and mark prevention as implemented
      const entry = manager.addError({
        title: "Has Prevention",
        severity: "high",
        lastOccurrence: new Date(),
        symptoms: [],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [
          { type: "eslint_rule", description: "Rule", implemented: true },
        ],
        tags: [],
      });

      // Add more occurrences
      for (let i = 0; i < 5; i++) {
        manager.addError({
          title: "Has Prevention",
          severity: "high",
          lastOccurrence: new Date(),
          symptoms: [],
          badPattern: "bad",
          correctFix: "good",
          preventionStrategies: [],
          tags: [],
        });
      }

      const needsPrevention = manager.getErrorsNeedingPrevention(5);
      expect(needsPrevention.length).toBe(0);
    });
  });

  describe("ErrorsManager.getRelevantErrors", () => {
    test("should filter by tags", () => {
      manager.addError({
        title: "Async Error",
        severity: "high",
        lastOccurrence: new Date(),
        symptoms: [],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [],
        tags: ["async", "promise"],
      });

      manager.addError({
        title: "Database Error",
        severity: "medium",
        lastOccurrence: new Date(),
        symptoms: [],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [],
        tags: ["database", "sql"],
      });

      const asyncErrors = manager.getRelevantErrors(["async"]);
      expect(asyncErrors.length).toBe(1);
      expect(asyncErrors[0]!.title).toBe("Async Error");
    });
  });

  describe("ErrorsManager.toMarkdown", () => {
    test("should generate valid markdown", () => {
      manager.addError({
        title: "Test Error",
        severity: "high",
        lastOccurrence: new Date("2025-01-15"),
        symptoms: ["symptom1", "symptom2"],
        badPattern: "const x = bad()",
        correctFix: "const x = good()",
        preventionStrategies: [
          { type: "eslint_rule", description: "Add rule", implemented: false },
        ],
        tags: [],
      });

      const markdown = manager.toMarkdown();

      expect(markdown).toContain("# Common Errors & Solutions");
      expect(markdown).toContain("## Error: Test Error");
      expect(markdown).toContain("**Frequency**: 1 occurrences");
      expect(markdown).toContain("**Severity**: High");
      expect(markdown).toContain("symptom1");
      expect(markdown).toContain("```typescript");
      expect(markdown).toContain("const x = bad()");
    });
  });

  describe("COMMON_ERROR_PATTERNS", () => {
    test("should have at least 3 patterns", () => {
      expect(COMMON_ERROR_PATTERNS.length).toBeGreaterThanOrEqual(3);
    });

    test("each pattern should have required fields", () => {
      for (const pattern of COMMON_ERROR_PATTERNS) {
        expect(pattern.title).toBeDefined();
        expect(pattern.severity).toBeDefined();
        expect(pattern.symptoms.length).toBeGreaterThan(0);
        expect(pattern.badPattern).toBeDefined();
        expect(pattern.correctFix).toBeDefined();
        expect(pattern.preventionStrategies.length).toBeGreaterThan(0);
      }
    });
  });

  describe("generateErrorContext", () => {
    test("should generate context for matching tags", async () => {
      manager.addError({
        title: "Async Error",
        severity: "high",
        lastOccurrence: new Date(),
        symptoms: ["UnhandledPromiseRejection"],
        badPattern: "bad",
        correctFix: "good",
        preventionStrategies: [],
        tags: ["async", "database"],
      });

      const context = await generateErrorContext(
        "Implement async database query",
        manager
      );

      expect(context).toContain("Relevant errors to avoid");
      expect(context).toContain("Async Error");
    });

    test("should return message when no relevant errors", async () => {
      const context = await generateErrorContext(
        "Implement completely unrelated feature xyz",
        manager
      );

      expect(context).toContain("No relevant documented errors");
    });
  });
});

// ============================================================================
// FLAKY TEST DETECTOR TESTS
// ============================================================================

describe("Flaky Test Detector", () => {
  describe("FLAKY_FIX_STRATEGIES", () => {
    test("should have strategies for all causes", () => {
      const causes: FlakyCause[] = [
        "timing",
        "order_dependent",
        "external_service",
        "random_data",
        "date_time",
        "resource_leak",
        "shared_state",
      ];

      for (const cause of causes) {
        expect(FLAKY_FIX_STRATEGIES[cause]).toBeDefined();
        expect(FLAKY_FIX_STRATEGIES[cause].description).toBeDefined();
        expect(FLAKY_FIX_STRATEGIES[cause].example).toBeDefined();
      }
    });
  });

  describe("simulateTestRun", () => {
    test("should return result with pass/fail status", async () => {
      const result = await simulateTestRun("test.ts", 0.5);

      expect(typeof result.passed).toBe("boolean");
      expect(result.duration).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test("should fail more often with higher flakiness", async () => {
      // Run many times with high flakiness
      const results = await Promise.all(
        Array(50)
          .fill(null)
          .map(() => simulateTestRun("test.ts", 0.9))
      );

      const failCount = results.filter((r) => !r.passed).length;
      expect(failCount).toBeGreaterThan(30); // Most should fail
    });
  });

  describe("detectFlakiness", () => {
    test("should detect flaky test (mixed results)", async () => {
      const analysis = await detectFlakiness("flaky.test.ts", 20);

      expect(analysis.testPath).toBe("flaky.test.ts");
      expect(analysis.totalRuns).toBe(20);
      expect(analysis.passCount + analysis.failCount).toBe(20);
      expect(analysis.passRate).toBeGreaterThanOrEqual(0);
      expect(analysis.passRate).toBeLessThanOrEqual(1);
    });

    test("should identify consistent test", async () => {
      // Use a mock that always passes
      const mockRun = async () => ({
        passed: true,
        duration: 100,
        timestamp: new Date(),
      });

      const analysis = await detectFlakiness("stable.test.ts", 10, mockRun);

      expect(analysis.isFlaky).toBe(false);
      expect(analysis.passRate).toBe(1);
      expect(analysis.flakinessScore).toBe(0);
    });

    test("should calculate flakiness score correctly", async () => {
      // Mock that fails exactly 50% (maximum flakiness)
      let counter = 0;
      const mockRun = async () => ({
        passed: counter++ % 2 === 0,
        duration: 100,
        timestamp: new Date(),
      });

      const analysis = await detectFlakiness("half-flaky.test.ts", 10, mockRun);

      expect(analysis.isFlaky).toBe(true);
      expect(analysis.flakinessScore).toBeGreaterThan(0.8); // Near max
    });
  });

  describe("analyzeTestCode", () => {
    test("should detect timing issues", () => {
      const code = `
        test('updates UI', async () => {
          render(<Component />)
          setTimeout(() => {}, 1000)
          expect(screen.getByText('Hello')).toBeInTheDocument()
        })
      `;

      const results = analyzeTestCode(code);
      const timingResult = results.find((r) => r.cause === "timing");

      expect(timingResult).toBeDefined();
      expect(timingResult!.indicators).toContain("Uses setTimeout/setInterval");
      expect(timingResult!.indicators).toContain(
        "Missing waitFor for assertions"
      );
    });

    test("should detect external service issues", () => {
      const code = `
        test('fetches data', async () => {
          const response = await fetch('https://api.example.com/data')
          expect(response.ok).toBe(true)
        })
      `;

      const results = analyzeTestCode(code);
      const externalResult = results.find(
        (r) => r.cause === "external_service"
      );

      expect(externalResult).toBeDefined();
      expect(externalResult!.indicators).toContain("Makes HTTP requests");
      expect(externalResult!.indicators).toContain("Contains external URLs");
    });

    test("should detect random data issues", () => {
      const code = `
        test('generates ID', () => {
          const id = Math.random().toString(36)
          expect(id).toBeDefined()
        })
      `;

      const results = analyzeTestCode(code);
      const randomResult = results.find((r) => r.cause === "random_data");

      expect(randomResult).toBeDefined();
      expect(randomResult!.indicators).toContain("Uses Math.random()");
    });

    test("should detect date/time issues", () => {
      const code = `
        test('checks expiry', () => {
          const now = new Date()
          const expiry = new Date('2025-12-31')
          expect(now < expiry).toBe(true)
        })
      `;

      const results = analyzeTestCode(code);
      const dateResult = results.find((r) => r.cause === "date_time");

      expect(dateResult).toBeDefined();
      expect(dateResult!.indicators).toContain("Uses current date/time");
    });

    test("should sort results by confidence", () => {
      const code = `
        test('complex', async () => {
          setTimeout(() => {}, 100)
          await fetch('https://api.example.com')
          const id = Math.random()
        })
      `;

      const results = analyzeTestCode(code);

      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1]!.confidence).toBeGreaterThanOrEqual(
            results[i]!.confidence
          );
        }
      }
    });
  });

  describe("diagnoseFlakyTest", () => {
    test("should combine analysis and code inspection", () => {
      const analysis: FlakyAnalysis = {
        testPath: "test.ts",
        totalRuns: 20,
        passCount: 12,
        failCount: 8,
        passRate: 0.6,
        isFlaky: true,
        flakinessScore: 0.8,
        avgDuration: 150,
        durationVariance: 25,
        errors: ["Assertion failed"],
      };

      const code = `
        test('ui test', () => {
          expect(screen.getByText('Loading')).toBeInTheDocument()
        })
      `;

      const diagnosed = diagnoseFlakyTest(analysis, code);

      expect(diagnosed.testPath).toBe("test.ts");
      expect(diagnosed.isFlaky).toBe(true);
      expect(diagnosed.likelyCause).toBeDefined();
      expect(diagnosed.suggestedFix).toBeDefined();
      expect(diagnosed.fixExample).toBeDefined();
    });
  });

  describe("batchDetectFlaky", () => {
    test("should process multiple tests", async () => {
      const testPaths = ["test1.ts", "test2.ts", "test3.ts"];
      const testCodes = new Map<string, string>([
        ["test1.ts", "test('a', () => { Math.random() })"],
        ["test2.ts", "test('b', () => { expect(1).toBe(1) })"],
        ["test3.ts", "test('c', () => { setTimeout() })"],
      ]);

      const result = await batchDetectFlaky(testPaths, testCodes, {
        iterations: 5,
      });

      expect(result.totalTests).toBe(3);
      expect(result.flakyTests.length + result.stableTests.length).toBeLessThanOrEqual(3);
      expect(result.summary.byCause).toBeDefined();
    });
  });

  describe("generateFlakyReport", () => {
    test("should generate markdown report", async () => {
      const testPaths = ["test.ts"];
      const testCodes = new Map([["test.ts", "test('a', () => {})"]]);

      const result = await batchDetectFlaky(testPaths, testCodes, {
        iterations: 5,
      });
      const report = generateFlakyReport(result);

      expect(report).toContain("# Flaky Test Detection Report");
      expect(report).toContain("**Tests Analyzed**");
      expect(report).toContain("## Summary");
    });
  });
});

// ============================================================================
// CLEAN SLATE RECOVERY TESTS
// ============================================================================

describe("Clean Slate Recovery", () => {
  describe("CONTEXT_ROT_SYMPTOMS", () => {
    test("should have descriptions for all symptoms", () => {
      const symptoms = Object.keys(CONTEXT_ROT_SYMPTOMS);
      expect(symptoms.length).toBeGreaterThan(5);

      for (const symptom of symptoms) {
        expect(
          CONTEXT_ROT_SYMPTOMS[symptom as keyof typeof CONTEXT_ROT_SYMPTOMS]
        ).toBeDefined();
      }
    });
  });

  describe("CLEAN_SLATE_THRESHOLDS", () => {
    test("should have reasonable defaults", () => {
      expect(CLEAN_SLATE_THRESHOLDS.minAttempts).toBe(3);
      expect(CLEAN_SLATE_THRESHOLDS.rotSignsForRecommendation).toBe(2);
      expect(CLEAN_SLATE_THRESHOLDS.timeThreshold).toBeGreaterThan(0);
      expect(CLEAN_SLATE_THRESHOLDS.tokenThreshold).toBeGreaterThan(0);
    });
  });

  describe("detectContextRot", () => {
    test("should detect repeated approaches", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "JWT auth",
          failureReason: "No refresh endpoint",
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        },
        {
          approach: "JWT auth with fallback",
          failureReason: "Same issue",
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        },
        {
          approach: "JWT auth",
          failureReason: "Still no endpoint",
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        },
      ];

      const result = detectContextRot(attempts);

      expect(result.rotSigns).toContain("circular_reference");
    });

    test("should recommend clean slate after threshold", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "approach1",
          failureReason: "reason1",
          discoveredConstraints: [],
          timeSpent: 15,
          tokensUsed: 15000,
        },
        {
          approach: "approach1",
          failureReason: "reason2",
          discoveredConstraints: [],
          timeSpent: 15,
          tokensUsed: 15000,
        },
        {
          approach: "approach1",
          failureReason: "reason3",
          discoveredConstraints: [],
          timeSpent: 15,
          tokensUsed: 15000,
        },
      ];

      const result = detectContextRot(attempts);

      expect(result.cleanSlateRecommended).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test("should not recommend clean slate for few attempts", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "approach1",
          failureReason: "reason1",
          discoveredConstraints: [],
          timeSpent: 5,
          tokensUsed: 5000,
        },
      ];

      const result = detectContextRot(attempts);

      expect(result.cleanSlateRecommended).toBe(false);
    });
  });

  describe("SessionTracker", () => {
    let tracker: SessionTracker;

    beforeEach(() => {
      tracker = new SessionTracker();
    });

    test("should track attempts", () => {
      const attempt: FailedAttempt = {
        approach: "test approach",
        failureReason: "test reason",
        discoveredConstraints: ["constraint1"],
        timeSpent: 10,
        tokensUsed: 5000,
      };

      const state = tracker.recordAttempt(attempt);

      expect(state.attemptCount).toBe(1);
      expect(state.failedAttempts).toHaveLength(1);
      expect(state.failedAttempts[0]).toEqual(attempt);
    });

    test("should accumulate attempts", () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordAttempt({
          approach: `approach${i}`,
          failureReason: `reason${i}`,
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        });
      }

      const state = tracker.getState();
      expect(state.attemptCount).toBe(5);
    });

    test("should reset properly", () => {
      tracker.recordAttempt({
        approach: "test",
        failureReason: "reason",
        discoveredConstraints: [],
        timeSpent: 10,
        tokensUsed: 5000,
      });

      tracker.reset();
      const state = tracker.getState();

      expect(state.attemptCount).toBe(0);
      expect(state.failedAttempts).toHaveLength(0);
    });
  });

  describe("extractConstraints", () => {
    test("should collect constraints from all attempts", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "approach1",
          failureReason: "API doesn't support X",
          discoveredConstraints: ["constraint1", "constraint2"],
          timeSpent: 10,
          tokensUsed: 5000,
        },
        {
          approach: "approach2",
          failureReason: "Must use existing auth",
          discoveredConstraints: ["constraint3"],
          timeSpent: 10,
          tokensUsed: 5000,
        },
      ];

      const recovery = extractConstraints(attempts);

      expect(recovery.constraints).toContain("constraint1");
      expect(recovery.constraints).toContain("constraint2");
      expect(recovery.constraints).toContain("constraint3");
    });

    test("should deduplicate constraints", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "approach1",
          failureReason: "reason1",
          discoveredConstraints: ["same constraint"],
          timeSpent: 10,
          tokensUsed: 5000,
        },
        {
          approach: "approach2",
          failureReason: "reason2",
          discoveredConstraints: ["same constraint"],
          timeSpent: 10,
          tokensUsed: 5000,
        },
      ];

      const recovery = extractConstraints(attempts);

      expect(recovery.constraints.filter((c) => c === "same constraint")).toHaveLength(1);
    });

    test("should generate fresh prompt", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "JWT approach",
          failureReason: "No refresh endpoint available",
          discoveredConstraints: ["Backend is read-only"],
          timeSpent: 15,
          tokensUsed: 10000,
        },
      ];

      const recovery = extractConstraints(attempts);

      expect(recovery.freshPrompt).toContain("CONSTRAINTS FROM PREVIOUS ATTEMPTS");
      expect(recovery.freshPrompt).toContain("Backend is read-only");
      expect(recovery.freshPrompt).toContain("APPROACHES THAT DO NOT WORK");
      expect(recovery.freshPrompt).toContain("Do NOT repeat");
    });

    test("should calculate estimated savings", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "a1",
          failureReason: "r1",
          discoveredConstraints: [],
          timeSpent: 20,
          tokensUsed: 15000,
        },
        {
          approach: "a2",
          failureReason: "r2",
          discoveredConstraints: [],
          timeSpent: 25,
          tokensUsed: 20000,
        },
      ];

      const recovery = extractConstraints(attempts);

      expect(recovery.estimatedSavings.timeMinutes).toBeGreaterThan(0);
      expect(recovery.estimatedSavings.tokens).toBeGreaterThan(0);
      expect(recovery.estimatedSavings.successProbability).toBe(0.8);
    });
  });

  describe("analyzeCostBenefit", () => {
    test("should recommend continue for few attempts", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "a1",
          failureReason: "r1",
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        },
      ];

      const analysis = analyzeCostBenefit(attempts);

      expect(analysis.recommendation).toBe("continue");
    });

    test("should recommend clean slate for many attempts", () => {
      const attempts: FailedAttempt[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          approach: `a${i}`,
          failureReason: `r${i}`,
          discoveredConstraints: [],
          timeSpent: 15,
          tokensUsed: 10000,
        }));

      const analysis = analyzeCostBenefit(attempts);

      expect(analysis.recommendation).toBe("clean_slate");
    });

    test("should show higher success probability for clean slate", () => {
      const attempts: FailedAttempt[] = Array(4)
        .fill(null)
        .map((_, i) => ({
          approach: `a${i}`,
          failureReason: `r${i}`,
          discoveredConstraints: [],
          timeSpent: 15,
          tokensUsed: 10000,
        }));

      const analysis = analyzeCostBenefit(attempts);

      expect(analysis.cleanSlateEstimate.successProbability).toBeGreaterThan(
        analysis.continueEstimate.successProbability
      );
    });

    test("should calculate break-even point", () => {
      const attempts: FailedAttempt[] = [
        {
          approach: "a1",
          failureReason: "r1",
          discoveredConstraints: [],
          timeSpent: 10,
          tokensUsed: 5000,
        },
      ];

      const analysis = analyzeCostBenefit(attempts);

      expect(analysis.breakEvenAttempt).toBeGreaterThan(0);
      expect(analysis.breakEvenAttempt).toBeLessThanOrEqual(10);
    });
  });

  describe("documentSession", () => {
    test("should generate markdown documentation", () => {
      const state: SessionState = {
        attemptCount: 3,
        failedAttempts: [
          {
            approach: "JWT",
            failureReason: "No endpoint",
            discoveredConstraints: ["Backend is read-only"],
            timeSpent: 15,
            tokensUsed: 10000,
          },
        ],
        rotSigns: ["repeated_approach", "circular_reference"],
        cleanSlateRecommended: true,
        confidence: 0.8,
      };

      const recovery = extractConstraints(state.failedAttempts);
      const doc = documentSession(state, recovery);

      expect(doc).toContain("## Clean Slate Session Documentation");
      expect(doc).toContain("**Attempts before clean slate**: 3");
      expect(doc).toContain("JWT");
      expect(doc).toContain("Backend is read-only");
      expect(doc).toContain("### Fresh Prompt Used");
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Tests", () => {
  test("complete error handling workflow", async () => {
    // 1. Diagnose an error
    const symptoms = ["Code doesn't match patterns", "convention violations"];
    const diagnosis = diagnoseErrorCategory(symptoms);
    expect(diagnosis.length).toBeGreaterThan(0);

    // 2. Add to ERRORS.md
    const manager = new ErrorsManager();
    const entry = manager.addError({
      title: "TypeScript Pattern Mismatch",
      severity: "medium",
      lastOccurrence: new Date(),
      symptoms,
      badPattern: "bad code",
      correctFix: "good code",
      preventionStrategies: [
        { type: "claude_md_rule", description: "Add rule", implemented: false },
      ],
      tags: ["typescript", "validation"],  // Use tags that match commonTags
    });
    expect(entry.id).toBeDefined();

    // 3. Generate context for future tasks (use keywords that match commonTags)
    const context = await generateErrorContext("Update typescript validation", manager);
    expect(context).toContain("TypeScript Pattern Mismatch");
  });

  test("flaky test to fix workflow", async () => {
    // 1. Detect flakiness
    const analysis = await detectFlakiness("timing.test.ts", 10);

    // 2. Analyze test code
    const testCode = `
      test('ui update', () => {
        render(<Component />)
        expect(screen.getByText('Hello')).toBeInTheDocument()
      })
    `;
    const codeAnalysis = analyzeTestCode(testCode);

    // 3. Diagnose
    const diagnosed = diagnoseFlakyTest(analysis, testCode);

    // 4. Get fix strategy
    const fix = FLAKY_FIX_STRATEGIES[diagnosed.likelyCause];

    expect(fix).toBeDefined();
    expect(fix.example.length).toBeGreaterThan(0);
  });

  test("clean slate decision workflow", () => {
    const tracker = new SessionTracker();

    // Record failed attempts
    for (let i = 0; i < 4; i++) {
      tracker.recordAttempt({
        approach: i < 2 ? "JWT approach" : `Modified JWT ${i}`,
        failureReason: "Still no refresh endpoint",
        discoveredConstraints: ["Backend is read-only"],
        timeSpent: 12,
        tokensUsed: 8000,
      });
    }

    // Check state
    const state = tracker.getState();
    expect(state.cleanSlateRecommended).toBe(true);

    // Analyze cost
    const costAnalysis = analyzeCostBenefit(state.failedAttempts);
    expect(costAnalysis.recommendation).toBe("clean_slate");

    // Extract constraints for fresh start
    const recovery = extractConstraints(state.failedAttempts);
    expect(recovery.constraints).toContain("Backend is read-only");
    expect(recovery.freshPrompt).toContain("Do NOT repeat");
  });
});

// ============================================================================
// CIRCUIT BREAKER TESTS
// ============================================================================

describe("Circuit Breaker Pattern", () => {
  describe("CircuitBreaker class", () => {
    test("should start in closed state", () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe("closed");
    });

    test("should use default config when none provided", () => {
      const breaker = new CircuitBreaker();
      const config = breaker.getConfig();
      expect(config.maxFailures).toBe(DEFAULT_CONFIG.maxFailures);
      expect(config.resetTimeMs).toBe(DEFAULT_CONFIG.resetTimeMs);
      expect(config.successThreshold).toBe(DEFAULT_CONFIG.successThreshold);
    });

    test("should allow custom config", () => {
      const breaker = new CircuitBreaker({
        maxFailures: 5,
        resetTimeMs: 10000,
        successThreshold: 2,
      });
      const config = breaker.getConfig();
      expect(config.maxFailures).toBe(5);
      expect(config.resetTimeMs).toBe(10000);
      expect(config.successThreshold).toBe(2);
    });

    test("should pass through successful operations", async () => {
      const breaker = new CircuitBreaker();
      const result = await breaker.execute(async () => "success");
      expect(result).toBe("success");
    });

    test("should pass through failed operations", async () => {
      const breaker = new CircuitBreaker();
      await expect(
        breaker.execute(async () => {
          throw new Error("test error");
        })
      ).rejects.toThrow("test error");
    });

    test("should remain closed after one failure", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 3 });
      try {
        await breaker.execute(async () => {
          throw new Error("failure");
        });
      } catch {}
      expect(breaker.getState()).toBe("closed");
    });

    test("should open after maxFailures consecutive failures", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 3 });

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error(`failure ${i}`);
          });
        } catch {}
      }

      expect(breaker.getState()).toBe("open");
    });

    test("should reject requests when open", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 1 });

      // Trigger open state
      try {
        await breaker.execute(async () => {
          throw new Error("trigger");
        });
      } catch {}

      // Verify rejection
      await expect(
        breaker.execute(async () => "should not run")
      ).rejects.toThrow("Circuit breaker is open");
    });

    test("should reset failure count on success", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 3 });

      // Two failures
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("failure");
          });
        } catch {}
      }

      // One success resets the count
      await breaker.execute(async () => "success");

      // Two more failures should not open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("failure");
          });
        } catch {}
      }

      expect(breaker.getState()).toBe("closed");
    });

    test("should track metrics correctly", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 2 });

      // 3 successes
      for (let i = 0; i < 3; i++) {
        await breaker.execute(async () => "ok");
      }

      // 2 failures to open
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("fail");
          });
        } catch {}
      }

      // 1 rejected
      try {
        await breaker.execute(async () => "rejected");
      } catch {}

      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(6);
      expect(metrics.successfulRequests).toBe(3);
      expect(metrics.failedRequests).toBe(2);
      expect(metrics.rejectedRequests).toBe(1);
      expect(metrics.currentState).toBe("open");
    });

    test("should emit events", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 1 });
      const events: CircuitEvent[] = [];
      breaker.addListener((event) => events.push(event));

      await breaker.execute(async () => "ok");
      expect(events).toContainEqual({ type: "success" });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      expect(events.some((e) => e.type === "failure")).toBe(true);
      expect(
        events.some(
          (e) => e.type === "state_change" && e.from === "closed" && e.to === "open"
        )
      ).toBe(true);
    });

    test("should allow removing event listeners", async () => {
      const breaker = new CircuitBreaker();
      const events: CircuitEvent[] = [];
      const remove = breaker.addListener((event) => events.push(event));

      await breaker.execute(async () => "first");
      expect(events.length).toBe(1);

      remove();
      await breaker.execute(async () => "second");
      expect(events.length).toBe(1); // No new events
    });

    test("should reset to closed state", async () => {
      const breaker = new CircuitBreaker({ maxFailures: 1 });

      // Open the circuit
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}
      expect(breaker.getState()).toBe("open");

      // Reset
      breaker.reset();
      expect(breaker.getState()).toBe("closed");

      // Should work again
      const result = await breaker.execute(async () => "after reset");
      expect(result).toBe("after reset");
    });

    test("should force open", async () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe("closed");

      breaker.forceOpen();
      expect(breaker.getState()).toBe("open");

      await expect(
        breaker.execute(async () => "should fail")
      ).rejects.toThrow("Circuit breaker is open");
    });
  });

  describe("Named circuit breakers", () => {
    beforeEach(() => {
      resetAllBreakers();
    });

    test("should create named breakers", () => {
      const breaker1 = getCircuitBreaker("api");
      const breaker2 = getCircuitBreaker("database");

      expect(breaker1).not.toBe(breaker2);
    });

    test("should return same breaker for same name", () => {
      const breaker1 = getCircuitBreaker("shared");
      const breaker2 = getCircuitBreaker("shared");

      expect(breaker1).toBe(breaker2);
    });

    test("should get all breaker metrics", () => {
      getCircuitBreaker("test-a");
      getCircuitBreaker("test-b");
      getCircuitBreaker("test-c");

      const allMetrics = getAllBreakerMetrics();
      expect(allMetrics.size).toBeGreaterThanOrEqual(3);
      expect(allMetrics.has("test-a")).toBe(true);
      expect(allMetrics.has("test-b")).toBe(true);
      expect(allMetrics.has("test-c")).toBe(true);
    });

    test("should reset all breakers", async () => {
      const breaker1 = getCircuitBreaker("x", { maxFailures: 1 });
      const breaker2 = getCircuitBreaker("y", { maxFailures: 1 });

      // Open both
      for (const breaker of [breaker1, breaker2]) {
        try {
          await breaker.execute(async () => {
            throw new Error("fail");
          });
        } catch {}
      }

      expect(breaker1.getState()).toBe("open");
      expect(breaker2.getState()).toBe("open");

      resetAllBreakers();

      expect(breaker1.getState()).toBe("closed");
      expect(breaker2.getState()).toBe("closed");
    });
  });

  describe("Timeout protection", () => {
    test("should complete before timeout", async () => {
      const result = await withTimeout(
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          return "completed";
        },
        1000,
        "test"
      );
      expect(result).toBe("completed");
    });

    test("should timeout slow operations", async () => {
      await expect(
        withTimeout(
          async () => {
            await new Promise((r) => setTimeout(r, 1000));
            return "too slow";
          },
          50,
          "slow operation"
        )
      ).rejects.toThrow("slow operation timed out after 50ms");
    });

    test("should have default timeout config", () => {
      expect(DEFAULT_TIMEOUT_CONFIG.jobTimeoutMs).toBe(60 * 60 * 1000);
      expect(DEFAULT_TIMEOUT_CONFIG.requestTimeoutMs).toBe(60 * 1000);
      expect(DEFAULT_TIMEOUT_CONFIG.inputTokenLimit).toBe(100000);
      expect(DEFAULT_TIMEOUT_CONFIG.budgetLimitDollars).toBe(10);
    });
  });

  describe("Reliability calculations", () => {
    test("should calculate overall reliability correctly", () => {
      // 95% per action, 5 actions = 0.95^5 = 0.7738
      const overall = calculateOverallReliability(0.95, 5);
      expect(overall).toBeCloseTo(0.7738, 3);
    });

    test("should show reliability degrades with more actions", () => {
      const rel5 = calculateOverallReliability(0.95, 5);
      const rel10 = calculateOverallReliability(0.95, 10);
      const rel20 = calculateOverallReliability(0.95, 20);

      expect(rel5).toBeGreaterThan(rel10);
      expect(rel10).toBeGreaterThan(rel20);
    });

    test("should calculate required per-action reliability", () => {
      // To achieve 90% overall with 20 actions, need 99.47% per action
      const required = requiredPerActionReliability(0.9, 20);
      expect(required).toBeCloseTo(0.9947, 3);
    });

    test("should provide meaningful recommendations", () => {
      const analysis = analyzeReliability(0.95, 20, 0.9);

      expect(analysis.current).toBe(0.95);
      expect(analysis.target).toBe(0.9);
      expect(analysis.actionCount).toBe(20);
      expect(analysis.currentOverall).toBeCloseTo(0.3585, 3); // 0.95^20
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    test("should recommend improvements for low reliability", () => {
      const analysis = analyzeReliability(0.90, 15, 0.9);

      expect(analysis.recommendations).toContainEqual(
        expect.stringContaining("Improve per-action reliability")
      );
    });

    test("should recommend checkpoint-resume for many actions", () => {
      const analysis = analyzeReliability(0.95, 25, 0.9);

      expect(
        analysis.recommendations.some((r) =>
          r.toLowerCase().includes("checkpoint")
        )
      ).toBe(true);
    });
  });

  describe("Half-open state", () => {
    test("should transition to half-open after reset time", async () => {
      const breaker = new CircuitBreaker({
        maxFailures: 1,
        resetTimeMs: 50, // Short timeout for testing
      });

      // Open the circuit
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}
      expect(breaker.getState()).toBe("open");

      // Wait for reset time
      await new Promise((r) => setTimeout(r, 60));

      // Next request should trigger half-open
      const events: CircuitEvent[] = [];
      breaker.addListener((e) => events.push(e));

      try {
        await breaker.execute(async () => "probe");
      } catch {}

      expect(events.some((e) => e.type === "probe_started")).toBe(true);
    });

    test("should close after successful probe", async () => {
      const breaker = new CircuitBreaker({
        maxFailures: 1,
        resetTimeMs: 10,
        successThreshold: 1,
      });

      // Open the circuit
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {}

      // Wait for reset
      await new Promise((r) => setTimeout(r, 20));

      // Successful probe
      await breaker.execute(async () => "success");

      expect(breaker.getState()).toBe("closed");
    });

    test("should reopen after failed probe", async () => {
      const breaker = new CircuitBreaker({
        maxFailures: 1,
        resetTimeMs: 10,
      });

      // Open the circuit
      try {
        await breaker.execute(async () => {
          throw new Error("first fail");
        });
      } catch {}

      // Wait for reset
      await new Promise((r) => setTimeout(r, 20));

      // Failed probe
      try {
        await breaker.execute(async () => {
          throw new Error("probe fail");
        });
      } catch {}

      expect(breaker.getState()).toBe("open");
    });
  });
});

// ============================================================================
// TIMEOUT PROTECTION TESTS
// ============================================================================

describe("Timeout Protection Framework", () => {
  beforeEach(() => {
    resetUsage();
  });

  describe("MODEL_COSTS", () => {
    test("should have all three model tiers", () => {
      expect(MODEL_COSTS).toHaveProperty("haiku");
      expect(MODEL_COSTS).toHaveProperty("sonnet");
      expect(MODEL_COSTS).toHaveProperty("opus");
    });

    test("haiku should be cheapest", () => {
      expect(MODEL_COSTS.haiku.input).toBeLessThan(MODEL_COSTS.sonnet.input);
      expect(MODEL_COSTS.sonnet.input).toBeLessThan(MODEL_COSTS.opus.input);
    });

    test("output should cost more than input for all models", () => {
      expect(MODEL_COSTS.haiku.output).toBeGreaterThan(MODEL_COSTS.haiku.input);
      expect(MODEL_COSTS.sonnet.output).toBeGreaterThan(MODEL_COSTS.sonnet.input);
      expect(MODEL_COSTS.opus.output).toBeGreaterThan(MODEL_COSTS.opus.input);
    });
  });

  describe("MODEL_IDS", () => {
    test("should have valid model IDs", () => {
      expect(MODEL_IDS.haiku).toContain("haiku");
      expect(MODEL_IDS.sonnet).toContain("sonnet");
      expect(MODEL_IDS.opus).toContain("opus");
    });
  });

  describe("DEFAULT_INPUT_LIMITS", () => {
    test("should have reasonable defaults", () => {
      expect(DEFAULT_INPUT_LIMITS.maxFiles).toBe(50);
      expect(DEFAULT_INPUT_LIMITS.maxLinesPerFile).toBe(500);
      expect(DEFAULT_INPUT_LIMITS.maxTotalTokens).toBe(50000);
    });

    test("should exclude common large directories", () => {
      expect(DEFAULT_INPUT_LIMITS.excludePatterns).toContain("node_modules/**");
      expect(DEFAULT_INPUT_LIMITS.excludePatterns).toContain("dist/**");
      expect(DEFAULT_INPUT_LIMITS.excludePatterns).toContain(".git/**");
    });
  });

  describe("DEFAULT_BUDGET", () => {
    test("should have conservative defaults", () => {
      expect(DEFAULT_BUDGET.dailyLimit).toBe(10);
      expect(DEFAULT_BUDGET.monthlyLimit).toBe(100);
      expect(DEFAULT_BUDGET.alertThreshold).toBe(0.8);
    });
  });

  describe("TOKEN_LIMITS_BY_TASK", () => {
    test("should have limits for common tasks", () => {
      expect(TOKEN_LIMITS_BY_TASK.code_review).toBe(4096);
      expect(TOKEN_LIMITS_BY_TASK.bug_fix).toBe(2048);
      expect(TOKEN_LIMITS_BY_TASK.documentation).toBe(8192);
      expect(TOKEN_LIMITS_BY_TASK.simple_edit).toBe(1024);
    });

    test("documentation should have highest limit", () => {
      expect(TOKEN_LIMITS_BY_TASK.documentation!).toBeGreaterThan(
        TOKEN_LIMITS_BY_TASK.code_review!
      );
    });
  });

  describe("Usage Tracking", () => {
    test("should start with zero usage", () => {
      const usage = getUsage();
      expect(usage.daily).toBe(0);
      expect(usage.monthly).toBe(0);
      expect(usage.logs).toHaveLength(0);
    });

    test("should track logged usage", () => {
      const metrics: UsageMetrics = {
        timestamp: new Date(),
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 2000,
        success: true,
      };

      logUsage(metrics);

      const usage = getUsage();
      expect(usage.daily).toBe(0.05);
      expect(usage.monthly).toBe(0.05);
      expect(usage.logs).toHaveLength(1);
    });

    test("should accumulate multiple logs", () => {
      logUsage({
        timestamp: new Date(),
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 2000,
        success: true,
      });

      logUsage({
        timestamp: new Date(),
        tokensIn: 2000,
        tokensOut: 1000,
        cost: 0.10,
        model: "claude-sonnet-4-5-20250929",
        task: "bug_fix",
        durationMs: 3000,
        success: true,
      });

      const usage = getUsage();
      expect(usage.daily).toBeCloseTo(0.15, 2);
      expect(usage.logs).toHaveLength(2);
    });

    test("should reset usage correctly", () => {
      logUsage({
        timestamp: new Date(),
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 2000,
        success: true,
      });

      resetUsage();

      const usage = getUsage();
      expect(usage.daily).toBe(0);
      expect(usage.logs).toHaveLength(0);
    });
  });

  describe("Budget Protection", () => {
    test("should pass when under budget", () => {
      const status = checkBudget();
      expect(status.ok).toBe(true);
      expect(status.alert).toBe(false);
    });

    test("should alert when approaching limit", () => {
      // Spend 85% of daily budget
      logUsage({
        timestamp: new Date(),
        tokensIn: 100000,
        tokensOut: 50000,
        cost: 8.5, // 85% of $10 limit
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 10000,
        success: true,
      });

      const status = checkBudget();
      expect(status.ok).toBe(true);
      expect(status.alert).toBe(true);
      expect(status.message).toContain("Budget alert");
    });

    test("should block when over budget", () => {
      // Spend over daily budget
      logUsage({
        timestamp: new Date(),
        tokensIn: 100000,
        tokensOut: 50000,
        cost: 12, // Over $10 limit
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 10000,
        success: true,
      });

      const status = checkBudget();
      expect(status.ok).toBe(false);
      expect(status.alert).toBe(true);
      expect(status.message).toContain("exceeded");
    });

    test("should work with custom budget config", () => {
      const status = checkBudget({
        dailyLimit: 5,
        monthlyLimit: 50,
        alertThreshold: 0.5,
      });
      expect(status.ok).toBe(true);
      expect(status.remaining).toBe(5);
    });
  });

  describe("Token Estimation", () => {
    test("should estimate 1 token per 4 chars", () => {
      expect(estimateTokens("1234")).toBe(1);
      expect(estimateTokens("12345678")).toBe(2);
    });

    test("should round up partial tokens", () => {
      expect(estimateTokens("12345")).toBe(2); // 5 chars = 1.25 tokens, rounds to 2
    });

    test("should handle empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });
  });

  describe("File Truncation", () => {
    test("should not truncate short files", () => {
      const content = "line1\nline2\nline3";
      const result = truncateFile(content, 10);
      expect(result.truncated).toBe(false);
      expect(result.content).toBe(content);
      expect(result.originalLines).toBe(3);
    });

    test("should truncate long files", () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`);
      const content = lines.join("\n");
      const result = truncateFile(content, 10);

      expect(result.truncated).toBe(true);
      expect(result.originalLines).toBe(100);
      expect(result.content).toContain("truncated 90 lines");
    });

    test("should keep first N lines when truncating", () => {
      const lines = ["first", "second", "third", "fourth", "fifth"];
      const content = lines.join("\n");
      const result = truncateFile(content, 3);

      expect(result.content).toContain("first");
      expect(result.content).toContain("second");
      expect(result.content).toContain("third");
      expect(result.content).not.toContain("fourth");
    });
  });

  describe("Exclude Pattern Matching", () => {
    test("should match node_modules", () => {
      expect(
        matchesExcludePattern("node_modules/lodash/index.js", ["node_modules/**"])
      ).toBe(true);
    });

    test("should match dist directory", () => {
      expect(matchesExcludePattern("dist/bundle.js", ["dist/**"])).toBe(true);
    });

    test("should not match regular files", () => {
      expect(
        matchesExcludePattern("src/app.ts", ["node_modules/**", "dist/**"])
      ).toBe(false);
    });

    test("should match .git directory", () => {
      expect(matchesExcludePattern(".git/config", [".git/**"])).toBe(true);
    });
  });

  describe("File Processing", () => {
    test("should process files within limits", () => {
      const files = [
        { path: "src/app.ts", content: "const x = 1;" },
        { path: "src/utils.ts", content: "export const y = 2;" },
      ];

      const { files: processed, warnings } = processFilesWithLimits(files);

      expect(processed).toHaveLength(2);
      expect(warnings).toHaveLength(0);
    });

    test("should exclude node_modules", () => {
      const files = [
        { path: "src/app.ts", content: "const x = 1;" },
        { path: "node_modules/lodash/index.js", content: "module.exports = {};" },
      ];

      const { files: processed, warnings } = processFilesWithLimits(files);

      expect(processed).toHaveLength(1);
      expect(processed[0]!.path).toBe("src/app.ts");
      expect(warnings).toContain("Excluded: node_modules/lodash/index.js");
    });

    test("should limit file count", () => {
      const files = Array.from({ length: 100 }, (_, i) => ({
        path: `src/file${i}.ts`,
        content: `const x${i} = ${i};`,
      }));

      const { files: processed, warnings } = processFilesWithLimits(files, {
        ...DEFAULT_INPUT_LIMITS,
        maxFiles: 10,
      });

      expect(processed).toHaveLength(10);
      expect(warnings.some((w) => w.includes("truncating to 10"))).toBe(true);
    });

    test("should throw on context too large", () => {
      const largeContent = "x".repeat(300000); // ~75K tokens
      const files = [{ path: "large.ts", content: largeContent }];

      expect(() =>
        processFilesWithLimits(files, {
          ...DEFAULT_INPUT_LIMITS,
          maxTotalTokens: 10000,
        })
      ).toThrow("Context too large");
    });
  });

  describe("Model Selection", () => {
    test("should select haiku for simple tasks", () => {
      expect(selectModelForTask("read the file")).toBe("haiku");
      expect(selectModelForTask("find all tests")).toBe("haiku");
      expect(selectModelForTask("add comment to function")).toBe("haiku");
      expect(selectModelForTask("rename variable")).toBe("haiku");
      expect(selectModelForTask("format code")).toBe("haiku");
    });

    test("should select opus for complex tasks", () => {
      expect(selectModelForTask("design authentication system")).toBe("opus");
      expect(selectModelForTask("security audit")).toBe("opus");
      expect(selectModelForTask("payment integration")).toBe("opus");
      expect(selectModelForTask("performance optimization")).toBe("opus");
    });

    test("should select sonnet by default", () => {
      expect(selectModelForTask("implement feature")).toBe("sonnet");
      expect(selectModelForTask("write unit tests")).toBe("sonnet");
      expect(selectModelForTask("code review")).toBe("sonnet");
    });
  });

  describe("Cost Estimation", () => {
    test("should calculate haiku costs correctly", () => {
      const cost = estimateCost(1000000, 500000, "haiku");
      // Input: 1M tokens * $0.25/MTok = $0.25
      // Output: 0.5M tokens * $1.25/MTok = $0.625
      expect(cost).toBeCloseTo(0.875, 2);
    });

    test("should calculate sonnet costs correctly", () => {
      const cost = estimateCost(1000000, 500000, "sonnet");
      // Input: 1M tokens * $3/MTok = $3
      // Output: 0.5M tokens * $15/MTok = $7.5
      expect(cost).toBeCloseTo(10.5, 2);
    });

    test("should calculate opus costs correctly", () => {
      const cost = estimateCost(1000000, 500000, "opus");
      // Input: 1M tokens * $15/MTok = $15
      // Output: 0.5M tokens * $75/MTok = $37.5
      expect(cost).toBeCloseTo(52.5, 2);
    });
  });

  describe("Timeout Functions", () => {
    test("createTimeout should reject after specified time", async () => {
      const start = Date.now();
      try {
        await createTimeout(50, "test timeout");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
        expect((error as Error).message).toBe("test timeout");
      }
    });

    test("withTimeoutProtection should succeed within timeout", async () => {
      const result = await withTimeoutProtection(
        async () => "success",
        100,
        "timeout"
      );
      expect(result).toBe("success");
    });

    test("withTimeoutProtection should timeout slow operations", async () => {
      try {
        await withTimeoutProtection(
          () => new Promise((r) => setTimeout(r, 200)),
          50,
          "operation timeout"
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("operation timeout");
      }
    });
  });

  describe("Backoff Calculation", () => {
    test("should calculate exponential delays", () => {
      const delay0 = calculateBackoffDelay(0, 1000, 60000);
      const delay1 = calculateBackoffDelay(1, 1000, 60000);
      const delay2 = calculateBackoffDelay(2, 1000, 60000);

      // Base delay is 1000, so:
      // Attempt 0: 1000 * 2^0 = 1000 (plus jitter)
      // Attempt 1: 1000 * 2^1 = 2000 (plus jitter)
      // Attempt 2: 1000 * 2^2 = 4000 (plus jitter)
      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThan(2000);
      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThan(3000);
      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThan(5000);
    });

    test("should cap at max delay", () => {
      const delay = calculateBackoffDelay(10, 1000, 30000);
      expect(delay).toBeLessThanOrEqual(31000); // 30000 + 1000 jitter max
    });
  });

  describe("Retry Logic", () => {
    test("should succeed on first try", async () => {
      const result = await withRetry(async () => "success", 3, 10);
      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test("should retry on failure", async () => {
      let attempt = 0;
      const result = await withRetry(
        async () => {
          attempt++;
          if (attempt < 3) throw new Error("fail");
          return "success";
        },
        3,
        10
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);
    });

    test("should fail after max retries", async () => {
      const result = await withRetry(
        async () => {
          throw new Error("always fail");
        },
        2,
        10
      );

      expect(result.success).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(result.errors).toHaveLength(3);
    });

    test("should not retry non-retryable errors", async () => {
      const result = await withRetry(
        async () => {
          throw new Error("invalid api key");
        },
        3,
        10,
        isRetryableError
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // No retries for auth errors
    });
  });

  describe("Retryable Error Detection", () => {
    test("should identify rate limit errors as retryable", () => {
      expect(isRetryableError(new Error("rate limit exceeded"))).toBe(true);
    });

    test("should identify timeout errors as retryable", () => {
      expect(isRetryableError(new Error("request timeout"))).toBe(true);
    });

    test("should identify network errors as retryable", () => {
      expect(isRetryableError(new Error("network error"))).toBe(true);
      expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
    });

    test("should identify 529 overloaded as retryable", () => {
      expect(isRetryableError(new Error("529 overloaded"))).toBe(true);
    });

    test("should not retry authentication errors", () => {
      expect(isRetryableError(new Error("invalid api key"))).toBe(false);
      expect(isRetryableError(new Error("authentication failed"))).toBe(false);
    });

    test("should not retry budget errors", () => {
      expect(isRetryableError(new Error("budget exceeded"))).toBe(false);
    });
  });

  describe("Cost Calculation Utilities", () => {
    test("should calculate operation cost", () => {
      const cost = calculateOperationCost({
        inputChars: 40000, // ~10K tokens
        outputChars: 8000, // ~2K tokens
        model: "sonnet",
      });

      expect(cost.inputCost).toBeCloseTo(0.03, 4); // 10K tokens * $3/MTok
      expect(cost.outputCost).toBeCloseTo(0.03, 4); // 2K tokens * $15/MTok
      expect(cost.total).toBeCloseTo(0.06, 4);
    });

    test("should calculate monthly cost estimate", () => {
      const estimate = calculateMonthlyCost({
        operationsPerDay: 10,
        avgInputChars: 40000,
        avgOutputChars: 8000,
        model: "sonnet",
        workDaysPerMonth: 22,
      });

      expect(estimate.daily).toBeGreaterThan(0);
      expect(estimate.monthly).toBe(estimate.daily * 22);
      expect(estimate.breakdown).toContain("ops/day");
    });
  });

  describe("Usage Report Generation", () => {
    test("should generate empty report with no usage", () => {
      const report = generateUsageReport(7);

      expect(report.totalCost).toBe(0);
      expect(report.totalOperations).toBe(0);
      expect(report.avgCostPerOp).toBe(0);
      expect(report.successRate).toBe(1); // Default to 100% with no data
    });

    test("should generate report with usage data", () => {
      // Add some usage
      logUsage({
        timestamp: new Date(),
        tokensIn: 1000,
        tokensOut: 500,
        cost: 0.05,
        model: "claude-sonnet-4-5-20250929",
        task: "code_review",
        durationMs: 2000,
        success: true,
      });

      logUsage({
        timestamp: new Date(),
        tokensIn: 2000,
        tokensOut: 1000,
        cost: 0.10,
        model: "claude-3-5-haiku-20241022",
        task: "simple_edit",
        durationMs: 1000,
        success: false,
        error: "test error",
      });

      const report = generateUsageReport(7);

      expect(report.totalCost).toBeCloseTo(0.15, 2);
      expect(report.totalOperations).toBe(2);
      expect(report.avgCostPerOp).toBeCloseTo(0.075, 3);
      expect(report.successRate).toBe(0.5);
      expect(report.avgDurationMs).toBe(1500);
      expect(Object.keys(report.byModel)).toHaveLength(2);
      expect(Object.keys(report.byTask)).toHaveLength(2);
    });
  });
});
