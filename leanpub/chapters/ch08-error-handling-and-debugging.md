# Chapter 8: Error Handling and Debugging {#_chapter_8:_error_handling_and_debugging} {#ch08-error-handling-and-debugging}

[]{.index term="error handling"} []{.index term="debugging"} []{.index term="ERRORS.md"}

Errors are inevitable. Repeated errors are a choice.

When working with AI coding agents, debugging takes on a new dimension. You're not just fixing bugs in code. You're diagnosing why the AI produced incorrect output in the first place. And you're building systems that prevent entire classes of errors from recurring.

This chapter introduces systematic approaches to error diagnosis, persistent error memory through ERRORS.md, flaky test detection, and clean slate recovery patterns. By the end, you'll transform every problem into a permanent lesson encoded in your harness.

## The Five-Point Error Diagnostic Framework {#_the_five_point_error_diagnostic_framework}

When an AI agent produces incorrect code, most developers react immediately. They fix the specific bug and move on. But this reactive approach misses the opportunity to eliminate entire error classes.

Every Large Language Model (LLM) error fits into one of five categories:

**1. Context Problem (60% of errors)**

The AI lacks information to make correct decisions. Symptoms include: - Code that doesn't match existing project patterns - References to non-existent files or functions - Generic implementations without project-specific knowledge

**2. Model Problem (10% of errors)**

The current model lacks capability for the task's complexity. Symptoms include: - Failure on complex architectural decisions - Incomplete solutions for multi-step reasoning - Same mistakes repeated despite good context

**3. Rules Problem (15% of errors)**

CLAUDE.md doesn't specify the required behavior. Symptoms include: - Pattern violations despite having context - Missing edge case handling - Convention violations

**4. Testing Problem (10% of errors)**

Tests don't catch the error type. Symptoms include: - Code passes tests but fails in production - Tests check presence, not behavior - Missing edge case coverage

**5. Quality Gate Problem (5% of errors)**

No automated check enforces the requirement. Symptoms include: - Code compiles but violates architecture - Linting passes but conventions break - Subtle bugs slip through

