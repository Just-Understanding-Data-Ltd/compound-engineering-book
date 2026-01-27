/**
 * Hierarchical CLAUDE.md Loader
 *
 * Demonstrates the hierarchical context loading pattern from Chapter 4.
 * When working on a file in a nested directory, this loader collects
 * all relevant CLAUDE.md files from root to the file's directory.
 *
 * Related to Chapter 4 sections:
 * - "Hierarchical CLAUDE.md for Scaling Codebases"
 * - "Case Study: Before and After"
 */

import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';

const client = new Anthropic();

// Type alias for content blocks
type ContentBlock = Anthropic.Messages.ContentBlock;

export interface LoadedContext {
  level: 'root' | 'domain' | 'subdomain';
  path: string;
  content: string;
  lineCount: number;
}

export interface HierarchicalContext {
  targetFile: string;
  files: LoadedContext[];
  totalLines: number;
  combinedContent: string;
}

/**
 * Walk up from a file path and collect all CLAUDE.md files
 */
export function collectClaudeMdFiles(
  targetFilePath: string,
  rootDir: string
): string[] {
  const claudeMdFiles: string[] = [];
  let currentDir = path.dirname(targetFilePath);
  const normalizedRoot = path.normalize(rootDir);

  // Walk up the directory tree
  while (currentDir.startsWith(normalizedRoot) || currentDir === normalizedRoot) {
    const claudeMdPath = path.join(currentDir, 'CLAUDE.md');

    // Check if CLAUDE.md exists (simulated for demo)
    claudeMdFiles.unshift(claudeMdPath); // Add to front so root is first

    // Move to parent directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached filesystem root
    currentDir = parentDir;
  }

  return claudeMdFiles;
}

/**
 * Determine the level of a CLAUDE.md file based on its path depth
 */
function determineLevel(
  claudeMdPath: string,
  rootDir: string
): 'root' | 'domain' | 'subdomain' {
  const relativePath = path.relative(rootDir, claudeMdPath);
  const depth = relativePath.split(path.sep).length - 1; // -1 for CLAUDE.md itself

  if (depth === 0) return 'root';
  if (depth <= 2) return 'domain';
  return 'subdomain';
}

/**
 * Load and combine hierarchical CLAUDE.md files
 */
export function loadHierarchicalContext(
  targetFilePath: string,
  rootDir: string,
  fileContents: Map<string, string> // Simulated file system
): HierarchicalContext {
  const claudeMdPaths = collectClaudeMdFiles(targetFilePath, rootDir);
  const files: LoadedContext[] = [];

  for (const claudeMdPath of claudeMdPaths) {
    const content = fileContents.get(claudeMdPath);
    if (content) {
      files.push({
        level: determineLevel(claudeMdPath, rootDir),
        path: claudeMdPath,
        content,
        lineCount: content.split('\n').length,
      });
    }
  }

  const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0);
  const combinedContent = files
    .map(f => `# From ${f.path} (${f.level})\n\n${f.content}`)
    .join('\n\n---\n\n');

  return {
    targetFile: targetFilePath,
    files,
    totalLines,
    combinedContent,
  };
}

/**
 * Calculate context relevance metrics
 */
export interface RelevanceMetrics {
  totalLines: number;
  relevantLines: number;
  relevancePercentage: number;
  loadedFiles: number;
}

export function calculateRelevance(
  context: HierarchicalContext,
  estimatedRelevantLines?: number
): RelevanceMetrics {
  // If not provided, estimate 90% relevance for hierarchical loading
  const relevantLines = estimatedRelevantLines ?? Math.floor(context.totalLines * 0.9);

  return {
    totalLines: context.totalLines,
    relevantLines,
    relevancePercentage: Math.round((relevantLines / context.totalLines) * 100),
    loadedFiles: context.files.length,
  };
}

/**
 * Compare monolithic vs hierarchical loading
 */
export interface ComparisonResult {
  monolithic: RelevanceMetrics;
  hierarchical: RelevanceMetrics;
  contextReduction: number;
  relevanceImprovement: number;
}

