/**
 * Chapter 15: Cost Protection
 *
 * Implements multi-layer cost protection to prevent runaway API costs.
 * Four layers: job timeout, token caps, input limits, budget alerts.
 */

import Anthropic from '@anthropic-ai/sdk';
import { estimateCost, type ModelTier } from './model-selector';

// Budget configuration
export interface BudgetConfig {
  dailyLimitDollars: number;
  monthlyLimitDollars: number;
  alertThreshold: number;  // 0-1, triggers alert when this % of budget is reached
  hardStop: boolean;       // If true, block requests when limit exceeded
}

// Token limits configuration
export interface TokenLimits {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxFilesPerRequest: number;
  maxLinesPerFile: number;
}

// Usage tracking
export interface UsageRecord {
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  task: string;
}

// In-memory usage store (production would use database)
const usageStore: UsageRecord[] = [];
let dailySpend = 0;
let monthlySpend = 0;
let lastResetDay = new Date().getDate();
let lastResetMonth = new Date().getMonth();

/**
 * Default budget configuration
 */
export const DEFAULT_BUDGET: BudgetConfig = {
  dailyLimitDollars: 10,
  monthlyLimitDollars: 100,
  alertThreshold: 0.8,
  hardStop: true
};

/**
 * Default token limits
 */
export const DEFAULT_TOKEN_LIMITS: TokenLimits = {
  maxInputTokens: 50000,
  maxOutputTokens: 4096,
  maxFilesPerRequest: 50,
  maxLinesPerFile: 500
};

/**
 * Patterns for files to exclude from context
 */
export const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '*.lock',
  'dist/**',
  'build/**',
  '.git/**',
  '*.min.js',
  '*.map',
  '*.png', '*.jpg', '*.gif', '*.svg',
  '*.woff', '*.woff2', '*.ttf'
];

/**
 * Reset daily/monthly counters if needed
 */
function checkAndResetCounters(): void {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();

  if (currentDay !== lastResetDay) {
    dailySpend = 0;
    lastResetDay = currentDay;
  }

  if (currentMonth !== lastResetMonth) {
    monthlySpend = 0;
    lastResetMonth = currentMonth;
  }
}

/**
 * Check if operation is within budget
 */
export function checkBudget(
  estimatedCost: number,
  config: BudgetConfig = DEFAULT_BUDGET
): { allowed: boolean; warning?: string; error?: string } {
  checkAndResetCounters();

  // Check daily limit
  if (dailySpend + estimatedCost > config.dailyLimitDollars) {
    if (config.hardStop) {
      return {
        allowed: false,
        error: `Daily budget exceeded: $${dailySpend.toFixed(2)} of $${config.dailyLimitDollars}`
      };
    }
    return {
      allowed: true,
      warning: `Daily budget exceeded: $${dailySpend.toFixed(2)} of $${config.dailyLimitDollars}`
    };
  }

  // Check monthly limit
  if (monthlySpend + estimatedCost > config.monthlyLimitDollars) {
    if (config.hardStop) {
      return {
        allowed: false,
        error: `Monthly budget exceeded: $${monthlySpend.toFixed(2)} of $${config.monthlyLimitDollars}`
      };
    }
    return {
      allowed: true,
      warning: `Monthly budget exceeded: $${monthlySpend.toFixed(2)} of $${config.monthlyLimitDollars}`
    };
  }

  // Check alert threshold
  const dailyRatio = (dailySpend + estimatedCost) / config.dailyLimitDollars;
  const monthlyRatio = (monthlySpend + estimatedCost) / config.monthlyLimitDollars;

  if (dailyRatio >= config.alertThreshold) {
    return {
      allowed: true,
      warning: `Approaching daily limit: ${(dailyRatio * 100).toFixed(0)}% used`
    };
  }

  if (monthlyRatio >= config.alertThreshold) {
    return {
      allowed: true,
      warning: `Approaching monthly limit: ${(monthlyRatio * 100).toFixed(0)}% used`
    };
  }

  return { allowed: true };
}

/**
 * Record usage and update counters
 */
export function recordUsage(record: Omit<UsageRecord, 'timestamp'>): void {
  const fullRecord: UsageRecord = {
    ...record,
    timestamp: new Date()
  };

  usageStore.push(fullRecord);
  dailySpend += record.cost;
  monthlySpend += record.cost;
}

/**
 * Get current usage statistics
 */
export function getUsageStats(config: BudgetConfig = DEFAULT_BUDGET): {
  dailySpend: number;
  monthlySpend: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  requestCount: number;
  averageCostPerRequest: number;
} {
  checkAndResetCounters();

  return {
    dailySpend,
    monthlySpend,
    dailyRemaining: Math.max(0, config.dailyLimitDollars - dailySpend),
    monthlyRemaining: Math.max(0, config.monthlyLimitDollars - monthlySpend),
    requestCount: usageStore.length,
    averageCostPerRequest: usageStore.length > 0
      ? usageStore.reduce((sum, r) => sum + r.cost, 0) / usageStore.length
      : 0
  };
}

/**
 * Truncate input to stay within token limits
 */
export function truncateInput(
  input: string,
  maxTokens: number,
  charsPerToken: number = 4
): string {
  const maxChars = maxTokens * charsPerToken;

  if (input.length <= maxChars) {
    return input;
  }

  // Truncate and add indicator
  const truncated = input.substring(0, maxChars - 50);
  return truncated + '\n\n[Input truncated to stay within token limits]';
}

/**
 * Filter files based on exclude patterns
 */
