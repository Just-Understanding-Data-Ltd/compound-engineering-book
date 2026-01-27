/**
 * Script Capture Pattern - Converting Ad-Hoc Flows to Deterministic Scripts
 *
 * If you run the same agent flow repeatedly, convert it to a script.
 * Deterministic beats probabilistic for known workflows.
 *
 * Benefits:
 * - Fast, predictable execution (no LLM thinking time)
 * - Same behavior every time
 * - Zero token cost per run
 * - Cannot deviate or get confused
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Represents a step in an ad-hoc workflow
interface WorkflowStep {
  id: string;
  description: string;
  command?: string;
  condition?: string;
  onSuccess?: string;
  onFailure?: string;
}

// Captured workflow ready for scripting
interface CapturedWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  parameters: string[];
  estimatedTime: {
    adHoc: number; // seconds with LLM
    scripted: number; // seconds without LLM
  };
}

// Comparison metrics between ad-hoc and scripted approaches
interface WorkflowComparison {
  adHoc: {
    averageTime: number;
    tokenCost: number;
    variability: "high" | "medium" | "low";
  };
  scripted: {
    averageTime: number;
    tokenCost: number;
    variability: "none";
  };
  savings: {
    timePercent: number;
    tokenCost: number;
  };
}

/**
 * Detects if a prompt pattern has been repeated enough to warrant scripting.
 * Rule: 3+ repetitions = candidate for scripting.
 */
export function shouldConvertToScript(promptHistory: string[]): {
  shouldConvert: boolean;
  candidates: { pattern: string; count: number; similarity: number }[];
} {
  // Simple pattern detection: look for similar prompts
  const patterns = new Map<string, { count: number; examples: string[] }>();

  for (const prompt of promptHistory) {
    // Normalize prompt for comparison
    const normalized = normalizePrompt(prompt);

    let found = false;
    for (const [pattern, data] of patterns) {
      const similarity = calculateSimilarity(normalized, pattern);
      if (similarity > 0.7) {
        data.count++;
        data.examples.push(prompt);
        found = true;
        break;
      }
    }

    if (!found) {
      patterns.set(normalized, { count: 1, examples: [prompt] });
    }
  }

  const candidates = Array.from(patterns.entries())
    .filter(([_, data]) => data.count >= 3 && data.examples.length > 0)
    .map(([_pattern, data]) => ({
      pattern: data.examples[0] as string, // Use first example as representative
      count: data.count,
      similarity: 1.0,
    }));

  return {
    shouldConvert: candidates.length > 0,
    candidates,
  };
}

/**
 * Normalizes a prompt for pattern matching.
 */
function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\d+/g, "N") // Replace numbers
    .replace(/["'][^"']*["']/g, "STRING") // Replace strings
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple similarity calculation (Jaccard index on words).
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(" "));
  const wordsB = new Set(b.split(" "));

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Analyzes an ad-hoc workflow and extracts it into a scriptable format.
 */
export async function captureWorkflow(workflowDescription: string): Promise<CapturedWorkflow> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze this ad-hoc workflow and extract it into scriptable steps:

${workflowDescription}

Output as JSON:
{
  "name": "workflow-name",
  "description": "what this workflow does",
  "steps": [
    {
      "id": "step1",
      "description": "what this step does",
      "command": "shell command if applicable",
      "condition": "when to run this step (optional)",
      "onSuccess": "what to do on success",
      "onFailure": "what to do on failure"
    }
  ],
  "parameters": ["param1", "param2"],
  "estimatedTime": {
    "adHoc": 45,
    "scripted": 5
  }
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

  return JSON.parse(jsonText.trim()) as CapturedWorkflow;
}

/**
 * Generates a bash script from a captured workflow.
 */
export function generateBashScript(workflow: CapturedWorkflow): string {
  const lines: string[] = [
    "#!/bin/bash",
    `# ${workflow.name}`,
    `# ${workflow.description}`,
    "",
    "set -e  # Exit on error",
    "",
  ];

  // Add parameter handling
  if (workflow.parameters.length > 0) {
    lines.push("# Parameters");
    workflow.parameters.forEach((param, index) => {
      lines.push(`${param.toUpperCase()}=\${${index + 1}:-""}`);
    });
    lines.push("");
  }

  // Add steps
  workflow.steps.forEach((step, index) => {
    lines.push(`# Step ${index + 1}: ${step.description}`);

    if (step.condition) {
      lines.push(`if ${step.condition}; then`);
    }

    if (step.command) {
      lines.push(`echo "Running: ${step.description}..."`);
      lines.push(step.command);
    }

    if (step.onSuccess && step.onFailure) {
      lines.push(`if [ $? -eq 0 ]; then`);
      lines.push(`    echo "${step.onSuccess}"`);
      lines.push(`else`);
      lines.push(`    echo "${step.onFailure}"`);
      lines.push(`    exit 1`);
      lines.push(`fi`);
    }

    if (step.condition) {
      lines.push("fi");
    }

    lines.push("");
  });

  lines.push('echo "Workflow completed successfully"');

  return lines.join("\n");
}

