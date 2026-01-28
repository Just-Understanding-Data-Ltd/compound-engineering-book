/**
 * Chapter 11: Sub-Agent Orchestration
 *
 * Demonstrates the core sub-agent architecture pattern: an orchestrator
 * that delegates work to specialized agents and aggregates results.
 *
 * Uses the Claude Agent SDK for building production sub-agent systems.
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

// Agent role definitions
export type AgentRole =
  | "backend-engineer"
  | "frontend-engineer"
  | "qa-engineer"
  | "code-reviewer";

export interface AgentTask {
  role: AgentRole;
  task: string;
  context: string;
  dependencies?: string[];
}

export interface AgentResult {
  role: AgentRole;
  status: "success" | "failure" | "needs-review";
  output: string;
  issues?: Array<{
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    location?: string;
  }>;
  handoffData?: Record<string, unknown>;
}

export interface OrchestratorConfig {
  model: string;
  maxTokens: number;
  workingDirectory?: string;
}

// System prompts for each agent role
const AGENT_PROMPTS: Record<AgentRole, string> = {
  "backend-engineer": `You are a Backend Engineer specializing in Node.js/TypeScript APIs.

Your focus areas:
- API endpoint design and implementation
- Database schemas and queries
- Business logic and validation
- Error handling with Result pattern

When implementing an endpoint:
1. Understand requirements (inputs, outputs, business rules)
2. Design endpoint (HTTP method, URL, request/response schemas)
3. Implement layers (route, handler, service)
4. Return structured handoff data for QA

You do NOT:
- Write frontend code
- Write tests (QA Engineer's job)
- Review your own code`,

  "frontend-engineer": `You are a Frontend Engineer specializing in React/TypeScript.

Your focus areas:
- UI components with proper state management
- Design system compliance
- Accessibility (WCAG AA)
- Error handling and loading states

When implementing a component:
1. Check existing component patterns
2. Review design system tokens
3. Implement with proper TypeScript types
4. Add error handling and loading states

You do NOT:
- Write backend code
- Write tests (QA Engineer's job)
- Review your own code`,

  "qa-engineer": `You are a QA Engineer specializing in TypeScript testing.

Your focus areas:
- Comprehensive test coverage (>80%)
- Happy path, edge cases, error scenarios
- Integration tests for critical paths
- Deterministic, non-flaky tests

When writing tests:
1. Understand the feature from handoff data
2. Write happy path tests first
3. Add edge case tests
4. Test error scenarios
5. Report coverage metrics

You do NOT:
- Implement features
- Review code quality`,

  "code-reviewer": `You are a Code Reviewer with READ-ONLY access.

Your focus areas (8 dimensions):
1. Security (OWASP Top 10, input validation, auth)
2. Architecture (layer separation, dependency rules)
3. Performance (N+1 queries, caching, async)
4. Testing (coverage, edge cases, determinism)
5. Error Handling (no swallowed exceptions, context)
6. Documentation (JSDoc, inline comments)
7. Accessibility (if UI code)
8. Code Quality (DRY, naming, no magic numbers)

You CANNOT edit files. You can only identify issues.
Report findings with severity and specific locations.`,
};

/**
 * Run a single specialized agent using Agent SDK
 */
export async function runAgent(
  config: OrchestratorConfig,
  task: AgentTask,
  handoffData?: Record<string, unknown>
): Promise<AgentResult> {
  const systemPrompt = AGENT_PROMPTS[task.role];

  const userPrompt = `
Task: ${task.task}

Context:
${task.context}

${
  handoffData
    ? `
Handoff Data from Previous Agent:
${JSON.stringify(handoffData, null, 2)}
`
    : ""
}

Provide your output in a structured format with:
1. Summary of work completed
2. Any issues found (if reviewer) or edge cases to test (if implementing)
3. Handoff data for the next agent
`;

  // Use Agent SDK query() with streaming
  const response = query({
    prompt: userPrompt,
    options: {
      model: config.model,
      systemPrompt,
      maxTurns: 1,
      allowedTools: [],
    },
  });

  // Collect streaming response
  let output = "";
  for await (const message of response) {
    output += extractTextContent(message);
  }

  // Parse the response to extract structured data
  return parseAgentResponse(task.role, output);
}

/**
 * Parse agent response into structured result
 */
