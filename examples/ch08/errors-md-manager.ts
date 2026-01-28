/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates ERRORS.md management for persistent error memory.
 * LLMs are stateless - they don't remember previous conversations.
 * ERRORS.md provides persistent memory so mistakes don't repeat.
 *
 * Key concepts:
 * - Structured error documentation
 * - Frequency and severity tracking
 * - Prevention strategy encoding
 * - Monthly review process
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// ERRORS.MD TYPES AND INTERFACES
// ============================================================================

/**
 * Severity levels for documented errors
 */
export type ErrorSeverity = "critical" | "high" | "medium" | "low";

/**
 * Prevention strategy types
 */
export type PreventionType =
  | "eslint_rule"
  | "type_guard"
  | "pre_commit_hook"
  | "ci_check"
  | "claude_md_rule"
  | "test";

/**
 * A documented error entry in ERRORS.md
 */
export interface ErrorEntry {
  /** Unique identifier for the error */
  id: string;
  /** Short title for the error */
  title: string;
  /** Number of times this error has occurred */
  frequency: number;
  /** Severity level */
  severity: ErrorSeverity;
  /** Date of last occurrence */
  lastOccurrence: Date;
  /** Observable symptoms */
  symptoms: string[];
  /** Bad code pattern that causes the error */
  badPattern: string;
  /** Correct code that fixes the error */
  correctFix: string;
  /** Strategies to prevent this error */
  preventionStrategies: {
    type: PreventionType;
    description: string;
    implemented: boolean;
  }[];
  /** Related context tags */
  tags: string[];
}

/**
 * The complete ERRORS.md document structure
 */
export interface ErrorsDocument {
  /** Last update timestamp */
  lastUpdated: Date;
  /** Total number of documented errors */
  totalErrors: number;
  /** All error entries */
  entries: ErrorEntry[];
  /** Monthly review dates */
  reviewHistory: Date[];
}

/**
 * Monthly review report structure
 */
export interface MonthlyReview {
  /** Review date */
  date: Date;
  /** Top errors by frequency */
  topErrorsByFrequency: { id: string; title: string; frequency: number }[];
  /** New errors since last review */
  newErrors: number;
  /** Prevention strategies implemented */
  preventionImplemented: {
    errorId: string;
    strategy: PreventionType;
    impact: string;
  }[];
  /** Errors eliminated (no occurrences in 30 days) */
  eliminated: string[];
  /** Recommendations for next month */
  recommendations: string[];
}

// ============================================================================
// ERRORS.MD MANAGER
// ============================================================================

/**
 * Manages the ERRORS.md document
 */
export class ErrorsManager {
  private document: ErrorsDocument;

  constructor(existingDocument?: ErrorsDocument) {
    this.document = existingDocument || {
      lastUpdated: new Date(),
      totalErrors: 0,
      entries: [],
      reviewHistory: [],
    };
  }

  /**
   * Add a new error entry or update existing one
   */
  addError(entry: Omit<ErrorEntry, "id" | "frequency">): ErrorEntry {
    // Check if similar error already exists
    const existingIndex = this.document.entries.findIndex(
      (e) =>
        e.title.toLowerCase() === entry.title.toLowerCase() ||
        e.badPattern === entry.badPattern
    );

    if (existingIndex >= 0) {
      // Update existing entry
      const existing = this.document.entries[existingIndex]!;
      existing.frequency += 1;
      existing.lastOccurrence = entry.lastOccurrence;
      if (entry.symptoms.length > 0) {
        existing.symptoms = [
          ...new Set([...existing.symptoms, ...entry.symptoms]),
        ];
      }
      this.document.lastUpdated = new Date();
      return existing;
    }

    // Create new entry
    const newEntry: ErrorEntry = {
      ...entry,
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      frequency: 1,
    };

    this.document.entries.push(newEntry);
    this.document.totalErrors += 1;
    this.document.lastUpdated = new Date();
    return newEntry;
  }

