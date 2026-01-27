/**
 * Chapter 7: Quality Gates That Compound - Test Suite
 *
 * Tests for quality gate calculations, hook configurations, and
 * technical debt modeling.
 */

import { describe, it, expect } from "bun:test";
import {
  calculateCompounding,
  calculateStateSpaceReduction,
  calculateConfidence,
  calculateTechnicalDebt,
  compareLintingStrategies,
  calculateGateHealth,
  generateHealthReport,
  SIX_GATE_STACK,
  type QualityGate,
} from "./quality-gate-calculator";

import {
  createHook,
  chainHooks,
  validateHook,
  generateHooksDirectory,
  simulateHookExecution,
  simulateHookChain,
  HOOK_TEMPLATES,
  type ClaudeHook,
} from "./hook-configuration";

// ============================================================================
// QUALITY GATE CALCULATOR TESTS
// ============================================================================

describe("Quality Gate Calculator", () => {
  describe("calculateCompounding", () => {
    it("calculates linear expectation correctly", () => {
      const result = calculateCompounding(SIX_GATE_STACK);

      // Linear = sum of all improvements: 0.10 + 0.15 + 0.20 + 0.15 + 0.20 + 0.25 = 1.05
      expect(result.linearExpectation).toBeCloseTo(1.05, 2);
    });

    it("calculates multiplicative result correctly", () => {
      const result = calculateCompounding(SIX_GATE_STACK);

      // Multiplicative = 1.10 * 1.15 * 1.20 * 1.15 * 1.20 * 1.25 = 2.6456
      // Improvement = 2.6456 - 1 = 1.6456
      expect(result.multiplicativeResult).toBeGreaterThan(1.6);
      expect(result.multiplicativeResult).toBeLessThan(1.7);
    });

    it("calculates compounding bonus correctly", () => {
      const result = calculateCompounding(SIX_GATE_STACK);

      // Bonus = multiplicative - linear
      expect(result.compoundingBonus).toBeCloseTo(
        result.multiplicativeResult - result.linearExpectation,
        4
      );
    });

    it("provides step-by-step calculation", () => {
      const result = calculateCompounding(SIX_GATE_STACK);

      expect(result.stepByStep).toHaveLength(6);
      expect(result.stepByStep[0]!.gate).toBe("Types (TypeScript)");
      expect(result.stepByStep[0]!.cumulative).toBeCloseTo(1.1, 2);

      // Each step should be larger than the previous
      for (let i = 1; i < result.stepByStep.length; i++) {
        expect(result.stepByStep[i]!.cumulative).toBeGreaterThan(
          result.stepByStep[i - 1]!.cumulative
        );
      }
    });

    it("handles empty gate array", () => {
      const result = calculateCompounding([]);

      expect(result.linearExpectation).toBe(0);
      expect(result.multiplicativeResult).toBe(0);
      expect(result.compoundingBonus).toBe(0);
      expect(result.stepByStep).toHaveLength(0);
    });

    it("handles single gate", () => {
      const singleGate: QualityGate[] = [SIX_GATE_STACK[0]!];
      const result = calculateCompounding(singleGate);

      expect(result.linearExpectation).toBeCloseTo(0.1, 4);
      expect(result.multiplicativeResult).toBeCloseTo(0.1, 4);
      expect(result.compoundingBonus).toBeCloseTo(0, 4); // No bonus with single gate
    });
  });

  describe("calculateStateSpaceReduction", () => {
    it("starts with initial state space", () => {
      const stages = calculateStateSpaceReduction(1_000_000, []);

      expect(stages).toHaveLength(1);
      expect(stages[0]!.size).toBe(1_000_000);
      expect(stages[0]!.cumulativeEliminated).toBe(0);
    });

    it("reduces state space through each gate", () => {
      const gates = SIX_GATE_STACK.slice(0, 3);
      const stages = calculateStateSpaceReduction(1_000_000, gates);

      expect(stages).toHaveLength(4); // Initial + 3 gates
      expect(stages[0]!.size).toBe(1_000_000);

      // Each subsequent stage should be smaller
      for (let i = 1; i < stages.length; i++) {
        expect(stages[i]!.size).toBeLessThan(stages[i - 1]!.size);
      }
    });

    it("calculates cumulative elimination correctly", () => {
      const gates = SIX_GATE_STACK.slice(0, 2);
      const stages = calculateStateSpaceReduction(1_000_000, gates);

      // After types (95% filter): 50,000 remaining, 95% eliminated
      expect(stages[1]!.cumulativeEliminated).toBeGreaterThan(90);

      // After linting (90% of remaining): even more eliminated
      expect(stages[2]!.cumulativeEliminated).toBeGreaterThan(stages[1]!.cumulativeEliminated);
    });

    it("handles 100% filter rate", () => {
      const perfectGate: QualityGate = {
        name: "Perfect Filter",
        improvementRate: 0.5,
        filterRate: 1.0, // Eliminates all
        catches: ["everything"],
      };

      const stages = calculateStateSpaceReduction(1_000_000, [perfectGate]);

      expect(stages[1]!.size).toBe(0);
      expect(stages[1]!.cumulativeEliminated).toBe(100);
    });
  });

  describe("calculateConfidence", () => {
    it("returns low confidence for no gates", () => {
      const confidence = calculateConfidence([]);
      expect(confidence).toBe(0.001);
    });

    it("returns increasing confidence with more gates", () => {
      const conf1 = calculateConfidence(["Types (TypeScript)"]);
      const conf2 = calculateConfidence(["Types (TypeScript)", "Linting (ESLint)"]);
      const conf3 = calculateConfidence([
        "Types (TypeScript)",
        "Linting (ESLint)",
        "Tests (Unit/Integration)",
      ]);

      expect(conf1).toBeLessThan(conf2);
      expect(conf2).toBeLessThan(conf3);
    });

    it("returns high confidence with full stack", () => {
      const confidence = calculateConfidence([
        "Types (TypeScript)",
        "Linting (ESLint)",
        "Tests (Unit/Integration)",
        "CI/CD (GitHub Actions)",
        "DDD (Domain Patterns)",
        "CLAUDE.md (AI Context)",
      ]);

      expect(confidence).toBeGreaterThan(0.9);
    });

    it("returns default for unknown gate", () => {
      const confidence = calculateConfidence(["Unknown Gate"]);
      expect(confidence).toBe(0.5);
    });
  });

  describe("calculateTechnicalDebt", () => {
    it("calculates total violations correctly", () => {
      const debt = calculateTechnicalDebt(90, 2, 10);

      // 2 violations * 10 commits * 90 days = 1800
      expect(debt.totalViolations).toBe(1800);
    });

    it("calculates cleanup time correctly", () => {
      const debt = calculateTechnicalDebt(90, 2, 10, 2);

      // 1800 violations * 2 minutes = 3600 minutes = 60 hours
      expect(debt.cleanupTimeHours).toBe(60);
    });

    it("calculates early adoption cost correctly", () => {
      const debt = calculateTechnicalDebt(90, 2, 10);

      // 30 min setup + (900 commits * 5 sec / 60) minutes overhead
      const expectedCost = (30 + (900 * 5) / 60) / 60;
      expect(debt.earlyAdoptionCost).toBeCloseTo(expectedCost, 2);
    });

    it("calculates positive ROI", () => {
      const debt = calculateTechnicalDebt(90, 2, 10);

      // ROI should be significantly positive
      expect(debt.roi).toBeGreaterThan(10);
    });

    it("uses default values when not provided", () => {
      const debt = calculateTechnicalDebt(30);

      expect(debt.violationsPerCommit).toBe(2);
      expect(debt.commitsPerDay).toBe(10);
      expect(debt.days).toBe(30);
    });
  });

  describe("compareLintingStrategies", () => {
    it("shows early adoption has zero violations", () => {
      const comparison = compareLintingStrategies(90);

      expect(comparison.earlyAdoption.totalViolations).toBe(0);
      expect(comparison.earlyAdoption.cleanupTimeHours).toBe(0);
    });

    it("shows late adoption accumulates violations", () => {
      const comparison = compareLintingStrategies(90);

      expect(comparison.lateAdoption.totalViolations).toBeGreaterThan(0);
      expect(comparison.lateAdoption.cleanupTimeHours).toBeGreaterThan(0);
    });

    it("calculates savings correctly", () => {
      const comparison = compareLintingStrategies(90);

      expect(comparison.savings).toBeGreaterThan(50); // Should save 50+ hours
    });

    it("provides appropriate recommendation", () => {
      const comparison = compareLintingStrategies(90);

      expect(comparison.recommendation).toContain("CRITICAL");
    });
  });

  describe("calculateGateHealth", () => {
    it("calculates metrics correctly", () => {
      const health = calculateGateHealth("Test Gate", 85, 100, 15, 300);

      expect(health.gateName).toBe("Test Gate");
      expect(health.firstPassRate).toBe(0.85);
      expect(health.avgFixTime).toBe(20); // 300 / 15
      expect(health.issuesCaught).toBe(15);
    });

    it("handles zero issues", () => {
      const health = calculateGateHealth("Perfect Gate", 100, 100, 0, 0);

      expect(health.firstPassRate).toBe(1);
      expect(health.avgFixTime).toBe(0);
      expect(health.issuesCaught).toBe(0);
    });

    it("handles zero generations", () => {
      const health = calculateGateHealth("New Gate", 0, 0, 0, 0);

      expect(health.firstPassRate).toBe(1);
    });
  });

  describe("generateHealthReport", () => {
    it("generates report with correct structure", () => {
      const metrics = [
        calculateGateHealth("Gate 1", 90, 100, 10, 100),
        calculateGateHealth("Gate 2", 50, 100, 50, 500),
      ];

      const report = generateHealthReport(metrics);

      expect(report).toContain("# Quality Gate Health Report");
      expect(report).toContain("Gate 1");
      expect(report).toContain("Gate 2");
      expect(report).toContain("First Pass Rate");
    });

    it("includes status indicators", () => {
      // Score = passRateScore(40 max) + fixTimeScore(30 max) + catchRateScore(30 max)
      // HEALTHY >= 70, NEEDS ATTENTION >= 40, CRITICAL < 40
      const metrics = [
        // 99% pass rate (39.6) + low fix time (30) + issues (3.33) = 73 -> HEALTHY
        calculateGateHealth("Healthy Gate", 99, 100, 10, 30),
        // 5% pass rate (2) + high fix time (0) + issues (30) = 32 -> CRITICAL
        calculateGateHealth("Critical Gate", 5, 100, 100, 50000),
      ];

      const report = generateHealthReport(metrics);

      expect(report).toContain("HEALTHY");
      expect(report).toContain("CRITICAL");
    });
  });
});

