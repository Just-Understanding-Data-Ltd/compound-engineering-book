/**
 * Chapter 11: Actor-Critic Adversarial Coding
 *
 * Demonstrates the iterative refinement pattern where an actor generates code
 * and a critic reviews it across 8 dimensions. Each round catches more issues,
 * producing production-ready code before human review.
 *
 * Uses the Claude Agent SDK for building production actor-critic systems.
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

// Critique dimensions with their checklists
export interface CritiqueDimension {
  name: string;
  items: string[];
}

export const CRITIQUE_DIMENSIONS: CritiqueDimension[] = [
  {
    name: "Security",
    items: [
      "Input validation on all user data",
      "SQL injection prevention (parameterized queries)",
      "XSS prevention (output escaping)",
      "CSRF tokens for state-changing operations",
      "Rate limiting on sensitive endpoints",
      "No hardcoded secrets",
      "Password hashing (bcrypt, argon2)",
      "Token expiration configured",
      "Refresh token rotation",
      "Audit logging for sensitive operations",
    ],
  },
  {
    name: "Architecture",
    items: [
      "Layer separation (route/handler/service)",
      "Services use repositories, not direct DB",
      "No business logic in controllers",
      "Dependencies flow inward",
      "Domain entities are pure",
      "Interfaces for external dependencies",
      "Single Responsibility Principle",
    ],
  },
  {
    name: "Performance",
    items: [
      "No N+1 queries",
      "Database indexes on queried columns",
      "Caching for frequently accessed data",
      "Pagination for large result sets",
      "Async operations for I/O",
      "Connection pooling",
      "Lazy loading where appropriate",
    ],
  },
  {
    name: "Testing",
    items: [
      "Happy path covered",
      "Edge cases tested (null, empty, boundaries)",
      "Error scenarios tested",
      "Integration tests for critical paths",
      "Coverage > 80%",
      "Deterministic (no flaky tests)",
      "External dependencies mocked",
    ],
  },
  {
    name: "Error Handling",
    items: [
      "No swallowed exceptions",
      "Errors include context",
      "User-facing errors are actionable",
      "Internal errors logged with stack traces",
      "Graceful degradation",
      "Recovery mechanisms where possible",
      "No throws in Result-returning functions",
    ],
  },
  {
    name: "Documentation",
    items: [
      "JSDoc/TSDoc on public functions",
      "Inline comments for complex logic",
      "README updated",
      "API documentation updated",
      "Migration guide for breaking changes",
      "Examples provided",
    ],
  },
  {
    name: "Accessibility",
    items: [
      "Semantic HTML",
      "ARIA labels",
      "Keyboard navigation",
      "Screen reader friendly",
      "Color contrast (WCAG AA)",
      "Visible focus indicators",
      "Form validation errors announced",
    ],
  },
  {
    name: "Code Quality",
    items: [
      "No duplication (DRY)",
      "Functions < 50 lines",
      "Descriptive variable names",
      "No magic numbers",
      "Consistent naming conventions",
      "No commented-out code",
      "Organized imports",
    ],
  },
];

// Issue found by critic
export interface CritiqueIssue {
  dimension: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  suggestion?: string;
}

// Result of a critique round
export interface CritiqueResult {
  round: number;
  issues: CritiqueIssue[];
  approved: boolean;
  summary: string;
}

// Full actor-critic session
export interface ActorCriticSession {
  task: string;
  rounds: Array<{
    round: number;
    actorOutput: string;
    criticResult: CritiqueResult;
  }>;
  finalApproved: boolean;
  totalIssuesFound: number;
  totalIssuesFixed: number;
}

/**
 * Actor-Critic Loop implementation using Agent SDK
 */
export class ActorCriticLoop {
  private model: string;
  private maxRounds: number;

  constructor(model: string, maxRounds: number = 5) {
    this.model = model;
    this.maxRounds = maxRounds;
  }

