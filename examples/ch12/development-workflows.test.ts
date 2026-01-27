/**
 * Tests for Chapter 12: Development Workflows
 *
 * Tests cover:
 * - Plan mode session utilities
 * - Incremental development patterns
 * - Script capture and generation
 * - Playwright automation helpers
 * - AST-grep pattern utilities
 */

import { describe, test, expect } from "vitest";

// Plan Mode imports
import {
  validatePlan,
  shouldUsePlanMode,
  type PlanDocument,
} from "./plan-mode-session";

// Incremental Development imports
import {
  calculateErrorProbability,
  compareApproaches,
  validateIncrementDependencies,
  EXAMPLE_AUTH_INCREMENTS,
} from "./incremental-development";

// Script Capture imports
import {
  shouldConvertToScript,
  generateBashScript,
  generateTypeScriptScript,
  generateSlashCommand,
  compareWorkflowApproaches,
  EXAMPLE_WORKFLOWS,
} from "./script-capture";

// Playwright Automation imports
import {
  generatePlaywrightScript,
  compareApproaches as comparePlaywrightApproaches,
  analyzeTestFailures,
  generatePlaywrightConfig,
  EXAMPLE_SPECS,
} from "./playwright-automation";

// AST-Grep imports
import {
  generateAstGrepCommand,
  compareSearchApproaches,
  validateRefactorRule,
  generateYamlRule,
  recommendSearchTool,
  COMMON_PATTERNS,
  COMMON_REFACTORS,
} from "./ast-grep-refactor";

// ============================================================
// Plan Mode Session Tests
// ============================================================

