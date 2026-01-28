# Chapter 6: The Verification Ladder {#ch06-the-verification-ladder}

AI generates code that compiles and runs. It also generates code that's wrong. The syntax is perfect. The logic is broken. A password validator passes "12345678" but crashes on emoji. An API endpoint returns the right data in tests but fails on unicode input. The types check. The behavior doesn't.

This is the verification problem. And solving it requires thinking in layers.

## The Ladder Framework

Verification isn't a single check. It's a hierarchy where each level catches what lower levels miss.

```
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 6: Formal Verification (TLA+, Z3)                    │
│  "Prove it's impossible to violate"                         │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 5: Property-Based Testing (fast-check, Hypothesis)   │
│  "Test with thousands of generated inputs"                  │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 4: Integration Tests                                 │
│  "Test components working together"                         │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 3: Unit Tests                                        │
│  "Test individual functions"                                │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: Runtime Validation (Zod, io-ts)                   │
│  "Validate data at boundaries"                              │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 1: Static Types (TypeScript, mypy)                   │
│  "Catch errors at compile time"                             │
└─────────────────────────────────────────────────────────────┘
```

The tools mentioned here: Temporal Logic of Actions Plus (TLA+) and Z3 are specification languages for formal proofs. fast-check (JavaScript) and Hypothesis (Python) are property-based testing frameworks. Zod and io-ts are TypeScript runtime validation libraries. mypy is Python's static type checker.

The question isn't "which level?" but "how high do you need to climb for this code?"

## Level 1: Static Types

Static types catch errors before your code runs. They verify shape, not behavior.

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

function processUser(user: User): void {
  console.log(user.name.toUpperCase());
}

processUser({ id: "1" });           // ✗ Error: Property 'name' is missing
processUser(null);                   // ✗ Error: Argument cannot be null
processUser({ id: 1, name: "Kim" }); // ✗ Error: id should be string
```

**What types catch:** Missing properties. Null errors. Wrong argument types. Return type mismatches.

**What types miss:** Runtime values. Business logic violations. Dynamic constraints.

**When to use:** Always. The cost is near-zero.

Types are your first line of defense. They eliminate entire categories of bugs before your code runs. But they can't tell you if your authentication logic is correct or if your discount calculation returns the right percentage.

## Level 2: Runtime Validation

External data is always untrusted. User input, API payloads, database results, webhook events. Types can't validate what you receive at runtime.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['admin', 'user', 'guest']),
});

// At your API boundary
app.post('/users', (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  // result.data is now typed AND validated
  createUser(result.data);
});
```

**What runtime validation catches:** Malformed input. Invalid email formats. Out-of-range numbers. Unexpected enum values. Injection attempts hidden in strings.

**What it misses:** Business logic. Behavioral correctness. Whether the code does what it should.

**When to use:** Every boundary where external data enters your system.

Runtime validation transforms "trust but hope" into "trust but verify at entry." The cost is minimal. The protection is substantial.

## Level 3: Unit Tests

Unit tests verify logic in isolated functions. They answer: "Does this function do what I expect?"

```typescript
describe('calculateDiscount', () => {
  it('applies 10% discount for orders over $100', () => {
    expect(calculateDiscount(150)).toBe(15);
  });

  it('applies no discount for orders under $100', () => {
    expect(calculateDiscount(50)).toBe(0);
  });

  it('handles edge case at exactly $100', () => {
    expect(calculateDiscount(100)).toBe(10);
  });

  it('handles zero amount', () => {
    expect(calculateDiscount(0)).toBe(0);
  });
});
```

**What unit tests catch:** Logic errors in isolated functions. Wrong calculations. Incorrect conditionals. Missing error handling.

**What they miss:** Component interactions. Edge cases you didn't think of. System-wide constraints.

**Best practices:**
- Test behavior, not implementation
- One assertion per test (or related assertions)
- Descriptive names that document requirements
- Cover happy path, error cases, and boundary values

The limitation of unit tests is they only verify what you thought to check. If you didn't write a test for emoji in passwords, you won't catch that bug.

## Level 4: Integration Tests

Integration tests verify components working together. They answer: "Does this flow work end-to-end?"

```typescript
describe('User Registration Flow', () => {
  it('creates user and sends welcome email', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: 'secure123' });

    expect(response.status).toBe(201);

    // Verify user in database
    const user = await db.users.findByEmail('test@example.com');
    expect(user).toBeTruthy();
    expect(user.passwordHash).not.toBe('secure123'); // Hashed, not plaintext

    // Verify email sent
    expect(emailService.sent).toContainEqual(
      expect.objectContaining({
        to: 'test@example.com',
        template: 'welcome'
      })
    );
  });
});
```

