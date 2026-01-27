/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates the clean slate recovery pattern.
 * After 3+ failed attempts at solving a problem, context rot sets in.
 * The AI gets stuck suggesting variations of things that already failed.
 *
 * Key concepts:
 * - Recognizing when to start fresh
 * - Extracting constraints from failed attempts
 * - Preserving learnings while discarding baggage
 * - Cost-benefit analysis of clean slate vs continuing
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const client = new Anthropic();

// ============================================================================
// CLEAN SLATE TYPES AND INTERFACES
// ============================================================================

/**
 * Signs that indicate context rot
 */
export type ContextRotSign =
  | "repeated_approach"
  | "quality_decline"
  | "circular_reference"
  | "stuck_feeling"
  | "hallucinations"
  | "contradictory_suggestions";

/**
 * Describes a failed attempt
 */
export interface FailedAttempt {
  /** Approach that was tried */
  approach: string;
  /** Why it failed */
  failureReason: string;
  /** Code or implementation details */
  implementation?: string;
  /** Constraints discovered during this attempt */
  discoveredConstraints: string[];
  /** Time spent on this attempt (minutes) */
  timeSpent: number;
  /** Tokens consumed */
  tokensUsed: number;
}

/**
 * Session state tracking
 */
export interface SessionState {
  /** Number of attempts so far */
  attemptCount: number;
  /** All failed attempts */
  failedAttempts: FailedAttempt[];
  /** Signs of context rot observed */
  rotSigns: ContextRotSign[];
  /** Whether clean slate is recommended */
  cleanSlateRecommended: boolean;
  /** Confidence in recommendation (0-1) */
  confidence: number;
}

/**
 * Clean slate recovery result
 */
export interface CleanSlateRecovery {
  /** Constraints extracted from all failed attempts */
  constraints: string[];
  /** Approaches that definitely don't work */
  failedApproaches: string[];
  /** The actual requirements discovered */
  actualRequirements: string[];
  /** Fresh prompt incorporating learnings */
  freshPrompt: string;
  /** Estimated cost savings */
  estimatedSavings: {
    timeMinutes: number;
    tokens: number;
    successProbability: number;
  };
}

/**
 * Cost analysis comparing continuing vs clean slate
 */
export interface CostAnalysis {
  continueEstimate: {
    timeMinutes: number;
    tokens: number;
    successProbability: number;
  };
  cleanSlateEstimate: {
    timeMinutes: number;
    tokens: number;
    successProbability: number;
  };
  recommendation: "continue" | "clean_slate";
  breakEvenAttempt: number;
}

// ============================================================================
// CONTEXT ROT DETECTION
// ============================================================================

/**
 * Symptoms and their descriptions
 */
export const CONTEXT_ROT_SYMPTOMS: Record<ContextRotSign, string> = {
  repeated_approach:
    "Same approach being suggested with minor variations (try X, try X+Y, try X+Z)",
  quality_decline:
    "Later suggestions are worse than earlier ones (more complex, less accurate)",
  circular_reference:
    "References to earlier attempts ('let's go back to approach 1')",
  stuck_feeling:
    "Conversation feels unproductive, no new insights being generated",
  hallucinations:
    "AI suggesting non-existent APIs, methods, or incorrect syntax",
  contradictory_suggestions:
    "AI suggesting approaches that contradict earlier correct statements",
};

/**
 * Thresholds for triggering clean slate
 */
export const CLEAN_SLATE_THRESHOLDS = {
  /** Number of failed attempts before considering clean slate */
  minAttempts: 3,
  /** Number of rot signs before recommending clean slate */
  rotSignsForRecommendation: 2,
  /** Time spent (minutes) before recommending clean slate */
  timeThreshold: 40,
  /** Tokens used before recommending clean slate */
  tokenThreshold: 40000,
};

/**
 * Analyze session state for context rot
 */
