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
