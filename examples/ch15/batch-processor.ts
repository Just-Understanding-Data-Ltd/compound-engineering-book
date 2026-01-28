/**
 * Chapter 15: Batch API Processing
 *
 * Implements batch message processing for 50% cost reduction on
 * non-time-sensitive tasks. Batches are processed within 24 hours
 * at half the normal per-token cost.
 *
 * Note: The Anthropic Batch API (messages.batches.*) is accessed via the
 * native @anthropic-ai/sdk. This module provides the interface and utilities
 * for batch processing, with simulated implementations for demonstration.
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
 *
 * Note: In production, use the native Anthropic SDK:
 * await client.messages.batches.create({ requests: batchRequests })
 */
export async function createBatch(
  requests: BatchRequest[]
): Promise<string> {
  // Simulate batch creation (in production, use native Anthropic SDK)
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Store requests for simulated processing
  batchStore.set(batchId, {
    requests,
    status: 'in_progress' as const,
    createdAt: new Date(),
    results: []
  });

  // Simulate async batch processing
  setTimeout(async () => {
    const batch = batchStore.get(batchId);
    if (!batch) return;

    // Process each request using Agent SDK
    for (const req of requests) {
      try {
        const stream = query({
          prompt: req.prompt,
          options: {
            model: req.model ?? 'claude-sonnet-4-5-20250929',
            allowedTools: []
          }
        });

        let content = '';
        for await (const message of stream) {
          const text = extractTextContent(message);
          if (text) content += text;
        }

        batch.results.push({
          customId: req.customId,
          status: 'succeeded',
          content
        });
      } catch (error) {
        batch.results.push({
          customId: req.customId,
          status: 'errored',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    batch.status = 'ended';
  }, 100);

  return batchId;
}

// In-memory batch store for simulation
const batchStore = new Map<string, {
  requests: BatchRequest[];
  status: 'in_progress' | 'ended' | 'canceling' | 'canceled';
  createdAt: Date;
  results: BatchResult[];
}>();

/**
 * Check batch processing status
 *
 * Note: In production, use the native Anthropic SDK:
 * await client.messages.batches.retrieve(batchId)
 */
export async function checkBatchStatus(
  batchId: string
): Promise<BatchStatus> {
  // Simulate status check from batch store
  const batch = batchStore.get(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  const succeeded = batch.results.filter(r => r.status === 'succeeded').length;
  const errored = batch.results.filter(r => r.status === 'errored').length;
  const processing = batch.requests.length - succeeded - errored;

  return {
    batchId,
    status: batch.status,
    requestCounts: {
      processing,
      succeeded,
      errored,
      canceled: 0,
      expired: 0
    },
    createdAt: batch.createdAt
  };
}

/**
 * Poll batch until completion with exponential backoff
 *
 * Note: In production, poll using checkBatchStatus with native SDK
 */
export async function waitForBatch(
  batchId: string,
  options?: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    maxWaitMs?: number;
    onProgress?: (status: BatchStatus) => void;
  }
): Promise<BatchStatus> {
  const initialDelay = options?.initialDelayMs ?? 100; // Faster for simulation
  const maxDelay = options?.maxDelayMs ?? 1000;
  const maxWait = options?.maxWaitMs ?? 60000; // 1 minute for simulation
  const startTime = Date.now();
  let delay = initialDelay;

  while (true) {
    const status = await checkBatchStatus(batchId);

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
 *
 * Note: In production, use the native Anthropic SDK:
 * await client.messages.batches.results(batchId)
 */
export async function getBatchResults(
  batchId: string
): Promise<BatchResult[]> {
  // Retrieve results from simulated batch store
  const batch = batchStore.get(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  return batch.results;
}

/**
 * Cancel a running batch
 *
 * Note: In production, use the native Anthropic SDK:
 * await client.messages.batches.cancel(batchId)
 */
export async function cancelBatch(
  batchId: string
): Promise<void> {
  // Simulate batch cancellation
  const batch = batchStore.get(batchId);
  if (batch) {
    batch.status = 'canceled';
  }
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
  const batchId = await createBatch(requests);

  console.log(`Created batch ${batchId} with ${requests.length} files`);

  await waitForBatch(batchId, {
    onProgress: (status: BatchStatus) => {
      console.log(`Progress: ${status.requestCounts.succeeded}/${requests.length} complete`);
    }
  });

  // Collect results
  const results = await getBatchResults(batchId);
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

  const batchId = await createBatch(requests);
  await waitForBatch(batchId);

  const results = await getBatchResults(batchId);
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