/**
 * Generates a TypeScript script from a captured workflow.
 */
export function generateTypeScriptScript(workflow: CapturedWorkflow): string {
  const lines: string[] = [
    "/**",
    ` * ${workflow.name}`,
    ` * ${workflow.description}`,
    " */",
    "",
    'import { execSync } from "child_process";',
    "",
    "interface WorkflowResult {",
    "  success: boolean;",
    "  steps: { name: string; success: boolean; output?: string; error?: string }[];",
    "}",
    "",
    "function runStep(name: string, command: string): { success: boolean; output?: string; error?: string } {",
    '  console.log(`Running: ${name}...`);',
    "  try {",
    '    const output = execSync(command, { encoding: "utf-8" });',
    "    return { success: true, output };",
    "  } catch (err) {",
    "    return { success: false, error: String(err) };",
    "  }",
    "}",
    "",
  ];

  // Generate main function
  lines.push(`export async function run${toPascalCase(workflow.name)}(`);
  if (workflow.parameters.length > 0) {
    const params = workflow.parameters.map((p) => `${toCamelCase(p)}: string`).join(", ");
    lines.push(`  ${params}`);
  }
  lines.push("): Promise<WorkflowResult> {");
  lines.push("  const results: WorkflowResult = { success: true, steps: [] };");
  lines.push("");

  // Add steps
  workflow.steps.forEach((step) => {
    lines.push(`  // ${step.description}`);
    if (step.command) {
      lines.push(`  const ${toCamelCase(step.id)} = runStep("${step.description}", \`${step.command}\`);`);
      lines.push(`  results.steps.push({ name: "${step.description}", ...${toCamelCase(step.id)} });`);
      lines.push(`  if (!${toCamelCase(step.id)}.success) {`);
      lines.push("    results.success = false;");
      lines.push("    return results;");
      lines.push("  }");
    }
    lines.push("");
  });

  lines.push("  return results;");
  lines.push("}");
  lines.push("");

  // Add main execution
  lines.push("// Run if executed directly");
  lines.push('if (import.meta.url === `file://${process.argv[1]}`) {');
  if (workflow.parameters.length > 0) {
    lines.push(`  const args = process.argv.slice(2);`);
    lines.push(`  if (args.length < ${workflow.parameters.length}) {`);
    lines.push(`    console.error("Usage: script ${workflow.parameters.join(" ")}");`);
    lines.push("    process.exit(1);");
    lines.push("  }");
    const argsList = workflow.parameters.map((_, i) => `args[${i}]`).join(", ");
    lines.push(`  run${toPascalCase(workflow.name)}(${argsList})`);
  } else {
    lines.push(`  run${toPascalCase(workflow.name)}()`);
  }
  lines.push("    .then((result) => {");
  lines.push('      console.log(result.success ? "Success" : "Failed");');
  lines.push("      process.exit(result.success ? 0 : 1);");
  lines.push("    })");
  lines.push("    .catch(console.error);");
  lines.push("}");

  return lines.join("\n");
}

/**
 * Generates a Claude Code slash command wrapper.
 */
export function generateSlashCommand(workflow: CapturedWorkflow, scriptPath: string): string {
  const lines: string[] = [
    `# ${workflow.name}`,
    "",
    workflow.description,
    "",
    "```bash",
    `./${scriptPath}`,
    "```",
    "",
    "Report the outcome.",
  ];

  return lines.join("\n");
}

/**
 * Compares ad-hoc vs scripted workflow performance.
 */
export function compareWorkflowApproaches(workflow: CapturedWorkflow, runsPerDay: number): WorkflowComparison {
  const adHocTime = workflow.estimatedTime.adHoc;
  const scriptedTime = workflow.estimatedTime.scripted;

  // Estimate token cost (rough: 1000 tokens per ad-hoc run)
  const tokensPerRun = 1000;
  const tokenCostPer1000 = 0.003; // Approximate Claude pricing

  return {
    adHoc: {
      averageTime: adHocTime,
      tokenCost: tokensPerRun * tokenCostPer1000 * runsPerDay,
      variability: "high",
    },
    scripted: {
      averageTime: scriptedTime,
      tokenCost: 0,
      variability: "none",
    },
    savings: {
      timePercent: ((adHocTime - scriptedTime) / adHocTime) * 100,
      tokenCost: tokensPerRun * tokenCostPer1000 * runsPerDay,
    },
  };
}

