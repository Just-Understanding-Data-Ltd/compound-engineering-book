/**
 * Chapter 15: Progressive Model Escalation
 *
 * Implements a cost-saving pattern: start with cheap models,
 * escalate to expensive ones only when quality gates fail.
 * This can save 40-70% on AI costs by using Haiku for simple tasks.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ModelTier, MODEL_CONFIGS, getModelConfig, estimateCost } from './model-selector';

// Quality gate result
export interface QualityCheck {
  name: string;
  passed: boolean;
  message?: string;
}

// Escalation result with tracking
export interface EscalationResult {
  success: boolean;
  finalTier: ModelTier;
  attempts: Array<{
    tier: ModelTier;
    passed: boolean;
    qualityResults: QualityCheck[];
    cost: number;
  }>;
  totalCost: number;
  savedVsOpus: number;
  response?: Anthropic.Message;
}

// Quality gate functions
export type QualityGate = (response: Anthropic.Message) => QualityCheck;

/**
 * Check if response contains valid code (basic syntax check)
 */
export function syntaxGate(response: Anthropic.Message): QualityCheck {
  const content = response.content[0];
  if (content.type !== 'text') {
    return { name: 'syntax', passed: false, message: 'No text response' };
  }

  const text = content.text;

  // Check for obvious syntax errors in code blocks
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];

  for (const block of codeBlocks) {
    // Check for unbalanced braces
    const braces = block.match(/[{}]/g) || [];
    let balance = 0;
    for (const brace of braces) {
      balance += brace === '{' ? 1 : -1;
      if (balance < 0) {
        return { name: 'syntax', passed: false, message: 'Unbalanced braces in code' };
      }
    }
    if (balance !== 0) {
      return { name: 'syntax', passed: false, message: 'Unbalanced braces in code' };
    }

    // Check for unbalanced parentheses
    const parens = block.match(/[()]/g) || [];
    balance = 0;
    for (const paren of parens) {
      balance += paren === '(' ? 1 : -1;
      if (balance < 0) {
        return { name: 'syntax', passed: false, message: 'Unbalanced parentheses' };
      }
    }
    if (balance !== 0) {
      return { name: 'syntax', passed: false, message: 'Unbalanced parentheses' };
    }
  }

  return { name: 'syntax', passed: true };
}

/**
 * Check if response is complete (not truncated)
 */