describe("Plan Mode Session", () => {
  describe("validatePlan", () => {
    test("validates complete plan as valid", () => {
      const plan: PlanDocument = {
        feature: "User authentication with JWT tokens",
        architecture: {
          approach: "Stateless JWT with refresh tokens",
          rationale: "Better scalability for distributed systems",
        },
        dependencies: ["jsonwebtoken", "bcrypt"],
        files: {
          create: ["auth/jwt.ts", "auth/service.ts"],
          modify: ["routes/user.ts"],
        },
        steps: [
          {
            number: 1,
            description: "Create JWT utility functions",
            output: "auth/jwt.ts",
            verification: "Unit tests pass",
          },
          {
            number: 2,
            description: "Implement auth service",
            output: "auth/service.ts",
            verification: "Integration tests pass",
          },
        ],
        risks: ["Token expiration handling", "Key rotation"],
        testStrategy: "Unit tests for JWT utilities, integration tests for auth flow, E2E for login/logout",
      };

      const result = validatePlan(plan);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test("identifies missing feature description", () => {
      const plan: PlanDocument = {
        feature: "short",
        architecture: { approach: "test", rationale: "test" },
        dependencies: [],
        files: { create: [], modify: [] },
        steps: [{ number: 1, description: "test", output: "test", verification: "test" }],
        risks: [],
        testStrategy: "Comprehensive test coverage including unit and integration tests",
      };

      const result = validatePlan(plan);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Feature description too short or missing");
    });

    test("identifies missing steps", () => {
      const plan: PlanDocument = {
        feature: "A feature with sufficient description",
        architecture: { approach: "test", rationale: "test" },
        dependencies: [],
        files: { create: [], modify: [] },
        steps: [],
        risks: [],
        testStrategy: "Comprehensive test coverage including unit and integration tests",
      };

      const result = validatePlan(plan);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("No implementation steps defined");
    });

    test("identifies missing step verification", () => {
      const plan: PlanDocument = {
        feature: "A feature with sufficient description",
        architecture: { approach: "test", rationale: "test" },
        dependencies: [],
        files: { create: [], modify: [] },
        steps: [{ number: 1, description: "test", output: "test", verification: "" }],
        risks: [],
        testStrategy: "Comprehensive test coverage including unit and integration tests",
      };

      const result = validatePlan(plan);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Step 1 missing verification criteria");
    });
  });

  describe("shouldUsePlanMode", () => {
    test("recommends plan mode for architectural changes", () => {
      const result = shouldUsePlanMode("Refactor the authentication system to use OAuth");
      expect(result.recommendation).toBe("plan");
      expect(result.complexitySignals).toContain("architectural change");
    });

    test("recommends plan mode for multi-file changes", () => {
      const result = shouldUsePlanMode("Update validation logic across multiple files");
      expect(result.recommendation).toBe("plan");
      expect(result.complexitySignals).toContain("multi-file change");
    });

    test("recommends plan mode for security-sensitive changes", () => {
      const result = shouldUsePlanMode("Implement user authentication");
      expect(result.recommendation).toBe("plan");
      expect(result.complexitySignals).toContain("security-sensitive");
    });

    test("recommends immediate mode for typo fixes", () => {
      const result = shouldUsePlanMode("Fix typo in the README");
      expect(result.recommendation).toBe("immediate");
    });

    test("recommends immediate mode for documentation", () => {
      const result = shouldUsePlanMode("Add comment to explain the function");
      expect(result.recommendation).toBe("immediate");
    });

    test("recommends plan mode for database changes", () => {
      const result = shouldUsePlanMode("Add new database migration for user roles");
      expect(result.recommendation).toBe("plan");
      expect(result.complexitySignals).toContain("data layer change");
    });
  });
});

// ============================================================
// Incremental Development Tests
// ============================================================

describe("Incremental Development", () => {
  describe("calculateErrorProbability", () => {
    test("calculates probability for small code", () => {
      const prob = calculateErrorProbability(100);
      expect(prob).toBeCloseTo(0.1, 2);
    });

    test("calculates probability for medium code", () => {
      const prob = calculateErrorProbability(500);
      expect(prob).toBeGreaterThan(0.4);
      expect(prob).toBeLessThan(0.5);
    });

    test("calculates probability for large code", () => {
      const prob = calculateErrorProbability(1000);
      expect(prob).toBeGreaterThan(0.6);
      expect(prob).toBeLessThan(0.7);
    });

    test("custom error rate affects probability", () => {
      const lowRate = calculateErrorProbability(100, 0.05);
      const highRate = calculateErrorProbability(100, 0.2);
      expect(lowRate).toBeLessThan(highRate);
    });
  });

  describe("compareApproaches", () => {
    test("shows incremental has lower per-step error rate", () => {
      const result = compareApproaches(1000, 50);

      expect(result.bigBang.lines).toBe(1000);
      expect(result.bigBang.errorProbability).toBeGreaterThan(0.6);

      expect(result.incremental.increments).toBe(20);
      expect(result.incremental.avgErrorProb).toBeLessThan(0.1);
    });

    test("generates readable improvement description", () => {
      const result = compareApproaches(1000, 50);
      expect(result.improvement).toContain("1000 lines");
      expect(result.improvement).toContain("50-line increment");
    });
  });

  describe("validateIncrementDependencies", () => {
    test("validates example auth increments", () => {
      const result = validateIncrementDependencies(EXAMPLE_AUTH_INCREMENTS);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test("detects non-existent dependencies", () => {
      const increments = [
        { number: 1, description: "Step 1", expectedOutput: "", verificationCriteria: [] },
        { number: 2, description: "Step 2", expectedOutput: "", verificationCriteria: [], dependsOn: [99] },
      ];

      const result = validateIncrementDependencies(increments);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Increment 2 depends on non-existent increment 99");
    });

    test("detects forward dependencies", () => {
      const increments = [
        { number: 1, description: "Step 1", expectedOutput: "", verificationCriteria: [], dependsOn: [2] },
        { number: 2, description: "Step 2", expectedOutput: "", verificationCriteria: [] },
      ];

      const result = validateIncrementDependencies(increments);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Increment 1 depends on later increment 2");
    });

    test("detects self-dependencies", () => {
      const increments = [
        { number: 1, description: "Step 1", expectedOutput: "", verificationCriteria: [], dependsOn: [1] },
      ];

      const result = validateIncrementDependencies(increments);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Increment 1 depends on itself");
    });
  });

  test("EXAMPLE_AUTH_INCREMENTS has correct structure", () => {
    expect(EXAMPLE_AUTH_INCREMENTS.length).toBe(8);
    expect(EXAMPLE_AUTH_INCREMENTS[0]!.description).toContain("User interface");
    expect(EXAMPLE_AUTH_INCREMENTS[7]!.description).toContain("unit tests");
  });
});

// ============================================================
// Script Capture Tests
// ============================================================

describe("Script Capture", () => {
  describe("shouldConvertToScript", () => {
    test("detects repeated similar prompts", () => {
      // Use identical prompts to ensure detection (real-world would have slight variations)
      const history = [
        "run tests fix failures then lint",
        "run tests fix failures then lint",
        "run tests fix failures then lint",
        "something completely different",
      ];

      const result = shouldConvertToScript(history);
      expect(result.shouldConvert).toBe(true);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    test("returns false for no repeated prompts", () => {
      const history = [
        "Implement user authentication",
        "Add logging to the API",
        "Fix the checkout bug",
      ];

      const result = shouldConvertToScript(history);
      expect(result.shouldConvert).toBe(false);
    });

    test("requires 3+ repetitions", () => {
      const history = [
        "Run tests and fix",
        "Run tests and fix issues",
      ];

      const result = shouldConvertToScript(history);
      expect(result.shouldConvert).toBe(false);
    });
  });

  describe("generateBashScript", () => {
    test("generates valid bash script structure", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const script = generateBashScript(workflow);

      expect(script).toContain("#!/bin/bash");
      expect(script).toContain("set -e");
      expect(script).toContain(workflow.name);
    });

    test("includes all workflow steps", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const script = generateBashScript(workflow);

      workflow.steps.forEach((step) => {
        expect(script).toContain(step.description);
      });
    });
  });

  describe("generateTypeScriptScript", () => {
    test("generates valid TypeScript structure", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const script = generateTypeScriptScript(workflow);

      expect(script).toContain("import { execSync }");
      expect(script).toContain("export async function");
      expect(script).toContain("WorkflowResult");
    });

    test("includes step execution logic", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const script = generateTypeScriptScript(workflow);

      expect(script).toContain("runStep");
      expect(script).toContain("success: true");
    });
  });

  describe("generateSlashCommand", () => {
    test("generates markdown command file", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const command = generateSlashCommand(workflow, "scripts/deploy.sh");

      expect(command).toContain(`# ${workflow.name}`);
      expect(command).toContain("./scripts/deploy.sh");
      expect(command).toContain("Report the outcome");
    });
  });

  describe("compareWorkflowApproaches", () => {
    test("shows time savings with scripted approach", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const comparison = compareWorkflowApproaches(workflow, 10);

      expect(comparison.scripted.averageTime).toBeLessThan(comparison.adHoc.averageTime);
      expect(comparison.scripted.tokenCost).toBe(0);
      expect(comparison.savings.timePercent).toBeGreaterThan(0);
    });

    test("calculates token cost for ad-hoc", () => {
      const workflow = EXAMPLE_WORKFLOWS[0]!;
      const comparison = compareWorkflowApproaches(workflow, 10);

      expect(comparison.adHoc.tokenCost).toBeGreaterThan(0);
      expect(comparison.savings.tokenCost).toBe(comparison.adHoc.tokenCost);
    });
  });
});

