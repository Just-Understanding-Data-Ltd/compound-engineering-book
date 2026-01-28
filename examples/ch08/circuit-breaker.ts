/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates the circuit breaker pattern for resilience
 * in AI agent systems. Circuit breakers prevent cascading failures
 * by stopping operations after consecutive failures.
 *
 * Key concepts:
 * - Three states: Closed (normal), Open (failing), Half-Open (probing)
 * - Configurable failure thresholds and reset timeouts
 * - Event-driven state transitions
 * - Integration with Agent SDK for protected API calls
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// CIRCUIT BREAKER TYPES AND INTERFACES
// ============================================================================

/**
 * Circuit breaker states
 */
export type CircuitState = "closed" | "open" | "half-open";

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  maxFailures: number;
  /** Time in ms before transitioning from open to half-open */
  resetTimeMs: number;
  /** Number of successful probes needed to close (default: 1) */
  successThreshold: number;
  /** Optional name for logging/debugging */
  name?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: CircuitBreakerConfig = {
  maxFailures: 3,
  resetTimeMs: 30000, // 30 seconds
  successThreshold: 1,
  name: "default",
};

/**
 * Circuit breaker event types
 */
export type CircuitEvent =
  | { type: "success" }
  | { type: "failure"; error: Error }
  | { type: "state_change"; from: CircuitState; to: CircuitState }
  | { type: "open_rejected" }
  | { type: "probe_started" }
  | { type: "probe_succeeded" }
  | { type: "probe_failed"; error: Error };

/**
 * Event listener type
 */
export type CircuitEventListener = (event: CircuitEvent) => void;

/**
 * Circuit breaker metrics
 */
export interface CircuitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  stateChanges: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  currentState: CircuitState;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

/**
 * Circuit breaker implementation with configurable thresholds
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker({ maxFailures: 3, resetTimeMs: 30000 });
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await riskyApiCall();
 *   });
 * } catch (error) {
 *   if (error.message === 'Circuit breaker is open') {
 *     // Fast fail - circuit is protecting the system
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rejectedRequests = 0;
  private stateChanges = 0;
  private listeners: CircuitEventListener[] = [];
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from open to half-open
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeMs) {
        this.transitionTo("half-open");
        this.emit({ type: "probe_started" });
      } else {
        this.rejectedRequests++;
        this.emit({ type: "open_rejected" });
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successfulRequests++;
    this.lastSuccessTime = Date.now();
    this.failures = 0;
    this.successes++;
    this.emit({ type: "success" });

    if (this.state === "half-open") {
      if (this.successes >= this.config.successThreshold) {
        this.emit({ type: "probe_succeeded" });
        this.transitionTo("closed");
      }
    } else if (this.state === "closed") {
      // Reset success counter in closed state
      this.successes = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error): void {
    this.failedRequests++;
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();
    this.emit({ type: "failure", error });

    if (this.state === "half-open") {
      this.emit({ type: "probe_failed", error });
      this.transitionTo("open");
    } else if (this.state === "closed") {
      if (this.failures >= this.config.maxFailures) {
        this.transitionTo("open");
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChanges++;
    this.failures = 0;
    this.successes = 0;
    this.emit({ type: "state_change", from: oldState, to: newState });
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: CircuitEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  /**
   * Add an event listener
   */
  addListener(listener: CircuitEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitMetrics {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedRequests: this.rejectedRequests,
      stateChanges: this.stateChanges,
      lastFailureTime: this.lastFailureTime || null,
      lastSuccessTime: this.lastSuccessTime || null,
      currentState: this.state,
      consecutiveSuccesses: this.successes,
      consecutiveFailures: this.failures,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Force reset to closed state (for testing or manual intervention)
   */
  reset(): void {
    const oldState = this.state;
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    if (oldState !== "closed") {
      this.stateChanges++;
      this.emit({ type: "state_change", from: oldState, to: "closed" });
    }
  }

  /**
   * Force open the circuit (for testing or emergency shutdown)
   */
  forceOpen(): void {
    const oldState = this.state;
    if (oldState !== "open") {
      this.state = "open";
      this.lastFailureTime = Date.now();
      this.stateChanges++;
      this.emit({ type: "state_change", from: oldState, to: "open" });
    }
  }
}

// ============================================================================
// CIRCUIT BREAKER FACTORY
// ============================================================================

/**
 * Named circuit breakers for different services
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a named circuit breaker
 */
export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  let breaker = circuitBreakers.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker({ ...config, name });
    circuitBreakers.set(name, breaker);
  }
  return breaker;
}

