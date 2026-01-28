/**
 * Chapter 9: Context Engineering Deep Dive - Tests
 *
 * Tests for the context engineering examples demonstrating
 * entropy measurement, progressive disclosure, backpressure, and debugging.
 */

import { describe, expect, test } from "bun:test";

// Import from entropy-measurement.ts
import {
  hashCode,
  calculateEntropy,
  assessMutualInformation,
  calculateTotalInformation,
  analyzeContextQuality,
  analyzeChannelUtilization,
  CONSTRAINT_INFO_CONTENT,
} from "./entropy-measurement";

// Import from progressive-disclosure.ts
import {
  detectRelevantSkills,
  formatMetadata,
  formatCore,
  loadProgressiveContext,
  calculateEfficiency,
  SKILL_REGISTRY,
} from "./progressive-disclosure";

// Import from context-backpressure.ts
import {
  estimateTokens,
  createContextBudget,
  updateBudget,
  wouldExceedBudget,
  getBudgetRecommendation,
  simulateProgressiveTests,
  CONTEXT_THRESHOLDS,
} from "./context-backpressure";

// Import from context-debugger.ts
import {
  calculateExpectedTime,
  calculateWastedTime,
  diagnoseIssue,
  getNextLayer,
  getLayerConfig,
  createDebugSession,
  recordAttempt,
  analyzeSession,
  DEBUGGING_LAYERS,
} from "./context-debugger";

// Import from context-effectiveness.ts
import {
  normalizeCode,
  calculateTextSimilarity,
  generateImprovementSuggestions,
  type ContextEffectivenessDashboard,
  type TestSuite,
} from "./context-effectiveness";

// ============================================================================
// ENTROPY MEASUREMENT TESTS
// ============================================================================

describe("Entropy Measurement", () => {
  describe("hashCode", () => {
    test("produces consistent hashes for same code", () => {
      const code = "function foo() { return 42; }";
      expect(hashCode(code)).toBe(hashCode(code));
    });

    test("normalizes whitespace", () => {
      const code1 = "function foo() { return 42; }";
      const code2 = "function  foo()  {  return  42;  }";
      expect(hashCode(code1)).toBe(hashCode(code2));
    });

    test("ignores comments", () => {
      const code1 = "function foo() { return 42; }";
      const code2 = "function foo() { return 42; } // comment";
      expect(hashCode(code1)).toBe(hashCode(code2));
    });
  });

  describe("calculateEntropy", () => {
    test("returns 0 for single output", () => {
      expect(calculateEntropy(1)).toBe(0);
    });

    test("returns 1 for two unique outputs", () => {
      expect(calculateEntropy(2)).toBe(1);
    });

    test("returns ~3.32 for 10 unique outputs", () => {
      expect(calculateEntropy(10)).toBeCloseTo(3.32, 1);
    });
  });

  describe("assessMutualInformation", () => {
    test("high MI for 1-2 unique outputs in 10 generations", () => {
      expect(assessMutualInformation(1, 10)).toBe("high");
      expect(assessMutualInformation(2, 10)).toBe("high");
    });

    test("medium MI for 3-5 unique outputs", () => {
      expect(assessMutualInformation(3, 10)).toBe("medium");
      expect(assessMutualInformation(5, 10)).toBe("medium");
    });

    test("low MI for 6+ unique outputs", () => {
      expect(assessMutualInformation(6, 10)).toBe("low");
      expect(assessMutualInformation(10, 10)).toBe("low");
    });
  });

  describe("calculateTotalInformation", () => {
    test("calculates bits from constraints", () => {
      const result = calculateTotalInformation([
        { type: "type_signature", count: 1 },
      ]);
      const typeSignatureInfo = CONSTRAINT_INFO_CONTENT.type_signature;
      expect(result.totalBits).toBe(typeSignatureInfo?.bitsProvided ?? 0);
    });

    test("accumulates multiple constraints", () => {
      const result = calculateTotalInformation([
        { type: "type_signature", count: 2 },
        { type: "test_case", count: 1 },
      ]);
      const typeSignatureInfo = CONSTRAINT_INFO_CONTENT.type_signature;
      const testCaseInfo = CONSTRAINT_INFO_CONTENT.test_case;
      const expectedBits =
        2 * (typeSignatureInfo?.bitsProvided ?? 0) +
        (testCaseInfo?.bitsProvided ?? 0);
      expect(result.totalBits).toBe(expectedBits);
    });

    test("calculates elimination rate", () => {
      const result = calculateTotalInformation([
        { type: "type_signature", count: 1 },
      ]);
      expect(result.estimatedElimination).toBeGreaterThan(0.5);
    });
  });

  describe("analyzeContextQuality", () => {
    test("returns high quality score with types and tests", () => {
      const result = analyzeContextQuality(3, 2, 1, 1);
      expect(result.qualityScore).toBeGreaterThan(90);
    });

    test("returns lower quality with only comments", () => {
      const result = analyzeContextQuality(0, 0, 10, 0);
      expect(result.qualityScore).toBeLessThan(70); // Comments provide ~10% elimination rate
    });

    test("provides recommendations for missing constraints", () => {
      const result = analyzeContextQuality(0, 0, 5, 0);
      expect(result.recommendedAdditions.length).toBeGreaterThan(0);
    });
  });

  describe("analyzeChannelUtilization", () => {
    test("optimal utilization in middle range", () => {
      const result = analyzeChannelUtilization(100000, 350);
      expect(result.utilization).toBe(0.5);
    });

    test("warns about high utilization", () => {
      const result = analyzeChannelUtilization(180000, 400);
      expect(result.recommendation).toContain("too large");
    });

    test("suggests adding content for low utilization", () => {
      const result = analyzeChannelUtilization(10000, 35);
      expect(result.recommendation).toContain("room");
    });
  });
});

