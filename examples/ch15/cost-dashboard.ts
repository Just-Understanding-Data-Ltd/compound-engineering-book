/**
 * Chapter 15: Cost Dashboard
 *
 * Implements usage metrics tracking and cost optimization reporting.
 * Track model distribution, cache hit rates, and optimization opportunities.
 */

import { type ModelTier } from './model-selector';

// Usage record for tracking
export interface UsageMetrics {
  timestamp: Date;
  model: string;
  tier: ModelTier;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  task: string;
  taskCategory: string;
  durationMs: number;
  cacheHitRate: number;
  escalated: boolean;
  developer?: string;
  project?: string;
}

// Aggregated dashboard data
export interface CostDashboard {
  period: string;
  totalCost: number;
  requestCount: number;
  costByModel: Record<string, number>;
  costByTask: Record<string, number>;
  modelDistribution: Record<ModelTier, number>;
  cacheHitRate: number;
  avgCostPerRequest: number;
  escalationRate: number;
  topExpensiveTasks: Array<{ task: string; cost: number; count: number }>;
  dailyTrend: Array<{ date: string; cost: number; requests: number }>;
  optimizationOpportunities: OptimizationOpportunity[];
}

// Optimization opportunity
export interface OptimizationOpportunity {
  type: 'model-downgrade' | 'cache-improvement' | 'task-consolidation' | 'high-cost-task';
  description: string;
  estimatedSavings: number;
  affectedRequests: number;
}

// Team cost allocation
export interface TeamCostAllocation {
  developer: string;
  project: string;
  cost: number;
  requests: number;
  efficiency: number;  // cost per completed task
  modelBreakdown: Record<ModelTier, number>;
}

/**
 * In-memory usage log
 */
let usageLogs: UsageMetrics[] = [];

/**
 * Record a usage metric
 */
export function logUsage(metrics: Omit<UsageMetrics, 'timestamp'>): void {
  usageLogs.push({
    ...metrics,
    timestamp: new Date()
  });
}

/**
 * Get usage logs
 */
export function getUsageLogs(): UsageMetrics[] {
  return [...usageLogs];
}

/**
 * Clear usage logs (for testing)
 */
export function clearUsageLogs(): void {
  usageLogs = [];
}

/**
 * Group and sum values by key
 */
function groupAndSum(
  logs: UsageMetrics[],
  keyField: keyof UsageMetrics,
  valueField: keyof UsageMetrics
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const log of logs) {
    const key = String(log[keyField]);
    const value = log[valueField];

    if (typeof value === 'number') {
      result[key] = (result[key] || 0) + value;
    }
  }

  return result;
}

/**
 * Calculate model distribution
 */
function calculateModelDistribution(logs: UsageMetrics[]): Record<ModelTier, number> {
  const distribution: Record<ModelTier, number> = {
    haiku: 0,
    sonnet: 0,
    opus: 0
  };

  for (const log of logs) {
    distribution[log.tier]++;
  }

  return distribution;
}

/**
 * Calculate average cache hit rate
 */
function calculateCacheHitRate(logs: UsageMetrics[]): number {
  if (logs.length === 0) return 0;
  return logs.reduce((sum, l) => sum + l.cacheHitRate, 0) / logs.length;
}

/**
 * Find top expensive tasks
 */