function parseAgentResponse(role: AgentRole, output: string): AgentResult {
  // Check for common issue patterns in reviewer output
  const issues: AgentResult["issues"] = [];

  if (role === "code-reviewer") {
    // Look for severity markers
    const criticalMatch = output.match(/critical:?\s*([^\n]+)/gi);
    const highMatch = output.match(/high:?\s*([^\n]+)/gi);
    const mediumMatch = output.match(/medium:?\s*([^\n]+)/gi);
    const lowMatch = output.match(/low:?\s*([^\n]+)/gi);

    criticalMatch?.forEach((m) =>
      issues.push({ severity: "critical", description: m })
    );
    highMatch?.forEach((m) =>
      issues.push({ severity: "high", description: m })
    );
    mediumMatch?.forEach((m) =>
      issues.push({ severity: "medium", description: m })
    );
    lowMatch?.forEach((m) => issues.push({ severity: "low", description: m }));
  }

  // Determine status based on issues
  let status: AgentResult["status"] = "success";
  if (issues.some((i) => i.severity === "critical")) {
    status = "failure";
  } else if (issues.length > 0) {
    status = "needs-review";
  }

  return {
    role,
    status,
    output,
    issues: issues.length > 0 ? issues : undefined,
  };
}

/**
 * Orchestrator: Coordinates work across specialized agents
 */
export class SubAgentOrchestrator {
  private config: OrchestratorConfig;
  private results: Map<AgentRole, AgentResult> = new Map();

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Execute a feature implementation with all sub-agents
   */
  async executeFeature(
    featureDescription: string,
    projectContext: string
  ): Promise<{
    success: boolean;
    results: AgentResult[];
    summary: string;
  }> {
    // Step 1: Backend Engineer
    const backendResult = await runAgent(this.config, {
      role: "backend-engineer",
      task: `Implement backend for: ${featureDescription}`,
      context: projectContext,
    });
    this.results.set("backend-engineer", backendResult);

    // Step 2: Frontend Engineer (can run in parallel with backend if independent)
    const frontendResult = await runAgent(
      this.config,
      {
        role: "frontend-engineer",
        task: `Implement frontend for: ${featureDescription}`,
        context: projectContext,
      },
      backendResult.handoffData
    );
    this.results.set("frontend-engineer", frontendResult);

    // Step 3: QA Engineer (depends on both backend and frontend)
    const qaResult = await runAgent(
      this.config,
      {
        role: "qa-engineer",
        task: `Write comprehensive tests for: ${featureDescription}`,
        context: projectContext,
      },
      {
        backend: backendResult.handoffData,
        frontend: frontendResult.handoffData,
      }
    );
    this.results.set("qa-engineer", qaResult);

    // Step 4: Code Reviewer (reviews all work)
    const reviewResult = await runAgent(
      this.config,
      {
        role: "code-reviewer",
        task: `Review all code for: ${featureDescription}`,
        context: projectContext,
      },
      {
        backend: backendResult.output,
        frontend: frontendResult.output,
        tests: qaResult.output,
      }
    );
    this.results.set("code-reviewer", reviewResult);

    // Aggregate results
    const allResults = Array.from(this.results.values());
    const hasCritical = allResults.some(
      (r) => r.issues?.some((i) => i.severity === "critical")
    );

    return {
      success: !hasCritical,
      results: allResults,
      summary: this.generateSummary(allResults),
    };
  }

  /**
   * Execute agents in parallel where possible
   */
  async executeParallel(
    tasks: AgentTask[]
  ): Promise<Map<AgentRole, AgentResult>> {
    const results = await Promise.all(
      tasks.map((task) => runAgent(this.config, task))
    );

    results.forEach((result) => this.results.set(result.role, result));
    return this.results;
  }

  private generateSummary(results: AgentResult[]): string {
    const lines = ["# Feature Implementation Summary", ""];

    for (const result of results) {
      lines.push(`## ${result.role}`);
      lines.push(`Status: ${result.status}`);

      if (result.issues && result.issues.length > 0) {
        lines.push("Issues:");
        result.issues.forEach((issue) => {
          lines.push(`  - [${issue.severity.toUpperCase()}] ${issue.description}`);
        });
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}

// Demo: Show orchestration flow
async function demo() {
  const orchestrator = new SubAgentOrchestrator({
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 4096,
  });

  console.log("Starting sub-agent orchestration for payment feature...\n");

  const result = await orchestrator.executeFeature(
    "Stripe payment processing with amount, currency, and payment method",
    `
Project: E-commerce platform
Stack: Node.js, Express, React, TypeScript
Patterns: Result pattern for errors, Zod for validation
    `
  );

  console.log(result.summary);
  console.log(`\nOverall success: ${result.success}`);
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
