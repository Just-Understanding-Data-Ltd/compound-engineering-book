/**
 * Chapter 15: Prompt Caching
 *
 * Implements cache-friendly prompt structures for 90% cost reduction
 * on repeated context. Cached tokens cost 10x less than regular tokens.
 */

import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { countTokens } from '../shared/tokenizer';

/**
 * Extract text content from an Agent SDK message
 */
function extractTextContent(message: SDKMessage): string {
  if (message.type !== 'assistant') return '';
  const content = message.message.content;
  if (typeof content === 'string') return content;
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && 'text' in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join('');
}

// Cache metrics
export interface CacheMetrics {
  cacheCreationTokens: number;
  cacheReadTokens: number;
  regularInputTokens: number;
  cacheHitRate: number;
  costSavings: number;
}

// Prompt section with caching control
export interface PromptSection {
  label: string;
  content: string;
  cacheable: boolean;
}

/**
 * Build a cache-friendly prompt by placing stable content first
 */
export function buildCacheFriendlyPrompt(sections: PromptSection[]): string {
  // Sort: cacheable content first, then non-cacheable
  const sorted = [...sections].sort((a, b) => {
    if (a.cacheable && !b.cacheable) return -1;
    if (!a.cacheable && b.cacheable) return 1;
    return 0;
  });

  return sorted.map(s => `## ${s.label}\n${s.content}`).join('\n\n---\n\n');
}

/**
 * Create a standard project context structure for caching
 */
export function createProjectContext(config: {
  projectName: string;
  architecture?: string;
  codingStandards?: string;
  schemas?: string;
  apiSpecs?: string;
}): PromptSection[] {
  const sections: PromptSection[] = [];

  // Project overview (stable, cacheable)
  sections.push({
    label: 'Project Overview',
    content: `Project: ${config.projectName}\n\nThis is a TypeScript project using modern best practices.`,
    cacheable: true
  });

  // Architecture (stable, cacheable)
  if (config.architecture) {
    sections.push({
      label: 'Architecture',
      content: config.architecture,
      cacheable: true
    });
  }

  // Coding standards (stable, cacheable)
  if (config.codingStandards) {
    sections.push({
      label: 'Coding Standards',
      content: config.codingStandards,
      cacheable: true
    });
  }

  // Schemas (stable, cacheable)
  if (config.schemas) {
    sections.push({
      label: 'Schema Definitions',
      content: config.schemas,
      cacheable: true
    });
  }

  // API specs (stable, cacheable)
  if (config.apiSpecs) {
    sections.push({
      label: 'API Specifications',
      content: config.apiSpecs,
      cacheable: true
    });
  }

  return sections;
}

/**
 * Add a dynamic task to a cacheable context
 */
export function addTaskToContext(
  stableContext: PromptSection[],
  task: string,
  additionalContext?: string
): PromptSection[] {
  const sections = [...stableContext];

  // Add current request (dynamic, not cacheable)
  sections.push({
    label: 'Current Request',
    content: task,
    cacheable: false
  });

  if (additionalContext) {
    sections.push({
      label: 'Additional Context',
      content: additionalContext,
      cacheable: false
    });
  }

  return sections;
}

/**
 * Make an API call with cache-friendly prompt structure using Agent SDK
 *
 * Note: The Agent SDK handles caching automatically. This function demonstrates
 * structuring prompts for optimal caching by placing stable context first.
 */
export async function cachedApiCall(
  stableContext: string,
  dynamicTask: string,
  model: string = 'claude-sonnet-4-5-20250929'
): Promise<{ response: string; metrics: CacheMetrics }> {
  // Structure prompt with stable context first for optimal caching
  const prompt = `${stableContext}\n\n---\n\n## Current Task\n${dynamicTask}`;

  const stream = query({
    prompt,
    options: {
      model,
      allowedTools: []
    }
  });

  let responseText = '';
  for await (const message of stream) {
    const text = extractTextContent(message);
    if (text) {
      responseText += text;
    }
  }

  // Count tokens using tiktoken for accurate measurement
  // In production, the API returns actual cache_creation_input_tokens and cache_read_input_tokens
  const stableTokens = countTokens(stableContext);
  const dynamicTokens = countTokens(dynamicTask);
  const totalTokens = stableTokens + dynamicTokens;

  // Estimate: first call creates cache, subsequent calls read from cache
  // This is a simplified model for demonstration
  const estimatedCacheHitRate = stableTokens > 1024 ? 0.8 : 0; // Cache requires 1024+ tokens

  // Calculate savings (cached tokens cost 10x less)
  const regularCost = totalTokens * 3 / 1_000_000;  // Sonnet pricing
  const actualCost = (dynamicTokens * 3 + stableTokens * 0.3) / 1_000_000;
  const savings = regularCost - actualCost;

  return {
    response: responseText,
    metrics: {
      cacheCreationTokens: stableTokens,
      cacheReadTokens: Math.floor(stableTokens * estimatedCacheHitRate),
      regularInputTokens: dynamicTokens,
      cacheHitRate: estimatedCacheHitRate,
      costSavings: savings
    }
  };
}

/**
 * Analyze prompt structure for cache efficiency
 */