/**
 * Get all circuit breaker statuses
 */
export function getAllBreakerMetrics(): Map<string, CircuitMetrics> {
  const result = new Map<string, CircuitMetrics>();
  for (const [name, breaker] of circuitBreakers) {
    result.set(name, breaker.getMetrics());
  }
  return result;
}

/**
 * Reset all circuit breakers
 */
export function resetAllBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
}

// ============================================================================
// SDK-PROTECTED OPERATIONS
// ============================================================================

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

/**
 * Make a protected Agent SDK call with circuit breaker
 */
export async function protectedAgentCall(
  prompt: string,
  breakerName: string = "agent-sdk",
  config?: Partial<CircuitBreakerConfig>
): Promise<string> {
  const breaker = getCircuitBreaker(breakerName, config);

  return breaker.execute(async () => {
    const response = query({
      prompt,
      options: {
        cwd: process.cwd(),
        allowedTools: [],
      },
    });

    let fullText = "";
    for await (const message of response) {
      if (message.type === "assistant") {
        fullText += extractTextContent(message);
      }
    }

    if (!fullText) {
      throw new Error("Empty response from agent");
    }

    return fullText;
  });
}

// ============================================================================
// MULTI-LAYER TIMEOUT PROTECTION
// ============================================================================

/**
 * Timeout layer configuration
 */
export interface TimeoutConfig {
  /** Total job timeout in ms */
  jobTimeoutMs: number;
  /** Individual request timeout in ms */
  requestTimeoutMs: number;
  /** Token/input limit per request */
  inputTokenLimit: number;
  /** Total spend limit in dollars */
  budgetLimitDollars: number;
}

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  jobTimeoutMs: 60 * 60 * 1000, // 1 hour
  requestTimeoutMs: 60 * 1000, // 60 seconds
  inputTokenLimit: 100000,
  budgetLimitDollars: 10,
};

/**
 * Execute with timeout protection
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  label: string = "operation"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Execute with multi-layer protection
 */
export async function protectedExecute<T>(
  operation: () => Promise<T>,
  config: Partial<TimeoutConfig> = {},
  breakerConfig?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const timeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...config };
  const breaker = getCircuitBreaker("protected", breakerConfig);

  return breaker.execute(async () => {
    return withTimeout(
      operation,
      timeoutConfig.requestTimeoutMs,
      "protected operation"
    );
  });
}

// ============================================================================
// RELIABILITY COMPOUNDING UTILITIES
// ============================================================================

/**
 * Calculate overall reliability given per-action reliability and action count
 * Formula: overall = per_action ^ actions
 */
export function calculateOverallReliability(
  perActionReliability: number,
  actionCount: number
): number {
  return Math.pow(perActionReliability, actionCount);
}

/**
 * Calculate required per-action reliability to achieve target overall reliability
 * Formula: per_action = target ^ (1 / actions)
 */
export function requiredPerActionReliability(
  targetOverall: number,
  actionCount: number
): number {
  return Math.pow(targetOverall, 1 / actionCount);
}

/**
 * Reliability improvement recommendations
 */
export interface ReliabilityRecommendation {
  current: number;
  target: number;
  actionCount: number;
  currentOverall: number;
  targetPerAction: number;
  recommendations: string[];
}

/**
 * Analyze reliability and provide recommendations
 */
