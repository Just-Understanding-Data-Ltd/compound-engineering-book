/**
 * Chapter 15: Model Selector
 *
 * Implements intelligent model selection based on task complexity.
 * Routes tasks to the appropriate tier (Haiku/Sonnet/Opus) to
 * optimize cost while maintaining quality.
 */

import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';

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

// Model tiers with their corresponding costs and capabilities
export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export interface ModelConfig {
  tier: ModelTier;
  modelId: string;
  inputCostPerMTok: number;  // Cost per million tokens (input)
  outputCostPerMTok: number; // Cost per million tokens (output)
  typicalLatencyMs: number;  // Typical response time
  strengths: string[];
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  haiku: {
    tier: 'haiku',
    modelId: 'claude-3-5-haiku-20241022',
    inputCostPerMTok: 0.25,
    outputCostPerMTok: 1.25,
    typicalLatencyMs: 1500,
    strengths: [
      'File I/O operations',
      'Pattern matching',
      'Simple text transformations',
      'Quick edits',
      'Documentation updates'
    ]
  },
  sonnet: {
    tier: 'sonnet',
    modelId: 'claude-sonnet-4-5-20250929',
    inputCostPerMTok: 3.0,
    outputCostPerMTok: 15.0,
    typicalLatencyMs: 3000,
    strengths: [
      'Feature implementation',
      'Standard refactoring',
      'Test writing',
      'API endpoints',
      'Bug fixes'
    ]
  },
  opus: {
    tier: 'opus',
    modelId: 'claude-opus-4-5-20251101',
    inputCostPerMTok: 15.0,
    outputCostPerMTok: 75.0,
    typicalLatencyMs: 6000,
    strengths: [
      'System design',
      'Complex refactoring',
      'Security implementations',
      'Performance optimization',
      'Cross-service debugging'
    ]
  }
};

// Task complexity analysis for model selection
export interface TaskComplexity {
  filesAffected: number;
  linesOfCode: number;
  requiresArchitecture: boolean;
  securityCritical: boolean;
  multiStepPlan: boolean;
  hasTimeConstraint: boolean;
}

// Simple task patterns that can use Haiku
const SIMPLE_PATTERNS = [
  /^read\s/i,
  /^find\s/i,
  /^grep\s/i,
  /^list\s/i,
  /^add\s+(comment|type)/i,
  /^rename\s/i,
  /^search\s/i,
  /^show\s/i,
  /^get\s/i,
  /^count\s/i,
  /^check\s/i
];

// Complex patterns requiring Opus
const COMPLEX_PATTERNS = [
  /architect/i,
  /design.*system/i,
  /security.*implement/i,
  /refactor.*entire/i,
  /optimize.*performance/i,
  /debug.*cross.*service/i,
  /migration.*strategy/i
];

/**
 * Analyze task complexity from the task description
 */
export function analyzeTask(task: string): TaskComplexity {
  const lowerTask = task.toLowerCase();

  // Count file mentions for filesAffected estimate
  const filePatterns = [
    /\d+\s*files?/gi,
    /across\s+(?:the\s+)?(?:all\s+)?(\w+\s+)?files/gi,
    /multiple\s+files/gi
  ];

  let filesAffected = 1;
  for (const pattern of filePatterns) {
    const match = task.match(pattern);
    if (match) {
      const numMatch = match[0].match(/\d+/);
      if (numMatch) {
        filesAffected = Math.max(filesAffected, parseInt(numMatch[0], 10));
      } else if (/multiple|all|across/.test(match[0])) {
        filesAffected = Math.max(filesAffected, 5);
      }
    }
  }

  // Estimate lines of code based on task type
  let linesOfCode = 50; // default
  if (/simple|quick|small|minor/.test(lowerTask)) {
    linesOfCode = 20;
  } else if (/large|major|significant|extensive/.test(lowerTask)) {
    linesOfCode = 200;
  } else if (/entire|complete|full/.test(lowerTask)) {
    linesOfCode = 500;
  }

  return {
    filesAffected,
    linesOfCode,
    requiresArchitecture: /architect|design|structure|pattern/i.test(task),
    securityCritical: /security|auth|password|token|encrypt|secret/i.test(task),
    multiStepPlan: /then|after|first|next|finally|step/i.test(task) ||
                   task.includes(',') && task.split(',').length > 2,
    hasTimeConstraint: /quick|fast|urgent|asap|immediately/i.test(task)
  };
}

