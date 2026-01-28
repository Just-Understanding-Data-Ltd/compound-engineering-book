/**
 * Chapter 14: Task Decomposer
 *
 * Demonstrates breaking large tasks into agent-sized pieces.
 * The key insight: oversizing is the primary cause of agent failure.
 *
 * Key concept: Tasks should have 3-20 steps with clear boundaries.
 */

import Anthropic from "@anthropic-ai/sdk";

// Task size categories
type TaskSize = "too-small" | "optimal" | "too-large";

// A decomposed task
interface Task {
  id: string;
  title: string;
  description: string;
  estimatedSteps: number;
  dependencies: string[];
  parallelizable: boolean;
  complexity: "simple" | "medium" | "complex";
}

// Analysis result
interface TaskAnalysis {
  size: TaskSize;
  estimatedSteps: number;
  warnings: string[];
  suggestions: string[];
  canParallelize: boolean;
}

// Decomposition result
interface DecompositionResult {
  originalTask: string;
  analysis: TaskAnalysis;
  tasks: Task[];
  executionOrder: string[][];
  estimatedTimeMinutes: number;
}

// Task sizing guidelines
export const TASK_SIZING_GUIDELINES = {
  tooSmall: {
    steps: "< 3",
    description: "Task is too granular, overhead exceeds benefit",
    examples: [
      "Add a single import statement",
      "Change one variable name",
      "Fix a typo in one file",
    ],
    recommendation: "Batch with related changes",
  },
  optimal: {
    steps: "3-20",
    description: "Right-sized for agent execution",
    examples: [
      "Migrate 5 routes to new framework",
      "Implement authentication middleware",
      "Add validation to 3 forms",
    ],
    recommendation: "Execute as is",
  },
  tooLarge: {
    steps: "> 20",
    description: "Agent will lose context and likely fail",
    examples: [
      "Refactor entire API to new framework",
      "Rewrite the whole frontend",
      "Complete migration with all tests and deployment",
    ],
    recommendation: "Decompose into smaller tasks",
  },
};

// Estimate task size from description
export function estimateTaskSize(description: string): TaskAnalysis {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Keywords that indicate large scope
  const largeIndicators = [
    "entire",
    "whole",
    "complete",
    "all",
    "everything",
    "refactor",
    "rewrite",
    "migrate all",
    "full",
  ];

  const smallIndicators = ["single", "one", "just", "only", "tiny", "small"];

  const descLower = description.toLowerCase();

  // Count complexity indicators
  let complexityScore = 0;

  // Check for large indicators
  for (const indicator of largeIndicators) {
    if (descLower.includes(indicator)) {
      complexityScore += 10;
      warnings.push(`Contains "${indicator}" - suggests large scope`);
    }
  }

  // Check for small indicators
  for (const indicator of smallIndicators) {
    if (descLower.includes(indicator)) {
      complexityScore -= 5;
    }
  }

  // Check for multiple actions
  const actionWords = [
    "and",
    "then",
    "also",
    "plus",
    ",",
    "after",
    "before",
    "finally",
  ];
  let actionCount = 0;
  for (const word of actionWords) {
    if (descLower.includes(word)) {
      actionCount++;
    }
  }

  if (actionCount > 3) {
    complexityScore += actionCount * 3;
    warnings.push(`Multiple actions (${actionCount}) - consider splitting`);
  }

  // Estimate steps
  let estimatedSteps: number;
  if (complexityScore > 20) {
    estimatedSteps = 30 + complexityScore;
  } else if (complexityScore > 10) {
    estimatedSteps = 10 + complexityScore;
  } else if (complexityScore < -10) {
    estimatedSteps = 2;
  } else {
    estimatedSteps = 8 + complexityScore;
  }

  // Determine size
  let size: TaskSize;
  if (estimatedSteps < 3) {
    size = "too-small";
    suggestions.push("Consider batching with related changes");
  } else if (estimatedSteps > 20) {
    size = "too-large";
    suggestions.push("Break into 3-8 smaller tasks with clear boundaries");
    suggestions.push("Each subtask should be independently testable");
    suggestions.push("Consider using checkpoints between tasks");
  } else {
    size = "optimal";
    suggestions.push("Task is well-sized for agent execution");
  }

  // Check for parallelization potential
  const canParallelize =
    !descLower.includes("then") &&
    !descLower.includes("after") &&
    !descLower.includes("before");

  return {
    size,
    estimatedSteps,
    warnings,
    suggestions,
    canParallelize,
  };
}

