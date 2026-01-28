/**
 * Chapter 14: Meta-Builder Patterns
 *
 * Demonstrates building systems that build systems.
 * The meta-engineer operates at Level 3: writing systems that write systems.
 *
 * Key concept: The product is the output. The system is the asset.
 */

import Anthropic from "@anthropic-ai/sdk";

// System constraints that define success
interface SystemConstraints {
  performance: {
    p99LatencyMs: number;
    maxMemoryMb: number;
    maxCpuPercent: number;
  };
  correctness: {
    noDataLoss: boolean;
    transactionsAtomic: boolean;
    idempotent: boolean;
  };
  security: {
    authRequired: boolean;
    rateLimitEnforced: boolean;
    inputValidated: boolean;
  };
}

// Feedback loop result
interface FeedbackLoopResult {
  constraintsPassed: boolean;
  failures: Array<{
    constraint: string;
    expected: string | number | boolean;
    actual: string | number | boolean;
    severity: "critical" | "warning" | "info";
  }>;
  suggestions: string[];
  autoFixable: boolean;
}

// The four levels of automation
interface AutomationLevel {
  level: 0 | 1 | 2 | 3;
  name: string;
  description: string;
  productivity: string;
  example: string;
  investment: string;
  mostStopHere: boolean;
}

// ROI calculation for meta-engineering
interface ROICalculation {
  taskName: string;
  timePerTaskMinutes: number;
  frequencyPerWeek: number;
  automationPercent: number;
  buildTimeHours: number;
  weeklyTimeSavedMinutes: number;
  paybackWeeks: number;
  yearlyHoursSaved: number;
  recommendation: "build" | "wait" | "keep-ad-hoc";
}

// The four levels of automation
export const AUTOMATION_LEVELS: AutomationLevel[] = [
  {
    level: 0,
    name: "Manual Coding",
    description: "You write all code yourself. Every character typed by hand.",
    productivity: "1x (baseline)",
    example: "Writing a CRUD endpoint from scratch",
    investment: "Your time, every time",
    mostStopHere: false,
  },
  {
    level: 1,
    name: "AI-Assisted Coding",
    description: "You use Claude Code to write features. Each day, you ask it to add authentication, fix migrations, implement components.",
    productivity: "5-10x",
    example: '"Add JWT authentication to the API"',
    investment: "Prompting time",
    mostStopHere: true,
  },
  {
    level: 2,
    name: "Building Tools with AI",
    description: "You use Claude Code to build tools that generate code. An MCP server that scaffolds CRUD endpoints. A CLI that generates feature templates.",
    productivity: "20-50x",
    example: "mcp-scaffold create-crud User",
    investment: "Tool creation time (4-8 hours)",
    mostStopHere: false,
  },
  {
    level: 3,
    name: "Meta-Infrastructure",
    description: "You build tools that build tools. A system that monitors your codebase, identifies repetitive patterns, and auto-generates tools to eliminate them.",
    productivity: "100-500x",
    example: "System detects patterns and generates tools automatically",
    investment: "System architecture (days/weeks)",
    mostStopHere: false,
  },
];

// Default system constraints
export const DEFAULT_CONSTRAINTS: SystemConstraints = {
  performance: {
    p99LatencyMs: 100,
    maxMemoryMb: 512,
    maxCpuPercent: 80,
  },
  correctness: {
    noDataLoss: true,
    transactionsAtomic: true,
    idempotent: true,
  },
  security: {
    authRequired: true,
    rateLimitEnforced: true,
    inputValidated: true,
  },
};