export function completenessGate(response: Anthropic.Message): QualityCheck {
  // Check stop reason
  if (response.stop_reason === 'max_tokens') {
    return { name: 'completeness', passed: false, message: 'Response was truncated' };
  }

  const content = response.content[0];
  if (content.type !== 'text') {
    return { name: 'completeness', passed: true };
  }

  const text = content.text;

  // Check for incomplete sentences
  if (text.endsWith('...') || text.endsWith('etc')) {
    return { name: 'completeness', passed: false, message: 'Response appears incomplete' };
  }

  // Check for incomplete code blocks
  const openBlocks = (text.match(/```/g) || []).length;
  if (openBlocks % 2 !== 0) {
    return { name: 'completeness', passed: false, message: 'Unclosed code block' };
  }

  return { name: 'completeness', passed: true };
}

/**
 * Check if response addresses the task
 */
export function relevanceGate(task: string): QualityGate {
  return (response: Anthropic.Message): QualityCheck => {
    const content = response.content[0];
    if (content.type !== 'text') {
      return { name: 'relevance', passed: false, message: 'No text response' };
    }

    const text = content.text.toLowerCase();
    const taskWords = task.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5);

    // At least some task-related words should appear in response
    const matchedWords = taskWords.filter(w => text.includes(w));
    const matchRatio = matchedWords.length / Math.max(taskWords.length, 1);

    if (matchRatio < 0.3) {
      return {
        name: 'relevance',
        passed: false,
        message: `Response may not address the task (${(matchRatio * 100).toFixed(0)}% keyword match)`
      };
    }

    return { name: 'relevance', passed: true };
  };
}

/**
 * Check minimum response length
 */
export function lengthGate(minLength: number): QualityGate {
  return (response: Anthropic.Message): QualityCheck => {
    const content = response.content[0];
    if (content.type !== 'text') {
      return { name: 'length', passed: false, message: 'No text response' };
    }

    if (content.text.length < minLength) {
      return {
        name: 'length',
        passed: false,
        message: `Response too short (${content.text.length} < ${minLength})`
      };
    }

    return { name: 'length', passed: true };
  };
}

/**
 * Run all quality gates on a response
 */
export function runQualityGates(
  response: Anthropic.Message,
  gates: QualityGate[]
): QualityCheck[] {
  return gates.map(gate => gate(response));
}

/**
 * Check if all gates passed
 */
export function allGatesPassed(results: QualityCheck[]): boolean {
  return results.every(r => r.passed);
}

/**
 * Execute a task with progressive model escalation
 */
export async function executeWithEscalation(
  client: Anthropic,
  task: string,
  options?: {
    gates?: QualityGate[];
    startTier?: ModelTier;
    maxTokens?: number;
  }
): Promise<EscalationResult> {
  const gates = options?.gates || [
    syntaxGate,
    completenessGate,
    relevanceGate(task),
    lengthGate(100)
  ];

  const tierOrder: ModelTier[] = ['haiku', 'sonnet', 'opus'];
  const startIndex = options?.startTier
    ? tierOrder.indexOf(options.startTier)
    : 0;

  const attempts: EscalationResult['attempts'] = [];
  let lastResponse: Anthropic.Message | undefined;

  // Calculate what Opus alone would cost
  const opusOnlyCost = estimateCost('opus', 5000, 1000);

  for (let i = startIndex; i < tierOrder.length; i++) {
    const tier = tierOrder[i];
    const config = getModelConfig(tier);

    console.log(`Trying ${tier}...`);

    const response = await client.messages.create({
      model: config.modelId,
      max_tokens: options?.maxTokens || 4096,
      messages: [{
        role: 'user',
        content: task
      }]
    });

    const qualityResults = runQualityGates(response, gates);
    const passed = allGatesPassed(qualityResults);
    const cost = estimateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    attempts.push({ tier, passed, qualityResults, cost });
    lastResponse = response;

    if (passed) {
      const totalCost = attempts.reduce((sum, a) => sum + a.cost, 0);
      return {
        success: true,
        finalTier: tier,
        attempts,
        totalCost,
        savedVsOpus: opusOnlyCost - totalCost,
        response
      };
    }

    // Log escalation
    const failures = qualityResults.filter(r => !r.passed);
    console.log(`  Failed gates: ${failures.map(f => f.name).join(', ')}`);
    if (i < tierOrder.length - 1) {
      console.log(`  Escalating to ${tierOrder[i + 1]}...`);
    }
  }

  // All tiers exhausted
  const totalCost = attempts.reduce((sum, a) => sum + a.cost, 0);
  return {
    success: false,
    finalTier: 'opus',
    attempts,
    totalCost,
    savedVsOpus: opusOnlyCost - totalCost,
    response: lastResponse
  };
}

/**
 * Simulate escalation for testing/demo (without API calls)
 */
export function simulateEscalation(
  task: string,
  haikuSuccessRate: number = 0.7,
  sonnetSuccessRate: number = 0.9
): EscalationResult {
  const attempts: EscalationResult['attempts'] = [];

  // Simulate Haiku attempt
  const haikuPassed = Math.random() < haikuSuccessRate;
  const haikuCost = estimateCost('haiku', 5000, 500);
  attempts.push({
    tier: 'haiku',
    passed: haikuPassed,
    qualityResults: [
      { name: 'syntax', passed: true },
      { name: 'completeness', passed: haikuPassed },
      { name: 'relevance', passed: haikuPassed }
    ],
    cost: haikuCost
  });

  if (haikuPassed) {
    return {
      success: true,
      finalTier: 'haiku',
      attempts,
      totalCost: haikuCost,
      savedVsOpus: estimateCost('opus', 5000, 500) - haikuCost
    };
  }

  // Simulate Sonnet attempt
  const sonnetPassed = Math.random() < sonnetSuccessRate;
  const sonnetCost = estimateCost('sonnet', 5000, 500);
  attempts.push({
    tier: 'sonnet',
    passed: sonnetPassed,
    qualityResults: [
      { name: 'syntax', passed: true },
      { name: 'completeness', passed: sonnetPassed },
      { name: 'relevance', passed: true }
    ],
    cost: sonnetCost
  });

  if (sonnetPassed) {
    return {
      success: true,
      finalTier: 'sonnet',
      attempts,
      totalCost: haikuCost + sonnetCost,
      savedVsOpus: estimateCost('opus', 5000, 500) - (haikuCost + sonnetCost)
    };
  }

  // Opus always succeeds
  const opusCost = estimateCost('opus', 5000, 500);
  attempts.push({
    tier: 'opus',
    passed: true,
    qualityResults: [
      { name: 'syntax', passed: true },
      { name: 'completeness', passed: true },
      { name: 'relevance', passed: true }
    ],
    cost: opusCost
  });

  return {
    success: true,
    finalTier: 'opus',
    attempts,
    totalCost: haikuCost + sonnetCost + opusCost,
    savedVsOpus: estimateCost('opus', 5000, 500) - (haikuCost + sonnetCost + opusCost)
  };
}

/**
 * Calculate cost savings from escalation strategy
 */
export function calculateSavings(results: EscalationResult[]): {
  totalCost: number;
  opusOnlyCost: number;
  savings: number;
  savingsPercent: number;
  tierDistribution: Record<ModelTier, number>;
} {
  const opusOnlyCost = results.length * estimateCost('opus', 5000, 500);
  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);

  const tierDistribution: Record<ModelTier, number> = {
    haiku: 0,
    sonnet: 0,
    opus: 0
  };

  for (const result of results) {
    tierDistribution[result.finalTier]++;
  }

  return {
    totalCost,
    opusOnlyCost,
    savings: opusOnlyCost - totalCost,
    savingsPercent: ((opusOnlyCost - totalCost) / opusOnlyCost) * 100,
    tierDistribution
  };
}

// Demo: Show escalation in action
async function demo() {
  console.log('=== Progressive Escalation Demo ===\n');

  // Simulate 100 tasks with different success rates
  console.log('Simulating 100 tasks with escalation strategy...\n');

  const results: EscalationResult[] = [];
  for (let i = 0; i < 100; i++) {
    const result = simulateEscalation(
      'Example task',
      0.7,  // 70% Haiku success rate
      0.95  // 95% Sonnet success rate
    );
    results.push(result);
  }

  const savings = calculateSavings(results);

  console.log('Results:');
  console.log(`  Total cost with escalation: $${savings.totalCost.toFixed(4)}`);
  console.log(`  Cost if always using Opus: $${savings.opusOnlyCost.toFixed(4)}`);
  console.log(`  Savings: $${savings.savings.toFixed(4)} (${savings.savingsPercent.toFixed(1)}%)`);
  console.log('');
  console.log('Tier distribution:');
  console.log(`  Haiku: ${savings.tierDistribution.haiku} tasks`);
  console.log(`  Sonnet: ${savings.tierDistribution.sonnet} tasks`);
  console.log(`  Opus: ${savings.tierDistribution.opus} tasks`);
}

// Run demo if executed directly
if (import.meta.main) {
  demo();
}
