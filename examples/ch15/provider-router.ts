/**
 * Chapter 15: Provider Router
 *
 * Implements a provider-agnostic abstraction layer for multi-provider
 * support with automatic fallback and preference-based routing.
 */

import Anthropic from '@anthropic-ai/sdk';

// Completion options that work across providers
export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

// Provider completion result
export interface CompletionResult {
  content: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number;
}

// Provider interface
export interface AIProvider {
  name: string;
  model: string;
  isAvailable(): Promise<boolean>;
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  costs: { inputPerMTok: number; outputPerMTok: number };
}

// Provider preference for routing
export type ProviderPreference = 'quality' | 'speed' | 'cost';

/**
 * Claude provider implementation
 */
export class ClaudeProvider implements AIProvider {
  name = 'claude';
  model: string;
  costs: { inputPerMTok: number; outputPerMTok: number };
  private client: Anthropic;

  constructor(
    model: string = 'claude-sonnet-4-5-20250929',
    costs?: { inputPerMTok: number; outputPerMTok: number }
  ) {
    this.client = new Anthropic();
    this.model = model;
    this.costs = costs || { inputPerMTok: 3, outputPerMTok: 15 };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });
      return true;
    } catch {
      return false;
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
      stop_sequences: options?.stopSequences
    });

    const latencyMs = Date.now() - startTime;
    const contentBlock = response.content[0];
    const content = contentBlock && contentBlock.type === 'text' ? contentBlock.text : '';

    const cost =
      (response.usage.input_tokens * this.costs.inputPerMTok / 1_000_000) +
      (response.usage.output_tokens * this.costs.outputPerMTok / 1_000_000);

    return {
      content,
      provider: this.name,
      model: this.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
      cost
    };
  }
}

/**
 * Mock provider for testing/demo (simulates alternative provider)
 */
export class MockProvider implements AIProvider {
  name: string;
  model: string;
  costs: { inputPerMTok: number; outputPerMTok: number };
  private available: boolean;
  private latencyMs: number;

  constructor(
    name: string,
    model: string,
    options?: {
      costs?: { inputPerMTok: number; outputPerMTok: number };
      available?: boolean;
      latencyMs?: number;
    }
  ) {
    this.name = name;
    this.model = model;
    this.costs = options?.costs || { inputPerMTok: 2, outputPerMTok: 10 };
    this.available = options?.available ?? true;
    this.latencyMs = options?.latencyMs || 1000;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));

    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = options?.maxTokens ? Math.min(500, options.maxTokens) : 500;

    const cost =
      (inputTokens * this.costs.inputPerMTok / 1_000_000) +
      (outputTokens * this.costs.outputPerMTok / 1_000_000);

    return {
      content: `Mock response from ${this.name} for prompt: ${prompt.substring(0, 50)}...`,
      provider: this.name,
      model: this.model,
      inputTokens,
      outputTokens,
      latencyMs: this.latencyMs,
      cost
    };
  }
}

/**
 * Provider router with fallback and preference-based routing
 */
export class ProviderRouter {
  private providers: Map<string, AIProvider> = new Map();
  private preferenceOrder: Map<ProviderPreference, string[]> = new Map();

  /**
   * Register a provider
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Set preference order for routing
   */
  setPreferenceOrder(preference: ProviderPreference, providerNames: string[]): void {
    this.preferenceOrder.set(preference, providerNames);
  }

  /**
   * Get provider by preference
   */
  private getProvidersByPreference(preference?: ProviderPreference): AIProvider[] {
    if (!preference) {
      return Array.from(this.providers.values());
    }

    const order = this.preferenceOrder.get(preference);
    if (!order) {
      return Array.from(this.providers.values());
    }

    return order
      .map(name => this.providers.get(name))
      .filter((p): p is AIProvider => p !== undefined);
  }

