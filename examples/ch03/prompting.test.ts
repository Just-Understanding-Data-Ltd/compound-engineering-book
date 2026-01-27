/**
 * Prompting Patterns Test Suite
 *
 * Tests for Chapter 3 code examples:
 * - Chain-of-thought prompt building
 * - Constraint-based prompting
 * - Few-shot prompt construction
 * - Prompt quality analysis
 * - Anti-pattern detection
 *
 * Run with: bun test examples/ch03/prompting.test.ts
 *
 * @module ch03/prompting.test
 */

import { describe, test, expect } from 'bun:test';
import {
  buildChainOfThought,
  buildConstrainedPrompt,
  estimateEntropyReduction,
  analyzePrompt,
  detectAntiPatterns,
  type Constraint
} from './prompt-patterns';

import {
  buildFewShotPrompt,
  evaluateExampleQuality,
  selectOptimalExamples,
  estimateTokenUsage,
  validateFewShotConfig,
  type FewShotConfig,
  type ExampleSource
} from './few-shot-builder';

// ============================================================
// Chain-of-Thought Prompting Tests
// ============================================================

describe('Chain-of-Thought Prompting', () => {
  test('builds prompt with feature name', () => {
    const prompt = buildChainOfThought({
      feature: 'payment processing',
      questions: ['What steps are needed?']
    });

    expect(prompt).toContain('payment processing');
    expect(prompt).toContain('Before implementing');
  });

  test('numbers questions correctly', () => {
    const prompt = buildChainOfThought({
      feature: 'user authentication',
      questions: [
        'What are the steps?',
        'What can go wrong?',
        'How to handle errors?'
      ]
    });

    expect(prompt).toContain('1. What are the steps?');
    expect(prompt).toContain('2. What can go wrong?');
    expect(prompt).toContain('3. How to handle errors?');
  });

  test('includes implementation instruction', () => {
    const prompt = buildChainOfThought({
      feature: 'data migration',
      questions: ['What needs to migrate?']
    });

    expect(prompt).toContain('After reasoning through this, implement the solution.');
  });

  test('handles single question', () => {
    const prompt = buildChainOfThought({
      feature: 'API endpoint',
      questions: ['What inputs are required?']
    });

    expect(prompt).toContain('1. What inputs are required?');
    expect(prompt.match(/^\d\./gm)?.length).toBe(1);
  });
});

// ============================================================
// Constraint-Based Prompting Tests
// ============================================================

describe('Constraint-Based Prompting', () => {
  test('includes task description', () => {
    const prompt = buildConstrainedPrompt({
      task: 'Add email validation',
      constraints: []
    });

    expect(prompt).toContain('Add email validation');
  });

  test('includes context when provided', () => {
    const prompt = buildConstrainedPrompt({
      task: 'Add validation',
      context: [
        'Use Zod for schemas',
        'Patterns in src/utils/'
      ],
      constraints: []
    });

    expect(prompt).toContain('Context:');
    expect(prompt).toContain('- Use Zod for schemas');
    expect(prompt).toContain('- Patterns in src/utils/');
  });

  test('formats constraints with type labels', () => {
    const constraints: Constraint[] = [
      { type: 'format', rule: 'Include JSDoc' },
      { type: 'behavior', rule: 'Validate email' },
      { type: 'scope', rule: 'No file changes' }
    ];

    const prompt = buildConstrainedPrompt({
      task: 'Add feature',
      constraints
    });

    expect(prompt).toContain('[FORMAT] Include JSDoc');
    expect(prompt).toContain('[BEHAVIOR] Validate email');
    expect(prompt).toContain('[SCOPE] No file changes');
  });

  test('includes success criteria', () => {
    const prompt = buildConstrainedPrompt({
      task: 'Add validation',
      constraints: [],
      successCriteria: [
        'All tests pass',
        'No TypeScript errors'
      ]
    });

    expect(prompt).toContain('Success criteria:');
    expect(prompt).toContain('- All tests pass');
    expect(prompt).toContain('- No TypeScript errors');
  });

  test('omits empty sections', () => {
    const prompt = buildConstrainedPrompt({
      task: 'Simple task',
      constraints: []
    });

    expect(prompt).not.toContain('Context:');
    expect(prompt).not.toContain('Success criteria:');
  });
});

