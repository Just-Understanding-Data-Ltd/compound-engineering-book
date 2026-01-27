/**
 * Prompt Patterns Module
 *
 * This example demonstrates concepts from Chapter 3:
 * - Section 3.2: Chain-of-thought prompting
 * - Section 3.3: Constraint-based prompting
 * - Section 3.6: Anti-patterns to avoid
 *
 * These utilities help structure prompts that produce
 * better results by reducing entropy and forcing reasoning.
 *
 * @module ch03/prompt-patterns
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const client = new Anthropic();

// Result type for consistent error handling
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Chain-of-Thought Template
 *
 * Forces the LLM to reason through steps before implementing.
 * Reduces runtime bugs by discovering edge cases during planning.
 */
export interface ChainOfThoughtConfig {
  feature: string;
  questions: string[];
}

/**
 * Build a chain-of-thought prompt from configuration
 *
 * Chain-of-thought prompting converts runtime bugs into
 * compile-time requirements by forcing explicit reasoning.
 *
 * @example
 * const prompt = buildChainOfThought({
 *   feature: 'payment processing',
 *   questions: [
 *     'What are all the steps in this process?',
 *     'What can go wrong at each step?',
 *     'How should errors be handled?'
 *   ]
 * });
 *
 * @param config - Chain-of-thought configuration
 * @returns Formatted prompt string
 */
export function buildChainOfThought(config: ChainOfThoughtConfig): string {
  const { feature, questions } = config;

  const numberedQuestions = questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n');

  return `Before implementing ${feature}, think through:

${numberedQuestions}

After reasoning through this, implement the solution.`;
}

/**
 * Constraint Types
 *
 * Different constraint categories serve different purposes:
 * - format: Output structure (JSDoc, return types)
 * - behavior: What the code must do (validation, transactions)
 * - scope: What the code must not touch (files, interfaces)
 * - performance: Non-functional requirements (latency, memory)
 */
export type ConstraintType = 'format' | 'behavior' | 'scope' | 'performance';

export interface Constraint {
  type: ConstraintType;
  rule: string;
}

export interface ConstrainedPromptConfig {
  task: string;
  context?: string[];
  constraints: Constraint[];
  successCriteria?: string[];
}

/**
 * Build a constraint-based prompt
 *
 * Each constraint eliminates possible outputs, reducing entropy.
 * Think of constraints as a funnel: more constraints = fewer
 * but more correct possible outputs.
 *
 * @example
 * const prompt = buildConstrainedPrompt({
 *   task: 'Add validation to createUser endpoint',
 *   context: [
 *     'Validation patterns in src/utils/validation.ts',
 *     'Use Zod for schema validation'
 *   ],
 *   constraints: [
 *     { type: 'format', rule: 'Return Result<T, E>, never throw' },
 *     { type: 'behavior', rule: 'Validate email with RFC 5322' },
 *     { type: 'scope', rule: 'Do NOT modify existing interfaces' }
 *   ],
 *   successCriteria: [
 *     'Invalid requests return 400',
 *     'All tests pass'
 *   ]
 * });
 *
 * @param config - Prompt configuration
 * @returns Formatted constraint-based prompt
 */
export function buildConstrainedPrompt(config: ConstrainedPromptConfig): string {
  const { task, context, constraints, successCriteria } = config;

  let prompt = task;

  if (context && context.length > 0) {
    prompt += '\n\nContext:\n';
    prompt += context.map(c => `- ${c}`).join('\n');
  }

  if (constraints.length > 0) {
    prompt += '\n\nConstraints:';
    for (const c of constraints) {
      prompt += `\n- [${c.type.toUpperCase()}] ${c.rule}`;
    }
  }

  if (successCriteria && successCriteria.length > 0) {
    prompt += '\n\nSuccess criteria:';
    prompt += successCriteria.map(s => `\n- ${s}`).join('');
  }

  return prompt;
}

/**
 * Calculate constraint entropy reduction
 *
 * Each constraint type reduces the solution space by a factor:
 * - Type constraints: 100x reduction
 * - Format constraints: 10x reduction
 * - Behavior constraints: 10x reduction
 * - Style constraints: 10x reduction
 *
 * This is a simplified model of the entropy reduction described
 * in section 3.3 (The Constraint Funnel).
 *
 * @param constraints - Array of constraints
 * @returns Estimated reduction factor
 */
export function estimateEntropyReduction(constraints: Constraint[]): number {
  const reductionFactors: Record<ConstraintType, number> = {
    format: 10,
    behavior: 10,
    scope: 5,
    performance: 2
  };

  return constraints.reduce((total, constraint) => {
    return total * reductionFactors[constraint.type];
  }, 1);
}

