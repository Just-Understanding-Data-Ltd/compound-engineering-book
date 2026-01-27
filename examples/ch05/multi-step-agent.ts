/**
 * Multi-Step Agent
 *
 * Demonstrates Factor 10 (Small, Focused Agents) and the reliability
 * compounding problem.
 *
 * Key concepts:
 * - Breaking large workflows into smaller, focused agents
 * - Calculating reliability across step chains
 * - Deterministic orchestration between agents
 *
 * Related to Chapter 5 sections:
 * - "The Reliability Chasm"
 * - "Factor 10: Small, Focused Agents"
 * - "The Reliability Stack in Practice"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ============================================================================
// Reliability Calculator
// ============================================================================

/**
 * Calculate overall reliability for a workflow with N steps
 * Formula: (per_step_reliability)^N
 */
export function calculateReliability(
  stepCount: number,
  perStepReliability: number = 0.95
): number {
  return Math.pow(perStepReliability, stepCount);
}

/**
 * Show reliability degradation table
 */
export function reliabilityTable(): Array<{
  steps: number;
  reliability95: number;
  reliability99: number;
}> {
  const stepCounts = [1, 5, 10, 15, 20, 25, 30];
  return stepCounts.map(steps => ({
    steps,
    reliability95: Math.round(calculateReliability(steps, 0.95) * 100) / 100,
    reliability99: Math.round(calculateReliability(steps, 0.99) * 100) / 100,
  }));
}

// ============================================================================
// Focused Agent Types
// ============================================================================

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  stepsTaken: number;
}

export interface FocusedAgent<TInput, TOutput> {
  name: string;
  maxSteps: number;
  execute(input: TInput): Promise<AgentResult<TOutput>>;
}

// ============================================================================
// Email Campaign Workflow - Decomposed into Focused Agents
// ============================================================================

// Input/Output types for each agent
interface SubscriberListInput {
  segment: string;
  limit?: number;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  segment: string;
}

interface TemplateInput {
  templateId: string;
  campaign: string;
}

interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
}

interface PersonalizedEmail {
  subscriberId: string;
  email: string;
  subject: string;
  body: string;
}

interface DeliveryResult {
  sent: number;
  failed: number;
  queued: number;
}

// ============================================================================
// Focused Agent Implementations
// ============================================================================

type ContentBlock = Anthropic.Messages.ContentBlock;

/**
 * Agent 1: Subscriber List Agent (5 steps max)
 * Responsibilities: Fetch, filter, validate subscribers
 */
export const subscriberAgent: FocusedAgent<SubscriberListInput, Subscriber[]> = {
  name: 'SubscriberAgent',
  maxSteps: 5,

  async execute(input: SubscriberListInput): Promise<AgentResult<Subscriber[]>> {
    console.log(`[${this.name}] Fetching subscribers for segment: ${input.segment}`);

    try {
      // Use Claude to help filter/process subscribers
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        system: 'You help filter and validate email subscriber lists. Be concise.',
        messages: [
          {
            role: 'user',
            content: `Given segment "${input.segment}", generate 3 sample valid subscriber records as JSON array. Include id, email, name, segment fields.`,
          },
        ],
      });

      const textContent = response.content.find((block: ContentBlock) => block.type === 'text');
      const responseText = textContent?.type === 'text' ? textContent.text : '[]';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      const subscribers: Subscriber[] = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : [
            { id: '1', email: 'user1@example.com', name: 'User 1', segment: input.segment },
            { id: '2', email: 'user2@example.com', name: 'User 2', segment: input.segment },
            { id: '3', email: 'user3@example.com', name: 'User 3', segment: input.segment },
          ];

      return {
        success: true,
        data: subscribers.slice(0, input.limit || 100),
        stepsTaken: 3, // Fetch, filter, validate
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stepsTaken: 1,
      };
    }
  },
};

/**
 * Agent 2: Template Agent (4 steps max)
 * Responsibilities: Load template, validate, prepare for personalization
 */
