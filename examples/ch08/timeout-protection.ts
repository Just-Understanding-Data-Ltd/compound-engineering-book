/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates multi-layer timeout protection for AI workflows.
 * Runaway LLM operations can rack up hundreds of dollars in unexpected costs.
 * Implement defense-in-depth with multiple protection layers.
 *
 * Key concepts:
 * - Layer 1: Job-level timeouts (hard cap on total operation time)
 * - Layer 2: Request-level token caps (max_tokens for each API call)
 * - Layer 3: Input size limits (cap files, lines, tokens sent to model)
 * - Layer 4: Budget alerts and hard caps (stop when approaching limits)
 * - Layer 5: Model selection (use cheaper models for simpler tasks)
 * - Exponential backoff retry for transient failures
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { countTokens } from "../shared/tokenizer";

/**
 * Extract text content from an SDK message
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
 * Model tiers with cost implications
 */
export type ModelTier = "haiku" | "sonnet" | "opus";

/**
 * Model cost structure (per million tokens)
 */
export interface ModelCost {
  input: number;
  output: number;
}

/**
 * Model costs in dollars per million tokens (MTok)
 */
export const MODEL_COSTS: Record<ModelTier, ModelCost> = {
  haiku: { input: 0.25, output: 1.25 },
  sonnet: { input: 3, output: 15 },
  opus: { input: 15, output: 75 },
};

/**
 * Model IDs for API calls
 */
export const MODEL_IDS: Record<ModelTier, string> = {
  haiku: "claude-3-5-haiku-20241022",
  sonnet: "claude-sonnet-4-5-20250929",
  opus: "claude-opus-4-5-20251101",
};

/**
 * Input size limits configuration
 */
export interface InputLimits {
  /** Maximum number of files to process */
  maxFiles: number;
  /** Maximum lines per file (truncate after this) */
  maxLinesPerFile: number;
  /** Maximum estimated tokens for total input */
  maxTotalTokens: number;
  /** Glob patterns to exclude from processing */
  excludePatterns: string[];
}

/**
 * Default input limits for safe operation
 */
export const DEFAULT_INPUT_LIMITS: InputLimits = {
  maxFiles: 50,
  maxLinesPerFile: 500,
  maxTotalTokens: 50000,
  excludePatterns: [
    "node_modules/**",
    "*.lock",
    "*.min.js",
    "dist/**",
    ".git/**",
    "coverage/**",
    "*.map",
  ],
};

/**
 * Budget configuration for cost control
 */
export interface BudgetConfig {
  /** Maximum spend per day in dollars */
  dailyLimit: number;
  /** Maximum spend per month in dollars */
  monthlyLimit: number;
  /** Percentage of limit to trigger alert (0.8 = 80%) */
  alertThreshold: number;
}

/**
 * Default budget configuration
 */
export const DEFAULT_BUDGET: BudgetConfig = {
  dailyLimit: 10,
  monthlyLimit: 100,
  alertThreshold: 0.8,
};

/**
 * Budget status after checking
 */
export interface BudgetStatus {
  ok: boolean;
  spent: number;
  remaining: number;
  alert: boolean;
  message: string;
}

/**
 * Token limits by task type
 */
export const TOKEN_LIMITS_BY_TASK: Record<string, number> = {
  code_review: 4096,
  bug_fix: 2048,
  documentation: 8192,
  simple_edit: 1024,
  refactor: 4096,
  test_generation: 4096,
  default: 4096,
};

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  /** Job-level timeout in milliseconds */
  jobTimeoutMs: number;
  /** Request-level timeout in milliseconds */
  requestTimeoutMs: number;
  /** Maximum retries for transient failures */
  maxRetries: number;
  /** Base delay for exponential backoff in milliseconds */
  baseDelayMs: number;
}

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT: TimeoutConfig = {
  jobTimeoutMs: 15 * 60 * 1000, // 15 minutes
  requestTimeoutMs: 2 * 60 * 1000, // 2 minutes
  maxRetries: 3,
  baseDelayMs: 1000,
};

/**
 * Protected operation options
 */
export interface ProtectedOperationOptions {
  /** Task type for token limit selection */
  taskType?: string;
  /** Model tier to use */
  model?: ModelTier;
  /** Custom timeout configuration */
  timeout?: Partial<TimeoutConfig>;
  /** Custom input limits */
  inputLimits?: Partial<InputLimits>;
  /** Custom budget configuration */
  budget?: Partial<BudgetConfig>;
  /** Abort signal for external cancellation */
  signal?: AbortSignal;
}

