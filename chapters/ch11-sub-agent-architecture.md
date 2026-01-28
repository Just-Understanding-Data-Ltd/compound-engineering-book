# Chapter 11: Sub-Agent Architecture

When you ask a single AI agent to "add user authentication to the application," something predictable happens. The agent generates backend code with hardcoded tokens, frontend components missing validation, superficial tests covering only the happy path, and a review that misses obvious security flaws. This is the generalist trap. A single agent handling backend, frontend, testing, and code review produces mediocre results across all domains because context switching destroys focus.

The solution mirrors how real development teams work. Instead of one generalist, you deploy specialized sub-agents: a backend engineer for API endpoints, a frontend engineer for UI components, a Quality Assurance (QA) engineer for comprehensive tests, and a code reviewer that catches issues before human review. This chapter shows you how to build and orchestrate these specialized teams.

## The Generalist Trap

Picture this scenario: you ask an AI agent to implement a payment processing feature. The agent starts writing backend code, switches to frontend components, adds some tests, then reviews its own work. Each context switch degrades quality.

The backend implementation uses generic patterns rather than your domain-specific conventions. The frontend component ignores your design system. Tests cover only the obvious paths. The self-review misses security vulnerabilities because the agent already "knows" the code is correct.

Real-world metrics from large codebases (50K+ lines of code) tell the story:

**Single Generalist Agent:**
- Backend code quality: 6/10 (misses domain patterns)
- Frontend code quality: 5/10 (ignores component library)
- Test coverage: 40% (superficial happy-path tests)
- Review effectiveness: 3/10 (misses critical security issues)
- Revision cycles to merge: 3-4 rounds

**Specialized Sub-Agents:**
- Backend code quality: 9/10 (follows domain patterns)
- Frontend code quality: 8/10 (matches component library)
- Test coverage: 85% (comprehensive edge cases)
- Review effectiveness: 8/10 (catches security and pattern violations)
- Revision cycles to merge: 1-2 rounds

The tradeoff is clear. Sub-agents require orchestration complexity and add initial latency. But they reduce revision cycles dramatically, resulting in faster time to production despite the slower first pass.

## The Sub-Agent Team Structure

A sub-agent architecture mirrors how development teams operate. An orchestrator agent coordinates work across four specialist roles:

**Backend Engineer**: Handles API endpoints, business logic, database schemas, and validation. Follows your domain patterns, uses your Result type for error handling, implements proper layering.

**Frontend Engineer**: Creates UI components, manages state, handles routing, matches your design system. Uses existing component patterns, follows accessibility guidelines.

**QA Engineer**: Writes comprehensive tests covering happy paths, edge cases, error scenarios, and integration flows. Achieves target coverage, creates deterministic tests.

**Code Reviewer**: Audits code for security vulnerabilities, architectural compliance, and pattern violations. Critically, this agent is read-only. It identifies issues but cannot introduce new bugs by attempting fixes.

Each specialist receives focused context about their domain. The backend engineer knows your API patterns and database conventions. The frontend engineer knows your component library and design tokens. This focused context produces dramatically better output than a generalist trying to hold all patterns simultaneously.

## The Three-Layer Context Hierarchy

Sub-agents derive their expertise from a three-layer context hierarchy:

### Layer 1: Root CLAUDE.md (Shared Patterns)

The root configuration establishes patterns all agents must follow:

```markdown
# Project Coding Standards

## Architecture
- Monorepo structure with packages
- Layered architecture: Domain -> Application -> Infrastructure
- Dependencies flow inward (hexagonal architecture)

## TypeScript Standards
- Strict mode enabled
- No any types (use unknown + type guards)
- Explicit function return types

## Error Handling
- Use Result pattern, never throw in business logic
- Return { success: boolean, data?: T, error?: string }

## Naming Conventions
- Files: kebab-case (user-service.ts)
- Functions: camelCase (createUser)
- Classes: PascalCase (UserService)
```

### Layer 2: Agent Behavioral Flows

Each agent has a dedicated behavioral flow in `.claude/agents/`. This file defines the agent's workflow, focus areas, and boundaries:

```markdown
# .claude/agents/backend-engineer.md

You are a Backend Engineer specializing in Node.js/TypeScript APIs.

## Your Workflow

When implementing an API endpoint:

1. **Understand requirements**
   - Read task description
   - Identify inputs, outputs, business rules
   - Check existing endpoint patterns

2. **Design the endpoint**
   - Choose HTTP method (GET/POST/PUT/DELETE)
   - Design URL following Representational State Transfer (REST) conventions
   - Define request/response schemas using Zod (TypeScript schema validation library)

3. **Implement layers**
   - Route layer: Express routing, validation middleware
   - Handler layer: Request/response transformation
   - Service layer: Business logic, error handling

4. **Hand off to QA Engineer**
   - Provide endpoint URL, schema, edge cases to test

## What you DON'T do:
- Write frontend code (Frontend Engineer's job)
- Write tests (QA Engineer's job)
- Review your own code (Code Reviewer's job)
```

### Layer 3: Package-Specific Context

Each package in your monorepo can have local conventions:

```markdown
# packages/api/CLAUDE.md

API Package - RESTful endpoints using Express + tRPC (type-safe remote procedure call framework)

## Route Structure
All routes follow this pattern:
router.post('/[resource]', validateSchema(schemas.create), handlers.create);

## Authentication
Use JSON Web Token (JWT) tokens with our custom middleware:
router.get('/protected', authenticate, handler);

## Validation Schemas
All schemas in schemas/ directory using Zod
```

This hierarchy ensures every agent has the context it needs: shared standards from root, role-specific workflows from agent files, and local conventions from package files.

## Tool Access Control

A critical aspect of sub-agent architecture is restricting tools based on role. This prevents agents from straying into domains where they lack expertise.

```typescript
const agentPermissions = {
  backendEngineer: {
    canWrite: true,
    allowedPaths: ['packages/api/**', 'packages/domain/**'],
    tools: ['Read', 'Write', 'Edit', 'Bash'],
  },

  frontendEngineer: {
    canWrite: true,
    allowedPaths: ['packages/ui/**', 'apps/web/**'],
    tools: ['Read', 'Write', 'Edit'],
  },

  qaEngineer: {
    canWrite: true,
    allowedPaths: ['**/*.test.ts', '**/*.spec.ts', 'tests/**'],
    tools: ['Read', 'Write', 'Edit', 'Bash'],
  },

  codeReviewer: {
    canWrite: false,  // READ-ONLY
    allowedPaths: ['**/*'],
    tools: ['Read', 'Grep', 'Glob'],
  },
};
```

The code reviewer being read-only deserves emphasis. A reviewer with edit permissions will often "helpfully" fix issues, potentially introducing new bugs. A read-only reviewer can only identify problems, forcing fixes through proper channels with appropriate expertise.

## Real-World Example: Payment Feature

Let's trace a complete sub-agent workflow for implementing Stripe payment processing.

### Step 1: Backend Engineer Implements API

The orchestrator delegates: "Implement Stripe payment API endpoint."

The backend engineer receives context from all three layers: root patterns, backend workflow, and API package conventions. It produces:

```typescript
// packages/api/src/routes/payments.ts
import { Router } from 'express';
import { validateSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { createPaymentHandler } from '../handlers/payments';
import { createPaymentSchema } from '../schemas/payments';

const router = Router();

router.post(
  '/payments',
  authenticate,
  validateSchema(createPaymentSchema),
  createPaymentHandler
);

export default router;

// packages/api/src/schemas/payments.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['usd', 'eur', 'gbp']),
  paymentMethodId: z.string(),
});

// packages/application/src/services/payment-service.ts
import Stripe from 'stripe';
import { Result } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPayment(
  data: CreatePaymentDTO
): Promise<Result<Payment>> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      payment_method: data.paymentMethodId,
      confirm: true,
    });

    return {
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Payment failed: ${error.message}`,
    };
  }
}
```

Output: "Backend complete. Endpoint: POST /api/payments. Schema defined. Ready for frontend."

### Step 2: Frontend Engineer Creates UI

The frontend engineer receives the backend result plus its own context layers:

```typescript
// packages/ui/src/components/PaymentForm.tsx
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './Button';
import { usePayment } from '../hooks/usePayment';