  /**
   * Complete with automatic provider selection and fallback
   */
  async complete(
    prompt: string,
    options?: CompletionOptions & { preference?: ProviderPreference }
  ): Promise<CompletionResult> {
    const providers = this.getProvidersByPreference(options?.preference);

    if (providers.length === 0) {
      throw new Error('No providers registered');
    }

    const errors: Array<{ provider: string; error: Error }> = [];

    for (const provider of providers) {
      try {
        // Check availability first
        const available = await provider.isAvailable();
        if (!available) {
          console.warn(`${provider.name} is not available, trying next...`);
          continue;
        }

        // Try completion
        return await provider.complete(prompt, options);
      } catch (error) {
        console.warn(`${provider.name} failed: ${error}, trying next...`);
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    throw new Error(
      `All providers failed: ${errors.map(e => `${e.provider}: ${e.error.message}`).join('; ')}`
    );
  }

  /**
   * Get all registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }
}

/**
 * Benchmark task for evaluating providers
 */
export interface BenchmarkTask {
  name: string;
  prompt: string;
  expectedPattern: RegExp;
  maxLatencyMs: number;
  category: 'simple' | 'medium' | 'complex';
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  provider: string;
  model: string;
  task: string;
  passed: boolean;
  latencyMs: number;
  cost: number;
  matchedPattern: boolean;
  withinLatency: boolean;
}

/**
 * Evaluate a provider against benchmark tasks
 */
export async function evaluateProvider(
  provider: AIProvider,
  tasks: BenchmarkTask[]
): Promise<{
  provider: string;
  results: BenchmarkResult[];
  passRate: number;
  averageLatency: number;
  totalCost: number;
}> {
  const results: BenchmarkResult[] = [];

  for (const task of tasks) {
    try {
      const result = await provider.complete(task.prompt);
      const matchedPattern = task.expectedPattern.test(result.content);
      const withinLatency = result.latencyMs <= task.maxLatencyMs;

      results.push({
        provider: provider.name,
        model: provider.model,
        task: task.name,
        passed: matchedPattern && withinLatency,
        latencyMs: result.latencyMs,
        cost: result.cost,
        matchedPattern,
        withinLatency
      });
    } catch {
      results.push({
        provider: provider.name,
        model: provider.model,
        task: task.name,
        passed: false,
        latencyMs: -1,
        cost: 0,
        matchedPattern: false,
        withinLatency: false
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const passRate = results.length > 0 ? passed / results.length : 0;
  const averageLatency = results.length > 0
    ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length
    : 0;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

  return {
    provider: provider.name,
    results,
    passRate,
    averageLatency,
    totalCost
  };
}

/**
 * Standard benchmark tasks for provider evaluation
 */
export const STANDARD_BENCHMARKS: BenchmarkTask[] = [
  {
    name: 'simple-read',
    prompt: 'What is 2 + 2?',
    expectedPattern: /4/,
    maxLatencyMs: 2000,
    category: 'simple'
  },
  {
    name: 'code-generation',
    prompt: 'Write a TypeScript function that adds two numbers',
    expectedPattern: /function.*\+/s,
    maxLatencyMs: 5000,
    category: 'medium'
  },
  {
    name: 'analysis',
    prompt: 'Explain the pros and cons of microservices architecture',
    expectedPattern: /scalab|independ|complex/i,
    maxLatencyMs: 10000,
    category: 'complex'
  }
];

// Demo: Show provider routing in action
async function demo() {
  console.log('=== Provider Router Demo ===\n');

  // Create router with mock providers
  const router = new ProviderRouter();

  // Register mock providers
  router.register(new MockProvider('claude', 'claude-sonnet', {
    costs: { inputPerMTok: 3, outputPerMTok: 15 },
    latencyMs: 3000
  }));

  router.register(new MockProvider('openai', 'gpt-4o', {
    costs: { inputPerMTok: 2.5, outputPerMTok: 10 },
    latencyMs: 2000
  }));

  router.register(new MockProvider('gemini', 'gemini-pro', {
    costs: { inputPerMTok: 0.125, outputPerMTok: 0.375 },
    latencyMs: 1500
  }));

  // Set preference orders
  router.setPreferenceOrder('quality', ['claude', 'openai', 'gemini']);
  router.setPreferenceOrder('speed', ['gemini', 'openai', 'claude']);
  router.setPreferenceOrder('cost', ['gemini', 'openai', 'claude']);

  console.log('Registered providers:', router.getProviderNames().join(', '));
  console.log('');

  // Demo different preferences
  console.log('1. Quality Preference (Claude first):');
  const qualityResult = await router.complete('Test prompt', { preference: 'quality' });
  console.log(`   Provider: ${qualityResult.provider}`);
  console.log(`   Latency: ${qualityResult.latencyMs}ms`);
  console.log(`   Cost: $${qualityResult.cost.toFixed(6)}`);
  console.log('');

  console.log('2. Speed Preference (Gemini first):');
  const speedResult = await router.complete('Test prompt', { preference: 'speed' });
  console.log(`   Provider: ${speedResult.provider}`);
  console.log(`   Latency: ${speedResult.latencyMs}ms`);
  console.log(`   Cost: $${speedResult.cost.toFixed(6)}`);
  console.log('');

  console.log('3. Cost Preference (Gemini first):');
  const costResult = await router.complete('Test prompt', { preference: 'cost' });
  console.log(`   Provider: ${costResult.provider}`);
  console.log(`   Latency: ${costResult.latencyMs}ms`);
  console.log(`   Cost: $${costResult.cost.toFixed(6)}`);
  console.log('');

  // Demo benchmark evaluation
  console.log('4. Provider Benchmarking:');
  const mockClaude = router.getProvider('claude');
  if (mockClaude) {
    const evalResult = await evaluateProvider(mockClaude, STANDARD_BENCHMARKS);
    console.log(`   Pass rate: ${(evalResult.passRate * 100).toFixed(0)}%`);
    console.log(`   Avg latency: ${evalResult.averageLatency.toFixed(0)}ms`);
    console.log(`   Total cost: $${evalResult.totalCost.toFixed(6)}`);
  }
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