// ============================================================================
// PROGRESSIVE DISCLOSURE TESTS
// ============================================================================

describe("Progressive Disclosure", () => {
  describe("detectRelevantSkills", () => {
    test("detects PDF skill from trigger words", () => {
      const skills = detectRelevantSkills("Extract text from this PDF");
      expect(skills).toContain("pdf");
    });

    test("detects git skill from trigger words", () => {
      const skills = detectRelevantSkills("Commit the changes");
      expect(skills).toContain("git");
    });

    test("detects testing skill from trigger words", () => {
      const skills = detectRelevantSkills("Write unit tests for this function");
      expect(skills).toContain("testing");
    });

    test("detects multiple skills", () => {
      const skills = detectRelevantSkills("Commit the PDF extraction code and add tests");
      expect(skills).toContain("pdf");
      expect(skills).toContain("git");
      expect(skills).toContain("testing");
    });

    test("returns empty for unrelated task", () => {
      const skills = detectRelevantSkills("Hello world");
      expect(skills).toHaveLength(0);
    });
  });

  describe("formatMetadata", () => {
    test("formats skill metadata as YAML", () => {
      const skill = SKILL_REGISTRY["pdf"];
      if (skill) {
        const formatted = formatMetadata(skill);
        expect(formatted).toContain("name:");
        expect(formatted).toContain("description:");
        expect(formatted).toContain("triggers:");
      }
    });
  });

  describe("formatCore", () => {
    test("formats skill core with capabilities", () => {
      const skill = SKILL_REGISTRY["pdf"];
      if (skill) {
        const formatted = formatCore(skill);
        expect(formatted).toContain("Capabilities");
        expect(formatted).toContain("Usage Patterns");
      }
    });
  });

  describe("loadProgressiveContext", () => {
    test("loads only metadata for generic task", () => {
      const result = loadProgressiveContext("How do I start?");
      expect(result.levelsLoaded).toContain(1);
      expect(result.levelsLoaded).not.toContain(2);
    });

    test("loads core when skill triggered", () => {
      const result = loadProgressiveContext("Extract PDF text");
      expect(result.levelsLoaded).toContain(2);
    });

    test("loads supplementary when requested", () => {
      const result = loadProgressiveContext("Fill PDF form", ["forms.md"]);
      expect(result.levelsLoaded).toContain(3);
    });

    test("reports token savings", () => {
      const result = loadProgressiveContext("Hello");
      expect(result.tokenSavings).toBeGreaterThan(0);
    });
  });

  describe("calculateEfficiency", () => {
    test("calculates average tokens", () => {
      const results = [
        loadProgressiveContext("task 1"),
        loadProgressiveContext("Extract PDF"),
      ];
      const efficiency = calculateEfficiency(results);
      expect(efficiency.averageTokens).toBeGreaterThan(0);
    });

    test("calculates savings percentage", () => {
      const results = [
        loadProgressiveContext("Hello"),
        loadProgressiveContext("Extract PDF"),
      ];
      const efficiency = calculateEfficiency(results);
      expect(efficiency.averageSavingsPercent).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CONTEXT BACKPRESSURE TESTS
// ============================================================================

describe("Context Backpressure", () => {
  describe("estimateTokens", () => {
    test("estimates tokens from text length", () => {
      const tokens = estimateTokens("Hello world");
      expect(tokens).toBeGreaterThan(0);
    });

    test("longer text has more tokens", () => {
      const short = estimateTokens("Hi");
      const long = estimateTokens("Hello world, this is a longer message");
      expect(long).toBeGreaterThan(short);
    });
  });

  describe("createContextBudget", () => {
    test("creates budget with default max", () => {
      const budget = createContextBudget();
      expect(budget.maxTokens).toBe(CONTEXT_THRESHOLDS.optimalMax);
      expect(budget.usedTokens).toBe(0);
    });

    test("creates budget with custom max", () => {
      const budget = createContextBudget(50000);
      expect(budget.maxTokens).toBe(50000);
    });
  });

  describe("updateBudget", () => {
    test("tracks used tokens", () => {
      let budget = createContextBudget(100000);
      budget = updateBudget(budget, 10000);
      expect(budget.usedTokens).toBe(10000);
      expect(budget.remainingTokens).toBe(90000);
    });

    test("calculates usage percentage", () => {
      let budget = createContextBudget(100000);
      budget = updateBudget(budget, 50000);
      expect(budget.usagePercent).toBe(50);
    });

    test("detects when not optimal", () => {
      let budget = createContextBudget(100000);
      budget = updateBudget(budget, 80000);
      expect(budget.isOptimal).toBe(false);
    });
  });

  describe("wouldExceedBudget", () => {
    test("returns false when within budget", () => {
      const budget = createContextBudget(100000);
      expect(wouldExceedBudget(budget, 50000)).toBe(false);
    });

    test("returns true when would exceed", () => {
      let budget = createContextBudget(100000);
      budget = updateBudget(budget, 90000);
      expect(wouldExceedBudget(budget, 20000)).toBe(true);
    });
  });

  describe("getBudgetRecommendation", () => {
    test("healthy budget recommendation", () => {
      const budget = updateBudget(createContextBudget(100000), 30000);
      expect(getBudgetRecommendation(budget)).toContain("healthy");
    });

    test("exceeded optimal recommendation", () => {
      // 76K tokens exceeds the 75K optimal range
      const budget = updateBudget(createContextBudget(100000), 76000);
      expect(getBudgetRecommendation(budget)).toContain("exceeded");
    });

    test("tight budget recommendation when still optimal", () => {
      // 60K out of 75K is 80% usage but still optimal
      const budget = updateBudget(createContextBudget(75000), 60000);
      expect(getBudgetRecommendation(budget)).toContain("tight");
    });
  });

  describe("simulateProgressiveTests", () => {
    test("minimal output on success", () => {
      const result = simulateProgressiveTests(50, 0);
      expect(result.passed).toBe(true);
      expect(result.level).toBe(1);
      expect(result.detailLevel).toBe("minimal");
    });

    test("moderate output for few failures", () => {
      const result = simulateProgressiveTests(50, 2);
      expect(result.passed).toBe(false);
      expect(result.level).toBe(2);
      expect(result.detailLevel).toBe("moderate");
    });

    test("full output for many failures", () => {
      const result = simulateProgressiveTests(50, 10);
      expect(result.passed).toBe(false);
      expect(result.level).toBe(3);
      expect(result.detailLevel).toBe("full");
    });
  });
});

// ============================================================================
// CONTEXT DEBUGGER TESTS
// ============================================================================

describe("Context Debugger", () => {
  describe("calculateExpectedTime", () => {
    test("returns weighted average of layer times", () => {
      const expectedTime = calculateExpectedTime();
      expect(expectedTime).toBeGreaterThan(0);
      expect(expectedTime).toBeLessThan(30);
    });
  });

  describe("calculateWastedTime", () => {
    test("returns 0 when using correct layer", () => {
      expect(calculateWastedTime("context", "context")).toBe(0);
    });

    test("returns wasted time when starting at wrong layer", () => {
      const wasted = calculateWastedTime("model_power", "context");
      expect(wasted).toBeGreaterThan(0);
    });
  });

  describe("diagnoseIssue", () => {
    test("diagnoses context issues", () => {
      const diagnosis = diagnoseIssue("Code doesn't match project patterns");
      expect(diagnosis.layer).toBe("context");
    });

    test("diagnoses prompting issues", () => {
      // Prompting issues: has context but task interpretation differs from intent
      const diagnosis = diagnoseIssue("Task interpretation differs from intent, missing success criteria");
      expect(diagnosis.layer).toBe("prompting");
    });

    test("provides checklist", () => {
      const diagnosis = diagnoseIssue("Generic problem description");
      expect(diagnosis.checklist.length).toBeGreaterThan(0);
    });

    test("provides estimated time", () => {
      const diagnosis = diagnoseIssue("Some issue");
      expect(diagnosis.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe("getNextLayer", () => {
    test("returns prompting after context", () => {
      expect(getNextLayer("context")).toBe("prompting");
    });

    test("returns model_power after prompting", () => {
      expect(getNextLayer("prompting")).toBe("model_power");
    });

    test("returns null for last layer", () => {
      expect(getNextLayer("manual_override")).toBeNull();
    });
  });

  describe("getLayerConfig", () => {
    test("returns config for valid layer", () => {
      const config = getLayerConfig("context");
      expect(config.probability).toBe(0.6);
    });

    test("throws for invalid layer", () => {
      expect(() => getLayerConfig("invalid" as never)).toThrow();
    });
  });

  describe("createDebugSession", () => {
    test("creates session with diagnosis", () => {
      const session = createDebugSession("AI generates wrong code");
      expect(session.diagnosis).toBeDefined();
      expect(session.resolved).toBe(false);
    });
  });

  describe("recordAttempt", () => {
    test("records attempt and updates session", () => {
      let session = createDebugSession("Problem");
      session = recordAttempt(session, "context", "Added files", true, 5);
      expect(session.attempts.length).toBe(1);
      expect(session.resolved).toBe(true);
      expect(session.totalTime).toBe(5);
    });
  });

  describe("analyzeSession", () => {
    test("analyzes resolved session", () => {
      let session = createDebugSession("Problem");
      session = recordAttempt(session, "context", "Added files", true, 5);
      const analysis = analyzeSession(session);
      expect(analysis.efficiency).toContain("Excellent");
    });

    test("provides recommendation for unresolved session", () => {
      const session = createDebugSession("Problem");
      const analysis = analyzeSession(session);
      expect(analysis.efficiency).toContain("Unresolved");
    });
  });

  describe("DEBUGGING_LAYERS", () => {
    test("probabilities sum to 1", () => {
      const total = DEBUGGING_LAYERS.reduce((sum, l) => sum + l.probability, 0);
      expect(total).toBe(1);
    });

    test("all layers have checklists", () => {
      for (const layer of DEBUGGING_LAYERS) {
        expect(layer.checklist.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// CONTEXT EFFECTIVENESS TESTS
// ============================================================================

describe("Context Effectiveness", () => {
  describe("normalizeCode", () => {
    test("removes single-line comments", () => {
      const code = "function foo() { return 42; } // comment";
      const normalized = normalizeCode(code);
      expect(normalized).not.toContain("comment");
    });

    test("removes multi-line comments", () => {
      const code = "function foo() { /* multi\nline */ return 42; }";
      const normalized = normalizeCode(code);
      expect(normalized).not.toContain("multi");
      expect(normalized).not.toContain("line");
    });

    test("collapses whitespace", () => {
      const code = "function   foo()   {   return   42;   }";
      const normalized = normalizeCode(code);
      expect(normalized).not.toContain("   ");
    });

    test("normalizes semicolons", () => {
      const code = "return 42;   const x = 1;";
      const normalized = normalizeCode(code);
      expect(normalized).toContain(";const");
    });

    test("converts to lowercase", () => {
      const code = "function FOO() { return BAR; }";
      const normalized = normalizeCode(code);
      expect(normalized).toBe(normalizeCode("function foo() { return bar; }"));
    });

    test("produces same output for semantically identical code", () => {
      const code1 = "function foo() { return 42; }";
      const code2 = "function  foo()  {  return  42;  }  // ignored";
      expect(normalizeCode(code1)).toBe(normalizeCode(code2));
    });
  });

  describe("calculateTextSimilarity", () => {
    test("returns 1 for identical strings", () => {
      const text = "function foo() { return 42; }";
      const similarity = calculateTextSimilarity(text, text);
      expect(similarity).toBe(1);
    });

    test("returns 0 for completely different strings", () => {
      const text1 = "aaa";
      const text2 = "zzz";
      const similarity = calculateTextSimilarity(text1, text2);
      expect(similarity).toBe(0);
    });

    test("returns higher similarity for similar strings", () => {
      const text1 = "function foo() { return 42; }";
      const text2 = "function foo() { return 43; }";
      const text3 = "class Bar { constructor() {} }";

      const similar = calculateTextSimilarity(text1, text2);
      const different = calculateTextSimilarity(text1, text3);

      expect(similar).toBeGreaterThan(different);
    });

    test("handles empty strings", () => {
      expect(calculateTextSimilarity("", "")).toBe(0);
      expect(calculateTextSimilarity("hello", "")).toBe(0);
      expect(calculateTextSimilarity("", "hello")).toBe(0);
    });

    test("is symmetric", () => {
      const text1 = "function foo() { return 42; }";
      const text2 = "function bar() { return 43; }";

      expect(calculateTextSimilarity(text1, text2))
        .toBe(calculateTextSimilarity(text2, text1));
    });
  });

  describe("generateImprovementSuggestions", () => {
    test("suggests examples for high variance", () => {
      const dashboard: ContextEffectivenessDashboard = {
        varianceTest: {
          uniqueOutputs: 7,
          totalGenerations: 10,
          entropyEstimate: 2.8,
          effectiveness: "low",
          samples: [],
          varianceRatio: 0.7,
        },
        testPassRate: {
          passRate: 0.8,
          failedTests: [],
          estimatedMI: "medium",
          passCountsByTest: new Map(),
        },
        overallScore: 60,
        recommendations: [],
        measuredAt: new Date(),
      };

      const suggestions = generateImprovementSuggestions(dashboard);
      const hasExampleSuggestion = suggestions.some(
        (s) => s.area === "examples" && s.expectedImpact === "high"
      );
      expect(hasExampleSuggestion).toBe(true);
    });

    test("suggests anti-patterns for medium variance", () => {
      const dashboard: ContextEffectivenessDashboard = {
        varianceTest: {
          uniqueOutputs: 4,
          totalGenerations: 10,
          entropyEstimate: 2.0,
          effectiveness: "medium",
          samples: [],
          varianceRatio: 0.4,
        },
        testPassRate: {
          passRate: 0.85,
          failedTests: [],
          estimatedMI: "medium",
          passCountsByTest: new Map(),
        },
        overallScore: 70,
        recommendations: [],
        measuredAt: new Date(),
      };

      const suggestions = generateImprovementSuggestions(dashboard);
      const hasAntiPatternSuggestion = suggestions.some(
        (s) => s.area === "anti-patterns"
      );
      expect(hasAntiPatternSuggestion).toBe(true);
    });

    test("suggests fixes for failing tests", () => {
      const dashboard: ContextEffectivenessDashboard = {
        varianceTest: {
          uniqueOutputs: 2,
          totalGenerations: 10,
          entropyEstimate: 1.0,
          effectiveness: "high",
          samples: [],
          varianceRatio: 0.2,
        },
        testPassRate: {
          passRate: 0.6,
          failedTests: ["Returns correct error type", "Handles type validation"],
          estimatedMI: "low",
          passCountsByTest: new Map(),
        },
        overallScore: 65,
        recommendations: [],
        measuredAt: new Date(),
      };

      const suggestions = generateImprovementSuggestions(dashboard);
      expect(suggestions.length).toBeGreaterThanOrEqual(2);

      const hasErrorSuggestion = suggestions.some(
        (s) => s.suggestion.includes("error")
      );
      const hasTypeSuggestion = suggestions.some(
        (s) => s.suggestion.includes("type")
      );
      expect(hasErrorSuggestion).toBe(true);
      expect(hasTypeSuggestion).toBe(true);
    });

    test("suggests reference for low similarity", () => {
      const dashboard: ContextEffectivenessDashboard = {
        varianceTest: {
          uniqueOutputs: 2,
          totalGenerations: 10,
          entropyEstimate: 1.0,
          effectiveness: "high",
          samples: [],
          varianceRatio: 0.2,
        },
        testPassRate: {
          passRate: 0.9,
          failedTests: [],
          estimatedMI: "high",
          passCountsByTest: new Map(),
        },
        semanticSimilarity: {
          avgSimilarity: 0.5,
          minSimilarity: 0.3,
          maxSimilarity: 0.7,
          variance: 0.04,
          estimatedMI: "low",
        },
        overallScore: 75,
        recommendations: [],
        measuredAt: new Date(),
      };

      const suggestions = generateImprovementSuggestions(dashboard);
      const hasSimilaritySuggestion = suggestions.some(
        (s) => s.suggestion.includes("reference")
      );
      expect(hasSimilaritySuggestion).toBe(true);
    });

    test("returns empty suggestions for perfect context", () => {
      const dashboard: ContextEffectivenessDashboard = {
        varianceTest: {
          uniqueOutputs: 1,
          totalGenerations: 10,
          entropyEstimate: 0,
          effectiveness: "high",
          samples: [],
          varianceRatio: 0.1,
        },
        testPassRate: {
          passRate: 1.0,
          failedTests: [],
          estimatedMI: "high",
          passCountsByTest: new Map(),
        },
        semanticSimilarity: {
          avgSimilarity: 0.95,
          minSimilarity: 0.9,
          maxSimilarity: 1.0,
          variance: 0.005,
          estimatedMI: "high",
        },
        overallScore: 98,
        recommendations: [],
        measuredAt: new Date(),
      };

      const suggestions = generateImprovementSuggestions(dashboard);
      expect(suggestions.length).toBe(0);
    });
  });

  describe("TestSuite and TestCase types", () => {
    test("test suite can validate code", () => {
      const testSuite: TestSuite = {
        name: "Error Handling",
        tests: [
          {
            name: "Returns Result type",
            validate: (code) => code.includes("Result<") || code.includes("success:"),
          },
          {
            name: "No throw statements",
            validate: (code) => !code.includes("throw new"),
          },
        ],
      };

      const goodCode = "function validate(): Result<User, Error> { return { success: true }; }";
      const badCode = "function validate() { throw new Error('fail'); }";

      expect(testSuite.tests[0]!.validate(goodCode)).toBe(true);
      expect(testSuite.tests[1]!.validate(goodCode)).toBe(true);

      expect(testSuite.tests[0]!.validate(badCode)).toBe(false);
      expect(testSuite.tests[1]!.validate(badCode)).toBe(false);
    });
  });

  describe("Mutual Information assessment", () => {
    test("high MI corresponds to 1-2 unique outputs", () => {
      // Based on the chapter content: 1-2 unique outputs = high MI
      const uniqueOutputs = [1, 2];
      for (const count of uniqueOutputs) {
        const ratio = count / 10;
        const effectiveness = ratio <= 0.2 ? "high" : ratio <= 0.5 ? "medium" : "low";
        expect(effectiveness).toBe("high");
      }
    });

    test("medium MI corresponds to 3-5 unique outputs", () => {
      const uniqueOutputs = [3, 4, 5];
      for (const count of uniqueOutputs) {
        const ratio = count / 10;
        const effectiveness = ratio <= 0.2 ? "high" : ratio <= 0.5 ? "medium" : "low";
        expect(effectiveness).toBe("medium");
      }
    });

    test("low MI corresponds to 6+ unique outputs", () => {
      const uniqueOutputs = [6, 7, 8, 9, 10];
      for (const count of uniqueOutputs) {
        const ratio = count / 10;
        const effectiveness = ratio <= 0.2 ? "high" : ratio <= 0.5 ? "medium" : "low";
        expect(effectiveness).toBe("low");
      }
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Tests", () => {
  test("entropy measurement integrates with context quality", () => {
    // High-quality context should have high information content
    const quality = analyzeContextQuality(3, 2, 1, 1);
    expect(quality.totalBits).toBeGreaterThan(15);

    // Which should predict low entropy (fewer unique outputs)
    // This is a conceptual link - the actual entropy would require API calls
  });

  test("progressive disclosure integrates with backpressure", () => {
    // Loading less context saves budget
    const context = loadProgressiveContext("Hello");
    const budget = createContextBudget(100000);

    expect(wouldExceedBudget(budget, context.tokensLoaded)).toBe(false);
    expect(context.tokenSavings).toBeGreaterThan(0);
  });

  test("debugging framework covers all issue types", () => {
    // Ensure all issue types can be diagnosed
    const issues = [
      "Code doesn't match patterns",  // context
      "Format is wrong",              // prompting
      "Complex decision fails",       // model_power
      "Need human expertise",         // manual_override
    ];

    for (const issue of issues) {
      const diagnosis = diagnoseIssue(issue);
      expect(diagnosis.confidence).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// PROGRESSIVE DISCLOSURE LOADER TESTS
// ============================================================================

// Import from progressive-disclosure-loader.ts
import {
  parseSkillMetadata,
  estimateTokens as estimateTokensLoader,
  buildSkillRegistry,
  SkillLoader,
  CachedComboLoader,
  generateMetricsReport,
  SKILL_COMBOS,
  DEFAULT_CONFIG,
} from "./progressive-disclosure-loader";

describe("Progressive Disclosure Loader", () => {
  describe("parseSkillMetadata", () => {
    test("parses valid YAML frontmatter", () => {
      const content = `---
name: test-skill
description: A test skill
triggers:
  - "test"
  - "example"
---

# Test Skill Content`;

      const metadata = parseSkillMetadata(content, "skills/test/SKILL.md");

      expect(metadata).not.toBeNull();
      expect(metadata?.name).toBe("test-skill");
      expect(metadata?.description).toBe("A test skill");
      expect(metadata?.triggers).toEqual(["test", "example"]);
      expect(metadata?.path).toBe("skills/test/SKILL.md");
    });

    test("returns null for invalid frontmatter", () => {
      const content = "# No frontmatter here";
      const metadata = parseSkillMetadata(content, "test.md");
      expect(metadata).toBeNull();
    });

    test("returns null for incomplete frontmatter", () => {
      const content = `---
name: test-skill
---`;
      const metadata = parseSkillMetadata(content, "test.md");
      expect(metadata).toBeNull();
    });
  });

  describe("estimateTokens (loader)", () => {
    test("counts tokens using tiktoken (more accurate than char estimates)", () => {
      // tiktoken gives actual token counts, not char/4 estimates
      // "1234" = 1 token, "12345678" = 1 token (numbers are efficient)
      // "hello world" = 2 tokens
      expect(estimateTokensLoader("1234")).toBeGreaterThan(0);
      expect(estimateTokensLoader("12345678")).toBeGreaterThan(0);
      expect(estimateTokensLoader("hello world")).toBeGreaterThan(0);
    });

    test("handles empty string", () => {
      expect(estimateTokensLoader("")).toBe(0);
    });

    test("longer text has more tokens", () => {
      const short = estimateTokensLoader("hi");
      const long = estimateTokensLoader("hello world, this is a much longer string");
      expect(long).toBeGreaterThan(short);
    });
  });

  describe("buildSkillRegistry", () => {
    test("builds registry from simulated filesystem", () => {
      const registry = buildSkillRegistry("skills");

      expect(registry.length).toBeGreaterThan(0);
      expect(registry.some((s) => s.name === "pdf-manipulation")).toBe(true);
      expect(registry.some((s) => s.name === "git-operations")).toBe(true);
      expect(registry.some((s) => s.name === "testing-framework")).toBe(true);
    });
  });

  describe("SkillLoader", () => {
    const loader = new SkillLoader({
      skillsDir: "skills",
      enableCache: true,
      enableMetrics: true,
    });

    describe("getMetadataContext", () => {
      test("returns context with all skills", () => {
        const result = loader.getMetadataContext();

        expect(result.context).toContain("pdf-manipulation");
        expect(result.context).toContain("git-operations");
        expect(result.context).toContain("testing-framework");
        expect(result.tokens).toBeGreaterThan(0);
      });
    });

    describe("detectRelevantSkills", () => {
      test("detects PDF skill for PDF tasks", () => {
        const skills = loader.detectRelevantSkills("Extract text from document.pdf");
        expect(skills).toContain("pdf-manipulation");
      });

      test("detects git skill for git tasks", () => {
        const skills = loader.detectRelevantSkills("commit and push changes");
        expect(skills).toContain("git-operations");
      });

      test("detects testing skill for test tasks", () => {
        const skills = loader.detectRelevantSkills("run the jest tests");
        expect(skills).toContain("testing-framework");
      });

      test("detects multiple skills for multi-domain tasks", () => {
        const skills = loader.detectRelevantSkills("commit the PDF extraction code and add tests");
        expect(skills).toContain("pdf-manipulation");
        expect(skills).toContain("git-operations");
        expect(skills).toContain("testing-framework");
      });

      test("returns empty for unrelated tasks", () => {
        const skills = loader.detectRelevantSkills("Hello, how are you?");
        expect(skills.length).toBe(0);
      });
    });

    describe("loadSkillCore", () => {
      test("loads skill core content", () => {
        const loaded = loader.loadSkillCore("pdf-manipulation");

        expect(loaded).not.toBeNull();
        expect(loaded?.name).toBe("pdf-manipulation");
        expect(loaded?.coreContent).toContain("PDF Manipulation Skill");
        expect(loaded?.coreTokens).toBeGreaterThan(0);
      });

      test("returns null for unknown skill", () => {
        const loaded = loader.loadSkillCore("nonexistent-skill");
        expect(loaded).toBeNull();
      });
    });

    describe("loadSupplementary", () => {
      test("loads supplementary resources", () => {
        const resource = loader.loadSupplementary("pdf-manipulation", "forms.md");

        expect(resource).not.toBeNull();
        expect(resource?.name).toBe("forms.md");
        expect(resource?.content).toContain("Field Types");
        expect(resource?.tokens).toBeGreaterThan(0);
      });

      test("returns null for unknown resource", () => {
        const resource = loader.loadSupplementary("pdf-manipulation", "nonexistent.md");
        expect(resource).toBeNull();
      });
    });

    describe("loadContextForTask", () => {
      test("loads metadata only for generic tasks", () => {
        const result = loader.loadContextForTask("Hello, how are you?");

        expect(result.levelsLoaded).toEqual([1]);
        expect(result.skillsLoaded.length).toBe(0);
        expect(result.tokensLoaded).toBeGreaterThan(0);
      });

      test("loads core for triggered skills", () => {
        const result = loader.loadContextForTask("Extract text from report.pdf");

        expect(result.levelsLoaded).toContain(1);
        expect(result.levelsLoaded).toContain(2);
        expect(result.skillsLoaded).toContain("pdf-manipulation");
      });

      test("loads supplementary when requested", () => {
        const result = loader.loadContextForTask("Fill a PDF form", {
          "pdf-manipulation": ["forms.md"],
        });

        expect(result.levelsLoaded).toContain(3);
        expect(result.context).toContain("Field Types");
      });

      test("calculates token savings", () => {
        const result = loader.loadContextForTask("Hello");

        expect(result.tokenSavings).toBeGreaterThan(0);
      });
    });

    describe("getMetrics", () => {
      test("tracks loading metrics", () => {
        const freshLoader = new SkillLoader({
          skillsDir: "skills",
          enableMetrics: true,
        });

        // Perform some operations that trigger skill loading
        freshLoader.loadContextForTask("Extract text from document.pdf");
        freshLoader.loadContextForTask("Git commit changes");

        const metrics = freshLoader.getMetrics();

        expect(metrics.totalLoads).toBeGreaterThan(0);
        expect(metrics.totalTokensLoaded).toBeGreaterThan(0);
      });
    });

    describe("getCacheStats", () => {
      test("tracks cache statistics", () => {
        const freshLoader = new SkillLoader({
          skillsDir: "skills",
          enableCache: true,
        });

        // Load same skill twice
        freshLoader.loadSkillCore("pdf-manipulation");
        freshLoader.loadSkillCore("pdf-manipulation");

        const stats = freshLoader.getCacheStats();

        expect(stats.size).toBeGreaterThan(0);
        expect(stats.skills).toContain("pdf-manipulation");
      });
    });
  });

  describe("CachedComboLoader", () => {
    test("loads skill combos", () => {
      const comboLoader = new CachedComboLoader({ skillsDir: "skills" });
      const result = comboLoader.loadSkillCombo("code-review");

      expect(result.tokensLoaded).toBeGreaterThan(0);
      expect(result.context).toContain("Git Operations");
      expect(result.context).toContain("Testing Framework");
    });

    test("caches combo on second load", () => {
      const freshLoader = new CachedComboLoader({ skillsDir: "skills" });

      const first = freshLoader.loadSkillCombo("code-review");
      expect(first.cached).toBe(false);

      const second = freshLoader.loadSkillCombo("code-review");
      expect(second.cached).toBe(true);
    });

    test("returns empty for unknown combo", () => {
      const comboLoader = new CachedComboLoader({ skillsDir: "skills" });
      const result = comboLoader.loadSkillCombo("nonexistent-combo");
      expect(result.tokensLoaded).toBe(0);
      expect(result.context).toBe("");
    });
  });

  describe("generateMetricsReport", () => {
    test("generates readable report", () => {
      const loader = new SkillLoader({
        skillsDir: "skills",
        enableMetrics: true,
      });
      loader.loadContextForTask("Extract text from document.pdf and commit");

      const report = generateMetricsReport(loader);

      expect(report).toContain("Loading Statistics");
      expect(report).toContain("Cache Performance");
      expect(report).toContain("Skill Discovery");
    });
  });

  describe("SKILL_COMBOS", () => {
    test("contains predefined skill combinations", () => {
      expect(SKILL_COMBOS["code-review"]).toContain("git-operations");
      expect(SKILL_COMBOS["code-review"]).toContain("testing-framework");
      expect(SKILL_COMBOS["development"]).toBeDefined();
    });
  });

  describe("DEFAULT_CONFIG", () => {
    test("has sensible defaults", () => {
      expect(DEFAULT_CONFIG.skillsDir).toBe("./skills");
      expect(DEFAULT_CONFIG.enableCache).toBe(true);
      expect(DEFAULT_CONFIG.cacheTTL).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.maxCachedSkills).toBeGreaterThan(0);
    });
  });
});