// ============================================================
// Playwright Automation Tests
// ============================================================

describe("Playwright Automation", () => {
  describe("generatePlaywrightScript", () => {
    test("generates valid Playwright test structure", () => {
      const spec = EXAMPLE_SPECS[0]!;
      const script = generatePlaywrightScript(spec);

      expect(script).toContain("import { test, expect }");
      expect(script).toContain(`test('${spec.name}'`);
      expect(script).toContain("async ({ page })");
    });

    test("includes all step actions", () => {
      const spec = EXAMPLE_SPECS[0]!;
      const script = generatePlaywrightScript(spec);

      expect(script).toContain("page.goto");
      expect(script).toContain("page.fill");
      expect(script).toContain("page.click");
    });

    test("handles different action types", () => {
      const spec = EXAMPLE_SPECS[0]!;
      const script = generatePlaywrightScript(spec);

      // Check that waitFor and assert are handled
      expect(script).toContain("waitForURL");
      expect(script).toContain("expect");
    });
  });

  describe("compareApproaches (Playwright)", () => {
    test("shows MCP is slower than script", () => {
      const comparison = comparePlaywrightApproaches(10);

      expect(comparison.mcpApproach.estimatedTime).toBeGreaterThan(comparison.scriptApproach.estimatedTime);
      expect(comparison.speedup).toBeGreaterThan(1);
    });

    test("MCP finds issues one at a time", () => {
      const comparison = comparePlaywrightApproaches(10);

      expect(comparison.mcpApproach.issuesFoundAt).toBe("one-at-a-time");
      expect(comparison.scriptApproach.issuesFoundAt).toBe("all-at-once");
    });

    test("calculates reasonable speedup", () => {
      const comparison = comparePlaywrightApproaches(10);
      // Script should be roughly 5-15x faster
      expect(comparison.speedup).toBeGreaterThan(5);
      expect(comparison.speedup).toBeLessThan(20);
    });
  });

  describe("analyzeTestFailures", () => {
    test("returns success message for all passing", () => {
      const results = [
        { testName: "test1", passed: true, duration: 1000, failures: [] },
        { testName: "test2", passed: true, duration: 1000, failures: [] },
      ];

      const analysis = analyzeTestFailures(results);
      expect(analysis.summary).toContain("All 2 tests passed");
      expect(analysis.fixes).toHaveLength(0);
      expect(analysis.priority).toBe("low");
    });

    test("identifies element not found issues", () => {
      const results = [
        { testName: "test1", passed: false, duration: 1000, failures: ["element not found: #submit"] },
      ];

      const analysis = analyzeTestFailures(results);
      expect(analysis.fixes).toContain("Add data-testid attributes to target elements");
    });

    test("identifies timeout issues", () => {
      const results = [
        { testName: "test1", passed: false, duration: 30000, failures: ["timeout waiting for selector"] },
      ];

      const analysis = analyzeTestFailures(results);
      expect(analysis.fixes).toContain("Increase timeout or add explicit waitFor steps");
    });

    test("sets high priority for many failures", () => {
      const results = [
        { testName: "test1", passed: false, duration: 1000, failures: ["error"] },
        { testName: "test2", passed: false, duration: 1000, failures: ["error"] },
        { testName: "test3", passed: true, duration: 1000, failures: [] },
      ];

      const analysis = analyzeTestFailures(results);
      expect(analysis.priority).toBe("high");
    });
  });

  describe("generatePlaywrightConfig", () => {
    test("generates valid config", () => {
      const config = generatePlaywrightConfig();

      expect(config).toContain("defineConfig");
      expect(config).toContain("timeout");
      expect(config).toContain("headless");
      expect(config).toContain("reporter");
    });
  });
});

