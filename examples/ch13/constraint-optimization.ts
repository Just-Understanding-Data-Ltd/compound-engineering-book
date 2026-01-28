/**
 * Chapter 13: Constraint-Based Optimization Loop
 *
 * Demonstrates Layer 4 of the four-layer harness: closed-loop optimization
 * using telemetry, constraints, and automated agent-driven fixes.
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// Helper to extract text content from Agent SDK streaming responses
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";
  const content = message.message.content;
  if (typeof content === "string") return content;
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

// ============================================================================
// Constraint Types
// ============================================================================

export interface ConstraintSpec {
  performance: PerformanceConstraints;
  reliability: ReliabilityConstraints;
  quality: QualityConstraints;
  triggers: OptimizationTriggers;
}

export interface PerformanceConstraints {
  memoryMaxMb: number;
  heapGrowthSlopeMax: number; // 0 = no leaks allowed
  p99LatencyMs: number;
  p95LatencyMs: number;
  p50LatencyMs: number;
  throughputMin: number; // requests per second
}

export interface ReliabilityConstraints {
  errorRateMax: number; // percentage
  errorBudgetPercent: number;
  availabilityMin: number; // 99.95 = 99.95%
  timeoutRateMax: number;
}

export interface QualityConstraints {
  testCoverageMin: number;
  lintErrorsMax: number;
  typeErrorsMax: number;
  duplicateCodeMax: number; // percentage
}

export interface OptimizationTriggers {
  onViolation: "spawn_optimizer" | "create_issue" | "notify_only";
  maxIterations: number;
  escalateToHuman: boolean;
  cooldownMinutes: number;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface MetricsSnapshot {
  timestamp: Date;
  performance: PerformanceMetrics;
  reliability: ReliabilityMetrics;
  quality: QualityMetrics;
}

export interface PerformanceMetrics {
  memoryMb: number;
  heapGrowthSlope: number;
  latencyP99Ms: number;
  latencyP95Ms: number;
  latencyP50Ms: number;
  throughput: number;
}

export interface ReliabilityMetrics {
  errorRate: number;
  errorBudgetRemaining: number;
  availability: number;
  timeoutRate: number;
}

export interface QualityMetrics {
  testCoverage: number;
  lintErrors: number;
  typeErrors: number;
  duplicateCodePercent: number;
}

// ============================================================================
// Constraint Evaluation
// ============================================================================

export interface ConstraintViolation {
  constraint: string;
  expected: number;
  actual: number;
  severity: "critical" | "high" | "medium" | "low";
  category: "performance" | "reliability" | "quality";
  suggestion: string;
}

export function evaluateConstraints(
  metrics: MetricsSnapshot,
  constraints: ConstraintSpec
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // Performance checks
  if (metrics.performance.memoryMb > constraints.performance.memoryMaxMb) {
    violations.push({
      constraint: "memory_max_mb",
      expected: constraints.performance.memoryMaxMb,
      actual: metrics.performance.memoryMb,
      severity: "critical",
      category: "performance",
      suggestion:
        "Analyze heap snapshots for memory leaks, unbounded caches, or large object retention",
    });
  }

  if (
    metrics.performance.heapGrowthSlope > constraints.performance.heapGrowthSlopeMax
  ) {
    violations.push({
      constraint: "heap_growth_slope",
      expected: constraints.performance.heapGrowthSlopeMax,
      actual: metrics.performance.heapGrowthSlope,
      severity: "critical",
      category: "performance",
      suggestion:
        "Memory leak detected. Check for event listeners not removed, growing arrays without cleanup, or unclosed resources",
    });
  }

  if (
    metrics.performance.latencyP99Ms > constraints.performance.p99LatencyMs
  ) {
    violations.push({
      constraint: "p99_latency_ms",
      expected: constraints.performance.p99LatencyMs,
      actual: metrics.performance.latencyP99Ms,
      severity: "high",
      category: "performance",
      suggestion:
        "Optimize slow queries, add caching for frequently accessed data, or increase batch sizes",
    });
  }

  if (
    metrics.performance.throughput < constraints.performance.throughputMin
  ) {
    violations.push({
      constraint: "throughput_min",
      expected: constraints.performance.throughputMin,
      actual: metrics.performance.throughput,
      severity: "high",
      category: "performance",
      suggestion:
        "Increase parallelism, optimize critical paths, or add connection pooling",
    });
  }

  // Reliability checks
  if (metrics.reliability.errorRate > constraints.reliability.errorRateMax) {
    violations.push({
      constraint: "error_rate_max",
      expected: constraints.reliability.errorRateMax,
      actual: metrics.reliability.errorRate,
      severity: "critical",
      category: "reliability",
      suggestion:
        "Review error logs for patterns, add retry logic, or fix unstable dependencies",
    });
  }

  if (metrics.reliability.availability < constraints.reliability.availabilityMin) {
    violations.push({
      constraint: "availability_min",
      expected: constraints.reliability.availabilityMin,
      actual: metrics.reliability.availability,
      severity: "critical",
      category: "reliability",
      suggestion:
        "Add health checks, implement circuit breakers, or review deployment strategy",
    });
  }

  // Quality checks
  if (metrics.quality.testCoverage < constraints.quality.testCoverageMin) {
    violations.push({
      constraint: "test_coverage_min",
      expected: constraints.quality.testCoverageMin,
      actual: metrics.quality.testCoverage,
      severity: "medium",
      category: "quality",
      suggestion:
        "Add tests for uncovered code paths, especially error handlers and edge cases",
    });
  }

  if (metrics.quality.lintErrors > constraints.quality.lintErrorsMax) {
    violations.push({
      constraint: "lint_errors_max",
      expected: constraints.quality.lintErrorsMax,
      actual: metrics.quality.lintErrors,
      severity: "low",
      category: "quality",
      suggestion: "Run eslint --fix to auto-correct fixable issues",
    });
  }

  return violations;
}

// ============================================================================
// Optimization Loop
// ============================================================================

export interface OptimizationResult {
  iteration: number;
  violations: ConstraintViolation[];
  proposedFix?: string;
  applied: boolean;
  revalidated: boolean;
  success: boolean;
}

export interface OptimizationContext {
  codeSnippet: string;
  metrics: MetricsSnapshot;
  violations: ConstraintViolation[];
  previousAttempts: string[];
}

export async function generateOptimizationFix(
  context: OptimizationContext
): Promise<string> {
  const violationReport = context.violations
    .map(
      (v) =>
        `- ${v.constraint}: expected ${v.expected}, got ${v.actual} (${v.severity})\n  Suggestion: ${v.suggestion}`
    )
    .join("\n");

  const previousAttemptsNote =
    context.previousAttempts.length > 0
      ? `\n\nPrevious attempted fixes that did not resolve the issue:\n${context.previousAttempts.join("\n---\n")}`
      : "";

  const prompt = `You are a performance optimization agent. Analyze the constraint violations and propose a minimal, targeted fix.

## Constraint Violations
${violationReport}

## Current Code
\`\`\`typescript
${context.codeSnippet}
\`\`\`
${previousAttemptsNote}

## Instructions
1. Identify the root cause of each violation
2. Propose the smallest change that fixes the violations
3. Explain why the fix addresses the root cause
4. Return only the fixed code with a brief comment explaining the change

Focus on the most critical violations first. Make surgical changes, not rewrites.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let result = "";
  for await (const message of response) {
    result += extractTextContent(message);
  }
  return result;
}

export async function runOptimizationLoop(
  initialMetrics: MetricsSnapshot,
  constraints: ConstraintSpec,
  getCode: () => string,
  applyFix: (fix: string) => Promise<boolean>,
  revalidate: () => Promise<MetricsSnapshot>
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  const previousAttempts: string[] = [];
  let currentMetrics = initialMetrics;
  let iteration = 0;

  while (iteration < constraints.triggers.maxIterations) {
    iteration++;
    const violations = evaluateConstraints(currentMetrics, constraints);

    if (violations.length === 0) {
      results.push({
        iteration,
        violations: [],
        applied: false,
        revalidated: true,
        success: true,
      });
      break;
    }

    const context: OptimizationContext = {
      codeSnippet: getCode(),
      metrics: currentMetrics,
      violations,
      previousAttempts,
    };

    const proposedFix = await generateOptimizationFix(context);

    const applied = await applyFix(proposedFix);
    if (!applied) {
      results.push({
        iteration,
        violations,
        proposedFix,
        applied: false,
        revalidated: false,
        success: false,
      });
      continue;
    }

    previousAttempts.push(proposedFix);
    currentMetrics = await revalidate();

    const newViolations = evaluateConstraints(currentMetrics, constraints);
    const success = newViolations.length === 0;

    results.push({
      iteration,
      violations,
      proposedFix,
      applied: true,
      revalidated: true,
      success,
    });

    if (success) break;
  }

  return results;
}

// ============================================================================
// YAML Constraint Spec Generator
// ============================================================================

export function generateConstraintsYaml(spec: ConstraintSpec): string {
  return `# Constraint Specification
# Generated: ${new Date().toISOString()}

performance:
  memory_max_mb: ${spec.performance.memoryMaxMb}
  heap_growth_slope_max: ${spec.performance.heapGrowthSlopeMax}
  p99_latency_ms: ${spec.performance.p99LatencyMs}
  p95_latency_ms: ${spec.performance.p95LatencyMs}
  p50_latency_ms: ${spec.performance.p50LatencyMs}
  throughput_min: ${spec.performance.throughputMin}

reliability:
  error_rate_max: ${spec.reliability.errorRateMax}
  error_budget_percent: ${spec.reliability.errorBudgetPercent}
  availability_min: ${spec.reliability.availabilityMin}
  timeout_rate_max: ${spec.reliability.timeoutRateMax}

quality:
  test_coverage_min: ${spec.quality.testCoverageMin}
  lint_errors_max: ${spec.quality.lintErrorsMax}
  type_errors_max: ${spec.quality.typeErrorsMax}
  duplicate_code_max: ${spec.quality.duplicateCodeMax}

triggers:
  on_violation: ${spec.triggers.onViolation}
  max_iterations: ${spec.triggers.maxIterations}
  escalate_to_human: ${spec.triggers.escalateToHuman}
  cooldown_minutes: ${spec.triggers.cooldownMinutes}
`;
}

// ============================================================================
// Example Specifications
// ============================================================================

export const paymentServiceConstraints: ConstraintSpec = {
  performance: {
    memoryMaxMb: 300,
    heapGrowthSlopeMax: 0,
    p99LatencyMs: 100,
    p95LatencyMs: 75,
    p50LatencyMs: 25,
    throughputMin: 1000,
  },
  reliability: {
    errorRateMax: 0.1,
    errorBudgetPercent: 0.05,
    availabilityMin: 99.95,
    timeoutRateMax: 0.5,
  },
  quality: {
    testCoverageMin: 80,
    lintErrorsMax: 0,
    typeErrorsMax: 0,
    duplicateCodeMax: 5,
  },
  triggers: {
    onViolation: "spawn_optimizer",
    maxIterations: 5,
    escalateToHuman: true,
    cooldownMinutes: 30,
  },
};

export const exampleMetricsHealthy: MetricsSnapshot = {
  timestamp: new Date(),
  performance: {
    memoryMb: 245,
    heapGrowthSlope: 0,
    latencyP99Ms: 87,
    latencyP95Ms: 62,
    latencyP50Ms: 18,
    throughput: 1250,
  },
  reliability: {
    errorRate: 0.02,
    errorBudgetRemaining: 95,
    availability: 99.99,
    timeoutRate: 0.1,
  },
  quality: {
    testCoverage: 92,
    lintErrors: 0,
    typeErrors: 0,
    duplicateCodePercent: 2.3,
  },
};

export const exampleMetricsUnhealthy: MetricsSnapshot = {
  timestamp: new Date(),
  performance: {
    memoryMb: 380, // Over limit
    heapGrowthSlope: 0.5, // Memory leak
    latencyP99Ms: 145, // Over p99 limit
    latencyP95Ms: 95,
    latencyP50Ms: 35,
    throughput: 850, // Under minimum
  },
  reliability: {
    errorRate: 0.15, // Over limit
    errorBudgetRemaining: 20,
    availability: 99.80, // Under minimum
    timeoutRate: 1.2,
  },
  quality: {
    testCoverage: 72, // Under minimum
    lintErrors: 5, // Over limit
    typeErrors: 0,
    duplicateCodePercent: 8.5, // Over limit
  },
};

// ============================================================================
// Demo
// ============================================================================

async function demo() {
  console.log("=== Chapter 13: Constraint Optimization Demo ===\n");

  // Generate constraints YAML
  console.log("--- Constraints Specification (YAML) ---\n");
  const yaml = generateConstraintsYaml(paymentServiceConstraints);
  console.log(yaml);

  // Evaluate healthy metrics
  console.log("\n--- Evaluating Healthy Metrics ---\n");
  const healthyViolations = evaluateConstraints(
    exampleMetricsHealthy,
    paymentServiceConstraints
  );
  console.log(
    healthyViolations.length === 0
      ? "All constraints satisfied!"
      : `Found ${healthyViolations.length} violations`
  );

  // Evaluate unhealthy metrics
  console.log("\n--- Evaluating Unhealthy Metrics ---\n");
  const unhealthyViolations = evaluateConstraints(
    exampleMetricsUnhealthy,
    paymentServiceConstraints
  );

  console.log(`Found ${unhealthyViolations.length} constraint violations:\n`);
  unhealthyViolations.forEach((v) => {
    console.log(`[${v.severity.toUpperCase()}] ${v.constraint}`);
    console.log(`  Expected: ${v.expected}, Actual: ${v.actual}`);
    console.log(`  Suggestion: ${v.suggestion}\n`);
  });

  console.log("=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
