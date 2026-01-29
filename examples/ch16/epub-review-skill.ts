/**
 * Chapter 16: Building Autonomous Systems - EPUB Review Skill
 *
 * This file demonstrates how to build a custom agentic skill that gives
 * Claude "eyes" for visual debugging. The epub-review skill combines:
 * - Playwright for browser automation and screenshots
 * - Gemini vision API for image analysis
 * - Structured output for task creation
 *
 * Key concepts:
 * - Skills extend agent capabilities beyond text
 * - Vision APIs enable visual verification
 * - Structured output enables automated follow-up
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { chromium, type Browser, type Page } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

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
 * Screenshot capture result
 */
export interface ScreenshotResult {
  /** Chapter or file identifier */
  chapter: string;
  /** Path to saved screenshot */
  path: string;
  /** Screenshot dimensions */
  dimensions: { width: number; height: number };
  /** Capture timestamp */
  timestamp: string;
}

/**
 * Formatting issue severity
 */
export type IssueSeverity = "critical" | "major" | "minor" | "suggestion";

/**
 * Individual formatting issue
 */
export interface FormattingIssue {
  /** Issue severity */
  severity: IssueSeverity;
  /** Issue category */
  category: "code-block" | "typography" | "table" | "spacing" | "list" | "general";
  /** Issue description */
  description: string;
  /** Location in the document */
  location: string;
  /** Suggested fix */
  suggestedFix: string;
}

/**
 * Review result for a single chapter
 */
export interface ChapterReview {
  /** Chapter identifier */
  chapter: string;
  /** Overall status */
  status: "pass" | "needs-work" | "critical";
  /** Issues found */
  issues: FormattingIssue[];
  /** Summary text */
  summary: string;
}

/**
 * Complete review report
 */
export interface ReviewReport {
  /** Report generation timestamp */
  timestamp: string;
  /** Model used for analysis */
  model: string;
  /** Total chapters reviewed */
  chaptersReviewed: number;
  /** Chapter-by-chapter reviews */
  chapters: ChapterReview[];
  /** Aggregate statistics */
  stats: {
    totalIssues: number;
    criticalIssues: number;
    majorIssues: number;
    minorIssues: number;
    suggestions: number;
    passRate: number;
  };
}

/**
 * Skill configuration
 */
export interface EpubReviewConfig {
  /** Path to EPUB file */
  epubPath: string;
  /** Directory for extracted content */
  extractDir: string;
  /** Directory for screenshots */
  screenshotsDir: string;
  /** Output report path */
  reportPath: string;
  /** Vision API key (Gemini) */
  visionApiKey?: string;
  /** Viewport dimensions */
  viewport: { width: number; height: number };
  /** Chapters to review (null = all) */
  chapters?: number[];
}

// ============================================================================
// SCREENSHOT CAPTURE
// ============================================================================

/**
 * Capture screenshots of EPUB chapters using Playwright
 */
export async function captureScreenshots(
  config: EpubReviewConfig
): Promise<ScreenshotResult[]> {
  const results: ScreenshotResult[] = [];

  // Ensure directories exist
  if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
  }

  // Launch browser
  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: config.viewport,
  });

  try {
    // Find XHTML chapter files
    const textDir = path.join(config.extractDir, "EPUB", "text");
    if (!fs.existsSync(textDir)) {
      throw new Error(`EPUB text directory not found: ${textDir}`);
    }

    const chapters = fs
      .readdirSync(textDir)
      .filter((f) => f.startsWith("ch") && f.endsWith(".xhtml"))
      .sort();

    // Process each chapter
    for (const chapter of chapters) {
      const chapterNum = parseInt(chapter.replace("ch", "").replace(".xhtml", ""));

      // Skip if not in requested chapters list
      if (config.chapters && !config.chapters.includes(chapterNum)) {
        continue;
      }

      const filePath = path.join(textDir, chapter);
      const screenshotPath = path.join(
        config.screenshotsDir,
        chapter.replace(".xhtml", ".png")
      );

      // Create page and navigate
      const page: Page = await context.newPage();
      await page.goto(`file://${filePath}`);

      // Inject CSS if present
      const cssDir = path.join(config.extractDir, "EPUB", "styles");
      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
        for (const cssFile of cssFiles) {
          const cssContent = fs.readFileSync(path.join(cssDir, cssFile), "utf-8");
          await page.addStyleTag({ content: cssContent });
        }
      }

      // Capture full-page screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: "png",
      });

      results.push({
        chapter: chapter.replace(".xhtml", ""),
        path: screenshotPath,
        dimensions: config.viewport,
        timestamp: new Date().toISOString(),
      });

      await page.close();
    }
  } finally {
    await browser.close();
  }

  return results;
}

// ============================================================================
// VISION ANALYSIS (SIMULATED)
// ============================================================================

/**
 * Review prompt template for vision API
 */
