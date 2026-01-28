/**
 * Chapter 10: The RALPH Loop
 *
 * This file demonstrates the core RALPH Loop pattern using the Claude Agent SDK.
 * The RALPH Loop spawns fresh agent instances for each discrete task, maintaining
 * memory through files rather than conversation history.
 *
 * Key concepts:
 * - Fresh context per iteration prevents context rot
 * - Memory persists through AGENTS.md, TASKS.md, and git
 * - Each iteration follows: Plan (40%), Work (20%), Review (40%), Compound
 * - Quality gates must pass before task completion
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { countTokens } from "../shared/tokenizer";

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
 * A task in the RALPH loop task queue
 */
export interface Task {
  /** Task identifier */
  id: string;
  /** Task title/description */
  title: string;
  /** Task status */
  status: "pending" | "in_progress" | "complete" | "blocked";
  /** Acceptance criteria */
  acceptanceCriteria?: string[];
  /** Related files or context */
  context?: string[];
  /** Tasks this depends on */
  dependencies?: string[];
  /** Completion timestamp */
  completedAt?: string;
}

/**
 * Parsed TASKS.md content
 */
export interface TaskFile {
  /** All tasks */
  tasks: Task[];
  /** Metadata */
  metadata: {
    lastUpdated: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
}

/**
 * Result of a single RALPH iteration
 */
export interface IterationResult {
  /** Iteration number */
  iteration: number;
  /** Task that was worked on */
  task: Task;
  /** Whether the iteration succeeded */
  success: boolean;
  /** Quality gate results */
  qualityGates: QualityGateResult[];
  /** Learnings captured */
  learnings: string[];
  /** Time taken in milliseconds */
  durationMs: number;
  /** Tokens used */
  tokensUsed: number;
}

/**
 * Quality gate execution result
 */
export interface QualityGateResult {
  /** Gate name */
  name: string;
  /** Whether it passed */
  passed: boolean;
  /** Output or error message */
  output: string;
  /** Time taken in milliseconds */
  durationMs: number;
}

/**
 * RALPH loop configuration
 */
export interface RalphConfig {
  /** Path to TASKS.md */
  tasksPath: string;
  /** Path to AGENTS.md */
  agentsPath: string;
  /** Maximum iterations (0 = unlimited) */
  maxIterations: number;
  /** Review cycle frequency */
  reviewEvery: number;
  /** Quality gate commands */
  qualityGates: Array<{ name: string; command: string }>;
  /** Safety protocols for overnight runs */
  safetyProtocols: {
    allowBreakingChanges: boolean;
    excludePaths: string[];
    requireTests: boolean;
  };
}

// ============================================================================
// TASK PARSING
// ============================================================================

/**
 * Parse a TASKS.md file into structured tasks
 */
export function parseTasksFile(content: string): TaskFile {
  const lines = content.split("\n");
  const tasks: Task[] = [];
  let taskId = 0;

  for (const line of lines) {
    // Match markdown checkbox format: - [ ] or - [x]
    const checkboxMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (checkboxMatch && checkboxMatch[2]) {
      const isComplete = checkboxMatch[1] === "x";
      const title = checkboxMatch[2].trim();

      // Extract completion date if present
      const dateMatch = title.match(/\(Completed:\s+([^)]+)\)/);
      const cleanTitle = title.replace(/\s*\(Completed:[^)]+\)/, "").trim();

      tasks.push({
        id: `task-${++taskId}`,
        title: cleanTitle,
        status: isComplete ? "complete" : "pending",
        completedAt: dateMatch ? dateMatch[1] : undefined,
      });
    }
  }

  const completedTasks = tasks.filter((t) => t.status === "complete").length;

  return {
    tasks,
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks: tasks.length - completedTasks,
    },
  };
}

/**
 * Get the next pending task to work on
 */
export function getNextTask(taskFile: TaskFile): Task | null {
  return taskFile.tasks.find((t) => t.status === "pending") || null;
}

/**
 * Mark a task as complete in the tasks file
 */
