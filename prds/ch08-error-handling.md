# Chapter 8: Error Handling & Debugging

> Build systematic approaches to diagnosing, fixing, and preventing errors in AI-assisted development.

---

## Overview

Errors are inevitable, but repeated errors are a choice. This chapter consolidates debugging patterns scattered across your workflow into a systematic approach. You'll learn the five-point error diagnostic framework, how to build persistent error memory with ERRORS.md, systematic flaky test diagnosis, and the clean slate recovery pattern for when things go sideways.

---

## Learning Objectives

By the end of this chapter, you will be able to:

1. Systematically diagnose errors using the five-point framework
2. Create and maintain an ERRORS.md file for persistent error memory
3. Diagnose and fix flaky tests using automated detection scripts
4. Apply clean slate trajectory recovery when stuck
5. Build learning loops that encode problems into prevention

---

## Source Articles

### Primary Sources
- `five-point-error-diagnostic-framework.md` - Systematic error categorization
- `context-debugging-framework.md` - Layer-by-layer debugging approach
- `error-messages-as-training.md` - ERRORS.md for persistent memory
- `flaky-test-diagnosis-script.md` - Automated flaky test detection (EXPANDED Jan 27)
- `clean-slate-trajectory-recovery.md` - Recovery from stuck states
- `learning-loops-encoding-problems-into-prevention.md` - Prevention protocols
- `test-based-regression-patching.md` - Test-first bug fixing

### Supplementary Sources (Added from KB Analysis Jan 27-28, 2026)
- `ai-cost-protection-timeouts.md` - Multi-layer timeout protection (job/request/input/budget levels)
- `agent-reliability-chasm.md` - The 95% per-action reliability compounding problem
- `checkpoint-commit-patterns.md` - Git as external memory for error recovery
- `orchestration-patterns.md` - Retry patterns with exponential backoff
- `tool-call-validation.md` - Validating tool outputs before acting
- `event-sourcing-agents.md` - Error recovery through event replay
- `human-in-the-loop-patterns.md` - Escalation patterns when agents fail

### Cross-Referenced Patterns
- `12-factor-agents.md` - Factor 9 (Compact Errors), Factor 10 (Small Agents)
- `prevention-protocol.md` - Systematic prevention after bug fixes
- `stateless-verification-loops.md` - Fresh state for reliable verification

---

## Detailed Outline

### 8.1 The Five-Point Error Diagnostic Framework
- Point 1: Reproduce (isolate the failure)
- Point 2: Locate (find the root cause)
- Point 3: Categorize (type error, logic error, integration error, etc.)
- Point 4: Fix (apply the minimal change)
- Point 5: Prevent (add test, lint rule, or documentation)
- **Exercise**: Apply the framework to a real bug

### 8.2 Context Debugging Framework
- Layer 1: Immediate context (current file)
- Layer 2: Project context (CLAUDE.md, patterns)
- Layer 3: Model context (capabilities, limitations)
- Layer 4: System context (environment, dependencies)
- When to debug vs when to start fresh
- **Example**: Debugging a context pollution issue

### 8.3 Error Messages as Training Data (ERRORS.md)
- Why LLMs repeat the same mistakes
- Structure of an effective ERRORS.md entry
- Tracking frequency and severity
- Including errors in context for similar tasks
- Monthly review and prevention implementation
- **Exercise**: Create your project's ERRORS.md

### 8.4 Flaky Test Diagnosis
- What makes tests flaky (race conditions, timing, external deps)
- Automated detection script (run N times, track patterns)
- Categorizing flaky tests by root cause
- Systematic fixes for common flaky patterns
- CI integration for flaky test monitoring
- **Example**: Diagnosing a timing-dependent test

### 8.5 Clean Slate Trajectory Recovery
- When you're stuck: recognizing the signs
- The clean slate pattern: start fresh with constraints
- Preserving learnings from failed attempts
- Using git stash/worktrees for recovery
- When to abandon vs when to persist
- **Pattern**: The "fresh eyes" protocol

### 8.6 Circuit Breakers and Reliability Patterns (NEW)
- The agent reliability chasm: 95% per-action compounds to 36% at 20 actions
- Multi-layer timeout protection (job, request, input, budget)
- Retry patterns with exponential backoff
- When to stop vs when to retry (consecutive failure thresholds)
- Cost protection: budget caps and alerts
- **Pattern**: The three-failure circuit breaker

### 8.7 Learning Loops: Encoding Prevention
- The prevention protocol pattern
- Converting errors to lint rules
- Converting errors to type guards
- Converting errors to CI checks
- Measuring prevention effectiveness
- **Exercise**: Create a prevention protocol for a recurring error