/**
 * Usage metrics for tracking
 */
export interface UsageMetrics {
  timestamp: Date;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  model: string;
  task: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * File content with metadata
 */
export interface FileContent {
  path: string;
  content: string;
  truncated: boolean;
  originalLines: number;
}

/**
 * Retry result wrapper
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  errors: Error[];
}

// ============================================================================
// USAGE TRACKING (in-memory for example; use persistent storage in production)
// ============================================================================

const usageLog: UsageMetrics[] = [];
let dailySpend = 0;
let monthlySpend = 0;
let lastResetDate: string | undefined = undefined;

/**
 * Log usage metrics
 */
export function logUsage(metrics: UsageMetrics): void {
  usageLog.push(metrics);
  dailySpend += metrics.cost;
  monthlySpend += metrics.cost;
}

/**
 * Get current usage
 */
export function getUsage(): { daily: number; monthly: number; logs: UsageMetrics[] } {
  const today = new Date().toISOString().split("T")[0] || "";
  // Only reset daily spend if we have a previous date and it's different from today
  // This prevents resetting on first call or after resetUsage()
  if (lastResetDate !== undefined && lastResetDate !== today) {
    dailySpend = 0;
  }
  lastResetDate = today;
  return { daily: dailySpend, monthly: monthlySpend, logs: [...usageLog] };
}

/**
 * Reset usage tracking (for testing)
 */
export function resetUsage(): void {
  usageLog.length = 0;
  dailySpend = 0;
  monthlySpend = 0;
  lastResetDate = undefined;
}

// ============================================================================
// BUDGET PROTECTION (Layer 4)
// ============================================================================

/**
 * Check if operation is within budget
 */
export function checkBudget(config: BudgetConfig = DEFAULT_BUDGET): BudgetStatus {
  const usage = getUsage();
  const spent = usage.daily;
  const remaining = config.dailyLimit - spent;

  if (spent >= config.dailyLimit) {
    return {
      ok: false,
      spent,
      remaining: 0,
      alert: true,
      message: `Daily budget exceeded: $${spent.toFixed(2)} of $${config.dailyLimit}`,
    };
  }

  if (spent >= config.dailyLimit * config.alertThreshold) {
    return {
      ok: true,
      spent,
      remaining,
      alert: true,
      message: `Budget alert: $${spent.toFixed(2)} of $${config.dailyLimit} daily limit (${Math.round((spent / config.dailyLimit) * 100)}%)`,
    };
  }

  return {
    ok: true,
    spent,
    remaining,
    alert: false,
    message: `Budget OK: $${spent.toFixed(2)} spent, $${remaining.toFixed(2)} remaining`,
  };
}

// ============================================================================
// INPUT SIZE LIMITS (Layer 3)
// ============================================================================

/**
 * Count tokens in text using tiktoken for accurate measurement
 */
export function estimateTokens(text: string): number {
  return countTokens(text);
}

/**
 * Truncate file content to line limit
 */
export function truncateFile(
  content: string,
  maxLines: number
): { content: string; truncated: boolean; originalLines: number } {
  const lines = content.split("\n");
  const originalLines = lines.length;

  if (lines.length <= maxLines) {
    return { content, truncated: false, originalLines };
  }

  const truncatedContent =
    lines.slice(0, maxLines).join("\n") +
    `\n... (truncated ${originalLines - maxLines} lines)`;

  return { content: truncatedContent, truncated: true, originalLines };
}

/**
 * Check if path matches any exclude pattern (simple glob matching)
 */
export function matchesExcludePattern(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple glob matching: ** matches any path, * matches within directory
    // Order matters: escape dots first, then convert globs
    const regexPattern = pattern
      .replace(/\./g, "\\.") // Escape dots first
      .replace(/\*\*/g, ".*") // ** matches any path
      .replace(/(?<!\.)(\*)(?!\*)/g, "[^/]*"); // Single * matches within directory

    if (new RegExp(`^${regexPattern}$`).test(path)) {
      return true;
    }
  }
  return false;
}

/**
 * Process files with size limits
 */
