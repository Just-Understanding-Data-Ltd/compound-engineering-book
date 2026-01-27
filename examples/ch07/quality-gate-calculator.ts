/**
 * Chapter 7: Quality Gates That Compound
 *
 * This file demonstrates the mathematical foundation of quality gates
 * as information filters that compound multiplicatively, not additively.
 *
 * Key concepts:
 * - State space reduction through set intersection
 * - Multiplicative compounding formula: Q_total = (1+q1) x (1+q2) x ... x (1+qn)
 * - Gate health metrics and measurement
 * - Technical debt accumulation modeling
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const client = new Anthropic();

// ============================================================================
// QUALITY GATE TYPES AND INTERFACES
// ============================================================================

/**
 * Represents a single quality gate in the verification stack
 */
export interface QualityGate {
  name: string;
  /** Improvement rate as decimal (0.10 = 10%) */
  improvementRate: number;
  /** Percentage of invalid implementations eliminated (0-1) */
  filterRate: number;
  /** Description of what bugs this gate catches */
  catches: string[];
  /** Command to run this gate (for hooks) */
  command?: string;
}

/**
 * Represents the state space at each stage of verification
 */
export interface StateSpace {
  stageName: string;
  /** Number of valid implementations remaining */
  size: number;
  /** Cumulative percentage eliminated from original */
  cumulativeEliminated: number;
}

/**
 * Results from calculating compounding effects
 */
export interface CompoundingResult {
  /** Individual gate improvements */
  gateImprovements: { gate: string; improvement: number }[];
  /** Linear (additive) expectation */
  linearExpectation: number;
  /** Multiplicative (actual) improvement */
  multiplicativeResult: number;
  /** Bonus from compounding */
  compoundingBonus: number;
  /** Step-by-step calculation */
  stepByStep: { gate: string; cumulative: number }[];
}

/**
 * Gate health metrics for monitoring
 */
export interface GateHealthMetrics {
  gateName: string;
  /** Percentage of generated code that passes on first try */
  firstPassRate: number;
  /** Average time to fix issues caught by this gate (seconds) */
  avgFixTime: number;
  /** Number of issues caught in last 100 generations */
  issuesCaught: number;
  /** Gate effectiveness score (0-100) */
  effectivenessScore: number;
}

/**
 * Technical debt accumulation model
 */
export interface TechnicalDebtModel {
  /** Violations per commit */
  violationsPerCommit: number;
  /** Commits per day */
  commitsPerDay: number;
  /** Days elapsed */
  days: number;
  /** Total violations accumulated */
  totalViolations: number;
  /** Estimated cleanup time (hours) */
  cleanupTimeHours: number;
  /** Cost if linting enabled day 0 */
  earlyAdoptionCost: number;
  /** ROI of early adoption */
  roi: number;
}

// ============================================================================
// THE SIX-GATE STACK
// ============================================================================

/**
 * The standard six-gate quality stack for AI-assisted development
 */
export const SIX_GATE_STACK: QualityGate[] = [
  {
    name: "Types (TypeScript)",
    improvementRate: 0.1, // 10%
    filterRate: 0.95, // Eliminates 95% of invalid implementations
    catches: [
      "Wrong return types",
      "Missing properties",
      "Null/undefined errors",
      "Parameter type mismatches",
    ],
    command: "tsc --noEmit --incremental",
  },
  {
    name: "Linting (ESLint)",
    improvementRate: 0.15, // 15%
    filterRate: 0.9, // Eliminates 90% of remaining
    catches: [
      "Inconsistent patterns",
      "Unused variables",
      "Implicit any",
      "Floating promises",
    ],
    command: "npx eslint {file} --fix",
  },
  {
    name: "Tests (Unit/Integration)",
    improvementRate: 0.2, // 20%
    filterRate: 0.96, // Eliminates 96% of remaining
    catches: [
      "Logic errors",
      "Edge cases",
      "Regression bugs",
      "Business rule violations",
    ],
    command: "npm test -- --related {file}",
  },
  {
    name: "CI/CD (GitHub Actions)",
    improvementRate: 0.15, // 15%
    filterRate: 0.8, // Eliminates 80% of remaining
    catches: [
      "Build failures",
      "Environment issues",
      "Integration problems",
      "Deployment errors",
    ],
    command: "gh workflow run ci.yml",
  },
  {
    name: "DDD (Domain Patterns)",
    improvementRate: 0.2, // 20%
    filterRate: 0.85, // Eliminates 85% of remaining
    catches: [
      "Architecture violations",
      "Bounded context leaks",
      "Domain invariant breaks",
      "Aggregate misuse",
    ],
  },
  {
    name: "CLAUDE.md (AI Context)",
    improvementRate: 0.25, // 25%
    filterRate: 0.9, // Eliminates 90% of remaining
    catches: [
      "Pattern deviations",
      "Naming violations",
      "Convention breaks",
      "Missing documentation",
    ],
  },
];