::: {#fig-debugging-hierarchy wrapper="1" align="center" width="600"}
![The Debugging Hierarchy: Where to look first when diagnosing AI agent errors](ch08-debugging-hierarchy.png){alt="Debugging Hierarchy"}
:::

### Applying the Framework {#_applying_the_framework}

When you encounter an error, diagnose the root cause before fixing:

``` typescript
// Diagnostic questions to ask:
// 1. Context: Did the AI have relevant examples?
// 2. Model: Is this task too complex for the current model?
// 3. Rules: Does CLAUDE.md specify this behavior?
// 4. Testing: Would better tests catch this?
// 5. Quality Gates: Could automation prevent this?
```

Consider this example. The AI generates code that stores passwords in plain text:

``` typescript
// Bad: Plain text password storage
async function createUser(email: string, password: string) {
  await db.users.create({
    email,
    password // Plain text!
  })
}
```

**Diagnosis**: This is a Rules Problem. CLAUDE.md doesn't specify password hashing requirements.

**Fix**: Add the rule to CLAUDE.md, not just the code:

```` markdown
<!-- CLAUDE.md -->
## Security Requirements

**ALWAYS hash passwords with bcrypt before storing:**

```typescript
import bcrypt from 'bcrypt'

const passwordHash = await bcrypt.hash(password, 12)
await db.users.create({ email, passwordHash })
```
````

Now all future authentication code will include proper hashing. You fixed not just one instance but the entire error class.

### The Real-World Workflow {#_the_real_world_workflow}

Here's how the framework applies to a payment processing feature:

**Error 1**: AI uses wrong Stripe API version - Diagnosis: Context Problem - Fix: Add Stripe version to CLAUDE.md

**Error 2**: AI doesn't verify webhook signatures - Diagnosis: Rules Problem - Fix: Document webhook security requirements

**Error 3**: Code passes tests but fails on idempotency - Diagnosis: Testing Problem - Fix: Add idempotency test

**Error 4**: AI logs sensitive card data - Diagnosis: Quality Gate Problem - Fix: Add AST-grep (Abstract Syntax Tree pattern matching tool) rule to block logging payment data

After four iterations, you've permanently eliminated four error classes from your payment processing code.

## The Context Debugging Framework {#_the_context_debugging_framework}

When AI output is wrong, follow a hierarchical debugging protocol ordered by likelihood of success:

    ┌─────────────────────────────────────────────────────────┐
    │ Layer 1: CONTEXT (60% of issues)                        │
    │ Add missing information, files, examples, architecture  │
    └─────────────────────────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Layer 2: PROMPTING (25% of issues)                      │
    │ Refine instructions, add examples, clarify constraints  │
    └─────────────────────────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Layer 3: MODEL POWER (10% of issues)                    │
    │ Escalate to more powerful model for complex reasoning   │
    └─────────────────────────────────────────────────────────┘
                             ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Layer 4: MANUAL OVERRIDE (5% of issues)                 │
    │ Recognize when human intuition is needed                │
    └─────────────────────────────────────────────────────────┘

Always start at Layer 1. Context fixes 60% of issues. Don't waste time switching models when the real problem is missing information.

### Layer 1: Context Debugging Checklist {#_layer_1:_context_debugging_checklist}

When AI output is wrong, systematically add context:

**Include relevant code files**. Show existing patterns:

``` bash
# Claude Code automatically includes files you reference
claude "Add pagination following the pattern in src/api/products.ts"
```

**Provide system architecture**. Explain constraints:

``` markdown
Our architecture:
- Next.js frontend with tRPC API layer
- Redis for distributed caching (no in-memory cache)
- Deployed on Vercel serverless

The caching solution must work across serverless instances.
```

**Include error messages and stack traces**. Be specific:

    TypeError: Cannot read property 'id' of undefined
      at getUserById (src/api/users.ts:23)

**Show database schemas**. Provide actual types:

``` typescript
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

### Layer 2: Prompting Refinement {#_layer_2:_prompting_refinement}

If context doesn't fix the issue, refine your prompts:

**Add specific examples of desired output**:

    Format user data for display:

    Input: { email: 'test@example.com', createdAt: '2025-01-15T10:30:00Z' }
    Output: 'test@example.com (joined Jan 15, 2025)'

**Include edge cases and constraints**:

    Edge cases to handle:
    - Invalid date strings: return null
    - Missing date: return null
    - Out of range dates: return null

    Constraints:
    - Never throw exceptions
    - Return type: Date | null

**Break complex tasks into steps**:

    Implement authentication - STEP 1: Basic email/password login

    Requirements for this step only:
    1. Accept email and password
    2. Validate against database
    3. Return JSON Web Token (JWT) on success

    We'll add OAuth and 2FA in subsequent steps.

### Layer 3: Model Escalation {#_layer_3:_model_escalation}

Only escalate model power when: 1. Context and prompting are exhausted 2. Task requires advanced reasoning 3. Consistent failures across multiple attempts

Some tasks genuinely need more powerful models. Complex architecture decisions, multi-file refactoring, and novel algorithm design may require Claude Opus instead of Sonnet.

But don't use model power to compensate for missing context. That's expensive and unreliable.

### Layer 4: Manual Override {#_layer_4:_manual_override}

Some tasks require human intervention: - Deep domain expertise (medical, legal, financial) - Subjective creative decisions - Ambiguous or contradictory requirements - Legacy systems with tribal knowledge

Manual doesn't mean "give up on AI." Use a hybrid approach: human solves the core problem, AI scales the solution.

### Measuring Debug Effectiveness {#_measuring_debug_effectiveness}

Track your debugging patterns to improve over time:

    Target Distribution:
    - Context fixes: 60% (5 min avg)
    - Prompting fixes: 25% (10 min avg)
    - Model escalation: 10% (20 min avg)
    - Manual override: 5% (varies)

If you're escalating to more powerful models frequently, you likely have context problems. If you need manual intervention often, your prompts probably lack specificity.

The expected debugging time with proper layer ordering:

    0.6 × 5 + 0.25 × 10 + 0.1 × 20 + 0.05 × 30 = 9 minutes average

Compare this to jumping straight to model escalation:

    Most issues still require context → wasted expensive tokens
    Same debugging time + higher cost

Always start with the cheapest, highest-probability fix.

## ERRORS.md: Building Persistent Memory {#_errors_md:_building_persistent_memory}

LLMs are stateless. They don't remember previous conversations. Every session starts fresh. This creates a frustrating pattern:

    Week 1: AI makes Error X → You correct it → Fixed
    Week 2: AI makes Error X again → You correct it again
    Week 3: AI makes Error X AGAIN → Frustration

The solution is ERRORS.md. A persistent document that serves as memory for your AI agents.

### Structure of ERRORS.md {#_structure_of_errors_md}

```` markdown
# Common Errors & Solutions

Last Updated: 2026-01-27
Total Errors Documented: 23

## Error: Missing await on Promises

**Frequency**: 12 occurrences
**Severity**: High (causes production crashes)
**Last Occurrence**: 2026-01-20

**Symptom**:
- UnhandledPromiseRejectionWarning in logs
- Function returns Promise instead of value

**Bad Pattern**:
```typescript
// Missing await - Promise not resolved
const user = getUserById(id)
console.log(user.email) // undefined!
```

**Correct Fix**:
```typescript
const user = await getUserById(id)
console.log(user.email) // Works
```

**Prevention Strategy**:
1. Enable @typescript-eslint/no-floating-promises
2. Add pre-commit hook to catch floating promises
3. Include this example when working with async code

---
````

### Using ERRORS.md {#_using_errors_md}

Before starting a task, include relevant errors in context:

``` markdown
Task: Implement user authentication API endpoint

Relevant errors to avoid (from ERRORS.md):
1. Missing await on database calls
2. Missing null checks on user lookup
3. Incorrect Zod schema for timestamps

Implement the endpoint avoiding these documented patterns.
```

### Monthly Review Process {#_monthly_review_process}

Each month, review ERRORS.md:

1.  **Generate frequency report**. Sort errors by occurrence count.

2.  **Implement prevention** for high-frequency errors (5+ occurrences):

    - Add ESLint rules

    - Create type guards

    - Add CI checks

3.  **Update documentation**. Add prevention strategies.

4.  **Measure impact**. Track reduction over time.

The goal isn't zero errors. It's zero repeated errors.

### Additional ERRORS.md Patterns {#_additional_errors_md_patterns}

Document common error patterns specific to AI-assisted development:

**Schema Mismatches**:

```` markdown
## Error: Zod schema doesn't match database types

**Frequency**: 8 occurrences
**Severity**: Medium

**Symptom**: "Expected string, received object" at runtime

**Bad Pattern**:
```typescript
const UserSchema = z.object({
  createdAt: z.string() // Wrong! DB returns Date
})
```

**Correct Fix**:
```typescript
const UserSchema = z.object({
  createdAt: z.coerce.date() // Handles Date objects
})
```

**Prevention**: Use z.coerce.date() for all
timestamp fields by default.
````

**Missing Null Checks**:

```` markdown
## Error: Cannot read property of null

**Frequency**: 15 occurrences
**Severity**: Critical (production crashes)

**Symptom**: "Cannot read property 'X' of null"

**Bad Pattern**:
```typescript
const user = await getUserById(id)
return user.email // Crashes if user is null!
```

**Correct Fix**:
```typescript
const user = await getUserById(id)
if (!user) {
  return { success: false, error: 'User not found' }
}
return { success: true, email: user.email }
```

**Prevention**: Enable strictNullChecks in tsconfig.json.
````

These documented patterns become context for future tasks. When the AI starts working on database queries, it sees the null check pattern. When it creates Zod schemas, it sees the coerce pattern. Mistakes become guardrails.

## Flaky Test Diagnosis {#_flaky_test_diagnosis}

Flaky tests destroy trust in Continuous Integration/Continuous Deployment (CI/CD) pipelines. They pass sometimes and fail other times, wasting developer time on false positives.

When using AI agents, flaky tests create a compounding problem. Agents can't distinguish flaky failures from real bugs. They waste tokens trying to "fix" code that isn't broken.

### Common Causes of Flaky Tests {#_common_causes_of_flaky_tests}

**Timing issues (most common)**:

``` typescript
// Flaky: Checks before async operation completes
test('updates UI after fetch', async () => {
  render(<UserProfile userId="1" />)
  // Might fail - async not awaited
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})

// Fixed: Wait for element
test('updates UI after fetch', async () => {
  render(<UserProfile userId="1" />)
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

**Order-dependent tests**:

``` typescript
// Flaky: Depends on previous test's state
test('lists users', async () => {
  const users = await userService.list()
  expect(users).toHaveLength(1) // Depends on previous test!
})

// Fixed: Reset state in each test
beforeEach(async () => {
  await db.clear()
})
```

**External service dependencies**:

``` typescript
// Flaky: Real network calls
test('fetches weather', async () => {
  const weather = await weatherService.getCurrent('London')
  expect(weather.temp).toBeDefined()
})

// Fixed: Mock external services
const server = setupServer(
  rest.get('https://api.weather.com/*', (req, res, ctx) => {
    return res(ctx.json({ temp: 20 }))
  })
)
```

**Random data without seeds**:

``` typescript
// Flaky: Random values change each run
test('generates unique IDs', () => {
  const id1 = generateId()
  const id2 = generateId()
  expect(id1).not.toBe(id2) // Usually true, but...
})

// Fixed: Seed randomness
beforeEach(() => {
  faker.seed(12345)
})
```

**Date/time dependencies**:

``` typescript
// Flaky: Fails after certain dates
test('subscription is active', () => {
  const sub = { expiresAt: '2025-12-31' }
  expect(isActive(sub)).toBe(true) // Fails after 2025!
})

// Fixed: Mock time
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-06-15'))
})
```

### Automated Flaky Detection {#_automated_flaky_detection}

Run tests multiple times to identify flaky patterns:

``` typescript
async function diagnoseFlakyTest(testPath: string, iterations = 50) {
  const results: boolean[] = []

  for (let i = 0; i < iterations; i++) {
    const passed = await runTest(testPath)
    results.push(passed)
  }

  const passRate = results.filter(r => r).length / iterations
  const isFlaky = passRate > 0 && passRate < 1

  if (isFlaky) {
    console.log(`FLAKY: ${testPath}`)
    console.log(`Pass rate: ${(passRate * 100).toFixed(1)}%`)
  }

  return { passRate, isFlaky }
}
```

Categorize flaky tests by root cause and apply targeted fixes.

## Clean Slate Recovery {#_clean_slate_recovery}

After 3+ failed attempts at solving a problem, context rot sets in. The conversation accumulates failed implementations, error messages, and dead-end approaches. The AI gets stuck suggesting variations of things that already failed.

This is when you need clean slate recovery.

### Recognizing the Pattern {#_recognizing_the_pattern}

You need a fresh start when: - Same approach repeated with variations ("try JWT... JWT + X... JWT + Y...") - Quality declining (later suggestions worse than earlier ones) - Circular references ("let's go back to approach 1...") - The "stuck" feeling

### The Clean Slate Process {#_the_clean_slate_process}

**Step 1**: Recognize the pattern (3+ failed attempts)

**Step 2**: Document what failed and why

``` markdown
## Session 1 Learnings

Approach: JWT refresh token authentication

Failure reason:
- API doesn't expose refresh token endpoint
- Cannot modify backend (external service)

Constraints discovered:
- Backend is read-only
- Must use existing session-based auth
```

**Step 3**: Start a fresh session

**Step 4**: Frame with explicit constraints

``` markdown
Implement authentication that keeps users logged in.

Context: Previous approach tried JWT refresh tokens but failed
because our API doesn't expose refresh endpoints.

Constraints:
- Must use session-based auth (API provides session cookies)
- Cannot modify backend API
- Must handle 401 by redirecting to login
```

**Step 5**: Verify the new approach before implementing

    Before implementing, confirm:
    1. Does this avoid the JWT refresh approach?
    2. How does it handle the session cookie limitation?

### Why Clean Slate Works {#_why_clean_slate_works}

You don't need failed implementations in context. You only need the constraints they revealed.

The failed JWT code doesn't help. But knowing "API doesn't support refresh endpoints" is valuable. Extract the lesson, discard the baggage.

Cost analysis shows clean slate becomes profitable after attempt 3: - Continuing a broken trajectory: \~40 minutes, \~40K tokens, 30% success - Clean slate recovery: \~25 minutes, \~20K tokens, 80% success

## Circuit Breakers and Reliability Patterns {#_circuit_breakers_and_reliability_patterns}

Building a demo agent is easy. Building a reliable agent is exponentially harder. Up to 95% of AI agent proof-of-concepts fail to make it to production, primarily due to reliability issues.

### The Reliability Compounding Problem {#_the_reliability_compounding_problem}

Individual action reliability compounds catastrophically across multi-step tasks. Even with 95% success per action, the overall success rate drops dramatically:

+----------------------+-----------------------+--------------------------------+
| Actions              | Per-Action Success    | Overall Success                |
+======================+=======================+================================+
| 5                    | 95%                   | 77%                            |
+----------------------+-----------------------+--------------------------------+
| 10                   | 95%                   | **60%**                        |
+----------------------+-----------------------+--------------------------------+
| 20                   | 95%                   | **36%** (worse than coin flip) |
+======================+=======================+================================+
| 30                   | 95%                   | **21%**                        |
+======================+=======================+================================+

The math is simple: `Overall` `=` `(Per-Action)^N`. At 20 actions with 95% per-action reliability, you get `0.95^20` `=` `0.36`. This explains why demo agents fail in production. Real workflows demand complex sequences where compound failures become inevitable.

### Multi-Layer Timeout Protection {#_multi_layer_timeout_protection}

Runaway Large Language Model (LLM) workflows can rack up hundreds of dollars in unexpected API costs. A single misconfigured job can consume an entire monthly budget in hours. Implement multi-layer timeout protection to cap costs at predictable levels.

**Layer 1: Job-Level Timeouts**

The outermost protection layer. If everything else fails, the job dies.

``` yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    timeout-minutes: 15  # Hard cap on job duration

    steps:
      - name: Run AI Review
        timeout-minutes: 10  # Step-level timeout (inner limit)
        run: bun scripts/ai-review.ts
```

Why two timeouts? The job timeout (15 min) catches everything including setup and teardown. The step timeout (10 min) catches the actual AI work and leaves buffer for cleanup.

**Layer 2: Request-Level Token Caps**

Prevent agent requests from generating excessive output by capping input size:

``` typescript
import {
  query, type SDKMessage
} from '@anthropic-ai/claude-agent-sdk';

// Cap input to prevent excessive context consumption
const truncatedCode = code.slice(0, 10000);  // ~2500 tokens

const response = query({
  prompt: `Review this code:\n\n${truncatedCode}`,
  options: {
    model: 'claude-sonnet-4-5-20250929',
    allowedTools: [],  // Code review needs no tools
  }
});

// Stream response and collect text
let reviewText = '';
for await (const msg of response) {
  if (msg.type === 'assistant') {
    reviewText += extractTextContent(msg);
  }
}
```

Token limits by task type: - Code review: 2048-4096 tokens - Bug fix: 1024-2048 tokens - Documentation: 4096-8192 tokens - Simple edits: 512-1024 tokens

**Layer 3: Input Size Limits**

Cap the amount of context you send to the model:

``` typescript
const DEFAULT_LIMITS = {
  maxFiles: 50,
  maxLinesPerFile: 500,
  maxTotalTokens: 50000,
  excludePatterns: [
    'node_modules/**',
    '*.lock',
    '*.min.js',
    'dist/**'
  ]
}
```

**Layer 4: Budget Alerts and Hard Caps**

The final safety net stops operations when approaching budget limits:

``` typescript
interface BudgetConfig {
  dailyLimit: number      // $ per day
  monthlyLimit: number    // $ per month
  alertThreshold: number  // Percentage to alert (0.8 = 80%)
}

const BUDGET: BudgetConfig = {
  dailyLimit: 10,
  monthlyLimit: 100,
  alertThreshold: 0.8
}

async function checkBudget(): Promise<{
  ok: boolean; remaining: number
}> {
  const usage = await getUsageFromTracking()
  const spent = usage.today

  if (spent >= BUDGET.dailyLimit) {
    console.error(`Daily budget exceeded: $${spent.toFixed(2)}`)
    return { ok: false, remaining: 0 }
  }

  return { ok: true, remaining: BUDGET.dailyLimit - spent }
}
```

### The Circuit Breaker Pattern {#_the_circuit_breaker_pattern}

Circuit breakers prevent cascading failures by stopping operations after consecutive failures. The pattern has three states:

**Closed**: Normal operation. Requests flow through. Track failures.

**Open**: After N consecutive failures, stop all requests immediately. Return fast-fail response without attempting the operation.

**Half-Open**: After a reset period, allow a single probe request. If it succeeds, return to Closed. If it fails, return to Open.

``` typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failures = 0
  private lastFailureTime = 0
  private readonly maxFailures = 3
  private readonly resetTimeMs = 30000  // 30 seconds

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.maxFailures) {
      this.state = 'open'
    }
  }
}
```

Use the circuit breaker to protect agent operations:

``` typescript
import {
  query, type SDKMessage
} from '@anthropic-ai/claude-agent-sdk';

const breaker = new CircuitBreaker()

async function reliableAgentCall(prompt: string): Promise<string> {
  return breaker.execute(async () => {
    const response = query({
      prompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        allowedTools: []
      }
    });

    // Collect streaming response
    let result = '';
    for await (const msg of response) {
      if (msg.type === 'assistant') {
        result += extractTextContent(msg);
      }
    }
    return result;
  })
}
```

### Retry Patterns with Exponential Backoff {#_retry_patterns_with_exponential_backoff}

When operations fail, retry with increasing delays:

``` typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.log(
        `Attempt ${attempt + 1} failed: ${lastError.message}`
      )

      if (attempt < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw lastError!
}
```

The exponential backoff pattern (1s, 2s, 4s, 8s...) gives temporary issues time to resolve while preventing thundering herd problems.

### Improving Per-Action Reliability {#_improving_per_action_reliability}

The key to compound reliability is improving per-action success rate:

+----------------------+-----------------------+----------------------+
| Current              | Target                | 10-Action Workflow   |
+======================+=======================+======================+
| 95%                  | 99%                   | 60% → 90%            |
+----------------------+-----------------------+----------------------+
| 95%                  | 99.5%                 | 60% → 95%            |
+======================+=======================+======================+
| 95%                  | 99.9%                 | 60% → 99%            |
+======================+=======================+======================+

Every 1% improvement in per-action reliability compounds dramatically. Strategies to improve:

1.  **Reduce task complexity**: Fewer steps per task means fewer failure points

2.  **Add pre-action validation**: Check constraints before attempting

3.  **Add post-action verification**: Confirm the outcome, not just the response

4.  **Implement retry with learning**: Adapt approach based on failure reason

5.  **Use fresh context**: The RALPH loop pattern clears context rot between tasks

## Learning Loops: Encoding Prevention {#_learning_loops:_encoding_prevention}

Every problem is a lesson. Encode it so it never happens again.

    Problem occurs → Fix it →
    Ask: "How do we prevent this class?" →
    Encode the answer

### Where Knowledge Goes {#_where_knowledge_goes}

+----------------------+-----------------------+-----------------------------+
| Problem Type         | Destination           | Example                     |
+======================+=======================+=============================+
| Coding pattern       | CLAUDE.md             | "Use bun, not npm"          |
+----------------------+-----------------------+-----------------------------+
| Automated check      | Hook                  | Run typecheck before commit |
+----------------------+-----------------------+-----------------------------+
| Regression           | Test                  | Add test for edge case      |
+----------------------+-----------------------+-----------------------------+
| Style issue          | Linter rule           | Configure biome rule        |
+----------------------+-----------------------+-----------------------------+
| Workflow insight     | Knowledge base        | Article on debugging        |
+======================+=======================+=============================+
| File relationship    | CLAUDE.md             | "When changing X, update Y" |
+======================+=======================+=============================+

### Example Learning Loops {#_example_learning_loops}

**Agent kept using wrong package manager** - Problem: Agent uses `npm` when project uses `bun` - Encoding: Add to CLAUDE.md: \"\`Use `bun` not `npm` for all operations\`\"

**Tests passed but types broken** - Problem: CI failed on types after tests passed locally - Encoding: Add pre-commit hook for typecheck

**Forgot to update related files** - Problem: Changed API schema but forgot client types - Encoding: Add to CLAUDE.md: "When changing api/schema.ts, update client/types.ts"

### The Compound Effect {#_the_compound_effect}

    Session 1: Problem → Fix → Encode
    Session 2: Problem prevented (or new problem → Encode)
    Session 3: Two problems prevented
    Session N: Harness is strong, new problems are rare

This is how the harness grows organically. Problems become barriers. Mistakes become infrastructure. Sessions strengthen the system.

## Recovery Patterns for Long-Running Agents {#_recovery_patterns_for_long_running_agents}

Long-running agents face unique challenges. Context degrades over time. Goals drift. State accumulates. When these agents fail, you need recovery patterns that preserve progress while providing fresh starts.

### Checkpoint Commit Patterns {#_checkpoint_commit_patterns}

Git commits serve as checkpoints in AI-assisted development. Frequent, atomic commits after each successful change enable rapid recovery when AI-generated code fails.

**The Ratchet Effect**

Commit after every successful change to lock in progress:

::: {#fig-ratchet-effect-flow wrapper="1" align="center" width="600"}
![The Ratchet Effect: Commit on success locks in progress, fix on failure before proceeding](ch08-ratchet-effect-flow.png){alt="Ratchet Effect Flow"}
:::

    ┌────────────────────────────────────────────────────────────┐
    │  AI generates code                                          │
    │           ↓                                                 │
    │  Run validation (compile, lint, test)                      │
    │           ↓                                                 │
    │  Passes? ─┬─► Yes → COMMIT immediately (ratchet forward)   │
    │           │                                                 │
    │           └─► No → Fix before proceeding (no commit)       │
    └────────────────────────────────────────────────────────────┘

This creates a "ratchet effect" where progress is locked in and cannot be lost.

**Checkpoint Before Risk**

Before any operation that might break things, create a safety checkpoint:

``` bash
# Before major refactoring
git add -A && git commit -m \
  "checkpoint: before refactoring auth module"

# Before running unfamiliar AI suggestions
git add -A && git commit -m \
  "checkpoint: before applying AI caching suggestion"
```

If the risky operation fails, recovery is instant: `git` `checkout` `.`

**End-of-Session Commits for RALPH**

In RALPH loop workflows, always commit before the session ends:

``` bash
git add -A
git commit -m "[progress]: end of session - completed tasks 1-3

Completed:
- Task 1: Add user validation (src/validators/user.ts)
- Task 2: Update API endpoint (src/routes/users.ts)
- Task 3: Add integration tests (tests/users.test.ts)

Next session should:
- Start with Task 4: Add rate limiting
- Review test coverage for edge cases

All tests passing. Build successful.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

This commit message gives the next agent full context to continue.

### The Four-Turn Reliability Framework {#_the_four_turn_reliability_framework}

Reliable agents operate through structured turns. Most demo agents skip understanding and verification, which is exactly where reliability collapses.

**Turn 1: Understand State**

Before acting, verify context and requirements:

``` typescript
async function preActionChecks(intent: Intent): Promise<CheckResult> {
  const checks = [
    verifyRequiredInfo(intent),    // Do we have what we need?
    detectAmbiguity(intent),       // Is the request clear?
    validatePrerequisites(intent), // Are dependencies met?
    confirmAuthorization(intent),  // Do we have permission?
  ]

  const results = await Promise.all(checks)
  const failed = results.filter(r => !r.passed)

  if (failed.length > 0) {
    return { proceed: false, issues: failed }
  }

  return { proceed: true }
}
```

**Turn 2: Decide Action**

Choose the appropriate response based on understanding.

**Turn 3: Execute**

Perform the task.

**Turn 4: Verify Outcome**

Confirm the outcome, not just the response:

``` typescript
// Bad: Trusting API response
const response = await api.updateOrder(orderId, changes)
if (response.status === 200) {
  return "Order updated"  // Might not actually be true!
}

// Good: Verify actual outcome
const response = await api.updateOrder(orderId, changes)
if (response.status === 200) {
  const order = await api.getOrder(orderId)
  const verified = verifyChangesApplied(order, changes)

  if (!verified) {
    return {
      success: false,
      reason: "Changes not reflected in order state"
    }
  }

  return { success: true }
}
```

APIs can return 200 but fail silently. Always verify the actual state.

### Human Escalation Patterns {#_human_escalation_patterns}

Know when to stop and ask for help. Agents should escalate when:

``` typescript
const ESCALATION_TRIGGERS = {
  consecutiveFailures: 3,      // Three strikes, you're out
  confidenceThreshold: 0.5,    // Below 50% confidence
  riskLevel: 'high',           // High-risk operations
  ambiguousRequirements: true  // Unclear instructions
}

function shouldEscalate(state: AgentState): boolean {
  const triggers = ESCALATION_TRIGGERS;
  return (
    state.consecutiveFailures >= triggers.consecutiveFailures ||
    state.currentConfidence < triggers.confidenceThreshold ||
    state.currentAction.riskLevel === triggers.riskLevel ||
    state.requirementsClear === false
  )
}
```

Escalation is not failure. It's recognizing the limits of autonomous operation.

### Context Degradation and Goal Drift {#_context_degradation_and_goal_drift}

Long-running agents face two enemies:

**Context Degradation**: The agent forgets previous information, forcing repetition.

Solution: Explicit state tracking.

``` typescript
interface AgentState {
  originalGoal: string
  currentStep: number
  completedSteps: Step[]
  gatheredContext: Map<string, any>
  checkpoints: Checkpoint[]
}
```

**Goal Drift**: The agent loses original objectives and gets sidetracked.

Solution: Progress monitoring.

``` typescript
function checkGoalAlignment(
  currentAction: Action,
  originalGoal: string
): boolean {
  const alignment = scoreAlignment(currentAction, originalGoal)

  if (alignment < DRIFT_THRESHOLD) {
    console.warn(
      `Action "${currentAction.name}"` +
      ` may not serve goal "${originalGoal}"`
    )
    return false
  }

  return true
}
```

### RALPH Loop Recovery Pattern {#_ralph_loop_recovery_pattern}

The RALPH (Read, Act, Log, Persist, Halt) loop uses fresh context for each iteration:

    ┌────────────────────────────────────────────────────────────┐
    │ RALPH Iteration N                                           │
    ├────────────────────────────────────────────────────────────┤
    │ 1. Read git log to understand recent progress              │
    │ 2. Read tasks.json for current state                       │
    │ 3. Complete ONE task                                       │
    │ 4. Commit with descriptive message                         │
    │ 5. Update tracking files                                   │
    │ 6. Exit (fresh context next iteration)                     │
    └────────────────────────────────────────────────────────────┘

Git commits become the "save game" between iterations. Each fresh start eliminates context rot while preserving progress:

``` bash
# What previous agent did (memory reconstruction)
git log --oneline -5

# f8bd993 [progress]: add user validation - all tests pass
# b1c32b7 [progress]: add password hashing utilities
# 0b6ebd0 [progress]: create User model
# 3922f65 [progress]: initial project setup

# Current agent continues from last commit
```

The key insight: you don't need the full conversation history. You need the outcomes, constraints discovered, and next steps. Git provides this external memory without the context window costs.

## Common Debugging Pitfalls {#_common_debugging_pitfalls}

Avoid these common mistakes when debugging with AI agents:

**Pitfall 1: Fixing symptoms instead of root causes**

    Bad: "Change line 47 to use bcrypt.hash instead of plain text"
    Good: Add rule to CLAUDE.md about password hashing

The first approach fixes one instance. The second fixes all future instances.

**Pitfall 2: Adding irrelevant context**

Including your entire codebase "just in case" creates noise that reduces signal. Only include files relevant to the specific task. A 200-line focused context beats a 10,000-line dump.

**Pitfall 3: Not verifying fixes**

After applying a fix, always verify it works:

``` bash
# Before fix
claude "Implement user authentication"
# → Generates code without password hashing

# After fix (added rule to CLAUDE.md)
claude "Implement user authentication"
# → Generates code WITH password hashing ✓
```

If you don't verify, you don't know if your fix was effective.

**Pitfall 4: Premature clean slate**

Don't reset after one failed attempt. Follow the 3-attempt threshold. The first failure might be a simple typo or environmental issue. Clean slate is for genuine context rot, not minor setbacks.

**Pitfall 5: Not documenting failures**

When you reset to a clean slate, document what failed:

    Bad: "That didn't work. Let me start over."
    Good: "Previous approach failed because API lacks refresh endpoint."

Without documentation, the new session might repeat the same mistakes.

## Exercises {#_exercises}

### Exercise 1: Create Your ERRORS.md {#_exercise_1:_create_your_errors_md}

Set up error tracking for your project: 1. Create ERRORS.md with the template from this chapter 2. Document 3 recent errors you've encountered 3. Include frequency, severity, bad pattern, correct fix 4. Add prevention strategies for each

### Exercise 2: Diagnose a Real Error {#_exercise_2:_diagnose_a_real_error}

Take a recent bug you fixed. Apply the five-point framework: 1. Was it a Context, Model, Rules, Testing, or Quality Gate problem? 2. Did you fix the symptom or the root cause? 3. What would prevent this entire error class? 4. Implement the prevention (CLAUDE.md rule, test, hook, or lint rule)

### Exercise 3: Clean Slate Practice {#_exercise_3:_clean_slate_practice}

Think of a time you got stuck debugging with AI. Practice the clean slate pattern: 1. What approach kept failing? 2. What was the root cause of failure? 3. What constraints would you include in a fresh session? 4. Write the clean slate prompt you would use

## Summary {#_summary}

Error handling in AI-assisted development requires systematic approaches:

1.  **Five-point framework** classifies every error into Context, Model, Rules, Testing, or Quality Gate problems

2.  **Context debugging** solves 60% of issues by adding missing information

3.  **ERRORS.md** creates persistent memory so mistakes don't repeat

4.  **Flaky test diagnosis** identifies and fixes intermittent failures

5.  **Clean slate recovery** escapes broken trajectories after 3+ failed attempts

6.  **Circuit breakers** prevent cascading failures by stopping after consecutive failures

7.  **Multi-layer timeout protection** caps costs at job, request, input, and budget levels

8.  **Recovery patterns** use checkpoint commits and the four-turn framework for long-running agent reliability

9.  **Learning loops** encode every problem into permanent prevention

The reliability compounding problem explains why demo agents fail in production: 95% per-action success becomes just 36% at 20 actions. The solution is improving per-action reliability through pre-action validation, post-action verification, and the RALPH loop's fresh context approach.

The goal isn't perfection. It's compounding improvement. Every error you diagnose correctly becomes a barrier against future errors. Every lesson you encode strengthens your harness.

Errors are inevitable. Repeated errors are a choice.

'''''

:::: note
::: title
Note
:::

**Companion Code**: All 7 code examples for this chapter are available at [examples/ch08/](https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book/tree/main/examples/ch08)
::::

*Related chapters:*

- **[Chapter 6: The Verification Ladder](#_chapter_6_the_verification_ladder){.cross-reference}** for the verification patterns that catch errors early

- **[Chapter 7: Quality Gates That Compound](#_chapter_7_quality_gates_that_compound){.cross-reference}** for quality gates that automate prevention

- **[Chapter 9: Context Engineering Deep Dive](#_chapter_9_context_engineering_deep_dive){.cross-reference}** for context engineering principles that improve AI output

- **[Chapter 10: The RALPH Loop](#_chapter_10_the_ralph_loop){.cross-reference}** for error recovery in long-running agent workflows

- **[Chapter 15: Model Strategy & Cost Optimization](#_chapter_15_model_strategy_and_cost_optimization){.cross-reference}** for cost optimization and budget protection strategies