export function compareLoadingStrategies(
  monolithicLines: number,
  monolithicRelevantLines: number,
  hierarchicalContext: HierarchicalContext
): ComparisonResult {
  const monolithic: RelevanceMetrics = {
    totalLines: monolithicLines,
    relevantLines: monolithicRelevantLines,
    relevancePercentage: Math.round((monolithicRelevantLines / monolithicLines) * 100),
    loadedFiles: 1,
  };

  const hierarchical = calculateRelevance(hierarchicalContext);

  return {
    monolithic,
    hierarchical,
    contextReduction: Math.round(((monolithicLines - hierarchical.totalLines) / monolithicLines) * 100),
    relevanceImprovement: hierarchical.relevancePercentage - monolithic.relevancePercentage,
  };
}

/**
 * Use Claude to analyze loaded context for a specific task
 */
export async function analyzeContextForTask(
  context: HierarchicalContext,
  task: string
): Promise<{
  analysis: string;
  tokensUsed: { input: number; output: number };
}> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    system: context.combinedContent,
    messages: [
      {
        role: 'user',
        content: `Based on the project context, briefly explain (2-3 sentences) what patterns and conventions I should follow for this task: ${task}`,
      },
    ],
  });

  const textContent = message.content.find((block: ContentBlock) => block.type === 'text');

  return {
    analysis: textContent?.type === 'text' ? textContent.text : '',
    tokensUsed: {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    },
  };
}

/**
 * Demo the hierarchical loading pattern
 */
export async function runHierarchicalDemo(): Promise<void> {
  console.log('Hierarchical CLAUDE.md Loading Demo\n');
  console.log('===================================\n');

  // Simulated file system
  const fileContents = new Map<string, string>([
    ['/project/CLAUDE.md', `# My Project

## Stack
- TypeScript with strict mode
- Factory functions, never classes
- Result types for error handling

## Structure
- /packages/api - FastAPI backend
- /packages/web - Next.js frontend
- /packages/workflows - Temporal workflows
`],
    ['/project/packages/workflows/CLAUDE.md', `# Workflows Package

## Architecture
Temporal SDK for long-running background jobs.

## Patterns
- Workflows must be deterministic
- Use workflow.uuid() for randomness
- Use proxyActivities() for external calls
- Never use Date.now() directly

## Related
- Parent: See root CLAUDE.md
- Siblings: packages/api/CLAUDE.md
`],
  ]);

  // Load context for a workflows file
  const targetFile = '/project/packages/workflows/src/email-sender.ts';
  const context = loadHierarchicalContext(targetFile, '/project', fileContents);

  console.log('Target file:', targetFile);
  console.log('\nLoaded CLAUDE.md files:');
  context.files.forEach(f => {
    console.log(`  - ${f.path} (${f.level}, ${f.lineCount} lines)`);
  });
  console.log('\nTotal context:', context.totalLines, 'lines');

  // Compare with monolithic approach
  console.log('\nComparison with monolithic loading:');
  const comparison = compareLoadingStrategies(
    8500, // Monolithic file size
    800,  // Relevant lines in monolithic
    context
  );

  console.log(`  Monolithic: ${comparison.monolithic.totalLines} lines, ${comparison.monolithic.relevancePercentage}% relevant`);
  console.log(`  Hierarchical: ${comparison.hierarchical.totalLines} lines, ${comparison.hierarchical.relevancePercentage}% relevant`);
  console.log(`  Context reduction: ${comparison.contextReduction}%`);
  console.log(`  Relevance improvement: +${comparison.relevanceImprovement}%`);

  // Get Claude's analysis
  console.log('\nAsking Claude about task patterns...');
  const analysis = await analyzeContextForTask(
    context,
    'Create a workflow that sends welcome emails to new users'
  );

  console.log('\nClaude\'s guidance:');
  console.log(analysis.analysis);
  console.log(`\n(Used ${analysis.tokensUsed.input} input, ${analysis.tokensUsed.output} output tokens)`);
}

// Run demo if executed directly
if (import.meta.main) {
  runHierarchicalDemo().catch(console.error);
}
