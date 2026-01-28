/**
 * Chapter 10: The RALPH Loop - Clean Slate Recovery
 *
 * This file demonstrates the clean slate recovery pattern for escaping
 * failed trajectories and context rot.
 *
 * Key concepts:
 * - Recognizing stuck trajectories (3+ failed attempts)
 * - Context rot symptoms (circular reasoning, declining quality)
 * - Clean slate framing with constraints
 * - Cost analysis of continuing vs. recovering
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract text content from an SDK assistant message
 */
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const content = message.message.content;
  if (typeof content === "string") return content;

  // Extract text from content blocks
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * A single problem-solving attempt
 */
export interface Attempt {
  /** Attempt number */
  number: number;
  /** Approach tried */
  approach: string;
  /** What happened */
  outcome: string;
  /** Whether it succeeded */
  success: boolean;
  /** Tokens used */
  tokensUsed: number;
  /** Time spent in milliseconds */
  timeMs: number;
  /** Error or failure reason */
  failureReason?: string;
}

/**
 * A problem-solving trajectory (sequence of attempts)
 */
export interface Trajectory {
  /** Problem description */
  problem: string;
  /** All attempts made */
  attempts: Attempt[];
  /** Whether trajectory succeeded */
  resolved: boolean;
  /** Total tokens used */
  totalTokens: number;
  /** Total time spent */
  totalTimeMs: number;
  /** Session ID for tracking */
  sessionId: string;
}

/**
 * Symptoms of a failing trajectory
 */
export interface TrajectorySymptoms {
  /** Same approach variations despite failures */
  sameApproachVariations: boolean;
  /** Referring back to failed attempts as solutions */
  circularReasoning: boolean;
  /** Later suggestions worse than early ones */
  decliningQuality: boolean;
  /** 3+ failed attempts */
  exceededAttemptThreshold: boolean;
  /** Overall stuck indicator */
  isStuck: boolean;
  /** Confidence that trajectory is failing (0-100) */
  stuckConfidence: number;
}

/**
 * Constraint extracted from failed attempts
 */
export interface Constraint {
  /** What must be done or cannot be done */
  description: string;
  /** Why this constraint exists */
  reason: string;
  /** Which failed attempt revealed this */
  discoveredFrom: number;
}

/**
 * Clean slate recovery frame
 */
export interface CleanSlateFrame {
  /** Original problem */
  problem: string;
  /** High-level context about what was tried */
  context: string;
  /** Root cause analysis */
  rootCause: string;
  /** Constraints to avoid repeating failures */
  constraints: Constraint[];
  /** Suggested new direction */
  suggestedApproach?: string;
}

/**
 * Cost comparison between trajectories
 */
export interface CostComparison {
  /** Broken trajectory costs */
  brokenTrajectory: {
    attempts: number;
    tokens: number;
    timeMs: number;
    successRate: number;
  };
  /** Clean slate recovery costs */
  cleanSlate: {
    estimatedAttempts: number;
    estimatedTokens: number;
    estimatedTimeMs: number;
    expectedSuccessRate: number;
  };
  /** Savings from clean slate */
  savings: {
    tokens: number;
    timeMs: number;
    successRateImprovement: number;
  };
  /** Recommendation */
  recommendation: "continue" | "clean_slate";
}

// ============================================================================
// TRAJECTORY ANALYSIS
// ============================================================================

/**
 * Analyze a trajectory for symptoms of being stuck
 */
