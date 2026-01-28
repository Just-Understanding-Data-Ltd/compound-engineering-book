/**
 * Chapter 14: Workflow Converter
 *
 * Demonstrates the pattern of converting repeated ad-hoc agent workflows
 * into deterministic scripts. Uses Claude to analyze workflow patterns
 * and generate optimal script implementations.
 *
 * Key concept: If you've done it 3+ times, make it a script.
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

// Workflow patterns that can be converted to scripts
interface WorkflowStep {
  command: string;
  description: string;
  requiresJudgment: boolean;
  estimatedSeconds: number;
}

interface AdHocWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  timesUsed: number;
  lastUsed: Date;
}

interface ConversionAnalysis {
  shouldConvert: boolean;
  reason: string;
  deterministic: WorkflowStep[];
  needsJudgment: WorkflowStep[];
  estimatedSavingsPerRun: number;
  paybackRunCount: number;
}

// Common workflow patterns worth converting
export const WORKFLOW_PATTERNS = {
  testCycle: {
    name: "Test Cycle",
    description: "Run tests, fix failures, lint",
    steps: [
      {
        command: "bun test",
        description: "Run test suite",
        requiresJudgment: false,
        estimatedSeconds: 30,
      },
      {
        command: "analyze failures",
        description: "Determine which failures to fix first",
        requiresJudgment: true,
        estimatedSeconds: 15,
      },
      {
        command: "biome check src/",
        description: "Run linter",
        requiresJudgment: false,
        estimatedSeconds: 5,
      },
    ],
    timesUsed: 5,
    lastUsed: new Date(),
  } as AdHocWorkflow,

  deployStaging: {
    name: "Deploy to Staging",
    description: "Build, deploy, smoke test",
    steps: [
      {
        command: "bun build",
        description: "Build the application",
        requiresJudgment: false,
        estimatedSeconds: 45,
      },
      {
        command: "gcloud run deploy staging",
        description: "Deploy to staging environment",
        requiresJudgment: false,
        estimatedSeconds: 60,
      },
      {
        command: "curl staging.example.com/health",
        description: "Run health check",
        requiresJudgment: false,
        estimatedSeconds: 5,
      },
      {
        command: "notify slack",
        description: "Send deployment notification",
        requiresJudgment: false,
        estimatedSeconds: 2,
      },
    ],
    timesUsed: 8,
    lastUsed: new Date(),
  } as AdHocWorkflow,

  diagnostics: {
    name: "Gather Diagnostics",
    description: "Collect test, type, and lint output for analysis",
    steps: [
      {
        command: "bun test 2>&1 > test-output.txt",
        description: "Capture test output",
        requiresJudgment: false,
        estimatedSeconds: 30,
      },
      {
        command: "tsc --noEmit 2>&1 > type-output.txt",
        description: "Capture type errors",
        requiresJudgment: false,
        estimatedSeconds: 10,
      },
      {
        command: "biome check src/ 2>&1 > lint-output.txt",
        description: "Capture lint issues",
        requiresJudgment: false,
        estimatedSeconds: 5,
      },
      {
        command: "summarize outputs",
        description: "Prioritize which issues to fix first",
        requiresJudgment: true,
        estimatedSeconds: 20,
      },
    ],
    timesUsed: 12,
    lastUsed: new Date(),
  } as AdHocWorkflow,
};

// Analyze whether a workflow should be converted
export function analyzeWorkflow(workflow: AdHocWorkflow): ConversionAnalysis {
  const deterministic = workflow.steps.filter((s) => !s.requiresJudgment);
  const needsJudgment = workflow.steps.filter((s) => s.requiresJudgment);

  // Calculate time savings
  const adHocSeconds =
    workflow.steps.reduce((sum, s) => sum + s.estimatedSeconds, 0) + 45; // 45s LLM reasoning
  const scriptSeconds = deterministic.reduce(
    (sum, s) => sum + s.estimatedSeconds,
    0
  );
  const savingsPerRun = adHocSeconds - scriptSeconds;

  // Estimate script creation time (30 min = 1800 seconds)
  const scriptCreationTime = 1800;
  const paybackRunCount = Math.ceil(scriptCreationTime / savingsPerRun);

  // Decision: convert if used 3+ times AND payback within reasonable runs
  const shouldConvert = workflow.timesUsed >= 3 && paybackRunCount < 50;

  let reason: string;
  if (workflow.timesUsed < 3) {
    reason = `Only used ${workflow.timesUsed} times. Wait until 3+ uses.`;
  } else if (paybackRunCount >= 50) {
    reason = `Payback requires ${paybackRunCount} runs. Savings too small.`;
  } else {
    reason = `Used ${workflow.timesUsed} times. Payback in ${paybackRunCount} runs. Convert now.`;
  }

  return {
    shouldConvert,
    reason,
    deterministic,
    needsJudgment,
    estimatedSavingsPerRun: savingsPerRun,
    paybackRunCount,
  };
}

// Generate a shell script from deterministic steps
export function generateScript(
  workflow: AdHocWorkflow,
  analysis: ConversionAnalysis
): string {
  const scriptName = workflow.name.toLowerCase().replace(/\s+/g, "-");

  let script = `#!/bin/bash
# scripts/${scriptName}.sh
# Generated from workflow: ${workflow.name}
# Description: ${workflow.description}
# Estimated savings: ${analysis.estimatedSavingsPerRun}s per run

set -e

`;

  for (const step of analysis.deterministic) {
    script += `echo "${step.description}..."\n`;
    script += `${step.command}\n\n`;
  }

  if (analysis.needsJudgment.length > 0) {
    script += `# The following steps require human/agent judgment:\n`;
    for (const step of analysis.needsJudgment) {
      script += `# - ${step.description}: ${step.command}\n`;
    }
    script += `\necho "Deterministic steps complete. Agent judgment needed for remaining steps."\n`;
  } else {
    script += `echo "All steps complete ✓"\n`;
  }

  return script;
}

// Generate a slash command wrapper
export function generateSlashCommand(workflow: AdHocWorkflow): string {
  const scriptName = workflow.name.toLowerCase().replace(/\s+/g, "-");

  return `# .claude/commands/${scriptName}.md
# ${workflow.name}

Run the ${workflow.name.toLowerCase()} script:

\`\`\`bash
./scripts/${scriptName}.sh
\`\`\`

Review the output and handle any judgment-required steps.
`;
}

// Use Claude to analyze workflow optimization opportunities
export async function analyzeWorkflowWithClaude(
  workflowDescription: string
): Promise<string> {
  const prompt = `Analyze this workflow for conversion to a deterministic script:

${workflowDescription}

Provide:
1. Which steps are deterministic (same every time)
2. Which steps require judgment (need agent reasoning)
3. Estimated time savings per run
4. Recommendation: convert now, wait, or keep ad-hoc

Format as a structured analysis.`;

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

  return textParts.join("") || "No analysis available";
}

// Calculate ROI for workflow conversion
export function calculateROI(
  workflow: AdHocWorkflow,
  analysis: ConversionAnalysis
): { weeklyHoursSaved: number; monthlyTokensSaved: number; breakEvenDays: number } {
  // Assume workflow is used 10x per week on average
  const weeklyUses = 10;
  const secondsSavedPerWeek = analysis.estimatedSavingsPerRun * weeklyUses;
  const weeklyHoursSaved = secondsSavedPerWeek / 3600;

  // Assume 500 tokens per ad-hoc run, 0 for script
  const tokensPerAdHocRun = 500;
  const monthlyTokensSaved = tokensPerAdHocRun * weeklyUses * 4;

  // Break-even calculation
  const scriptCreationHours = 0.5; // 30 minutes to create script
  const breakEvenDays = Math.ceil(
    (scriptCreationHours / weeklyHoursSaved) * 7
  );

  return {
    weeklyHoursSaved: Math.round(weeklyHoursSaved * 100) / 100,
    monthlyTokensSaved,
    breakEvenDays,
  };
}

// Demo function
async function demo() {
  console.log("=== Workflow Converter Demo ===\n");

  // Analyze each workflow pattern
  for (const [_key, workflow] of Object.entries(WORKFLOW_PATTERNS)) {
    console.log(`--- ${workflow.name} ---`);
    console.log(`Description: ${workflow.description}`);
    console.log(`Times used: ${workflow.timesUsed}`);

    const analysis = analyzeWorkflow(workflow);
    console.log(`\nAnalysis:`);
    console.log(`  Should convert: ${analysis.shouldConvert}`);
    console.log(`  Reason: ${analysis.reason}`);
    console.log(
      `  Deterministic steps: ${analysis.deterministic.length}/${workflow.steps.length}`
    );
    console.log(`  Savings per run: ${analysis.estimatedSavingsPerRun}s`);

    if (analysis.shouldConvert) {
      const roi = calculateROI(workflow, analysis);
      console.log(`\nROI Analysis:`);
      console.log(`  Weekly hours saved: ${roi.weeklyHoursSaved}h`);
      console.log(`  Monthly tokens saved: ${roi.monthlyTokensSaved}`);
      console.log(`  Break-even: ${roi.breakEvenDays} days`);

      console.log(`\n--- Generated Script ---`);
      console.log(generateScript(workflow, analysis));

      console.log(`--- Slash Command ---`);
      console.log(generateSlashCommand(workflow));
    }

    console.log("\n");
  }
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}

export type { AdHocWorkflow, WorkflowStep, ConversionAnalysis };
