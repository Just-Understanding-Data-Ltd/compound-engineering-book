/**
 * Few-Shot Prompt Builder
 *
 * This example demonstrates concepts from Chapter 3:
 * - Section 3.4: Few-shot prompting with project examples
 * - Why 2-3 examples is optimal
 * - How to select effective examples
 *
 * Few-shot prompting uses concrete examples to teach patterns.
 * Abstract descriptions are ambiguous. Examples are not.
 *
 * @module ch03/few-shot-builder
 */

// Result type for consistent error handling
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Type guard for error results
 * Enables TypeScript to narrow Result<T, E> to the error case
 */
export function isResultError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Example accuracy by shot count (from section 3.4)
 *
 * 0 examples (zero-shot): 40-60% accuracy
 * 1 example (one-shot): 60-75% accuracy
 * 2-3 examples (few-shot): 85-95% accuracy
 * 4+ examples: Diminishing returns
 */
export const ACCURACY_BY_SHOT_COUNT = {
  zeroShot: { min: 0.40, max: 0.60, description: 'LLM guesses based on general knowledge' },
  oneShot: { min: 0.60, max: 0.75, description: 'May treat as special case, not pattern' },
  fewShot: { min: 0.85, max: 0.95, description: 'Identifies consistent patterns' },
  manyShot: { min: 0.86, max: 0.96, description: 'Diminishing returns, more tokens' }
} as const;

/**
 * Example source configuration
 */
export interface ExampleSource {
  name: string;
  file: string;
  code: string;
}

/**
 * Few-shot prompt configuration
 */
export interface FewShotConfig {
  patternName: string;
  description?: string;
  examples: ExampleSource[];
  task: {
    description: string;
    requirements?: string[];
  };
}

/**
 * Build a few-shot prompt from examples
 *
 * Two to three examples produce 85-95% pattern accuracy.
 * The LLM identifies what varies versus what stays consistent.
 *
 * @example
 * const prompt = buildFewShotPrompt({
 *   patternName: 'Service Layer',
 *   examples: [
 *     { name: 'User Service', file: 'src/users/service.ts', code: '...' },
 *     { name: 'Campaign Service', file: 'src/campaigns/service.ts', code: '...' }
 *   ],
 *   task: {
 *     description: 'Create a Post Service',
 *     requirements: ['createPost', 'publishPost', 'deletePost methods']
 *   }
 * });
 *
 * @param config - Few-shot configuration
 * @returns Formatted few-shot prompt
 */
export function buildFewShotPrompt(config: FewShotConfig): string {
  const { patternName, description, examples, task } = config;

  let prompt = `# Pattern: ${patternName}\n`;

  if (description) {
    prompt += `\n${description}\n`;
  }

  prompt += '\nHere are examples of how we implement this pattern in this codebase:\n';

  examples.forEach((example, i) => {
    prompt += `\n## Example ${i + 1}: ${example.name}\n`;
    prompt += `\n**File**: ${example.file}\n`;
    prompt += '\n```typescript\n';
    prompt += example.code;
    prompt += '\n```\n';
  });

  prompt += '\n---\n';
  prompt += '\n# Your Task\n';
  prompt += `\n${task.description}\n`;

  if (task.requirements && task.requirements.length > 0) {
    prompt += '\nFollow the same pattern with:\n';
    for (const req of task.requirements) {
      prompt += `- ${req}\n`;
    }
  }

  return prompt;
}

/**
 * Example selection criteria
 *
 * Good examples should:
 * 1. Demonstrate the pattern clearly (typical, not edge cases)
 * 2. Show consistency (all follow same structure)
 * 3. Cover typical complexity (include real business logic)
 * 4. Be current (latest conventions, not legacy)
 */
export interface ExampleQuality {
  demonstratesPattern: boolean;
  isTypicalCase: boolean;
  hasBusinessLogic: boolean;
  isRecent: boolean;
  overallScore: number;
}

/**
 * Evaluate example quality for few-shot prompting
 *
 * @param code - The example code
 * @param patternIndicators - Strings that indicate the pattern is present
 * @returns Quality assessment
 */
export function evaluateExampleQuality(
  code: string,
  patternIndicators: string[]
): ExampleQuality {
  // Check pattern presence
  const demonstratesPattern = patternIndicators.some(indicator =>
    code.includes(indicator)
  );

  // Typical case: not too simple, not edge case handling
  const lineCount = code.split('\n').length;
  const isTypicalCase = lineCount >= 10 && lineCount <= 100;

  // Has business logic: conditionals, error handling, transformations
  const hasBusinessLogic = (
    (code.includes('if (') || code.includes('if(')) &&
    (code.includes('return {') || code.includes('return new'))
  );

  // Recent: uses modern syntax (const/let, arrow functions, async/await)
  const isRecent = (
    code.includes('const ') &&
    (code.includes('=>') || code.includes('async '))
  );

  // Calculate score (0-100)
  let score = 0;
  if (demonstratesPattern) score += 40;
  if (isTypicalCase) score += 20;
  if (hasBusinessLogic) score += 25;
  if (isRecent) score += 15;

  return {
    demonstratesPattern,
    isTypicalCase,
    hasBusinessLogic,
    isRecent,
    overallScore: score
  };
}