**What integration tests catch:** Component interaction bugs. Configuration errors. Database query issues. API contract violations. Flow failures.

**What they miss:** Edge cases within components. Properties that should always hold.

**For AI-generated code:** Integration tests provide higher signal than unit tests. LLMs often struggle with mocking setups. Testing real flows against real components catches more bugs with less brittle test code.

Prefer real dependencies over mocks when possible. Use in-memory databases instead of mock repositories. Test actual API calls instead of mocked responses.

### The Integration-First Strategy for LLM Code

For AI-assisted development, integration tests provide higher signal than unit tests. This inverts the traditional test pyramid.

**Why?** LLMs rarely make isolated logic errors. They get the math right, handle basic edge cases, and use correct types. Where LLMs fail is at integration points: wrong database column names, incorrect API contracts, type mismatches across boundaries, missing side effects.

Unit tests don't catch these failures. Only integration tests do.

**The signal-to-noise comparison:**

| Test Type | Tests Needed | Lines Verified | Signal per Test |
|-----------|--------------|----------------|-----------------|
| Unit tests | 47 tests | 5-10 lines each | Low |
| Integration tests | 3 tests | 50-100 lines each | High |

Integration tests verify 10-20x more code per test. When reviewing LLM-generated code, you can check 3 integration test results in 2 minutes instead of reviewing 47 unit tests in 30 minutes.

**The inverted pyramid for LLM code:**

```
Traditional (human development):
    /\
   /E2E\       Few E2E tests
  /------\
 / Integ  \    Some integration tests
/----------\
/   Unit    \  MANY unit tests

LLM-optimized:
    /\
   /E2E\       Few E2E tests
  /------\
 /        \
/  INTEG   \   MANY integration tests
/----------\
/   Unit    \  Few unit tests (complex logic only)
```

**Practical guidance:**

For every feature, write:
1. **1-3 integration tests** that verify end-to-end behavior
2. **0-2 unit tests** for genuinely complex algorithmic logic
3. **0-1 E2E tests** for critical user journeys (optional)

**When to still use unit tests:**

Unit tests remain valuable for complex algorithms (sorting, parsing, financial calculations), security-critical functions (cryptographic operations), and property-based testing. If the logic is complex enough that isolated testing reveals bugs integration tests miss, write unit tests.

But for typical LLM-generated code, integration tests catch the bugs that matter: the integration points where components fail to work together.

## Level 5: Property-Based Testing

Property-based testing automatically discovers edge cases you didn't think of. Instead of writing individual test cases, you define properties that should always hold, and the framework generates thousands of inputs.

```typescript
import { fc, test } from '@fast-check/vitest';

// Property: serialization roundtrip
test.prop([fc.anything()])(
  'encode then decode returns original',
  (value) => {
    const serialized = serialize(value);
    const deserialized = deserialize(serialized);
    expect(deserialized).toEqual(value);
  }
);

// Property: sorting invariants
test.prop([fc.array(fc.integer())])(
  'sorted array is in order and has same elements',
  (arr) => {
    const sorted = sort(arr);

    // Same length
    expect(sorted.length).toBe(arr.length);

    // Actually sorted
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i-1]);
    }

    // Contains same elements
    expect([...sorted].sort()).toEqual([...arr].sort());
  }
);
```

**What the framework generates:**
- Empty inputs
- Very large inputs
- Unicode edge cases including emoji
- Boundary values (0, -1, MAX_INT)
- Null and undefined
- Deeply nested structures
- Adversarial inputs

**Common property patterns:**

1. **Roundtrip**: `decode(encode(x)) === x`
2. **Idempotence**: `f(f(x)) === f(x)`
3. **Invariants**: Properties that must never break
4. **Commutativity**: `f(a, b) === f(b, a)` when order shouldn't matter

**When to use:** Financial calculations, security-critical code, data transformations, algorithms.

**Test case shrinking:** When a property fails, the framework shrinks the input to find the minimal failing case. Instead of "failed with `[1, 2, 3, 7, 4, 5, 6, 9, 8]`" you get "failed with `[2, 1]`". This makes debugging much easier.

Property-based tests find the bugs that haunt production. The password validator that works for "password123" but breaks on "pass😀". The JSON parser that handles normal strings but explodes on null bytes.

## Level 6: Formal Verification

Formal verification proves properties hold for all possible inputs. Not "probably correct" but "mathematically proven correct."