  /**
   * Generate code (actor role) using Agent SDK
   */
  private async actorGenerate(
    task: string,
    previousFeedback?: string
  ): Promise<string> {
    const systemPrompt = `You are a code generator (Actor role).
Generate high-quality TypeScript code that follows best practices.
${previousFeedback ? "Address the following feedback from the previous review:" : ""}
${previousFeedback || ""}

Focus on correctness, security, and maintainability.
Provide complete, runnable code.`;

    // Use Agent SDK query() with streaming
    const response = query({
      prompt: task,
      options: {
        model: this.model,
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

    return output;
  }

  /**
   * Review code (critic role) using Agent SDK
   */
  private async criticReview(
    code: string,
    round: number
  ): Promise<CritiqueResult> {
    const dimensionsList = CRITIQUE_DIMENSIONS.map(
      (d) => `${d.name}:\n${d.items.map((i) => `  - ${i}`).join("\n")}`
    ).join("\n\n");

    const systemPrompt = `You are a code reviewer (Critic role) with READ-ONLY access.
Review the code across these 8 dimensions:

${dimensionsList}

For each issue found, specify:
- Dimension (Security, Architecture, Performance, etc.)
- Severity (critical, high, medium, low)
- Description of the issue
- Location in code (if applicable)
- Suggestion for fix

Be thorough but fair. Only report real issues, not style preferences.
At the end, determine if the code is APPROVED or NEEDS_REVISION.`;

    // Use Agent SDK query() with streaming
    const response = query({
      prompt: `Review this code:\n\n${code}`,
      options: {
        model: this.model,
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

    return this.parseCritiqueResponse(output, round);
  }

  /**
   * Parse critic response into structured format
   */
  private parseCritiqueResponse(output: string, round: number): CritiqueResult {
    const issues: CritiqueIssue[] = [];

    // Look for issues by severity
    const severities: Array<"critical" | "high" | "medium" | "low"> = [
      "critical",
      "high",
      "medium",
      "low",
    ];

    for (const severity of severities) {
      const regex = new RegExp(
        `${severity}[:\\s]+([^\\n]+)`,
        "gi"
      );
      const matches = output.matchAll(regex);
      for (const match of matches) {
        // Try to extract dimension from context
        let dimension = "Code Quality";
        for (const dim of CRITIQUE_DIMENSIONS) {
          if (output.toLowerCase().includes(dim.name.toLowerCase())) {
            dimension = dim.name;
            break;
          }
        }

        const description = match[1]?.trim() ?? "";
        if (description) {
          issues.push({
            dimension,
            severity,
            description,
          });
        }
      }
    }

    // Check if approved
    const approved =
      output.toLowerCase().includes("approved") &&
      !output.toLowerCase().includes("not approved") &&
      !output.toLowerCase().includes("needs_revision") &&
      issues.filter((i) => i.severity === "critical" || i.severity === "high")
        .length === 0;

    return {
      round,
      issues,
      approved,
      summary: `Round ${round}: ${issues.length} issues found. ${approved ? "APPROVED" : "NEEDS_REVISION"}`,
    };
  }

  /**
   * Run the full actor-critic loop
   */
  async run(task: string): Promise<ActorCriticSession> {
    const rounds: ActorCriticSession["rounds"] = [];
    let totalIssuesFound = 0;
    let previousFeedback = "";

    for (let round = 1; round <= this.maxRounds; round++) {
      // Actor generates/refactors code
      const actorOutput = await this.actorGenerate(task, previousFeedback);

      // Critic reviews code
      const criticResult = await this.criticReview(actorOutput, round);
      totalIssuesFound += criticResult.issues.length;

      rounds.push({ round, actorOutput, criticResult });

      // Check if approved
      if (criticResult.approved) {
        return {
          task,
          rounds,
          finalApproved: true,
          totalIssuesFound,
          totalIssuesFixed: totalIssuesFound - criticResult.issues.length,
        };
      }

      // Prepare feedback for next actor round
      previousFeedback = criticResult.issues
        .map((i) => `[${i.severity.toUpperCase()}] ${i.dimension}: ${i.description}`)
        .join("\n");
    }

    // Max rounds reached without approval
    const lastRound = rounds[rounds.length - 1];
    return {
      task,
      rounds,
      finalApproved: false,
      totalIssuesFound,
      totalIssuesFixed:
        totalIssuesFound - (lastRound?.criticResult.issues.length || 0),
    };
  }

  /**
   * Get critique dimensions for reference
   */
  static getDimensions(): CritiqueDimension[] {
    return CRITIQUE_DIMENSIONS;
  }
}

/**
 * Quick critique without full loop (for simple reviews) using Agent SDK
 */
export async function quickCritique(
  code: string,
  dimensions?: string[],
  model: string = "claude-sonnet-4-5-20250929"
): Promise<CritiqueIssue[]> {
  const selectedDimensions = dimensions
    ? CRITIQUE_DIMENSIONS.filter((d) => dimensions.includes(d.name))
    : CRITIQUE_DIMENSIONS;

  const dimensionsList = selectedDimensions
    .map((d) => `${d.name}: ${d.items.join(", ")}`)
    .join("\n");

  // Use Agent SDK query() with streaming
  const response = query({
    prompt: `Review this code for issues in: ${dimensionsList}\n\nCode:\n${code}`,
    options: {
      model,
      maxTurns: 1,
      allowedTools: [],
    },
  });

  // Collect streaming response
  let output = "";
  for await (const message of response) {
    output += extractTextContent(message);
  }

  // Parse issues from response
  const issues: CritiqueIssue[] = [];
  const issuePattern = /(?:issue|problem|vulnerability|bug):\s*([^\n]+)/gi;
  const matches = output.matchAll(issuePattern);

  for (const match of matches) {
    const description = match[1]?.trim() ?? "";
    if (description) {
      issues.push({
        dimension: "Code Quality",
        severity: "medium",
        description,
      });
    }
  }

  return issues;
}

// Demo: Show actor-critic loop in action
async function demo() {
  console.log("Actor-Critic Loop Demo\n");
  console.log("Critique Dimensions:");
  for (const dim of CRITIQUE_DIMENSIONS) {
    console.log(`  - ${dim.name} (${dim.items.length} items)`);
  }

  console.log("\nStarting actor-critic loop for JWT authentication...\n");

  const loop = new ActorCriticLoop("claude-sonnet-4-5-20250929", 3);

  const result = await loop.run(
    "Implement a JWT authentication function that validates email/password and returns a token"
  );

  console.log(`\nSession Summary:`);
  console.log(`  Rounds: ${result.rounds.length}`);
  console.log(`  Total issues found: ${result.totalIssuesFound}`);
  console.log(`  Issues fixed: ${result.totalIssuesFixed}`);
  console.log(`  Final status: ${result.finalApproved ? "APPROVED" : "NEEDS_REVISION"}`);

  // Show progression
  console.log("\nProgression:");
  for (const round of result.rounds) {
    console.log(
      `  Round ${round.round}: ${round.criticResult.issues.length} issues`
    );
  }
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
