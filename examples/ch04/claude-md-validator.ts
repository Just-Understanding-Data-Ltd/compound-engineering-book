/**
 * CLAUDE.md Validator
 *
 * Uses Claude to validate CLAUDE.md files against best practices
 * from Chapter 4. Checks for common mistakes like:
 * - Exceeding recommended line counts
 * - Including style rules that should use tooling
 * - Missing WHY/WHAT/HOW sections
 * - Inline code snippets that may become stale
 *
 * Related to Chapter 4 sections:
 * - "Anatomy of an Effective CLAUDE.md"
 * - "Common Mistakes and How to Avoid Them"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Type alias for content blocks
type ContentBlock = Anthropic.Messages.ContentBlock;

// Validation thresholds from Chapter 4
const THRESHOLDS = {
  ROOT_OPTIMAL_LINES: 100,
  ROOT_MAX_LINES: 300,
  DOMAIN_OPTIMAL_LINES: 200,
  DOMAIN_MAX_LINES: 350,
  INSTRUCTION_LIMIT: 150,
} as const;

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  line?: number;
}

export interface ValidationResult {
  isValid: boolean;
  lineCount: number;
  issues: ValidationIssue[];
  score: number; // 0-100
  suggestions: string[];
}

/**
 * Count lines in content
 */
function countLines(content: string): number {
  return content.split('\n').length;
}

/**
 * Check for style rules that should use tooling instead
 */
function findStyleRules(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');

  const stylePatterns = [
    { pattern: /\b(2|4)\s*spaces/i, desc: 'indentation spacing' },
    { pattern: /camelCase|PascalCase|snake_case/i, desc: 'naming convention' },
    { pattern: /semicolons?\s*(required|optional|never)/i, desc: 'semicolon usage' },
    { pattern: /single\s*quotes?|double\s*quotes?/i, desc: 'quote style' },
    { pattern: /trailing\s*comma/i, desc: 'trailing comma' },
    { pattern: /max.*line.*length/i, desc: 'line length limit' },
  ];

  lines.forEach((line, index) => {
    for (const { pattern, desc } of stylePatterns) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'warning',
          category: 'style-rule',
          message: `Style rule for ${desc} should use linter/formatter instead`,
          line: index + 1,
        });
      }
    }
  });

  return issues;
}

/**
 * Check for WHY/WHAT/HOW framework coverage
 */
function checkFrameworkCoverage(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const hasWhy = /##\s*why|purpose|goal|problem/i.test(content);
  const hasWhat = /##\s*what|stack|structure|tech/i.test(content);
  const hasHow = /##\s*how|commands?|workflow|build|test/i.test(content);

  if (!hasWhy) {
    issues.push({
      severity: 'error',
      category: 'framework',
      message: 'Missing WHY section: document project purpose and context',
    });
  }

  if (!hasWhat) {
    issues.push({
      severity: 'error',
      category: 'framework',
      message: 'Missing WHAT section: document tech stack and structure',
    });
  }

  if (!hasHow) {
    issues.push({
      severity: 'warning',
      category: 'framework',
      message: 'Missing HOW section: document commands and workflows',
    });
  }

  return issues;
}

/**
 * Check for inline code blocks that may become stale
 */
function findInlineCodeBlocks(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const codeBlockRegex = /```[\s\S]*?```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlock = match[0];
    const codeLines = codeBlock.split('\n').length;

    // Find line number of this code block
    const preContent = content.substring(0, match.index);
    const lineNumber = preContent.split('\n').length;

    if (codeLines > 20) {
      issues.push({
        severity: 'warning',
        category: 'inline-code',
        message: `Large code block (${codeLines} lines) may become stale. Consider using file reference instead.`,
        line: lineNumber,
      });
    }
  }

  return issues;
}

/**
 * Validate CLAUDE.md content locally (fast checks)
 */
