/**
 * Chapter 10: The RALPH Loop - Task Management
 *
 * This file demonstrates task management for autonomous development.
 * Tasks must be well-sized, autonomous-ready, and have clear acceptance criteria.
 *
 * Key concepts:
 * - Task sizing discipline (single context window units)
 * - Autonomous-readiness filtering
 * - Dependency tracking
 * - Task queuing and prioritization
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
 * Task complexity levels
 */
export type TaskComplexity = "trivial" | "simple" | "moderate" | "complex" | "architectural";

/**
 * Task labels for categorization
 */
export type TaskLabel =
  | "Ready-For-AI"
  | "needs-review"
  | "architectural"
  | "breaking-change"
  | "security"
  | "performance"
  | "documentation"
  | "bug"
  | "feature";

/**
 * Comprehensive task definition suitable for autonomous development
 */
export interface AutonomousTask {
  /** Unique task identifier */
  id: string;
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Assigned labels */
  labels: TaskLabel[];
  /** Complexity assessment */
  complexity: TaskComplexity;
  /** Specific acceptance criteria (must be measurable) */
  acceptanceCriteria: string[];
  /** Context for implementation */
  context: {
    relatedFiles: string[];
    existingPatterns: string[];
    edgeCases: string[];
    documentation: string[];
  };
  /** Success metrics (how to verify completion) */
  successMetrics: string[];
  /** Task dependencies */
  dependencies: string[];
  /** Tasks blocked by this one */
  blocks: string[];
  /** Priority score (higher = more important) */
  priority: number;
  /** Estimated effort in context-window units */
  estimatedContextWindows: number;
  /** Whether the task is suitable for autonomous processing */
  autonomousReady: boolean;
  /** Reason if not autonomous-ready */
  autonomousReadyReason?: string;
}

/**
 * Autonomous readiness criteria
 */
export interface AutonomousReadinessCriteria {
  /** Has specific, measurable acceptance criteria */
  hasAcceptanceCriteria: boolean;
  /** Does not require architectural decisions */
  noArchitecturalDecisions: boolean;
  /** Existing tests cover related functionality */
  hasTestCoverage: boolean;
  /** Complexity is simple or moderate */
  appropriateComplexity: boolean;
  /** No breaking changes required */
  noBreakingChanges: boolean;
  /** Examples of similar code exist in repo */
  hasSimilarExamples: boolean;
  /** Edge cases are documented */
  hasDocumentedEdgeCases: boolean;
}

/**
 * Task queue with prioritization
 */
export interface TaskQueue {
  /** Tasks ready for autonomous processing */
  autonomousReady: AutonomousTask[];
  /** Tasks needing human review before AI processing */
  needsReview: AutonomousTask[];
  /** Tasks unsuitable for autonomous processing */
  humanOnly: AutonomousTask[];
  /** Total tasks */
  total: number;
  /** Percentage ready for AI */
  autonomousReadyPercent: number;
}

// ============================================================================
// AUTONOMOUS READINESS ASSESSMENT
// ============================================================================

/**
 * Check if a task has all criteria for autonomous processing
 */
export function assessAutonomousReadiness(task: AutonomousTask): AutonomousReadinessCriteria {
  return {
    hasAcceptanceCriteria: task.acceptanceCriteria.length > 0,
    noArchitecturalDecisions: !task.labels.includes("architectural"),
    hasTestCoverage: task.context.relatedFiles.some((f) => f.includes("test")),
    appropriateComplexity: ["trivial", "simple", "moderate"].includes(task.complexity),
    noBreakingChanges: !task.labels.includes("breaking-change"),
    hasSimilarExamples: task.context.existingPatterns.length > 0,
    hasDocumentedEdgeCases: task.context.edgeCases.length > 0,
  };
}

/**
 * Determine if a task is ready for autonomous processing
 */
export function isAutonomousReady(task: AutonomousTask): { ready: boolean; reason: string } {
  const criteria = assessAutonomousReadiness(task);

  // Must have all MUST HAVE criteria
  if (!criteria.hasAcceptanceCriteria) {
    return { ready: false, reason: "Missing acceptance criteria" };
  }
  if (!criteria.noArchitecturalDecisions) {
    return { ready: false, reason: "Requires architectural decisions" };
  }
  if (!criteria.appropriateComplexity) {
    return { ready: false, reason: "Complexity too high for autonomous processing" };
  }
  if (!criteria.noBreakingChanges) {
    return { ready: false, reason: "Involves breaking changes" };
  }

  // Explicit Ready-For-AI label overrides
  if (task.labels.includes("Ready-For-AI")) {
    return { ready: true, reason: "Explicitly marked Ready-For-AI" };
  }

  // Check security and architectural labels
  if (task.labels.includes("security")) {
    return { ready: false, reason: "Security-sensitive task requires human review" };
  }

  // Should have at least some SHOULD HAVE criteria
  const shouldHaveCount = [
    criteria.hasSimilarExamples,
    criteria.hasDocumentedEdgeCases,
    criteria.hasTestCoverage,
  ].filter(Boolean).length;

  if (shouldHaveCount < 2) {
    return { ready: false, reason: "Insufficient context (needs more examples/documentation)" };
  }

  return { ready: true, reason: "Meets all autonomous readiness criteria" };
}

