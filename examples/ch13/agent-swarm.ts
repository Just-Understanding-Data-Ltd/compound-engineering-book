/**
 * Chapter 13: Agent Swarm Tactics
 *
 * Demonstrates Layer 3 meta-engineering: parallel agent execution
 * for large tasks, task breakdown, and result merging.
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
// Task Breakdown Types
// ============================================================================

export interface TaskSpec {
  id: string;
  name: string;
  description: string;
  files: string[];
  dependencies: string[];
  constraints: string[];
  expectedOutput: string;
}

export interface SwarmConfig {
  maxConcurrency: number;
  timeoutMs: number;
  retryAttempts: number;
  mergeStrategy: "sequential" | "parallel" | "conflict-aware";
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  output: string;
  filesModified: string[];
  errors?: string[];
  duration: number;
}

export interface SwarmResult {
  success: boolean;
  results: AgentResult[];
  conflicts: ConflictReport[];
  mergedOutput?: string;
  totalDuration: number;
}

export interface ConflictReport {
  file: string;
  taskIds: string[];
  description: string;
  resolution?: string;
}

// ============================================================================
// Task Breakdown
// ============================================================================

export function breakdownSpec(
  spec: string,
  projectStructure: string[]
): TaskSpec[] {
  // Group files by feature/module
  const featureGroups = new Map<string, string[]>();

  for (const file of projectStructure) {
    const parts = file.split("/");
    const feature = parts[1] || "root"; // src/auth/... -> auth
    const existing = featureGroups.get(feature) || [];
    existing.push(file);
    featureGroups.set(feature, existing);
  }

  // Create independent tasks per feature
  const tasks: TaskSpec[] = [];
  let taskNum = 0;

  for (const [feature, files] of featureGroups) {
    taskNum++;
    tasks.push({
      id: `task-${taskNum}`,
      name: `Implement ${feature} module`,
      description: `${spec}\n\nFocus on: ${feature} module`,
      files,
      dependencies: [], // Will be populated based on imports
      constraints: [
        `Only modify files in ${feature}/`,
        "Maintain existing interfaces",
        "All new functions must have tests",
      ],
      expectedOutput: `Completed ${feature} implementation with tests`,
    });
  }

  return tasks;
}

// ============================================================================
// Agent Spawning
// ============================================================================

export async function spawnAgent(
  task: TaskSpec
): Promise<AgentResult> {
  const startTime = Date.now();

  const prompt = `You are implementing a specific module as part of a larger system.

## Task
${task.name}

## Description
${task.description}

## Files in Scope
${task.files.join("\n")}

## Constraints
${task.constraints.join("\n")}

## Instructions
1. Implement the required functionality
2. Only modify files in scope
3. Ensure code compiles and types are correct
4. Add appropriate error handling
5. Return a summary of changes made

Expected output: ${task.expectedOutput}`;

  try {
    const response = query({
      prompt,
      options: {
        model: "claude-sonnet-4-5-20250929",
        allowedTools: [],
      },
    });

    let output = "";
    for await (const message of response) {
      output += extractTextContent(message);
    }

    return {
      taskId: task.id,
      success: true,
      output,
      filesModified: task.files,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      taskId: task.id,
      success: false,
      output: "",
      filesModified: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
      duration: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Swarm Execution
// ============================================================================

export async function executeSwarm(
  tasks: TaskSpec[],
  config: SwarmConfig
): Promise<SwarmResult> {
  const startTime = Date.now();
  const results: AgentResult[] = [];
  const conflicts: ConflictReport[] = [];

  // Sort tasks by dependencies (topological sort)
  const sortedTasks = topologicalSort(tasks);

  if (config.mergeStrategy === "parallel") {
    // Execute all independent tasks in parallel
    const independentTasks = sortedTasks.filter(
      (t) => t.dependencies.length === 0
    );
    const dependentTasks = sortedTasks.filter(
      (t) => t.dependencies.length > 0
    );

    // Batch parallel execution respecting concurrency limit
    for (let i = 0; i < independentTasks.length; i += config.maxConcurrency) {
      const batch = independentTasks.slice(i, i + config.maxConcurrency);
      const batchResults = await Promise.all(
        batch.map((task) => executeWithRetry(task, config.retryAttempts))
      );
      results.push(...batchResults);
    }

    // Execute dependent tasks sequentially
    for (const task of dependentTasks) {
      const result = await executeWithRetry(task, config.retryAttempts);
      results.push(result);
    }
  } else {
    // Sequential execution
    for (const task of sortedTasks) {
      const result = await executeWithRetry(task, config.retryAttempts);
      results.push(result);
    }
  }

  // Detect conflicts
  const fileModifications = new Map<string, string[]>();
  for (const result of results) {
    for (const file of result.filesModified) {
      const modifiers = fileModifications.get(file) || [];
      modifiers.push(result.taskId);
      fileModifications.set(file, modifiers);
    }
  }

  for (const [file, taskIds] of fileModifications) {
    if (taskIds.length > 1) {
      conflicts.push({
        file,
        taskIds,
        description: `File modified by multiple tasks: ${taskIds.join(", ")}`,
      });
    }
  }

  return {
    success: results.every((r) => r.success) && conflicts.length === 0,
    results,
    conflicts,
    totalDuration: Date.now() - startTime,
  };
}

async function executeWithRetry(
  task: TaskSpec,
  maxRetries: number
): Promise<AgentResult> {
  let lastResult: AgentResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await spawnAgent(task);
    if (lastResult.success) {
      return lastResult;
    }

    // Add delay between retries
    if (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }

  return lastResult!;
}

export function topologicalSort(tasks: TaskSpec[]): TaskSpec[] {
  const sorted: TaskSpec[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  function visit(task: TaskSpec) {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) {
      throw new Error(`Circular dependency detected: ${task.id}`);
    }

    visiting.add(task.id);

    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId);
      if (depTask) {
        visit(depTask);
      }
    }

    visiting.delete(task.id);
    visited.add(task.id);
    sorted.push(task);
  }

  for (const task of tasks) {
    visit(task);
  }

  return sorted;
}

// ============================================================================
// Conflict Resolution
// ============================================================================

export async function resolveConflicts(
  swarmResult: SwarmResult
): Promise<string> {
  if (swarmResult.conflicts.length === 0) {
    return "No conflicts to resolve";
  }

  const conflictReport = swarmResult.conflicts
    .map(
      (c) =>
        `- ${c.file}: Modified by ${c.taskIds.join(", ")}\n  ${c.description}`
    )
    .join("\n");

  const taskOutputs = swarmResult.results
    .map((r) => `## ${r.taskId}\n${r.output}`)
    .join("\n\n");

  const prompt = `Multiple agents have modified the same files. Resolve the conflicts by merging the changes intelligently.

## Conflicts
${conflictReport}

## Task Outputs
${taskOutputs}

## Instructions
1. Identify overlapping changes in each conflicting file
2. Merge changes preserving functionality from both
3. Resolve any contradictory changes by choosing the most recent or most complete version
4. Return the merged code for each conflicting file`;

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

// ============================================================================
// Nightly Job Orchestrator
// ============================================================================

export interface NightlyJob {
  name: string;
  schedule: string; // cron expression
  command: string;
  timeout: number;
  onSuccess: "create-pr" | "notify-slack" | "none";
  onFailure: "create-issue" | "notify-slack" | "none";
}

export interface NightlyConfig {
  jobs: NightlyJob[];
  defaultTimeout: number;
  slackWebhook?: string;
  githubToken?: string;
}

export interface JobResult {
  job: string;
  success: boolean;
  output: string;
  duration: number;
  timestamp: Date;
}

export async function runNightlyJobs(
  config: NightlyConfig
): Promise<JobResult[]> {
  const results: JobResult[] = [];

  for (const job of config.jobs) {
    const startTime = Date.now();

    try {
      // Simulate job execution
      const output = await executeJob(job.command, job.timeout);

      results.push({
        job: job.name,
        success: true,
        output,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      });

      // Handle success action
      if (job.onSuccess === "create-pr") {
        console.log(`Creating PR for ${job.name}`);
      } else if (job.onSuccess === "notify-slack") {
        console.log(`Notifying Slack: ${job.name} succeeded`);
      }
    } catch (error) {
      results.push({
        job: job.name,
        success: false,
        output: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
        timestamp: new Date(),
      });

      // Handle failure action
      if (job.onFailure === "create-issue") {
        console.log(`Creating issue for ${job.name} failure`);
      } else if (job.onFailure === "notify-slack") {
        console.log(`Notifying Slack: ${job.name} failed`);
      }
    }
  }

  return results;
}

async function executeJob(command: string, _timeout: number): Promise<string> {
  // Simulate job execution (timeout would be used in real implementation)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Executed: ${command}`);
    }, 100);
  });
}

// ============================================================================
// Example Configurations
// ============================================================================

export const exampleSwarmConfig: SwarmConfig = {
  maxConcurrency: 5,
  timeoutMs: 300000, // 5 minutes
  retryAttempts: 2,
  mergeStrategy: "parallel",
};

export const exampleNightlyConfig: NightlyConfig = {
  defaultTimeout: 60000,
  jobs: [
    {
      name: "update-dependencies",
      schedule: "0 2 * * *",
      command: "npm update && npm test",
      timeout: 120000,
      onSuccess: "create-pr",
      onFailure: "create-issue",
    },
    {
      name: "security-audit",
      schedule: "0 3 * * *",
      command: "npm audit --audit-level=moderate",
      timeout: 60000,
      onSuccess: "none",
      onFailure: "create-issue",
    },
    {
      name: "performance-benchmark",
      schedule: "0 4 * * *",
      command: "npm run benchmark",
      timeout: 300000,
      onSuccess: "notify-slack",
      onFailure: "notify-slack",
    },
  ],
};

export const exampleProjectStructure = [
  "src/auth/authenticate.ts",
  "src/auth/session.ts",
  "src/auth/permissions.ts",
  "src/payments/processor.ts",
  "src/payments/refunds.ts",
  "src/users/profile.ts",
  "src/users/settings.ts",
  "src/notifications/email.ts",
  "src/notifications/push.ts",
];

// ============================================================================
// Demo
// ============================================================================

async function demo() {
  console.log("=== Chapter 13: Agent Swarm Demo ===\n");

  // Break down a spec into tasks
  console.log("--- Task Breakdown ---\n");
  const spec = "Implement user authentication with password reset functionality";
  const tasks = breakdownSpec(spec, exampleProjectStructure);

  tasks.forEach((task) => {
    console.log(`Task: ${task.id} - ${task.name}`);
    console.log(`  Files: ${task.files.join(", ")}`);
    console.log(`  Constraints: ${task.constraints.length}`);
    console.log("");
  });

  // Show swarm config
  console.log("--- Swarm Configuration ---\n");
  console.log(`Max Concurrency: ${exampleSwarmConfig.maxConcurrency}`);
  console.log(`Timeout: ${exampleSwarmConfig.timeoutMs}ms`);
  console.log(`Retry Attempts: ${exampleSwarmConfig.retryAttempts}`);
  console.log(`Merge Strategy: ${exampleSwarmConfig.mergeStrategy}`);

  // Show nightly jobs
  console.log("\n--- Nightly Jobs ---\n");
  exampleNightlyConfig.jobs.forEach((job) => {
    console.log(`Job: ${job.name}`);
    console.log(`  Schedule: ${job.schedule}`);
    console.log(`  Command: ${job.command}`);
    console.log(`  On Success: ${job.onSuccess}`);
    console.log(`  On Failure: ${job.onFailure}`);
    console.log("");
  });

  // Run nightly jobs (simulated)
  console.log("--- Running Nightly Jobs (Simulated) ---\n");
  const jobResults = await runNightlyJobs(exampleNightlyConfig);
  jobResults.forEach((result) => {
    const status = result.success ? "✓" : "✗";
    console.log(`${status} ${result.job} (${result.duration}ms)`);
  });

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