```tla
---- MODULE RateLimiter ----
VARIABLES requests, window_start, count

TypeInvariant ==
  /\ requests \in Nat
  /\ count \in 0..MAX_REQUESTS

SafetyInvariant ==
  count <= MAX_REQUESTS  \* NEVER exceeded

Init ==
  /\ requests = 0
  /\ count = 0

AllowRequest ==
  /\ count < MAX_REQUESTS
  /\ count' = count + 1

THEOREM Spec => []SafetyInvariant
====
```

**When you need formal verification:**
- Distributed consensus systems
- Life-critical systems
- Security-critical protocols
- Hard constraints that can never be violated

**The cost:** Expensive to write. Requires specialized expertise. Limited to specific properties. Difficult to maintain.

For most code, levels 1-5 provide sufficient confidence. Reserve formal verification for the code where bugs mean catastrophe, not inconvenience.

## Choosing Your Level

Here's the decision framework:

| Scenario | Minimum Level |
|----------|---------------|
| Internal utility function | Level 3 (Unit tests) |
| API endpoint | Level 2 (Schema) + Level 4 (Integration) |
| Financial calculations | Level 5 (Property tests) |
| Security-critical code | Level 5 + manual audit |
| Distributed consensus | Level 6 (Formal verification) |
| Life-critical systems | Level 6 (Formal verification) |

**The key insight:** You get 80% confidence from levels 1-3 at low cost. Levels 5-6 give the last 20% but cost 5x more. Choose based on risk tolerance and cost of failure.

Don't choose one level. Layer them. Types everywhere. Schema validation at boundaries. Unit tests for logic. Integration tests for flows. Property tests for critical algorithms.

## The Verification Sandwich Pattern

When you ask Claude to add a feature and tests fail afterward, you face a question: Did Claude break something, or were those tests already failing?

Without knowing the baseline, you can't tell. This ambiguity wastes hours debugging pre-existing issues.

The verification sandwich solves this.

```
┌─────────────────────────────────────────┐
│  1. PRE-VERIFICATION (Baseline)          │
│     ├─ Run tests → All pass ✓            │
│     ├─ Run type check → Clean ✓          │
│     └─ Run linter → Clean ✓              │
├─────────────────────────────────────────┤
│  2. GENERATION                           │
│     └─ Make the code change              │
├─────────────────────────────────────────┤
│  3. POST-VERIFICATION (Delta)            │
│     ├─ Run tests → Detect failures       │
│     ├─ Run type check → Find errors      │
│     └─ Run linter → Catch issues         │
└─────────────────────────────────────────┘
```

**The key rule:** If pre-verification fails, stop immediately. Don't generate code on a broken baseline.

```bash
#!/bin/bash
# scripts/verify.sh

set -e  # Exit on first failure

echo "🔍 Running quality gates..."

echo "  ├─ Type checking..."
npm run type-check

echo "  ├─ Linting..."
npm run lint

echo "  ├─ Testing..."
npm test

echo "  └─ Building..."
npm run build

echo "✅ All quality gates passed!"
```

Run this before and after every code generation. When pre-verification passes, post-verification failures are guaranteed to be from the new code. No ambiguity. No wasted debugging.

## Test-Driven Prompting

When you ask an LLM to "implement user authentication," you're asking it to sample from a probability distribution of millions of possible implementations. Most are wrong.

When you give an LLM failing tests and ask it to "make these tests pass," you're constraining the solution space to tens of correct implementations. Most are right.

This is test-driven prompting: write tests before generating code.

```typescript
// Step 1: Write tests FIRST
describe('authenticateUser', () => {
  it('returns user object for valid credentials', async () => {
    const result = await authenticateUser('user@example.com', 'password123');
    expect(result).toMatchObject({
      id: expect.any(String),
      email: 'user@example.com',
      sessionToken: expect.any(String)
    });
  });

  it('throws InvalidCredentialsError for wrong password', async () => {
    await expect(
      authenticateUser('user@example.com', 'wrong')
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('validates email format', async () => {
    await expect(
      authenticateUser('not-an-email', 'password123')
    ).rejects.toThrow(InvalidEmailError);
  });

  it('hashes passwords with bcrypt', async () => {
    const user = await createUser('test@example.com', 'password');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});

// Step 2: Verify tests fail
// npm test → ✗ authenticateUser is not defined

// Step 3: Prompt LLM
// "Implement authenticateUser() that passes these tests"

// Step 4: Run tests after generation
// npm test → ✓ All tests pass!
```