### 8.8 Recovery Patterns for Long-Running Agents (NEW)
- Checkpoint commit patterns: git as external memory
- Event sourcing for agent state recovery
- Human escalation: when to ask for help
- The four-turn reliability framework: Understand, Decide, Execute, Verify
- **Example**: RALPH loop recovery with fresh context

---

## Key Examples

### Example 1: Five-Point Diagnostic with Agent SDK
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929',
  tools: [
    { name: 'read_file', /* ... */ },
    { name: 'run_test', /* ... */ },
    { name: 'git_diff', /* ... */ }
  ]
})

const diagnosticPrompt = `
Apply the five-point error diagnostic framework to this failing test:

Test: user-service.test.ts:47
Error: Expected 'admin' but received undefined

Steps:
1. REPRODUCE: Run the test in isolation
2. LOCATE: Read the test and trace to root cause
3. CATEGORIZE: Is this a type error, logic error, or integration error?
4. FIX: Propose minimal fix
5. PREVENT: Suggest lint rule, type guard, or test improvement

Show your work at each step.
`

await session.send(diagnosticPrompt)
```

### Example 2: ERRORS.md Structure
```markdown
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
const user = getUserById(id);
console.log(user.email); // undefined!
```

**Correct Fix**:
```typescript
const user = await getUserById(id);
console.log(user.email); // Works
```

**Prevention Strategy**:
1. Enable @typescript-eslint/no-floating-promises
2. Add pre-commit hook to catch floating promises
3. Include this example when working with async code

---
```

### Example 3: Flaky Test Detection Script
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// Automated flaky test detection
async function diagnoseFlakyTest(testPath: string, iterations = 50) {
  const results: boolean[] = []

  for (let i = 0; i < iterations; i++) {
    const passed = await runTest(testPath)
    results.push(passed)
  }

  const passRate = results.filter(r => r).length / iterations
  const isFlaky = passRate > 0 && passRate < 1

  if (isFlaky) {
    // Use Agent SDK to diagnose
    await using session = unstable_v2_createSession({
      model: 'claude-sonnet-4-5-20250929'
    })

    await session.send(`
      Test ${testPath} is flaky with ${passRate * 100}% pass rate.

      Common flaky test causes:
      1. Race conditions (async timing)
      2. Test order dependencies
      3. External service calls
      4. Date/time dependencies
      5. Random data without seeds

      Read the test file and diagnose the likely cause.
    `)
  }

  return { passRate, isFlaky }
}
```

### Example 4: Clean Slate Recovery
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// When stuck, start fresh with constraints from failed attempt
async function cleanSlateRecovery(failedAttempt: string) {
  // Extract learnings from failed attempt
  await using session = unstable_v2_createSession({
    model: 'claude-sonnet-4-5-20250929'
  })

  const constraintsFromFailure = await session.send(`
    Analyze this failed implementation attempt:

    ${failedAttempt}

    Extract:
    1. What approaches definitely don't work
    2. What constraints we discovered
    3. What the actual requirements turned out to be

    Output as a constraints list for a fresh attempt.
  `)

  // Start fresh with constraints
  await using freshSession = unstable_v2_createSession({
    model: 'claude-sonnet-4-5-20250929'
  })

  await freshSession.send(`
    Implement the feature with a fresh approach.

    CONSTRAINTS FROM PREVIOUS ATTEMPT:
    ${constraintsFromFailure}

    Do NOT repeat the approaches that failed.
    Start from first principles with these constraints in mind.
  `)
}
```

### Example 5: Circuit Breaker Pattern (NEW)
```typescript
interface CircuitBreakerConfig {
  maxFailures: number      // Failures before opening circuit
  resetTimeMs: number      // Time before trying again
  halfOpenMax: number      // Max requests in half-open state
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  maxFailures: 3,
  resetTimeMs: 30000,      // 30 seconds
  halfOpenMax: 1
}

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failures = 0
  private lastFailureTime = 0
  private halfOpenAttempts = 0

  constructor(private config = DEFAULT_CONFIG) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeMs) {
        this.state = 'half-open'
        this.halfOpenAttempts = 0
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    if (this.state === 'half-open' && this.halfOpenAttempts >= this.config.halfOpenMax) {
      throw new Error('Circuit breaker half-open limit reached')
    }

    try {
      if (this.state === 'half-open') this.halfOpenAttempts++
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
    if (this.failures >= this.config.maxFailures) {
      this.state = 'open'
    }
  }
}

// Usage with Agent SDK
const breaker = new CircuitBreaker({ maxFailures: 3 })

async function reliableAgentCall(prompt: string) {
  return breaker.execute(async () => {
    await using session = unstable_v2_createSession({
      model: 'claude-sonnet-4-5-20250929'
    })
    return session.send(prompt)
  })
}
```

