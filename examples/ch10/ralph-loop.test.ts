/**
 * Chapter 10: The RALPH Loop - Tests
 *
 * Tests for the RALPH loop examples demonstrating fresh context iteration,
 * task management, clean slate recovery, and memory architecture.
 */

import { describe, expect, test } from "bun:test";

// Import from ralph-loop.ts
import {
  parseTasksFile,
  getNextTask,
  markTaskComplete,
  serializeTasksFile,
  buildIterationPrompt,
  appendLearnings,
  createDefaultConfig,
  createOvernightConfig,
  type Task,
  type TaskFile,
} from "./ralph-loop";

// Import from task-management.ts
import {
  assessAutonomousReadiness,
  isAutonomousReady,
  calculateAutonomyScore,
  estimateContextWindows,
  suggestDecomposition,
  calculatePriority,
  sortByPriority,
  buildTaskQueue,
  getNextAutonomousTask,
  generateTaskTemplate,
  WELL_SIZED_EXAMPLES,
  OVERSIZED_EXAMPLES,
  type AutonomousTask,
} from "./task-management";

// Import from clean-slate-recovery.ts
import {
  analyzeTrajectory,
  extractConstraints,
  performRootCauseAnalysis,
  buildCleanSlateFrame,
  suggestNewDirection,
  formatCleanSlatePrompt,
  calculateCostComparison,
  shouldTriggerCleanSlate,
  type Trajectory,
  type Attempt,
} from "./clean-slate-recovery";

// Import from memory-architecture.ts
import {
  parseGitLog,
  getRecentCommits,
  searchGitHistory,
  extractLearningsFromCommits,
  parseAgentsDocument,
  generateAgentsDocument,
  addPattern,
  addLearning,
  recordMistake,
  parseTasksMarkdown,
  calculateTaskStats,
  modelFlywheelEffect,
  type AgentsDocument,
  type DocumentedMistake,
} from "./memory-architecture";

// ============================================================================
// RALPH LOOP TESTS
// ============================================================================

