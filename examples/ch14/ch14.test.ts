/**
 * Chapter 14: Tests
 *
 * Tests for the Meta-Engineer Playbook code examples.
 */

import { describe, it, expect } from "bun:test";

// Import from workflow-converter
import {
  WORKFLOW_PATTERNS,
  analyzeWorkflow,
  generateScript,
  generateSlashCommand,
  calculateROI,
} from "./workflow-converter";

// Import from conversation-archiver
import {
  PRESERVATION_STRATEGIES,
  createArchiveEntry,
  generateKnowledgeBaseEntry,
  generateSpecTemplate,
  analyzePreservationValue,
} from "./conversation-archiver";

// Import from skill-auditor
import {
  ATROPHY_LADDER,
  LEVERAGE_STACK,
  determineLevel,
  generatePreventionPlan,
  calculateSkillHealth,
  runSkillAudit,
} from "./skill-auditor";

// Import from task-decomposer
import {
  TASK_SIZING_GUIDELINES,
  estimateTaskSize,
  formatAsTaskList,
  DECOMPOSITION_EXAMPLES,
} from "./task-decomposer";

// Import from meta-builder
import {
  AUTOMATION_LEVELS,
  DEFAULT_CONSTRAINTS,
  evaluateConstraints,
  calculateROI as calculateMetaROI,
  BUILDER_VS_META_BUILDER,
  generateConstraintCode,
} from "./meta-builder";

// =====================================================
// Workflow Converter Tests
// =====================================================