interface PaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export function PaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { createPayment, loading } = usePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      onError(error.message || 'Payment method creation failed');
      return;
    }

    const result = await createPayment({
      amount,
      currency,
      paymentMethodId: paymentMethod.id,
    });

    if (result.success) {
      onSuccess(result.data.id);
    } else {
      onError(result.error || 'Payment failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" disabled={loading || !stripe}>
        {loading ? 'Processing...' : `Pay ${amount / 100} ${currency.toUpperCase()}`}
      </Button>
    </form>
  );
}
```

Output: "Frontend complete. Component: PaymentForm. Ready for testing."

### Step 3: QA Engineer Writes Tests

```typescript
// packages/api/src/handlers/__tests__/payments.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { generateAuthToken } from '../../test-utils/auth';
import Stripe from 'stripe';

jest.mock('stripe');

describe('POST /api/payments', () => {
  const mockStripe = Stripe as jest.MockedClass<typeof Stripe>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create payment successfully with valid data', async () => {
    const token = generateAuthToken({ userId: 'user_123' });
    mockStripe.prototype.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      status: 'succeeded',
      amount: 5000,
    });

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        currency: 'usd',
        paymentMethodId: 'pm_123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('pi_123');
  });

  it('should return 400 for invalid amount', async () => {
    const token = generateAuthToken({ userId: 'user_123' });

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: -100,
        currency: 'usd',
        paymentMethodId: 'pm_123',
      });

    expect(response.status).toBe(400);
  });

  it('should handle Stripe API errors gracefully', async () => {
    const token = generateAuthToken({ userId: 'user_123' });
    mockStripe.prototype.paymentIntents.create.mockRejectedValue(
      new Error('Card declined')
    );

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        currency: 'usd',
        paymentMethodId: 'pm_123',
      });

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Card declined');
  });
});
```

Output: "Tests complete. Coverage: 95%. Ready for review."

### Step 4: Code Reviewer Audits

The reviewer analyzes all implementation files with read-only access:

```markdown
# Code Review: Payment Feature

## Security: PASS
- Stripe secret from environment variable
- Authentication required on endpoint
- Input validation using Zod schema
- No sensitive data logged

## Code Quality: PASS
- Follows Result pattern for errors
- Strict TypeScript, no any types
- Proper separation of concerns

## Issues Found

1. **Missing rate limiting** (Severity: MEDIUM)
   - Location: packages/api/src/routes/payments.ts:12
   - Problem: Payment endpoint should have rate limiting
   - Recommendation: Add rate limiting middleware

2. **Frontend error messages** (Severity: LOW)
   - Location: packages/ui/src/components/PaymentForm.tsx:45
   - Problem: Generic error shown to user
   - Recommendation: Map Stripe codes to friendly messages

## Status: APPROVED WITH MINOR CHANGES
```

The orchestrator aggregates all results and reports: "Feature ready for merge after addressing rate limiting."

## Accuracy vs. Latency Trade-Offs

Sub-agents trade latency for accuracy. Understanding when this trade-off makes sense is essential.

**Why Sub-Agents Are More Accurate:**

Fresh context windows. Your main conversation accumulates 50K tokens of noise from previous sessions, abandoned approaches, and unrelated file reads. A sub-agent starts clean with 5K tokens of relevant context.

Specialized prompts. A single agent cannot hold expert knowledge for all domains. A sub-agent can have 200-300 lines of domain expertise in its system prompt.

Tool restriction. Fewer tools means less decision paralysis. A code reviewer with only Read, Grep, and Glob cannot introduce bugs by "helpfully" editing files.

**When Sub-Agents Win:**
- High-stakes decisions (security review before deploy)
- Complex analysis (entire codebase for performance issues)
- Specialized domains (database optimization)
- Large codebases (50K+ lines of code)
- Production-critical code

**When the Main Agent Wins:**
- Quick iterations (fix this typo)
- Context already loaded (continue the refactor we started)
- Simple tasks (run the tests)
- Prototypes and experiments
- Time-sensitive hot fixes

**Cost Analysis:**

Sub-agents add 10-30 seconds of latency (cold start plus context gathering). But they reduce revision cycles:

Without sub-agents: 3-4 review cycles at 30 minutes each = 90-120 minutes total
With sub-agents: 1-2 review cycles at 30 minutes each = 30-60 minutes total

Net savings: 30-60 minutes despite higher initial latency.

## Agent Swarm Patterns

When you need maximum thoroughness, run multiple agents from multiple perspectives. Single agent runs have blind spots. Multiple agents catch what individuals miss.

### Pattern 1: Many Perspectives

Run 5-10 agents with different focuses on the same code:

1. Security vulnerabilities
2. Performance bottlenecks
3. Code maintainability
4. Edge cases and error handling
5. Integration points

Aggregate findings, de-duplicate, and rank by severity. Same issue found by multiple agents has higher confidence.

### Pattern 2: Same Perspective Multiple Times

Large Language Models (LLMs) are probabilistic. Run the same analysis 4 times and you get different findings each time. The union catches more than any single run.

```typescript
// 4 runs of security analysis
const securityRuns = await Promise.all([
  runSecurityAnalysis(code),
  runSecurityAnalysis(code),
  runSecurityAnalysis(code),
  runSecurityAnalysis(code),
]);