/**
 * Prompt Quality Score
 *
 * Evaluates a prompt based on the three components:
 * - Has context (what exists, what matters)
 * - Has instruction (what to do)
 * - Has constraints (what boundaries to respect)
 */
export interface PromptAnalysis {
  hasContext: boolean;
  hasInstruction: boolean;
  hasConstraints: boolean;
  constraintCount: number;
  estimatedQuality: 'weak' | 'moderate' | 'strong';
  suggestions: string[];
}

/**
 * Analyze prompt quality
 *
 * Weak prompts have high entropy (many equally likely outputs).
 * Strong prompts have low entropy (few possible outputs, most correct).
 *
 * @example
 * const analysis = analyzePrompt('Add user validation to the API');
 * // Returns: { estimatedQuality: 'weak', suggestions: [...] }
 *
 * @param prompt - The prompt to analyze
 * @returns Analysis with quality assessment and suggestions
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  const lower = prompt.toLowerCase();

  // Check for context indicators
  const contextIndicators = ['context:', 'existing', 'pattern', 'follow', 'based on'];
  const hasContext = contextIndicators.some(ind => lower.includes(ind));

  // Check for instruction (action verbs)
  const actionVerbs = ['add', 'create', 'implement', 'fix', 'update', 'refactor', 'build'];
  const hasInstruction = actionVerbs.some(verb => lower.includes(verb));

  // Check for constraints
  const constraintIndicators = ['must', 'should', 'constraint', 'do not', 'never', 'always'];
  const hasConstraints = constraintIndicators.some(ind => lower.includes(ind));

  // Count explicit constraints (lines starting with -)
  const lines = prompt.split('\n');
  const constraintCount = lines.filter(line =>
    line.trim().startsWith('-') && constraintIndicators.some(ind => line.toLowerCase().includes(ind))
  ).length;

  // Build suggestions
  const suggestions: string[] = [];
  if (!hasContext) {
    suggestions.push('Add context: relevant files, existing patterns, domain knowledge');
  }
  if (!hasInstruction) {
    suggestions.push('Add clear instruction: specify action, location, expected output');
  }
  if (!hasConstraints) {
    suggestions.push('Add constraints: format, behavior, scope boundaries');
  }
  if (constraintCount < 3 && hasConstraints) {
    suggestions.push('Add more specific constraints to narrow the solution space');
  }

  // Determine quality
  let estimatedQuality: 'weak' | 'moderate' | 'strong';
  const score = (hasContext ? 1 : 0) + (hasInstruction ? 1 : 0) + (hasConstraints ? 1 : 0);

  if (score <= 1) {
    estimatedQuality = 'weak';
  } else if (score === 2) {
    estimatedQuality = 'moderate';
  } else {
    estimatedQuality = constraintCount >= 3 ? 'strong' : 'moderate';
  }

  return {
    hasContext,
    hasInstruction,
    hasConstraints,
    constraintCount,
    estimatedQuality,
    suggestions
  };
}

/**
 * Anti-pattern detector
 *
 * Identifies common prompting mistakes from section 3.6.
 */
export interface AntiPatternCheck {
  pattern: string;
  detected: boolean;
  recommendation: string;
}

/**
 * Check for prompting anti-patterns
 *
 * Anti-patterns produce poor results:
 * - Vague prompts ("make it better")
 * - Over-constrained prompts (specify HOW instead of WHAT)
 * - Missing context
 * - Mixed exploration and implementation
 *
 * @param prompt - The prompt to check
 * @returns Array of detected anti-patterns
 */
export function detectAntiPatterns(prompt: string): AntiPatternCheck[] {
  const checks: AntiPatternCheck[] = [];
  const lower = prompt.toLowerCase();

  // Vague prompts
  const vaguePatterns = ['make it better', 'fix the bugs', 'improve it', 'clean up'];
  const isVague = vaguePatterns.some(p => lower.includes(p));
  checks.push({
    pattern: 'Vague prompt',
    detected: isVague,
    recommendation: 'Be specific about what to change and how to verify success'
  });

  // Over-constrained (tells HOW instead of WHAT)
  const imperativePatterns = ['first,', 'then,', 'after that,', 'step 1:', 'step 2:'];
  const isOverConstrained = imperativePatterns.filter(p => lower.includes(p)).length >= 3;
  checks.push({
    pattern: 'Over-constrained (imperative)',
    detected: isOverConstrained,
    recommendation: 'Specify WHAT must be true, not HOW to achieve it'
  });

  // Missing context
  const hasFile = /\.(ts|js|md|json|yaml|py)/.test(prompt);
  const hasPath = prompt.includes('/') || prompt.includes('src');
  const lacksContext = !hasFile && !hasPath && prompt.length > 50;
  checks.push({
    pattern: 'Missing context',
    detected: lacksContext,
    recommendation: 'Include relevant file paths and existing patterns'
  });

  // Mixed exploration and implementation
  const hasQuestion = prompt.includes('?') || lower.includes('how does') || lower.includes('what is');
  const hasImplementation = lower.includes('implement') || lower.includes('create') || lower.includes('add');
  const isMixed = hasQuestion && hasImplementation;
  checks.push({
    pattern: 'Mixed exploration and implementation',
    detected: isMixed,
    recommendation: 'Separate into two prompts: explore first, then implement'
  });

  return checks;
}