**Why this works:** Tests are executable specifications. They reduce entropy from millions of possible implementations to tens of correct ones.

**The math:**
- Without tests: LLM chooses from ~1,000,000 implementations, ~10 correct. Success rate: 0.001%
- With 5 tests: LLM chooses from ~50 implementations, ~30 correct. Success rate: 60%

That's a 600x improvement.

**The formula:**

```
S_constrained = S ∩ T₁ ∩ T₂ ∩ ... ∩ Tₙ ≈ C

Where:
S = All syntactically valid programs
Tᵢ = Programs that pass test i
C = Set of correct programs
```

Each test filters out invalid implementations. More tests means the constrained space gets closer to the correct set.

## Trust But Verify Protocol

AI generates 100x faster than humans review. Manual code review becomes a bottleneck. The solution: ask AI to generate verification, not just code.

**Traditional approach:** AI writes code → You review 1000 lines → Hope you catch bugs

**Trust but verify:** AI writes code → AI writes verification → You review 10 lines of test output → Bugs caught automatically

```typescript
// Prompt
"Implement user authentication API endpoint.
After implementation, create a verification script that:
1. Tests all endpoints with valid/invalid data
2. Checks response codes and data
3. Verifies database state
4. Reports all results

Run the verification script and show me the output."

// AI-Generated Output
✅ User registration with valid email: PASSED
✅ User registration rejects invalid email: PASSED
✅ Duplicate email rejection: PASSED
❌ Password reset token expiration: FAILED
   Expected: Token expires after 1 hour
   Actual: Token never expires
✅ Session expiration: PASSED

// Your action: 30 seconds to spot the 1 failure
// Traditional review: 3 hours reading code
```

This reduces review burden by 99% while improving bug detection.

**Types of verification artifacts:**
- Runtime verification scripts (test endpoints, verify outputs)
- Visual verification (screenshots, UI states)
- Data verification (migration scripts, integrity checks)
- API verification (comprehensive endpoint testing)

## Building Compound Quality Gates

Individual verification levels catch individual bug types. Combined levels catch compound bugs.

**The multiplicative effect:**
- Level 1-3 catches 80% of bugs
- Level 5 catches 80% of the remaining 20%
- Combined: 80% + (80% × 20%) = 96% total catch rate

Layer your verification in CI/CD:

```yaml
# .github/workflows/verify.yml
jobs:
  level-1-types:
    run: tsc --noEmit

  level-2-schema:
    run: npm run validate-schemas

  level-3-unit:
    run: npm test -- --coverage

  level-4-integration:
    run: npm run test:integration
    needs: [level-1-types, level-2-schema]

  level-5-property:
    run: npm run test:property
    needs: [level-3-unit, level-4-integration]
```

**Key patterns:**
- Fast checks first (fail fast)
- Parallel when independent
- Skip slow checks if fast ones fail
- Same gates locally and in CI

## Common Pitfalls

**Pitfall 1: Choosing the wrong level**

Using only unit tests for security-critical code means edge cases slip to production.

**Solution:** Use the decision framework. Financial and security code gets property tests.

**Pitfall 2: Skipping pre-verification**

Generating code on a broken baseline means you can't tell new bugs from old.

**Solution:** Always verify before and after. Fix baseline issues first.

**Pitfall 3: Tests too vague or too specific**

Vague tests don't catch bugs. Over-specific tests break when implementation changes.

**Solution:** Test behavior, not implementation. Be precise about what, flexible about how.

**Pitfall 4: Not running verification**

Assuming verification works without running it is cargo cult quality.

**Solution:** Always require Claude to run verification and show output.

**Pitfall 5: Non-deterministic tests**

Flaky tests that pass sometimes and fail others create false confidence or false alarms. The impact is worse than you might think: five developers encountering three flaky tests per week, spending 15 minutes debugging each, wastes nearly 200 hours per year.

**Why flaky tests are especially harmful with AI agents:**

1. **Agents can't distinguish flaky from real failures.** They'll try to "fix" code that isn't broken.
2. **Wasted API tokens.** The agent spends cycles analyzing false positives.
3. **Context pollution.** Failed fix attempts add noise to conversation history.
4. **Lost trust.** Developers stop trusting agent test feedback.

**Common causes and fixes:**