// Evaluate constraints against metrics
export function evaluateConstraints(
  constraints: SystemConstraints,
  metrics: {
    latencyP99Ms: number;
    memoryUsedMb: number;
    cpuPercent: number;
    dataLossEvents: number;
    nonAtomicTransactions: number;
    nonIdempotentOps: number;
    unauthenticatedRequests: number;
    rateLimitBypasses: number;
    unvalidatedInputs: number;
  }
): FeedbackLoopResult {
  const failures: FeedbackLoopResult["failures"] = [];
  const suggestions: string[] = [];

  // Performance checks
  if (metrics.latencyP99Ms > constraints.performance.p99LatencyMs) {
    failures.push({
      constraint: "p99 latency",
      expected: constraints.performance.p99LatencyMs,
      actual: metrics.latencyP99Ms,
      severity: "critical",
    });
    suggestions.push(
      "Add caching, optimize database queries, or use connection pooling"
    );
  }

  if (metrics.memoryUsedMb > constraints.performance.maxMemoryMb) {
    failures.push({
      constraint: "memory usage",
      expected: constraints.performance.maxMemoryMb,
      actual: metrics.memoryUsedMb,
      severity: "warning",
    });
    suggestions.push(
      "Check for memory leaks, reduce buffer sizes, or use streaming"
    );
  }

  if (metrics.cpuPercent > constraints.performance.maxCpuPercent) {
    failures.push({
      constraint: "CPU usage",
      expected: constraints.performance.maxCpuPercent,
      actual: metrics.cpuPercent,
      severity: "warning",
    });
    suggestions.push("Profile for hot paths, optimize algorithms");
  }

  // Correctness checks
  if (constraints.correctness.noDataLoss && metrics.dataLossEvents > 0) {
    failures.push({
      constraint: "no data loss",
      expected: 0,
      actual: metrics.dataLossEvents,
      severity: "critical",
    });
    suggestions.push("Implement WAL, use durable queues, add retries");
  }

  if (
    constraints.correctness.transactionsAtomic &&
    metrics.nonAtomicTransactions > 0
  ) {
    failures.push({
      constraint: "atomic transactions",
      expected: 0,
      actual: metrics.nonAtomicTransactions,
      severity: "critical",
    });
    suggestions.push("Use database transactions, implement saga pattern");
  }

  if (
    constraints.correctness.idempotent &&
    metrics.nonIdempotentOps > 0
  ) {
    failures.push({
      constraint: "idempotency",
      expected: 0,
      actual: metrics.nonIdempotentOps,
      severity: "warning",
    });
    suggestions.push("Add idempotency keys, check before mutating");
  }

  // Security checks
  if (
    constraints.security.authRequired &&
    metrics.unauthenticatedRequests > 0
  ) {
    failures.push({
      constraint: "authentication required",
      expected: 0,
      actual: metrics.unauthenticatedRequests,
      severity: "critical",
    });
    suggestions.push("Add auth middleware to all protected routes");
  }

  if (
    constraints.security.rateLimitEnforced &&
    metrics.rateLimitBypasses > 0
  ) {
    failures.push({
      constraint: "rate limiting",
      expected: 0,
      actual: metrics.rateLimitBypasses,
      severity: "warning",
    });
    suggestions.push("Check rate limiter configuration, add IP blocking");
  }

  if (
    constraints.security.inputValidated &&
    metrics.unvalidatedInputs > 0
  ) {
    failures.push({
      constraint: "input validation",
      expected: 0,
      actual: metrics.unvalidatedInputs,
      severity: "warning",
    });
    suggestions.push("Add Zod schemas to all endpoints");
  }

  const constraintsPassed = failures.length === 0;
  const autoFixable = failures.every(
    (f) => f.severity !== "critical" || f.constraint === "input validation"
  );

  return {
    constraintsPassed,
    failures,
    suggestions,
    autoFixable,
  };
}

// Calculate ROI for a potential tool
export function calculateROI(
  taskName: string,
  timePerTaskMinutes: number,
  frequencyPerWeek: number,
  automationPercent: number,
  buildTimeHours: number
): ROICalculation {
  // Calculate time saved
  const timeSavedPerTask = timePerTaskMinutes * (automationPercent / 100);
  const weeklyTimeSavedMinutes = timeSavedPerTask * frequencyPerWeek;
  const weeklyTimeSavedHours = weeklyTimeSavedMinutes / 60;

  // Calculate payback period
  const paybackWeeks =
    weeklyTimeSavedHours > 0 ? buildTimeHours / weeklyTimeSavedHours : Infinity;

  // Yearly savings (52 weeks)
  const yearlyHoursSaved = weeklyTimeSavedHours * 52;

  // Recommendation
  let recommendation: ROICalculation["recommendation"];
  if (paybackWeeks <= 2) {
    recommendation = "build";
  } else if (paybackWeeks <= 8) {
    recommendation = "wait"; // Consider building later
  } else {
    recommendation = "keep-ad-hoc";
  }

  return {
    taskName,
    timePerTaskMinutes,
    frequencyPerWeek,
    automationPercent,
    buildTimeHours,
    weeklyTimeSavedMinutes,
    paybackWeeks: Math.round(paybackWeeks * 10) / 10,
    yearlyHoursSaved: Math.round(yearlyHoursSaved * 10) / 10,
    recommendation,
  };
}