/**
 * Select optimal examples from candidates
 *
 * Selects 2-3 examples that best demonstrate the pattern.
 * More examples have diminishing returns and consume more tokens.
 *
 * @param candidates - All potential examples
 * @param patternIndicators - Strings that indicate the pattern
 * @param maxExamples - Maximum examples to return (default: 3)
 * @returns Sorted array of best examples
 */
export function selectOptimalExamples(
  candidates: ExampleSource[],
  patternIndicators: string[],
  maxExamples: number = 3
): { example: ExampleSource; quality: ExampleQuality }[] {
  const evaluated = candidates.map(example => ({
    example,
    quality: evaluateExampleQuality(example.code, patternIndicators)
  }));

  // Sort by quality score descending
  evaluated.sort((a, b) => b.quality.overallScore - a.quality.overallScore);

  // Return top N
  return evaluated.slice(0, maxExamples);
}

/**
 * Estimate prompt token usage
 *
 * Rough estimation: ~4 characters per token for code
 *
 * @param config - Few-shot configuration
 * @returns Estimated token count
 */
export function estimateTokenUsage(config: FewShotConfig): number {
  const prompt = buildFewShotPrompt(config);
  // Rough estimation: ~4 characters per token for code
  return Math.ceil(prompt.length / 4);
}

/**
 * Validate few-shot configuration
 *
 * Checks for common issues:
 * - Too few examples (less than 2)
 * - Too many examples (more than 4)
 * - Missing task requirements
 *
 * @param config - Configuration to validate
 * @returns Validation result with any issues
 */
export function validateFewShotConfig(config: FewShotConfig): Result<true, string[]> {
  const errors: string[] = [];

  if (config.examples.length < 2) {
    errors.push('At least 2 examples recommended for pattern recognition');
  }

  if (config.examples.length > 4) {
    errors.push('More than 4 examples has diminishing returns');
  }

  if (!config.task.description || config.task.description.length < 10) {
    errors.push('Task description is too brief');
  }

  // Check for empty example code
  const emptyExamples = config.examples.filter(e => !e.code || e.code.trim().length === 0);
  if (emptyExamples.length > 0) {
    errors.push(`${emptyExamples.length} example(s) have empty code`);
  }

  if (errors.length > 0) {
    return { success: false, error: errors };
  }

  return { success: true, data: true };
}

/**
 * Demo service examples (simulated codebase patterns)
 */
const DEMO_EXAMPLES: ExampleSource[] = [
  {
    name: 'User Service',
    file: 'packages/domain/src/users/user-service.ts',
    code: `interface UserServiceDeps {
  db: Database;
  logger: Logger;
}

interface UserService {
  getUser(id: string): Promise<Result<User, NotFoundError>>;
  createUser(data: CreateUserInput): Promise<Result<User, ValidationError>>;
}

export function createUserService(deps: UserServiceDeps): UserService {
  const { db, logger } = deps;

  return {
    async getUser(id) {
      logger.info('Fetching user', { id });
      const user = await db.users.findById(id);
      if (!user) {
        return { success: false, error: { code: 'NOT_FOUND', id } };
      }
      return { success: true, data: user };
    },

    async createUser(data) {
      const validation = validateUserInput(data);
      if (!validation.success) {
        return validation;
      }
      const user = await db.users.create(data);
      logger.info('User created', { userId: user.id });
      return { success: true, data: user };
    }
  };
}`
  },
  {
    name: 'Campaign Service',
    file: 'packages/domain/src/campaigns/campaign-service.ts',
    code: `interface CampaignServiceDeps {
  db: Database;
  logger: Logger;
  emailClient: EmailClient;
}

interface CampaignService {
  getCampaign(id: string): Promise<Result<Campaign, NotFoundError>>;
  createCampaign(data: CreateCampaignInput): Promise<Result<Campaign, ValidationError>>;
  sendCampaign(id: string): Promise<Result<SendResult, CampaignError>>;
}

export function createCampaignService(deps: CampaignServiceDeps): CampaignService {
  const { db, logger, emailClient } = deps;

  return {
    async getCampaign(id) {
      logger.info('Fetching campaign', { id });
      const campaign = await db.campaigns.findById(id);
      if (!campaign) {
        return { success: false, error: { code: 'NOT_FOUND', id } };
      }
      return { success: true, data: campaign };
    },

    async createCampaign(data) {
      const validation = validateCampaignInput(data);
      if (!validation.success) {
        return validation;
      }
      const campaign = await db.campaigns.create(data);
      logger.info('Campaign created', { campaignId: campaign.id });
      return { success: true, data: campaign };
    },

    async sendCampaign(id) {
      const campaign = await db.campaigns.findById(id);
      if (!campaign) {
        return { success: false, error: { code: 'NOT_FOUND', id } };
      }
      const result = await emailClient.send(campaign);
      logger.info('Campaign sent', { campaignId: id, sent: result.sentCount });
      return { success: true, data: result };
    }
  };
}`
  },
  {
    name: 'Order Service',
    file: 'packages/domain/src/orders/order-service.ts',
    code: `interface OrderServiceDeps {
  db: Database;
  logger: Logger;
  paymentClient: PaymentClient;
}

interface OrderService {
  getOrder(id: string): Promise<Result<Order, NotFoundError>>;
  createOrder(data: CreateOrderInput): Promise<Result<Order, ValidationError>>;
  processPayment(id: string): Promise<Result<PaymentResult, PaymentError>>;
}

export function createOrderService(deps: OrderServiceDeps): OrderService {
  const { db, logger, paymentClient } = deps;

  return {
    async getOrder(id) {
      logger.info('Fetching order', { id });
      const order = await db.orders.findById(id);
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', id } };
      }
      return { success: true, data: order };
    },

    async createOrder(data) {
      const validation = validateOrderInput(data);
      if (!validation.success) {
        return validation;
      }
      const order = await db.orders.create(data);
      logger.info('Order created', { orderId: order.id });
      return { success: true, data: order };
    },

    async processPayment(id) {
      const order = await db.orders.findById(id);
      if (!order) {
        return { success: false, error: { code: 'NOT_FOUND', id } };
      }
      const result = await paymentClient.charge(order.total);
      logger.info('Payment processed', { orderId: id, status: result.status });
      return { success: true, data: result };
    }
  };
}`
  }
];