export function markTaskComplete(taskFile: TaskFile, taskId: string): TaskFile {
  const updatedTasks = taskFile.tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        status: "complete" as const,
        completedAt: new Date().toISOString(),
      };
    }
    return task;
  });

  const completedTasks = updatedTasks.filter((t) => t.status === "complete").length;

  return {
    tasks: updatedTasks,
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalTasks: updatedTasks.length,
      completedTasks,
      pendingTasks: updatedTasks.length - completedTasks,
    },
  };
}

/**
 * Serialize tasks back to TASKS.md format
 */
export function serializeTasksFile(taskFile: TaskFile): string {
  const lines = ["# Tasks", ""];

  for (const task of taskFile.tasks) {
    const checkbox = task.status === "complete" ? "[x]" : "[ ]";
    const completionDate = task.completedAt ? ` (Completed: ${task.completedAt.split("T")[0]})` : "";
    lines.push(`- ${checkbox} ${task.title}${completionDate}`);
  }

  return lines.join("\n");
}

// ============================================================================
// FRESH CONTEXT ITERATION
// ============================================================================

/**
 * Build the prompt for a fresh agent iteration
 */
export function buildIterationPrompt(
  task: Task,
  agentsMdContent: string,
  additionalContext: string = ""
): string {
  return `You are working on a single task in a fresh context. Complete this task following
the established patterns and conventions.

## Your Knowledge Base (AGENTS.md)
${agentsMdContent}

## Current Task
**ID:** ${task.id}
**Title:** ${task.title}
${task.acceptanceCriteria ? `**Acceptance Criteria:**\n${task.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}` : ""}
${task.context ? `**Context:**\n${task.context.join("\n")}` : ""}

${additionalContext ? `## Additional Context\n${additionalContext}` : ""}

## Instructions
1. PLAN (40% effort): Research the codebase, find similar implementations, synthesize approach
2. WORK (20% effort): Implement following established patterns
3. REVIEW (40% effort): Verify acceptance criteria, run quality gates
4. COMPOUND: Document any learnings or gotchas discovered

If tests pass, mark the task complete. Document any patterns worth formalizing.`;
}

/**
 * Execute a single RALPH iteration with fresh context
 */
export async function executeIteration(
  task: Task,
  agentsMdContent: string,
  config: RalphConfig
): Promise<IterationResult> {
  const startTime = Date.now();
  const learnings: string[] = [];

  // Build fresh context prompt
  const prompt = buildIterationPrompt(task, agentsMdContent);

  // Execute with Agent SDK using streaming
  const agentResponse = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5",
      allowedTools: [], // No tools needed for iteration planning
    },
  });

  // Collect response from stream
  let responseText = "";

  for await (const message of agentResponse) {
    if (message.type === "assistant") {
      responseText += extractTextContent(message);
    }
  }

  // Count tokens using tiktoken (Agent SDK doesn't expose usage directly)
  const tokensUsed = countTokens(prompt) + countTokens(responseText);

  // Extract learnings from response
  const learningsMatch = responseText.match(/## Learnings?\s*([\s\S]*?)(?=##|$)/i);
  if (learningsMatch && learningsMatch[1]) {
    const learningLines = learningsMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim());
    learnings.push(...learningLines);
  }

  // Simulate quality gate execution (in real implementation, these would run actual commands)
  const qualityGates: QualityGateResult[] = config.qualityGates.map((gate) => ({
    name: gate.name,
    passed: true, // Simulated - in real use, execute gate.command
    output: `${gate.name} passed`,
    durationMs: 100,
  }));

  const allGatesPassed = qualityGates.every((g) => g.passed);

  return {
    iteration: 0, // Will be set by the loop
    task,
    success: allGatesPassed,
    qualityGates,
    learnings,
    durationMs: Date.now() - startTime,
    tokensUsed,
  };
}

// ============================================================================
// AGENTS.MD MANAGEMENT
// ============================================================================

/**
 * Append learnings to AGENTS.md
 */
export function appendLearnings(agentsMdContent: string, learnings: string[]): string {
  if (learnings.length === 0) return agentsMdContent;

  const timestamp = new Date().toISOString().split("T")[0];
  const learningSection = `

## Recent Learnings (${timestamp})
${learnings.map((l) => `- ${l}`).join("\n")}`;

  // Check if there's already a Recent Learnings section
  if (agentsMdContent.includes("## Recent Learnings")) {
    // Append to existing section
    return agentsMdContent.replace(
      /(## Recent Learnings[^\n]*\n)/,
      `$1${learnings.map((l) => `- ${l}`).join("\n")}\n`
    );
  }

  return agentsMdContent + learningSection;
}

// ============================================================================
// RALPH LOOP ORCHESTRATOR
// ============================================================================

/**
 * The main RALPH loop orchestrator
 */
export async function runRalphLoop(config: RalphConfig): Promise<IterationResult[]> {
  const results: IterationResult[] = [];
  let iterationCount = 0;

  // Read initial files
  let tasksContent = existsSync(config.tasksPath)
    ? await readFile(config.tasksPath, "utf-8")
    : "# Tasks\n\n- [ ] No tasks defined";

  let agentsContent = existsSync(config.agentsPath)
    ? await readFile(config.agentsPath, "utf-8")
    : "# AGENTS.md\n\nNo conventions defined yet.";

  let taskFile = parseTasksFile(tasksContent);

  while (true) {
    // Check iteration limit
    if (config.maxIterations > 0 && iterationCount >= config.maxIterations) {
      console.log(`Reached maximum iterations (${config.maxIterations})`);
      break;
    }

    // Get next task
    const nextTask = getNextTask(taskFile);
    if (!nextTask) {
      console.log("All tasks complete!");
      break;
    }

    iterationCount++;
    console.log(`\n=== Iteration ${iterationCount}: ${nextTask.title} ===`);

    // Execute iteration with fresh context
    const result = await executeIteration(nextTask, agentsContent, config);
    result.iteration = iterationCount;
    results.push(result);

    if (result.success) {
      // Mark task complete
      taskFile = markTaskComplete(taskFile, nextTask.id);
      await writeFile(config.tasksPath, serializeTasksFile(taskFile));

      // Append learnings
      if (result.learnings.length > 0) {
        agentsContent = appendLearnings(agentsContent, result.learnings);
        await writeFile(config.agentsPath, agentsContent);
      }

      console.log(`✓ Task completed in ${result.durationMs}ms`);
      console.log(`  Tokens used: ${result.tokensUsed}`);
      if (result.learnings.length > 0) {
        console.log(`  Learnings captured: ${result.learnings.length}`);
      }
    } else {
      console.log(`✗ Task failed - quality gates did not pass`);
      for (const gate of result.qualityGates.filter((g) => !g.passed)) {
        console.log(`  - ${gate.name}: ${gate.output}`);
      }
    }

    // Check for review cycle
    if (iterationCount % config.reviewEvery === 0) {
      console.log(`\n--- Review cycle (iteration ${iterationCount}) ---`);
      // In a real implementation, this would trigger review agents
    }
  }

  return results;
}

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Create default RALPH configuration
 */
export function createDefaultConfig(): RalphConfig {
  return {
    tasksPath: "TASKS.md",
    agentsPath: "AGENTS.md",
    maxIterations: 0, // Unlimited
    reviewEvery: 6,
    qualityGates: [
      { name: "Type check", command: "bun run type-check" },
      { name: "Lint", command: "bun run lint" },
      { name: "Unit tests", command: "bun run test:unit" },
      { name: "Build", command: "bun run build" },
    ],
    safetyProtocols: {
      allowBreakingChanges: false,
      excludePaths: ["src/core/**", "database/migrations/**"],
      requireTests: true,
    },
  };
}

/**
 * Create overnight/autonomous configuration with conservative settings
 */
export function createOvernightConfig(): RalphConfig {
  const base = createDefaultConfig();
  return {
    ...base,
    maxIterations: 50, // Safety limit
    safetyProtocols: {
      allowBreakingChanges: false,
      excludePaths: [
        "src/core/**",
        "src/infrastructure/**",
        "database/**",
        "config/**",
      ],
      requireTests: true,
    },
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate the RALPH loop concepts
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 10: The RALPH Loop ===\n");

  // Example 1: Task parsing
  console.log("1. Task File Parsing");
  const sampleTasks = `# Tasks

- [x] Implement user authentication (Completed: 2025-01-15)
- [x] Add rate limiting to API (Completed: 2025-01-16)
- [ ] Implement password reset flow
- [ ] Add user profile page
- [ ] Create API documentation`;

  const taskFile = parseTasksFile(sampleTasks);
  console.log(`   Total tasks: ${taskFile.metadata.totalTasks}`);
  console.log(`   Completed: ${taskFile.metadata.completedTasks}`);
  console.log(`   Pending: ${taskFile.metadata.pendingTasks}`);

  // Example 2: Get next task
  console.log("\n2. Next Task Selection");
  const nextTask = getNextTask(taskFile);
  if (nextTask) {
    console.log(`   Next task: ${nextTask.title}`);
    console.log(`   Status: ${nextTask.status}`);
  }

  // Example 3: Build iteration prompt
  console.log("\n3. Fresh Context Prompt Building");
  const mockAgentsMd = `# AGENTS.md

## Tech Stack
- Runtime: Bun
- Framework: Next.js 15
- Database: PostgreSQL

## Common Patterns
- Use Server Actions for forms
- Validate input with zod`;

  if (nextTask) {
    const prompt = buildIterationPrompt(nextTask, mockAgentsMd);
    console.log(`   Prompt length: ${prompt.length} characters`);
    console.log(`   Tokens: ${countTokens(prompt)}`);
  }

  // Example 4: Task completion
  console.log("\n4. Task Completion");
  if (nextTask) {
    const updatedTaskFile = markTaskComplete(taskFile, nextTask.id);
    console.log(`   Completed: ${nextTask.title}`);
    console.log(`   New pending count: ${updatedTaskFile.metadata.pendingTasks}`);
  }

  // Example 5: Learning accumulation
  console.log("\n5. Learning Accumulation");
  const learnings = [
    "Always validate email format before database insert",
    "Password reset tokens should expire after 24 hours",
  ];
  const updatedAgentsMd = appendLearnings(mockAgentsMd, learnings);
  console.log(`   Original AGENTS.md: ${mockAgentsMd.length} chars`);
  console.log(`   After learnings: ${updatedAgentsMd.length} chars`);
  console.log(`   Learnings added: ${learnings.length}`);

  // Example 6: Configuration
  console.log("\n6. Configuration Options");
  const defaultConfig = createDefaultConfig();
  const overnightConfig = createOvernightConfig();
  console.log(`   Default max iterations: ${defaultConfig.maxIterations || "unlimited"}`);
  console.log(`   Overnight max iterations: ${overnightConfig.maxIterations}`);
  console.log(`   Quality gates: ${defaultConfig.qualityGates.length}`);
  console.log(`   Review every: ${defaultConfig.reviewEvery} iterations`);

  // Example 7: Live API call (if available)
  console.log("\n7. Single Iteration (API Demo)");
  if (process.env.ANTHROPIC_API_KEY && nextTask) {
    try {
      // In a real implementation, we'd use this config for the iteration
      const _demoConfig = { ...createDefaultConfig(), maxIterations: 1 };
      void _demoConfig; // Show config exists for demonstration

      const demoResponse = query({
        prompt: "In one sentence, explain the RALPH loop pattern for AI development.",
        options: {
          model: "claude-sonnet-4-5",
          allowedTools: [],
        },
      });

      let demoText = "";
      for await (const message of demoResponse) {
        if (message.type === "assistant") {
          demoText += extractTextContent(message);
        }
      }

      console.log(`   Response: ${demoText.slice(0, 150)}...`);
      console.log(`   Tokens: ${countTokens(demoText)}`);
    } catch (error) {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping live demonstration)");
  }

  // Example 8: The flywheel effect
  console.log("\n8. The Flywheel Effect");
  console.log("   Iteration 1: Agent discovers migration pattern");
  console.log("   Iteration 2: Pattern added to AGENTS.md");
  console.log("   Iteration 3: Next agent reads pattern, avoids mistake");
  console.log("   Iteration 10: Harness has 9 iterations of learnings");
  console.log("   Result: Each iteration faster than the last");

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