| Category | Symptoms | Typical Fix |
|----------|----------|-------------|
| Timing | Async operations, race conditions, "timeout" in errors | Use `waitFor`/`waitForExpect`, increase timeouts, or use fake timers |
| Order-dependent | Tests depend on previous test state | Reset state in `beforeEach`, ensure test isolation |
| External service | Network calls fail with ECONNREFUSED, ETIMEDOUT | Mock with MSW or nock |
| Random data | Value assertion mismatches on re-runs | Seed random generators or use fixed fixtures |
| Date/time | Tests fail on certain days or after dates pass | Mock Date with vitest/sinon fake timers |

**Quick diagnosis approach:**

When a test flakes, run it multiple times to understand the pattern:

```bash
# Run test 10 times, count failures
for i in {1..10}; do
  npm test -- path/to/test.ts && echo PASS || echo FAIL
done | grep -c FAIL
```

If the pass rate falls between 10% and 90%, you have a flaky test. Categorize by examining error messages: "timeout" keywords indicate timing issues, "ECONNREFUSED" points to external services, and value mismatches suggest random data or order-dependent problems.

**Solution:** Fix flaky tests systematically by category. For timing issues, add explicit waits. For external services, mock them with MSW. For random data, seed your generators. Track flaky tests in a report rather than addressing them one at a time. When using AI agents, check known flaky tests before letting the agent investigate: if a test is known to flake, retry it before assuming the code is broken.

## Practical Application

Here's a complete verification stack for an API endpoint:

```typescript
// Level 1: Types
interface CreateUserRequest {
  email: string;
  password: string;
}

interface CreateUserResponse {
  id: string;
  email: string;
  createdAt: string;
}

// Level 2: Runtime validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

// Level 3: Unit tests
describe('validatePassword', () => {
  it('accepts passwords 8+ characters', () => {
    expect(validatePassword('password123')).toBe(true);
  });
  it('rejects passwords under 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
  });
});

// Level 4: Integration tests
describe('POST /api/users', () => {
  it('creates user and returns 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'secure123' });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('test@example.com');

    const user = await db.users.findByEmail('test@example.com');
    expect(user).toBeTruthy();
  });
});

// Level 5: Property tests
test.prop([
  fc.string({ minLength: 8, maxLength: 100 })
])(
  'all valid passwords are accepted',
  (password) => {
    expect(validatePassword(password)).toBe(true);
  }
);

test.prop([
  fc.string({ maxLength: 7 })
])(
  'all short passwords are rejected',
  (password) => {
    expect(validatePassword(password)).toBe(false);
  }
);
```

Each level adds confidence. Together they catch bugs that any single level would miss.

## Exercises

### Exercise 1: Layer Verification for an API Endpoint

Create a simple `POST /api/users` endpoint and verify it at levels 1-4:

1. Define TypeScript interfaces for request and response
2. Add Zod schema validation for the request body
3. Write unit tests for email validation
4. Write integration tests for the complete flow

Run all verification before and after implementing the endpoint. Compare what each level catches.

### Exercise 2: Test-Driven Prompting

Compare untested vs. test-driven code generation:

**Part A:** Ask Claude to "implement validatePassword()" with no tests. Test the result with various inputs: "password", "Pass123", "pass😀", "Pass123\0". Count how many edge cases fail.

**Part B:** Write property-based tests first, then ask Claude to implement `validatePassword()` that passes the tests. Compare first-pass success rate and edge case handling.

### Exercise 3: Verification Sandwich

1. Create a verification script that runs type-check, lint, and tests
2. Run it to establish baseline (should pass)
3. Ask Claude to add a new feature
4. Run verification again
5. Identify which failures are from the new code vs. pre-existing

Document your findings: How much debugging time did the sandwich pattern save?

## Summary

The verification ladder is your framework for building confidence in AI-generated code:

- **Level 1: Types** catch shape errors at compile time
- **Level 2: Schema** validates external data at boundaries
- **Level 3: Unit tests** verify isolated function logic
- **Level 4: Integration tests** verify component interactions
- **Level 5: Property tests** discover edge cases automatically
- **Level 6: Formal verification** proves mathematical correctness

Layer verification based on risk. Use the verification sandwich to know your baseline. Write tests before prompting to reduce entropy. Generate verification alongside code to scale review.

Each verification layer compounds with the others. Together they catch bugs that any single approach would miss. The result: code you can trust.

---

> **Companion Code**: All 3 code examples for this chapter are available at [examples/ch06/](https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book/tree/main/examples/ch06)


*Related chapters:*

- **Chapter 5: The 12-Factor Agent** for the reliability principles that verification enforces
- **Chapter 7: Quality Gates That Compound** for building verification systems that improve over time
- **Chapter 3: Prompting Fundamentals** for structuring prompts that produce testable code
