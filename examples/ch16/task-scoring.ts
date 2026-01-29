/**
 * Chapter 16: Building Autonomous Systems - Task Scoring
 *
 * This file demonstrates the dynamic task scoring system used in autonomous
 * development loops. Tasks are scored based on priority, type, chapter sequence,
 * blocking relationships, and age to ensure the most valuable work surfaces first.
 *
 * Key concepts:
 * - Multi-factor scoring with weighted components
 * - Blocking bonus to prevent bottlenecks
 * - Age bonus to prevent task starvation
 * - Dynamic recalculation after each completion
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
 * Task priority levels
 */
export type TaskPriority = "critical" | "high" | "medium" | "normal" | "low";

/**
 * Task types for scoring
 */
export type TaskType =
  | "blocker"
  | "chapter"
  | "fix"
  | "kb-article"
  | "diagram"
  | "appendix"
  | "review";

/**
 * Task status
 */
export type TaskStatus = "pending" | "in_progress" | "complete" | "blocked";

/**
 * Task definition for the scoring system
 */
export interface ScoredTask {
  /** Unique task identifier */
  id: string;
  /** Task type (affects base score) */
  type: TaskType;
  /** Human-readable title */
  title: string;
  /** Current status */
  status: TaskStatus;
  /** Priority level */
  priority: TaskPriority;
  /** Computed score (higher = do first) */
  score: number;
  /** Associated chapter (e.g., "ch01", "ch15") */
  chapter?: string;
  /** Task IDs that block this task */
  blockedBy?: string[];
  /** When the task was created */
  createdAt?: string;
  /** Flagged by review agent */
  reviewFlagged?: boolean;
}

/**
 * Task queue with statistics
 */