function findTopExpensive(
  logs: UsageMetrics[],
  limit: number
): Array<{ task: string; cost: number; count: number }> {
  const taskCosts: Record<string, { cost: number; count: number }> = {};

  for (const log of logs) {
    if (!taskCosts[log.taskCategory]) {
      taskCosts[log.taskCategory] = { cost: 0, count: 0 };
    }
    const taskEntry = taskCosts[log.taskCategory]!;
    taskEntry.cost += log.cost;
    taskEntry.count++;
  }

  return Object.entries(taskCosts)
    .map(([task, data]) => ({ task, ...data }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}

/**
 * Calculate daily cost trend
 */
function calculateDailyTrend(
  logs: UsageMetrics[]
): Array<{ date: string; cost: number; requests: number }> {
  const dailyData: Record<string, { cost: number; requests: number }> = {};

  for (const log of logs) {
    const datePart = log.timestamp.toISOString().split('T')[0];
    const date = datePart ?? 'unknown';
    if (!dailyData[date]) {
      dailyData[date] = { cost: 0, requests: 0 };
    }
    const dailyEntry = dailyData[date]!;
    dailyEntry.cost += log.cost;
    dailyEntry.requests++;
  }

  return Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Identify optimization opportunities
 */
function findOptimizationOpportunities(logs: UsageMetrics[]): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // Check for Opus usage that could be Sonnet
  const opusLogs = logs.filter(l => l.tier === 'opus');
  const simpleOpusLogs = opusLogs.filter(l =>
    !l.taskCategory.includes('architecture') &&
    !l.taskCategory.includes('security') &&
    l.tokensOut < 1000
  );

  if (simpleOpusLogs.length > 0) {
    const opusCost = simpleOpusLogs.reduce((sum, l) => sum + l.cost, 0);
    const sonnetCost = simpleOpusLogs.reduce((sum, l) =>
      sum + (l.tokensIn * 3 / 1_000_000) + (l.tokensOut * 15 / 1_000_000), 0
    );

    opportunities.push({
      type: 'model-downgrade',
      description: `${simpleOpusLogs.length} Opus requests could use Sonnet`,
      estimatedSavings: opusCost - sonnetCost,
      affectedRequests: simpleOpusLogs.length
    });
  }

  // Check for low cache hit rates
  const avgCacheRate = calculateCacheHitRate(logs);
  if (avgCacheRate < 0.5) {
    const potentialSavings = logs.reduce((sum, l) => {
      const cacheable = l.tokensIn * 0.7;  // Estimate 70% could be cached
      return sum + (cacheable * 0.9 * 3 / 1_000_000);  // 90% savings on cached tokens
    }, 0);

    opportunities.push({
      type: 'cache-improvement',
      description: `Cache hit rate is ${(avgCacheRate * 100).toFixed(0)}%, target is 80%+`,
      estimatedSavings: potentialSavings,
      affectedRequests: logs.length
    });
  }

  // Check for high-cost individual tasks
  const taskCosts = findTopExpensive(logs, 5);
  for (const task of taskCosts) {
    if (task.cost > logs.reduce((sum, l) => sum + l.cost, 0) * 0.2) {  // More than 20% of total
      opportunities.push({
        type: 'high-cost-task',
        description: `Task "${task.task}" accounts for large portion of spend`,
        estimatedSavings: task.cost * 0.3,  // Estimate 30% could be saved
        affectedRequests: task.count
      });
    }
  }

  return opportunities;
}

/**
 * Generate cost dashboard
 */
export function generateDashboard(
  logs: UsageMetrics[],
  period?: string
): CostDashboard {
  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const requestCount = logs.length;

  return {
    period: period || 'All time',
    totalCost,
    requestCount,
    costByModel: groupAndSum(logs, 'model', 'cost'),
    costByTask: groupAndSum(logs, 'taskCategory', 'cost'),
    modelDistribution: calculateModelDistribution(logs),
    cacheHitRate: calculateCacheHitRate(logs),
    avgCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
    escalationRate: logs.filter(l => l.escalated).length / Math.max(logs.length, 1),
    topExpensiveTasks: findTopExpensive(logs, 10),
    dailyTrend: calculateDailyTrend(logs),
    optimizationOpportunities: findOptimizationOpportunities(logs)
  };
}

/**
 * Generate team cost allocation report
 */
export function generateTeamAllocation(logs: UsageMetrics[]): TeamCostAllocation[] {
  const byDeveloper: Record<string, UsageMetrics[]> = {};

  for (const log of logs) {
    const dev = log.developer || 'Unknown';
    if (!byDeveloper[dev]) {
      byDeveloper[dev] = [];
    }
    byDeveloper[dev].push(log);
  }

  return Object.entries(byDeveloper).map(([developer, devLogs]) => {
    const modelBreakdown: Record<ModelTier, number> = { haiku: 0, sonnet: 0, opus: 0 };
    for (const log of devLogs) {
      modelBreakdown[log.tier] += log.cost;
    }

    const projects = new Set(devLogs.map(l => l.project || 'Unknown'));

    return {
      developer,
      project: Array.from(projects).join(', '),
      cost: devLogs.reduce((sum, l) => sum + l.cost, 0),
      requests: devLogs.length,
      efficiency: devLogs.reduce((sum, l) => sum + l.cost, 0) / devLogs.length,
      modelBreakdown
    };
  }).sort((a, b) => b.cost - a.cost);
}

/**
 * Format dashboard for display
 */
export function formatDashboard(dashboard: CostDashboard): string {
  const lines: string[] = [];

  lines.push(`=== Cost Dashboard: ${dashboard.period} ===`);
  lines.push('');

  // Overview
  lines.push('Overview:');
  lines.push(`  Total Cost: $${dashboard.totalCost.toFixed(4)}`);
  lines.push(`  Requests: ${dashboard.requestCount}`);
  lines.push(`  Avg Cost/Request: $${dashboard.avgCostPerRequest.toFixed(6)}`);
  lines.push(`  Cache Hit Rate: ${(dashboard.cacheHitRate * 100).toFixed(1)}%`);
  lines.push(`  Escalation Rate: ${(dashboard.escalationRate * 100).toFixed(1)}%`);
  lines.push('');

  // Model distribution
  lines.push('Model Distribution:');
  const total = dashboard.modelDistribution.haiku +
                dashboard.modelDistribution.sonnet +
                dashboard.modelDistribution.opus;
  if (total > 0) {
    lines.push(`  Haiku: ${dashboard.modelDistribution.haiku} (${(dashboard.modelDistribution.haiku / total * 100).toFixed(0)}%)`);
    lines.push(`  Sonnet: ${dashboard.modelDistribution.sonnet} (${(dashboard.modelDistribution.sonnet / total * 100).toFixed(0)}%)`);
    lines.push(`  Opus: ${dashboard.modelDistribution.opus} (${(dashboard.modelDistribution.opus / total * 100).toFixed(0)}%)`);
  }
  lines.push('');

  // Top expensive tasks
  if (dashboard.topExpensiveTasks.length > 0) {
    lines.push('Top Expensive Tasks:');
    for (const task of dashboard.topExpensiveTasks.slice(0, 5)) {
      lines.push(`  ${task.task}: $${task.cost.toFixed(4)} (${task.count} requests)`);
    }
    lines.push('');
  }

  // Optimization opportunities
  if (dashboard.optimizationOpportunities.length > 0) {
    lines.push('Optimization Opportunities:');
    for (const opp of dashboard.optimizationOpportunities) {
      lines.push(`  [${opp.type}] ${opp.description}`);
      lines.push(`    Est. savings: $${opp.estimatedSavings.toFixed(4)} (${opp.affectedRequests} requests)`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate sample usage data for testing/demo
 */
export function generateSampleData(count: number): UsageMetrics[] {
  const tiers: ModelTier[] = ['haiku', 'sonnet', 'opus'];
  const taskCategories = ['file-read', 'code-generation', 'refactoring', 'testing', 'architecture'];
  const developers = ['alice', 'bob', 'charlie'];
  const projects = ['api', 'frontend', 'infra'];

  const now = new Date();
  const data: UsageMetrics[] = [];

  for (let i = 0; i < count; i++) {
    // Realistic distribution: 70% haiku, 25% sonnet, 5% opus
    const rand = Math.random();
    const tier = rand < 0.7 ? 'haiku' : rand < 0.95 ? 'sonnet' : 'opus';

    const tokensIn = Math.floor(Math.random() * 5000) + 1000;
    const tokensOut = Math.floor(Math.random() * 1000) + 100;

    // Calculate cost based on tier
    let cost: number;
    if (tier === 'haiku') {
      cost = (tokensIn * 0.25 / 1_000_000) + (tokensOut * 1.25 / 1_000_000);
    } else if (tier === 'sonnet') {
      cost = (tokensIn * 3 / 1_000_000) + (tokensOut * 15 / 1_000_000);
    } else {
      cost = (tokensIn * 15 / 1_000_000) + (tokensOut * 75 / 1_000_000);
    }

    data.push({
      timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      model: `claude-${tier}`,
      tier,
      tokensIn,
      tokensOut,
      cost,
      task: `Task ${i}`,
      taskCategory: taskCategories[Math.floor(Math.random() * taskCategories.length)] ?? 'unknown',
      durationMs: Math.floor(Math.random() * 5000) + 500,
      cacheHitRate: Math.random() * 0.5 + 0.3,  // 30-80%
      escalated: Math.random() < 0.15,  // 15% escalation rate
      developer: developers[Math.floor(Math.random() * developers.length)] ?? 'unknown',
      project: projects[Math.floor(Math.random() * projects.length)] ?? 'unknown'
    });
  }

  return data;
}

// Demo: Show cost dashboard in action
async function demo() {
  console.log('=== Cost Dashboard Demo ===\n');

  // Generate sample data
  const sampleData = generateSampleData(100);
  console.log(`Generated ${sampleData.length} sample usage records\n`);

  // Generate and display dashboard
  const dashboard = generateDashboard(sampleData, 'Last 7 days');
  console.log(formatDashboard(dashboard));
  console.log('');

  // Team allocation
  console.log('=== Team Cost Allocation ===\n');
  const allocation = generateTeamAllocation(sampleData);
  for (const dev of allocation) {
    console.log(`${dev.developer}:`);
    console.log(`  Cost: $${dev.cost.toFixed(4)}`);
    console.log(`  Requests: ${dev.requests}`);
    console.log(`  Efficiency: $${dev.efficiency.toFixed(6)}/request`);
    console.log(`  Model breakdown: H=${dev.modelBreakdown.haiku.toFixed(4)} S=${dev.modelBreakdown.sonnet.toFixed(4)} O=${dev.modelBreakdown.opus.toFixed(4)}`);
    console.log('');
  }
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
