/**
 * Chapter 16: Building Autonomous Systems - Progress File Compaction
 *
 * This file demonstrates auto-compacting memory systems for long-running
 * agent loops. The progress file tracks session state and recent activity,
 * but must be compacted periodically to prevent unbounded growth.
 *
 * Key concepts:
 * - File-based memory that survives context boundaries
 * - Automatic compaction when file exceeds threshold
 * - Preserving essential state while summarizing history
 * - Three-tier memory hierarchy (conversation, files, git)
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "node:fs";

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
 * Progress entry for a single session
 */
export interface ProgressEntry {
  /** Timestamp of the entry */
  timestamp: string;
  /** Task or activity completed */
  title: string;
  /** What was done */
  what: string;
  /** Files changed */
  files: string[];
  /** Outcome: success, partial, blocked */
  outcome: "success" | "partial" | "blocked";
  /** Recommended next action */
  next?: string;
}

/**
 * Current status section of progress file
 */
export interface CurrentStatus {
  /** Last update timestamp */
  updated: string;
  /** Current phase */
  phase: string;
  /** Currently active task */
  active: string;
  /** Last completed task */
  lastCompleted: string;
  /** Current blockers */
  blockers: string[];
  /** Queue health summary */
  queueHealth: string;
}

/**
 * Weekly summary for compacted history
 */
export interface WeeklySummary {
  /** Week identifier (e.g., "2026-01-20") */
  weekOf: string;
  /** Number of tasks completed */
  tasksCompleted: number;
  /** Key milestones achieved */
  milestones: string[];
  /** Issues resolved */
  issuesResolved: string[];
  /** Key decisions made */
  keyDecisions: string[];
}

/**
 * Complete progress file structure
 */
export interface ProgressFile {
  /** Current status section */
  currentStatus: CurrentStatus;
  /** Recent activity (last 10 detailed entries) */
  recentActivity: ProgressEntry[];
  /** Compacted weekly summaries */
  compactedHistory: WeeklySummary[];
}

/**
 * Compaction configuration
 */