// Decompose a large task using Claude
export async function decomposeTask(
  client: Anthropic,
  taskDescription: string
): Promise<DecompositionResult> {
  const analysis = estimateTaskSize(taskDescription);

  if (analysis.size !== "too-large") {
    // Return as single task if not too large
    return {
      originalTask: taskDescription,
      analysis,
      tasks: [
        {
          id: "task-1",
          title: taskDescription,
          description: taskDescription,
          estimatedSteps: analysis.estimatedSteps,
          dependencies: [],
          parallelizable: false,
          complexity: "medium",
        },
      ],
      executionOrder: [["task-1"]],
      estimatedTimeMinutes: analysis.estimatedSteps * 5,
    };
  }

  // Use Claude to decompose
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Decompose this large task into 4-8 smaller, agent-executable tasks:

"${taskDescription}"

Rules:
1. Each task should have 3-20 steps
2. Each task should be independently testable
3. Mark which tasks can run in parallel
4. Include a checkpoint after each task

Format as JSON:
{
  "tasks": [
    {
      "id": "task-1",
      "title": "short title",
      "description": "detailed description",
      "estimatedSteps": 10,
      "dependencies": [],
      "parallelizable": false,
      "complexity": "simple|medium|complex"
    }
  ],
  "executionOrder": [["task-1"], ["task-2", "task-3"], ["task-4"]]
}

The executionOrder array shows which tasks can run in parallel (same inner array).
Respond only with valid JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    return {
      originalTask: taskDescription,
      analysis,
      tasks: [],
      executionOrder: [],
      estimatedTimeMinutes: 0,
    };
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const totalSteps = (parsed.tasks || []).reduce(
        (sum: number, t: Task) => sum + (t.estimatedSteps || 10),
        0
      );

      return {
        originalTask: taskDescription,
        analysis,
        tasks: parsed.tasks || [],
        executionOrder: parsed.executionOrder || [],
        estimatedTimeMinutes: totalSteps * 3, // 3 min per step with agent
      };
    }
  } catch {
    // Return empty result on parse failure
  }

  return {
    originalTask: taskDescription,
    analysis,
    tasks: [],
    executionOrder: [],
    estimatedTimeMinutes: 0,
  };
}

// Format decomposition as a task list
export function formatAsTaskList(result: DecompositionResult): string {
  let output = `# Task Decomposition\n\n`;
  output += `## Original Task\n${result.originalTask}\n\n`;

  output += `## Analysis\n`;
  output += `- Size: ${result.analysis.size}\n`;
  output += `- Estimated Steps: ${result.analysis.estimatedSteps}\n`;
  output += `- Estimated Time: ${result.estimatedTimeMinutes} minutes\n\n`;

  if (result.analysis.warnings.length > 0) {
    output += `### Warnings\n`;
    for (const warning of result.analysis.warnings) {
      output += `- ${warning}\n`;
    }
    output += `\n`;
  }

  output += `## Decomposed Tasks\n\n`;

  for (const task of result.tasks) {
    const complexity =
      task.complexity === "complex"
        ? "[COMPLEX]"
        : task.complexity === "simple"
          ? "[SIMPLE]"
          : "[MEDIUM]";

    output += `### ${task.id}: ${task.title} ${complexity}\n`;
    output += `${task.description}\n`;
    output += `- Steps: ${task.estimatedSteps}\n`;
    output += `- Parallelizable: ${task.parallelizable ? "Yes" : "No"}\n`;
    if (task.dependencies.length > 0) {
      output += `- Depends on: ${task.dependencies.join(", ")}\n`;
    }
    output += `\n`;
  }

  output += `## Execution Order\n\n`;
  for (let i = 0; i < result.executionOrder.length; i++) {
    const phase = result.executionOrder[i];
    if (!phase) continue;
    const parallel = phase.length > 1 ? " (parallel)" : "";
    output += `Phase ${i + 1}${parallel}: ${phase.join(", ")}\n`;
  }

  return output;
}

