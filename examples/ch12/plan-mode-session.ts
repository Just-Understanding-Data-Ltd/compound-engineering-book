/**
 * Plan Mode Session - Strategic Planning Before Implementation
 *
 * Demonstrates the two-phase pattern where Claude:
 * 1. Plans the implementation (analyzes architecture, identifies dependencies)
 * 2. Executes the plan step by step
 *
 * This pattern reduces refactoring cycles by thinking through
 * architectural complexity before writing code.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Plan document structure for tracking planning output
export interface PlanDocument {
  feature: string;
  architecture: {
    approach: string;
    rationale: string;
  };
  dependencies: string[];
  files: {
    create: string[];
    modify: string[];
  };
  steps: PlanStep[];
  risks: string[];
  testStrategy: string;
}

interface PlanStep {
  number: number;
  description: string;
  output: string;
  verification: string;
}

// System prompt that enforces plan mode behavior
const PLAN_MODE_SYSTEM = `You are in PLAN MODE. Your job is to analyze and plan, NOT implement.

When asked to plan a feature:
1. Analyze the requirements thoroughly
2. Consider architecture decisions and trade-offs
3. Identify all dependencies (files, packages, services)
4. Break down into concrete implementation steps
5. Identify risks and mitigation strategies
6. Define testing strategy

Output your plan as valid JSON matching this structure:
{
  "feature": "description",
  "architecture": { "approach": "...", "rationale": "..." },
  "dependencies": ["dep1", "dep2"],
  "files": { "create": [], "modify": [] },
  "steps": [{ "number": 1, "description": "...", "output": "...", "verification": "..." }],
  "risks": ["risk1"],
  "testStrategy": "..."
}

DO NOT write any implementation code. Only output the plan.`;

/**
 * Creates a strategic plan for a feature before implementation.
 * Returns a structured plan document.
 */
export async function createPlan(featureDescription: string): Promise<PlanDocument> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: PLAN_MODE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Plan the following feature:\n\n${featureDescription}\n\nOutput ONLY valid JSON.`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Expected text response from Claude");
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = (content as { type: "text"; text: string }).text;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonText.trim()) as PlanDocument;
  } catch {
    throw new Error(`Failed to parse plan JSON: ${jsonText}`);
  }
}

/**
 * Validates a plan by checking for completeness and consistency.
 * Returns validation results with any issues found.
 */
export function validatePlan(plan: PlanDocument): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check required fields
  if (!plan.feature || plan.feature.length < 10) {
    issues.push("Feature description too short or missing");
  }

  if (!plan.architecture?.approach) {
    issues.push("Missing architecture approach");
  }

  if (!plan.steps || plan.steps.length === 0) {
    issues.push("No implementation steps defined");
  }

  // Check step structure
  plan.steps?.forEach((step, index) => {
    if (!step.description) {
      issues.push(`Step ${index + 1} missing description`);
    }
    if (!step.verification) {
      issues.push(`Step ${index + 1} missing verification criteria`);
    }
  });

  // Check for testing strategy
  if (!plan.testStrategy || plan.testStrategy.length < 20) {
    issues.push("Test strategy too short or missing");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Refines a plan based on feedback or questions.
 * Maintains the same structure but incorporates refinements.
 */
export async function refinePlan(
  originalPlan: PlanDocument,
  feedback: string
): Promise<PlanDocument> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: PLAN_MODE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Here is an existing plan:\n\n${JSON.stringify(originalPlan, null, 2)}\n\nRefine this plan based on the following feedback:\n\n${feedback}\n\nOutput the complete refined plan as valid JSON.`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Expected text response from Claude");
  }

  let jsonText = (content as { type: "text"; text: string }).text;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonText.trim()) as PlanDocument;
  } catch {
    throw new Error(`Failed to parse refined plan JSON: ${jsonText}`);
  }
}

/**
 * Compares two architectural approaches side by side.
 * Useful for evaluating alternatives during planning.
 */
export async function compareApproaches(
  feature: string,
  approachA: string,
  approachB: string
): Promise<{
  approachA: { pros: string[]; cons: string[] };
  approachB: { pros: string[]; cons: string[] };
  recommendation: string;
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Compare two approaches for implementing: ${feature}

Approach A: ${approachA}
Approach B: ${approachB}

Output as JSON:
{
  "approachA": { "pros": [], "cons": [] },
  "approachB": { "pros": [], "cons": [] },
  "recommendation": "Which approach to use and why"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Expected text response");
  }

  let jsonText = (content as { type: "text"; text: string }).text;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  return JSON.parse(jsonText.trim());
}

/**
 * Execution mode implementation that follows a plan step by step.
 * Each step is implemented, verified, then committed before moving on.
 */
