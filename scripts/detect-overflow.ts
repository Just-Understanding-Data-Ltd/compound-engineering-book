#!/usr/bin/env npx tsx
/**
 * Overflow Detection Script
 *
 * Parses AsciiDoc files to detect potential overflow issues before build:
 * - Code lines exceeding max length (default 70 chars)
 * - Table cells with long content
 * - Long inline code that may wrap poorly
 *
 * Usage:
 *   npx tsx scripts/detect-overflow.ts
 *   npx tsx scripts/detect-overflow.ts --max-code 80
 *   npx tsx scripts/detect-overflow.ts --fix (auto-fix suggestions)
 *   npx tsx scripts/detect-overflow.ts asciidoc/ch01.adoc (single file)
 *
 * Exit codes:
 *   0 - No issues found
 *   1 - Issues found (for pre-commit hook integration)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Configuration
interface Config {
  maxCodeLineLength: number;
  maxInlineCodeLength: number;
  maxTableCellLength: number;
  warnTableCellLength: number;
  showSuggestions: boolean;
}

const DEFAULT_CONFIG: Config = {
  maxCodeLineLength: 70,
  maxInlineCodeLength: 60,
  maxTableCellLength: 80,
  warnTableCellLength: 50,
  showSuggestions: false,
};

// Issue types
interface Issue {
  file: string;
  line: number;
  type: "code-line" | "table-cell" | "inline-code";
  severity: "error" | "warning";
  content: string;
  length: number;
  maxAllowed: number;
  suggestion?: string;
}

// Parse CLI args
function parseArgs(): { files: string[]; config: Config } {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  const files: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const nextArg = args[i + 1];
    if (arg === "--max-code" && nextArg) {
      config.maxCodeLineLength = parseInt(nextArg);
      i++;
    } else if (arg === "--max-inline" && nextArg) {
      config.maxInlineCodeLength = parseInt(nextArg);
      i++;
    } else if (arg === "--max-cell" && nextArg) {
      config.maxTableCellLength = parseInt(nextArg);
      i++;
    } else if (arg === "--fix" || arg === "--suggest") {
      config.showSuggestions = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      files.push(arg);
    }
  }

  return { files, config };
}

function printHelp(): void {
  console.log(`
Overflow Detection Script

Usage:
  npx tsx scripts/detect-overflow.ts [options] [files...]

Options:
  --max-code N    Max code line length (default: 70)
  --max-inline N  Max inline code length (default: 60)
  --max-cell N    Max table cell length (default: 80)
  --fix           Show auto-fix suggestions
  --help          Show this help

Examples:
  npx tsx scripts/detect-overflow.ts
  npx tsx scripts/detect-overflow.ts --max-code 80
  npx tsx scripts/detect-overflow.ts asciidoc/ch01.adoc
  npx tsx scripts/detect-overflow.ts --fix
`);
}

// Find all AsciiDoc files if none specified
function findAsciiDocFiles(specified: string[]): string[] {
  if (specified.length > 0) {
    return specified.map((f) =>
      path.isAbsolute(f) ? f : path.join(PROJECT_ROOT, f)
    );
  }
  return globSync(path.join(PROJECT_ROOT, "asciidoc", "*.adoc"));
}

// Parse AsciiDoc content and detect issues
function analyzeFile(filePath: string, config: Config): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  let inCodeBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // Track code block state (must be exactly ---- on its own line)
    if (/^-{4,}\s*$/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Check code block lines
    if (inCodeBlock) {
      const lineLength = line.length;
      if (lineLength > config.maxCodeLineLength) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: "code-line",
          severity: "error",
          content: truncate(line, 60),
          length: lineLength,
          maxAllowed: config.maxCodeLineLength,
          suggestion: suggestCodeLineFix(line, config.maxCodeLineLength),
        });
      }
      continue;
    }

    // Track table state
    if (line.startsWith("|===")) {
      inTable = !inTable;
      continue;
    }

    // Check table cells
    if (inTable && line.startsWith("|")) {
      const cells = parseTableRow(line);
      for (const cell of cells) {
        if (cell.length > config.maxTableCellLength) {
          issues.push({
            file: relativePath,
            line: lineNum,
            type: "table-cell",
            severity: "error",
            content: truncate(cell, 50),
            length: cell.length,
            maxAllowed: config.maxTableCellLength,
            suggestion: suggestTableCellFix(cell),
          });
        } else if (cell.length > config.warnTableCellLength) {
          issues.push({
            file: relativePath,
            line: lineNum,
            type: "table-cell",
            severity: "warning",
            content: truncate(cell, 50),
            length: cell.length,
            maxAllowed: config.warnTableCellLength,
          });
        }
      }
      continue;
    }

    // Check inline code (backticks)
    const inlineMatches = line.matchAll(/`([^`]+)`/g);
    for (const match of inlineMatches) {
      const code = match[1]!;
      if (code.length > config.maxInlineCodeLength) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: "inline-code",
          severity: "warning",
          content: truncate(code, 50),
          length: code.length,
          maxAllowed: config.maxInlineCodeLength,
          suggestion: "Consider using a code block instead of inline code",
        });
      }
    }
  }

  return issues;
}

// Parse table row into cells
function parseTableRow(line: string): string[] {
  // Remove leading/trailing pipe and split by |
  const trimmed = line.replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

// Truncate string for display
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

// Suggest fix for long code lines
function suggestCodeLineFix(line: string, maxLen: number): string {
  const len = line.length;
  const over = len - maxLen;

  // Check for common patterns that can be broken
  if (line.includes("&&")) {
    return `Break at '&&': use line continuation (\\) or split into multiple commands`;
  }
  if (line.includes("||")) {
    return `Break at '||': use line continuation or split conditionals`;
  }
  if (line.includes(", ")) {
    return `Break after comma: split function arguments across lines`;
  }
  if (line.includes(": ")) {
    return `Break after colon: split object properties or type annotations`;
  }
  if (line.includes(" = ")) {
    return `Extract expression to intermediate variable`;
  }
  if (line.includes("//")) {
    return `Move comment to its own line above the code`;
  }

  return `Line is ${over} chars over limit. Consider refactoring.`;
}

// Suggest fix for long table cells
function suggestTableCellFix(cell: string): string {
  if (cell.includes(",")) {
    return "Split into multiple rows or use abbreviations";
  }
  if (cell.includes(" and ") || cell.includes(" or ")) {
    return "Use bullet list in cell or simplify wording";
  }
  return "Abbreviate or move detailed content to prose section";
}

// Format issue for console output
function formatIssue(issue: Issue, showSuggestion: boolean): string {
  const icon = issue.severity === "error" ? "\x1b[31m\u2717\x1b[0m" : "\x1b[33m\u26A0\x1b[0m";
  const typeLabel = {
    "code-line": "Code line",
    "table-cell": "Table cell",
    "inline-code": "Inline code",
  }[issue.type];

  let output = `${icon} ${issue.file}:${issue.line} [${typeLabel}]`;
  output += `\n   ${issue.content}`;
  output += `\n   Length: ${issue.length} (max: ${issue.maxAllowed})`;

  if (showSuggestion && issue.suggestion) {
    output += `\n   \x1b[36mSuggestion:\x1b[0m ${issue.suggestion}`;
  }

  return output;
}

// Generate summary report
function generateSummary(
  issues: Issue[]
): { errors: number; warnings: number; byFile: Map<string, number> } {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const byFile = new Map<string, number>();

  for (const issue of issues) {
    byFile.set(issue.file, (byFile.get(issue.file) || 0) + 1);
  }

  return { errors, warnings, byFile };
}

// Main
async function main(): Promise<void> {
  console.log("\x1b[1mOverflow Detection Script\x1b[0m\n");

  const { files: specifiedFiles, config } = parseArgs();
  const files = findAsciiDocFiles(specifiedFiles);

  if (files.length === 0) {
    console.log("No AsciiDoc files found.");
    process.exit(0);
  }

  console.log(`Scanning ${files.length} file(s)...`);
  console.log(`Config: max code=${config.maxCodeLineLength}, max inline=${config.maxInlineCodeLength}, max cell=${config.maxTableCellLength}\n`);

  const allIssues: Issue[] = [];

  for (const file of files) {
    const issues = analyzeFile(file, config);
    allIssues.push(...issues);
  }

  // Print issues
  if (allIssues.length > 0) {
    console.log("\x1b[1mIssues Found:\x1b[0m\n");

    // Group by file
    const byFile = new Map<string, Issue[]>();
    for (const issue of allIssues) {
      if (!byFile.has(issue.file)) byFile.set(issue.file, []);
      byFile.get(issue.file)!.push(issue);
    }

    for (const [file, issues] of byFile) {
      console.log(`\x1b[1m${file}\x1b[0m`);
      for (const issue of issues) {
        console.log(formatIssue(issue, config.showSuggestions));
        console.log();
      }
    }
  }

  // Print summary
  const summary = generateSummary(allIssues);
  console.log("\x1b[1mSummary:\x1b[0m");
  console.log(`  Files scanned: ${files.length}`);
  console.log(`  Errors: ${summary.errors}`);
  console.log(`  Warnings: ${summary.warnings}`);

  if (summary.byFile.size > 0) {
    console.log("\n  Issues by file:");
    for (const [file, count] of summary.byFile) {
      console.log(`    ${file}: ${count}`);
    }
  }

  // Exit with error code if issues found (for CI/pre-commit)
  if (summary.errors > 0) {
    console.log("\n\x1b[31mOverflow issues detected. Please fix before committing.\x1b[0m");
    process.exit(1);
  } else if (summary.warnings > 0) {
    console.log("\n\x1b[33mWarnings found. Consider reviewing before publishing.\x1b[0m");
    process.exit(0);
  } else {
    console.log("\n\x1b[32mNo overflow issues detected.\x1b[0m");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