// Helper functions
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Example workflows for demonstration
export const EXAMPLE_WORKFLOWS: CapturedWorkflow[] = [
  {
    name: "deploy-staging",
    description: "Deploy application to staging environment",
    steps: [
      {
        id: "test",
        description: "Run test suite",
        command: "bun test",
        onSuccess: "Tests passed",
        onFailure: "Tests failed, aborting deploy",
      },
      {
        id: "build",
        description: "Build application",
        command: "bun build",
        onSuccess: "Build successful",
        onFailure: "Build failed",
      },
      {
        id: "deploy",
        description: "Deploy to staging",
        command: "gcloud run deploy staging --source . --quiet",
        onSuccess: "Deployed to staging",
        onFailure: "Deploy failed",
      },
      {
        id: "smoke",
        description: "Run smoke test",
        command: "curl -sf https://staging.example.com/health",
        onSuccess: "Staging is healthy",
        onFailure: "Health check failed",
      },
    ],
    parameters: [],
    estimatedTime: { adHoc: 45, scripted: 5 },
  },
  {
    name: "diagnose-build",
    description: "Gather build diagnostics and summarize issues",
    steps: [
      {
        id: "test",
        description: "Capture test output",
        command: "bun test 2>&1 > /tmp/test-output.txt || true",
        onSuccess: "Test output captured",
        onFailure: "Could not run tests",
      },
      {
        id: "typecheck",
        description: "Capture typecheck output",
        command: "bun run typecheck 2>&1 > /tmp/type-output.txt || true",
        onSuccess: "Typecheck output captured",
        onFailure: "Could not run typecheck",
      },
      {
        id: "lint",
        description: "Capture lint output",
        command: "biome check src/ 2>&1 > /tmp/lint-output.txt || true",
        onSuccess: "Lint output captured",
        onFailure: "Could not run lint",
      },
      {
        id: "summary",
        description: "Summarize findings",
        command: `echo "Test failures: $(grep -c FAIL /tmp/test-output.txt 2>/dev/null || echo 0)"`,
        onSuccess: "Summary generated",
        onFailure: "Could not generate summary",
      },
    ],
    parameters: [],
    estimatedTime: { adHoc: 60, scripted: 10 },
  },
];

// Demo: Show script conversion
function demo() {
  console.log("=== Script Capture Demo ===\n");

  // Show detection of repeated workflows
  const promptHistory = [
    "Run the tests, fix any failures, then lint",
    "Run tests, fix failures, run lint",
    "Execute tests, fix any issues, then lint the code",
    "Deploy to staging, run smoke tests, notify Slack",
    "Build and deploy to staging",
    "Something completely different",
  ];

  const detection = shouldConvertToScript(promptHistory);
  console.log("Repeated workflow detection:");
  console.log(`  Should convert: ${detection.shouldConvert}`);
  if (detection.candidates.length > 0) {
    console.log("  Candidates:");
    detection.candidates.forEach((c) => {
      console.log(`    - "${c.pattern.substring(0, 50)}..." (${c.count} times)`);
    });
  }

  console.log("\n=== Example: Deploy Staging Workflow ===");
  const workflow = EXAMPLE_WORKFLOWS[0]!;

  console.log("\nGenerated Bash Script:");
  console.log("---");
  console.log(generateBashScript(workflow));
  console.log("---");

  console.log("\nSlash Command (.claude/commands/deploy-staging.md):");
  console.log("---");
  console.log(generateSlashCommand(workflow, "scripts/deploy-staging.sh"));
  console.log("---");

  console.log("\n=== Performance Comparison ===");
  const comparison = compareWorkflowApproaches(workflow, 10);
  console.log(`Ad-hoc: ${comparison.adHoc.averageTime}s per run, $${comparison.adHoc.tokenCost.toFixed(3)}/day in tokens`);
  console.log(`Scripted: ${comparison.scripted.averageTime}s per run, $${comparison.scripted.tokenCost}/day in tokens`);
  console.log(`Savings: ${comparison.savings.timePercent.toFixed(0)}% time, $${comparison.savings.tokenCost.toFixed(3)}/day tokens`);
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}