describe("Workflow Converter", () => {
  describe("WORKFLOW_PATTERNS", () => {
    it("should have predefined workflow patterns", () => {
      expect(WORKFLOW_PATTERNS).toBeDefined();
      expect(WORKFLOW_PATTERNS.testCycle).toBeDefined();
      expect(WORKFLOW_PATTERNS.deployStaging).toBeDefined();
      expect(WORKFLOW_PATTERNS.diagnostics).toBeDefined();
    });

    it("should have valid workflow structure", () => {
      const workflow = WORKFLOW_PATTERNS.testCycle;
      expect(workflow.name).toBe("Test Cycle");
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.timesUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("analyzeWorkflow", () => {
    it("should recommend conversion for frequently used workflows", () => {
      const workflow = WORKFLOW_PATTERNS.diagnostics; // 12 uses
      const analysis = analyzeWorkflow(workflow);

      expect(analysis.shouldConvert).toBe(true);
      expect(analysis.reason).toContain("12 times");
    });

    it("should identify deterministic and judgment steps", () => {
      const workflow = WORKFLOW_PATTERNS.testCycle;
      const analysis = analyzeWorkflow(workflow);

      expect(analysis.deterministic.length).toBeGreaterThan(0);
      expect(analysis.needsJudgment.length).toBeGreaterThanOrEqual(0);
    });

    it("should not recommend conversion for rarely used workflows", () => {
      const workflow = {
        ...WORKFLOW_PATTERNS.testCycle,
        timesUsed: 1,
      };
      const analysis = analyzeWorkflow(workflow);

      expect(analysis.shouldConvert).toBe(false);
      expect(analysis.reason).toContain("1 times");
    });

    it("should calculate time savings", () => {
      const workflow = WORKFLOW_PATTERNS.deployStaging;
      const analysis = analyzeWorkflow(workflow);

      expect(analysis.estimatedSavingsPerRun).toBeGreaterThan(0);
      expect(analysis.paybackRunCount).toBeGreaterThan(0);
    });
  });

  describe("generateScript", () => {
    it("should generate a valid bash script", () => {
      const workflow = WORKFLOW_PATTERNS.deployStaging;
      const analysis = analyzeWorkflow(workflow);
      const script = generateScript(workflow, analysis);

      expect(script).toContain("#!/bin/bash");
      expect(script).toContain("set -e");
      expect(script).toContain("echo");
    });

    it("should include workflow name in script", () => {
      const workflow = WORKFLOW_PATTERNS.testCycle;
      const analysis = analyzeWorkflow(workflow);
      const script = generateScript(workflow, analysis);

      expect(script).toContain("Test Cycle");
    });
  });

  describe("generateSlashCommand", () => {
    it("should generate a markdown command file", () => {
      const workflow = WORKFLOW_PATTERNS.deployStaging;
      const command = generateSlashCommand(workflow);

      expect(command).toContain(".claude/commands/");
      expect(command).toContain("./scripts/");
      expect(command).toContain(".sh");
    });
  });

  describe("calculateROI", () => {
    it("should calculate positive ROI for frequent workflows", () => {
      const workflow = WORKFLOW_PATTERNS.diagnostics;
      const analysis = analyzeWorkflow(workflow);
      const roi = calculateROI(workflow, analysis);

      expect(roi.weeklyHoursSaved).toBeGreaterThan(0);
      expect(roi.monthlyTokensSaved).toBeGreaterThan(0);
      expect(roi.breakEvenDays).toBeGreaterThan(0);
    });
  });
});

// =====================================================
// Conversation Archiver Tests
// =====================================================

describe("Conversation Archiver", () => {
  describe("PRESERVATION_STRATEGIES", () => {
    it("should define all four strategies", () => {
      expect(PRESERVATION_STRATEGIES.localArchive).toBeDefined();
      expect(PRESERVATION_STRATEGIES.gitCommits).toBeDefined();
      expect(PRESERVATION_STRATEGIES.extraction).toBeDefined();
      expect(PRESERVATION_STRATEGIES.cloudSync).toBeDefined();
    });

    it("should have pros and cons for each strategy", () => {
      const strategy = PRESERVATION_STRATEGIES.localArchive;
      expect(strategy.pros.length).toBeGreaterThan(0);
      expect(strategy.cons.length).toBeGreaterThan(0);
    });
  });

  describe("createArchiveEntry", () => {
    it("should create a valid archive entry", () => {
      const conversation = {
        id: "test-conv",
        feature: "Test Feature",
        messages: [
          { role: "user" as const, content: "Hello", timestamp: new Date() },
          { role: "assistant" as const, content: "Hi there", timestamp: new Date() },
        ],
        startTime: new Date(),
        endTime: new Date(),
      };

      const insights = {
        decisions: [],
        problems: [],
        patterns: [],
        claudeMdAdditions: [],
        regenerationPrompt: "",
      };

      const entry = createArchiveEntry(conversation, insights);

      expect(entry.id).toBe("test-conv");
      expect(entry.feature).toBe("Test Feature");
      expect(entry.messageCount).toBe(2);
      expect(entry.wordCount).toBeGreaterThan(0);
    });
  });

  describe("generateKnowledgeBaseEntry", () => {
    it("should generate markdown with all sections", () => {
      const entry = {
        id: "test",
        feature: "Auth System",
        timestamp: new Date().toISOString(),
        wordCount: 500,
        messageCount: 10,
        insights: {
          decisions: [
            {
              decision: "Use JWT",
              rationale: "Industry standard",
              alternatives: ["Sessions"],
            },
          ],
          problems: [],
          patterns: [],
          claudeMdAdditions: ["Use httpOnly cookies"],
          regenerationPrompt: "Implement JWT auth",
        },
      };

      const markdown = generateKnowledgeBaseEntry(entry);

      expect(markdown).toContain("# Session: Auth System");
      expect(markdown).toContain("## Key Decisions");
      expect(markdown).toContain("Use JWT");
      expect(markdown).toContain("## CLAUDE.md Additions");
      expect(markdown).toContain("## Regeneration Prompt");
    });
  });

  describe("generateSpecTemplate", () => {
    it("should generate a complete spec template", () => {
      const template = generateSpecTemplate("User Authentication");

      expect(template).toContain("# Feature: User Authentication");
      expect(template).toContain("## Requirements");
      expect(template).toContain("## Edge Cases");
      expect(template).toContain("## Success Criteria");
      expect(template).toContain("## Constraints");
    });
  });

  describe("analyzePreservationValue", () => {
    it("should rate high-value conversations correctly", () => {
      const conversation = {
        id: "test",
        feature: "Complex Decision",
        messages: Array(25)
          .fill(null)
          .map((_, i) => ({
            role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
            content:
              "We decided to use JWT for authentication because of the tradeoff between simplicity and scalability. The alternative was sessions but we chose JWT.",
            timestamp: new Date(),
          })),
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(),
      };

      const analysis = analyzePreservationValue(conversation);

      expect(analysis.value).toBe("high");
      expect(analysis.reasons.length).toBeGreaterThan(0);
    });

    it("should rate low-value conversations correctly", () => {
      const conversation = {
        id: "test",
        feature: "Simple Fix",
        messages: [
          { role: "user" as const, content: "Fix typo", timestamp: new Date() },
          { role: "assistant" as const, content: "Fixed", timestamp: new Date() },
        ],
        startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        endTime: new Date(),
      };

      const analysis = analyzePreservationValue(conversation);

      expect(analysis.value).toBe("low");
    });
  });
});

// =====================================================
// Skill Auditor Tests
// =====================================================

describe("Skill Auditor", () => {
  describe("ATROPHY_LADDER", () => {
    it("should define all 5 levels", () => {
      expect(ATROPHY_LADDER[1]).toBeDefined();
      expect(ATROPHY_LADDER[2]).toBeDefined();
      expect(ATROPHY_LADDER[3]).toBeDefined();
      expect(ATROPHY_LADDER[4]).toBeDefined();
      expect(ATROPHY_LADDER[5]).toBeDefined();
    });

    it("should mark level 4 as safe", () => {
      expect(ATROPHY_LADDER[4].riskLevel).toBe("safe");
    });

    it("should mark level 1 as danger", () => {
      expect(ATROPHY_LADDER[1].riskLevel).toBe("danger");
    });
  });

  describe("LEVERAGE_STACK", () => {
    it("should have 6 categories", () => {
      expect(LEVERAGE_STACK.length).toBe(6);
    });

    it("should mark understanding as keep-sharp", () => {
      const understanding = LEVERAGE_STACK.find(
        (s) => s.category === "understanding"
      );
      expect(understanding?.action).toBe("keep-sharp");
    });

    it("should mark boilerplate as good-riddance", () => {
      const boilerplate = LEVERAGE_STACK.find(
        (s) => s.category === "boilerplate"
      );
      expect(boilerplate?.action).toBe("good-riddance");
    });
  });

  describe("determineLevel", () => {
    it("should return level 5 for all checks passed", () => {
      const result = {
        canExplainWithoutLooking: true,
        canRewriteFromMemory: true,
        canReasonAboutWorstCase: true,
        canDefendTradeoffs: true,
      };

      expect(determineLevel(result)).toBe(5);
    });

    it("should return level 4 for most checks passed", () => {
      const result = {
        canExplainWithoutLooking: true,
        canRewriteFromMemory: false,
        canReasonAboutWorstCase: true,
        canDefendTradeoffs: true,
      };

      expect(determineLevel(result)).toBe(4);
    });

    it("should return level 1 for no checks passed", () => {
      const result = {
        canExplainWithoutLooking: false,
        canRewriteFromMemory: false,
        canReasonAboutWorstCase: false,
        canDefendTradeoffs: false,
      };

      expect(determineLevel(result)).toBe(1);
    });
  });

  describe("generatePreventionPlan", () => {
    it("should return urgent advice for level 1", () => {
      const plan = generatePreventionPlan(1);
      expect(plan.some((p) => p.includes("URGENT"))).toBe(true);
    });

    it("should return maintenance advice for level 5", () => {
      const plan = generatePreventionPlan(5);
      expect(plan.some((p) => p.includes("excellent"))).toBe(true);
    });
  });

  describe("calculateSkillHealth", () => {
    it("should return 100% for all checks passed", () => {
      const result = {
        canExplainWithoutLooking: true,
        canRewriteFromMemory: true,
        canReasonAboutWorstCase: true,
        canDefendTradeoffs: true,
      };

      const health = calculateSkillHealth(result);
      expect(health.score).toBe(100);
      expect(health.rating).toBe("Excellent");
    });

    it("should return danger rating for few checks passed", () => {
      const result = {
        canExplainWithoutLooking: false,
        canRewriteFromMemory: false,
        canReasonAboutWorstCase: false,
        canDefendTradeoffs: true,
      };

      const health = calculateSkillHealth(result);
      expect(health.score).toBe(25);
      expect(health.rating).toBe("Danger");
    });
  });

  describe("runSkillAudit", () => {
    it("should return complete audit results", () => {
      const result = {
        canExplainWithoutLooking: true,
        canRewriteFromMemory: true,
        canReasonAboutWorstCase: true,
        canDefendTradeoffs: true,
      };

      const audit = runSkillAudit("caching system", result);

      expect(audit.level).toBeDefined();
      expect(audit.health).toBeDefined();
      expect(audit.preventionPlan).toBeDefined();
      expect(audit.leverageGuidance).toBeDefined();
    });
  });
});

// =====================================================
// Task Decomposer Tests
// =====================================================

describe("Task Decomposer", () => {
  describe("TASK_SIZING_GUIDELINES", () => {
    it("should define all size categories", () => {
      expect(TASK_SIZING_GUIDELINES.tooSmall).toBeDefined();
      expect(TASK_SIZING_GUIDELINES.optimal).toBeDefined();
      expect(TASK_SIZING_GUIDELINES.tooLarge).toBeDefined();
    });

    it("should have examples for each category", () => {
      expect(TASK_SIZING_GUIDELINES.optimal.examples.length).toBeGreaterThan(0);
    });
  });

  describe("estimateTaskSize", () => {
    it("should identify large tasks", () => {
      const analysis = estimateTaskSize(
        "Refactor the entire API from Express to Fastify, migrate all routes"
      );

      expect(analysis.size).toBe("too-large");
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it("should identify optimal tasks", () => {
      const analysis = estimateTaskSize("Add validation to the login form");

      expect(analysis.size).toBe("optimal");
    });

    it("should warn about multiple actions", () => {
      // Input with multiple different action words: "and", "then", "also", "plus", ","
      const analysis = estimateTaskSize(
        "Build the feature, and test it, then deploy it, also monitor it, plus log everything"
      );

      expect(analysis.warnings.some((w) => w.includes("Multiple actions"))).toBe(
        true
      );
    });
  });

  describe("formatAsTaskList", () => {
    it("should format decomposition as markdown", () => {
      const result = {
        originalTask: "Test task",
        analysis: {
          size: "too-large" as const,
          estimatedSteps: 50,
          warnings: ["Too big"],
          suggestions: ["Split it"],
          canParallelize: false,
        },
        tasks: [
          {
            id: "task-1",
            title: "First task",
            description: "Do the first thing",
            estimatedSteps: 5,
            dependencies: [],
            parallelizable: false,
            complexity: "simple" as const,
          },
        ],
        executionOrder: [["task-1"]],
        estimatedTimeMinutes: 15,
      };

      const markdown = formatAsTaskList(result);

      expect(markdown).toContain("# Task Decomposition");
      expect(markdown).toContain("## Original Task");
      expect(markdown).toContain("## Analysis");
      expect(markdown).toContain("## Decomposed Tasks");
    });
  });

  describe("DECOMPOSITION_EXAMPLES", () => {
    it("should have a bad example", () => {
      expect(DECOMPOSITION_EXAMPLES.bad).toBeDefined();
      expect(DECOMPOSITION_EXAMPLES.bad.analysis.size).toBe("too-large");
    });

    it("should have good decomposition with multiple tasks", () => {
      expect(DECOMPOSITION_EXAMPLES.good.length).toBeGreaterThan(3);
    });

    it("should have tasks with dependencies", () => {
      const tasksWithDeps = DECOMPOSITION_EXAMPLES.good.filter(
        (t) => t.dependencies.length > 0
      );
      expect(tasksWithDeps.length).toBeGreaterThan(0);
    });
  });
});

// =====================================================
// Meta-Builder Tests
// =====================================================

describe("Meta-Builder", () => {
  describe("AUTOMATION_LEVELS", () => {
    it("should define all 4 levels (0-3)", () => {
      expect(AUTOMATION_LEVELS.length).toBe(4);
      expect(AUTOMATION_LEVELS[0]!.level).toBe(0);
      expect(AUTOMATION_LEVELS[3]!.level).toBe(3);
    });

    it("should mark level 1 as where most stop", () => {
      const level1 = AUTOMATION_LEVELS.find((l) => l.level === 1);
      expect(level1?.mostStopHere).toBe(true);
    });

    it("should show increasing productivity", () => {
      expect(AUTOMATION_LEVELS[0]!.productivity).toContain("1x");
      expect(AUTOMATION_LEVELS[3]!.productivity).toContain("100");
    });
  });

  describe("DEFAULT_CONSTRAINTS", () => {
    it("should have performance constraints", () => {
      expect(DEFAULT_CONSTRAINTS.performance.p99LatencyMs).toBe(100);
      expect(DEFAULT_CONSTRAINTS.performance.maxMemoryMb).toBe(512);
    });

    it("should have correctness constraints", () => {
      expect(DEFAULT_CONSTRAINTS.correctness.noDataLoss).toBe(true);
      expect(DEFAULT_CONSTRAINTS.correctness.transactionsAtomic).toBe(true);
    });

    it("should have security constraints", () => {
      expect(DEFAULT_CONSTRAINTS.security.authRequired).toBe(true);
      expect(DEFAULT_CONSTRAINTS.security.rateLimitEnforced).toBe(true);
    });
  });

  describe("evaluateConstraints", () => {
    it("should pass when all constraints met", () => {
      const metrics = {
        latencyP99Ms: 50,
        memoryUsedMb: 300,
        cpuPercent: 40,
        dataLossEvents: 0,
        nonAtomicTransactions: 0,
        nonIdempotentOps: 0,
        unauthenticatedRequests: 0,
        rateLimitBypasses: 0,
        unvalidatedInputs: 0,
      };

      const result = evaluateConstraints(DEFAULT_CONSTRAINTS, metrics);

      expect(result.constraintsPassed).toBe(true);
      expect(result.failures.length).toBe(0);
    });

    it("should fail on latency violation", () => {
      const metrics = {
        latencyP99Ms: 200, // Over 100ms limit
        memoryUsedMb: 300,
        cpuPercent: 40,
        dataLossEvents: 0,
        nonAtomicTransactions: 0,
        nonIdempotentOps: 0,
        unauthenticatedRequests: 0,
        rateLimitBypasses: 0,
        unvalidatedInputs: 0,
      };

      const result = evaluateConstraints(DEFAULT_CONSTRAINTS, metrics);

      expect(result.constraintsPassed).toBe(false);
      expect(result.failures.some((f) => f.constraint === "p99 latency")).toBe(
        true
      );
    });

    it("should fail on security violation", () => {
      const metrics = {
        latencyP99Ms: 50,
        memoryUsedMb: 300,
        cpuPercent: 40,
        dataLossEvents: 0,
        nonAtomicTransactions: 0,
        nonIdempotentOps: 0,
        unauthenticatedRequests: 5, // Security violation
        rateLimitBypasses: 0,
        unvalidatedInputs: 0,
      };

      const result = evaluateConstraints(DEFAULT_CONSTRAINTS, metrics);

      expect(result.constraintsPassed).toBe(false);
      expect(
        result.failures.some((f) => f.constraint === "authentication required")
      ).toBe(true);
    });

    it("should provide suggestions for failures", () => {
      const metrics = {
        latencyP99Ms: 200,
        memoryUsedMb: 600,
        cpuPercent: 90,
        dataLossEvents: 0,
        nonAtomicTransactions: 0,
        nonIdempotentOps: 0,
        unauthenticatedRequests: 0,
        rateLimitBypasses: 0,
        unvalidatedInputs: 0,
      };

      const result = evaluateConstraints(DEFAULT_CONSTRAINTS, metrics);

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("calculateROI (meta)", () => {
    it("should recommend build for high-frequency tasks", () => {
      const roi = calculateMetaROI(
        "API endpoint scaffolding",
        30, // 30 min per task
        10, // 10 times per week
        90, // 90% automation
        4 // 4 hours to build
      );

      expect(roi.recommendation).toBe("build");
      expect(roi.paybackWeeks).toBeLessThan(2);
    });

    it("should recommend keep-ad-hoc for rare tasks", () => {
      const roi = calculateMetaROI(
        "Annual report generation",
        60, // 1 hour
        0.1, // Once every 10 weeks
        50, // 50% automation
        8 // 8 hours to build
      );

      expect(roi.recommendation).toBe("keep-ad-hoc");
    });

    it("should calculate yearly savings", () => {
      const roi = calculateMetaROI("Test task", 30, 5, 80, 2);

      expect(roi.yearlyHoursSaved).toBeGreaterThan(0);
    });
  });

  describe("BUILDER_VS_META_BUILDER", () => {
    it("should have comparisons", () => {
      expect(BUILDER_VS_META_BUILDER.length).toBeGreaterThan(0);
    });

    it("should show builder and meta-builder columns", () => {
      const first = BUILDER_VS_META_BUILDER[0]!;
      expect(first.builder).toBeDefined();
      expect(first.metaBuilder).toBeDefined();
    });
  });

  describe("generateConstraintCode", () => {
    it("should generate valid TypeScript code", () => {
      const code = generateConstraintCode(DEFAULT_CONSTRAINTS);

      expect(code).toContain("export const SystemConstraints");
      expect(code).toContain("performance:");
      expect(code).toContain("correctness:");
      expect(code).toContain("security:");
      expect(code).toContain("p99LatencyMs: 100");
    });
  });
});

// =====================================================
// Integration Tests
// =====================================================

describe("Integration", () => {
  it("should have consistent atrophy level definitions", () => {
    // Level 4 should be safe in both systems
    expect(ATROPHY_LADDER[4].riskLevel).toBe("safe");
    expect(ATROPHY_LADDER[4].careerCeiling).toContain("Senior");
  });

  it("should align leverage stack with skill auditor", () => {
    const keepSharp = LEVERAGE_STACK.filter((s) => s.action === "keep-sharp");
    expect(keepSharp.length).toBe(3); // understanding, design, verification
  });

  it("should connect workflow analysis to ROI calculation", () => {
    const workflow = WORKFLOW_PATTERNS.diagnostics;
    const analysis = analyzeWorkflow(workflow);

    expect(analysis.shouldConvert).toBe(true);
    expect(analysis.estimatedSavingsPerRun).toBeGreaterThan(0);
  });

  it("should connect task decomposition to automation levels", () => {
    // Large tasks should be decomposed (meta-engineering)
    const badTask = DECOMPOSITION_EXAMPLES.bad;
    expect(badTask.analysis.size).toBe("too-large");

    // Good decomposition enables parallel execution (higher automation)
    const goodTasks = DECOMPOSITION_EXAMPLES.good;
    const parallelizable = goodTasks.filter((t) => t.parallelizable);
    expect(parallelizable.length).toBeGreaterThan(0);
  });
});