/**
 * Demo function showing example usage
 * Run with: bun run few-shot-builder.ts
 */
function demo(): void {
  console.log('Few-Shot Prompt Builder Demo\n');
  console.log('='.repeat(60));

  // Show accuracy by shot count
  console.log('\n1. Accuracy by Example Count:\n');
  for (const [key, value] of Object.entries(ACCURACY_BY_SHOT_COUNT)) {
    const range = `${(value.min * 100).toFixed(0)}-${(value.max * 100).toFixed(0)}%`;
    console.log(`  ${key.padEnd(10)} ${range.padEnd(10)} ${value.description}`);
  }

  // Evaluate example quality
  console.log('\n' + '='.repeat(60));
  console.log('\n2. Example Quality Evaluation:\n');

  const patternIndicators = ['createUserService', 'createCampaignService', 'createOrderService', 'export function create'];

  for (const example of DEMO_EXAMPLES) {
    const quality = evaluateExampleQuality(example.code, patternIndicators);
    console.log(`${example.name}:`);
    console.log(`  Pattern: ${quality.demonstratesPattern ? 'Yes' : 'No'}`);
    console.log(`  Typical: ${quality.isTypicalCase ? 'Yes' : 'No'}`);
    console.log(`  Logic:   ${quality.hasBusinessLogic ? 'Yes' : 'No'}`);
    console.log(`  Recent:  ${quality.isRecent ? 'Yes' : 'No'}`);
    console.log(`  Score:   ${quality.overallScore}/100\n`);
  }

  // Select optimal examples
  console.log('='.repeat(60));
  console.log('\n3. Optimal Example Selection (top 2):\n');

  const selected = selectOptimalExamples(DEMO_EXAMPLES, patternIndicators, 2);
  for (const { example, quality } of selected) {
    console.log(`  Selected: ${example.name} (score: ${quality.overallScore})`);
  }

  // Build few-shot prompt
  console.log('\n' + '='.repeat(60));
  console.log('\n4. Generated Few-Shot Prompt:\n');

  const config: FewShotConfig = {
    patternName: 'Service Layer',
    description: 'Factory function pattern with dependency injection and Result<T,E> returns.',
    examples: selected.map(s => s.example),
    task: {
      description: 'Now create a Post Service following the same pattern:',
      requirements: [
        'Factory function: createPostService(deps: PostServiceDeps): PostService',
        'Methods: createPost, publishPost, deletePost',
        'Return Result<T, E> type (never throw)',
        'Include JSDoc comments'
      ]
    }
  };

  // Validate configuration
  const validation = validateFewShotConfig(config);
  if (validation.success === false) {
    console.log('Configuration warnings:');
    for (const err of validation.error) {
      console.log(`  - ${err}`);
    }
  }

  const fewShotPrompt = buildFewShotPrompt(config);
  const tokenEstimate = estimateTokenUsage(config);

  // Show truncated prompt (first 50 lines)
  const lines = fewShotPrompt.split('\n');
  const truncated = lines.slice(0, 50).join('\n');
  console.log(truncated);
  if (lines.length > 50) {
    console.log(`\n... (${lines.length - 50} more lines)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nEstimated token usage: ~${tokenEstimate} tokens`);
  console.log(`Example count: ${config.examples.length} (optimal: 2-3)`);
}

// Run demo when executed directly
demo();