export function detectContextRot(attempts: FailedAttempt[]): {
  rotSigns: ContextRotSign[];
  cleanSlateRecommended: boolean;
  confidence: number;
} {
  const rotSigns: ContextRotSign[] = [];

  // Check for repeated approaches
  const approaches = attempts.map((a) => a.approach.toLowerCase());
  const uniqueApproaches = new Set(approaches);
  if (uniqueApproaches.size < approaches.length * 0.7) {
    rotSigns.push("repeated_approach");
  }

  // Check for circular references (any approach tried more than once)
  const approachCounts = new Map<string, number>();
  for (const approach of approaches) {
    approachCounts.set(approach, (approachCounts.get(approach) || 0) + 1);
  }
  if ([...approachCounts.values()].some((count) => count > 1)) {
    rotSigns.push("circular_reference");
  }

  // Check time and token thresholds
  const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const totalTokens = attempts.reduce((sum, a) => sum + a.tokensUsed, 0);

  if (totalTime > CLEAN_SLATE_THRESHOLDS.timeThreshold) {
    rotSigns.push("stuck_feeling");
  }

  // Calculate confidence based on multiple factors
  let confidence = 0;
  if (attempts.length >= CLEAN_SLATE_THRESHOLDS.minAttempts) {
    confidence += 0.3;
  }
  if (rotSigns.length >= CLEAN_SLATE_THRESHOLDS.rotSignsForRecommendation) {
    confidence += 0.3;
  }
  if (totalTokens > CLEAN_SLATE_THRESHOLDS.tokenThreshold) {
    confidence += 0.2;
  }
  if (totalTime > CLEAN_SLATE_THRESHOLDS.timeThreshold) {
    confidence += 0.2;
  }

  const cleanSlateRecommended =
    attempts.length >= CLEAN_SLATE_THRESHOLDS.minAttempts &&
    rotSigns.length >= CLEAN_SLATE_THRESHOLDS.rotSignsForRecommendation;

  return {
    rotSigns,
    cleanSlateRecommended,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Track session state and detect when clean slate is needed
 */
export class SessionTracker {
  private attempts: FailedAttempt[] = [];

  /**
   * Record a failed attempt
   */
  recordAttempt(attempt: FailedAttempt): SessionState {
    this.attempts.push(attempt);
    const detection = detectContextRot(this.attempts);

    return {
      attemptCount: this.attempts.length,
      failedAttempts: [...this.attempts],
      ...detection,
    };
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    const detection = detectContextRot(this.attempts);
    return {
      attemptCount: this.attempts.length,
      failedAttempts: [...this.attempts],
      ...detection,
    };
  }

  /**
   * Clear session (after clean slate)
   */
  reset(): void {
    this.attempts = [];
  }

  /**
   * Get all attempts for analysis
   */
  getAttempts(): FailedAttempt[] {
    return [...this.attempts];
  }
}

// ============================================================================
// CLEAN SLATE RECOVERY
// ============================================================================

/**
 * Extract constraints and learnings from failed attempts
 */
export function extractConstraints(
  attempts: FailedAttempt[]
): CleanSlateRecovery {
  // Collect all discovered constraints
  const allConstraints = attempts.flatMap((a) => a.discoveredConstraints);
  const uniqueConstraints = [...new Set(allConstraints)];

  // Collect failed approaches
  const failedApproaches = attempts.map(
    (a) => `${a.approach}: ${a.failureReason}`
  );

  // Extract actual requirements from failure reasons
  const actualRequirements = attempts
    .map((a) => {
      // Look for patterns like "must", "cannot", "requires"
      const matches = a.failureReason.match(
        /(must|cannot|requires|doesn't support|only works with)[^.]+/gi
      );
      return matches || [];
    })
    .flat()
    .filter((r, i, arr) => arr.indexOf(r) === i);

  // Build fresh prompt
  const freshPrompt = buildFreshPrompt(
    uniqueConstraints,
    failedApproaches,
    actualRequirements
  );

  // Calculate estimated savings
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const totalTokensUsed = attempts.reduce((sum, a) => sum + a.tokensUsed, 0);

  return {
    constraints: uniqueConstraints,
    failedApproaches,
    actualRequirements,
    freshPrompt,
    estimatedSavings: {
      timeMinutes: Math.max(0, totalTimeSpent - 25), // Clean slate typically takes ~25 min
      tokens: Math.max(0, totalTokensUsed - 20000), // Typically ~20K tokens for clean start
      successProbability: 0.8, // Clean slate has ~80% success vs ~30% continuing
    },
  };
}

/**
 * Build a fresh prompt incorporating learnings from failed attempts
 */
function buildFreshPrompt(
  constraints: string[],
  failedApproaches: string[],
  requirements: string[]
): string {
  const lines: string[] = [
    "Implement the feature with a fresh approach.",
    "",
    "CONSTRAINTS FROM PREVIOUS ATTEMPTS:",
  ];

  for (const constraint of constraints) {
    lines.push(`- ${constraint}`);
  }

  lines.push("");
  lines.push("APPROACHES THAT DO NOT WORK:");
  for (const approach of failedApproaches.slice(0, 3)) {
    // Limit to top 3
    lines.push(`- ${approach}`);
  }

  if (requirements.length > 0) {
    lines.push("");
    lines.push("ACTUAL REQUIREMENTS DISCOVERED:");
    for (const req of requirements) {
      lines.push(`- ${req}`);
    }
  }

  lines.push("");
  lines.push("Do NOT repeat the approaches that failed.");
  lines.push("Start from first principles with these constraints in mind.");
  lines.push("");
  lines.push(
    "Before implementing, confirm your approach avoids the known failures."
  );

  return lines.join("\n");
}

/**
 * Analyze cost-benefit of continuing vs clean slate
 */
export function analyzeCostBenefit(attempts: FailedAttempt[]): CostAnalysis {
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const totalTokensUsed = attempts.reduce((sum, a) => sum + a.tokensUsed, 0);
  const attemptCount = attempts.length;

  // Continuing estimate (diminishing returns)
  const continueSuccessProb = Math.max(0.1, 0.5 * Math.pow(0.7, attemptCount));
  const continueTimeEst = 15 + attemptCount * 5; // Each attempt takes longer
  const continueTokensEst = 10000 + attemptCount * 3000;

  // Clean slate estimate (fixed cost, high success)
  const cleanSlateSuccessProb = 0.8;
  const cleanSlateTimeEst = 25;
  const cleanSlateTokensEst = 20000;

  // Calculate expected values
  const continueEV = continueSuccessProb * continueTimeEst;
  const cleanSlateEV = cleanSlateSuccessProb * cleanSlateTimeEst;

  // Find break-even point
  // At what attempt does clean slate become better?
  let breakEven = 3;
  for (let i = 1; i <= 10; i++) {
    const prob = 0.5 * Math.pow(0.7, i);
    if (prob < cleanSlateSuccessProb * 0.5) {
      breakEven = i;
      break;
    }
  }

  return {
    continueEstimate: {
      timeMinutes: continueTimeEst,
      tokens: continueTokensEst,
      successProbability: continueSuccessProb,
    },
    cleanSlateEstimate: {
      timeMinutes: cleanSlateTimeEst,
      tokens: cleanSlateTokensEst,
      successProbability: cleanSlateSuccessProb,
    },
    recommendation: attemptCount >= 3 ? "clean_slate" : "continue",
    breakEvenAttempt: breakEven,
  };
}

// ============================================================================
// SDK-POWERED CLEAN SLATE
// ============================================================================

/**
 * Use Claude to extract constraints from a failed implementation
 */
export async function extractConstraintsWithClaude(
  failedImplementation: string,
  errorMessages: string[]
): Promise<{
  constraints: string[];
  failedApproaches: string[];
  actualRequirements: string[];
}> {
  const extractionPrompt = `Analyze this failed implementation attempt:

FAILED CODE:
\`\`\`
${failedImplementation}
\`\`\`

ERROR MESSAGES:
${errorMessages.map((e) => `- ${e}`).join("\n")}

Extract:
1. What approaches definitely don't work (be specific)
2. What constraints we discovered (limitations, requirements)
3. What the actual requirements turned out to be (vs what we assumed)

Respond in JSON format:
{
  "constraints": ["constraint1", "constraint2"],
  "failedApproaches": ["approach that failed: reason"],
  "actualRequirements": ["requirement discovered"]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: extractionPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse constraint extraction response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Use Claude to build a fresh implementation prompt
 */
export async function buildFreshPromptWithClaude(
  originalTask: string,
  constraints: string[],
  failedApproaches: string[]
): Promise<string> {
  const buildPrompt = `Create a fresh implementation prompt for this task:

ORIGINAL TASK:
${originalTask}

CONSTRAINTS DISCOVERED:
${constraints.map((c) => `- ${c}`).join("\n")}

APPROACHES THAT FAILED:
${failedApproaches.map((a) => `- ${a}`).join("\n")}

Create a clear, concise prompt that:
1. States the task clearly
2. Lists constraints upfront
3. Explicitly excludes failed approaches
4. Asks for confirmation before implementing

Output only the prompt text, no JSON.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: buildPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  return textContent ? textContent.text : "";
}

// ============================================================================
// DOCUMENTATION HELPERS
// ============================================================================

/**
 * Document a session for future reference
 */
export function documentSession(
  state: SessionState,
  recovery: CleanSlateRecovery
): string {
  const lines: string[] = [
    "## Clean Slate Session Documentation",
    "",
    `**Date**: ${new Date().toISOString().split("T")[0]}`,
    `**Attempts before clean slate**: ${state.attemptCount}`,
    `**Context rot signs**: ${state.rotSigns.join(", ") || "None detected"}`,
    "",
    "### Failed Approaches",
    "",
  ];

  for (const attempt of state.failedAttempts) {
    lines.push(`**${attempt.approach}**`);
    lines.push(`- Reason: ${attempt.failureReason}`);
    lines.push(`- Time: ${attempt.timeSpent} min, Tokens: ${attempt.tokensUsed}`);
    lines.push("");
  }

  lines.push("### Constraints Discovered");
  lines.push("");
  for (const constraint of recovery.constraints) {
    lines.push(`- ${constraint}`);
  }

  lines.push("");
  lines.push("### Fresh Prompt Used");
  lines.push("```");
  lines.push(recovery.freshPrompt);
  lines.push("```");

  lines.push("");
  lines.push("### Estimated Savings");
  lines.push(`- Time: ${recovery.estimatedSavings.timeMinutes} min`);
  lines.push(`- Tokens: ${recovery.estimatedSavings.tokens}`);
  lines.push(
    `- Success probability: ${(recovery.estimatedSavings.successProbability * 100).toFixed(0)}%`
  );

  return lines.join("\n");
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate clean slate recovery pattern
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 8: Clean Slate Recovery Pattern ===\n");

  // Create session tracker
  const tracker = new SessionTracker();

  // Simulate failed attempts
  console.log("1. Simulating Failed Attempts");

  const attempt1: FailedAttempt = {
    approach: "JWT refresh token authentication",
    failureReason:
      "API doesn't expose refresh token endpoint - cannot modify backend",
    discoveredConstraints: [
      "Backend is read-only",
      "Must use existing session-based auth",
    ],
    timeSpent: 15,
    tokensUsed: 12000,
  };
  tracker.recordAttempt(attempt1);
  console.log(`   Attempt 1: ${attempt1.approach} - FAILED`);

  const attempt2: FailedAttempt = {
    approach: "JWT with localStorage fallback",
    failureReason: "Same issue - no refresh endpoint available",
    discoveredConstraints: ["Cannot generate new tokens client-side"],
    timeSpent: 12,
    tokensUsed: 10000,
  };
  tracker.recordAttempt(attempt2);
  console.log(`   Attempt 2: ${attempt2.approach} - FAILED`);

  const attempt3: FailedAttempt = {
    approach: "JWT refresh token with custom endpoint",
    failureReason: "Cannot add new endpoints to backend",
    discoveredConstraints: ["API is third-party, no modifications allowed"],
    timeSpent: 18,
    tokensUsed: 15000,
  };
  const state = tracker.recordAttempt(attempt3);
  console.log(`   Attempt 3: ${attempt3.approach} - FAILED`);

  // Check context rot
  console.log("\n2. Context Rot Detection");
  console.log(`   Attempts: ${state.attemptCount}`);
  console.log(`   Rot signs: ${state.rotSigns.join(", ") || "None"}`);
  console.log(`   Clean slate recommended: ${state.cleanSlateRecommended}`);
  console.log(`   Confidence: ${(state.confidence * 100).toFixed(0)}%`);

  // Cost analysis
  console.log("\n3. Cost-Benefit Analysis");
  const costAnalysis = analyzeCostBenefit(state.failedAttempts);
  console.log("   Continue estimate:");
  console.log(
    `     - Time: ${costAnalysis.continueEstimate.timeMinutes} min`
  );
  console.log(
    `     - Success: ${(costAnalysis.continueEstimate.successProbability * 100).toFixed(0)}%`
  );
  console.log("   Clean slate estimate:");
  console.log(
    `     - Time: ${costAnalysis.cleanSlateEstimate.timeMinutes} min`
  );
  console.log(
    `     - Success: ${(costAnalysis.cleanSlateEstimate.successProbability * 100).toFixed(0)}%`
  );
  console.log(`   Recommendation: ${costAnalysis.recommendation.toUpperCase()}`);
  console.log(`   Break-even at attempt: ${costAnalysis.breakEvenAttempt}`);

  // Extract constraints
  console.log("\n4. Extracting Constraints for Clean Slate");
  const recovery = extractConstraints(state.failedAttempts);
  console.log("   Constraints discovered:");
  for (const c of recovery.constraints) {
    console.log(`   - ${c}`);
  }

  console.log("\n   Failed approaches:");
  for (const a of recovery.failedApproaches.slice(0, 2)) {
    console.log(`   - ${a.substring(0, 60)}...`);
  }

  // Fresh prompt preview
  console.log("\n5. Fresh Prompt (first 300 chars)");
  console.log(`   ${recovery.freshPrompt.substring(0, 300).replace(/\n/g, "\n   ")}...`);

  // Estimated savings
  console.log("\n6. Estimated Savings from Clean Slate");
  console.log(`   Time saved: ${recovery.estimatedSavings.timeMinutes} min`);
  console.log(`   Tokens saved: ${recovery.estimatedSavings.tokens}`);
  console.log(
    `   Success probability: ${(recovery.estimatedSavings.successProbability * 100).toFixed(0)}%`
  );

  // Context rot symptoms reference
  console.log("\n7. Context Rot Symptoms Reference");
  for (const [sign, description] of Object.entries(CONTEXT_ROT_SYMPTOMS).slice(
    0,
    3
  )) {
    console.log(`   ${sign}:`);
    console.log(`   ${description.substring(0, 50)}...`);
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