// Example bad vs good decomposition
export const DECOMPOSITION_EXAMPLES = {
  bad: {
    description:
      "Refactor the entire API from Express to Fastify, migrate all routes, update tests, deploy to staging, run smoke tests, and monitor for 30 minutes",
    analysis: {
      size: "too-large" as TaskSize,
      estimatedSteps: 75,
      warnings: [
        'Contains "entire" - suggests large scope',
        'Contains "all" - suggests large scope',
        "Multiple actions (6) - consider splitting",
      ],
      suggestions: [
        "Break into 3-8 smaller tasks with clear boundaries",
        "Each subtask should be independently testable",
      ],
      canParallelize: false,
    },
  },
  good: [
    {
      id: "task-1",
      title: "Set up Fastify app structure with middleware config",
      description:
        "Create new Fastify app, configure middleware (cors, json, auth)",
      estimatedSteps: 8,
      dependencies: [],
      parallelizable: false,
      complexity: "simple" as const,
    },
    {
      id: "task-2",
      title: "Migrate routes /auth/* to Fastify (5 routes)",
      description: "Migrate login, logout, register, refresh, verify endpoints",
      estimatedSteps: 12,
      dependencies: ["task-1"],
      parallelizable: true,
      complexity: "medium" as const,
    },
    {
      id: "task-3",
      title: "Run tests, fix failures",
      description: "Run test suite, fix any failures in auth routes",
      estimatedSteps: 6,
      dependencies: ["task-2"],
      parallelizable: false,
      complexity: "simple" as const,
    },
    {
      id: "task-4",
      title: "Migrate routes /api/* (8 routes)",
      description: "Migrate users, posts, comments, likes endpoints",
      estimatedSteps: 16,
      dependencies: ["task-1"],
      parallelizable: true,
      complexity: "medium" as const,
    },
    {
      id: "task-5",
      title: "Migrate routes /admin/* (3 routes)",
      description: "Migrate admin dashboard, settings, logs endpoints",
      estimatedSteps: 8,
      dependencies: ["task-1"],
      parallelizable: true,
      complexity: "simple" as const,
    },
    {
      id: "task-6",
      title: "Run full test suite",
      description: "Run all tests, ensure 100% pass rate",
      estimatedSteps: 4,
      dependencies: ["task-3", "task-4", "task-5"],
      parallelizable: false,
      complexity: "simple" as const,
    },
    {
      id: "task-7",
      title: "Deploy to staging and run smoke tests",
      description: "Deploy to staging, run health check and basic smoke tests",
      estimatedSteps: 8,
      dependencies: ["task-6"],
      parallelizable: false,
      complexity: "simple" as const,
    },
    {
      id: "task-8",
      title: "Monitor metrics for 30 minutes",
      description: "Watch error rates, latency, and memory usage",
      estimatedSteps: 3,
      dependencies: ["task-7"],
      parallelizable: false,
      complexity: "simple" as const,
    },
  ],
};

// Demo function
async function demo() {
  console.log("=== Task Decomposer Demo ===\n");

  // Show sizing guidelines
  console.log("--- Task Sizing Guidelines ---\n");
  console.log("TOO SMALL (< 3 steps):");
  console.log(`  ${TASK_SIZING_GUIDELINES.tooSmall.description}`);
  console.log(`  Examples: ${TASK_SIZING_GUIDELINES.tooSmall.examples.join("; ")}`);
  console.log(`  Action: ${TASK_SIZING_GUIDELINES.tooSmall.recommendation}\n`);

  console.log("OPTIMAL (3-20 steps):");
  console.log(`  ${TASK_SIZING_GUIDELINES.optimal.description}`);
  console.log(`  Examples: ${TASK_SIZING_GUIDELINES.optimal.examples.join("; ")}`);
  console.log(`  Action: ${TASK_SIZING_GUIDELINES.optimal.recommendation}\n`);

  console.log("TOO LARGE (> 20 steps):");
  console.log(`  ${TASK_SIZING_GUIDELINES.tooLarge.description}`);
  console.log(`  Examples: ${TASK_SIZING_GUIDELINES.tooLarge.examples.join("; ")}`);
  console.log(`  Action: ${TASK_SIZING_GUIDELINES.tooLarge.recommendation}\n`);

  // Analyze the bad example
  console.log("--- Bad Task Analysis ---\n");
  console.log(`Task: "${DECOMPOSITION_EXAMPLES.bad.description}"\n`);

  const analysis = estimateTaskSize(DECOMPOSITION_EXAMPLES.bad.description);
  console.log(`Size: ${analysis.size}`);
  console.log(`Estimated steps: ${analysis.estimatedSteps}`);
  console.log(`Warnings:`);
  for (const warning of analysis.warnings) {
    console.log(`  - ${warning}`);
  }
  console.log(`Suggestions:`);
  for (const suggestion of analysis.suggestions) {
    console.log(`  - ${suggestion}`);
  }

  // Show good decomposition
  console.log("\n--- Good Decomposition ---\n");
  const result: DecompositionResult = {
    originalTask: DECOMPOSITION_EXAMPLES.bad.description,
    analysis: DECOMPOSITION_EXAMPLES.bad.analysis,
    tasks: DECOMPOSITION_EXAMPLES.good,
    executionOrder: [
      ["task-1"],
      ["task-2", "task-4", "task-5"],
      ["task-3"],
      ["task-6"],
      ["task-7"],
      ["task-8"],
    ],
    estimatedTimeMinutes: DECOMPOSITION_EXAMPLES.good.reduce(
      (sum, t) => sum + t.estimatedSteps * 3,
      0
    ),
  };

  console.log(formatAsTaskList(result));

  // Compare
  console.log("--- Comparison ---\n");
  console.log("Bad (monolithic): ~75 steps, high failure probability");
  console.log(
    `Good (decomposed): ${result.tasks.length} tasks, ~${result.estimatedTimeMinutes} min total`
  );
  console.log(
    "Parallelizable phases: 2, 4, 5 can run simultaneously"
  );
  console.log("Result: Tasks 2, 4, 5 run in parallel, saving time");
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}

export type { Task, TaskSize, TaskAnalysis, DecompositionResult };