export const templateAgent: FocusedAgent<TemplateInput, EmailTemplate> = {
  name: 'TemplateAgent',
  maxSteps: 4,

  async execute(input: TemplateInput): Promise<AgentResult<EmailTemplate>> {
    console.log(`[${this.name}] Loading template: ${input.templateId}`);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        system: 'You help create email templates. Be professional and concise.',
        messages: [
          {
            role: 'user',
            content: `Create an email template for campaign "${input.campaign}". Return JSON with: id, subject, body (using {{name}} and {{product}} variables), and variables array.`,
          },
        ],
      });

      const textContent = response.content.find((block: ContentBlock) => block.type === 'text');
      const responseText = textContent?.type === 'text' ? textContent.text : '{}';

      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      const template: EmailTemplate = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            id: input.templateId,
            subject: `Important update about ${input.campaign}`,
            body: 'Hello {{name}}, check out our {{product}}!',
            variables: ['name', 'product'],
          };

      return {
        success: true,
        data: template,
        stepsTaken: 2, // Load, validate
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stepsTaken: 1,
      };
    }
  },
};

/**
 * Agent 3: Personalization Agent (6 steps max)
 * Responsibilities: Apply template to each subscriber, validate output
 */
export const personalizationAgent: FocusedAgent<
  { subscribers: Subscriber[]; template: EmailTemplate },
  PersonalizedEmail[]
> = {
  name: 'PersonalizationAgent',
  maxSteps: 6,

  async execute(input): Promise<AgentResult<PersonalizedEmail[]>> {
    console.log(`[${this.name}] Personalizing ${input.subscribers.length} emails`);

    const personalized: PersonalizedEmail[] = input.subscribers.map(sub => ({
      subscriberId: sub.id,
      email: sub.email,
      subject: input.template.subject,
      body: input.template.body
        .replace('{{name}}', sub.name)
        .replace('{{product}}', 'our latest features'),
    }));

    return {
      success: true,
      data: personalized,
      stepsTaken: input.subscribers.length + 1, // One per subscriber + validation
    };
  },
};

/**
 * Agent 4: Delivery Agent (5 steps max)
 * Responsibilities: Queue, send, track delivery
 */
export const deliveryAgent: FocusedAgent<PersonalizedEmail[], DeliveryResult> = {
  name: 'DeliveryAgent',
  maxSteps: 5,

  async execute(emails): Promise<AgentResult<DeliveryResult>> {
    console.log(`[${this.name}] Sending ${emails.length} emails`);

    // Simulate delivery with 99% success rate
    const results = emails.map(() => Math.random() < 0.99);
    const sent = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    return {
      success: failed === 0,
      data: { sent, failed, queued: 0 },
      stepsTaken: 3, // Queue, send, track
    };
  },
};

// ============================================================================
// Orchestrator - Deterministic Workflow Coordinator
// ============================================================================

interface OrchestrationResult {
  success: boolean;
  totalSteps: number;
  agentResults: Array<{
    agent: string;
    success: boolean;
    steps: number;
  }>;
  finalResult?: DeliveryResult;
  error?: string;
}

/**
 * Orchestrate the email campaign workflow using focused agents
 * This is deterministic code, not another LLM
 */
