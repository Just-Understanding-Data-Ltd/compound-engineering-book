/**
 * Chapter 15: Batch API Processing
 *
 * Implements batch message processing for 50% cost reduction on
 * non-time-sensitive tasks. Batches are processed within 24 hours
 * at half the normal per-token cost.
 */

import Anthropic from '@anthropic-ai/sdk';

// Batch request structure
export interface BatchRequest {
  customId: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
}

// Batch result structure
export interface BatchResult {
  customId: string;
  status: 'succeeded' | 'errored';
  content?: string;
  error?: string;
}

// Batch job status
export interface BatchStatus {
  batchId: string;
  status: 'in_progress' | 'ended' | 'canceling' | 'canceled';
  requestCounts: {
    processing: number;
    succeeded: number;
    errored: number;
    canceled: number;
    expired: number;
  };
  createdAt: Date;
}

/**
 * Create a batch of messages for async processing
 *
 * Batches offer 50% discount with 24-hour turnaround.
 * Use for: code reviews, documentation, test generation,
 * refactoring suggestions, and other non-urgent tasks.
 */
export async function createBatch(
  client: Anthropic,
  requests: BatchRequest[]
): Promise<string> {
  const batchRequests = requests.map(req => ({
    custom_id: req.customId,
    params: {
      model: req.model ?? 'claude-sonnet-4-5-20250929',
      max_tokens: req.maxTokens ?? 1024,
      messages: [{ role: 'user' as const, content: req.prompt }]
    }
  }));

  const batch = await client.messages.batches.create({
    requests: batchRequests
  });

  return batch.id;
}

/**
 * Check batch processing status
 */
export async function checkBatchStatus(
  client: Anthropic,
  batchId: string
): Promise<BatchStatus> {
  const batch = await client.messages.batches.retrieve(batchId);

  return {
    batchId: batch.id,
    status: batch.processing_status,
    requestCounts: {
      processing: batch.request_counts.processing,
      succeeded: batch.request_counts.succeeded,
      errored: batch.request_counts.errored,
      canceled: batch.request_counts.canceled,
      expired: batch.request_counts.expired
    },
    createdAt: new Date(batch.created_at)
  };
}

/**
 * Poll batch until completion with exponential backoff
 */
export async function waitForBatch(
  client: Anthropic,
  batchId: string,
  options?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    maxWaitMs?: number;
    onProgress?: (status: BatchStatus) => void;
  }
): Promise<BatchStatus> {
  const initialDelay = options?.initialDelayMs ?? 5000;
  const maxDelay = options?.maxDelayMs ?? 60000;
  const maxWait = options?.maxWaitMs ?? 86400000; // 24 hours
  const startTime = Date.now();
  let delay = initialDelay;

  while (true) {
    const status = await checkBatchStatus(client, batchId);

    if (options?.onProgress) {
      options.onProgress(status);
    }

    if (status.status === 'ended') {
      return status;
    }

    if (status.status === 'canceled' || status.status === 'canceling') {
      throw new Error(`Batch ${batchId} was canceled`);
    }

    if (Date.now() - startTime > maxWait) {
      throw new Error(`Batch ${batchId} timed out after ${maxWait}ms`);
    }

    await sleep(delay);
    delay = Math.min(delay * 1.5, maxDelay);
  }
}

/**
 * Retrieve results from a completed batch
 */
export async function getBatchResults(
  client: Anthropic,
  batchId: string
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  const stream = await client.messages.batches.results(batchId);

  for await (const entry of stream) {
    if (entry.result.type === 'succeeded') {
      const message = entry.result.message;
      const textContent = message.content.find(c => c.type === 'text');
      results.push({
        customId: entry.custom_id,
        status: 'succeeded',
        content: textContent?.type === 'text' ? textContent.text : ''
      });
    } else if (entry.result.type === 'errored') {
      const errorResult = entry.result.error as { type?: string; message?: string };
      results.push({
        customId: entry.custom_id,
        status: 'errored',
        error: errorResult.message ?? JSON.stringify(entry.result.error)
      });
    }
  }

  return results;
}

/**
 * Cancel a running batch
 */
export async function cancelBatch(
  client: Anthropic,
  batchId: string
): Promise<void> {
  await client.messages.batches.cancel(batchId);
}

/**
 * Calculate cost savings from batch processing
 *
 * Batch pricing: 50% of standard pricing
 * Sonnet batch: $1.50/MTok input, $7.50/MTok output (vs $3/$15)
 */
export function calculateBatchSavings(
  inputTokens: number,
  outputTokens: number,
  model: 'haiku' | 'sonnet' | 'opus' = 'sonnet'
): { standardCost: number; batchCost: number; savings: number; savingsPercent: number } {
  const pricing = {
    haiku: { input: 0.25, output: 1.25 },
    sonnet: { input: 3, output: 15 },
    opus: { input: 15, output: 75 }
  };

  const rates = pricing[model];
  const standardCost =
    (inputTokens * rates.input / 1_000_000) +
    (outputTokens * rates.output / 1_000_000);
  const batchCost = standardCost * 0.5; // 50% discount

  return {
    standardCost,
    batchCost,
    savings: standardCost - batchCost,
    savingsPercent: 50
  };
}

/**
 * Batch processor for code review tasks
 */