### Example 6: Multi-Layer Timeout Protection (NEW)
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

interface TimeoutConfig {
  taskTimeoutMs: number     // Overall task timeout
  requestTimeoutMs: number  // Per-request timeout
  maxRetries: number        // Max retries per request
  backoffMs: number         // Initial backoff delay
}

const TIMEOUT_CONFIG: TimeoutConfig = {
  taskTimeoutMs: 300000,    // 5 minutes
  requestTimeoutMs: 60000,  // 1 minute
  maxRetries: 3,
  backoffMs: 1000           // 1 second initial
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await withTimeout(
        operation(),
        config.requestTimeoutMs,
        `Request timeout after ${config.requestTimeoutMs}ms`
      )
    } catch (error) {
      lastError = error as Error
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`)

      if (attempt < config.maxRetries - 1) {
        const backoff = config.backoffMs * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, backoff))
      }
    }
  }

  throw lastError!
}

// Protected agent operation
async function protectedAgentTask(task: string) {
  return withTimeout(
    withRetry(async () => {
      await using session = unstable_v2_createSession({
        model: 'claude-sonnet-4-5-20250929'
      })
      return session.send(task)
    }, TIMEOUT_CONFIG),
    TIMEOUT_CONFIG.taskTimeoutMs,
    `Task timeout after ${TIMEOUT_CONFIG.taskTimeoutMs}ms`
  )
}
```

---

## Diagrams Needed

1. **Five-Point Diagnostic Flowchart**
   - Visual showing the 5 steps in sequence
   - Decision points at each step

2. **Context Debugging Layers**
   - Concentric circles showing the 4 layers
   - What to check at each layer

3. **ERRORS.md Workflow**
   - Document → Include → Track → Prevent cycle
   - Monthly review process

4. **Flaky Test Decision Tree**
   - Categorization by root cause
   - Fix strategies for each category

5. **Clean Slate Recovery Pattern**
   - When to use it (decision points)
   - The recovery process flow

6. **Agent Reliability Compounding** (NEW)
   - Table showing 95% per-action reliability degrading over multiple steps
   - Visual: 20 actions = 36% success rate

7. **Multi-Layer Timeout Protection** (NEW)
   - Nested circles: Job → Step → Request → Budget
   - Each layer with specific timeout values

8. **Circuit Breaker State Machine** (NEW)
   - States: Closed → Open → Half-Open
   - Transitions based on failure counts

---

## Exercises

### Exercise 1: Create Your ERRORS.md
Set up error tracking for your project:
- [ ] Create ERRORS.md with template
- [ ] Document 3 recent errors you've encountered
- [ ] Include frequency and severity for each
- [ ] Add prevention strategies

### Exercise 2: Flaky Test Audit
Identify flaky tests in your codebase:
- [ ] Run each test 10 times
- [ ] Document any that fail intermittently
- [ ] Categorize by root cause
- [ ] Fix at least one

### Exercise 3: Clean Slate Practice
Practice the recovery pattern:
- [ ] Take a stuck implementation
- [ ] Extract constraints from the failure
- [ ] Start fresh with constraints
- [ ] Compare results

---

## Cross-References

- **Builds on**: Chapter 5 (12-Factor Agent - Factor 9 Compact Errors), Chapter 6 (Verification Ladder), Chapter 7 (Quality Gates)
- **Leads to**: Chapter 9 (Context Engineering) - debugging is context manipulation
- **Related**: Chapter 10 (RALPH Loop) - error recovery in long-running agents, circuit breakers
- **Related**: Chapter 15 (Model Strategy) - cost protection, budget caps

---

## Word Count Target

3,500 - 4,500 words (expanded for new sections)

---

## Status

**Status**: Draft (Expanded Jan 28, 2026)

**Milestones**:
- [x] PRD complete (Original)
- [x] PRD expanded (Jan 28, 2026 - Added circuit breakers, reliability patterns, recovery patterns from KB)
- [ ] First draft (needs update for new sections 8.6-8.8)
- [ ] Code examples written (needs circuit breaker, timeout protection examples)
- [ ] Code examples tested
- [ ] Reviewed
- [ ] Diagrams complete (needs 3 new diagrams: reliability compounding, timeout layers, circuit breaker)
- [ ] Exercises validated
- [ ] Final

**Jan 28 KB Analysis Update**:
Added 7 new source articles from knowledge base, 3 new outline sections (8.6 Circuit Breakers, 8.7 Learning Loops, 8.8 Recovery Patterns), 3 new diagrams needed, 2 new code examples. Word count target increased to 3,500-4,500.