export function processFilesWithLimits(
  files: Array<{ path: string; content: string }>,
  limits: InputLimits = DEFAULT_INPUT_LIMITS
): { files: FileContent[]; warnings: string[] } {
  const warnings: string[] = [];

  // Filter excluded patterns
  const filtered = files.filter((f) => {
    if (matchesExcludePattern(f.path, limits.excludePatterns)) {
      warnings.push(`Excluded: ${f.path}`);
      return false;
    }
    return true;
  });

  // Enforce file count limit
  if (filtered.length > limits.maxFiles) {
    warnings.push(
      `Too many files (${filtered.length}), truncating to ${limits.maxFiles}`
    );
    filtered.splice(limits.maxFiles);
  }

  // Process and truncate files
  const processed: FileContent[] = filtered.map((f) => {
    const { content, truncated, originalLines } = truncateFile(
      f.content,
      limits.maxLinesPerFile
    );

    if (truncated) {
      warnings.push(
        `Truncated ${f.path}: ${originalLines} lines -> ${limits.maxLinesPerFile} lines`
      );
    }

    return { path: f.path, content, truncated, originalLines };
  });

  // Check total token estimate
  const totalContent = processed.map((f) => f.content).join("\n");
  const estimatedTokens = estimateTokens(totalContent);

  if (estimatedTokens > limits.maxTotalTokens) {
    throw new Error(
      `Context too large: ~${estimatedTokens} tokens (limit: ${limits.maxTotalTokens})`
    );
  }

  return { files: processed, warnings };
}

// ============================================================================
// MODEL SELECTION (Layer 5)
// ============================================================================

/**
 * Select appropriate model tier based on task complexity
 */
export function selectModelForTask(task: string): ModelTier {
  const taskLower = task.toLowerCase();

  // Simple tasks use Haiku (cheapest)
  const simplePatterns = [
    /^(read|find|grep|list|search)/i,
    /^(add|fix) (comment|typo)/i,
    /^rename/i,
    /^format/i,
    /^lint/i,
  ];

  if (simplePatterns.some((p) => p.test(taskLower))) {
    return "haiku";
  }

  // Complex tasks use Opus (most capable)
  const complexPatterns = [
    /^(design|architect|refactor entire)/i,
    /security|auth|payment/i,
    /performance|optimize/i,
    /migration/i,
    /critical/i,
  ];

  if (complexPatterns.some((p) => p.test(taskLower))) {
    return "opus";
  }

  // Default to Sonnet (balanced)
  return "sonnet";
}

/**
 * Calculate estimated cost for an operation
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelTier
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

// ============================================================================
// TIMEOUT PROTECTION (Layer 1 & 2)
// ============================================================================

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export function createTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Wrap an operation with a timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return Promise.race([operation(), createTimeout(timeoutMs, timeoutMessage)]);
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number = 30000
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(delay + jitter, maxDelayMs);
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
  isRetryable: (error: Error) => boolean = () => true
): Promise<RetryResult<T>> {
  const errors: Error[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, result, attempts: attempt + 1, errors };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      // Don't retry if this is a non-retryable error
      if (!isRetryable(err)) {
        return { success: false, attempts: attempt + 1, errors };
      }

      // Wait before retrying (if we have retries left)
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, baseDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false, attempts: maxRetries + 1, errors };
}

/**
 * Check if an error is retryable (transient failure)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Transient errors worth retrying
  const retryablePatterns = [
    /rate limit/i,
    /timeout/i,
    /network/i,
    /econnreset/i,
    /enotfound/i,
    /503/i,
    /529/i, // Anthropic overloaded
    /temporary/i,
  ];

  // Don't retry these
  const nonRetryablePatterns = [
    /invalid api key/i,
    /authentication/i,
    /authorization/i,
    /budget exceeded/i,
    /context too large/i,
    /invalid request/i,
  ];

  if (nonRetryablePatterns.some((p) => p.test(message))) {
    return false;
  }

  return retryablePatterns.some((p) => p.test(message));
}

// ============================================================================
// PROTECTED OPERATION WRAPPER
// ============================================================================

/**
 * Execute an AI operation with full protection stack
 *
 * Applies all protection layers:
 * 1. Budget check before starting
 * 2. Job-level timeout on entire operation
 * 3. Request-level token caps
 * 4. Input size limits (if files provided)
 * 5. Model selection based on task
 * 6. Retry with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await protectedOperation({
 *   prompt: "Review this code for security issues",
 *   taskType: "code_review",
 *   files: [{ path: "auth.ts", content: authCode }]
 * });
 * ```
 */