// ============================================================
// Entropy Reduction Tests
// ============================================================

describe('Entropy Reduction', () => {
  test('calculates reduction for single constraint', () => {
    const constraints: Constraint[] = [
      { type: 'format', rule: 'JSDoc comments' }
    ];

    const reduction = estimateEntropyReduction(constraints);
    expect(reduction).toBe(10);
  });

  test('multiplies reduction across constraints', () => {
    const constraints: Constraint[] = [
      { type: 'format', rule: 'JSDoc' },      // 10x
      { type: 'behavior', rule: 'Validate' }  // 10x
    ];

    const reduction = estimateEntropyReduction(constraints);
    expect(reduction).toBe(100); // 10 * 10
  });

  test('applies different factors by type', () => {
    // format: 10, behavior: 10, scope: 5, performance: 2
    const constraints: Constraint[] = [
      { type: 'format', rule: 'test' },
      { type: 'scope', rule: 'test' },
      { type: 'performance', rule: 'test' }
    ];

    const reduction = estimateEntropyReduction(constraints);
    expect(reduction).toBe(100); // 10 * 5 * 2
  });

  test('returns 1 for no constraints', () => {
    const reduction = estimateEntropyReduction([]);
    expect(reduction).toBe(1);
  });
});

// ============================================================
// Prompt Analysis Tests
// ============================================================

describe('Prompt Analysis', () => {
  test('identifies weak prompt', () => {
    const analysis = analyzePrompt('Add user validation to the API');

    expect(analysis.estimatedQuality).toBe('weak');
    expect(analysis.suggestions.length).toBeGreaterThan(0);
  });

  test('detects context indicators', () => {
    const analysis = analyzePrompt('Based on the existing pattern in src/utils, add validation');

    expect(analysis.hasContext).toBe(true);
  });

  test('detects instruction verbs', () => {
    const analysis = analyzePrompt('Create a new user service');

    expect(analysis.hasInstruction).toBe(true);
  });

  test('detects constraints', () => {
    const analysis = analyzePrompt('The function MUST return Result<T, E>');

    expect(analysis.hasConstraints).toBe(true);
  });

  test('rates strong prompt correctly', () => {
    const strongPrompt = `
      Add validation to src/api/users.ts
      Follow existing patterns in src/utils/
      The function MUST return Result<T, E>
      - [FORMAT] Include JSDoc
      - [BEHAVIOR] Validate email format
      - [SCOPE] Do NOT modify interfaces
    `;

    const analysis = analyzePrompt(strongPrompt);
    expect(analysis.hasContext).toBe(true);
    expect(analysis.hasInstruction).toBe(true);
    expect(analysis.hasConstraints).toBe(true);
  });

  test('provides relevant suggestions', () => {
    const analysis = analyzePrompt('Fix the bug');

    expect(analysis.suggestions).toContain('Add context: relevant files, existing patterns, domain knowledge');
    expect(analysis.suggestions).toContain('Add constraints: format, behavior, scope boundaries');
  });
});

// ============================================================
// Anti-Pattern Detection Tests
// ============================================================

