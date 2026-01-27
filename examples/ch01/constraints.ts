/**
 * Chapter 1: System Constraints
 *
 * Meta-engineers design systems by defining constraints first.
 * Constraints capture what matters: performance, correctness, security.
 * Agents verify these constraints automatically.
 *
 * This pattern appears in Chapter 1 as an example of Level 3 engineering,
 * where you specify intent and constraints rather than implementation.
 */

// Type definitions for system constraints
export interface PerformanceConstraints {
  /** Maximum p99 latency in milliseconds */
  p99LatencyMs: number;
  /** Maximum memory usage in megabytes */
  maxMemoryMb: number;
  /** Minimum requests per second the system must handle */
  minThroughputRps: number;
}

export interface CorrectnessConstraints {
  /** System must never lose committed data */
  noDataLoss: boolean;
  /** All transactions must be atomic */
  transactionsAtomic: boolean;
  /** Event ordering must be preserved */
  orderingPreserved: boolean;
}

export interface SecurityConstraints {
  /** SQL injection attacks must be prevented */
  noSqlInjection: boolean;
  /** All endpoints require authentication */
  authRequired: boolean;
  /** Rate limiting must be enforced */
  rateLimitEnforced: boolean;
}

export interface SystemConstraints {
  performance: PerformanceConstraints;
  correctness: CorrectnessConstraints;
  security: SecurityConstraints;
}

// Example constraint definition for a production system
export const ProductionConstraints: SystemConstraints = {
  performance: {
    p99LatencyMs: 100,
    maxMemoryMb: 512,
    minThroughputRps: 1000,
  },
  correctness: {
    noDataLoss: true,
    transactionsAtomic: true,
    orderingPreserved: true,
  },
  security: {
    noSqlInjection: true,
    authRequired: true,
    rateLimitEnforced: true,
  },
};

// Constraint validator that checks if a system meets requirements
export function validateConstraints(
  constraints: SystemConstraints,
  metrics: {
    p99LatencyMs: number;
    memoryMb: number;
    throughputRps: number;
    hasDataLoss: boolean;
    hasAtomicTransactions: boolean;
    preservesOrdering: boolean;
    sqlInjectionVulnerable: boolean;
    hasAuth: boolean;
    hasRateLimiting: boolean;
  }
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  // Performance checks
  if (metrics.p99LatencyMs > constraints.performance.p99LatencyMs) {
    violations.push(
      `p99 latency ${metrics.p99LatencyMs}ms exceeds limit of ${constraints.performance.p99LatencyMs}ms`
    );
  }
  if (metrics.memoryMb > constraints.performance.maxMemoryMb) {
    violations.push(
      `Memory ${metrics.memoryMb}MB exceeds limit of ${constraints.performance.maxMemoryMb}MB`
    );
  }
  if (metrics.throughputRps < constraints.performance.minThroughputRps) {
    violations.push(
      `Throughput ${metrics.throughputRps}rps below minimum of ${constraints.performance.minThroughputRps}rps`
    );
  }

  // Correctness checks
  if (constraints.correctness.noDataLoss && metrics.hasDataLoss) {
    violations.push("Data loss detected");
  }
  if (constraints.correctness.transactionsAtomic && !metrics.hasAtomicTransactions) {
    violations.push("Non-atomic transactions detected");
  }
  if (constraints.correctness.orderingPreserved && !metrics.preservesOrdering) {
    violations.push("Event ordering not preserved");
  }

  // Security checks
  if (constraints.security.noSqlInjection && metrics.sqlInjectionVulnerable) {
    violations.push("SQL injection vulnerability detected");
  }
  if (constraints.security.authRequired && !metrics.hasAuth) {
    violations.push("Authentication not enforced");
  }
  if (constraints.security.rateLimitEnforced && !metrics.hasRateLimiting) {
    violations.push("Rate limiting not enforced");
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Example usage
const metrics = {
  p99LatencyMs: 85,
  memoryMb: 400,
  throughputRps: 1200,
  hasDataLoss: false,
  hasAtomicTransactions: true,
  preservesOrdering: true,
  sqlInjectionVulnerable: false,
  hasAuth: true,
  hasRateLimiting: true,
};

const result = validateConstraints(ProductionConstraints, metrics);
console.log("Constraint validation:", result.passed ? "PASSED" : "FAILED");
if (result.violations.length > 0) {
  console.log("Violations:", result.violations);
}