describe("RALPH Loop", () => {
  describe("parseTasksFile", () => {
    test("parses markdown checkbox format", () => {
      const content = `# Tasks

- [ ] Task one
- [x] Task two (Completed: 2025-01-15)
- [ ] Task three`;

      const result = parseTasksFile(content);
      expect(result.tasks.length).toBe(3);
      expect(result.metadata.totalTasks).toBe(3);
    });

    test("identifies completed tasks", () => {
      const content = `# Tasks
- [x] Completed task (Completed: 2025-01-15)
- [ ] Pending task`;

      const result = parseTasksFile(content);
      expect(result.metadata.completedTasks).toBe(1);
      expect(result.metadata.pendingTasks).toBe(1);
    });

    test("extracts completion dates", () => {
      const content = `- [x] Task with date (Completed: 2025-01-15)`;
      const result = parseTasksFile(content);
      expect(result.tasks[0]?.completedAt).toBe("2025-01-15");
    });

    test("handles empty content", () => {
      const result = parseTasksFile("");
      expect(result.tasks.length).toBe(0);
      expect(result.metadata.totalTasks).toBe(0);
    });
  });

  describe("getNextTask", () => {
    test("returns first pending task", () => {
      const taskFile: TaskFile = {
        tasks: [
          { id: "1", title: "Complete", status: "complete" },
          { id: "2", title: "Pending", status: "pending" },
          { id: "3", title: "Also pending", status: "pending" },
        ],
        metadata: { lastUpdated: "", totalTasks: 3, completedTasks: 1, pendingTasks: 2 },
      };

      const next = getNextTask(taskFile);
      expect(next?.id).toBe("2");
    });

    test("returns null when no pending tasks", () => {
      const taskFile: TaskFile = {
        tasks: [{ id: "1", title: "Complete", status: "complete" }],
        metadata: { lastUpdated: "", totalTasks: 1, completedTasks: 1, pendingTasks: 0 },
      };

      expect(getNextTask(taskFile)).toBeNull();
    });
  });

  describe("markTaskComplete", () => {
    test("marks task as complete", () => {
      const taskFile: TaskFile = {
        tasks: [{ id: "1", title: "Task", status: "pending" }],
        metadata: { lastUpdated: "", totalTasks: 1, completedTasks: 0, pendingTasks: 1 },
      };

      const result = markTaskComplete(taskFile, "1");
      expect(result.tasks[0]?.status).toBe("complete");
      expect(result.tasks[0]?.completedAt).toBeDefined();
    });

    test("updates metadata counts", () => {
      const taskFile: TaskFile = {
        tasks: [
          { id: "1", title: "Task 1", status: "pending" },
          { id: "2", title: "Task 2", status: "pending" },
        ],
        metadata: { lastUpdated: "", totalTasks: 2, completedTasks: 0, pendingTasks: 2 },
      };

      const result = markTaskComplete(taskFile, "1");
      expect(result.metadata.completedTasks).toBe(1);
      expect(result.metadata.pendingTasks).toBe(1);
    });
  });

  describe("serializeTasksFile", () => {
    test("serializes to markdown format", () => {
      const taskFile: TaskFile = {
        tasks: [
          { id: "1", title: "Pending task", status: "pending" },
          { id: "2", title: "Complete task", status: "complete", completedAt: "2025-01-15T00:00:00Z" },
        ],
        metadata: { lastUpdated: "", totalTasks: 2, completedTasks: 1, pendingTasks: 1 },
      };

      const result = serializeTasksFile(taskFile);
      expect(result).toContain("- [ ] Pending task");
      expect(result).toContain("- [x] Complete task");
    });
  });

  describe("buildIterationPrompt", () => {
    test("includes task information", () => {
      const task: Task = {
        id: "task-1",
        title: "Implement feature",
        status: "pending",
        acceptanceCriteria: ["Criteria 1", "Criteria 2"],
      };

      const prompt = buildIterationPrompt(task, "# AGENTS.md\nSome context");
      expect(prompt).toContain("task-1");
      expect(prompt).toContain("Implement feature");
      expect(prompt).toContain("Criteria 1");
    });

    test("includes AGENTS.md content", () => {
      const task: Task = { id: "1", title: "Task", status: "pending" };
      const prompt = buildIterationPrompt(task, "# AGENTS.md\nUse bun not npm");
      expect(prompt).toContain("Use bun not npm");
    });

    test("includes four-phase cycle instructions", () => {
      const task: Task = { id: "1", title: "Task", status: "pending" };
      const prompt = buildIterationPrompt(task, "");
      expect(prompt).toContain("PLAN");
      expect(prompt).toContain("WORK");
      expect(prompt).toContain("REVIEW");
      expect(prompt).toContain("COMPOUND");
    });
  });

  describe("appendLearnings", () => {
    test("adds learnings section", () => {
      const original = "# AGENTS.md\n\nSome content";
      const result = appendLearnings(original, ["Learning 1", "Learning 2"]);
      expect(result).toContain("Recent Learnings");
      expect(result).toContain("Learning 1");
      expect(result).toContain("Learning 2");
    });

    test("returns original if no learnings", () => {
      const original = "# AGENTS.md";
      const result = appendLearnings(original, []);
      expect(result).toBe(original);
    });
  });

  describe("Configuration", () => {
    test("default config has standard settings", () => {
      const config = createDefaultConfig();
      expect(config.maxIterations).toBe(0); // Unlimited
      expect(config.reviewEvery).toBe(6);
      expect(config.qualityGates.length).toBeGreaterThan(0);
    });

    test("overnight config has safety limits", () => {
      const config = createOvernightConfig();
      expect(config.maxIterations).toBe(50);
      expect(config.safetyProtocols.allowBreakingChanges).toBe(false);
      expect(config.safetyProtocols.excludePaths.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TASK MANAGEMENT TESTS
// ============================================================================

describe("Task Management", () => {
  const createSampleTask = (overrides: Partial<AutonomousTask> = {}): AutonomousTask => ({
    id: "task-1",
    title: "Sample task",
    description: "A sample task",
    labels: ["Ready-For-AI", "feature"],
    complexity: "moderate",
    acceptanceCriteria: ["Criterion 1", "Criterion 2"],
    context: {
      relatedFiles: ["src/file.ts", "tests/file.test.ts"],
      existingPatterns: ["pattern-1"],
      edgeCases: ["edge-1"],
      documentation: ["docs/file.md"],
    },
    successMetrics: ["Tests pass"],
    dependencies: [],
    blocks: [],
    priority: 50,
    estimatedContextWindows: 1,
    autonomousReady: false,
    ...overrides,
  });

  describe("assessAutonomousReadiness", () => {
    test("identifies acceptance criteria", () => {
      const task = createSampleTask();
      const criteria = assessAutonomousReadiness(task);
      expect(criteria.hasAcceptanceCriteria).toBe(true);
    });

    test("identifies architectural tasks", () => {
      const task = createSampleTask({ labels: ["architectural"] });
      const criteria = assessAutonomousReadiness(task);
      expect(criteria.noArchitecturalDecisions).toBe(false);
    });

    test("identifies test coverage", () => {
      const task = createSampleTask();
      const criteria = assessAutonomousReadiness(task);
      expect(criteria.hasTestCoverage).toBe(true);
    });

    test("identifies complexity", () => {
      const simple = createSampleTask({ complexity: "simple" });
      const complex = createSampleTask({ complexity: "complex" });

      expect(assessAutonomousReadiness(simple).appropriateComplexity).toBe(true);
      expect(assessAutonomousReadiness(complex).appropriateComplexity).toBe(false);
    });
  });

  describe("isAutonomousReady", () => {
    test("ready task with all criteria", () => {
      const task = createSampleTask();
      const { ready } = isAutonomousReady(task);
      expect(ready).toBe(true);
    });

    test("not ready without acceptance criteria", () => {
      const task = createSampleTask({ acceptanceCriteria: [] });
      const { ready, reason } = isAutonomousReady(task);
      expect(ready).toBe(false);
      expect(reason).toContain("acceptance criteria");
    });

    test("not ready for architectural tasks", () => {
      const task = createSampleTask({ labels: ["architectural"] });
      const { ready, reason } = isAutonomousReady(task);
      expect(ready).toBe(false);
      expect(reason).toContain("architectural");
    });

    test("not ready for breaking changes", () => {
      const task = createSampleTask({ labels: ["breaking-change"] });
      const { ready, reason } = isAutonomousReady(task);
      expect(ready).toBe(false);
      expect(reason).toContain("breaking");
    });

    test("security tasks require review", () => {
      const task = createSampleTask({ labels: ["security"] });
      const { ready, reason } = isAutonomousReady(task);
      expect(ready).toBe(false);
      expect(reason).toContain("Security");
    });
  });

  describe("calculateAutonomyScore", () => {
    test("higher score for well-prepared tasks", () => {
      const good = createSampleTask();
      const poor = createSampleTask({
        acceptanceCriteria: [],
        labels: ["architectural"],
        complexity: "complex",
      });

      expect(calculateAutonomyScore(good)).toBeGreaterThan(calculateAutonomyScore(poor));
    });

    test("score capped at 100", () => {
      const task = createSampleTask();
      expect(calculateAutonomyScore(task)).toBeLessThanOrEqual(100);
    });

    test("score minimum is 0", () => {
      const task = createSampleTask({
        acceptanceCriteria: [],
        labels: ["security", "architectural", "breaking-change"],
        complexity: "architectural",
        context: { relatedFiles: [], existingPatterns: [], edgeCases: [], documentation: [] },
      });
      expect(calculateAutonomyScore(task)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("estimateContextWindows", () => {
    test("trivial tasks need fewer windows", () => {
      const trivial = createSampleTask({ complexity: "trivial" });
      const complex = createSampleTask({ complexity: "complex" });

      expect(estimateContextWindows(trivial)).toBeLessThan(estimateContextWindows(complex));
    });

    test("more files increases estimate", () => {
      const few = createSampleTask();
      const many = createSampleTask({
        context: {
          ...createSampleTask().context,
          relatedFiles: Array(20).fill("file.ts"),
        },
      });

      expect(estimateContextWindows(many)).toBeGreaterThan(estimateContextWindows(few));
    });
  });

  describe("suggestDecomposition", () => {
    test("no decomposition for small tasks", () => {
      const task = createSampleTask({ estimatedContextWindows: 1 });
      expect(suggestDecomposition(task)).toHaveLength(0);
    });

    test("suggests splitting by criteria", () => {
      const task = createSampleTask({
        estimatedContextWindows: 5,
        acceptanceCriteria: Array(10).fill("criterion"),
      });
      const suggestions = suggestDecomposition(task);
      expect(suggestions.some((s) => s.includes("acceptance criteria"))).toBe(true);
    });

    test("suggests splitting complex tasks", () => {
      const task = createSampleTask({
        estimatedContextWindows: 5,
        complexity: "complex",
      });
      const suggestions = suggestDecomposition(task);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("calculatePriority", () => {
    test("boosts tasks that block others", () => {
      const blocker = createSampleTask({ blocks: ["task-2", "task-3"] });
      const nonBlocker = createSampleTask({ blocks: [] });

      expect(calculatePriority(blocker)).toBeGreaterThan(calculatePriority(nonBlocker));
    });

    test("penalizes blocked tasks", () => {
      const blocked = createSampleTask({ dependencies: ["task-0"] });
      const unblocked = createSampleTask({ dependencies: [] });

      expect(calculatePriority(unblocked)).toBeGreaterThan(calculatePriority(blocked));
    });

    test("boosts bugs", () => {
      const bug = createSampleTask({ labels: ["bug"] });
      const feature = createSampleTask({ labels: ["feature"] });

      expect(calculatePriority(bug)).toBeGreaterThan(calculatePriority(feature));
    });
  });

  describe("sortByPriority", () => {
    test("sorts highest priority first", () => {
      const tasks = [
        createSampleTask({ id: "low", priority: 10 }),
        createSampleTask({ id: "high", priority: 100 }),
        createSampleTask({ id: "medium", priority: 50 }),
      ];

      const sorted = sortByPriority(tasks);
      expect(sorted[0]?.id).toBe("high");
      expect(sorted[2]?.id).toBe("low");
    });
  });

  describe("buildTaskQueue", () => {
    test("categorizes tasks by readiness", () => {
      const tasks = [
        createSampleTask({ id: "ready" }),
        createSampleTask({ id: "architectural", labels: ["architectural"] }),
        createSampleTask({ id: "no-criteria", acceptanceCriteria: [] }),
      ];

      const queue = buildTaskQueue(tasks);
      expect(queue.autonomousReady.length).toBeGreaterThan(0);
      expect(queue.humanOnly.length).toBeGreaterThan(0);
    });

    test("calculates ready percentage", () => {
      const tasks = [
        createSampleTask({ id: "1" }),
        createSampleTask({ id: "2" }),
        createSampleTask({ id: "3", labels: ["architectural"] }),
      ];

      const queue = buildTaskQueue(tasks);
      expect(queue.autonomousReadyPercent).toBeCloseTo(66.67, 0);
    });
  });

  describe("getNextAutonomousTask", () => {
    test("returns highest priority ready task", () => {
      const tasks = [
        createSampleTask({ id: "low", priority: 10 }),
        createSampleTask({ id: "high", priority: 100 }),
      ];

      const queue = buildTaskQueue(tasks);
      const next = getNextAutonomousTask(queue);
      expect(next?.id).toBe("high");
    });

    test("returns null when no tasks ready", () => {
      const tasks = [createSampleTask({ labels: ["architectural"] })];
      const queue = buildTaskQueue(tasks);
      expect(getNextAutonomousTask(queue)).toBeNull();
    });
  });

  describe("generateTaskTemplate", () => {
    test("includes title and description", () => {
      const template = generateTaskTemplate("My Task", "Description here");
      expect(template).toContain("My Task");
      expect(template).toContain("Description here");
    });

    test("includes all sections", () => {
      const template = generateTaskTemplate("Task", "Desc");
      expect(template).toContain("Acceptance Criteria");
      expect(template).toContain("Context");
      expect(template).toContain("Success Criteria");
      expect(template).toContain("Dependencies");
    });
  });

  describe("Examples", () => {
    test("well-sized examples are reasonable", () => {
      expect(WELL_SIZED_EXAMPLES.length).toBeGreaterThan(5);
      expect(WELL_SIZED_EXAMPLES.every((e) => e.length < 100)).toBe(true);
    });

    test("oversized examples need decomposition", () => {
      expect(OVERSIZED_EXAMPLES.length).toBeGreaterThan(3);
      expect(OVERSIZED_EXAMPLES.some((e) => e.includes("entire") || e.includes("system"))).toBe(true);
    });
  });
});

// ============================================================================
// CLEAN SLATE RECOVERY TESTS
// ============================================================================

describe("Clean Slate Recovery", () => {
  const createStuckTrajectory = (): Trajectory => ({
    problem: "Implement authentication",
    sessionId: "session-1",
    resolved: false,
    totalTokens: 26000,
    totalTimeMs: 390000,
    attempts: [
      {
        number: 1,
        approach: "Use jwt token refresh with localStorage",
        outcome: "Failed",
        success: false,
        tokensUsed: 8000,
        timeMs: 120000,
        failureReason: "API doesn't support refresh",
      },
      {
        number: 2,
        approach: "Use jwt token refresh with localStorage",
        outcome: "Failed",
        success: false,
        tokensUsed: 6000,
        timeMs: 90000,
        failureReason: "Still no refresh endpoint",
      },
      {
        number: 3,
        approach: "Use jwt token refresh with cookies",
        outcome: "Failed",
        success: false,
        tokensUsed: 7000,
        timeMs: 100000,
        failureReason: "Security risk",
      },
      {
        number: 4,
        approach: "Short",
        outcome: "Failed",
        success: false,
        tokensUsed: 5000,
        timeMs: 80000,
        failureReason: "Doesn't solve the problem",
      },
    ],
  });

  const createHealthyTrajectory = (): Trajectory => ({
    problem: "Add rate limiting",
    sessionId: "session-2",
    resolved: true,
    totalTokens: 10000,
    totalTimeMs: 150000,
    attempts: [
      {
        number: 1,
        approach: "Implement with Redis",
        outcome: "Success",
        success: true,
        tokensUsed: 10000,
        timeMs: 150000,
      },
    ],
  });

  describe("analyzeTrajectory", () => {
    test("detects stuck trajectory", () => {
      const symptoms = analyzeTrajectory(createStuckTrajectory());
      expect(symptoms.isStuck).toBe(true);
      expect(symptoms.exceededAttemptThreshold).toBe(true);
    });

    test("healthy trajectory not stuck", () => {
      const symptoms = analyzeTrajectory(createHealthyTrajectory());
      expect(symptoms.isStuck).toBe(false);
      expect(symptoms.stuckConfidence).toBe(0);
    });

    test("detects same approach variations", () => {
      const symptoms = analyzeTrajectory(createStuckTrajectory());
      expect(symptoms.sameApproachVariations).toBe(true);
    });

    test("calculates stuck confidence", () => {
      const symptoms = analyzeTrajectory(createStuckTrajectory());
      expect(symptoms.stuckConfidence).toBeGreaterThan(50);
    });
  });

  describe("extractConstraints", () => {
    test("extracts constraints from failures", () => {
      const constraints = extractConstraints(createStuckTrajectory());
      expect(constraints.length).toBeGreaterThan(0);
    });

    test("includes failure reasons", () => {
      const constraints = extractConstraints(createStuckTrajectory());
      expect(constraints.some((c) => c.reason.length > 0)).toBe(true);
    });

    test("deduplicates similar constraints", () => {
      const trajectory = createStuckTrajectory();
      const constraints = extractConstraints(trajectory);
      const unique = new Set(constraints.map((c) => c.description));
      expect(unique.size).toBe(constraints.length);
    });
  });

  describe("performRootCauseAnalysis", () => {
    test("identifies API-related root cause", () => {
      const analysis = performRootCauseAnalysis(createStuckTrajectory());
      expect(analysis).toContain("Root cause");
    });

    test("returns message for no failures", () => {
      const analysis = performRootCauseAnalysis(createHealthyTrajectory());
      expect(analysis).toContain("No failures");
    });
  });

  describe("buildCleanSlateFrame", () => {
    test("builds frame with problem", () => {
      const frame = buildCleanSlateFrame(createStuckTrajectory());
      expect(frame.problem).toBe("Implement authentication");
    });

    test("includes constraints", () => {
      const frame = buildCleanSlateFrame(createStuckTrajectory());
      expect(frame.constraints.length).toBeGreaterThan(0);
    });

    test("includes root cause", () => {
      const frame = buildCleanSlateFrame(createStuckTrajectory());
      expect(frame.rootCause).toBeDefined();
    });

    test("suggests new direction", () => {
      const frame = buildCleanSlateFrame(createStuckTrajectory());
      expect(frame.suggestedApproach).toBeDefined();
    });
  });

  describe("suggestNewDirection", () => {
    test("suggests alternative for JWT failures", () => {
      // Create a trajectory where all attempts are token-based
      const trajectory: Trajectory = {
        problem: "Implement authentication",
        sessionId: "session-1",
        resolved: false,
        totalTokens: 20000,
        totalTimeMs: 300000,
        attempts: [
          { number: 1, approach: "Use jwt token refresh", outcome: "Failed", success: false, tokensUsed: 7000, timeMs: 100000, failureReason: "No endpoint" },
          { number: 2, approach: "Use jwt token with localStorage", outcome: "Failed", success: false, tokensUsed: 6000, timeMs: 100000, failureReason: "Still no endpoint" },
          { number: 3, approach: "Use jwt token with cookies", outcome: "Failed", success: false, tokensUsed: 7000, timeMs: 100000, failureReason: "Security risk" },
        ],
      };
      const suggestion = suggestNewDirection(trajectory, []);
      expect(suggestion).toContain("session");
    });
  });

  describe("formatCleanSlatePrompt", () => {
    test("includes all frame elements", () => {
      const frame = buildCleanSlateFrame(createStuckTrajectory());
      const prompt = formatCleanSlatePrompt(frame);
      expect(prompt).toContain(frame.problem);
      expect(prompt).toContain("Context");
      expect(prompt).toContain("Constraints");
    });
  });

  describe("calculateCostComparison", () => {
    test("recommends clean slate for stuck trajectory", () => {
      const comparison = calculateCostComparison(createStuckTrajectory());
      expect(comparison.recommendation).toBe("clean_slate");
    });

    test("calculates savings", () => {
      const comparison = calculateCostComparison(createStuckTrajectory());
      expect(comparison.savings.tokens).toBeGreaterThan(0);
      expect(comparison.savings.successRateImprovement).toBeGreaterThan(0);
    });

    test("clean slate has higher success rate", () => {
      const comparison = calculateCostComparison(createStuckTrajectory());
      expect(comparison.cleanSlate.expectedSuccessRate).toBeGreaterThan(
        comparison.brokenTrajectory.successRate
      );
    });
  });

  describe("shouldTriggerCleanSlate", () => {
    test("triggers after 3 failures", () => {
      const symptoms = analyzeTrajectory(createStuckTrajectory());
      const { trigger } = shouldTriggerCleanSlate(4, 4, symptoms);
      expect(trigger).toBe(true);
    });

    test("triggers for high stuck confidence", () => {
      const symptoms = { ...analyzeTrajectory(createStuckTrajectory()), stuckConfidence: 80 };
      const { trigger } = shouldTriggerCleanSlate(2, 2, symptoms);
      expect(trigger).toBe(true);
    });

    test("does not trigger for healthy trajectory", () => {
      const symptoms = analyzeTrajectory(createHealthyTrajectory());
      const { trigger } = shouldTriggerCleanSlate(1, 0, symptoms);
      expect(trigger).toBe(false);
    });
  });
});

// ============================================================================
// MEMORY ARCHITECTURE TESTS
// ============================================================================

describe("Memory Architecture", () => {
  describe("Git History Layer", () => {
    describe("parseGitLog", () => {
      test("parses commit format", () => {
        const output = `COMMIT_DELIMITERabc123|2025-01-15
Add feature
Description here`;
        const commits = parseGitLog(output);
        expect(commits.length).toBe(1);
        expect(commits[0]?.hash).toBe("abc123");
        expect(commits[0]?.subject).toBe("Add feature");
      });

      test("handles multiple commits", () => {
        const output = `COMMIT_DELIMITERabc123|2025-01-15
Commit 1
Body 1
COMMIT_DELIMITERdef456|2025-01-14
Commit 2
Body 2`;
        const commits = parseGitLog(output);
        expect(commits.length).toBe(2);
      });
    });

    describe("getRecentCommits", () => {
      test("returns specified number of commits", () => {
        const commits = getRecentCommits(2);
        expect(commits.length).toBeLessThanOrEqual(2);
      });

      test("commits have required fields", () => {
        const commits = getRecentCommits(1);
        if (commits[0]) {
          expect(commits[0].hash).toBeDefined();
          expect(commits[0].subject).toBeDefined();
          expect(commits[0].date).toBeDefined();
        }
      });
    });

    describe("searchGitHistory", () => {
      test("filters commits by query", () => {
        const commits = searchGitHistory("rate");
        expect(commits.every((c) =>
          c.subject.toLowerCase().includes("rate") ||
          c.body.toLowerCase().includes("rate")
        )).toBe(true);
      });
    });

    describe("extractLearningsFromCommits", () => {
      test("extracts learning annotations", () => {
        const commits = [{
          hash: "abc",
          subject: "fix: issue",
          body: "Learning: Always check null values",
          date: "2025-01-15",
          filesChanged: [],
        }];
        const learnings = extractLearningsFromCommits(commits);
        expect(learnings).toContain("Always check null values");
      });
    });
  });

  describe("Documentation Layer", () => {
    const sampleAgentsContent = `# AGENTS.md

## Tech Stack
- Runtime: Bun
- Framework: Next.js

## Common Mistakes to Avoid
- Using npm instead of bun

## Decision Log
- [2025-01-15] Chose Server Actions

## Recent Learnings (2025-01-16)
- Learning one
- Learning two`;

    describe("parseAgentsDocument", () => {
      test("parses tech stack", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        expect(doc.techStack["Runtime"]).toBe("Bun");
      });

      test("parses common mistakes", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        expect(doc.commonMistakes.length).toBeGreaterThan(0);
      });

      test("parses decisions", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        expect(doc.decisions.length).toBeGreaterThan(0);
        expect(doc.decisions[0]?.date).toBe("2025-01-15");
      });

      test("parses recent learnings", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        expect(doc.recentLearnings.length).toBe(2);
      });
    });

    describe("generateAgentsDocument", () => {
      test("generates valid markdown", () => {
        const doc: AgentsDocument = {
          techStack: { Runtime: "Bun" },
          patterns: {},
          commonMistakes: [],
          decisions: [],
          recentLearnings: ["Learning 1"],
          lastUpdated: "2025-01-16T00:00:00Z",
        };
        const markdown = generateAgentsDocument(doc);
        expect(markdown).toContain("# AGENTS.md");
        expect(markdown).toContain("Runtime: Bun");
        expect(markdown).toContain("Learning 1");
      });
    });

    describe("addPattern", () => {
      test("adds pattern to category", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        const updated = addPattern(doc, "Database", {
          category: "Database",
          name: "Migrations",
          description: "Always test up and down",
          relatedFiles: [],
        });
        expect(updated.patterns["Database"]?.length).toBe(1);
      });
    });

    describe("addLearning", () => {
      test("prepends learning to list", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        const updated = addLearning(doc, "New learning");
        expect(updated.recentLearnings[0]).toBe("New learning");
      });
    });

    describe("recordMistake", () => {
      test("adds new mistake", () => {
        const doc = parseAgentsDocument(sampleAgentsContent);
        const mistake: DocumentedMistake = {
          description: "Forgot type-check",
          reason: "CI fails",
          correction: "Run tsc",
          occurrences: 1,
        };
        const updated = recordMistake(doc, mistake);
        expect(updated.commonMistakes.length).toBeGreaterThan(doc.commonMistakes.length);
      });

      test("increments occurrence for duplicate", () => {
        const doc: AgentsDocument = {
          techStack: {},
          patterns: {},
          commonMistakes: [{
            description: "Duplicate mistake",
            reason: "test",
            correction: "fix",
            occurrences: 1,
          }],
          decisions: [],
          recentLearnings: [],
          lastUpdated: "",
        };
        const updated = recordMistake(doc, {
          description: "Duplicate mistake",
          reason: "test",
          correction: "fix",
          occurrences: 1,
        });
        expect(updated.commonMistakes[0]?.occurrences).toBe(2);
      });
    });
  });

  describe("Task Layer", () => {
    describe("parseTasksMarkdown", () => {
      test("parses pending and complete tasks", () => {
        const content = `# Tasks
- [ ] Pending task
- [x] Complete task (Completed: 2025-01-15)`;
        const tasks = parseTasksMarkdown(content);
        expect(tasks.length).toBe(2);
        expect(tasks[0]?.status).toBe("pending");
        expect(tasks[1]?.status).toBe("complete");
      });

      test("parses blocked tasks", () => {
        const content = `- [ ] Blocked task (Blocked by: task-1)`;
        const tasks = parseTasksMarkdown(content);
        expect(tasks[0]?.status).toBe("blocked");
        expect(tasks[0]?.blockedBy).toContain("task-1");
      });
    });

    describe("calculateTaskStats", () => {
      test("calculates correct stats", () => {
        const tasks = [
          { id: "1", title: "A", status: "complete" as const },
          { id: "2", title: "B", status: "pending" as const },
          { id: "3", title: "C", status: "pending" as const },
          { id: "4", title: "D", status: "blocked" as const },
        ];
        const stats = calculateTaskStats(tasks);
        expect(stats.total).toBe(4);
        expect(stats.completed).toBe(1);
        expect(stats.pending).toBe(2);
        expect(stats.blocked).toBe(1);
      });
    });
  });

  describe("Flywheel Effect", () => {
    describe("modelFlywheelEffect", () => {
      test("models multiple iterations", () => {
        const results = modelFlywheelEffect(10);
        expect(results.length).toBe(10);
      });

      test("time savings increase over iterations", () => {
        const results = modelFlywheelEffect(20, 1); // 100% learning rate
        const early = results[4];
        const late = results[19];
        expect(late?.timeSavingsPercent).toBeGreaterThanOrEqual(early?.timeSavingsPercent ?? 0);
      });

      test("error reduction increases", () => {
        const results = modelFlywheelEffect(20, 1);
        const early = results[4];
        const late = results[19];
        expect(late?.errorReductionPercent).toBeGreaterThanOrEqual(early?.errorReductionPercent ?? 0);
      });

      test("caps at reasonable maximums", () => {
        const results = modelFlywheelEffect(100, 1);
        const last = results[99];
        expect(last?.timeSavingsPercent).toBeLessThanOrEqual(40);
        expect(last?.errorReductionPercent).toBeLessThanOrEqual(80);
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Tests", () => {
  test("RALPH loop integrates with task management", () => {
    // Parse tasks, filter for autonomous-ready, get next task
    const content = `# Tasks
- [ ] Implement feature with clear criteria
- [ ] Architectural change`;

    const taskFile = parseTasksFile(content);
    expect(taskFile.tasks.length).toBe(2);

    // In a real integration, we'd convert to AutonomousTask and filter
  });

  test("clean slate integrates with RALPH loop", () => {
    // After detecting stuck trajectory, clean slate provides new framing
    const trajectory: Trajectory = {
      problem: "Fix bug",
      sessionId: "1",
      resolved: false,
      totalTokens: 20000,
      totalTimeMs: 300000,
      attempts: [
        { number: 1, approach: "Try A", outcome: "Failed", success: false, tokensUsed: 7000, timeMs: 100000, failureReason: "Reason A" },
        { number: 2, approach: "Try A again", outcome: "Failed", success: false, tokensUsed: 6000, timeMs: 100000, failureReason: "Same reason" },
        { number: 3, approach: "Try A variant", outcome: "Failed", success: false, tokensUsed: 7000, timeMs: 100000, failureReason: "Still same" },
      ],
    };

    const symptoms = analyzeTrajectory(trajectory);
    const { trigger } = shouldTriggerCleanSlate(3, 3, symptoms);
    expect(trigger).toBe(true);

    const frame = buildCleanSlateFrame(trajectory);
    const prompt = formatCleanSlatePrompt(frame);
    expect(prompt).toContain(trajectory.problem);
  });

  test("memory architecture supports iteration", () => {
    // AGENTS.md grows with learnings across iterations
    let doc = parseAgentsDocument("# AGENTS.md\n\n## Tech Stack\n- Runtime: Bun");

    // Iteration 1: Add pattern
    doc = addPattern(doc, "API", {
      category: "API",
      name: "Validation",
      description: "Always validate input",
      relatedFiles: [],
    });

    // Iteration 2: Add learning
    doc = addLearning(doc, "Use zod for validation");

    // Iteration 3: Record mistake
    doc = recordMistake(doc, {
      description: "Forgot validation",
      reason: "User input crashed server",
      correction: "Add zod schema",
      occurrences: 1,
    });

    // Document has grown
    const generated = generateAgentsDocument(doc);
    expect(generated).toContain("validate"); // Pattern description contains "validate"
    expect(generated).toContain("zod");
  });

  test("task queue evolves across iterations", () => {
    // Tasks complete, new tasks become unblocked
    const content = `# Tasks
- [x] Task 1 (Completed: 2025-01-15)
- [ ] Task 2
- [ ] Task 3`;

    let taskFile = parseTasksFile(content);
    expect(taskFile.metadata.pendingTasks).toBe(2);

    // Complete a task
    const next = getNextTask(taskFile);
    if (next) {
      taskFile = markTaskComplete(taskFile, next.id);
      expect(taskFile.metadata.pendingTasks).toBe(1);
    }
  });
});