  /**
   * Get errors sorted by frequency (for monthly review)
   */
  getTopErrors(limit = 10): ErrorEntry[] {
    return [...this.document.entries]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get high-frequency errors that need prevention
   */
  getErrorsNeedingPrevention(frequencyThreshold = 5): ErrorEntry[] {
    return this.document.entries.filter(
      (e) =>
        e.frequency >= frequencyThreshold &&
        !e.preventionStrategies.some((p) => p.implemented)
    );
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorEntry[] {
    return this.document.entries.filter((e) => e.severity === severity);
  }

  /**
   * Mark a prevention strategy as implemented
   */
  markPreventionImplemented(
    errorId: string,
    strategyType: PreventionType
  ): boolean {
    const entry = this.document.entries.find((e) => e.id === errorId);
    if (!entry) return false;

    const strategy = entry.preventionStrategies.find(
      (s) => s.type === strategyType
    );
    if (strategy) {
      strategy.implemented = true;
      this.document.lastUpdated = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get errors relevant to a specific task (by tags)
   */
  getRelevantErrors(tags: string[]): ErrorEntry[] {
    const lowerTags = tags.map((t) => t.toLowerCase());
    return this.document.entries.filter((e) =>
      e.tags.some((t) => lowerTags.includes(t.toLowerCase()))
    );
  }

  /**
   * Generate monthly review report
   */
  generateMonthlyReview(): MonthlyReview {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topErrors = this.getTopErrors(5).map((e) => ({
      id: e.id,
      title: e.title,
      frequency: e.frequency,
    }));

    const newErrors = this.document.entries.filter(
      (e) => e.lastOccurrence > thirtyDaysAgo && e.frequency === 1
    ).length;

    const preventionImplemented = this.document.entries
      .filter((e) => e.preventionStrategies.some((p) => p.implemented))
      .flatMap((e) =>
        e.preventionStrategies
          .filter((p) => p.implemented)
          .map((p) => ({
            errorId: e.id,
            strategy: p.type,
            impact: `Reduced ${e.title} occurrences`,
          }))
      );

    const eliminated = this.document.entries
      .filter((e) => e.lastOccurrence < thirtyDaysAgo)
      .map((e) => e.title);

    const recommendations = this.generateRecommendations();

    const review: MonthlyReview = {
      date: new Date(),
      topErrorsByFrequency: topErrors,
      newErrors,
      preventionImplemented,
      eliminated,
      recommendations,
    };

    this.document.reviewHistory.push(new Date());
    return review;
  }

  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const needsPrevention = this.getErrorsNeedingPrevention();
    const criticalErrors = this.getErrorsBySeverity("critical");

    if (needsPrevention.length > 0) {
      recommendations.push(
        `Implement prevention for ${needsPrevention.length} high-frequency errors`
      );
    }

    if (criticalErrors.length > 0) {
      recommendations.push(
        `Priority: Address ${criticalErrors.length} critical severity errors`
      );
    }

    const asyncErrors = this.document.entries.filter((e) =>
      e.tags.includes("async")
    );
    if (asyncErrors.reduce((sum, e) => sum + e.frequency, 0) > 10) {
      recommendations.push(
        "Consider enabling @typescript-eslint/no-floating-promises"
      );
    }

    return recommendations;
  }

  /**
   * Export document as markdown (ERRORS.md format)
   */
  toMarkdown(): string {
    const lines: string[] = [
      "# Common Errors & Solutions",
      "",
      `Last Updated: ${this.document.lastUpdated.toISOString().split("T")[0]}`,
      `Total Errors Documented: ${this.document.totalErrors}`,
      "",
    ];

    for (const entry of this.document.entries) {
      lines.push(`## Error: ${entry.title}`);
      lines.push("");
      lines.push(`**Frequency**: ${entry.frequency} occurrences`);
      lines.push(`**Severity**: ${entry.severity.charAt(0).toUpperCase() + entry.severity.slice(1)} ${this.getSeverityEmoji(entry.severity)}`);
      lines.push(
        `**Last Occurrence**: ${entry.lastOccurrence.toISOString().split("T")[0]}`
      );
      lines.push("");
      lines.push("**Symptoms**:");
      for (const symptom of entry.symptoms) {
        lines.push(`- ${symptom}`);
      }
      lines.push("");
      lines.push("**Bad Pattern**:");
      lines.push("```typescript");
      lines.push(entry.badPattern);
      lines.push("```");
      lines.push("");
      lines.push("**Correct Fix**:");
      lines.push("```typescript");
      lines.push(entry.correctFix);
      lines.push("```");
      lines.push("");
      lines.push("**Prevention Strategies**:");
      for (const strategy of entry.preventionStrategies) {
        const status = strategy.implemented ? "[x]" : "[ ]";
        lines.push(`${status} ${strategy.description}`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    const emojis: Record<ErrorSeverity, string> = {
      critical: "(causes production crashes)",
      high: "(causes bugs)",
      medium: "(causes confusion)",
      low: "(code quality)",
    };
    return emojis[severity];
  }

  /**
   * Get the underlying document
   */
  getDocument(): ErrorsDocument {
    return this.document;
  }
}

// ============================================================================
// COMMON ERROR PATTERNS
// ============================================================================

/**
 * Pre-defined common error patterns in AI-assisted development
 */
export const COMMON_ERROR_PATTERNS: Omit<ErrorEntry, "id" | "frequency">[] = [
  {
    title: "Missing await on Promises",
    severity: "high",
    lastOccurrence: new Date(),
    symptoms: [
      "UnhandledPromiseRejectionWarning in logs",
      "Function returns Promise instead of value",
      "Undefined where value expected",
    ],
    badPattern: `// Missing await - Promise not resolved
const user = getUserById(id)
console.log(user.email) // undefined!`,
    correctFix: `const user = await getUserById(id)
console.log(user.email) // Works`,
    preventionStrategies: [
      {
        type: "eslint_rule",
        description: "Enable @typescript-eslint/no-floating-promises",
        implemented: false,
      },
      {
        type: "pre_commit_hook",
        description: "Add pre-commit hook to catch floating promises",
        implemented: false,
      },
    ],
    tags: ["async", "promise", "typescript"],
  },
  {
    title: "Missing null checks",
    severity: "critical",
    lastOccurrence: new Date(),
    symptoms: [
      "Cannot read property of null",
      "Cannot read property of undefined",
      "Production crashes on edge cases",
    ],
    badPattern: `const user = await getUserById(id)
return user.email // Crashes if user is null!`,
    correctFix: `const user = await getUserById(id)
if (!user) {
  return { success: false, error: 'User not found' }
}
return { success: true, email: user.email }`,
    preventionStrategies: [
      {
        type: "type_guard",
        description: "Enable strictNullChecks in tsconfig.json",
        implemented: false,
      },
      {
        type: "test",
        description: "Add tests for null return cases",
        implemented: false,
      },
    ],
    tags: ["null", "typescript", "error-handling"],
  },
  {
    title: "Zod schema doesn't match database types",
    severity: "medium",
    lastOccurrence: new Date(),
    symptoms: [
      "Expected string, received object at runtime",
      "Validation errors on database reads",
      "Date handling issues",
    ],
    badPattern: `const UserSchema = z.object({
  createdAt: z.string() // Wrong! DB returns Date
})`,
    correctFix: `const UserSchema = z.object({
  createdAt: z.coerce.date() // Handles Date objects
})`,
    preventionStrategies: [
      {
        type: "claude_md_rule",
        description:
          "Add rule: Use z.coerce.date() for all timestamp fields",
        implemented: false,
      },
      {
        type: "test",
        description: "Test schemas against actual DB data shapes",
        implemented: false,
      },
    ],
    tags: ["zod", "validation", "database"],
  },
];

// ============================================================================
// SDK-POWERED ERROR ANALYSIS
// ============================================================================

/**
 * Extract text content from an assistant message
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

/**
 * Use Claude to analyze an error and suggest ERRORS.md entry
 */
export async function analyzeErrorWithClaude(
  errorDescription: string,
  codeContext: string
): Promise<Omit<ErrorEntry, "id" | "frequency">> {
  const analysisPrompt = `Analyze this error for documentation in ERRORS.md:

ERROR: ${errorDescription}

CODE CONTEXT:
${codeContext}

Create an ERRORS.md entry with:
1. Clear title (5-10 words)
2. Severity: critical, high, medium, or low
3. Observable symptoms (2-4 bullet points)
4. Bad pattern code example
5. Correct fix code example
6. Prevention strategies (2-3 approaches)
7. Relevant tags

Respond in JSON format:
{
  "title": "Error title",
  "severity": "critical|high|medium|low",
  "symptoms": ["symptom1", "symptom2"],
  "badPattern": "code example",
  "correctFix": "code example",
  "preventionStrategies": [
    {"type": "eslint_rule|type_guard|pre_commit_hook|ci_check|claude_md_rule|test", "description": "description"}
  ],
  "tags": ["tag1", "tag2"]
}`;

  const response = query({
    prompt: analysisPrompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for analysis
    },
  });

  let fullText = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      fullText += extractTextContent(message);
    }
  }

  if (!fullText) {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse error analysis response");
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    title: analysis.title,
    severity: analysis.severity as ErrorSeverity,
    lastOccurrence: new Date(),
    symptoms: analysis.symptoms,
    badPattern: analysis.badPattern,
    correctFix: analysis.correctFix,
    preventionStrategies: analysis.preventionStrategies.map(
      (s: { type: PreventionType; description: string }) => ({
        ...s,
        implemented: false,
      })
    ),
    tags: analysis.tags,
  };
}

/**
 * Use Claude to generate task context from relevant errors
 */
export async function generateErrorContext(
  taskDescription: string,
  manager: ErrorsManager
): Promise<string> {
  // Extract tags from task description
  const commonTags = [
    "async",
    "database",
    "auth",
    "api",
    "validation",
    "typescript",
  ];
  const matchedTags = commonTags.filter((tag) =>
    taskDescription.toLowerCase().includes(tag)
  );

  // Get relevant errors
  const relevantErrors = manager.getRelevantErrors(matchedTags);

  if (relevantErrors.length === 0) {
    return "No relevant documented errors for this task.";
  }

  // Format for context
  const errorContext = relevantErrors
    .slice(0, 3)
    .map((e) => `- ${e.title}: ${e.symptoms[0]}`)
    .join("\n");

  return `Relevant errors to avoid (from ERRORS.md):
${errorContext}

Review these documented patterns before implementing.`;
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate ERRORS.md management
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 8: ERRORS.md Management ===\n");

  // Create manager and add common patterns
  const manager = new ErrorsManager();

  console.log("1. Adding Common Error Patterns");
  for (const pattern of COMMON_ERROR_PATTERNS) {
    const entry = manager.addError(pattern);
    console.log(`   Added: ${entry.title} (${entry.severity})`);
  }

  // Simulate multiple occurrences
  console.log("\n2. Simulating Error Occurrences");
  manager.addError(COMMON_ERROR_PATTERNS[0]!); // Missing await - 2nd occurrence
  manager.addError(COMMON_ERROR_PATTERNS[0]!); // Missing await - 3rd occurrence
  manager.addError(COMMON_ERROR_PATTERNS[1]!); // Null check - 2nd occurrence
  console.log("   Simulated 3 more occurrences of existing errors");

  // Get top errors
  console.log("\n3. Top Errors by Frequency");
  const topErrors = manager.getTopErrors(3);
  for (const error of topErrors) {
    console.log(`   - ${error.title}: ${error.frequency} occurrences`);
  }

  // Get errors needing prevention
  console.log("\n4. Errors Needing Prevention (frequency >= 2)");
  const needsPrevention = manager.getErrorsNeedingPrevention(2);
  for (const error of needsPrevention) {
    console.log(`   - ${error.title}`);
    for (const strategy of error.preventionStrategies) {
      console.log(`     [ ] ${strategy.type}: ${strategy.description}`);
    }
  }

  // Generate monthly review
  console.log("\n5. Monthly Review Report");
  const review = manager.generateMonthlyReview();
  console.log(`   Date: ${review.date.toISOString().split("T")[0]}`);
  console.log(`   New errors: ${review.newErrors}`);
  console.log(`   Recommendations:`);
  for (const rec of review.recommendations) {
    console.log(`   - ${rec}`);
  }

  // Generate markdown
  console.log("\n6. ERRORS.md Preview (first 500 chars)");
  const markdown = manager.toMarkdown();
  console.log(markdown.substring(0, 500) + "...");

  // SDK-powered error context
  console.log("\n7. Task Context Generation");
  const taskContext = await generateErrorContext(
    "Implement async user authentication with database lookup",
    manager
  );
  console.log(`   ${taskContext}`);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