// ============================================================================
// COMPOUNDING FORMULA CALCULATIONS
// ============================================================================

/**
 * Calculates the multiplicative compounding effect of quality gates
 *
 * Formula: Q_total = (1 + q1) x (1 + q2) x ... x (1 + qn)
 *
 * @param gates Array of quality gates with improvement rates
 * @returns Detailed compounding calculation results
 */
export function calculateCompounding(gates: QualityGate[]): CompoundingResult {
  const gateImprovements = gates.map((g) => ({
    gate: g.name,
    improvement: g.improvementRate,
  }));

  // Linear (additive) expectation - the incorrect intuition
  const linearExpectation = gates.reduce((sum, g) => sum + g.improvementRate, 0);

  // Multiplicative calculation - the correct approach
  const stepByStep: { gate: string; cumulative: number }[] = [];
  let cumulative = 1.0;

  for (const gate of gates) {
    cumulative *= 1 + gate.improvementRate;
    stepByStep.push({
      gate: gate.name,
      cumulative: cumulative,
    });
  }

  const multiplicativeResult = cumulative - 1; // Convert back to improvement percentage
  const compoundingBonus = multiplicativeResult - linearExpectation;

  return {
    gateImprovements,
    linearExpectation,
    multiplicativeResult,
    compoundingBonus,
    stepByStep,
  };
}

/**
 * Calculates state space reduction through sequential gate filtering
 *
 * Each gate performs set intersection: Sn = Sn-1 ∩ Gn
 *
 * @param initialStateSpace Starting number of valid implementations
 * @param gates Quality gates to apply
 * @returns State space at each verification stage
 */
export function calculateStateSpaceReduction(
  initialStateSpace: number,
  gates: QualityGate[]
): StateSpace[] {
  const stages: StateSpace[] = [
    {
      stageName: "Initial (All Valid Programs)",
      size: initialStateSpace,
      cumulativeEliminated: 0,
    },
  ];

  let currentSize = initialStateSpace;

  for (const gate of gates) {
    const newSize = Math.round(currentSize * (1 - gate.filterRate));
    const cumulativeEliminated =
      ((initialStateSpace - newSize) / initialStateSpace) * 100;

    stages.push({
      stageName: `After ${gate.name}`,
      size: newSize,
      cumulativeEliminated,
    });

    currentSize = newSize;
  }

  return stages;
}

/**
 * Calculates the confidence that code is correct given passing gates
 *
 * P(correct | passes all gates) increases with each gate
 */
export function calculateConfidence(passedGates: string[]): number {
  const confidenceMap: Record<string, number> = {
    "No gates": 0.001, // 0.1%
    "Types (TypeScript)": 0.05, // 5%
    "Linting (ESLint)": 0.2, // 20%
    "Tests (Unit/Integration)": 0.7, // 70%
    "CI/CD (GitHub Actions)": 0.85, // 85%
    "DDD (Domain Patterns)": 0.92, // 92%
    "CLAUDE.md (AI Context)": 0.95, // 95%
  };

  if (passedGates.length === 0) {
    return confidenceMap["No gates"] ?? 0.001;
  }

  // Return confidence for the highest-level gate passed
  const lastGate = passedGates[passedGates.length - 1];
  if (!lastGate) {
    return 0.001;
  }
  return confidenceMap[lastGate] ?? 0.5;
}