export interface TaskQueue {
  tasks: ScoredTask[];
  stats: {
    pending: number;
    inProgress: number;
    complete: number;
    blocked: number;
    total: number;
  };
  lastUpdated: string;
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

/**
 * Priority scores: Critical tasks get highest base score
 */
export const PRIORITY_SCORES: Record<TaskPriority, number> = {
  critical: 1000,
  high: 750,
  medium: 500,
  normal: 250,
  low: 100,
};

/**
 * Type scores: Blockers and chapters are most important
 */
export const TYPE_SCORES: Record<TaskType, number> = {
  blocker: 200,
  chapter: 100,
  fix: 80,
  "kb-article": 60,
  diagram: 40,
  appendix: 20,
  review: 10,
};

/**
 * Milestone order within a chapter (earlier milestones = higher score)
 */
export const MILESTONE_SCORES: Record<string, number> = {
  "code written": 50,
  "code tested": 45,
  reviewed: 40,
  "diagrams complete": 35,
  final: 30,
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Extract chapter number from task or chapter string
 */
export function getChapterNumber(task: ScoredTask): number {
  if (task.chapter) {
    const match = task.chapter.match(/ch(\d+)/);
    return match ? parseInt(match[1], 10) : 99;
  }
  // Try extracting from title
  const titleMatch = task.title.match(/ch(?:apter\s*)?(\d+)/i);
  return titleMatch ? parseInt(titleMatch[1], 10) : 99;
}

/**
 * Calculate the complete score for a task
 *
 * Score = priority + type + chapter_sequence + blocking_bonus + age_bonus + review_bonus
 */
export function calculateScore(task: ScoredTask, allTasks: ScoredTask[]): number {
  let score = 0;

  // 1. Priority score (base score from priority level)
  score += PRIORITY_SCORES[task.priority] || PRIORITY_SCORES.normal;

  // 2. Type score (chapter work > fixes > diagrams > reviews)
  score += TYPE_SCORES[task.type] || 0;

  // 3. Chapter sequence bonus (earlier chapters get higher score)
  // ch01 gets +95, ch15 gets +25, ch20 gets 0
  const chapterNum = getChapterNumber(task);
  score += Math.max(0, (20 - chapterNum) * 5);

  // 4. Milestone order within chapter
  for (const [milestone, bonus] of Object.entries(MILESTONE_SCORES)) {
    if (task.title.toLowerCase().includes(milestone)) {
      score += bonus;
      break;
    }
  }

  // 5. Review flagged bonus
  if (task.reviewFlagged) {
    score += 200;
  }

  // 6. Blocking bonus: if this task blocks others, prioritize it
  const blocksCount = allTasks.filter(
    (t) => t.blockedBy && t.blockedBy.includes(task.id)
  ).length;
  score += blocksCount * 25;

  // 7. Age bonus: prevent starvation (tasks waiting too long)
  if (task.createdAt) {
    const ageMs = Date.now() - new Date(task.createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours > 24) score += 50;
    if (ageHours > 48) score += 50; // Additional bonus for very old tasks
  }

  return Math.round(score);
}

/**
 * Recalculate scores for all pending tasks
 */
export function scoreAllTasks(queue: TaskQueue): void {
  for (const task of queue.tasks) {
    if (task.status !== "complete") {
      task.score = calculateScore(task, queue.tasks);
    }
  }
  // Sort by score (highest first)
  queue.tasks.sort((a, b) => (b.score || 0) - (a.score || 0));
  queue.lastUpdated = new Date().toISOString();
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Update blocked status based on completed dependencies
 */
export function updateBlockedStatus(queue: TaskQueue): string[] {
  const unblocked: string[] = [];
  const completedIds = new Set(
    queue.tasks.filter((t) => t.status === "complete").map((t) => t.id)
  );

  for (const task of queue.tasks) {
    if (task.blockedBy && task.blockedBy.length > 0) {
      // Remove completed tasks from blockedBy
      const remaining = task.blockedBy.filter((id) => !completedIds.has(id));

      // If all blockers are complete, unblock the task
      if (remaining.length === 0 && task.status === "blocked") {
        task.status = "pending";
        unblocked.push(task.id);
      }
      task.blockedBy = remaining;
    }
  }

  return unblocked;
}

/**
 * Calculate queue statistics
 */
export function calculateStats(queue: TaskQueue): void {
  const stats = { pending: 0, inProgress: 0, complete: 0, blocked: 0, total: 0 };

  for (const task of queue.tasks) {
    switch (task.status) {
      case "pending":
        stats.pending++;
        break;
      case "in_progress":
        stats.inProgress++;
        break;
      case "complete":
        stats.complete++;
        break;
      case "blocked":
        stats.blocked++;
        break;
    }
  }
  stats.total = queue.tasks.length;
  queue.stats = stats;
}

/**
 * Get the next task to work on (highest score, pending, not blocked)
 */
export function getNextTask(queue: TaskQueue): ScoredTask | null {
  const candidates = queue.tasks.filter(
    (t) =>
      t.status === "pending" && (!t.blockedBy || t.blockedBy.length === 0)
  );

  // Already sorted by score
  return candidates[0] || null;
}

/**
 * Complete a task and update the queue
 */
export function completeTask(queue: TaskQueue, taskId: string): boolean {
  const task = queue.tasks.find((t) => t.id === taskId);
  if (!task) return false;

  task.status = "complete";

  // Unblock dependent tasks
  updateBlockedStatus(queue);

  // Recalculate scores
  scoreAllTasks(queue);

  // Update stats
  calculateStats(queue);

  return true;
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Use Claude to suggest task prioritization improvements
 */
export async function analyzeQueueWithClaude(
  queue: TaskQueue
): Promise<string> {
  const topTasks = queue.tasks
    .filter((t) => t.status === "pending")
    .slice(0, 10)
    .map((t) => `- ${t.id} (score: ${t.score}): ${t.title}`)
    .join("\n");

  const prompt = `Analyze this task queue for an autonomous development loop:

**Top 10 Pending Tasks:**
${topTasks}

**Stats:**
- Pending: ${queue.stats.pending}
- Complete: ${queue.stats.complete}
- Blocked: ${queue.stats.blocked}

Questions:
1. Does the ordering make sense?
2. Are there any obvious bottlenecks?
3. Should any tasks be prioritized higher?

Provide brief, actionable feedback.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5",
      allowedTools: [],
    },
  });

  let text = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      text += extractTextContent(message);
    }
  }

  return text;
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate task scoring concepts
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 16: Task Scoring System ===\n");

  // Create sample queue
  const queue: TaskQueue = {
    tasks: [
      {
        id: "task-001",
        type: "chapter",
        title: "Chapter 1: Write first draft",
        status: "pending",
        priority: "high",
        score: 0,
        chapter: "ch01",
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days old
      },
      {
        id: "task-002",
        type: "chapter",
        title: "Chapter 15: code tested milestone",
        status: "pending",
        priority: "high",
        score: 0,
        chapter: "ch15",
      },
      {
        id: "task-003",
        type: "fix",
        title: "Fix broken cross-reference in ch05",
        status: "pending",
        priority: "medium",
        score: 0,
        chapter: "ch05",
        reviewFlagged: true,
      },
      {
        id: "task-004",
        type: "blocker",
        title: "Set up build pipeline",
        status: "pending",
        priority: "critical",
        score: 0,
      },
      {
        id: "task-005",
        type: "diagram",
        title: "Create architecture diagram for ch03",
        status: "blocked",
        priority: "medium",
        score: 0,
        chapter: "ch03",
        blockedBy: ["task-001"],
      },
      {
        id: "task-006",
        type: "review",
        title: "Run AI slop checker on ch08",
        status: "complete",
        priority: "low",
        score: 0,
        chapter: "ch08",
      },
    ],
    stats: { pending: 0, inProgress: 0, complete: 0, blocked: 0, total: 0 },
    lastUpdated: new Date().toISOString(),
  };

  // 1. Calculate initial scores
  console.log("1. Initial Scoring");
  scoreAllTasks(queue);
  calculateStats(queue);

  for (const task of queue.tasks) {
    console.log(`   ${task.id}: score=${task.score} (${task.status})`);
    console.log(`      ${task.title}`);
  }

  // 2. Show score breakdown for top task
  console.log("\n2. Score Breakdown for Top Task");
  const topTask = queue.tasks[0];
  if (topTask) {
    console.log(`   Task: ${topTask.title}`);
    console.log(`   Priority bonus: ${PRIORITY_SCORES[topTask.priority]}`);
    console.log(`   Type bonus: ${TYPE_SCORES[topTask.type]}`);
    console.log(`   Chapter bonus: ${Math.max(0, (20 - getChapterNumber(topTask)) * 5)}`);
    console.log(`   Review flagged: ${topTask.reviewFlagged ? "+200" : "0"}`);
    console.log(`   Total: ${topTask.score}`);
  }

  // 3. Get next task
  console.log("\n3. Next Task Selection");
  const next = getNextTask(queue);
  if (next) {
    console.log(`   Selected: ${next.id} - ${next.title}`);
    console.log(`   Score: ${next.score}`);
  }

  // 4. Complete a task and show queue update
  console.log("\n4. Completing a Task");
  completeTask(queue, "task-001");
  console.log("   Completed: task-001");
  console.log(`   Unblocked tasks: ${queue.tasks.filter((t) => t.status === "pending" && t.id === "task-005").length > 0 ? "task-005" : "none"}`);
  console.log(
    `   Stats: ${queue.stats.pending} pending, ${queue.stats.complete} complete, ${queue.stats.blocked} blocked`
  );

  // 5. Show jq-equivalent queries
  console.log("\n5. Common Queue Queries (jq equivalents)");
  console.log("   Next task:");
  const nextAfter = getNextTask(queue);
  console.log(`      ${nextAfter?.id}: ${nextAfter?.title} (score: ${nextAfter?.score})`);

  console.log("   Tasks by type:");
  const byType = queue.tasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [type, count] of Object.entries(byType)) {
    console.log(`      ${type}: ${count}`);
  }

  // 6. Claude analysis (if API available)
  console.log("\n6. Claude Queue Analysis");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const analysis = await analyzeQueueWithClaude(queue);
      console.log(`   ${analysis.slice(0, 200)}...`);
    } catch {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping Claude analysis)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