/**
 * Select the optimal model tier for a given task
 */
export function selectModel(task: string, complexity?: TaskComplexity): ModelTier {
  // Use provided complexity or analyze the task
  const analysis = complexity || analyzeTask(task);

  // Security-critical tasks always use Opus
  if (analysis.securityCritical) {
    return 'opus';
  }

  // Architecture and multi-step planning use Opus
  if (analysis.requiresArchitecture || analysis.multiStepPlan) {
    return 'opus';
  }

  // Large changes use Opus
  if (analysis.filesAffected > 5 || analysis.linesOfCode > 500) {
    return 'opus';
  }

  // Check for complex patterns
  if (COMPLEX_PATTERNS.some(p => p.test(task))) {
    return 'opus';
  }

  // Multi-file or medium-sized work uses Sonnet
  if (analysis.filesAffected > 1 || analysis.linesOfCode > 50) {
    return 'sonnet';
  }

  // Simple patterns use Haiku (especially with time constraints)
  if (SIMPLE_PATTERNS.some(p => p.test(task))) {
    return 'haiku';
  }

  // If time-constrained, prefer Haiku for speed
  if (analysis.hasTimeConstraint) {
    return 'haiku';
  }

  // Default to Sonnet as the balanced choice
  return 'sonnet';
}

/**
 * Get the full model configuration for a tier
 */
export function getModelConfig(tier: ModelTier): ModelConfig {
  return MODEL_CONFIGS[tier];
}

/**
 * Calculate estimated cost for a task
 */
export function estimateCost(
  tier: ModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[tier];
  const inputCost = (inputTokens / 1_000_000) * config.inputCostPerMTok;
  const outputCost = (outputTokens / 1_000_000) * config.outputCostPerMTok;
  return inputCost + outputCost;
}

/**
 * Compare costs between models
 */
export function compareCosts(
  inputTokens: number,
  outputTokens: number
): Record<ModelTier, { cost: number; relative: string }> {
  const costs = {
    haiku: estimateCost('haiku', inputTokens, outputTokens),
    sonnet: estimateCost('sonnet', inputTokens, outputTokens),
    opus: estimateCost('opus', inputTokens, outputTokens)
  };

  const baseline = costs.sonnet;

  return {
    haiku: {
      cost: costs.haiku,
      relative: `${((costs.haiku / baseline) * 100).toFixed(0)}% of Sonnet`
    },
    sonnet: {
      cost: costs.sonnet,
      relative: '100% (baseline)'
    },
    opus: {
      cost: costs.opus,
      relative: `${((costs.opus / baseline) * 100).toFixed(0)}% of Sonnet`
    }
  };
}

/**
 * Execute a task with the selected model using Agent SDK
 */
export async function executeWithSelectedModel(
  task: string,
  options?: {
    forceModel?: ModelTier;
  }
): Promise<{ response: string; tier: ModelTier; config: ModelConfig }> {
  const tier = options?.forceModel || selectModel(task);
  const config = getModelConfig(tier);

  const stream = query({
    prompt: task,
    options: {
      model: config.modelId,
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

  return { response: responseText, tier, config };
}

// Demo: Show model selection in action
async function demo() {
  console.log('=== Model Selector Demo ===\n');

  const tasks = [
    'Read src/api/users.ts and list all exported functions',
    'Implement user authentication with JWT tokens',
    'Design a new microservices architecture for the payment system',
    'Rename the variable userName to username in the file',
    'Refactor the entire authentication module across 10 files',
    'Quick: add a comment explaining this function'
  ];

  console.log('Task Classification:\n');
  for (const task of tasks) {
    const tier = selectModel(task);
    const analysis = analyzeTask(task);
    console.log(`Task: "${task.substring(0, 60)}${task.length > 60 ? '...' : ''}"`);
    console.log(`  Model: ${tier.toUpperCase()}`);
    console.log(`  Complexity: files=${analysis.filesAffected}, lines=${analysis.linesOfCode}`);
    console.log(`  Flags: arch=${analysis.requiresArchitecture}, security=${analysis.securityCritical}`);
    console.log('');
  }

  console.log('Cost Comparison (5K input, 500 output tokens):\n');
  const comparison = compareCosts(5000, 500);
  for (const [tier, data] of Object.entries(comparison)) {
    console.log(`  ${tier}: $${data.cost.toFixed(6)} (${data.relative})`);
  }
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