// ============================================================================
// SDK Integration Examples
// ============================================================================

type ContentBlock = Anthropic.Messages.ContentBlock;

/**
 * Execute a chain-of-thought prompt using the Anthropic SDK
 *
 * This demonstrates how to combine prompt building utilities
 * with actual API calls. Chain-of-thought prompting forces
 * Claude to reason through steps before implementing.
 *
 * @param feature - The feature to reason about
 * @param questions - Questions to guide reasoning
 * @returns Claude's response with step-by-step reasoning
 */
export async function executeChainOfThought(
  feature: string,
  questions: string[]
): Promise<{ reasoning: string; tokenUsage: { input: number; output: number } }> {
  const prompt = buildChainOfThought({ feature, questions });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: 'You are a senior software engineer. Reason carefully through each question before providing implementation guidance.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((block: ContentBlock) => block.type === 'text');
  const reasoning = textContent?.type === 'text' ? textContent.text : '';

  return {
    reasoning,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

/**
 * Execute a constraint-based prompt using the Anthropic SDK
 *
 * Demonstrates how constraints reduce entropy in Claude's output.
 * More constraints = more focused, correct output.
 *
 * @param config - Constrained prompt configuration
 * @returns Claude's response following the constraints
 */
export async function executeConstrainedPrompt(
  config: ConstrainedPromptConfig
): Promise<{ implementation: string; tokenUsage: { input: number; output: number } }> {
  const prompt = buildConstrainedPrompt(config);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: `You are a senior TypeScript developer. Follow all constraints exactly. Output only code that meets ALL success criteria.`,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((block: ContentBlock) => block.type === 'text');
  const implementation = textContent?.type === 'text' ? textContent.text : '';

  return {
    implementation,
    tokenUsage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

/**
 * Compare weak vs strong prompts using the SDK
 *
 * Demonstrates the quality difference between unconstrained
 * and well-constrained prompts by running both through Claude.
 */
export async function comparePromptQuality(
  weakPrompt: string,
  strongConfig: ConstrainedPromptConfig
): Promise<{
  weakResult: { text: string; analysis: PromptAnalysis };
  strongResult: { text: string; analysis: PromptAnalysis };
  qualityImprovement: string;
}> {
  // Analyze prompts before execution
  const weakAnalysis = analyzePrompt(weakPrompt);
  const strongPrompt = buildConstrainedPrompt(strongConfig);
  const strongAnalysis = analyzePrompt(strongPrompt);

  // Execute weak prompt
  const weakResponse = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    messages: [{ role: 'user', content: weakPrompt }],
  });

  // Execute strong prompt
  const strongResponse = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: 'You are a senior TypeScript developer. Follow all constraints exactly.',
    messages: [{ role: 'user', content: strongPrompt }],
  });

  const weakText = weakResponse.content.find((b: ContentBlock) => b.type === 'text');
  const strongText = strongResponse.content.find((b: ContentBlock) => b.type === 'text');

  return {
    weakResult: {
      text: weakText?.type === 'text' ? weakText.text : '',
      analysis: weakAnalysis,
    },
    strongResult: {
      text: strongText?.type === 'text' ? strongText.text : '',
      analysis: strongAnalysis,
    },
    qualityImprovement: `Quality improved from ${weakAnalysis.estimatedQuality} to ${strongAnalysis.estimatedQuality}`,
  };
}

/**
 * Demo function showing example usage with SDK integration
 * Run with: bun run prompt-patterns.ts
 */