describe('Anti-Pattern Detection', () => {
  test('detects vague prompts', () => {
    const checks = detectAntiPatterns('Make it better');

    const vagueCheck = checks.find(c => c.pattern === 'Vague prompt');
    expect(vagueCheck?.detected).toBe(true);
  });

  test('detects over-constrained prompts', () => {
    const checks = detectAntiPatterns(`
      First, read the file.
      Then, find the function.
      After that, modify it.
      Step 1: update the type.
    `);

    const overCheck = checks.find(c => c.pattern === 'Over-constrained (imperative)');
    expect(overCheck?.detected).toBe(true);
  });

  test('detects missing context', () => {
    const checks = detectAntiPatterns('Add comprehensive user validation with email and password checks to the authentication system');

    const contextCheck = checks.find(c => c.pattern === 'Missing context');
    expect(contextCheck?.detected).toBe(true);
  });

  test('detects mixed exploration and implementation', () => {
    const checks = detectAntiPatterns('How does authentication work? Also implement a new login endpoint.');

    const mixedCheck = checks.find(c => c.pattern === 'Mixed exploration and implementation');
    expect(mixedCheck?.detected).toBe(true);
  });

  test('passes clean prompt', () => {
    const checks = detectAntiPatterns(`
      Add validation to src/api/users.ts
      Use the existing pattern in src/utils/validation.ts
    `);

    const detectedCount = checks.filter(c => c.detected).length;
    expect(detectedCount).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// Few-Shot Builder Tests
// ============================================================

describe('Few-Shot Prompt Builder', () => {
  const testExamples: ExampleSource[] = [
    {
      name: 'User Service',
      file: 'src/users/service.ts',
      code: 'export function createUserService() { return {}; }'
    },
    {
      name: 'Order Service',
      file: 'src/orders/service.ts',
      code: 'export function createOrderService() { return {}; }'
    }
  ];

  test('includes pattern name', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Service Layer',
      examples: testExamples,
      task: { description: 'Create a new service' }
    });

    expect(prompt).toContain('# Pattern: Service Layer');
  });

  test('includes all examples with numbering', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Test',
      examples: testExamples,
      task: { description: 'Task' }
    });

    expect(prompt).toContain('## Example 1: User Service');
    expect(prompt).toContain('## Example 2: Order Service');
  });

  test('includes file paths', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Test',
      examples: testExamples,
      task: { description: 'Task' }
    });

    expect(prompt).toContain('**File**: src/users/service.ts');
    expect(prompt).toContain('**File**: src/orders/service.ts');
  });

  test('includes code blocks', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Test',
      examples: testExamples,
      task: { description: 'Task' }
    });

    expect(prompt).toContain('```typescript');
    expect(prompt).toContain('createUserService');
    expect(prompt).toContain('createOrderService');
  });

  test('includes task requirements', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Test',
      examples: testExamples,
      task: {
        description: 'Create a Post Service',
        requirements: ['createPost method', 'deletePost method']
      }
    });

    expect(prompt).toContain('- createPost method');
    expect(prompt).toContain('- deletePost method');
  });

  test('includes optional description', () => {
    const prompt = buildFewShotPrompt({
      patternName: 'Test',
      description: 'Factory pattern with DI',
      examples: testExamples,
      task: { description: 'Task' }
    });

    expect(prompt).toContain('Factory pattern with DI');
  });
});

// ============================================================
// Example Quality Evaluation Tests
// ============================================================

describe('Example Quality Evaluation', () => {
  test('detects pattern presence', () => {
    const quality = evaluateExampleQuality(
      'export function createUserService() { return {}; }',
      ['createUserService']
    );

    expect(quality.demonstratesPattern).toBe(true);
  });

  test('detects typical case by line count', () => {
    const shortCode = 'const x = 1;';
    const typicalCode = Array(20).fill('const x = 1;').join('\n');
    const longCode = Array(150).fill('const x = 1;').join('\n');

    expect(evaluateExampleQuality(shortCode, []).isTypicalCase).toBe(false);
    expect(evaluateExampleQuality(typicalCode, []).isTypicalCase).toBe(true);
    expect(evaluateExampleQuality(longCode, []).isTypicalCase).toBe(false);
  });

  test('detects business logic', () => {
    const withLogic = `
      if (user.active) {
        return { success: true, data: user };
      }
    `;
    const withoutLogic = 'const x = 1;\nconst y = 2;';

    expect(evaluateExampleQuality(withLogic, []).hasBusinessLogic).toBe(true);
    expect(evaluateExampleQuality(withoutLogic, []).hasBusinessLogic).toBe(false);
  });

  test('detects modern syntax', () => {
    const modern = 'const fn = async () => { await fetch(); };';
    const legacy = 'var fn = function() { return xhr; };';

    expect(evaluateExampleQuality(modern, []).isRecent).toBe(true);
    expect(evaluateExampleQuality(legacy, []).isRecent).toBe(false);
  });

  test('calculates overall score correctly', () => {
    const perfectCode = `
      export function createTestService() {
        const logger = getLogger();
        if (condition) {
          return { success: true, data: result };
        }
      }
    `.repeat(3); // Make it >10 lines

    const quality = evaluateExampleQuality(perfectCode, ['createTestService']);

    expect(quality.overallScore).toBeGreaterThanOrEqual(80);
  });
});

