/**
 * Chapter 13: Building the Harness - Test Suite
 *
 * Tests for harness configuration, constraint optimization,
 * MCP project context, and agent swarm functionality.
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  buildClaudeMd,
  generateHookScript,
  exampleAuthServiceConfig,
  examplePreCommitHook,
  examplePostEditHook,
} from "./harness-configuration";

import {
  evaluateConstraints,
  generateConstraintsYaml,
  paymentServiceConstraints,
  exampleMetricsHealthy,
  exampleMetricsUnhealthy,
} from "./constraint-optimization";

import {
  analyzeArchitecture,
  findPatternExamples,
  analyzeGitHistory,
  analyzeCoverage,
  ProjectContextServer,
  exampleFiles,
  exampleCommits,
  exampleCoverage,
  type CoverageReport,
} from "./mcp-project-context";

import {
  breakdownSpec,
  exampleSwarmConfig,
  exampleNightlyConfig,
  exampleProjectStructure,
  runNightlyJobs,
} from "./agent-swarm";

// ============================================================================
// Harness Configuration Tests
// ============================================================================

describe("Harness Configuration", () => {
  describe("buildClaudeMd", () => {
    it("generates markdown with project name header", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("# Authentication Service");
    });

    it("includes tech stack section", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Tech Stack");
      expect(markdown).toContain("- TypeScript");
      expect(markdown).toContain("- Redis");
    });

    it("includes invariants section", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Invariants");
      expect(markdown).toContain("Never store plaintext passwords");
      expect(markdown).toContain("Never log tokens or credentials");
    });

    it("includes architecture section with all layers", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Architecture");
      expect(markdown).toContain("### domain Layer");
      expect(markdown).toContain("### application Layer");
      expect(markdown).toContain("### infrastructure Layer");
      expect(markdown).toContain("### presentation Layer");
    });

    it("includes scope rules", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Scope");
      expect(markdown).toContain("`src/features/`: write");
      expect(markdown).toContain("`src/core/`: read");
      expect(markdown).toContain("(requires approval)");
    });

    it("includes quality gates", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Quality Gates");
      expect(markdown).toContain("### Type Check [REQUIRED]");
      expect(markdown).toContain("npm run typecheck");
    });

    it("includes key patterns with code examples", () => {
      const markdown = buildClaudeMd(exampleAuthServiceConfig);
      expect(markdown).toContain("## Key Patterns");
      expect(markdown).toContain("### Result Type Pattern");
      expect(markdown).toContain("```typescript");
    });
  });

  describe("generateHookScript", () => {
    it("generates bash script header", () => {
      const script = generateHookScript(examplePreCommitHook);
      expect(script).toContain("#!/bin/bash");
      expect(script).toContain("# Claude Code hook: pre-commit");
    });

    it("includes all commands in order", () => {
      const script = generateHookScript(examplePreCommitHook);
      const typeCheckIndex = script.indexOf("npm run typecheck");
      const lintIndex = script.indexOf("npm run lint");
      const testIndex = script.indexOf("npm test");

      expect(typeCheckIndex).toBeGreaterThan(-1);
      expect(lintIndex).toBeGreaterThan(typeCheckIndex);
      expect(testIndex).toBeGreaterThan(lintIndex);
    });

    it("sets fail fast mode correctly", () => {
      const failFastScript = generateHookScript(examplePreCommitHook);
      expect(failFastScript).toContain("set -e");

      const nonFailFastScript = generateHookScript(examplePostEditHook);
      expect(nonFailFastScript).toContain("EXIT_CODE=0");
    });

    it("handles timeout for commands", () => {
      const script = generateHookScript(examplePreCommitHook);
      expect(script).toContain("timeout 120s npm test");
    });

    it("handles continueOnError for commands", () => {
      const script = generateHookScript(examplePostEditHook);
      expect(script).toContain("EXIT_CODE=1");
    });
  });
});

// ============================================================================
// Constraint Optimization Tests
// ============================================================================

describe("Constraint Optimization", () => {
  describe("evaluateConstraints", () => {
    it("returns no violations for healthy metrics", () => {
      const violations = evaluateConstraints(
        exampleMetricsHealthy,
        paymentServiceConstraints
      );
      expect(violations).toHaveLength(0);
    });

    it("detects memory violation in unhealthy metrics", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      const memoryViolation = violations.find(
        (v) => v.constraint === "memory_max_mb"
      );
      expect(memoryViolation).toBeDefined();
      expect(memoryViolation!.severity).toBe("critical");
      expect(memoryViolation!.actual).toBe(380);
      expect(memoryViolation!.expected).toBe(300);
    });

    it("detects heap growth slope violation (memory leak)", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      const heapViolation = violations.find(
        (v) => v.constraint === "heap_growth_slope"
      );
      expect(heapViolation).toBeDefined();
      expect(heapViolation!.severity).toBe("critical");
    });

    it("detects p99 latency violation", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      const latencyViolation = violations.find(
        (v) => v.constraint === "p99_latency_ms"
      );
      expect(latencyViolation).toBeDefined();
      expect(latencyViolation!.category).toBe("performance");
    });

    it("detects error rate violation", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      const errorViolation = violations.find(
        (v) => v.constraint === "error_rate_max"
      );
      expect(errorViolation).toBeDefined();
      expect(errorViolation!.category).toBe("reliability");
    });

    it("detects test coverage violation", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      const coverageViolation = violations.find(
        (v) => v.constraint === "test_coverage_min"
      );
      expect(coverageViolation).toBeDefined();
      expect(coverageViolation!.severity).toBe("medium");
    });

    it("provides suggestions for each violation", () => {
      const violations = evaluateConstraints(
        exampleMetricsUnhealthy,
        paymentServiceConstraints
      );
      violations.forEach((v) => {
        expect(v.suggestion).toBeDefined();
        expect(v.suggestion.length).toBeGreaterThan(10);
      });
    });
  });

  describe("generateConstraintsYaml", () => {
    it("generates valid YAML structure", () => {
      const yaml = generateConstraintsYaml(paymentServiceConstraints);
      expect(yaml).toContain("performance:");
      expect(yaml).toContain("reliability:");
      expect(yaml).toContain("quality:");
      expect(yaml).toContain("triggers:");
    });

    it("includes all performance constraints", () => {
      const yaml = generateConstraintsYaml(paymentServiceConstraints);
      expect(yaml).toContain("memory_max_mb: 300");
      expect(yaml).toContain("heap_growth_slope_max: 0");
      expect(yaml).toContain("p99_latency_ms: 100");
    });

    it("includes trigger configuration", () => {
      const yaml = generateConstraintsYaml(paymentServiceConstraints);
      expect(yaml).toContain("on_violation: spawn_optimizer");
      expect(yaml).toContain("max_iterations: 5");
      expect(yaml).toContain("escalate_to_human: true");
    });
  });
});

// ============================================================================
// MCP Project Context Tests
// ============================================================================

describe("MCP Project Context", () => {
  describe("analyzeArchitecture", () => {
    it("extracts nodes from files", () => {
      const graph = analyzeArchitecture(exampleFiles);
      expect(graph.nodes.length).toBe(3);
    });

    it("extracts exports from files", () => {
      const graph = analyzeArchitecture(exampleFiles);
      const authNode = graph.nodes.find((n) => n.path.includes("authenticate"));
      expect(authNode).toBeDefined();
      expect(authNode!.exports).toContain("AuthResult");
      expect(authNode!.exports).toContain("createAuthenticator");
    });

    it("detects import relationships", () => {
      const graph = analyzeArchitecture(exampleFiles);
      const importEdges = graph.edges.filter((e) => e.type === "import");
      expect(importEdges.length).toBeGreaterThan(0);
    });

    it("filters by target module", () => {
      const graph = analyzeArchitecture(exampleFiles, "auth");
      expect(graph.nodes.every((n) => n.path.includes("auth"))).toBe(true);
    });
  });

  describe("findPatternExamples", () => {
    it("finds factory function patterns", () => {
      const examples = findPatternExamples(exampleFiles, "factory-functions");
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.some((e) => e.code.includes("createAuthenticator"))).toBe(
        true
      );
    });

    it("finds error handling patterns", () => {
      const examples = findPatternExamples(exampleFiles, "error-handling");
      expect(examples.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown pattern", () => {
      const examples = findPatternExamples(exampleFiles, "unknown-pattern");
      expect(examples).toHaveLength(0);
    });

    it("includes file path and line number in examples", () => {
      const examples = findPatternExamples(exampleFiles, "factory-functions");
      examples.forEach((e) => {
        expect(e.file).toBeDefined();
        expect(e.lineNumber).toBeGreaterThan(0);
      });
    });
  });

  describe("analyzeGitHistory", () => {
    it("generates summary with commit count", () => {
      const report = analyzeGitHistory(exampleCommits, "last-week");
      expect(report.summary.totalCommits).toBe(3);
    });

    it("identifies unique authors", () => {
      const report = analyzeGitHistory(exampleCommits, "last-week");
      expect(report.summary.uniqueAuthors).toBe(2);
    });

    it("tracks top authors by commit count", () => {
      const report = analyzeGitHistory(exampleCommits, "last-week");
      const topAuthor = report.summary.topAuthors[0];
      expect(topAuthor).toBeDefined();
      expect(topAuthor!.author).toBe("Alice");
      expect(topAuthor!.commits).toBe(2);
    });

    it("tracks most changed files", () => {
      const report = analyzeGitHistory(exampleCommits, "last-week");
      expect(report.summary.mostChangedFiles.length).toBeGreaterThan(0);
    });
  });

  describe("analyzeCoverage", () => {
    it("calculates coverage percentages", () => {
      const reports = analyzeCoverage(exampleCoverage);
      expect(reports.length).toBe(2);
      const authReport = reports.find((r) => r.module.includes("authenticate"));
      expect(authReport!.coverage.statements).toBe(90);
    });

    it("identifies uncovered lines", () => {
      const reports = analyzeCoverage(exampleCoverage);
      const paymentReport = reports.find((r) => r.module.includes("payments"));
      expect(paymentReport!.uncoveredLines.length).toBe(6);
    });

    it("provides suggestions for low coverage", () => {
      const reports = analyzeCoverage(exampleCoverage);
      const paymentReport = reports.find((r) => r.module.includes("payments"));
      expect(paymentReport!.suggestions.length).toBeGreaterThan(0);
    });

    it("filters by target module", () => {
      const reports = analyzeCoverage(exampleCoverage, "auth");
      expect(reports.length).toBe(1);
      const firstReport = reports[0];
      expect(firstReport).toBeDefined();
      expect(firstReport!.module).toContain("auth");
    });
  });

  describe("ProjectContextServer", () => {
    let server: ProjectContextServer;

    beforeEach(() => {
      server = new ProjectContextServer(
        exampleFiles,
        exampleCommits,
        exampleCoverage
      );
    });

    it("lists available resources", () => {
      const resources = server.listResources();
      expect(resources.length).toBe(5);
      expect(resources.some((r) => r.uri.includes("architecture-graph"))).toBe(
        true
      );
    });

    it("reads architecture graph resource", () => {
      const content = server.readResource("architecture-graph://project");
      expect(content.mimeType).toBe("application/json");
      const data = JSON.parse(content.text);
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
    });

    it("reads pattern examples resource", () => {
      const content = server.readResource(
        "pattern-examples://factory-functions"
      );
      const data = JSON.parse(content.text);
      expect(Array.isArray(data)).toBe(true);
    });

    it("reads recent changes resource", () => {
      const content = server.readResource("recent-changes://last-week");
      const data = JSON.parse(content.text);
      expect(data.summary).toBeDefined();
      expect(data.commits).toBeDefined();
    });

    it("reads test coverage resource", () => {
      const content = server.readResource("test-coverage://all");
      const data = JSON.parse(content.text);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });
  });
});

// ============================================================================
// Agent Swarm Tests
// ============================================================================

describe("Agent Swarm", () => {
  describe("breakdownSpec", () => {
    it("creates tasks for each feature group", () => {
      const spec = "Implement authentication system";
      const tasks = breakdownSpec(spec, exampleProjectStructure);

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some((t) => t.name.includes("auth"))).toBe(true);
      expect(tasks.some((t) => t.name.includes("payments"))).toBe(true);
    });

    it("assigns files to correct tasks", () => {
      const spec = "Add new features";
      const tasks = breakdownSpec(spec, exampleProjectStructure);

      const authTask = tasks.find((t) => t.name.includes("auth"));
      expect(authTask!.files.every((f) => f.includes("auth"))).toBe(true);
    });

    it("generates unique task IDs", () => {
      const spec = "Build system";
      const tasks = breakdownSpec(spec, exampleProjectStructure);

      const ids = tasks.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("includes constraints for each task", () => {
      const spec = "Implement feature";
      const tasks = breakdownSpec(spec, exampleProjectStructure);

      tasks.forEach((task) => {
        expect(task.constraints.length).toBeGreaterThan(0);
      });
    });
  });

  describe("exampleSwarmConfig", () => {
    it("has valid max concurrency", () => {
      expect(exampleSwarmConfig.maxConcurrency).toBeGreaterThan(0);
      expect(exampleSwarmConfig.maxConcurrency).toBeLessThanOrEqual(10);
    });

    it("has valid timeout", () => {
      expect(exampleSwarmConfig.timeoutMs).toBeGreaterThan(0);
    });

    it("has valid retry attempts", () => {
      expect(exampleSwarmConfig.retryAttempts).toBeGreaterThanOrEqual(0);
    });

    it("has valid merge strategy", () => {
      expect(["sequential", "parallel", "conflict-aware"]).toContain(
        exampleSwarmConfig.mergeStrategy
      );
    });
  });

  describe("exampleNightlyConfig", () => {
    it("has multiple jobs defined", () => {
      expect(exampleNightlyConfig.jobs.length).toBeGreaterThan(0);
    });

    it("has valid cron schedules", () => {
      exampleNightlyConfig.jobs.forEach((job) => {
        expect(job.schedule).toMatch(/^\d+\s+\d+\s+\*\s+\*\s+\*/);
      });
    });

    it("has valid action handlers", () => {
      const validActions = ["create-pr", "create-issue", "notify-slack", "none"];
      exampleNightlyConfig.jobs.forEach((job) => {
        expect(validActions).toContain(job.onSuccess);
        expect(validActions).toContain(job.onFailure);
      });
    });
  });

  describe("runNightlyJobs", () => {
    it("executes all jobs and returns results", async () => {
      const results = await runNightlyJobs(exampleNightlyConfig);
      expect(results.length).toBe(exampleNightlyConfig.jobs.length);
    });

    it("tracks job success status", async () => {
      const results = await runNightlyJobs(exampleNightlyConfig);
      results.forEach((result) => {
        expect(typeof result.success).toBe("boolean");
      });
    });

    it("tracks job duration", async () => {
      const results = await runNightlyJobs(exampleNightlyConfig);
      results.forEach((result) => {
        expect(result.duration).toBeGreaterThanOrEqual(0);
      });
    });

    it("includes timestamp for each result", async () => {
      const results = await runNightlyJobs(exampleNightlyConfig);
      results.forEach((result) => {
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Integration", () => {
  it("full harness workflow: config -> constraints -> evaluation", () => {
    // Step 1: Generate CLAUDE.md
    const claudeMd = buildClaudeMd(exampleAuthServiceConfig);
    expect(claudeMd).toContain("Invariants");

    // Step 2: Generate constraints
    const constraintsYaml = generateConstraintsYaml(paymentServiceConstraints);
    expect(constraintsYaml).toContain("memory_max_mb");

    // Step 3: Evaluate against metrics
    const violations = evaluateConstraints(
      exampleMetricsHealthy,
      paymentServiceConstraints
    );
    expect(violations).toHaveLength(0);
  });

  it("MCP server provides context for constraint evaluation", () => {
    const server = new ProjectContextServer(
      exampleFiles,
      exampleCommits,
      exampleCoverage
    );

    // Get coverage from MCP
    const coverageContent = server.readResource("test-coverage://all");
    const coverage = JSON.parse(coverageContent.text) as CoverageReport[];

    // Verify coverage metrics can inform constraint evaluation
    const lowCoverage = coverage.filter((r) => r.coverage.statements < 80);
    expect(lowCoverage.length).toBeGreaterThan(0);
  });

  it("task breakdown respects project structure", () => {
    const spec = "Implement full authentication flow";
    const tasks = breakdownSpec(spec, exampleProjectStructure);

    // Verify tasks align with project features
    const featureNames = tasks.map((t) => t.name);
    expect(featureNames.some((n) => n.includes("auth"))).toBe(true);
    expect(featureNames.some((n) => n.includes("users"))).toBe(true);
  });
});
