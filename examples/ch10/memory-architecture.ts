/**
 * Chapter 10: The RALPH Loop - Memory Architecture
 *
 * This file demonstrates the three-layer memory system that replaces
 * conversation history in the RALPH loop pattern.
 *
 * Key concepts:
 * - Layer 1: Git history (code changes and commit messages)
 * - Layer 2: Documentation files (AGENTS.md patterns and conventions)
 * - Layer 3: Task files (TASKS.md status and context)
 * - The flywheel effect: Development → Knowledge → Faster Work → More Development
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
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
 * A commit from git history
 */
export interface GitCommit {
  /** Short hash */
  hash: string;
  /** Commit message subject */
  subject: string;
  /** Full commit message */
  body: string;
  /** Author date */
  date: string;
  /** Files changed */
  filesChanged: string[];
}

/**
 * Pattern or convention documented in AGENTS.md
 */
export interface DocumentedPattern {
  /** Pattern category */
  category: string;
  /** Pattern name */
  name: string;
  /** Description */
  description: string;
  /** Example code or usage */
  example?: string;
  /** Related files */
  relatedFiles: string[];
  /** When this was learned */
  learnedFrom?: string;
}

/**
 * Common mistake or gotcha documented in AGENTS.md
 */
export interface DocumentedMistake {
  /** What to avoid */
  description: string;
  /** Why it's a problem */
  reason: string;
  /** How to do it correctly */
  correction: string;
  /** How many times encountered */
  occurrences: number;
}

/**
 * Decision logged in AGENTS.md
 */
export interface DecisionLog {
  /** When the decision was made */
  date: string;
  /** What was decided */
  decision: string;
  /** Why it was chosen */
  rationale?: string;
  /** Alternatives considered */
  alternatives?: string[];
}

/**
 * Structured AGENTS.md content
 */