/**
 * Calculate autonomy score (0-100)
 */
export function calculateAutonomyScore(task: AutonomousTask): number {
  const criteria = assessAutonomousReadiness(task);
  let score = 0;

  // Must-have criteria (15 points each = 60 total)
  if (criteria.hasAcceptanceCriteria) score += 15;
  if (criteria.noArchitecturalDecisions) score += 15;
  if (criteria.appropriateComplexity) score += 15;
  if (criteria.noBreakingChanges) score += 15;

  // Should-have criteria (13 points each = ~40 total)
  if (criteria.hasSimilarExamples) score += 13;
  if (criteria.hasDocumentedEdgeCases) score += 13;
  if (criteria.hasTestCoverage) score += 14;

  // Bonus for explicit Ready-For-AI label
  if (task.labels.includes("Ready-For-AI")) score = Math.min(100, score + 10);

  // Penalties
  if (task.labels.includes("security")) score -= 20;
  if (task.complexity === "complex") score -= 15;
  if (task.complexity === "architectural") score -= 30;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// TASK SIZING
// ============================================================================

/**
 * Well-sized task examples
 */
export const WELL_SIZED_EXAMPLES = [
  "Database migration (single table)",
  "Single UI component",
  "Server action with validation",
  "API endpoint implementation",
  "Unit test suite for a module",
  "Documentation update for a feature",
  "Bug fix with clear reproduction steps",
  "Refactor single function/class",
];

/**
 * Oversized tasks needing decomposition
 */
export const OVERSIZED_EXAMPLES = [
  "Build entire dashboard",
  "Implement auth system",
  "Refactor the codebase",
  "Add full-text search",
  "Migrate to new framework",
  "Performance optimization (unscoped)",
];

/**
 * Estimate context windows needed for a task
 */
export function estimateContextWindows(task: AutonomousTask): number {
  const complexityMultiplier: Record<TaskComplexity, number> = {
    trivial: 0.5,
    simple: 1,
    moderate: 1.5,
    complex: 3,
    architectural: 5,
  };

  const base = complexityMultiplier[task.complexity];
  const filesBonus = Math.ceil(task.context.relatedFiles.length / 5);
  const criteriaBonus = Math.ceil(task.acceptanceCriteria.length / 3);

  return Math.ceil(base + filesBonus + criteriaBonus);
}

/**
 * Suggest task decomposition if oversized
 */
export function suggestDecomposition(task: AutonomousTask): string[] {
  if (task.estimatedContextWindows <= 2) {
    return []; // No decomposition needed
  }

  const suggestions: string[] = [];

  // Suggest splitting by acceptance criteria
  if (task.acceptanceCriteria.length > 3) {
    suggestions.push(
      `Split into ${Math.ceil(task.acceptanceCriteria.length / 3)} tasks (one per 3 acceptance criteria)`
    );
  }

  // Suggest splitting by files
  if (task.context.relatedFiles.length > 5) {
    suggestions.push(
      `Split by file scope (${task.context.relatedFiles.length} files → ${Math.ceil(task.context.relatedFiles.length / 3)} tasks)`
    );
  }

  // General suggestions based on complexity
  if (task.complexity === "complex" || task.complexity === "architectural") {
    suggestions.push("Break into planning phase + implementation phases");
    suggestions.push("Separate infrastructure changes from application changes");
  }

  return suggestions;
}

// ============================================================================
// TASK PRIORITIZATION
// ============================================================================

/**
 * Calculate priority score for a task
 */
export function calculatePriority(task: AutonomousTask): number {
  let score = task.priority;

  // Boost for blocking other tasks
  score += task.blocks.length * 10;

  // Penalty for being blocked
  score -= task.dependencies.length * 5;

  // Boost for being Ready-For-AI during autonomous shifts
  if (task.labels.includes("Ready-For-AI")) {
    score += 15;
  }

  // Boost for bugs
  if (task.labels.includes("bug")) {
    score += 20;
  }

  // Slight boost for documentation (often overlooked)
  if (task.labels.includes("documentation")) {
    score += 5;
  }

  return score;
}

/**
 * Sort tasks by priority
 */
export function sortByPriority(tasks: AutonomousTask[]): AutonomousTask[] {
  return [...tasks].sort((a, b) => calculatePriority(b) - calculatePriority(a));
}

// ============================================================================
// TASK QUEUE MANAGEMENT
// ============================================================================

/**
 * Filter and categorize tasks into a queue
 */
export function buildTaskQueue(tasks: AutonomousTask[]): TaskQueue {
  const autonomousReady: AutonomousTask[] = [];
  const needsReview: AutonomousTask[] = [];
  const humanOnly: AutonomousTask[] = [];

  for (const task of tasks) {
    const { ready, reason } = isAutonomousReady(task);
    const updatedTask = { ...task, autonomousReady: ready, autonomousReadyReason: reason };

    if (ready) {
      autonomousReady.push(updatedTask);
    } else if (
      reason === "Missing acceptance criteria" ||
      reason === "Insufficient context (needs more examples/documentation)"
    ) {
      needsReview.push(updatedTask);
    } else {
      humanOnly.push(updatedTask);
    }
  }

  return {
    autonomousReady: sortByPriority(autonomousReady),
    needsReview: sortByPriority(needsReview),
    humanOnly: sortByPriority(humanOnly),
    total: tasks.length,
    autonomousReadyPercent: tasks.length > 0 ? (autonomousReady.length / tasks.length) * 100 : 0,
  };
}

/**
 * Get next task for autonomous processing
 */
export function getNextAutonomousTask(queue: TaskQueue): AutonomousTask | null {
  // Filter out blocked tasks
  const available = queue.autonomousReady.filter(
    (task) => task.dependencies.length === 0 || task.dependencies.every((dep) => dep.startsWith("done-"))
  );

  return available[0] || null;
}

// ============================================================================
// TASK TEMPLATE
// ============================================================================

/**
 * Generate task template for autonomous development
 */
export function generateTaskTemplate(title: string, description: string): string {
  return `## Task: ${title}

### Description
${description}

### Acceptance Criteria
- [ ] Specific, measurable criterion 1
- [ ] Specific, measurable criterion 2
- [ ] Specific, measurable criterion 3

### Context
- **Related Files:** \`src/...\`, \`tests/...\`
- **Existing Patterns:** Reference similar implementations
- **Edge Cases:** Document known edge cases
- **Documentation:** Link relevant docs

### Success Criteria
- All existing tests pass
- New tests cover acceptance criteria
- No type errors (tsc --noEmit)
- Code follows project conventions

### Dependencies
- Requires: [list any prerequisites]
- Blocks: [list dependent tasks]

### Notes for AI Agent
- Follow patterns in [reference file]
- Avoid [known pitfall]
- Test with [specific scenario]
`;
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Use Claude to assess task readiness and suggest improvements
 */
export async function assessTaskWithClaude(task: AutonomousTask): Promise<{
  assessment: string;
  suggestions: string[];
  estimatedComplexity: TaskComplexity;
}> {
  const prompt = `Assess this task for autonomous AI development:

**Title:** ${task.title}
**Description:** ${task.description}
**Acceptance Criteria:** ${task.acceptanceCriteria.join("; ")}
**Related Files:** ${task.context.relatedFiles.join(", ")}
**Current Complexity:** ${task.complexity}

Answer these questions:
1. Is this task well-scoped for a single context window?
2. Are the acceptance criteria specific and measurable?
3. What context might be missing?
4. Suggest 2-3 improvements to make this autonomous-ready.

Format: Brief assessment followed by bullet point suggestions.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5",
      allowedTools: [], // No tools needed for assessment
    },
  });

  let text = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      text += extractTextContent(message);
    }
  }

  // Extract suggestions (lines starting with -)
  const suggestions = text
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim());

  return {
    assessment: text,
    suggestions,
    estimatedComplexity: task.complexity, // In a real implementation, parse from response
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate task management concepts
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 10: Task Management for Autonomous Development ===\n");

  // Example 1: Create sample tasks
  console.log("1. Sample Task Definitions");
  const sampleTasks: AutonomousTask[] = [
    {
      id: "task-001",
      title: "Implement rate limiting for login endpoint",
      description: "Add rate limiting to prevent brute force attacks",
      labels: ["Ready-For-AI", "security", "feature"],
      complexity: "moderate",
      acceptanceCriteria: [
        "5 attempts per 15 minutes per IP",
        "Returns 429 status when exceeded",
        "Includes Retry-After header",
        "Integration tests pass",
      ],
      context: {
        relatedFiles: ["src/routes/auth.ts", "tests/auth.test.ts"],
        existingPatterns: ["src/middleware/rate-limit.ts"],
        edgeCases: ["Proxy forwarding", "IPv6 support"],
        documentation: ["docs/security.md"],
      },
      successMetrics: ["Rate limit tests pass", "No regression in auth tests"],
      dependencies: [],
      blocks: ["task-003"],
      priority: 80,
      estimatedContextWindows: 1,
      autonomousReady: false,
    },
    {
      id: "task-002",
      title: "Refactor authentication system",
      description: "Major overhaul of auth flow",
      labels: ["architectural", "breaking-change"],
      complexity: "architectural",
      acceptanceCriteria: ["New auth flow works", "Backward compatible"],
      context: {
        relatedFiles: ["src/**/*.ts"],
        existingPatterns: [],
        edgeCases: [],
        documentation: [],
      },
      successMetrics: ["All tests pass"],
      dependencies: [],
      blocks: [],
      priority: 50,
      estimatedContextWindows: 5,
      autonomousReady: false,
    },
    {
      id: "task-003",
      title: "Add password reset email template",
      description: "Create email template for password reset flow",
      labels: ["Ready-For-AI", "feature"],
      complexity: "simple",
      acceptanceCriteria: [
        "Template follows brand guidelines",
        "Includes reset link",
        "Mobile responsive",
      ],
      context: {
        relatedFiles: ["src/emails/welcome.tsx", "tests/emails.test.ts"],
        existingPatterns: ["src/emails/welcome.tsx"],
        edgeCases: ["Long email addresses", "RTL languages"],
        documentation: ["docs/emails.md"],
      },
      successMetrics: ["Template renders correctly", "Email tests pass"],
      dependencies: ["task-001"],
      blocks: [],
      priority: 60,
      estimatedContextWindows: 1,
      autonomousReady: false,
    },
  ];

  console.log(`   Created ${sampleTasks.length} sample tasks`);

  // Example 2: Assess autonomous readiness
  console.log("\n2. Autonomous Readiness Assessment");
  for (const task of sampleTasks) {
    const { ready, reason } = isAutonomousReady(task);
    const score = calculateAutonomyScore(task);
    console.log(`   ${task.id}: ${ready ? "✓" : "✗"} (score: ${score})`);
    console.log(`      ${reason}`);
  }

  // Example 3: Build task queue
  console.log("\n3. Task Queue Building");
  const queue = buildTaskQueue(sampleTasks);
  console.log(`   Autonomous-ready: ${queue.autonomousReady.length} tasks`);
  console.log(`   Needs review: ${queue.needsReview.length} tasks`);
  console.log(`   Human-only: ${queue.humanOnly.length} tasks`);
  console.log(`   Ready percentage: ${queue.autonomousReadyPercent.toFixed(1)}%`);

  // Example 4: Get next task
  console.log("\n4. Next Task Selection");
  const nextTask = getNextAutonomousTask(queue);
  if (nextTask) {
    console.log(`   Next task: ${nextTask.title}`);
    console.log(`   Priority: ${calculatePriority(nextTask)}`);
    console.log(`   Estimated context windows: ${nextTask.estimatedContextWindows}`);
  } else {
    console.log("   No autonomous-ready tasks available");
  }

  // Example 5: Task sizing analysis
  console.log("\n5. Task Sizing Analysis");
  for (const task of sampleTasks) {
    const estimated = estimateContextWindows(task);
    const decomposition = suggestDecomposition({ ...task, estimatedContextWindows: estimated });
    console.log(`   ${task.id}: ${estimated} context windows`);
    if (decomposition.length > 0) {
      console.log(`      Decomposition needed: ${decomposition[0]}`);
    }
  }

  // Example 6: Task template
  console.log("\n6. Task Template Generation");
  const template = generateTaskTemplate(
    "Add user avatar upload",
    "Allow users to upload profile avatars with validation and resizing"
  );
  console.log(`   Template generated: ${template.length} characters`);
  console.log(`   Preview:\n${template.split("\n").slice(0, 5).join("\n")}...`);

  // Example 7: Well-sized vs oversized examples
  console.log("\n7. Task Sizing Guidelines");
  console.log("   Well-sized tasks:");
  for (const example of WELL_SIZED_EXAMPLES.slice(0, 4)) {
    console.log(`   ✓ ${example}`);
  }
  console.log("   Oversized tasks (need decomposition):");
  for (const example of OVERSIZED_EXAMPLES.slice(0, 4)) {
    console.log(`   ✗ ${example}`);
  }

  // Example 8: Claude assessment (if API available)
  console.log("\n8. Claude Task Assessment");
  if (process.env.ANTHROPIC_API_KEY && sampleTasks[0]) {
    try {
      const assessment = await assessTaskWithClaude(sampleTasks[0]);
      console.log(`   Assessment: ${assessment.assessment.slice(0, 150)}...`);
      console.log(`   Suggestions: ${assessment.suggestions.length}`);
    } catch (error) {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping Claude assessment)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