const allFindings = securityRuns.flat();
const deduplicated = deduplicateByIssueType(allFindings);
// Issues found 3/4 times have higher confidence than 1/4
```

### Pattern 3: Many-Many Perspectives

Maximum thoroughness: 10 perspectives multiplied by 4 runs equals 40 total analyses. Use for pre-deployment safety checks, security audits, and major releases.

## Actor-Critic Adversarial Coding

The actor-critic pattern uses two agents in an adversarial loop: one generates code (actor), another critiques it (critic). Each round catches more issues, producing production-ready code before human review.

### The Loop

1. Actor generates initial implementation
2. Critic reviews across 8 dimensions (security, architecture, performance, testing, error handling, documentation, accessibility, code quality)
3. Critic reports findings with severity ratings
4. Actor refactors to address issues
5. Critic re-reviews
6. Repeat until approved or maximum rounds reached (typically 3-5)

### Real-World Example: JWT Authentication

**Round 1 (Actor generates):**
```typescript
export async function authenticate(email: string, password: string) {
  const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ userId: user.id }, 'secret');
  return { token };
}
```

**Round 2 (Critic finds 7 issues):**
- SQL injection vulnerability (critical)
- Plaintext password comparison (critical)
- Hardcoded JWT secret (critical)
- No token expiration (critical)
- No rate limiting (warning)
- Throws exception instead of Result (warning)
- No audit logging (warning)

**Round 3 (Actor refactors):**
```typescript
export const authenticate = rateLimit({
  keyGenerator: (req) => `${req.ip}:${req.body.email}`,
  max: 5,
  window: '15m',
})(async (email: string, password: string): Promise<AuthResult> => {
  if (!email || !password) {
    auditLog.warn('auth:invalid-input', { email });
    return { success: false, error: 'Email and password required' };
  }

  const user = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    auditLog.warn('auth:user-not-found', { email });
    return { success: false, error: 'Invalid credentials' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    auditLog.warn('auth:invalid-password', { email, userId: user.id });
    return { success: false, error: 'Invalid credentials' };
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  auditLog.info('auth:success', { userId: user.id });
  return { success: true, token };
});
```

**Round 4 (Critic re-reviews):**
- 3 remaining issues: rate limiting per IP only, no refresh token, generic error messages

**Round 5-6:** Actor adds refresh token mechanism, Critic approves.

This workflow catches 90%+ of issues that would otherwise reach human review.

## Parallel Agents for Monorepos

When you need to apply the same change across 20 packages, sequential processing takes hours and suffers from context drift. Parallel agents complete the same work in minutes with consistent quality.

### The Sequential Bottleneck

Update `@company/logger` from v2 to v3 across 20 packages:

Sequential: 20 packages multiplied by 8 minutes average equals 160 minutes (2.5 hours)

Problems compound. By package 10, the agent forgets earlier decisions. By package 15, it applies inconsistent patterns. By package 20, it rushes through and introduces bugs.

### The Parallel Solution

Spawn one agent per package. Each agent receives focused context (5K tokens instead of 80K tokens) and applies identical instructions.

```typescript
const packages = await listPackages();

const agents = packages.map(packagePath =>
  spawnAgent({
    name: `update-logger-${path.basename(packagePath)}`,
    workingDirectory: packagePath,
    task: `
      Update @company/logger from v2 to v3:
      1. Change package.json dependency to ^3.0.0
      2. Replace logger.log() with logger.info()
      3. Run tests to verify
    `,
  })
);

const results = await Promise.all(agents.map(a => a.waitForCompletion()));
```

Parallel: Maximum of individual times equals 9 minutes (slowest agent)

Speedup: 160 divided by 9 equals 17x theoretical, approximately 10x practical.

### When to Use Parallel Agents

**Good candidates:**
- Identical task across packages (dependency updates)
- Independent packages (microservices)
- Clear success criteria (tests pass)

**Not ideal:**
- Tasks requiring coordination between packages
- Vague exploratory refactoring
- Tightly coupled packages with shared state

## Best Practices

**1. Keep Agent Contexts Focused**

Each agent should know one domain deeply. Don't teach the backend engineer about React patterns or the QA engineer about database optimization.

**2. Define Clear Handoff Points**

Agents must know when to delegate. The backend engineer hands off to QA with endpoint URL, schema, and edge cases to test. The QA engineer hands off to review with test code and coverage report.

**3. Use Read-Only Reviewers**

A reviewer with edit permissions introduces new bugs while "fixing" issues. Read-only reviewers identify problems and force fixes through proper channels.

**4. Monitor Quality Metrics**

Track issue density per round, human review cycles saved, time to production. Use metrics to decide whether to add more specialists or consolidate.

**5. Accept the Latency Trade-Off**

Initial latency is higher with sub-agents. But fewer revision cycles mean faster time to production overall.

## Anti-Patterns to Avoid

**Sub-agents on trivial tasks.** "Fix this typo" does not need a four-agent team.

**Overlapping responsibilities.** Two agents doing similar work wastes tokens and creates conflicts. Clear roles: Backend, Frontend, QA, Review.

**No tool restrictions.** If all agents have all tools, they do not specialize. Restrict tools to role needs.

**Ignoring context layers.** Agents must read root CLAUDE.md for shared patterns and package-specific CLAUDE.md for local conventions.

**No success criteria.** Without clear criteria ("all tests pass," "coverage above 80%"), agents cannot determine when they are done.

## Exercises

### Exercise 1: Design a Sub-Agent Team

Choose a feature you want to add to your own codebase. Design the sub-agent team:

1. Identify which specialized agents you need
2. Write behavioral flows for two agents (100-200 lines each)
3. Define tool access control for each agent
4. Create orchestration flow (which agents run in parallel, which sequential)
5. Define success criteria for each agent

Evaluate your design: Are roles clearly separated? Does each agent know when to delegate?

### Exercise 2: Run an Actor-Critic Loop

Take a feature you want to implement and run actor-critic manually:

1. Write a critic prompt with the 8 critique dimensions
2. Generate initial code (actor role)
3. Review the code (critic role)
4. Count issues found
5. Refactor based on critique (actor role)
6. Repeat until approved or 5 rounds reached

Track: Issues per round, total rounds, whether human review found anything the critic missed.

### Exercise 3: Parallel Update Across Packages

If you have a monorepo with multiple packages:

1. Choose a simple update (dependency version, API change)
2. Write explicit task description
3. Spawn agents for 3-5 packages in parallel
4. Verify changes are consistent across all packages
5. Measure: Time taken versus estimated sequential time

If you do not have a monorepo, create a simple one with 3-5 packages and practice the workflow.

## Summary

Sub-agent architecture transforms how AI assists with complex development tasks. Instead of a single generalist producing mediocre results across all domains, specialized agents deliver expert-level output in their focus areas.

The three-layer context hierarchy provides shared standards, role-specific workflows, and local conventions. Tool access control prevents agents from straying into domains where they lack expertise. The orchestrator coordinates handoffs and aggregates results.

For thorough analysis, swarm patterns multiply perspectives and runs. Actor-critic loops catch issues through adversarial review. Parallel agents accelerate monorepo-wide changes from hours to minutes.

The cost is orchestration complexity. The benefit is dramatically higher quality code that requires fewer revision cycles, ultimately reaching production faster despite the initial latency.

---

*Related chapters:*

- **[Chapter 4: Writing Your First CLAUDE.md](ch04-writing-your-first-claude-md.md)** for the foundation of three-layer context hierarchy
- **[Chapter 6: The Verification Ladder](ch06-the-verification-ladder.md)** for the verification patterns sub-agents enforce
- **[Chapter 7: Quality Gates That Compound](ch07-quality-gates-that-compound.md)** for how sub-agent output flows through quality gates
- **[Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md)** for how sub-agents integrate into the autonomous development cycle
- **[Chapter 15: Model Strategy & Cost Optimization](ch15-model-strategy-and-cost-optimization.md)** for using different model tiers for different agent roles