async function demo(): Promise<void> {
  console.log('Prompt Patterns Demo (with SDK Integration)\n');
  console.log('='.repeat(60));

  // Chain-of-thought example
  console.log('\n1. Chain-of-Thought Prompt:\n');
  const cotPrompt = buildChainOfThought({
    feature: 'payment processing',
    questions: [
      'What are all the steps in this process?',
      'What can go wrong at each step?',
      'How should errors be handled?',
      'What state transitions occur?',
      'What needs to be logged?'
    ]
  });
  console.log(cotPrompt);

  // Constraint-based example
  console.log('\n' + '='.repeat(60));
  console.log('\n2. Constraint-Based Prompt:\n');
  const constraintConfig: ConstrainedPromptConfig = {
    task: 'Add validation to the createUser endpoint in src/api/users.ts',
    context: [
      'Validation patterns are in src/utils/validation.ts',
      'Use Zod for schema validation',
      'Return Result<T, ValidationError>, never throw'
    ],
    constraints: [
      { type: 'format', rule: 'Include JSDoc comments' },
      { type: 'behavior', rule: 'Validate email format (RFC 5322)' },
      { type: 'behavior', rule: 'Validate password (min 8 chars, requires number)' },
      { type: 'scope', rule: 'Add tests in tests/api/users.test.ts' }
    ],
    successCriteria: [
      'Invalid requests return 400 with error details',
      'Valid requests proceed to user creation',
      'All tests pass'
    ]
  };
  const constrainedPrompt = buildConstrainedPrompt(constraintConfig);
  console.log(constrainedPrompt);

  // Entropy reduction calculation
  console.log('\n' + '='.repeat(60));
  console.log('\n3. Entropy Reduction Analysis:\n');
  const constraints: Constraint[] = [
    { type: 'format', rule: 'JSDoc comments' },
    { type: 'format', rule: 'Result<T, E> return type' },
    { type: 'behavior', rule: 'Email validation' },
    { type: 'behavior', rule: 'Password validation' },
    { type: 'scope', rule: 'No external file changes' }
  ];
  const reduction = estimateEntropyReduction(constraints);
  console.log(`Constraints applied: ${constraints.length}`);
  console.log(`Estimated entropy reduction: ${reduction}x`);
  console.log(`(Solution space narrowed from ~1,000,000 to ~${Math.round(1000000 / reduction)})`);

  // Prompt analysis
  console.log('\n' + '='.repeat(60));
  console.log('\n4. Prompt Quality Analysis:\n');

  const weakPrompt = 'Add user validation to the API';
  const strongPrompt = constrainedPrompt;

  console.log('Weak prompt: "Add user validation to the API"');
  const weakAnalysis = analyzePrompt(weakPrompt);
  console.log(`  Quality: ${weakAnalysis.estimatedQuality}`);
  console.log(`  Suggestions: ${weakAnalysis.suggestions.join('; ')}`);

  console.log('\nStrong prompt (constraint-based):');
  const strongAnalysis = analyzePrompt(strongPrompt);
  console.log(`  Quality: ${strongAnalysis.estimatedQuality}`);
  console.log(`  Constraint count: ${strongAnalysis.constraintCount}`);
  if (strongAnalysis.suggestions.length > 0) {
    console.log(`  Suggestions: ${strongAnalysis.suggestions.join('; ')}`);
  }

  // Anti-pattern detection
  console.log('\n' + '='.repeat(60));
  console.log('\n5. Anti-Pattern Detection:\n');

  const badPrompt = 'How does authentication work? Also implement a new login endpoint. Make it better.';
  console.log(`Checking: "${badPrompt}"\n`);

  const antiPatterns = detectAntiPatterns(badPrompt);
  for (const check of antiPatterns) {
    const status = check.detected ? '[DETECTED]' : '[OK]';
    console.log(`${status} ${check.pattern}`);
    if (check.detected) {
      console.log(`         Recommendation: ${check.recommendation}`);
    }
  }

  // SDK Integration Demo (requires API key)
  console.log('\n' + '='.repeat(60));
  console.log('\n6. SDK Integration (Live API Call):\n');

  try {
    console.log('Executing chain-of-thought prompt with Claude...');
    const cotResult = await executeChainOfThought('input validation', [
      'What inputs need validation?',
      'What validation rules apply?',
      'How to report validation errors?',
    ]);
    console.log(`\nClaude reasoning (${cotResult.tokenUsage.output} tokens):`);
    console.log(cotResult.reasoning.slice(0, 500) + '...\n');
  } catch (error) {
    console.log('(API call skipped - set ANTHROPIC_API_KEY to enable)');
    console.log('This demonstrates how to use: executeChainOfThought()');
    console.log('Which calls client.messages.create() with the built prompt.');
  }
}

// Run demo when executed directly
if (import.meta.main) {
  demo().catch(console.error);
}