// ============================================================================
// TECHNICAL DEBT MODELING
// ============================================================================

/**
 * Models technical debt accumulation over time
 *
 * Formula: V(t) = v x c x t
 * Where v = violations per commit, c = commits per day, t = days
 *
 * @param days Number of days elapsed
 * @param violationsPerCommit Average violations introduced per commit (default: 2)
 * @param commitsPerDay Average commits per day (default: 10)
 * @param minutesPerFix Time to fix one violation (default: 2)
 */
export function calculateTechnicalDebt(
  days: number,
  violationsPerCommit: number = 2,
  commitsPerDay: number = 10,
  minutesPerFix: number = 2
): TechnicalDebtModel {
  const totalViolations = violationsPerCommit * commitsPerDay * days;
  const cleanupTimeMinutes = totalViolations * minutesPerFix;
  const cleanupTimeHours = cleanupTimeMinutes / 60;

  // Early adoption cost: 30 min setup + 5 sec per commit overhead
  const totalCommits = commitsPerDay * days;
  const earlyAdoptionMinutes = 30 + (totalCommits * 5) / 60;
  const earlyAdoptionCost = earlyAdoptionMinutes / 60;

  // ROI: hours saved / hours invested
  const roi = cleanupTimeHours / earlyAdoptionCost;

  return {
    violationsPerCommit,
    commitsPerDay,
    days,
    totalViolations,
    cleanupTimeHours,
    earlyAdoptionCost,
    roi,
  };
}

/**
 * Compares early vs late linting adoption costs
 */
export function compareLintingStrategies(days: number): {
  earlyAdoption: TechnicalDebtModel;
  lateAdoption: TechnicalDebtModel;
  savings: number;
  recommendation: string;
} {
  const earlyAdoption = calculateTechnicalDebt(days);
  earlyAdoption.totalViolations = 0; // No violations accumulate with early adoption
  earlyAdoption.cleanupTimeHours = 0;

  const lateAdoption = calculateTechnicalDebt(days);

  const savings = lateAdoption.cleanupTimeHours - earlyAdoption.earlyAdoptionCost;

  return {
    earlyAdoption,
    lateAdoption,
    savings,
    recommendation:
      savings > 10
        ? "CRITICAL: Enable linting immediately. ROI exceeds 10x."
        : savings > 1
          ? "RECOMMENDED: Enable linting soon for significant time savings."
          : "OPTIONAL: Linting ROI is modest but still positive.",
  };
}

// ============================================================================
// GATE HEALTH METRICS
// ============================================================================

/**
 * Calculates gate health metrics from historical data
 */
export function calculateGateHealth(
  gateName: string,
  passedFirstTry: number,
  totalGenerations: number,
  totalIssues: number,
  totalFixTimeSeconds: number
): GateHealthMetrics {
  const firstPassRate = totalGenerations > 0 ? passedFirstTry / totalGenerations : 1;
  const avgFixTime = totalIssues > 0 ? totalFixTimeSeconds / totalIssues : 0;

  // Effectiveness = high pass rate + low fix time + reasonable issue catch rate
  const passRateScore = firstPassRate * 40;
  const fixTimeScore = Math.max(0, 30 - avgFixTime / 10); // Lower is better
  const catchRateScore = Math.min(30, totalIssues / 3);

  const effectivenessScore = passRateScore + fixTimeScore + catchRateScore;

  return {
    gateName,
    firstPassRate,
    avgFixTime,
    issuesCaught: totalIssues,
    effectivenessScore: Math.round(effectivenessScore),
  };
}

/**
 * Generates a health report for all gates
 */