export async function batchCodeReview(
  client: Anthropic,
  files: Array<{ path: string; content: string }>
): Promise<Map<string, string>> {
  // Create batch requests for each file
  const requests: BatchRequest[] = files.map(file => ({
    customId: `review-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`,
    prompt: `Review this code file for bugs, security issues, and improvements.

File: ${file.path}

\`\`\`
${file.content}
\`\`\`

Provide a concise code review with:
1. Critical issues (bugs, security)
2. Code quality suggestions
3. Performance considerations`,
    maxTokens: 2048
  }));

  // Create and wait for batch
  const batchId = await createBatch(client, requests);

  console.log(`Created batch ${batchId} with ${requests.length} files`);

  await waitForBatch(client, batchId, {
    onProgress: (status) => {
      console.log(`Progress: ${status.requestCounts.succeeded}/${requests.length} complete`);
    }
  });

  // Collect results
  const results = await getBatchResults(client, batchId);
  const reviewMap = new Map<string, string>();

  for (const result of results) {
    const path = result.customId.replace('review-', '').replace(/-/g, '/');
    if (result.status === 'succeeded' && result.content) {
      reviewMap.set(path, result.content);
    } else {
      reviewMap.set(path, `Error: ${result.error ?? 'Unknown error'}`);
    }
  }

  return reviewMap;
}

/**
 * Batch processor for documentation generation
 */
export async function batchDocGeneration(
  client: Anthropic,
  functions: Array<{ name: string; code: string }>
): Promise<Map<string, string>> {
  const requests: BatchRequest[] = functions.map(fn => ({
    customId: `doc-${fn.name}`,
    prompt: `Generate JSDoc documentation for this function:

\`\`\`typescript
${fn.code}
\`\`\`

Include:
- @description
- @param for each parameter
- @returns
- @example with usage`,
    maxTokens: 1024
  }));

  const batchId = await createBatch(client, requests);
  await waitForBatch(client, batchId);

  const results = await getBatchResults(client, batchId);
  const docMap = new Map<string, string>();

  for (const result of results) {
    const name = result.customId.replace('doc-', '');
    docMap.set(name, result.content ?? result.error ?? '');
  }

  return docMap;
}

/**
 * Determine if a task is suitable for batch processing
 */
export function isBatchSuitable(task: {
  urgency: 'immediate' | 'today' | 'this-week' | 'whenever';
  requestCount: number;
  estimatedTokens: number;
}): { suitable: boolean; reason: string; estimatedSavings: number } {
  // Immediate tasks need sync API
  if (task.urgency === 'immediate') {
    return {
      suitable: false,
      reason: 'Task requires immediate response',
      estimatedSavings: 0
    };
  }

  // Single requests have overhead not worth batch
  if (task.requestCount < 3) {
    return {
      suitable: false,
      reason: 'Too few requests to benefit from batch overhead',
      estimatedSavings: 0
    };
  }

  // Calculate savings
  const standardCost = task.estimatedTokens * 3 / 1_000_000; // Sonnet input
  const savings = standardCost * 0.5;

  return {
    suitable: true,
    reason: `${task.requestCount} requests can be batched for 50% savings`,
    estimatedSavings: savings
  };
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Demo: Show batch processing workflow
async function demo() {
  console.log('=== Batch API Processing Demo ===\n');

  // Demonstrate batch suitability analysis
  console.log('1. Batch Suitability Analysis:\n');

  const tasks = [
    { urgency: 'immediate' as const, requestCount: 1, estimatedTokens: 5000 },
    { urgency: 'today' as const, requestCount: 2, estimatedTokens: 10000 },
    { urgency: 'this-week' as const, requestCount: 10, estimatedTokens: 50000 },
    { urgency: 'whenever' as const, requestCount: 100, estimatedTokens: 500000 }
  ];

  for (const task of tasks) {
    const result = isBatchSuitable(task);
    console.log(`  Urgency: ${task.urgency}, Requests: ${task.requestCount}`);
    console.log(`    Suitable: ${result.suitable ? 'Yes' : 'No'}`);
    console.log(`    Reason: ${result.reason}`);
    if (result.estimatedSavings > 0) {
      console.log(`    Estimated savings: $${result.estimatedSavings.toFixed(4)}`);
    }
    console.log('');
  }

  // Demonstrate cost savings calculation
  console.log('2. Cost Savings Calculation:\n');

  const scenarios = [
    { input: 10000, output: 5000, model: 'haiku' as const },
    { input: 10000, output: 5000, model: 'sonnet' as const },
    { input: 10000, output: 5000, model: 'opus' as const }
  ];

  for (const scenario of scenarios) {
    const savings = calculateBatchSavings(scenario.input, scenario.output, scenario.model);
    console.log(`  Model: ${scenario.model}`);
    console.log(`    Standard cost: $${savings.standardCost.toFixed(4)}`);
    console.log(`    Batch cost: $${savings.batchCost.toFixed(4)}`);
    console.log(`    Savings: $${savings.savings.toFixed(4)} (${savings.savingsPercent}%)`);
    console.log('');
  }

  // Demonstrate batch request structure
  console.log('3. Sample Batch Request Structure:\n');

  const sampleRequests: BatchRequest[] = [
    { customId: 'review-auth-ts', prompt: 'Review auth.ts for security issues', maxTokens: 2048 },
    { customId: 'review-api-ts', prompt: 'Review api.ts for best practices', maxTokens: 2048 },
    { customId: 'review-db-ts', prompt: 'Review db.ts for connection handling', maxTokens: 2048 }
  ];

  console.log('  Sample batch with 3 code review requests:');
  for (const req of sampleRequests) {
    console.log(`    - ${req.customId}: ${req.prompt.slice(0, 50)}...`);
  }

  console.log('\n  Batch processing benefits:');
  console.log('    - 50% cost reduction');
  console.log('    - 24-hour turnaround guarantee');
  console.log('    - Automatic retry on transient failures');
  console.log('    - Results delivered via streaming API');
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