// ============================================================================
// HOOK CONFIGURATION TESTS
// ============================================================================

describe("Hook Configuration", () => {
  describe("createHook", () => {
    it("creates hook with required fields", () => {
      const hook = createHook("npm test", "Run tests");

      expect(hook.command).toBe("npm test");
      expect(hook.description).toBe("Run tests");
      expect(hook.continueOnError).toBe(false);
    });

    it("applies optional fields", () => {
      const hook = createHook("npm test", "Run tests", {
        continueOnError: true,
        pattern: "*.ts",
        timeout: 60,
      });

      expect(hook.continueOnError).toBe(true);
      expect(hook.pattern).toBe("*.ts");
      expect(hook.timeout).toBe(60);
    });
  });

  describe("chainHooks", () => {
    it("chains with && operator", () => {
      const hooks: ClaudeHook[] = [
        HOOK_TEMPLATES.eslint,
        HOOK_TEMPLATES.typeCheck,
      ];

      const chained = chainHooks(hooks, "&&");

      expect(chained.command).toContain("&&");
      expect(chained.command).toContain("eslint");
      expect(chained.command).toContain("tsc");
      expect(chained.continueOnError).toBe(false);
    });

    it("chains with ; operator", () => {
      const hooks: ClaudeHook[] = [
        HOOK_TEMPLATES.prettier,
        HOOK_TEMPLATES.eslint,
      ];

      const chained = chainHooks(hooks, ";");

      expect(chained.command).toContain(";");
      expect(chained.continueOnError).toBe(true);
    });

    it("sums timeouts for chained hooks", () => {
      const hooks: ClaudeHook[] = [
        { ...HOOK_TEMPLATES.eslint, timeout: 30 },
        { ...HOOK_TEMPLATES.typeCheck, timeout: 60 },
      ];

      const chained = chainHooks(hooks, "&&");

      // Each hook adds its timeout or default 30 if not specified
      // 30 + 60 = 90
      expect(chained.timeout).toBe(90);
    });
  });

  describe("validateHook", () => {
    it("validates valid hook", () => {
      const hook = HOOK_TEMPLATES.eslint;
      const result = validateHook(hook);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects empty command", () => {
      const hook: ClaudeHook = {
        command: "",
        description: "Test",
        continueOnError: false,
      };

      const result = validateHook(hook);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Hook command is required");
    });

    it("rejects empty description", () => {
      const hook: ClaudeHook = {
        command: "npm test",
        description: "",
        continueOnError: false,
      };

      const result = validateHook(hook);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Hook description is required");
    });

    it("rejects invalid timeout", () => {
      const hook: ClaudeHook = {
        command: "npm test",
        description: "Test",
        continueOnError: false,
        timeout: 1000, // Over max
      };

      const result = validateHook(hook);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Timeout"))).toBe(true);
    });

    it("detects dangerous commands", () => {
      const hook: ClaudeHook = {
        command: "rm -rf /",
        description: "Dangerous",
        continueOnError: false,
      };

      const result = validateHook(hook);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("dangerous"))).toBe(true);
    });
  });

  describe("generateHooksDirectory", () => {
    it("generates files for provided hooks", () => {
      const files = generateHooksDirectory({
        postWrite: HOOK_TEMPLATES.eslint,
        postEdit: HOOK_TEMPLATES.typeCheck,
      });

      expect(files.has(".claude/hooks/post-write.json")).toBe(true);
      expect(files.has(".claude/hooks/post-edit.json")).toBe(true);
      expect(files.has(".claude/hooks/pre-commit.json")).toBe(false);
    });

    it("generates valid JSON content", () => {
      const files = generateHooksDirectory({
        postWrite: HOOK_TEMPLATES.eslint,
      });

      const content = files.get(".claude/hooks/post-write.json");
      expect(() => JSON.parse(content!)).not.toThrow();
    });
  });

  describe("simulateHookExecution", () => {
    it("simulates successful execution", () => {
      const result = simulateHookExecution(HOOK_TEMPLATES.eslint, "good-file.ts");

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("simulates failed execution", () => {
      const result = simulateHookExecution(HOOK_TEMPLATES.eslint, "bad-file.ts");

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("error");
    });

    it("replaces file placeholder", () => {
      const result = simulateHookExecution(HOOK_TEMPLATES.eslint, "test.ts");

      expect(result.hook).toBe(HOOK_TEMPLATES.eslint.description);
    });
  });

  describe("simulateHookChain", () => {
    it("passes all hooks for good file", () => {
      const hooks = [HOOK_TEMPLATES.eslint, HOOK_TEMPLATES.typeCheck];
      const result = simulateHookChain(hooks, "good-file.ts");

      expect(result.allPassed).toBe(true);
      expect(result.failedAt).toBeUndefined();
    });

    it("stops at first failure with strict chain", () => {
      const hooks = [HOOK_TEMPLATES.eslint, HOOK_TEMPLATES.typeCheck];
      const result = simulateHookChain(hooks, "bad-file.ts");

      expect(result.allPassed).toBe(false);
      expect(result.failedAt).toBe(HOOK_TEMPLATES.eslint.description);
      expect(result.results).toHaveLength(1); // Stopped at first failure
    });

    it("continues after failure with continueOnError", () => {
      const hooks = [
        { ...HOOK_TEMPLATES.eslint, continueOnError: true },
        HOOK_TEMPLATES.typeCheck,
      ];
      const result = simulateHookChain(hooks, "bad-file.ts");

      expect(result.results).toHaveLength(2); // Continued despite first failure
    });
  });

  describe("HOOK_TEMPLATES", () => {
    it("has all expected templates", () => {
      expect(HOOK_TEMPLATES.eslint).toBeDefined();
      expect(HOOK_TEMPLATES.typeCheck).toBeDefined();
      expect(HOOK_TEMPLATES.relatedTests).toBeDefined();
      expect(HOOK_TEMPLATES.prettier).toBeDefined();
      expect(HOOK_TEMPLATES.securityScan).toBeDefined();
      expect(HOOK_TEMPLATES.fullChain).toBeDefined();
    });

    it("has valid configurations", () => {
      for (const [, hook] of Object.entries(HOOK_TEMPLATES)) {
        const result = validateHook(hook);
        expect(result.valid).toBe(true);
      }
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration", () => {
  it("demonstrates the compounding advantage", () => {
    const result = calculateCompounding(SIX_GATE_STACK);

    // Linear thinking: 10% + 15% + 20% + 15% + 20% + 25% = 105%
    expect(result.linearExpectation).toBeCloseTo(1.05, 2);

    // Compounding reality: should be significantly higher
    expect(result.multiplicativeResult).toBeGreaterThan(1.5);

    // Compounding bonus: the extra improvement from multiplication
    expect(result.compoundingBonus).toBeGreaterThan(0.5);

    console.log(`
=== Compounding Demo ===
Linear expectation: ${(result.linearExpectation * 100).toFixed(0)}%
Multiplicative result: ${(result.multiplicativeResult * 100).toFixed(0)}%
Compounding bonus: +${(result.compoundingBonus * 100).toFixed(0)}%
    `.trim());
  });

  it("demonstrates state space reduction", () => {
    const gates = SIX_GATE_STACK.slice(0, 3); // Types, Linting, Tests
    const stages = calculateStateSpaceReduction(1_000_000, gates);

    // Should dramatically reduce the state space
    const finalStage = stages[stages.length - 1]!;
    const finalSize = finalStage.size;
    const reductionPercent = finalStage.cumulativeEliminated;

    expect(finalSize).toBeLessThan(1000); // From 1M to <1K
    expect(reductionPercent).toBeGreaterThan(99); // Over 99% eliminated

    console.log(`
=== State Space Reduction Demo ===
Initial: ${stages[0]!.size.toLocaleString()} implementations
After Types: ${stages[1]!.size.toLocaleString()} (${stages[1]!.cumulativeEliminated.toFixed(2)}% eliminated)
After Linting: ${stages[2]!.size.toLocaleString()} (${stages[2]!.cumulativeEliminated.toFixed(2)}% eliminated)
After Tests: ${stages[3]!.size.toLocaleString()} (${stages[3]!.cumulativeEliminated.toFixed(2)}% eliminated)
    `.trim());
  });

  it("demonstrates technical debt ROI", () => {
    const comparison = compareLintingStrategies(90); // 3 months

    // Early adoption should have massive ROI
    expect(comparison.lateAdoption.roi).toBeGreaterThan(25);
    expect(comparison.savings).toBeGreaterThan(50);

    console.log(`
=== Technical Debt ROI Demo ===
Late adoption cleanup: ${comparison.lateAdoption.cleanupTimeHours.toFixed(1)} hours
Early adoption cost: ${comparison.earlyAdoption.earlyAdoptionCost.toFixed(1)} hours
Time saved: ${comparison.savings.toFixed(1)} hours
ROI: ${comparison.lateAdoption.roi.toFixed(0)}x
Recommendation: ${comparison.recommendation}
    `.trim());
  });
});