export interface AgentsDocument {
  /** Tech stack information */
  techStack: Record<string, string>;
  /** Documented patterns by category */
  patterns: Record<string, DocumentedPattern[]>;
  /** Common mistakes to avoid */
  commonMistakes: DocumentedMistake[];
  /** Decision log */
  decisions: DecisionLog[];
  /** Recent learnings */
  recentLearnings: string[];
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Memory layer statistics
 */
export interface MemoryStats {
  /** Git layer stats */
  git: {
    totalCommits: number;
    recentCommits: number;
    topPatterns: string[];
  };
  /** Documentation layer stats */
  documentation: {
    patternCount: number;
    mistakeCount: number;
    decisionCount: number;
    totalCharacters: number;
  };
  /** Task layer stats */
  tasks: {
    total: number;
    completed: number;
    pending: number;
    blocked: number;
  };
}

// ============================================================================
// LAYER 1: GIT HISTORY
// ============================================================================

/**
 * Parse git log output into structured commits
 */
export function parseGitLog(output: string): GitCommit[] {
  const commits: GitCommit[] = [];
  const commitBlocks = output.split("COMMIT_DELIMITER").filter(Boolean);

  for (const block of commitBlocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    const hashAndDate = lines[0]?.split("|") ?? [];
    const hash = hashAndDate[0] ?? "";
    const date = hashAndDate[1] ?? "";
    const subject = lines[1] ?? "";
    const body = lines.slice(2).join("\n").trim();

    commits.push({
      hash,
      date,
      subject,
      body,
      filesChanged: [], // Would be populated by --name-only
    });
  }

  return commits;
}

/**
 * Get recent commits (simulated for demo)
 */
export function getRecentCommits(count: number = 10): GitCommit[] {
  // In a real implementation, this would run:
  // git log --format="COMMIT_DELIMITER%h|%ci%n%s%n%b" -n ${count}
  return [
    {
      hash: "abc123",
      subject: "feat: add rate limiting to auth endpoints",
      body: "Implements 5 attempts per 15 minutes per IP\n\n- Uses Redis for storage\n- Returns 429 with Retry-After header",
      date: "2025-01-16 10:30:00",
      filesChanged: ["src/middleware/rate-limit.ts", "tests/rate-limit.test.ts"],
    },
    {
      hash: "def456",
      subject: "fix: handle null values in user migration",
      body: "Migration was failing for users without email\n\nLearning: Always handle NULL values when adding NOT NULL columns",
      date: "2025-01-15 14:20:00",
      filesChanged: ["db/migrations/002-add-email.sql"],
    },
    {
      hash: "ghi789",
      subject: "docs: update AGENTS.md with migration pattern",
      body: "Added documentation about migration idempotency",
      date: "2025-01-15 14:25:00",
      filesChanged: ["AGENTS.md"],
    },
  ].slice(0, count);
}

/**
 * Search git history for a pattern
 */
export function searchGitHistory(query: string): GitCommit[] {
  // Simulated - in real implementation: git log --grep="${query}"
  const allCommits = getRecentCommits(100);
  const lowerQuery = query.toLowerCase();
  return allCommits.filter(
    (c) => c.subject.toLowerCase().includes(lowerQuery) || c.body.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Extract learnings from commit messages
 */
export function extractLearningsFromCommits(commits: GitCommit[]): string[] {
  const learnings: string[] = [];
  const learningPattern = /learning:?\s*(.+)/gi;

  for (const commit of commits) {
    const fullMessage = `${commit.subject}\n${commit.body}`;
    let match;
    while ((match = learningPattern.exec(fullMessage)) !== null) {
      if (match[1]) {
        learnings.push(match[1].trim());
      }
    }
  }

  return learnings;
}

// ============================================================================
// LAYER 2: DOCUMENTATION (AGENTS.MD)
// ============================================================================

/**
 * Parse AGENTS.md content into structured document
 */
export function parseAgentsDocument(content: string): AgentsDocument {
  const doc: AgentsDocument = {
    techStack: {},
    patterns: {},
    commonMistakes: [],
    decisions: [],
    recentLearnings: [],
    lastUpdated: new Date().toISOString(),
  };

  const lines = content.split("\n");
  let currentSection = "";

  for (const line of lines) {
    // Detect section headers
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim();
      continue;
    }
    // Track subcategory headers (for future pattern parsing)
    if (line.startsWith("### ")) {
      // Currently unused but kept for structure awareness
      continue;
    }

    // Parse tech stack (key: value format)
    if (currentSection === "Tech Stack" && line.includes(":")) {
      const [key, value] = line.replace(/^-\s*/, "").split(":").map((s) => s.trim());
      if (key && value) {
        doc.techStack[key] = value;
      }
    }

    // Parse decisions (date in brackets)
    if (currentSection === "Decision Log" && line.startsWith("-")) {
      const dateMatch = line.match(/\[(\d{4}-\d{2}-\d{2})\]/);
      if (dateMatch && dateMatch[1]) {
        doc.decisions.push({
          date: dateMatch[1],
          decision: line.replace(/\[\d{4}-\d{2}-\d{2}\]\s*/, "").replace(/^-\s*/, "").trim(),
        });
      }
    }

    // Parse common mistakes
    if (currentSection === "Common Mistakes to Avoid" && line.startsWith("-")) {
      doc.commonMistakes.push({
        description: line.replace(/^-\s*/, "").trim(),
        reason: "", // Would be parsed from multi-line format
        correction: "",
        occurrences: 1,
      });
    }

    // Parse recent learnings
    if (currentSection.startsWith("Recent Learnings") && line.startsWith("-")) {
      doc.recentLearnings.push(line.replace(/^-\s*/, "").trim());
    }
  }

  return doc;
}

/**
 * Generate AGENTS.md content from structured document
 */
export function generateAgentsDocument(doc: AgentsDocument): string {
  const sections: string[] = [];

  // Header
  sections.push("# AGENTS.md - Accumulated Knowledge\n");

  // Tech Stack
  sections.push("## Tech Stack");
  for (const [key, value] of Object.entries(doc.techStack)) {
    sections.push(`- ${key}: ${value}`);
  }
  sections.push("");

  // Patterns
  sections.push("## Key Patterns");
  for (const [category, patterns] of Object.entries(doc.patterns)) {
    sections.push(`\n### ${category}`);
    for (const pattern of patterns) {
      sections.push(`- ${pattern.description}`);
      if (pattern.example) {
        sections.push(`  \`\`\`\n  ${pattern.example}\n  \`\`\``);
      }
    }
  }
  sections.push("");

  // Common Mistakes
  if (doc.commonMistakes.length > 0) {
    sections.push("## Common Mistakes to Avoid");
    for (const mistake of doc.commonMistakes) {
      sections.push(`- ${mistake.description}`);
    }
    sections.push("");
  }

  // Decisions
  if (doc.decisions.length > 0) {
    sections.push("## Decision Log");
    for (const decision of doc.decisions) {
      sections.push(`- [${decision.date}] ${decision.decision}`);
    }
    sections.push("");
  }

  // Recent Learnings
  if (doc.recentLearnings.length > 0) {
    sections.push(`## Recent Learnings (${doc.lastUpdated.split("T")[0]})`);
    for (const learning of doc.recentLearnings) {
      sections.push(`- ${learning}`);
    }
  }

  return sections.join("\n");
}

/**
 * Add a pattern to the document
 */
export function addPattern(doc: AgentsDocument, category: string, pattern: DocumentedPattern): AgentsDocument {
  const patterns = { ...doc.patterns };
  if (!patterns[category]) {
    patterns[category] = [];
  }
  patterns[category] = [...patterns[category], pattern];
  return { ...doc, patterns, lastUpdated: new Date().toISOString() };
}

/**
 * Add a learning to the document
 */
export function addLearning(doc: AgentsDocument, learning: string): AgentsDocument {
  return {
    ...doc,
    recentLearnings: [learning, ...doc.recentLearnings],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Record a common mistake
 */
export function recordMistake(doc: AgentsDocument, mistake: DocumentedMistake): AgentsDocument {
  // Check if this mistake already exists
  const existingIndex = doc.commonMistakes.findIndex(
    (m) => m.description.toLowerCase() === mistake.description.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Increment occurrence count
    const updated = [...doc.commonMistakes];
    const existing = updated[existingIndex];
    if (existing) {
      updated[existingIndex] = {
        ...existing,
        occurrences: existing.occurrences + 1,
      };
    }
    return { ...doc, commonMistakes: updated };
  }

  return {
    ...doc,
    commonMistakes: [...doc.commonMistakes, mistake],
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// LAYER 3: TASK FILES
// ============================================================================

/**
 * Task status tracking
 */
export interface TaskStatus {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "complete" | "blocked";
  blockedBy?: string[];
  iteration?: number;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Parse TASKS.md into task statuses
 */
export function parseTasksMarkdown(content: string): TaskStatus[] {
  const tasks: TaskStatus[] = [];
  const lines = content.split("\n");
  let taskCounter = 0;

  for (const line of lines) {
    const match = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (match && match[2]) {
      const isComplete = match[1] === "x";
      const title = match[2].trim();
      taskCounter++;

      // Check for metadata in parentheses
      const completedMatch = title.match(/\(Completed:\s*([^)]+)\)/);
      const blockedMatch = title.match(/\(Blocked by:\s*([^)]+)\)/);

      tasks.push({
        id: `task-${taskCounter}`,
        title: title.replace(/\s*\([^)]+\)/, "").trim(),
        status: isComplete
          ? "complete"
          : blockedMatch
            ? "blocked"
            : "pending",
        completedAt: completedMatch && completedMatch[1] ? completedMatch[1] : undefined,
        blockedBy: blockedMatch && blockedMatch[1] ? blockedMatch[1].split(",").map((s) => s.trim()) : undefined,
      });
    }
  }

  return tasks;
}

/**
 * Calculate task layer statistics
 */
export function calculateTaskStats(tasks: TaskStatus[]): MemoryStats["tasks"] {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "complete").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };
}

// ============================================================================
// FLYWHEEL EFFECT
// ============================================================================

/**
 * Calculate the compound advantage from accumulated knowledge
 */
export interface CompoundAdvantage {
  /** Iteration number */
  iteration: number;
  /** Knowledge items accumulated */
  knowledgeItems: number;
  /** Estimated time savings (percentage) */
  timeSavingsPercent: number;
  /** Estimated error reduction (percentage) */
  errorReductionPercent: number;
  /** Patterns that prevented mistakes */
  preventedMistakes: string[];
}

/**
 * Model the flywheel effect over iterations
 */
export function modelFlywheelEffect(iterations: number, learningsPerIteration: number = 0.5): CompoundAdvantage[] {
  const results: CompoundAdvantage[] = [];
  let totalKnowledge = 0;

  for (let i = 1; i <= iterations; i++) {
    // Knowledge accumulates (some iterations add learnings)
    totalKnowledge += Math.random() < learningsPerIteration ? 1 : 0;

    // Time savings compound logarithmically (diminishing returns)
    const timeSavings = Math.min(40, 10 * Math.log2(totalKnowledge + 1));

    // Error reduction compounds (each pattern prevents ~5% of remaining errors)
    const errorReduction = Math.min(80, 100 * (1 - Math.pow(0.95, totalKnowledge)));

    results.push({
      iteration: i,
      knowledgeItems: totalKnowledge,
      timeSavingsPercent: Math.round(timeSavings),
      errorReductionPercent: Math.round(errorReduction),
      preventedMistakes: [], // Would be tracked from actual usage
    });
  }

  return results;
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Build context from all three memory layers
 */
export async function buildMemoryContext(
  agentsDoc: AgentsDocument,
  recentCommits: GitCommit[],
  taskStats: MemoryStats["tasks"]
): Promise<string> {
  const sections: string[] = [];

  // Add AGENTS.md content
  sections.push("## Accumulated Knowledge (AGENTS.md)\n");
  sections.push(`Tech Stack: ${Object.entries(agentsDoc.techStack).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  sections.push(`Recent learnings: ${agentsDoc.recentLearnings.slice(0, 5).join("; ")}`);

  // Add relevant git history
  sections.push("\n## Recent Development (Git)\n");
  for (const commit of recentCommits.slice(0, 3)) {
    sections.push(`- ${commit.subject}`);
  }

  // Add task context
  sections.push("\n## Task Status\n");
  sections.push(`Completed: ${taskStats.completed}/${taskStats.total}`);
  sections.push(`Pending: ${taskStats.pending}`);
  if (taskStats.blocked > 0) {
    sections.push(`Blocked: ${taskStats.blocked}`);
  }

  return sections.join("\n");
}

/**
 * Use Claude to synthesize learnings from an iteration
 */
export async function synthesizeLearnings(
  taskDescription: string,
  outcome: string,
  issues: string[]
): Promise<string[]> {
  const prompt = `You completed a development task. Extract 1-3 learnings worth documenting.

Task: ${taskDescription}
Outcome: ${outcome}
Issues encountered: ${issues.join("; ")}

Format each learning as a single line starting with "- "
Focus on patterns that would help future iterations avoid mistakes.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5",
      allowedTools: [], // No tools needed for learning synthesis
    },
  });

  let text = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      text += extractTextContent(message);
    }
  }

  return text
    .split("\n")
    .filter((line: string) => line.trim().startsWith("-"))
    .map((line: string) => line.replace(/^-\s*/, "").trim());
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate the three-layer memory architecture
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 10: Three-Layer Memory Architecture ===\n");

  // Example 1: Git history layer
  console.log("1. Layer 1: Git History");
  const commits = getRecentCommits(5);
  console.log(`   Recent commits: ${commits.length}`);
  for (const commit of commits.slice(0, 3)) {
    console.log(`   - ${commit.hash}: ${commit.subject}`);
  }

  // Example 2: Extract learnings from commits
  console.log("\n2. Extracting Learnings from Git");
  const learnings = extractLearningsFromCommits(commits);
  console.log(`   Found ${learnings.length} learning(s)`);
  for (const learning of learnings) {
    console.log(`   - ${learning}`);
  }

  // Example 3: Documentation layer
  console.log("\n3. Layer 2: Documentation (AGENTS.md)");
  const sampleAgentsContent = `# AGENTS.md - Accumulated Knowledge

## Tech Stack
- Runtime: Bun (use \`bun\`, not \`npm\`)
- Framework: Next.js 15 (app router)
- Database: PostgreSQL
- Testing: Vitest + Playwright

## Key Patterns

### Database Migrations
- Use the pattern in /db/migrations/*.sql
- Always test migration up AND down
- Migrations must be idempotent

### API Endpoints
- Use Server Actions in /app/actions/
- Always validate input with zod

## Common Mistakes to Avoid
- Using npm instead of bun
- Forgetting type-check before commit

## Decision Log
- [2025-01-15] Chose Server Actions over API routes for auth
- [2025-01-12] Switched to Playwright from Cypress

## Recent Learnings (2025-01-16)
- Always handle NULL values in migrations
- Rate limiting needs both IP and user-based limits`;

  const agentsDoc = parseAgentsDocument(sampleAgentsContent);
  console.log(`   Tech stack items: ${Object.keys(agentsDoc.techStack).length}`);
  console.log(`   Common mistakes: ${agentsDoc.commonMistakes.length}`);
  console.log(`   Decisions logged: ${agentsDoc.decisions.length}`);
  console.log(`   Recent learnings: ${agentsDoc.recentLearnings.length}`);

  // Example 4: Adding to documentation
  console.log("\n4. Adding New Knowledge");
  let updatedDoc = addLearning(agentsDoc, "Retry-After header should use seconds, not milliseconds");
  console.log(`   Added learning. Total: ${updatedDoc.recentLearnings.length}`);

  updatedDoc = recordMistake(updatedDoc, {
    description: "Forgot to run type-check before commit",
    reason: "CI will fail even if tests pass",
    correction: "Always run: bun run type-check && bun run test",
    occurrences: 1,
  });
  console.log(`   Recorded mistake. Total: ${updatedDoc.commonMistakes.length}`);

  // Example 5: Task layer
  console.log("\n5. Layer 3: Task Files (TASKS.md)");
  const sampleTasksContent = `# Tasks

- [x] Implement user authentication (Completed: 2025-01-15)
- [x] Add rate limiting to API (Completed: 2025-01-16)
- [ ] Implement password reset flow
- [ ] Add user profile page (Blocked by: task-3)
- [ ] Create API documentation`;

  const tasks = parseTasksMarkdown(sampleTasksContent);
  const taskStats = calculateTaskStats(tasks);
  console.log(`   Total tasks: ${taskStats.total}`);
  console.log(`   Completed: ${taskStats.completed}`);
  console.log(`   Pending: ${taskStats.pending}`);
  console.log(`   Blocked: ${taskStats.blocked}`);

  // Example 6: Flywheel effect modeling
  console.log("\n6. Flywheel Effect Over Iterations");
  const flywheel = modelFlywheelEffect(20);
  const milestones = [1, 5, 10, 20];
  for (const iteration of milestones) {
    const result = flywheel[iteration - 1];
    if (result) {
      console.log(
        `   Iteration ${iteration}: ${result.knowledgeItems} knowledge items, ` +
          `${result.timeSavingsPercent}% time savings, ${result.errorReductionPercent}% error reduction`
      );
    }
  }

  // Example 7: Building combined context
  console.log("\n7. Combined Memory Context");
  const context = await buildMemoryContext(agentsDoc, commits, taskStats);
  console.log(`   Combined context: ${context.length} characters`);
  console.log(`   Tokens: ${countTokens(context)}`);

  // Example 8: Generate updated AGENTS.md
  console.log("\n8. Regenerating AGENTS.md");
  const regenerated = generateAgentsDocument(updatedDoc);
  console.log(`   Original: ${sampleAgentsContent.length} chars`);
  console.log(`   After updates: ${regenerated.length} chars`);

  // Example 9: SDK integration (if available)
  console.log("\n9. Learning Synthesis (API Demo)");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const synthesized = await synthesizeLearnings(
        "Add rate limiting to login endpoint",
        "Implemented successfully with Redis",
        ["Initially forgot to handle IPv6", "Retry-After header format was wrong"]
      );
      console.log(`   Synthesized ${synthesized.length} learnings:`);
      for (const learning of synthesized) {
        console.log(`   - ${learning}`);
      }
    } catch (error) {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping synthesis)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