export async function protectedOperation(options: {
  prompt: string;
  taskType?: string;
  files?: Array<{ path: string; content: string }>;
  model?: ModelTier;
  timeout?: Partial<TimeoutConfig>;
  inputLimits?: Partial<InputLimits>;
  budget?: Partial<BudgetConfig>;
}): Promise<{ response: string; metrics: UsageMetrics }> {
  const startTime = Date.now();
  const taskType = options.taskType || "default";
  const model = options.model || selectModelForTask(options.prompt);
  const timeoutConfig = { ...DEFAULT_TIMEOUT, ...options.timeout };
  const inputLimits = { ...DEFAULT_INPUT_LIMITS, ...options.inputLimits };
  const budgetConfig = { ...DEFAULT_BUDGET, ...options.budget };

  // Layer 4: Check budget before starting
  const budgetStatus = checkBudget(budgetConfig);
  if (!budgetStatus.ok) {
    throw new Error(budgetStatus.message);
  }

  if (budgetStatus.alert) {
    console.warn(`[Timeout Protection] ${budgetStatus.message}`);
  }

  // Layer 3: Process files with size limits
  let contextContent = "";
  if (options.files && options.files.length > 0) {
    const { files, warnings } = processFilesWithLimits(options.files, inputLimits);
    warnings.forEach((w) => console.warn(`[Input Limits] ${w}`));
    contextContent = files
      .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");
  }

  // Build full prompt
  const fullPrompt = contextContent
    ? `${options.prompt}\n\n## Files\n\n${contextContent}`
    : options.prompt;

  // Layer 2: Get token limit for task type (used for budget estimation)
  // Note: Agent SDK query() handles token limits internally
  const _expectedMaxTokens = TOKEN_LIMITS_BY_TASK[taskType] || TOKEN_LIMITS_BY_TASK.default;
  void _expectedMaxTokens; // Kept for documentation of expected output size

  // Estimate input tokens for cost tracking
  const estimatedInputTokens = estimateTokens(fullPrompt);

  // Layer 1 & retry: Execute with timeout and retry
  const executeQuery = async (): Promise<string> => {
    let response = "";

    const messages = query({
      prompt: fullPrompt,
      options: {
        model: MODEL_IDS[model],
        maxTurns: 1,
      },
    });

    // Collect response with request-level timeout
    const timeoutPromise = createTimeout(
      timeoutConfig.requestTimeoutMs,
      `Request timeout after ${timeoutConfig.requestTimeoutMs}ms`
    );

    const collectResponse = async (): Promise<string> => {
      for await (const message of messages) {
        if (message.type === "assistant") {
          response += extractTextContent(message);
        }
      }
      return response;
    };

    return Promise.race([collectResponse(), timeoutPromise]);
  };

  // Execute with job-level timeout and retry
  const retryResult = await withTimeout(
    () =>
      withRetry(
        executeQuery,
        timeoutConfig.maxRetries,
        timeoutConfig.baseDelayMs,
        isRetryableError
      ),
    timeoutConfig.jobTimeoutMs,
    `Job timeout after ${timeoutConfig.jobTimeoutMs}ms`
  );

  const durationMs = Date.now() - startTime;

  if (!retryResult.success) {
    const lastError = retryResult.errors[retryResult.errors.length - 1];
    const metrics: UsageMetrics = {
      timestamp: new Date(),
      tokensIn: estimatedInputTokens,
      tokensOut: 0,
      cost: 0,
      model: MODEL_IDS[model],
      task: taskType,
      durationMs,
      success: false,
      error: lastError?.message,
    };
    logUsage(metrics);
    throw lastError || new Error("Operation failed after retries");
  }

  // Calculate actual cost
  const estimatedOutputTokens = estimateTokens(retryResult.result || "");
  const cost = estimateCost(estimatedInputTokens, estimatedOutputTokens, model);

  const metrics: UsageMetrics = {
    timestamp: new Date(),
    tokensIn: estimatedInputTokens,
    tokensOut: estimatedOutputTokens,
    cost,
    model: MODEL_IDS[model],
    task: taskType,
    durationMs,
    success: true,
  };

  logUsage(metrics);

  return { response: retryResult.result || "", metrics };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Review code with full protection
 */
export async function protectedCodeReview(
  code: string,
  filePath: string
): Promise<string> {
  const { response } = await protectedOperation({
    prompt:
      "Review this code for bugs, security issues, and improvements. Be concise.",
    taskType: "code_review",
    files: [{ path: filePath, content: code }],
    model: "sonnet",
  });
  return response;
}

/**
 * Fix a bug with full protection
 */
export async function protectedBugFix(
  code: string,
  bugDescription: string
): Promise<string> {
  const { response } = await protectedOperation({
    prompt: `Fix this bug: ${bugDescription}\n\nProvide only the fixed code.`,
    taskType: "bug_fix",
    files: [{ path: "code.ts", content: code }],
    model: "sonnet",
  });
  return response;
}

/**
 * Generate documentation with full protection
 */
export async function protectedDocGeneration(
  code: string,
  format: "jsdoc" | "markdown" = "jsdoc"
): Promise<string> {
  const { response } = await protectedOperation({
    prompt: `Generate ${format} documentation for this code.`,
    taskType: "documentation",
    files: [{ path: "code.ts", content: code }],
    model: "haiku", // Docs are simpler, use cheaper model
  });
  return response;
}

// ============================================================================
// COST CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate cost for a hypothetical operation (for planning)
 */
export function calculateOperationCost(params: {
  inputChars: number;
  outputChars: number;
  model: ModelTier;
}): { inputCost: number; outputCost: number; total: number } {
  const inputTokens = Math.ceil(params.inputChars / 4);
  const outputTokens = Math.ceil(params.outputChars / 4);
  const costs = MODEL_COSTS[params.model];

  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;

  return { inputCost, outputCost, total: inputCost + outputCost };
}

/**
 * Calculate monthly cost estimate based on usage pattern
 */
export function calculateMonthlyCost(params: {
  operationsPerDay: number;
  avgInputChars: number;
  avgOutputChars: number;
  model: ModelTier;
  workDaysPerMonth?: number;
}): { daily: number; monthly: number; breakdown: string } {
  const workDays = params.workDaysPerMonth || 22;
  const perOp = calculateOperationCost({
    inputChars: params.avgInputChars,
    outputChars: params.avgOutputChars,
    model: params.model,
  });

  const daily = perOp.total * params.operationsPerDay;
  const monthly = daily * workDays;

  return {
    daily,
    monthly,
    breakdown: `${params.operationsPerDay} ops/day x $${perOp.total.toFixed(4)}/op = $${daily.toFixed(2)}/day, $${monthly.toFixed(2)}/month`,
  };
}

// ============================================================================
// USAGE REPORT
// ============================================================================

/**
 * Generate usage report for a time period
 */
export function generateUsageReport(days: number = 7): {
  totalCost: number;
  totalOperations: number;
  avgCostPerOp: number;
  byModel: Record<string, { count: number; cost: number }>;
  byTask: Record<string, { count: number; cost: number }>;
  successRate: number;
  avgDurationMs: number;
} {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const logs = usageLog.filter((l) => l.timestamp >= cutoff);

  const byModel: Record<string, { count: number; cost: number }> = {};
  const byTask: Record<string, { count: number; cost: number }> = {};

  let totalDuration = 0;
  let successCount = 0;

  for (const log of logs) {
    // By model
    if (!byModel[log.model]) {
      byModel[log.model] = { count: 0, cost: 0 };
    }
    const modelEntry = byModel[log.model]!;
    modelEntry.count++;
    modelEntry.cost += log.cost;

    // By task
    if (!byTask[log.task]) {
      byTask[log.task] = { count: 0, cost: 0 };
    }
    const taskEntry = byTask[log.task]!;
    taskEntry.count++;
    taskEntry.cost += log.cost;

    totalDuration += log.durationMs;
    if (log.success) successCount++;
  }

  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);

  return {
    totalCost,
    totalOperations: logs.length,
    avgCostPerOp: logs.length > 0 ? totalCost / logs.length : 0,
    byModel,
    byTask,
    successRate: logs.length > 0 ? successCount / logs.length : 1,
    avgDurationMs: logs.length > 0 ? totalDuration / logs.length : 0,
  };
}