export function analyzeCacheEfficiency(sections: PromptSection[]): {
  cacheableTokens: number;
  dynamicTokens: number;
  cacheEfficiency: number;
  recommendations: string[];
} {
  let cacheableTokens = 0;
  let dynamicTokens = 0;

  // Count tokens using tiktoken for accurate measurement
  for (const section of sections) {
    const tokens = countTokens(section.content);
    if (section.cacheable) {
      cacheableTokens += tokens;
    } else {
      dynamicTokens += tokens;
    }
  }

  const totalTokens = cacheableTokens + dynamicTokens;
  const cacheEfficiency = totalTokens > 0 ? cacheableTokens / totalTokens : 0;

  const recommendations: string[] = [];

  if (cacheEfficiency < 0.5) {
    recommendations.push('Move more stable content to cacheable sections');
  }

  if (cacheableTokens < 1024) {
    recommendations.push('Add more context to reach 1024 token minimum for caching');
  }

  if (sections.some(s => s.cacheable && s.content.length > 50000)) {
    recommendations.push('Consider splitting large cacheable sections');
  }

  // Check section order
  let foundDynamic = false;
  for (const section of sections) {
    if (!section.cacheable) {
      foundDynamic = true;
    } else if (foundDynamic && section.cacheable) {
      recommendations.push('Cacheable sections should come before dynamic sections');
      break;
    }
  }

  return {
    cacheableTokens,
    dynamicTokens,
    cacheEfficiency,
    recommendations
  };
}

/**
 * Optimize prompt structure for better caching
 */
export function optimizeForCaching(prompt: string): {
  stableContext: string;
  dynamicContent: string;
  splitPoint: number;
} {
  const lines = prompt.split('\n');
  let splitPoint = lines.length;

  // Find the last occurrence of stable markers
  const stableMarkers = [
    '# Current Request',
    '## Current Request',
    '# Task',
    '## Task',
    '# Your Task',
    '## Your Task',
    '---\n# ',
    '---\n## '
  ];

  for (const marker of stableMarkers) {
    const idx = prompt.lastIndexOf(marker);
    if (idx !== -1) {
      // Find line number
      const beforeMarker = prompt.substring(0, idx);
      const lineNum = beforeMarker.split('\n').length - 1;
      if (lineNum < splitPoint) {
        splitPoint = lineNum;
      }
    }
  }

  const stableLines = lines.slice(0, splitPoint);
  const dynamicLines = lines.slice(splitPoint);

  return {
    stableContext: stableLines.join('\n'),
    dynamicContent: dynamicLines.join('\n'),
    splitPoint
  };
}

/**
 * Track cache performance over multiple requests
 */
export class CacheTracker {
  private metrics: CacheMetrics[] = [];

  record(metrics: CacheMetrics): void {
    this.metrics.push(metrics);
  }

  getAverageHitRate(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length;
  }

  getTotalSavings(): number {
    return this.metrics.reduce((sum, m) => sum + m.costSavings, 0);
  }

  getSummary(): {
    requestCount: number;
    averageHitRate: number;
    totalSavings: number;
    totalCacheReads: number;
    totalCacheCreations: number;
  } {
    return {
      requestCount: this.metrics.length,
      averageHitRate: this.getAverageHitRate(),
      totalSavings: this.getTotalSavings(),
      totalCacheReads: this.metrics.reduce((sum, m) => sum + m.cacheReadTokens, 0),
      totalCacheCreations: this.metrics.reduce((sum, m) => sum + m.cacheCreationTokens, 0)
    };
  }
}

// Demo: Show prompt caching in action
async function demo() {
  console.log('=== Prompt Caching Demo ===\n');

  // Create project context
  console.log('1. Creating Project Context:');
  const projectContext = createProjectContext({
    projectName: 'MyApp',
    architecture: `
The application follows a clean architecture pattern:
- Presentation layer: React components
- Application layer: Use cases and services
- Domain layer: Business logic and entities
- Infrastructure layer: Database and external APIs
    `.trim(),
    codingStandards: `
- Use TypeScript strict mode
- Prefer async/await over callbacks
- Use named exports
- Maximum 200 lines per file
- All functions must have return types
    `.trim(),
    schemas: `
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
}
    `.trim()
  });

  console.log(`  Created ${projectContext.length} cacheable sections\n`);

  // Add a task
  console.log('2. Adding Dynamic Task:');
  const fullContext = addTaskToContext(
    projectContext,
    'Implement user registration with email validation'
  );

  const prompt = buildCacheFriendlyPrompt(fullContext);
  console.log(`  Full prompt length: ${prompt.length} chars\n`);

  // Analyze cache efficiency
  console.log('3. Cache Efficiency Analysis:');
  const analysis = analyzeCacheEfficiency(fullContext);
  console.log(`  Cacheable tokens: ${analysis.cacheableTokens}`);
  console.log(`  Dynamic tokens: ${analysis.dynamicTokens}`);
  console.log(`  Cache efficiency: ${(analysis.cacheEfficiency * 100).toFixed(1)}%`);

  if (analysis.recommendations.length > 0) {
    console.log('  Recommendations:');
    for (const rec of analysis.recommendations) {
      console.log(`    - ${rec}`);
    }
  }
  console.log('');

  // Demo prompt optimization
  console.log('4. Prompt Optimization:');
  const samplePrompt = `
# Project Context
This is a TypeScript project using React and Node.js.

# Coding Standards
Use ESLint and Prettier for code formatting.

---
# Current Request
Add a logout button to the header component.
  `.trim();

  const optimized = optimizeForCaching(samplePrompt);
  console.log(`  Stable context: ${optimized.stableContext.length} chars`);
  console.log(`  Dynamic content: ${optimized.dynamicContent.length} chars`);
  console.log(`  Split at line: ${optimized.splitPoint}`);
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