export function analyzeTrajectory(trajectory: Trajectory): TrajectorySymptoms {
  const attempts = trajectory.attempts;

  // Check for same approach variations
  const approaches = attempts.map((a) => a.approach.toLowerCase());
  const uniqueApproaches = new Set(approaches);
  const sameApproachVariations = approaches.length > 2 && uniqueApproaches.size < approaches.length;

  // Check for circular reasoning (referencing earlier failures as solutions)
  const circularReasoning = attempts.some((a, i) => {
    if (i < 2) return false;
    const lowerApproach = a.approach.toLowerCase();
    return attempts.slice(0, i).some(
      (prev) =>
        prev.failureReason &&
        lowerApproach.includes(prev.failureReason.toLowerCase().slice(0, 20))
    );
  });

  // Check for declining quality (later attempts have less detail/creativity)
  const lastAttempt = attempts[attempts.length - 1];
  const firstAttempt = attempts[0];
  const decliningQuality =
    attempts.length >= 3 &&
    lastAttempt !== undefined &&
    firstAttempt !== undefined &&
    lastAttempt.approach.length < firstAttempt.approach.length * 0.7;

  // Check threshold
  const exceededAttemptThreshold = attempts.filter((a) => !a.success).length >= 3;

  // Calculate stuck confidence
  let stuckConfidence = 0;
  if (sameApproachVariations) stuckConfidence += 25;
  if (circularReasoning) stuckConfidence += 30;
  if (decliningQuality) stuckConfidence += 20;
  if (exceededAttemptThreshold) stuckConfidence += 25;

  const isStuck = stuckConfidence >= 50;

  return {
    sameApproachVariations,
    circularReasoning,
    decliningQuality,
    exceededAttemptThreshold,
    isStuck,
    stuckConfidence,
  };
}

/**
 * Extract constraints from failed attempts
 */
export function extractConstraints(trajectory: Trajectory): Constraint[] {
  const constraints: Constraint[] = [];

  for (const attempt of trajectory.attempts) {
    if (!attempt.success && attempt.failureReason) {
      // Convert failure reason into constraint
      const constraint: Constraint = {
        description: `Cannot use ${attempt.approach.split(" ").slice(0, 3).join(" ")}`,
        reason: attempt.failureReason,
        discoveredFrom: attempt.number,
      };
      constraints.push(constraint);
    }
  }

  // Deduplicate similar constraints
  const unique: Constraint[] = [];
  for (const c of constraints) {
    const isDuplicate = unique.some(
      (u) => u.description.toLowerCase() === c.description.toLowerCase()
    );
    if (!isDuplicate) {
      unique.push(c);
    }
  }

  return unique;
}

/**
 * Perform root cause analysis on failed trajectory
 */
export function performRootCauseAnalysis(trajectory: Trajectory): string {
  const attempts = trajectory.attempts;
  const failures = attempts.filter((a) => !a.success);

  if (failures.length === 0) {
    return "No failures to analyze";
  }

  // Look for common patterns in failure reasons
  const failureReasons = failures
    .map((f) => f.failureReason)
    .filter((r): r is string => !!r);

  // Simple pattern detection
  if (failureReasons.every((r) => r.toLowerCase().includes("api"))) {
    return "Root cause: API limitation or design constraint";
  }
  if (failureReasons.every((r) => r.toLowerCase().includes("type") || r.toLowerCase().includes("undefined"))) {
    return "Root cause: Type system or data structure mismatch";
  }
  if (failureReasons.every((r) => r.toLowerCase().includes("permission") || r.toLowerCase().includes("auth"))) {
    return "Root cause: Authentication or authorization issue";
  }

  // Default: summarize the pattern
  return `Root cause: Multiple issues - ${failureReasons.slice(0, 2).join("; ")}`;
}

// ============================================================================
// CLEAN SLATE FRAMING
// ============================================================================

/**
 * Build a clean slate frame from a failed trajectory
 */
export function buildCleanSlateFrame(trajectory: Trajectory): CleanSlateFrame {
  const constraints = extractConstraints(trajectory);
  const rootCause = performRootCauseAnalysis(trajectory);

  return {
    problem: trajectory.problem,
    context: `Previous attempts tried: ${trajectory.attempts.map((a) => a.approach).join("; ")}`,
    rootCause,
    constraints,
    suggestedApproach: suggestNewDirection(trajectory, constraints),
  };
}

/**
 * Suggest a new direction based on what failed
 */
