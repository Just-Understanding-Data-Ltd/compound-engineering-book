/**
 * Chapter 15: Prompt Caching
 *
 * Implements cache-friendly prompt structures for 90% cost reduction
 * on repeated context. Cached tokens cost 10x less than regular tokens.
 */

import Anthropic from '@anthropic-ai/sdk';

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
 * Make an API call with prompt caching enabled
 */
export async function cachedApiCall(
  client: Anthropic,
  stableContext: string,
  dynamicTask: string,
  model: string = 'claude-sonnet-4-5-20250929',
  maxTokens: number = 4096
): Promise<{ response: Anthropic.Message; metrics: CacheMetrics }> {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: stableContext,
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: dynamicTask
        }
      ]
    }]
  });

  // Calculate cache metrics
  const cacheCreation = response.usage.cache_creation_input_tokens ?? 0;
  const cacheRead = response.usage.cache_read_input_tokens ?? 0;
  const regularInput = response.usage.input_tokens;

  const totalInput = cacheCreation + cacheRead + regularInput;
  const cacheHitRate = totalInput > 0 ? cacheRead / totalInput : 0;

  // Calculate savings (cached tokens cost 10x less)
  const regularCost = totalInput * 3 / 1_000_000;  // Sonnet pricing
  const actualCost = (regularInput * 3 + cacheRead * 0.3 + cacheCreation * 3.75) / 1_000_000;
  const savings = regularCost - actualCost;

  return {
    response,
    metrics: {
      cacheCreationTokens: cacheCreation,
      cacheReadTokens: cacheRead,
      regularInputTokens: regularInput,
      cacheHitRate,
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
  const charsPerToken = 4;
  let cacheableChars = 0;
  let dynamicChars = 0;

  for (const section of sections) {
    if (section.cacheable) {
      cacheableChars += section.content.length;
    } else {
      dynamicChars += section.content.length;
    }
  }

  const cacheableTokens = Math.ceil(cacheableChars / charsPerToken);
  const dynamicTokens = Math.ceil(dynamicChars / charsPerToken);
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