export function analyzeReliability(
  currentPerAction: number,
  actionCount: number,
  targetOverall: number = 0.9
): ReliabilityRecommendation {
  const currentOverall = calculateOverallReliability(
    currentPerAction,
    actionCount
  );
  const targetPerAction = requiredPerActionReliability(
    targetOverall,
    actionCount
  );

  const recommendations: string[] = [];

  if (currentPerAction < targetPerAction) {
    const gap = targetPerAction - currentPerAction;
    const gapPercent = (gap * 100).toFixed(1);

    recommendations.push(
      `Improve per-action reliability by ${gapPercent}% (from ${(currentPerAction * 100).toFixed(1)}% to ${(targetPerAction * 100).toFixed(1)}%)`
    );

    if (gap > 0.03) {
      recommendations.push("Consider breaking large actions into smaller steps");
      recommendations.push("Add verification checkpoints between actions");
    }

    if (currentPerAction < 0.95) {
      recommendations.push("Implement circuit breakers for external calls");
      recommendations.push("Add retry logic with exponential backoff");
    }

    if (actionCount > 10) {
      recommendations.push("Reduce action count through task decomposition");
      recommendations.push("Use checkpoint-resume pattern for long workflows");
    }
  } else {
    recommendations.push(
      "Current reliability meets target. Consider adding monitoring."
    );
  }

  return {
    current: currentPerAction,
    target: targetOverall,
    actionCount,
    currentOverall,
    targetPerAction,
    recommendations,
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate the circuit breaker pattern
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 8: Circuit Breaker Pattern ===\n");

  // Example 1: Basic circuit breaker usage
  console.log("1. Basic Circuit Breaker Usage");
  const breaker = new CircuitBreaker({
    maxFailures: 3,
    resetTimeMs: 5000,
    name: "demo",
  });

  // Track events
  const events: CircuitEvent[] = [];
  breaker.addListener((event) => events.push(event));

  // Simulate some operations
  let successCount = 0;
  let failCount = 0;

  // Helper to simulate operations
  async function simulateOperation(shouldFail: boolean): Promise<string> {
    return breaker.execute(async () => {
      if (shouldFail) {
        throw new Error("Simulated failure");
      }
      return "Success";
    });
  }

  // Run some successful operations
  for (let i = 0; i < 3; i++) {
    try {
      await simulateOperation(false);
      successCount++;
    } catch {
      failCount++;
    }
  }
  console.log(`   After 3 successes: state=${breaker.getState()}`);

  // Run failing operations until circuit opens
  for (let i = 0; i < 4; i++) {
    try {
      await simulateOperation(true);
      successCount++;
    } catch (e) {
      failCount++;
      if ((e as Error).message === "Circuit breaker is open") {
        console.log(`   Request ${i + 4}: Rejected (circuit open)`);
      }
    }
  }
  console.log(`   After failures: state=${breaker.getState()}`);

  const metrics = breaker.getMetrics();
  console.log(`   Metrics: ${metrics.successfulRequests} success, ${metrics.failedRequests} failed, ${metrics.rejectedRequests} rejected`);

  // Example 2: Reliability calculations
  console.log("\n2. Reliability Compounding Analysis");
  const scenarios = [
    { perAction: 0.95, actions: 5 },
    { perAction: 0.95, actions: 10 },
    { perAction: 0.95, actions: 20 },
    { perAction: 0.99, actions: 20 },
  ];

  for (const { perAction, actions } of scenarios) {
    const overall = calculateOverallReliability(perAction, actions);
    console.log(
      `   ${(perAction * 100).toFixed(0)}% per-action, ${actions} actions = ${(overall * 100).toFixed(1)}% overall`
    );
  }

  // Example 3: Reliability recommendations
  console.log("\n3. Reliability Improvement Recommendations");
  const analysis = analyzeReliability(0.95, 20, 0.9);
  console.log(`   Current overall: ${(analysis.currentOverall * 100).toFixed(1)}%`);
  console.log(`   Target overall: ${(analysis.target * 100).toFixed(0)}%`);
  console.log(`   Required per-action: ${(analysis.targetPerAction * 100).toFixed(1)}%`);
  console.log("   Recommendations:");
  for (const rec of analysis.recommendations.slice(0, 3)) {
    console.log(`   - ${rec}`);
  }

  // Example 4: Named circuit breakers
  console.log("\n4. Named Circuit Breakers");
  const externalBreaker = getCircuitBreaker("external-api", { maxFailures: 5 });
  const dbBreaker = getCircuitBreaker("database", { maxFailures: 2 });

  console.log(`   external-api: state=${externalBreaker.getState()}, maxFailures=${externalBreaker.getConfig().maxFailures}`);
  console.log(`   database: state=${dbBreaker.getState()}, maxFailures=${dbBreaker.getConfig().maxFailures}`);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