export async function orchestrateEmailCampaign(
  segment: string,
  campaign: string
): Promise<OrchestrationResult> {
  const results: OrchestrationResult = {
    success: false,
    totalSteps: 0,
    agentResults: [],
  };

  console.log('\n📧 Email Campaign Orchestration');
  console.log('================================\n');

  // Step 1: Get subscribers
  console.log('Phase 1: Fetching subscribers...');
  const subscriberResult = await subscriberAgent.execute({ segment, limit: 10 });
  results.agentResults.push({
    agent: subscriberAgent.name,
    success: subscriberResult.success,
    steps: subscriberResult.stepsTaken,
  });
  results.totalSteps += subscriberResult.stepsTaken;

  if (!subscriberResult.success || !subscriberResult.data) {
    results.error = `Subscriber fetch failed: ${subscriberResult.error}`;
    return results;
  }
  console.log(`   Found ${subscriberResult.data.length} subscribers\n`);

  // Step 2: Load template
  console.log('Phase 2: Loading template...');
  const templateResult = await templateAgent.execute({
    templateId: 'welcome-v1',
    campaign,
  });
  results.agentResults.push({
    agent: templateAgent.name,
    success: templateResult.success,
    steps: templateResult.stepsTaken,
  });
  results.totalSteps += templateResult.stepsTaken;

  if (!templateResult.success || !templateResult.data) {
    results.error = `Template load failed: ${templateResult.error}`;
    return results;
  }
  console.log(`   Template loaded: ${templateResult.data.subject}\n`);

  // Step 3: Personalize
  console.log('Phase 3: Personalizing emails...');
  const personalizationResult = await personalizationAgent.execute({
    subscribers: subscriberResult.data,
    template: templateResult.data,
  });
  results.agentResults.push({
    agent: personalizationAgent.name,
    success: personalizationResult.success,
    steps: personalizationResult.stepsTaken,
  });
  results.totalSteps += personalizationResult.stepsTaken;

  if (!personalizationResult.success || !personalizationResult.data) {
    results.error = `Personalization failed: ${personalizationResult.error}`;
    return results;
  }
  console.log(`   Personalized ${personalizationResult.data.length} emails\n`);

  // Step 4: Deliver
  console.log('Phase 4: Sending emails...');
  const deliveryResult = await deliveryAgent.execute(personalizationResult.data);
  results.agentResults.push({
    agent: deliveryAgent.name,
    success: deliveryResult.success,
    steps: deliveryResult.stepsTaken,
  });
  results.totalSteps += deliveryResult.stepsTaken;

  if (!deliveryResult.success) {
    results.error = `Delivery had failures: ${deliveryResult.data?.failed} failed`;
    results.finalResult = deliveryResult.data;
    return results;
  }

  console.log(`   Sent: ${deliveryResult.data?.sent}, Failed: ${deliveryResult.data?.failed}\n`);

  // Success!
  results.success = true;
  results.finalResult = deliveryResult.data;
  return results;
}

// ============================================================================
// Reliability Comparison Demo
// ============================================================================

export async function runMultiStepDemo(): Promise<{
  orchestrationResult: OrchestrationResult;
  reliabilityComparison: {
    monolithic: { steps: number; reliability: number };
    decomposed: { agents: number; maxStepsPerAgent: number; reliability: number };
  };
}> {
  console.log('Multi-Step Agent Demo');
  console.log('=====================\n');

  // Show reliability table
  console.log('📊 Reliability Degradation Table');
  console.log('================================');
  console.log('Steps | 95%/step | 99%/step');
  console.log('------|----------|----------');
  for (const row of reliabilityTable()) {
    console.log(
      `  ${row.steps.toString().padStart(2)} |   ${(row.reliability95 * 100).toFixed(0)}%   |   ${(row.reliability99 * 100).toFixed(0)}%`
    );
  }
  console.log();

  // Run orchestrated workflow
  const result = await orchestrateEmailCampaign('new_users', 'welcome_campaign');

  // Calculate reliability comparison
  const monolithicSteps = 25; // If all in one agent
  const monolithicReliability = calculateReliability(monolithicSteps, 0.95);

  // With decomposition, each agent has ~5 steps
  const maxAgentSteps = Math.max(
    subscriberAgent.maxSteps,
    templateAgent.maxSteps,
    personalizationAgent.maxSteps,
    deliveryAgent.maxSteps
  );
  const decomposedReliability = calculateReliability(maxAgentSteps, 0.95);

  console.log('\n📈 Reliability Comparison');
  console.log('=========================');
  console.log(`Monolithic (${monolithicSteps} steps): ${(monolithicReliability * 100).toFixed(1)}%`);
  console.log(`Decomposed (${maxAgentSteps} steps/agent): ${(decomposedReliability * 100).toFixed(1)}%`);
  console.log(`Improvement: ${((decomposedReliability - monolithicReliability) * 100).toFixed(1)} percentage points`);

  console.log('\n📋 Orchestration Summary');
  console.log('========================');
  console.log(`Total steps executed: ${result.totalSteps}`);
  console.log(`Success: ${result.success}`);
  for (const agentResult of result.agentResults) {
    console.log(`  - ${agentResult.agent}: ${agentResult.success ? '✓' : '✗'} (${agentResult.steps} steps)`);
  }

  return {
    orchestrationResult: result,
    reliabilityComparison: {
      monolithic: { steps: monolithicSteps, reliability: monolithicReliability },
      decomposed: { agents: 4, maxStepsPerAgent: maxAgentSteps, reliability: decomposedReliability },
    },
  };
}

// Run if executed directly
if (import.meta.main) {
  runMultiStepDemo().catch(console.error);
}