export function filterFiles(
  files: string[],
  limits: TokenLimits = DEFAULT_TOKEN_LIMITS,
  excludePatterns: string[] = EXCLUDE_PATTERNS
): { included: string[]; excluded: string[]; sampled: boolean } {
  // Filter out excluded patterns
  const included = files.filter(file => {
    for (const pattern of excludePatterns) {
      // Simple glob matching
      // 1. Replace ** with placeholder
      // 2. Escape dots
      // 3. Replace * with [^/]*
      // 4. Replace placeholder with .*
      const regex = new RegExp(
        '^' + pattern
          .replace(/\*\*/g, '\x00GLOB_STAR\x00')  // Placeholder for **
          .replace(/\./g, '\\.')                   // Escape dots
          .replace(/\*/g, '[^/]*')                 // Single * becomes [^/]*
          .replace(/\x00GLOB_STAR\x00/g, '.*')     // Restore ** as .*
        + '$'
      );
      if (regex.test(file)) {
        return false;
      }
    }
    return true;
  });

  const excluded = files.filter(f => !included.includes(f));
  let sampled = false;

  // Sample if too many files
  if (included.length > limits.maxFilesPerRequest) {
    console.warn(`Sampling ${limits.maxFilesPerRequest} of ${included.length} files`);
    included.splice(limits.maxFilesPerRequest);
    sampled = true;
  }

  return { included, excluded, sampled };
}

/**
 * Estimate tokens for a piece of text
 */
export function estimateTokens(text: string, charsPerToken: number = 4): number {
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Create a protected API call with all safeguards
 */
export async function protectedApiCall(
  client: Anthropic,
  task: string,
  model: string,
  tier: ModelTier,
  options?: {
    budget?: BudgetConfig;
    tokenLimits?: TokenLimits;
    timeoutMs?: number;
  }
): Promise<Anthropic.Message | null> {
  const budget = options?.budget || DEFAULT_BUDGET;
  const limits = options?.tokenLimits || DEFAULT_TOKEN_LIMITS;
  const timeoutMs = options?.timeoutMs || 30000;

  // Layer 1: Estimate cost and check budget
  const estimatedInputTokens = estimateTokens(task);
  const estimatedOutputTokens = limits.maxOutputTokens;
  const estimatedCost = estimateCost(tier, estimatedInputTokens, estimatedOutputTokens);

  const budgetCheck = checkBudget(estimatedCost, budget);
  if (!budgetCheck.allowed) {
    console.error(`Budget check failed: ${budgetCheck.error}`);
    return null;
  }

  if (budgetCheck.warning) {
    console.warn(`Budget warning: ${budgetCheck.warning}`);
  }

  // Layer 2: Truncate input if needed
  const truncatedTask = truncateInput(task, limits.maxInputTokens);

  // Layer 3: Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: limits.maxOutputTokens,
      messages: [{
        role: 'user',
        content: truncatedTask
      }]
    });

    clearTimeout(timeoutId);

    // Record actual usage
    const actualCost = estimateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    recordUsage({
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: actualCost,
      task: task.substring(0, 100)
    });

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timed out after ${timeoutMs}ms`);
    } else {
      throw error;
    }

    return null;
  }
}

/**
 * GitHub Actions timeout helper
 */
export function getGitHubActionsTimeoutConfig(): {
  jobTimeoutMinutes: number;
  stepTimeoutMinutes: number;
  requestTimeoutMs: number;
} {
  return {
    jobTimeoutMinutes: 15,    // Hard cap on entire job
    stepTimeoutMinutes: 10,   // AI task step (leaves buffer)
    requestTimeoutMs: 30000   // Individual API call
  };
}

// Demo: Show cost protection in action
async function demo() {
  console.log('=== Cost Protection Demo ===\n');

  // Demo 1: Budget checking
  console.log('1. Budget Checking:');
  const budget: BudgetConfig = {
    dailyLimitDollars: 5,
    monthlyLimitDollars: 50,
    alertThreshold: 0.8,
    hardStop: true
  };

  // Simulate some spending
  recordUsage({ model: 'claude-sonnet', inputTokens: 5000, outputTokens: 500, cost: 0.02, task: 'test' });
  recordUsage({ model: 'claude-sonnet', inputTokens: 5000, outputTokens: 500, cost: 0.02, task: 'test' });

  const stats = getUsageStats(budget);
  console.log(`  Daily spend: $${stats.dailySpend.toFixed(4)}`);
  console.log(`  Daily remaining: $${stats.dailyRemaining.toFixed(2)}`);
  console.log(`  Request count: ${stats.requestCount}`);
  console.log('');

  // Demo 2: File filtering
  console.log('2. File Filtering:');
  const testFiles = [
    'src/index.ts',
    'src/utils.ts',
    'node_modules/lodash/index.js',
    'dist/bundle.js',
    'package-lock.json',
    'src/api/users.ts'
  ];

  const filtered = filterFiles(testFiles);
  console.log(`  Total files: ${testFiles.length}`);
  console.log(`  Included: ${filtered.included.join(', ')}`);
  console.log(`  Excluded: ${filtered.excluded.join(', ')}`);
  console.log('');

  // Demo 3: Input truncation
  console.log('3. Input Truncation:');
  const longInput = 'x'.repeat(10000);
  const truncated = truncateInput(longInput, 1000);
  console.log(`  Original length: ${longInput.length}`);
  console.log(`  Truncated length: ${truncated.length}`);
  console.log(`  Ends with indicator: ${truncated.endsWith('[Input truncated to stay within token limits]')}`);
  console.log('');

  // Demo 4: GitHub Actions config
  console.log('4. GitHub Actions Timeout Config:');
  const ghConfig = getGitHubActionsTimeoutConfig();
  console.log(`  Job timeout: ${ghConfig.jobTimeoutMinutes} minutes`);
  console.log(`  Step timeout: ${ghConfig.stepTimeoutMinutes} minutes`);
  console.log(`  Request timeout: ${ghConfig.requestTimeoutMs}ms`);
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
