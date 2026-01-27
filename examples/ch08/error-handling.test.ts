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
