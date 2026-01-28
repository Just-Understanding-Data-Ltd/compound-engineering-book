/**
 * Chapter 14: Skill Auditor
 *
 * Implements the skill atrophy framework to help engineers
 * assess their current level and prevent dangerous atrophy.
 *
 * Key concept: Level 4 (Senior Engineer) is the minimum for
 * long-term career safety in the AI era.
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// Extract text content from Agent SDK streaming messages
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

// The four self-check questions
interface SelfCheckResult {
  canExplainWithoutLooking: boolean;
  canRewriteFromMemory: boolean;
  canReasonAboutWorstCase: boolean;
  canDefendTradeoffs: boolean;
}

// Atrophy ladder levels
type AtrophyLevel = 1 | 2 | 3 | 4 | 5;

interface AtrophyLevelInfo {
  level: AtrophyLevel;
  name: string;
  description: string;
  capabilities: string[];
  careerCeiling: string;
  riskLevel: "danger" | "warning" | "safe" | "excellent";
}

// The leverage stack categories
type LeverageCategory =
  | "understanding"
  | "design"
  | "verification"
  | "implementation"
  | "syntax"
  | "boilerplate";

interface LeverageStackItem {
  category: LeverageCategory;
  name: string;
  action: "keep-sharp" | "ok-to-delegate" | "ok-to-forget" | "good-riddance";
  examples: string[];
  maintenanceStrategies: string[];
}

// Define the atrophy ladder
export const ATROPHY_LADDER: Record<AtrophyLevel, AtrophyLevelInfo> = {
  5: {
    level: 5,
    name: "Architect / Staff+",
    description: "Can specify, verify, AND derive solutions from scratch",
    capabilities: [
      "Design systems without AI assistance",
      "Derive algorithms from first principles",
      "Verify correctness formally",
      "Teach others the fundamentals",
    ],
    careerCeiling: "No ceiling",
    riskLevel: "excellent",
  },
  4: {
    level: 4,
    name: "Senior Engineer",
    description: "Can specify and verify, could derive if needed",
    capabilities: [
      "Specify complete solutions",
      "Verify AI output thoroughly",
      "Could derive solutions (slower)",
      "Understand tradeoffs deeply",
    ],
    careerCeiling: "Senior roles secure",
    riskLevel: "safe",
  },
  3: {
    level: 3,
    name: "Mid-level with AI leverage",
    description: "Can specify and verify, but cannot derive",
    capabilities: [
      "Specify what is needed",
      "Verify correctness",
      "Cannot derive from scratch",
      "Depends on AI for algorithms",
    ],
    careerCeiling: "Mid-level roles",
    riskLevel: "warning",
  },
  2: {
    level: 2,
    name: "Junior with tools",
    description: "Can verify but cannot specify well",
    capabilities: [
      "Can test if code works",
      "Struggles with specifications",
      "Limited design skills",
      "Heavy AI dependence",
    ],
    careerCeiling: "Junior roles",
    riskLevel: "warning",
  },
  1: {
    level: 1,
    name: "Prompt operator",
    description: "Cannot verify, just accepts output",
    capabilities: [
      "Can prompt AI",
      "Cannot verify correctness",
      "Accepts plausible output",
      "No deep understanding",
    ],
    careerCeiling: "Ceiling reached",
    riskLevel: "danger",
  },
};

// Define the leverage stack
export const LEVERAGE_STACK: LeverageStackItem[] = [
  {
    category: "understanding",
    name: "Understanding the Problem",
    action: "keep-sharp",
    examples: [
      "Identifying constraints",
      "Finding edge cases",
      "Defining success criteria",
      "Stakeholder communication",
    ],
    maintenanceStrategies: [
      "Spend 2x time on specification before generation",
      "Write requirements before prompting",
      "Question assumptions explicitly",
    ],
  },
  {
    category: "design",
    name: "Designing the Solution",
    action: "keep-sharp",
    examples: [
      "Choosing abstractions",
      "Algorithm selection",
      "Time/space tradeoffs",
      "System architecture",
    ],
    maintenanceStrategies: [
      "Whiteboard before asking AI to generate",
      "Predict complexity before running",
      "Design on paper first",
    ],
  },
  {
    category: "verification",
    name: "Verification & Correctness",
    action: "keep-sharp",
    examples: [
      "Checking edge cases",
      "Complexity analysis",
      "Invariant reasoning",
      "Testing strategy",
    ],
    maintenanceStrategies: [
      "Always verify AI output",
      "State expectations before running",
      "Explain code after reading",
    ],
  },
  {
    category: "implementation",
    name: "Implementation Patterns",
    action: "ok-to-delegate",
    examples: [
      "Common design patterns",
      "Framework conventions",
      "Standard algorithms",
      "API usage patterns",
    ],
    maintenanceStrategies: [
      "Maintain awareness of patterns",
      "Review generated implementations",
      "Understand trade-offs",
    ],
  },
  {
    category: "syntax",
    name: "Syntax & API Recall",
    action: "ok-to-forget",
    examples: [
      "Language syntax",
      "API signatures",
      "Library method names",
      "Configuration options",
    ],
    maintenanceStrategies: [
      "Let AI handle this",
      "Focus on concepts, not spelling",
      "Reference docs when needed",
    ],
  },
  {
    category: "boilerplate",
    name: "Boilerplate",
    action: "good-riddance",
    examples: [
      "Repetitive setup code",
      "Configuration files",
      "Import statements",
      "Standard scaffolding",
    ],
    maintenanceStrategies: [
      "Delegate completely to AI",
      "No brain cycles needed here",
      "Good riddance",
    ],
  },
];

// Determine atrophy level from self-check results
export function determineLevel(result: SelfCheckResult): AtrophyLevel {
  const {
    canExplainWithoutLooking,
    canRewriteFromMemory,
    canReasonAboutWorstCase,
    canDefendTradeoffs,
  } = result;

  // All true = Level 4-5
  if (
    canExplainWithoutLooking &&
    canRewriteFromMemory &&
    canReasonAboutWorstCase &&
    canDefendTradeoffs
  ) {
    return 5; // Could be 4 or 5, assume 5 if all checks pass
  }

  // Can explain and defend but maybe not derive = Level 4
  if (
    canExplainWithoutLooking &&
    canDefendTradeoffs &&
    canReasonAboutWorstCase
  ) {
    return 4;
  }

  // Can verify basics = Level 3
  if (canExplainWithoutLooking && canDefendTradeoffs) {
    return 3;
  }

  // Can do basic verification = Level 2
  if (canExplainWithoutLooking || canReasonAboutWorstCase) {
    return 2;
  }

  // Cannot verify = Level 1
  return 1;
}

// Generate prevention plan based on level
export function generatePreventionPlan(level: AtrophyLevel): string[] {
  const basePlans: Record<AtrophyLevel, string[]> = {
    1: [
      "URGENT: Start verifying AI output before accepting",
      "Learn to identify when code is incorrect",
      "Practice reading code before running it",
      "Take a fundamentals course",
      "Do not ship code you cannot explain",
    ],
    2: [
      "Focus on specification skills",
      "Practice writing requirements before prompting",
      "Learn to break problems into components",
      "Study system design",
      "Ask yourself 'why' before 'what'",
    ],
    3: [
      "Rebuild derivation skills",
      "Practice algorithm design without AI",
      "Do Advent of Code or similar exercises",
      "Whiteboard problems weekly",
      "Keep a paper notebook for thinking",
    ],
    4: [
      "Maintain your edge",
      "Continue regular no-AI practice",
      "Teach others to reinforce knowledge",
      "Challenge yourself with harder problems",
      "Stay sharp on fundamentals",
    ],
    5: [
      "You are in excellent shape",
      "Continue teaching and mentoring",
      "Focus on multiplying impact",
      "Build meta-systems",
      "Lead architectural decisions",
    ],
  };

  return basePlans[level];
}

// Generate skill audit questions for a specific code feature
export async function generateAuditQuestions(
  codeDescription: string
): Promise<string[]> {
  const prompt = `For code that implements: "${codeDescription}"

Generate 4 questions to test if a developer truly understands it:
1. A question testing if they can explain it without looking
2. A question testing if they could rewrite the core logic
3. A question about worst-case behavior
4. A question about design tradeoffs

Format as a numbered list with just the questions.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  const textParts: string[] = [];
  for await (const message of response) {
    const text = extractTextContent(message);
    if (text) textParts.push(text);
  }

  const responseText = textParts.join("");
  if (!responseText) return [];

  // Parse questions from response
  const lines = responseText.split("\n").filter((line) => line.trim());
  return lines
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, ""));
}

// Calculate overall skill health score
export function calculateSkillHealth(result: SelfCheckResult): {
  score: number;
  rating: string;
  advice: string;
} {
  const checks = [
    result.canExplainWithoutLooking,
    result.canRewriteFromMemory,
    result.canReasonAboutWorstCase,
    result.canDefendTradeoffs,
  ];

  const passed = checks.filter(Boolean).length;
  const score = (passed / 4) * 100;

  let rating: string;
  let advice: string;

  if (score >= 100) {
    rating = "Excellent";
    advice = "You own this code. Ship with confidence.";
  } else if (score >= 75) {
    rating = "Good";
    advice =
      "Solid understanding. Review the weak area before shipping.";
  } else if (score >= 50) {
    rating = "Needs work";
    advice =
      "Do not ship yet. Spend more time understanding before accepting.";
  } else {
    rating = "Danger";
    advice = "You do not own this code. Step back and study it deeply.";
  }

  return { score, rating, advice };
}

// Run a full skill audit
export function runSkillAudit(
  _featureName: string,
  selfCheck: SelfCheckResult
): {
  level: AtrophyLevelInfo;
  health: { score: number; rating: string; advice: string };
  preventionPlan: string[];
  leverageGuidance: LeverageStackItem[];
} {
  const level = determineLevel(selfCheck);
  const levelInfo = ATROPHY_LADDER[level];
  const health = calculateSkillHealth(selfCheck);
  const preventionPlan = generatePreventionPlan(level);

  // Get relevant leverage guidance based on level
  const leverageGuidance =
    level <= 3
      ? LEVERAGE_STACK.filter(
          (item) =>
            item.action === "keep-sharp" || item.action === "ok-to-delegate"
        )
      : LEVERAGE_STACK;

  return {
    level: levelInfo,
    health,
    preventionPlan,
    leverageGuidance,
  };
}

// Demo function
async function demo() {
  console.log("=== Skill Auditor Demo ===\n");

  // Show the atrophy ladder
  console.log("--- The Atrophy Ladder ---\n");
  for (const level of [5, 4, 3, 2, 1] as AtrophyLevel[]) {
    const info = ATROPHY_LADDER[level];
    const riskBadge =
      info.riskLevel === "danger"
        ? "[DANGER]"
        : info.riskLevel === "warning"
          ? "[WARNING]"
          : info.riskLevel === "safe"
            ? "[SAFE]"
            : "[EXCELLENT]";

    console.log(`Level ${level}: ${info.name} ${riskBadge}`);
    console.log(`  ${info.description}`);
    console.log(`  Career ceiling: ${info.careerCeiling}`);
    console.log();
  }

  // Show the leverage stack
  console.log("--- The Leverage Stack ---\n");
  for (const item of LEVERAGE_STACK) {
    const actionBadge =
      item.action === "keep-sharp"
        ? "[KEEP SHARP]"
        : item.action === "ok-to-delegate"
          ? "[OK TO DELEGATE]"
          : item.action === "ok-to-forget"
            ? "[OK TO FORGET]"
            : "[GOOD RIDDANCE]";

    console.log(`${item.name} ${actionBadge}`);
    console.log(`  Examples: ${item.examples.join(", ")}`);
    console.log();
  }

  // Sample self-check scenario
  console.log("--- Sample Skill Audit ---\n");
  console.log("Feature: Complex caching system with invalidation\n");

  const sampleResult: SelfCheckResult = {
    canExplainWithoutLooking: true,
    canRewriteFromMemory: false, // Takes too long but possible
    canReasonAboutWorstCase: true,
    canDefendTradeoffs: true,
  };

  console.log("Self-check results:");
  console.log(
    `  Can explain without looking: ${sampleResult.canExplainWithoutLooking ? "Yes" : "No"}`
  );
  console.log(
    `  Can rewrite from memory: ${sampleResult.canRewriteFromMemory ? "Yes" : "No"}`
  );
  console.log(
    `  Can reason about worst-case: ${sampleResult.canReasonAboutWorstCase ? "Yes" : "No"}`
  );
  console.log(
    `  Can defend tradeoffs: ${sampleResult.canDefendTradeoffs ? "Yes" : "No"}`
  );
  console.log();

  const audit = runSkillAudit("caching system", sampleResult);

  console.log(`\nLevel: ${audit.level.level} - ${audit.level.name}`);
  console.log(`Health Score: ${audit.health.score}% (${audit.health.rating})`);
  console.log(`Advice: ${audit.health.advice}`);

  console.log("\nPrevention Plan:");
  for (const item of audit.preventionPlan) {
    console.log(`  - ${item}`);
  }

  console.log("\n--- The Four Self-Check Questions ---");
  console.log("After reviewing AI-generated code, ask yourself:");
  console.log("1. Could I explain this without looking at it?");
  console.log("2. Could I rewrite the core logic from memory?");
  console.log("3. Could I reason about worst-case behavior?");
  console.log("4. Could I defend the tradeoffs?");
  console.log("\nIf any answer is 'no', slow down. You don't own that code yet.");
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}

export type { SelfCheckResult, AtrophyLevelInfo, LeverageStackItem };