// ============================================================
// Optimal Example Selection Tests
// ============================================================

describe('Optimal Example Selection', () => {
  const candidates: ExampleSource[] = [
    { name: 'Good', file: 'a.ts', code: 'export function createGood() {\nif (x) {\nreturn { success: true };\n}\n}'.repeat(5) },
    { name: 'Bad', file: 'b.ts', code: 'var x = 1;' },
    { name: 'Average', file: 'c.ts', code: 'const fn = () => {\nreturn 1;\n}'.repeat(5) }
  ];

  test('selects highest quality examples', () => {
    const selected = selectOptimalExamples(candidates, ['createGood'], 2);

    expect(selected.length).toBe(2);
    expect(selected[0]?.example.name).toBe('Good');
  });

  test('respects max examples limit', () => {
    const selected = selectOptimalExamples(candidates, [], 1);

    expect(selected.length).toBe(1);
  });

  test('returns all if fewer than max', () => {
    const selected = selectOptimalExamples(candidates.slice(0, 2), [], 5);

    expect(selected.length).toBe(2);
  });
});

// ============================================================
// Configuration Validation Tests
// ============================================================

describe('Few-Shot Configuration Validation', () => {
  const validConfig: FewShotConfig = {
    patternName: 'Test',
    examples: [
      { name: 'A', file: 'a.ts', code: 'code A' },
      { name: 'B', file: 'b.ts', code: 'code B' }
    ],
    task: { description: 'Create something new' }
  };

  test('accepts valid configuration', () => {
    const result = validateFewShotConfig(validConfig);

    expect(result.success).toBe(true);
  });

  test('warns on too few examples', () => {
    const result = validateFewShotConfig({
      ...validConfig,
      examples: [{ name: 'A', file: 'a.ts', code: 'code' }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('At least 2 examples recommended for pattern recognition');
    }
  });

  test('warns on too many examples', () => {
    const result = validateFewShotConfig({
      ...validConfig,
      examples: Array(5).fill({ name: 'X', file: 'x.ts', code: 'code' })
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('More than 4 examples has diminishing returns');
    }
  });

  test('warns on brief task description', () => {
    const result = validateFewShotConfig({
      ...validConfig,
      task: { description: 'Do it' }
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Task description is too brief');
    }
  });

  test('warns on empty example code', () => {
    const result = validateFewShotConfig({
      ...validConfig,
      examples: [
        { name: 'A', file: 'a.ts', code: 'valid' },
        { name: 'B', file: 'b.ts', code: '' }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.some(e => e.includes('empty code'))).toBe(true);
    }
  });
});

// ============================================================
// Token Estimation Tests
// ============================================================

describe('Token Estimation', () => {
  test('estimates tokens based on content length', () => {
    const config: FewShotConfig = {
      patternName: 'Test',
      examples: [
        { name: 'A', file: 'a.ts', code: 'x'.repeat(100) }
      ],
      task: { description: 'Task description here' }
    };

    const tokens = estimateTokenUsage(config);

    // Should be roughly content length / 4
    expect(tokens).toBeGreaterThan(25);
    expect(tokens).toBeLessThan(200);
  });

  test('more examples means more tokens', () => {
    const baseConfig: FewShotConfig = {
      patternName: 'Test',
      examples: [{ name: 'A', file: 'a.ts', code: 'x'.repeat(100) }],
      task: { description: 'Task' }
    };

    const moreConfig: FewShotConfig = {
      ...baseConfig,
      examples: [
        { name: 'A', file: 'a.ts', code: 'x'.repeat(100) },
        { name: 'B', file: 'b.ts', code: 'x'.repeat(100) },
        { name: 'C', file: 'c.ts', code: 'x'.repeat(100) }
      ]
    };

    const baseTokens = estimateTokenUsage(baseConfig);
    const moreTokens = estimateTokenUsage(moreConfig);

    expect(moreTokens).toBeGreaterThan(baseTokens);
  });
});