export interface CompactionConfig {
  /** Maximum lines before triggering compaction */
  maxLines: number;
  /** Target lines after compaction */
  targetLines: number;
  /** Number of recent entries to keep detailed */
  keepRecentEntries: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  maxLines: 2000,
  targetLines: 1000,
  keepRecentEntries: 10,
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse a progress file from markdown content
 */
export function parseProgressFile(content: string): ProgressFile {
  const lines = content.split("\n");

  // Parse current status section
  const currentStatus: CurrentStatus = {
    updated: "",
    phase: "",
    active: "",
    lastCompleted: "",
    blockers: [],
    queueHealth: "",
  };

  const recentActivity: ProgressEntry[] = [];
  const compactedHistory: WeeklySummary[] = [];

  let section = "";
  let currentEntry: Partial<ProgressEntry> | null = null;
  let currentSummary: Partial<WeeklySummary> | null = null;

  for (const line of lines) {
    // Detect section headers
    if (line.startsWith("## Current Status")) {
      section = "status";
      continue;
    }
    if (line.startsWith("## Recent Activity")) {
      section = "recent";
      continue;
    }
    if (line.startsWith("## Compacted History")) {
      section = "history";
      continue;
    }

    // Parse status section
    if (section === "status") {
      if (line.startsWith("- Phase:")) {
        currentStatus.phase = line.replace("- Phase:", "").trim();
      } else if (line.startsWith("- Active:")) {
        currentStatus.active = line.replace("- Active:", "").trim();
      } else if (line.startsWith("- Last Completed:")) {
        currentStatus.lastCompleted = line.replace("- Last Completed:", "").trim();
      } else if (line.startsWith("- Blockers:")) {
        const blockers = line.replace("- Blockers:", "").trim();
        currentStatus.blockers = blockers === "None" ? [] : blockers.split(",").map((b) => b.trim());
      } else if (line.startsWith("- Queue Health:")) {
        currentStatus.queueHealth = line.replace("- Queue Health:", "").trim();
      } else if (line.match(/Updated:\s*(\d{4}-\d{2}-\d{2})/)) {
        const match = line.match(/Updated:\s*(\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2})/);
        if (match && match[1]) {
          currentStatus.updated = match[1];
        }
      }
    }

    // Parse recent activity
    if (section === "recent") {
      // Entry header: ### 2026-01-29 14:30 - COMPLETED task-439
      const entryMatch = line.match(/^###\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+-\s+(.+)$/);
      if (entryMatch) {
        // Save previous entry
        if (currentEntry && currentEntry.timestamp) {
          recentActivity.push(currentEntry as ProgressEntry);
        }
        currentEntry = {
          timestamp: entryMatch[1],
          title: entryMatch[2],
          what: "",
          files: [],
          outcome: "success",
        };
        continue;
      }

      // Parse entry details
      if (currentEntry) {
        if (line.startsWith("- What:")) {
          currentEntry.what = line.replace("- What:", "").trim();
        } else if (line.startsWith("- Files:")) {
          currentEntry.files = line
            .replace("- Files:", "")
            .trim()
            .split(",")
            .map((f) => f.trim());
        } else if (line.startsWith("- Outcome:")) {
          const outcome = line.replace("- Outcome:", "").trim().toLowerCase();
          if (outcome === "blocked" || outcome === "partial") {
            currentEntry.outcome = outcome;
          }
        } else if (line.startsWith("- Next:")) {
          currentEntry.next = line.replace("- Next:", "").trim();
        }
      }
    }

    // Parse compacted history
    if (section === "history") {
      // Week header: ### Week of 2026-01-20
      const weekMatch = line.match(/^###\s+Week of\s+(\d{4}-\d{2}-\d{2})$/);
      if (weekMatch) {
        // Save previous summary
        if (currentSummary && currentSummary.weekOf) {
          compactedHistory.push(currentSummary as WeeklySummary);
        }
        currentSummary = {
          weekOf: weekMatch[1],
          tasksCompleted: 0,
          milestones: [],
          issuesResolved: [],
          keyDecisions: [],
        };
        continue;
      }

      // Parse summary details
      if (currentSummary) {
        if (line.startsWith("- Completed:")) {
          const match = line.match(/(\d+)\s+tasks?/);
          if (match && match[1]) {
            currentSummary.tasksCompleted = parseInt(match[1], 10);
          }
        } else if (line.startsWith("- Milestones:")) {
          currentSummary.milestones = line
            .replace("- Milestones:", "")
            .trim()
            .split(",")
            .map((m) => m.trim());
        } else if (line.startsWith("- Issues resolved:")) {
          currentSummary.issuesResolved = line
            .replace("- Issues resolved:", "")
            .trim()
            .split(",")
            .map((i) => i.trim());
        } else if (line.startsWith("- Key decisions:")) {
          currentSummary.keyDecisions = line
            .replace("- Key decisions:", "")
            .trim()
            .split(",")
            .map((d) => d.trim());
        }
      }
    }
  }

  // Save final entries
  if (currentEntry && currentEntry.timestamp) {
    recentActivity.push(currentEntry as ProgressEntry);
  }
  if (currentSummary && currentSummary.weekOf) {
    compactedHistory.push(currentSummary as WeeklySummary);
  }

  return {
    currentStatus,
    recentActivity,
    compactedHistory,
  };
}

// ============================================================================
// COMPACTION FUNCTIONS
// ============================================================================

/**
 * Group entries by week for summarization
 */
export function groupEntriesByWeek(
  entries: ProgressEntry[]
): Map<string, ProgressEntry[]> {
  const groups = new Map<string, ProgressEntry[]>();

  for (const entry of entries) {
    // Get Monday of the week
    const date = new Date(entry.timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const isoString = monday.toISOString();
    const weekKey = isoString.split("T")[0] ?? isoString.slice(0, 10);

    if (!groups.has(weekKey)) {
      groups.set(weekKey, []);
    }
    const weekEntries = groups.get(weekKey);
    if (weekEntries) {
      weekEntries.push(entry);
    }
  }

  return groups;
}

/**
 * Generate a weekly summary from entries
 */
export function generateWeeklySummary(
  weekOf: string,
  entries: ProgressEntry[]
): WeeklySummary {
  const milestones = entries
    .filter((e) => e.title.toLowerCase().includes("complete"))
    .map((e) => e.title.replace(/COMPLETED\s*/i, "").trim())
    .slice(0, 5);

  const issues = entries
    .filter((e) => e.title.toLowerCase().includes("fix"))
    .map((e) => e.what)
    .slice(0, 3);

  const decisions = entries
    .filter((e) => e.what.toLowerCase().includes("decision") || e.what.toLowerCase().includes("chose"))
    .map((e) => e.what)
    .slice(0, 3);

  return {
    weekOf,
    tasksCompleted: entries.filter((e) => e.outcome === "success").length,
    milestones,
    issuesResolved: issues,
    keyDecisions: decisions,
  };
}

/**
 * Compact a progress file to reduce size
 */
export function compactProgressFile(
  progressFile: ProgressFile,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG
): ProgressFile {
  // Keep only the most recent entries as detailed
  const recentToKeep = progressFile.recentActivity.slice(0, config.keepRecentEntries);
  const entriesToCompact = progressFile.recentActivity.slice(config.keepRecentEntries);

  // Group old entries by week and generate summaries
  const weekGroups = groupEntriesByWeek(entriesToCompact);
  const newSummaries: WeeklySummary[] = [];

  for (const [weekOf, entries] of weekGroups) {
    const summary = generateWeeklySummary(weekOf, entries);
    newSummaries.push(summary);
  }

  // Merge with existing compacted history
  const allSummaries = [...newSummaries, ...progressFile.compactedHistory];

  // Sort by week (most recent first)
  allSummaries.sort((a, b) => b.weekOf.localeCompare(a.weekOf));

  return {
    currentStatus: progressFile.currentStatus,
    recentActivity: recentToKeep,
    compactedHistory: allSummaries,
  };
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Format progress file as markdown
 */
export function formatProgressFile(progressFile: ProgressFile): string {
  let md = "# Progress Log\n\n";

  // Current Status
  md += `## Current Status (Updated: ${progressFile.currentStatus.updated})\n`;
  md += `- Phase: ${progressFile.currentStatus.phase}\n`;
  md += `- Active: ${progressFile.currentStatus.active}\n`;
  md += `- Last Completed: ${progressFile.currentStatus.lastCompleted}\n`;
  md += `- Blockers: ${progressFile.currentStatus.blockers.length > 0 ? progressFile.currentStatus.blockers.join(", ") : "None"}\n`;
  md += `- Queue Health: ${progressFile.currentStatus.queueHealth}\n\n`;

  // Recent Activity
  md += "## Recent Activity (Last 10 Entries)\n\n";
  for (const entry of progressFile.recentActivity) {
    md += `### ${entry.timestamp} - ${entry.title}\n`;
    md += `- What: ${entry.what}\n`;
    if (entry.files.length > 0) {
      md += `- Files: ${entry.files.join(", ")}\n`;
    }
    md += `- Outcome: ${entry.outcome}\n`;
    if (entry.next) {
      md += `- Next: ${entry.next}\n`;
    }
    md += "\n";
  }

  // Compacted History
  md += "## Compacted History\n\n";
  for (const summary of progressFile.compactedHistory) {
    md += `### Week of ${summary.weekOf}\n`;
    md += `- Completed: ${summary.tasksCompleted} tasks\n`;
    if (summary.milestones.length > 0) {
      md += `- Milestones: ${summary.milestones.join(", ")}\n`;
    }
    if (summary.issuesResolved.length > 0) {
      md += `- Issues resolved: ${summary.issuesResolved.join(", ")}\n`;
    }
    if (summary.keyDecisions.length > 0) {
      md += `- Key decisions: ${summary.keyDecisions.join(", ")}\n`;
    }
    md += "\n";
  }

  return md;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Check if compaction is needed
 */
export function needsCompaction(filePath: string, maxLines: number): boolean {
  if (!fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, "utf-8");
  const lineCount = content.split("\n").length;

  return lineCount > maxLines;
}

/**
 * Read, compact, and write progress file
 */
export function compactFile(
  filePath: string,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG
): { before: number; after: number } {
  const content = fs.readFileSync(filePath, "utf-8");
  const beforeLines = content.split("\n").length;

  const progressFile = parseProgressFile(content);
  const compacted = compactProgressFile(progressFile, config);
  const output = formatProgressFile(compacted);

  fs.writeFileSync(filePath, output);

  return {
    before: beforeLines,
    after: output.split("\n").length,
  };
}

// ============================================================================
// ENTRY MANAGEMENT
// ============================================================================

/**
 * Add a new entry to the progress file
 */
export function addEntry(
  progressFile: ProgressFile,
  entry: ProgressEntry
): ProgressFile {
  return {
    ...progressFile,
    currentStatus: {
      ...progressFile.currentStatus,
      updated: new Date().toISOString().replace("T", " ").slice(0, 16),
      lastCompleted: entry.title,
    },
    recentActivity: [entry, ...progressFile.recentActivity],
  };
}

/**
 * Update current status
 */
export function updateStatus(
  progressFile: ProgressFile,
  updates: Partial<CurrentStatus>
): ProgressFile {
  return {
    ...progressFile,
    currentStatus: {
      ...progressFile.currentStatus,
      ...updates,
      updated: new Date().toISOString().replace("T", " ").slice(0, 16),
    },
  };
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Use Claude to generate a weekly summary from entries
 */
export async function generateSummaryWithClaude(
  entries: ProgressEntry[]
): Promise<string> {
  const entriesText = entries
    .map((e) => `- ${e.timestamp}: ${e.title} (${e.what})`)
    .join("\n");

  const prompt = `Summarize this week's development progress:

${entriesText}

Create a brief summary (2-3 sentences) covering:
1. Main accomplishments
2. Any blockers or issues
3. Overall trajectory

Be concise and factual.`;

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
 * Demonstrate progress file compaction
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 16: Progress File Compaction ===\n");

  // Create sample progress file with many entries
  const sampleEntries: ProgressEntry[] = [];
  const now = Date.now();

  // Generate 25 entries across 3 weeks
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(i / 2) + Math.floor(i / 5);
    const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    sampleEntries.push({
      timestamp: timestamp.toISOString().replace("T", " ").slice(0, 16),
      title: `COMPLETED task-${100 + i}`,
      what: `Completed iteration ${i + 1} task`,
      files: [`chapters/ch${String(Math.floor(i / 3) + 1).padStart(2, "0")}.md`],
      outcome: i % 7 === 0 ? "partial" : "success",
      next: `Continue with task-${101 + i}`,
    });
  }

  const progressFile: ProgressFile = {
    currentStatus: {
      updated: new Date().toISOString().replace("T", " ").slice(0, 16),
      phase: "Chapter Writing",
      active: "task-125",
      lastCompleted: "task-124",
      blockers: [],
      queueHealth: "38 pending, 85 complete",
    },
    recentActivity: sampleEntries,
    compactedHistory: [],
  };

  // 1. Show original size
  console.log("1. Original Progress File");
  const originalMd = formatProgressFile(progressFile);
  const originalLines = originalMd.split("\n").length;
  console.log(`   Entries: ${progressFile.recentActivity.length}`);
  console.log(`   Lines: ${originalLines}`);

  // 2. Demonstrate compaction
  console.log("\n2. After Compaction");
  const config: CompactionConfig = {
    maxLines: 100, // Lower threshold for demo
    targetLines: 50,
    keepRecentEntries: 10,
  };
  const compacted = compactProgressFile(progressFile, config);
  const compactedMd = formatProgressFile(compacted);
  const compactedLines = compactedMd.split("\n").length;

  console.log(`   Recent entries kept: ${compacted.recentActivity.length}`);
  console.log(`   Weekly summaries: ${compacted.compactedHistory.length}`);
  console.log(`   Lines: ${compactedLines} (${Math.round((1 - compactedLines / originalLines) * 100)}% reduction)`);

  // 3. Show weekly summary
  console.log("\n3. Weekly Summaries Generated");
  for (const summary of compacted.compactedHistory) {
    console.log(`   Week of ${summary.weekOf}: ${summary.tasksCompleted} tasks`);
    if (summary.milestones.length > 0) {
      console.log(`      Milestones: ${summary.milestones[0]}...`);
    }
  }

  // 4. Show memory hierarchy
  console.log("\n4. Memory Hierarchy");
  console.log("   Tier 1: Conversation context (ephemeral, per-iteration)");
  console.log("   Tier 2: File-based state (persistent, auto-compacting)");
  console.log("   Tier 3: Git history (permanent, searchable)");

  // 5. Compaction rules
  console.log("\n5. Compaction Rules");
  console.log(`   Trigger: > ${DEFAULT_COMPACTION_CONFIG.maxLines} lines`);
  console.log(`   Target: ${DEFAULT_COMPACTION_CONFIG.targetLines} lines`);
  console.log(`   Keep recent: ${DEFAULT_COMPACTION_CONFIG.keepRecentEntries} entries`);
  console.log("   Strategy: Group old entries by week, summarize");

  // 6. Adding new entries
  console.log("\n6. Adding New Entry");
  const newEntry: ProgressEntry = {
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    title: "COMPLETED task-126",
    what: "Added progress compaction example",
    files: ["examples/ch16/progress-compaction.ts"],
    outcome: "success",
    next: "Run tests",
  };
  const withNewEntry = addEntry(compacted, newEntry);
  console.log(`   Added: ${newEntry.title}`);
  console.log(`   Recent entries: ${withNewEntry.recentActivity.length}`);

  // 7. Claude summary (if API available)
  console.log("\n7. Claude Summary Generation");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const summary = await generateSummaryWithClaude(sampleEntries.slice(0, 5));
      console.log(`   ${summary.slice(0, 150)}...`);
    } catch {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping Claude summary)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