export function suggestNewDirection(trajectory: Trajectory, _constraints: Constraint[]): string {
  // Analyze what approaches were tried (constraints available for future refinement)
  const approachesLower = trajectory.attempts.map((a) => a.approach.toLowerCase());

  // Simple heuristics for new directions
  if (approachesLower.some((a) => a.includes("jwt")) && approachesLower.every((a) => a.includes("token"))) {
    return "Consider session-based authentication instead of tokens";
  }
  if (approachesLower.some((a) => a.includes("client")) && approachesLower.every((a) => a.includes("client"))) {
    return "Consider moving logic to the server side";
  }
  if (approachesLower.some((a) => a.includes("sync"))) {
    return "Consider asynchronous or event-driven approach";
  }

  return "Consider a fundamentally different approach based on the constraints";
}

/**
 * Format clean slate frame as a prompt
 */
export function formatCleanSlatePrompt(frame: CleanSlateFrame): string {
  const constraintsList = frame.constraints
    .map((c) => `- ${c.description} (because: ${c.reason})`)
    .join("\n");

  return `Task: ${frame.problem}

Context: ${frame.context}

Why previous approaches failed: ${frame.rootCause}

Constraints (do not violate these):
${constraintsList}

${frame.suggestedApproach ? `Suggested direction: ${frame.suggestedApproach}` : ""}

Please propose a new approach that respects all constraints above.`;
}

// ============================================================================
// COST ANALYSIS
// ============================================================================

/**
 * Calculate cost comparison between continuing and clean slate
 */
export function calculateCostComparison(trajectory: Trajectory): CostComparison {
  const failedAttempts = trajectory.attempts.filter((a) => !a.success);
  const avgTokensPerAttempt = trajectory.totalTokens / trajectory.attempts.length;
  const avgTimePerAttempt = trajectory.totalTimeMs / trajectory.attempts.length;

  // Estimate continuing costs (pessimistic - declining returns)
  const estimatedRemainingAttempts = Math.max(3, failedAttempts.length);
  const continuingSuccessRate = Math.max(10, 50 - failedAttempts.length * 15); // Declines with each failure

  // Estimate clean slate costs (optimistic - fresh context)
  const cleanSlateAttempts = 2; // Typically 1-2 attempts with good framing
  const cleanSlateTokens = avgTokensPerAttempt * cleanSlateAttempts * 0.8; // Fresh context is more efficient
  const cleanSlateSuccessRate = 80; // High success rate with proper constraints

  const brokenTrajectory = {
    attempts: trajectory.attempts.length + estimatedRemainingAttempts,
    tokens: trajectory.totalTokens + avgTokensPerAttempt * estimatedRemainingAttempts,
    timeMs: trajectory.totalTimeMs + avgTimePerAttempt * estimatedRemainingAttempts,
    successRate: continuingSuccessRate,
  };

  const cleanSlate = {
    estimatedAttempts: cleanSlateAttempts,
    estimatedTokens: cleanSlateTokens,
    estimatedTimeMs: avgTimePerAttempt * cleanSlateAttempts,
    expectedSuccessRate: cleanSlateSuccessRate,
  };

  const savings = {
    tokens: brokenTrajectory.tokens - cleanSlate.estimatedTokens,
    timeMs: brokenTrajectory.timeMs - cleanSlate.estimatedTimeMs,
    successRateImprovement: cleanSlate.expectedSuccessRate - brokenTrajectory.successRate,
  };

  // Recommend clean slate if significant savings
  const recommendation =
    savings.tokens > 5000 || savings.successRateImprovement > 30 ? "clean_slate" : "continue";

  return {
    brokenTrajectory,
    cleanSlate,
    savings,
    recommendation,
  };
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Execute a clean slate recovery with Claude
 */
export async function executeCleanSlateRecovery(
  frame: CleanSlateFrame
): Promise<{ approach: string; tokensUsed: number }> {
  const prompt = formatCleanSlatePrompt(frame);

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5",
      allowedTools: [], // No tools needed for clean slate recovery
    },
  });

  let approach = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      approach += extractTextContent(message);
    }
  }

  // Estimate tokens from content length (Agent SDK doesn't expose usage directly)
  const tokensUsed = Math.ceil(prompt.length * 0.25) + Math.ceil(approach.length * 0.25);

  return { approach, tokensUsed };
}