// ============================================================
// AST-Grep Refactor Tests
// ============================================================

describe("AST-Grep Refactor", () => {
  describe("generateAstGrepCommand", () => {
    test("generates basic command", () => {
      const pattern = COMMON_PATTERNS[0]!;
      const cmd = generateAstGrepCommand(pattern);

      expect(cmd).toContain("ast-grep");
      expect(cmd).toContain("--pattern");
      expect(cmd).toContain(pattern.pattern);
    });

    test("includes language flag", () => {
      const pattern = COMMON_PATTERNS[0]!;
      const cmd = generateAstGrepCommand(pattern);

      expect(cmd).toContain(`--lang ${pattern.language}`);
    });

    test("adds json flag when requested", () => {
      const pattern = COMMON_PATTERNS[0]!;
      const cmd = generateAstGrepCommand(pattern, { json: true });

      expect(cmd).toContain("--json");
    });

    test("adds rewrite flag when provided", () => {
      const pattern = COMMON_PATTERNS[0]!;
      const cmd = generateAstGrepCommand(pattern, { rewrite: "replacement" });

      expect(cmd).toContain("--rewrite 'replacement'");
      expect(cmd).toContain("--update-all");
    });
  });

  describe("compareSearchApproaches", () => {
    test("shows text search has false positives", () => {
      const snippets = [
        { code: "fetchUserData(userId)", isTarget: true },
        { code: "// fetchUserData is deprecated", isTarget: false },
        { code: 'console.log("fetchUserData")', isTarget: false },
      ];

      const comparison = compareSearchApproaches(snippets, "fetchUserData", "fetchUserData($$$)");

      expect(comparison.textSearch.totalMatches).toBe(3);
      expect(comparison.textSearch.truePositives).toBe(1);
      expect(comparison.textSearch.falsePositives).toBe(2);
    });

    test("AST-grep has no false positives", () => {
      const snippets = [
        { code: "fetchUserData(userId)", isTarget: true },
        { code: "// fetchUserData is deprecated", isTarget: false },
      ];

      const comparison = compareSearchApproaches(snippets, "fetchUserData", "fetchUserData($$$)");

      expect(comparison.astGrep.falsePositives).toBe(0);
      expect(comparison.astGrep.precision).toBe(1.0);
    });
  });

  describe("validateRefactorRule", () => {
    test("validates correct rule", () => {
      const rule = COMMON_REFACTORS[0]!;
      const result = validateRefactorRule(rule);

      expect(result.valid).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    test("detects missing metavariable in find pattern", () => {
      const rule = {
        id: "bad-rule",
        description: "Invalid rule",
        language: "typescript" as const,
        findPattern: "console.log()",
        replacePattern: "",
        testCases: [{ input: "console.log()", expectedOutput: "" }],
      };

      const result = validateRefactorRule(rule);
      expect(result.valid).toBe(false);
      expect(result.failures).toContain("findPattern should contain at least one metavariable ($)");
    });

    test("detects undefined metavariable in replace pattern", () => {
      const rule = {
        id: "bad-rule",
        description: "Invalid rule",
        language: "typescript" as const,
        findPattern: "foo($A)",
        replacePattern: "bar($B)",
        testCases: [{ input: "foo(x)", expectedOutput: "bar(x)" }],
      };

      const result = validateRefactorRule(rule);
      expect(result.valid).toBe(false);
      expect(result.failures).toContain("Metavariable $B in replacePattern not found in findPattern");
    });

    test("detects missing test cases", () => {
      const rule = {
        id: "no-tests",
        description: "Rule without tests",
        language: "typescript" as const,
        findPattern: "foo($A)",
        replacePattern: "bar($A)",
        testCases: [],
      };

      const result = validateRefactorRule(rule);
      expect(result.valid).toBe(false);
      expect(result.failures).toContain("Rule should have at least one test case");
    });
  });

  describe("generateYamlRule", () => {
    test("generates valid YAML structure", () => {
      const rule = COMMON_REFACTORS[0]!;
      const yaml = generateYamlRule(rule);

      expect(yaml).toContain(`id: ${rule.id}`);
      expect(yaml).toContain(`language: ${rule.language}`);
      expect(yaml).toContain("rule:");
      expect(yaml).toContain("pattern:");
      expect(yaml).toContain("fix:");
      expect(yaml).toContain("message:");
    });
  });

  describe("recommendSearchTool", () => {
    test("recommends ast-grep for refactoring", () => {
      const result = recommendSearchTool("function fetchData", "refactoring");
      expect(result.tool).toBe("ast-grep");
    });

    test("recommends ast-grep for precision search", () => {
      const result = recommendSearchTool("console.log", "precision-search");
      expect(result.tool).toBe("ast-grep");
    });

    test("recommends grep for exploration with non-code query", () => {
      const result = recommendSearchTool("TODO: fix this", "exploration");
      expect(result.tool).toBe("grep");
    });

    test("recommends ast-grep for code patterns in exploration", () => {
      const result = recommendSearchTool("async function getData", "exploration");
      expect(result.tool).toBe("ast-grep");
    });
  });

  test("COMMON_PATTERNS has expected entries", () => {
    expect(COMMON_PATTERNS.length).toBeGreaterThan(0);

    const patternNames = COMMON_PATTERNS.map((p) => p.name);
    expect(patternNames).toContain("async-function");
    expect(patternNames).toContain("useState-destructure");
    expect(patternNames).toContain("console-log");
  });

  test("COMMON_REFACTORS has expected entries", () => {
    expect(COMMON_REFACTORS.length).toBeGreaterThan(0);

    const ruleIds = COMMON_REFACTORS.map((r) => r.id);
    expect(ruleIds).toContain("fetch-to-apiclient");
    expect(ruleIds).toContain("remove-console-log");
  });
});