export function validateLocally(
  content: string,
  level: 'root' | 'domain' | 'subdomain' = 'root'
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  const lineCount = countLines(content);

  // Line count checks
  const maxLines = level === 'root' ? THRESHOLDS.ROOT_MAX_LINES : THRESHOLDS.DOMAIN_MAX_LINES;
  const optimalLines = level === 'root' ? THRESHOLDS.ROOT_OPTIMAL_LINES : THRESHOLDS.DOMAIN_OPTIMAL_LINES;

  if (lineCount > maxLines) {
    issues.push({
      severity: 'error',
      category: 'length',
      message: `File exceeds maximum ${maxLines} lines (has ${lineCount}). Consider splitting into hierarchical files.`,
    });
    suggestions.push('Extract domain-specific content into domain-level CLAUDE.md files');
  } else if (lineCount > optimalLines) {
    issues.push({
      severity: 'warning',
      category: 'length',
      message: `File exceeds optimal ${optimalLines} lines (has ${lineCount}). Review for non-universal content.`,
    });
  }

  // Check for style rules
  issues.push(...findStyleRules(content));
  if (issues.some(i => i.category === 'style-rule')) {
    suggestions.push('Move style rules to linter/formatter configuration (e.g., Biome, ESLint)');
  }

  // Check framework coverage
  issues.push(...checkFrameworkCoverage(content));

  // Check for inline code blocks
  issues.push(...findInlineCodeBlocks(content));
  if (issues.some(i => i.category === 'inline-code')) {
    suggestions.push('Replace large code blocks with file:line references');
  }

  // Calculate score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));

  return {
    isValid: errorCount === 0,
    lineCount,
    issues,
    score,
    suggestions,
  };
}

/**
 * Use Claude to provide deeper analysis of CLAUDE.md content
 */
export async function validateWithClaude(
  content: string,
  level: 'root' | 'domain' | 'subdomain' = 'root'
): Promise<ValidationResult & { aiAnalysis: string }> {
  // First run local validation
  const localResult = validateLocally(content, level);

  // Then get Claude's analysis
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: `You are a CLAUDE.md file reviewer. Analyze the provided file against these criteria:

1. WHY-WHAT-HOW framework: Does it explain purpose, stack, and workflow?
2. Universal applicability: Are all instructions relevant to every developer?
3. Instruction density: Are there redundant or verbose instructions?
4. File references: Does it use file:line references instead of inline code?
5. Linking: Does it link to related CLAUDE.md files?

Provide a brief analysis (3-5 sentences) with specific suggestions.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${level}-level CLAUDE.md file:\n\n${content}`
      }
    ],
  });

  const textContent = message.content.find((block: ContentBlock) => block.type === 'text');
  const aiAnalysis = textContent?.type === 'text' ? textContent.text : '';

  return {
    ...localResult,
    aiAnalysis,
  };
}

/**
 * Generate improvement suggestions based on validation results
 */
export function generateReport(result: ValidationResult): string {
  const lines: string[] = [
    '# CLAUDE.md Validation Report',
    '',
    `## Summary`,
    `- **Status**: ${result.isValid ? 'VALID' : 'NEEDS ATTENTION'}`,
    `- **Score**: ${result.score}/100`,
    `- **Line Count**: ${result.lineCount}`,
    '',
  ];

  if (result.issues.length > 0) {
    lines.push('## Issues', '');

    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      lines.push('### Errors', '');
      errors.forEach(issue => {
        const location = issue.line ? ` (line ${issue.line})` : '';
        lines.push(`- ${issue.message}${location}`);
      });
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('### Warnings', '');
      warnings.forEach(issue => {
        const location = issue.line ? ` (line ${issue.line})` : '';
        lines.push(`- ${issue.message}${location}`);
      });
      lines.push('');
    }
  }

  if (result.suggestions.length > 0) {
    lines.push('## Suggestions', '');
    result.suggestions.forEach(suggestion => {
      lines.push(`- ${suggestion}`);
    });
  }

  return lines.join('\n');
}

// Example usage when run directly
if (import.meta.main) {
  const exampleContent = `
# My Project

## Stack
- Node.js with TypeScript
- Use 2 spaces for indentation
- Always use single quotes

## Structure
- /src - source code
- /tests - test files

## Commands
bun install
bun test
bun build
`;

  console.log('Validating example CLAUDE.md...\n');
  const result = validateLocally(exampleContent, 'root');
  console.log(generateReport(result));
}