// Generate a meta-engineering plan
export async function generateMetaPlan(
  client: Anthropic,
  currentPain: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `As a meta-engineer, I want to eliminate this recurring pain:

"${currentPain}"

Design a meta-solution that:
1. Identifies the root pattern (what am I doing repeatedly?)
2. Proposes a Level 2 tool (what tool could generate this?)
3. Considers a Level 3 system (what system could generate such tools?)
4. Calculates approximate ROI

Format as a structured plan with clear steps.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "No plan generated";
}

// Builder vs Meta-Builder comparison
export const BUILDER_VS_META_BUILDER = [
  {
    builder: "Writes CRUD endpoints",
    metaBuilder: "Designs API generation systems",
  },
  {
    builder: "Debugs issues manually",
    metaBuilder: "Builds observability that surfaces issues",
  },
  {
    builder: "Writes test cases",
    metaBuilder: "Designs testing frameworks",
  },
  {
    builder: "Uses CI/CD",
    metaBuilder: "Designs CI/CD pipelines",
  },
  {
    builder: "Follows patterns",
    metaBuilder: "Creates patterns",
  },
  {
    builder: "Uses agents",
    metaBuilder: "Orchestrates agent systems",
  },
];

// The meta-engineer's key question
export const META_QUESTION =
  "How do I make all future work of this type cheaper?";

// Generate constraint definition code
export function generateConstraintCode(
  constraints: SystemConstraints
): string {
  return `// System constraints that define success
export const SystemConstraints = {
  performance: {
    p99LatencyMs: ${constraints.performance.p99LatencyMs},
    maxMemoryMb: ${constraints.performance.maxMemoryMb},
    maxCpuPercent: ${constraints.performance.maxCpuPercent},
  },
  correctness: {
    noDataLoss: ${constraints.correctness.noDataLoss},
    transactionsAtomic: ${constraints.correctness.transactionsAtomic},
    idempotent: ${constraints.correctness.idempotent},
  },
  security: {
    authRequired: ${constraints.security.authRequired},
    rateLimitEnforced: ${constraints.security.rateLimitEnforced},
    inputValidated: ${constraints.security.inputValidated},
  },
};

// Constraint check runs on every deploy
export function checkConstraints(metrics: SystemMetrics): boolean {
  // Fails build if constraints violated
  if (metrics.latencyP99Ms > SystemConstraints.performance.p99LatencyMs) {
    throw new Error(\`Latency constraint violated: \${metrics.latencyP99Ms}ms > \${SystemConstraints.performance.p99LatencyMs}ms\`);
  }
  // ... additional checks
  return true;
}`;
}

// Demo function
async function demo() {
  console.log("=== Meta-Builder Demo ===\n");

  // Show automation levels
  console.log("--- The Four Levels of Automation ---\n");
  for (const level of AUTOMATION_LEVELS) {
    const stopMarker = level.mostStopHere ? " ← Most developers stop here" : "";
    console.log(`Level ${level.level}: ${level.name}${stopMarker}`);
    console.log(`  ${level.description}`);
    console.log(`  Productivity: ${level.productivity}`);
    console.log(`  Example: ${level.example}`);
    console.log();
  }

  // Show builder vs meta-builder
  console.log("--- Builder vs Meta-Builder ---\n");
  console.log(`Key question: "${META_QUESTION}"\n`);
  console.log("| Builder | Meta-Builder |");
  console.log("|---------|--------------|");
  for (const comparison of BUILDER_VS_META_BUILDER) {
    console.log(`| ${comparison.builder} | ${comparison.metaBuilder} |`);
  }
  console.log();

  // ROI calculation example
  console.log("--- ROI Calculation Example ---\n");
  const roi = calculateROI(
    "Setting up new API endpoints",
    30, // 30 minutes per endpoint
    10, // 10 endpoints per week
    90, // 90% automation
    4 // 4 hours to build tool
  );

  console.log(`Task: ${roi.taskName}`);
  console.log(`Time per task: ${roi.timePerTaskMinutes} minutes`);
  console.log(`Frequency: ${roi.frequencyPerWeek}/week`);
  console.log(`Automation: ${roi.automationPercent}%`);
  console.log(`Build time: ${roi.buildTimeHours} hours`);
  console.log();
  console.log(`Weekly time saved: ${roi.weeklyTimeSavedMinutes} minutes`);
  console.log(`Payback: ${roi.paybackWeeks} weeks`);
  console.log(`Yearly savings: ${roi.yearlyHoursSaved} hours`);
  console.log(`Recommendation: ${roi.recommendation.toUpperCase()}`);
  console.log();

  // Constraint evaluation example
  console.log("--- Constraint Evaluation Example ---\n");
  const constraints = DEFAULT_CONSTRAINTS;
  const metrics = {
    latencyP99Ms: 150, // Over limit
    memoryUsedMb: 400,
    cpuPercent: 60,
    dataLossEvents: 0,
    nonAtomicTransactions: 0,
    nonIdempotentOps: 2, // Some non-idempotent ops
    unauthenticatedRequests: 0,
    rateLimitBypasses: 0,
    unvalidatedInputs: 3, // Missing validation
  };

  const result = evaluateConstraints(constraints, metrics);

  console.log(`Constraints passed: ${result.constraintsPassed}`);
  console.log(`Auto-fixable: ${result.autoFixable}`);

  if (result.failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of result.failures) {
      console.log(
        `  [${failure.severity.toUpperCase()}] ${failure.constraint}: expected ${failure.expected}, got ${failure.actual}`
      );
    }
  }

  if (result.suggestions.length > 0) {
    console.log("\nSuggestions:");
    for (const suggestion of result.suggestions) {
      console.log(`  - ${suggestion}`);
    }
  }

  // Show generated constraint code
  console.log("\n--- Generated Constraint Code ---\n");
  console.log(generateConstraintCode(DEFAULT_CONSTRAINTS));

  // The compound effect
  console.log("\n--- The Compound Effect ---\n");
  console.log("Session 1: Build observability harness");
  console.log("Session 2: Harness catches bugs automatically");
  console.log("Session 3: Agent uses telemetry to self-fix");
  console.log("Session 4: System optimizes itself");
  console.log("Session N: You are barely involved");
  console.log("\nNormal engineer: 1x output");
  console.log("Good engineer: 2x output");
  console.log("Meta-engineer: 10x+ output (and growing)");
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}

export type {
  SystemConstraints,
  FeedbackLoopResult,
  AutomationLevel,
  ROICalculation,
};