export function generateHealthReport(gates: GateHealthMetrics[]): string {
  const lines = ["# Quality Gate Health Report", ""];

  for (const gate of gates) {
    const status =
      gate.effectivenessScore >= 70
        ? "HEALTHY"
        : gate.effectivenessScore >= 40
          ? "NEEDS ATTENTION"
          : "CRITICAL";

    lines.push(`## ${gate.gateName} - ${status}`);
    lines.push(`- First Pass Rate: ${(gate.firstPassRate * 100).toFixed(1)}%`);
    lines.push(`- Avg Fix Time: ${gate.avgFixTime.toFixed(1)}s`);
    lines.push(`- Issues Caught (last 100): ${gate.issuesCaught}`);
    lines.push(`- Effectiveness Score: ${gate.effectivenessScore}/100`);
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================================================
// HOOK CONFIGURATION HELPERS
// ============================================================================

/**
 * Claude Code hook configuration
 */
export interface HookConfig {
  command: string;
  description: string;
  continueOnError: boolean;
}

/**
 * Generates hook configuration for a quality gate
 */
export function generateHookConfig(gate: QualityGate): HookConfig | null {
  if (!gate.command) return null;

  return {
    command: gate.command,
    description: `Run ${gate.name} verification`,
    continueOnError: false,
  };
}

/**
 * Generates a chained hook command that runs multiple gates
 */
export function generateChainedHook(gates: QualityGate[]): HookConfig {
  const commands = gates
    .filter((g) => g.command)
    .map((g) => g.command)
    .join(" && ");

  return {
    command: commands,
    description: `Chain: ${gates.map((g) => g.name).join(" → ")}`,
    continueOnError: false,
  };
}

// ============================================================================
// CLAUDE SDK INTEGRATION
// ============================================================================

/**
 * Uses Claude to analyze which quality gates would catch specific issues
 */
export async function analyzeIssueWithGates(
  codeSnippet: string,
  issueDescription: string
): Promise<{
  analysis: string;
  recommendedGates: string[];
  priority: "low" | "medium" | "high" | "critical";
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this code issue and determine which quality gates would catch it.

CODE:
\`\`\`typescript
${codeSnippet}
\`\`\`

ISSUE: ${issueDescription}

AVAILABLE GATES:
1. Types (TypeScript) - catches type errors, null issues, wrong parameters
2. Linting (ESLint) - catches patterns, unused variables, style issues
3. Tests (Unit/Integration) - catches logic errors, edge cases, regressions
4. CI/CD (GitHub Actions) - catches build/deploy issues
5. DDD (Domain Patterns) - catches architecture violations
6. CLAUDE.md (AI Context) - catches convention violations

Respond in JSON format:
{
  "analysis": "Brief analysis of the issue",
  "recommendedGates": ["Gate1", "Gate2"],
  "priority": "low|medium|high|critical"
}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textBlock.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim();
    }
    return JSON.parse(jsonText);
  } catch {
    return {
      analysis: textBlock.text,
      recommendedGates: ["Types (TypeScript)", "Tests (Unit/Integration)"],
      priority: "medium",
    };
  }
}

/**
 * Uses Claude to suggest improvements to a quality gate configuration
 */
export async function suggestGateImprovements(
  currentGates: QualityGate[],
  recentIssues: string[]
): Promise<string> {
  const gatesSummary = currentGates
    .map((g) => `- ${g.name}: catches ${g.catches.join(", ")}`)
    .join("\n");

  const issuesSummary = recentIssues.map((i, idx) => `${idx + 1}. ${i}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Review this quality gate configuration and suggest improvements based on recent issues.

CURRENT GATES:
${gatesSummary}

RECENT ISSUES THAT ESCAPED GATES:
${issuesSummary}

Suggest:
1. Which existing gates need strengthening
2. New rules or checks to add
3. Any gaps in the gate stack
4. Priority order for improvements`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "Unable to generate suggestions";
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

/**
 * Demonstrates the compounding formula calculation
 */
export function demoCompounding(): void {
  console.log("=== Quality Gate Compounding Demo ===\n");

  const result = calculateCompounding(SIX_GATE_STACK);

  console.log("Individual Gate Improvements:");
  for (const gi of result.gateImprovements) {
    console.log(`  ${gi.gate}: +${(gi.improvement * 100).toFixed(0)}%`);
  }

  console.log("\nLinear Expectation (Wrong Intuition):");
  console.log(`  Sum of improvements: ${(result.linearExpectation * 100).toFixed(0)}%`);

  console.log("\nMultiplicative Reality (Correct):");
  console.log("  Step-by-step calculation:");
  for (const step of result.stepByStep) {
    console.log(`    After ${step.gate}: ${step.cumulative.toFixed(3)}x`);
  }

  console.log(`\n  Total improvement: ${(result.multiplicativeResult * 100).toFixed(0)}%`);
  console.log(`  Compounding bonus: +${(result.compoundingBonus * 100).toFixed(0)}%`);
}

/**
 * Demonstrates state space reduction
 */
export function demoStateSpaceReduction(): void {
  console.log("\n=== State Space Reduction Demo ===\n");

  // Start with 1 million possible implementations
  const stages = calculateStateSpaceReduction(1_000_000, SIX_GATE_STACK.slice(0, 3));

  console.log("State Space at Each Stage:");
  for (const stage of stages) {
    console.log(
      `  ${stage.stageName}: ${stage.size.toLocaleString()} implementations ` +
        `(${stage.cumulativeEliminated.toFixed(2)}% eliminated)`
    );
  }

  console.log("\nConclusion: From 1,000,000 to ~200 valid implementations");
  console.log("Those final implementations are semantically equivalent.");
}

/**
 * Demonstrates technical debt modeling
 */
export function demoTechnicalDebt(): void {
  console.log("\n=== Technical Debt Modeling Demo ===\n");

  const comparison = compareLintingStrategies(90); // 3 months

  console.log("Scenario: 3-month project without linting");
  console.log(`  Total violations: ${comparison.lateAdoption.totalViolations.toLocaleString()}`);
  console.log(`  Cleanup time: ${comparison.lateAdoption.cleanupTimeHours.toFixed(1)} hours`);

  console.log("\nScenario: Same project with day-0 linting");
  console.log(`  Total violations: ${comparison.earlyAdoption.totalViolations}`);
  console.log(`  Setup + overhead: ${comparison.earlyAdoption.earlyAdoptionCost.toFixed(1)} hours`);

  console.log(`\nTime saved: ${comparison.savings.toFixed(1)} hours`);
  console.log(`ROI: ${comparison.lateAdoption.roi.toFixed(0)}x`);
  console.log(`Recommendation: ${comparison.recommendation}`);
}

/**
 * Demonstrates Claude integration for gate analysis
 */
export async function demoClaudeAnalysis(): Promise<void> {
  console.log("\n=== Claude Gate Analysis Demo ===\n");

  const codeSnippet = `
function processUser(user: any) {
  console.log("Processing user:", user.name);
  return user.data.value + 1;
}`;

  const issueDescription = "Possible null pointer access on user.data";

  console.log("Analyzing code with Claude...");
  console.log("Code:", codeSnippet);
  console.log("Issue:", issueDescription);

  try {
    const analysis = await analyzeIssueWithGates(codeSnippet, issueDescription);
    console.log("\nAnalysis:", analysis.analysis);
    console.log("Recommended Gates:", analysis.recommendedGates.join(", "));
    console.log("Priority:", analysis.priority);
  } catch {
    console.log("(Demo requires API key - showing expected workflow)");
  }
}

/**
 * Main demo function
 */
export async function demo(): Promise<void> {
  console.log("Chapter 7: Quality Gates That Compound");
  console.log("======================================\n");

  // Non-API demos
  demoCompounding();
  demoStateSpaceReduction();
  demoTechnicalDebt();

  // API-dependent demo
  if (process.env.ANTHROPIC_API_KEY) {
    await demoClaudeAnalysis();
  } else {
    console.log("\n(Set ANTHROPIC_API_KEY to run Claude integration demos)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}