/**
 * Detect if current conversation needs clean slate (simulated)
 */
export function shouldTriggerCleanSlate(
  _currentAttempts: number, // Available for future threshold tuning
  recentFailures: number,
  symptoms: TrajectorySymptoms
): { trigger: boolean; reason: string } {
  // Trigger if 3+ failed attempts
  if (recentFailures >= 3) {
    return { trigger: true, reason: "Exceeded 3-attempt threshold" };
  }

  // Trigger if high stuck confidence
  if (symptoms.stuckConfidence >= 75) {
    return { trigger: true, reason: `High stuck confidence (${symptoms.stuckConfidence}%)` };
  }

  // Trigger if showing multiple symptoms
  const symptomCount = [
    symptoms.sameApproachVariations,
    symptoms.circularReasoning,
    symptoms.decliningQuality,
  ].filter(Boolean).length;

  if (symptomCount >= 2) {
    return { trigger: true, reason: `Multiple stuck symptoms (${symptomCount})` };
  }

  return { trigger: false, reason: "Trajectory appears healthy" };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate clean slate recovery patterns
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 10: Clean Slate Recovery ===\n");

  // Example 1: Create a failing trajectory
  console.log("1. Simulating a Stuck Trajectory");
  const stuckTrajectory: Trajectory = {
    problem: "Implement authentication that keeps users logged in",
    sessionId: "session-001",
    resolved: false,
    totalTokens: 0,
    totalTimeMs: 0,
    attempts: [
      {
        number: 1,
        approach: "Implement JWT refresh tokens",
        outcome: "Failed - API doesn't support refresh endpoint",
        success: false,
        tokensUsed: 8000,
        timeMs: 120000,
        failureReason: "API doesn't expose refresh endpoints",
      },
      {
        number: 2,
        approach: "Store refresh token in localStorage",
        outcome: "Failed - still no endpoint to use it",
        success: false,
        tokensUsed: 6000,
        timeMs: 90000,
        failureReason: "No refresh endpoint available",
      },
      {
        number: 3,
        approach: "Adjust JWT token validation timing",
        outcome: "Failed - API design issue, not validation",
        success: false,
        tokensUsed: 7000,
        timeMs: 100000,
        failureReason: "Root cause is API design, not validation",
      },
      {
        number: 4,
        approach: "Try extending JWT expiration",
        outcome: "Failed - security concern, doesn't solve persistence",
        success: false,
        tokensUsed: 5000,
        timeMs: 80000,
        failureReason: "Security risk and doesn't address root cause",
      },
    ],
  };

  // Calculate totals
  stuckTrajectory.totalTokens = stuckTrajectory.attempts.reduce((sum, a) => sum + a.tokensUsed, 0);
  stuckTrajectory.totalTimeMs = stuckTrajectory.attempts.reduce((sum, a) => sum + a.timeMs, 0);

  console.log(`   Problem: ${stuckTrajectory.problem}`);
  console.log(`   Attempts: ${stuckTrajectory.attempts.length}`);
  console.log(`   Total tokens: ${stuckTrajectory.totalTokens}`);
  console.log(`   Total time: ${Math.round(stuckTrajectory.totalTimeMs / 60000)} minutes`);

  // Example 2: Analyze trajectory symptoms
  console.log("\n2. Trajectory Analysis");
  const symptoms = analyzeTrajectory(stuckTrajectory);
  console.log(`   Same approach variations: ${symptoms.sameApproachVariations}`);
  console.log(`   Circular reasoning: ${symptoms.circularReasoning}`);
  console.log(`   Declining quality: ${symptoms.decliningQuality}`);
  console.log(`   Exceeded threshold: ${symptoms.exceededAttemptThreshold}`);
  console.log(`   Stuck confidence: ${symptoms.stuckConfidence}%`);
  console.log(`   Is stuck: ${symptoms.isStuck}`);

  // Example 3: Check if should trigger clean slate
  console.log("\n3. Clean Slate Decision");
  const decision = shouldTriggerCleanSlate(
    stuckTrajectory.attempts.length,
    stuckTrajectory.attempts.filter((a) => !a.success).length,
    symptoms
  );
  console.log(`   Trigger clean slate: ${decision.trigger}`);
  console.log(`   Reason: ${decision.reason}`);

  // Example 4: Extract constraints
  console.log("\n4. Constraints Extracted from Failures");
  const constraints = extractConstraints(stuckTrajectory);
  for (const c of constraints) {
    console.log(`   - ${c.description}`);
    console.log(`     Reason: ${c.reason}`);
  }

  // Example 5: Build clean slate frame
  console.log("\n5. Clean Slate Frame");
  const frame = buildCleanSlateFrame(stuckTrajectory);
  console.log(`   Root cause: ${frame.rootCause}`);
  console.log(`   Suggested approach: ${frame.suggestedApproach}`);
  console.log(`   Constraints: ${frame.constraints.length}`);

  // Example 6: Format the prompt
  console.log("\n6. Clean Slate Prompt");
  const prompt = formatCleanSlatePrompt(frame);
  console.log(`   Prompt length: ${prompt.length} characters`);
  console.log(`   Preview:\n   ${prompt.split("\n").slice(0, 5).join("\n   ")}...`);

  // Example 7: Cost comparison
  console.log("\n7. Cost Analysis");
  const costs = calculateCostComparison(stuckTrajectory);
  console.log(`   Continuing trajectory:`);
  console.log(`     Estimated attempts: ${costs.brokenTrajectory.attempts}`);
  console.log(`     Estimated tokens: ${Math.round(costs.brokenTrajectory.tokens)}`);
  console.log(`     Success rate: ${costs.brokenTrajectory.successRate}%`);
  console.log(`   Clean slate recovery:`);
  console.log(`     Estimated attempts: ${costs.cleanSlate.estimatedAttempts}`);
  console.log(`     Estimated tokens: ${Math.round(costs.cleanSlate.estimatedTokens)}`);
  console.log(`     Success rate: ${costs.cleanSlate.expectedSuccessRate}%`);
  console.log(`   Savings:`);
  console.log(`     Tokens: ${Math.round(costs.savings.tokens)}`);
  console.log(`     Success rate improvement: +${costs.savings.successRateImprovement}%`);
  console.log(`   Recommendation: ${costs.recommendation.toUpperCase()}`);

  // Example 8: Execute clean slate recovery (if API available)
  console.log("\n8. Clean Slate Execution (API Demo)");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const recovery = await executeCleanSlateRecovery(frame);
      console.log(`   New approach: ${recovery.approach.slice(0, 150)}...`);
      console.log(`   Tokens used: ${recovery.tokensUsed}`);
    } catch (error) {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping execution)");
  }

  // Example 9: Healthy trajectory for comparison
  console.log("\n9. Healthy Trajectory Comparison");
  const healthyTrajectory: Trajectory = {
    problem: "Add rate limiting to API",
    sessionId: "session-002",
    resolved: true,
    totalTokens: 10000,
    totalTimeMs: 150000,
    attempts: [
      {
        number: 1,
        approach: "Implement sliding window rate limiter with Redis",
        outcome: "Success - implemented and tested",
        success: true,
        tokensUsed: 10000,
        timeMs: 150000,
      },
    ],
  };
  const healthySymptoms = analyzeTrajectory(healthyTrajectory);
  console.log(`   Attempts: ${healthyTrajectory.attempts.length}`);
  console.log(`   Stuck confidence: ${healthySymptoms.stuckConfidence}%`);
  console.log(`   Status: ${healthyTrajectory.resolved ? "Resolved" : "Ongoing"}`);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