export async function executePlan(
  plan: PlanDocument,
  onStepComplete?: (step: PlanStep, result: string) => void
): Promise<{ success: boolean; completedSteps: number; error?: string }> {
  let completedSteps = 0;

  for (const step of plan.steps) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Execute step ${step.number} of the plan:

Step: ${step.description}
Expected output: ${step.output}
Verification: ${step.verification}

Previous steps completed: ${completedSteps}
Total steps: ${plan.steps.length}

Implement ONLY this step. Output the implementation code and confirm verification.`,
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      return {
        success: false,
        completedSteps,
        error: `Step ${step.number} failed: unexpected response type`,
      };
    }

    completedSteps++;
    onStepComplete?.(step, (content as { type: "text"; text: string }).text);
  }

  return {
    success: true,
    completedSteps,
  };
}

/**
 * Determines whether a task warrants plan mode based on complexity signals.
 */
export function shouldUsePlanMode(taskDescription: string): {
  recommendation: "plan" | "immediate";
  reason: string;
  complexitySignals: string[];
} {
  const signals: string[] = [];
  const lowerTask = taskDescription.toLowerCase();

  // Complexity indicators that suggest plan mode
  const complexityIndicators = [
    { pattern: /architect|refactor|migrate|redesign/i, signal: "architectural change" },
    { pattern: /multiple files|across.*files|several/i, signal: "multi-file change" },
    { pattern: /authentication|authorization|security/i, signal: "security-sensitive" },
    { pattern: /database|schema|migration/i, signal: "data layer change" },
    { pattern: /third.?party|external.*api|integration/i, signal: "external dependency" },
    { pattern: /performance|optimize|scale/i, signal: "performance consideration" },
    { pattern: /breaking.*change|backward/i, signal: "breaking change risk" },
  ];

  // Simplicity indicators that suggest immediate mode
  const simplicityIndicators = [
    { pattern: /fix.*typo|typo/i, signal: "typo fix" },
    { pattern: /add.*comment|documentation/i, signal: "documentation only" },
    { pattern: /rename|formatting/i, signal: "cosmetic change" },
    { pattern: /single.*function|one.*function/i, signal: "isolated change" },
    { pattern: /bump.*version|update.*version/i, signal: "version bump" },
  ];

  // Check complexity signals
  complexityIndicators.forEach(({ pattern, signal }) => {
    if (pattern.test(lowerTask)) {
      signals.push(signal);
    }
  });

  // Check simplicity signals
  let isSimple = false;
  simplicityIndicators.forEach(({ pattern }) => {
    if (pattern.test(lowerTask)) {
      isSimple = true;
    }
  });

  // Words count as rough complexity proxy
  const wordCount = taskDescription.split(/\s+/).length;
  if (wordCount > 50) {
    signals.push("detailed requirements");
  }

  // Decision logic
  if (isSimple && signals.length === 0) {
    return {
      recommendation: "immediate",
      reason: "Simple, isolated change with low risk",
      complexitySignals: [],
    };
  }

  if (signals.length >= 2) {
    return {
      recommendation: "plan",
      reason: "Multiple complexity indicators detected",
      complexitySignals: signals,
    };
  }

  if (signals.length === 1) {
    return {
      recommendation: "plan",
      reason: `Contains complexity signal: ${signals[0]}`,
      complexitySignals: signals,
    };
  }

  return {
    recommendation: "immediate",
    reason: "No significant complexity indicators",
    complexitySignals: [],
  };
}

// Demo: Run plan mode session for authentication feature
async function demo() {
  console.log("=== Plan Mode Session Demo ===\n");

  // Check if plan mode is appropriate
  const taskDescription = `Add JWT-based authentication with:
    - OAuth provider integration
    - Token refresh flow
    - Session management
    - Protected route middleware
    - Admin dashboard for user management`;

  const decision = shouldUsePlanMode(taskDescription);
  console.log("Complexity analysis:");
  console.log(`  Recommendation: ${decision.recommendation}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log(`  Signals: ${decision.complexitySignals.join(", ") || "none"}\n`);

  if (decision.recommendation === "immediate") {
    console.log("Skipping plan mode for simple task.");
    return;
  }

  // Create initial plan
  console.log("Creating plan...\n");
  const plan = await createPlan(taskDescription);
  console.log("Plan created:");
  console.log(JSON.stringify(plan, null, 2));

  // Validate the plan
  console.log("\nValidating plan...");
  const validation = validatePlan(plan);
  if (!validation.isValid) {
    console.log("Plan has issues:", validation.issues);
  } else {
    console.log("Plan is valid!");
  }
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