export const REVIEW_PROMPT = `You are reviewing screenshots of an EPUB technical book about AI engineering.

Analyze the formatting and visual quality of each page. Focus on:

1. **Code blocks**: Clearly distinguished from body text? Syntax highlighting visible and readable? Properly contained (no overflow)?
2. **Typography**: Font readable? Headings clearly hierarchical? Line spacing comfortable?
3. **Tables**: Well-formatted with clear borders and alignment?
4. **Spacing**: Margins consistent? Enough whitespace between sections?
5. **Lists**: Bullet/numbered lists properly indented and spaced?
6. **Overall readability**: Does the page look professional for a technical book?

For each issue found, report:
- The specific problem
- Where on the page it occurs (heading, code block, table, etc.)
- A suggested fix (CSS or markdown change)

Be specific and actionable. If a page looks good, say so briefly. Focus on issues that hurt readability.`;

/**
 * Simulate vision API analysis (for demo purposes)
 * In production, this would call the Gemini API
 */
export function simulateVisionAnalysis(screenshot: ScreenshotResult): ChapterReview {
  // Simulated analysis based on chapter number
  const chapterNum = parseInt(screenshot.chapter.replace("ch", ""));

  const issues: FormattingIssue[] = [];

  // Simulate finding common issues
  if (chapterNum % 3 === 0) {
    issues.push({
      severity: "minor",
      category: "code-block",
      description: "Code block background color has low contrast with page",
      location: "Section 2, code example 1",
      suggestedFix: "Change code background from #f8f8f8 to #f0f0f0",
    });
  }

  if (chapterNum % 5 === 0) {
    issues.push({
      severity: "major",
      category: "table",
      description: "Table extends beyond page margins on narrow screens",
      location: "Section 3, comparison table",
      suggestedFix: "Add overflow-x: auto to table container",
    });
  }

  if (chapterNum === 1) {
    issues.push({
      severity: "suggestion",
      category: "typography",
      description: "Chapter title could use more top margin",
      location: "Page header",
      suggestedFix: "Increase margin-top on h1 from 1em to 2em",
    });
  }

  // Determine overall status
  let status: ChapterReview["status"] = "pass";
  if (issues.some((i) => i.severity === "critical")) {
    status = "critical";
  } else if (issues.some((i) => i.severity === "major")) {
    status = "needs-work";
  }

  return {
    chapter: screenshot.chapter,
    status,
    issues,
    summary:
      issues.length === 0
        ? "Chapter formatting looks professional and readable."
        : `Found ${issues.length} formatting issue(s) that should be addressed.`,
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate a complete review report
 */
export function generateReport(reviews: ChapterReview[]): ReviewReport {
  // Calculate statistics
  const allIssues = reviews.flatMap((r) => r.issues);
  const stats = {
    totalIssues: allIssues.length,
    criticalIssues: allIssues.filter((i) => i.severity === "critical").length,
    majorIssues: allIssues.filter((i) => i.severity === "major").length,
    minorIssues: allIssues.filter((i) => i.severity === "minor").length,
    suggestions: allIssues.filter((i) => i.severity === "suggestion").length,
    passRate: (reviews.filter((r) => r.status === "pass").length / reviews.length) * 100,
  };

  return {
    timestamp: new Date().toISOString(),
    model: "gemini-2.5-flash",
    chaptersReviewed: reviews.length,
    chapters: reviews,
    stats,
  };
}

/**
 * Format report as markdown
 */
export function formatReportAsMarkdown(report: ReviewReport): string {
  let md = `# EPUB Formatting Review\n\n`;
  md += `**Date**: ${report.timestamp.split("T")[0]}\n`;
  md += `**Model**: ${report.model}\n`;
  md += `**Chapters reviewed**: ${report.chaptersReviewed}\n\n`;

  md += `## Summary Statistics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Issues | ${report.stats.totalIssues} |\n`;
  md += `| Critical | ${report.stats.criticalIssues} |\n`;
  md += `| Major | ${report.stats.majorIssues} |\n`;
  md += `| Minor | ${report.stats.minorIssues} |\n`;
  md += `| Suggestions | ${report.stats.suggestions} |\n`;
  md += `| Pass Rate | ${report.stats.passRate.toFixed(1)}% |\n\n`;

  md += `---\n\n`;

  for (const chapter of report.chapters) {
    md += `## ${chapter.chapter}\n\n`;
    md += `**Status**: ${chapter.status.toUpperCase()}\n\n`;
    md += `${chapter.summary}\n\n`;

    if (chapter.issues.length > 0) {
      md += `### Issues\n\n`;
      for (const issue of chapter.issues) {
        md += `#### ${issue.severity.toUpperCase()}: ${issue.category}\n`;
        md += `- **Problem**: ${issue.description}\n`;
        md += `- **Location**: ${issue.location}\n`;
        md += `- **Fix**: ${issue.suggestedFix}\n\n`;
      }
    }

    md += `---\n\n`;
  }

  return md;
}

// ============================================================================
// TASK CREATION
// ============================================================================

/**
 * Generate tasks from review findings
 */
export function generateTasks(report: ReviewReport): Array<{
  id: string;
  type: string;
  title: string;
  priority: string;
  description: string;
}> {
  const tasks: Array<{
    id: string;
    type: string;
    title: string;
    priority: string;
    description: string;
  }> = [];

  let taskNum = 1;

  for (const chapter of report.chapters) {
    for (const issue of chapter.issues) {
      if (issue.severity === "critical" || issue.severity === "major") {
        tasks.push({
          id: `epub-fix-${taskNum++}`,
          type: "fix",
          title: `Fix ${issue.category} issue in ${chapter.chapter}`,
          priority: issue.severity === "critical" ? "high" : "medium",
          description: `${issue.description}\n\nLocation: ${issue.location}\nSuggested fix: ${issue.suggestedFix}`,
        });
      }
    }
  }

  return tasks;
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Use Claude to analyze the report and suggest priorities
 */
export async function analyzeReportWithClaude(report: ReviewReport): Promise<string> {
  const issuesSummary = report.chapters
    .filter((c) => c.issues.length > 0)
    .map((c) => `${c.chapter}: ${c.issues.map((i) => i.description).join("; ")}`)
    .join("\n");

  const prompt = `Analyze this EPUB formatting review:

**Stats:**
- Total issues: ${report.stats.totalIssues}
- Critical: ${report.stats.criticalIssues}
- Major: ${report.stats.majorIssues}
- Pass rate: ${report.stats.passRate.toFixed(1)}%

**Issues by chapter:**
${issuesSummary || "(No issues found)"}

Questions:
1. Which issues should be fixed first?
2. Are there any patterns suggesting a systemic CSS problem?
3. What's the minimum effort to achieve 100% pass rate?

Provide brief, prioritized recommendations.`;

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
 * Demonstrate the EPUB review skill
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 16: EPUB Review Skill ===\n");

  // Simulated screenshots (in production, these would be captured from real EPUB)
  const simulatedScreenshots: ScreenshotResult[] = [
    { chapter: "ch01", path: "/tmp/ch01.png", dimensions: { width: 800, height: 1200 }, timestamp: new Date().toISOString() },
    { chapter: "ch02", path: "/tmp/ch02.png", dimensions: { width: 800, height: 1200 }, timestamp: new Date().toISOString() },
    { chapter: "ch03", path: "/tmp/ch03.png", dimensions: { width: 800, height: 1200 }, timestamp: new Date().toISOString() },
    { chapter: "ch05", path: "/tmp/ch05.png", dimensions: { width: 800, height: 1200 }, timestamp: new Date().toISOString() },
    { chapter: "ch10", path: "/tmp/ch10.png", dimensions: { width: 800, height: 1200 }, timestamp: new Date().toISOString() },
  ];

  // 1. Show screenshot capture workflow
  console.log("1. Screenshot Capture Workflow");
  console.log("   In production:");
  console.log("   - Extract EPUB (ZIP) to temporary directory");
  console.log("   - Launch headless Chromium with Playwright");
  console.log("   - Navigate to each XHTML chapter file");
  console.log("   - Inject CSS stylesheets");
  console.log("   - Capture full-page PNG screenshot");
  console.log(`   Simulating ${simulatedScreenshots.length} screenshots...\n`);

  // 2. Run vision analysis
  console.log("2. Vision Analysis");
  const reviews: ChapterReview[] = [];
  for (const screenshot of simulatedScreenshots) {
    const review = simulateVisionAnalysis(screenshot);
    reviews.push(review);
    const statusIcon = review.status === "pass" ? "PASS" : review.status === "needs-work" ? "WARN" : "FAIL";
    console.log(`   ${screenshot.chapter}: ${statusIcon} (${review.issues.length} issues)`);
  }

  // 3. Generate report
  console.log("\n3. Generate Report");
  const report = generateReport(reviews);
  console.log(`   Total issues: ${report.stats.totalIssues}`);
  console.log(`   Critical: ${report.stats.criticalIssues}`);
  console.log(`   Major: ${report.stats.majorIssues}`);
  console.log(`   Pass rate: ${report.stats.passRate.toFixed(1)}%`);

  // 4. Show markdown output
  console.log("\n4. Report Output (preview)");
  const markdown = formatReportAsMarkdown(report);
  console.log(markdown.split("\n").slice(0, 15).join("\n"));
  console.log("   ...\n");

  // 5. Generate tasks
  console.log("5. Task Generation");
  const tasks = generateTasks(report);
  if (tasks.length > 0) {
    for (const task of tasks) {
      console.log(`   ${task.id}: ${task.title} (${task.priority})`);
    }
  } else {
    console.log("   No actionable tasks generated (all issues minor/suggestions)");
  }

  // 6. Review prompt
  console.log("\n6. Vision API Prompt (excerpt)");
  console.log(REVIEW_PROMPT.split("\n").slice(0, 6).join("\n"));
  console.log("   ...\n");

  // 7. Claude analysis (if API available)
  console.log("7. Claude Report Analysis");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const analysis = await analyzeReportWithClaude(report);
      console.log(`   ${analysis.slice(0, 200)}...`);
    } catch {
      console.log("   (API call skipped)");
    }
  } else {
    console.log("   (API key not set - skipping Claude analysis)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
