# Chapter 12: Development Workflows {#ch12-development-workflows}

Individual techniques are powerful, but workflows tie them together. This chapter covers the practical patterns that professional AI-assisted developers use daily: plan mode for strategic thinking, git worktrees for parallel development, incremental development patterns, automation scripts, and specialized tools like Playwright and AST-grep. These workflows compound your productivity by reducing friction and eliminating repetitive cognitive overhead.

## Plan Mode: Think Before You Implement

When you ask Claude Code to implement a feature, it often jumps straight to writing code without pausing to think through architectural complexity, dependencies, edge cases, or trade-offs. This "code-first" approach leads to incomplete solutions, architectural violations, and implementation-then-refactor cycles.

Plan Mode changes this dynamic. Activated with Shift+Tab, Plan Mode enables strategic thinking before execution. In this mode, Claude explores the problem space, analyzes the codebase architecture, proposes multiple approaches, identifies dependencies and risks, and validates the plan with you. No code gets written until you approve.

### The Two-Phase Pattern

```
Phase 1: PLAN MODE (Strategic Thinking)
├─ Understand requirements
├─ Analyze architecture
├─ Identify dependencies
├─ Propose approaches
├─ Validate with human
└─ Exit plan mode

Phase 2: EXECUTION MODE (Implementation)
├─ Follow the plan
├─ Write code
├─ Run tests
├─ Fix issues
└─ Done
```

### When to Use Plan Mode

Use Plan Mode for architecture planning (adding new layers, introducing patterns, refactoring from one pattern to another), feature planning (complex features with many moving parts, third-party integrations, new user flows), and migration planning (technology changes, major dependency upgrades, database schema changes).

Skip Plan Mode for simple changes: bug fixes, typo corrections, documentation updates, adding a single function, or formatting changes. The overhead is not worth it for trivial work.

### Effective Plan Mode Prompts

Vague prompts produce vague plans. Be specific:

```markdown
**Bad**: "Plan how to add authentication"

**Good**: "Plan how to add JSON Web Token (JWT) based authentication:
- Where does it fit in our layered architecture?
- What middleware is needed?
- How to handle token refresh?
- Impact on existing API endpoints?
- Testing strategy?"
```

When Claude provides a plan, review it carefully before exiting. Ask clarifying questions. Request alternatives if needed. Validate against your CLAUDE.md patterns. Check for missed dependencies. Ensure tests are included. Only then exit to execution mode.

### Iterating on Plans

You can refine plans without leaving Plan Mode:

```
You: "Plan adding authentication"
Claude: [Provides plan with JWT]

You: "What if we used sessions instead of JWT?"
Claude: [Provides alternative plan]

You: "Compare both approaches - pros/cons"
Claude: [Provides comparison]

You: "Let's go with sessions. Refine the plan."
Claude: [Provides detailed session-based plan]

You: "Perfect. Exit plan mode and implement this."
Claude: [Exits plan mode → Starts implementation]
```

Ten minutes of planning saves hours of refactoring. The pattern works because strategic thinking upfront eliminates the most expensive kind of rework: architectural mismatches discovered late in development.

## Git Worktrees for Parallel Development

In traditional Git workflows, you can only work on one feature at a time in a single repository clone. Switching between features requires stashing changes, checking out branches, and losing context. With AI agents, this limitation becomes a bottleneck. You cannot run multiple autonomous sessions simultaneously without complex workarounds.

Git worktrees solve this by creating multiple working directories from the same repository, each with its own checked-out branch.

### How Worktrees Work

Think of worktrees as parallel universes for your codebase:

```
my-project/                    ← Main worktree (main branch)
├── .git/                      ← Shared repository
├── src/
└── package.json

../feature-auth/               ← Worktree 1 (feature/auth branch)
├── .git  (linked to main)     ← Points to shared repo
├── src/
└── package.json

../feature-api/                ← Worktree 2 (feature/api branch)
├── .git  (linked to main)     ← Points to shared repo
├── src/
└── package.json
```

All worktrees share the same Git repository (commits, branches, history) but have separate working directories (files, changes, state). There are no merge conflicts between worktrees during development because each has its own working tree.

### Creating and Using Worktrees

```bash
# From your main repository {#ch12-development-workflows}
cd ~/projects/my-app

# Create worktrees for different features {#ch12-development-workflows}
git worktree add ../my-app-auth feature/authentication
git worktree add ../my-app-api feature/api-endpoints
git worktree add ../my-app-ui feature/ui-redesign

# Verify worktrees {#ch12-development-workflows}
git worktree list
```

Now launch Claude Code in each worktree:

```bash
# Terminal 1: Authentication {#ch12-development-workflows}
cd ~/projects/my-app-auth
claude
# Prompt: "Implement JWT-based authentication with refresh tokens" {#ch12-development-workflows}

# Terminal 2: API endpoints {#ch12-development-workflows}
cd ~/projects/my-app-api
claude
# Prompt: "Create Representational State Transfer (REST) API endpoints for user Create, Read, Update, Delete (CRUD) operations" {#ch12-development-workflows}

# Terminal 3: UI redesign {#ch12-development-workflows}
cd ~/projects/my-app-ui
claude
# Prompt: "Redesign login page with new branding guidelines" {#ch12-development-workflows}
```

All three agents work simultaneously without interference.

### Symlinked Configurations

When using multiple AI coding tools across worktrees, maintain a single source of truth for configuration:

```bash
# Symlink shared configs to each worktree {#ch12-development-workflows}
for worktree in ../my-app-auth ../my-app-api ../my-app-ui; do
  ln -sf $(pwd)/CLAUDE.md $worktree/CLAUDE.md
  ln -sf $(pwd)/.claude $worktree/.claude
done
```

Updates to the master configuration immediately propagate to all worktrees.

### Parallel Development Metrics

The throughput improvement is substantial:

```
Sequential execution (traditional workflow):
Feature A: 2 hours + Feature B: 1.5 hours + Feature C: 1 hour
Total time: 4.5 hours

Parallel execution (with worktrees):
Total time: max(2h, 1.5h, 1h) = 2 hours
Speedup: 2.25x faster
```

Beyond raw speed, worktrees enable risk-free experimentation. Try three different caching strategies in parallel, keep the best one, delete the rest. No cleanup needed in the main codebase.

## Incremental Development Pattern

Large feature requests to AI coding agents lead to errors buried in 1000+ lines of generated code. Breaking work into smallest possible increments reduces error rates by 90% through context accumulation, immediate error isolation, and validation loops after each step.

### The Problem with Large Requests

When you ask "Build a complete authentication system with JWT tokens, password hashing, login/logout endpoints, password reset flow with email verification, session refresh tokens, rate limiting on auth endpoints, and an admin dashboard for user management," the AI generates 1,247 lines of code across 12 files. Something breaks. Now you hunt through 1,247 lines trying to find where.

Each piece of generated code has a small probability of containing an error. When you generate 1000+ lines at once, these probabilities multiply:

```
Probability of error per 100 lines: ~10%
Probability of error in 1000 lines: 1 - (0.9)^10 = 65%
```

Two-thirds chance something is wrong, somewhere.

### The Incremental Pattern

Instead of asking for everything at once, break the feature into the smallest possible increments:

```
for each increment:
  1. Request the smallest useful piece
  2. Run the code immediately
  3. Validate behavior matches expectations
  4. Fix any issues before proceeding
  5. Use working code as context for next increment
```

### Authentication System: Incremental Approach

Instead of one massive request, proceed step by step:

**Increment 1: Basic User Model**
```typescript
// Request: "Create User interface with id, email, passwordHash fields"

interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```
Validate: Types compile, exports correctly. Proceed.

**Increment 2: Password Hashing**
```typescript
// Request: "Add hashPassword and verifyPassword functions using bcrypt"

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```
Validate: Quick test confirms hashing works. Proceed.

**Increment 3: User Repository Interface**
```typescript
// Request: "Create UserRepository interface with findByEmail and create methods"

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(email: string, passwordHash: string): Promise<User>;
}
```
Validate: Interface compiles. Proceed.

Continue with repository implementation, authentication service, JWT tokens, login endpoint. Each increment is 20-50 lines. Each is validated before proceeding. Errors are caught immediately with only a small scope to debug.

### Why Incrementality Works

**Context accumulation**: Each increment adds to the AI's understanding. By increment 5, it has seen working examples of your User model, password hashing, repository pattern, and service layer. It generates consistent code because it has concrete examples of what works.

**Error isolation**: Problems are caught immediately. If increment 4 breaks, you only have 30 lines to debug, not 1,247.

**Validation loops**: Each increment has a tight feedback loop. Generate, run, validate, fix if needed. You never move forward with broken code.

**Confidence building**: Successful increments create psychological momentum. Each success builds confidence for both human and AI.

## Ad-Hoc to Deterministic Scripts

If you run the same agent flow repeatedly, convert it to a script. Deterministic beats probabilistic for known workflows.

### The Conversion Signal

Watch for patterns in your prompts:
- "Run the tests, fix any failures, then lint"
- "Deploy to staging, run smoke tests, notify Slack"
- "Pull latest, rebase, run tests, push"

If you have typed it (or similar) three or more times, it is a candidate for scripting.

### Why Convert?

| Ad-hoc Agent Flow | Deterministic Script |
|-------------------|---------------------|
| Variable latency (Large Language Model thinking) | Fast, predictable execution |
| Probabilistic (might do it differently) | Same behavior every time |
| Token cost per run | Zero LLM cost |
| Can deviate or get confused | Follows exact steps |
| Good for exploration | Good for repetition |

### The Conversion Process

**Step 1: Document the steps**

```markdown
## Deploy to Staging Flow

1. Run `bun test`
2. If tests pass, run `bun build`
3. Run `gcloud run deploy staging --source .`
4. Run smoke test: `curl https://staging.example.com/health`
5. If healthy, post to Slack
```

**Step 2: Convert to script**

```bash
#!/bin/bash
# scripts/deploy-staging.sh {#ch12-development-workflows}

set -e

echo "Running tests..."
bun test

echo "Building..."
bun build

echo "Deploying to staging..."
gcloud run deploy staging --source . --quiet

echo "Running smoke test..."
if curl -sf https://staging.example.com/health > /dev/null; then
    echo "✓ Staging healthy"
    curl -X POST "$SLACK_WEBHOOK" -d '{"text":"Staging deployed successfully"}'
else
    echo "✗ Staging health check failed"
    exit 1
fi
```

**Step 3: Make it a slash command**

```markdown
# .claude/commands/deploy-staging.md {#ch12-development-workflows}
Run the staging deployment script:

```bash
./scripts/deploy-staging.sh
```

Report the outcome.
```

Now instead of explaining the flow, you type `/deploy-staging`.

### The Latency Argument

```
Ad-hoc flow: 45 seconds (LLM reasoning + execution)
Script: 3 seconds (just execution)
```

Over 10 runs:
- Ad-hoc: 7.5 minutes
- Script: 30 seconds

The savings compound. Plus, scripts do not burn tokens.

### The Hybrid Approach

Some flows need both determinism and judgment:

```bash
#!/bin/bash
# scripts/diagnose.sh {#ch12-development-workflows}

# Deterministic: gather data {#ch12-development-workflows}
echo "Gathering diagnostics..."
bun test 2>&1 > test-output.txt
bun run typecheck 2>&1 > type-output.txt
biome check src/ 2>&1 > lint-output.txt

# Deterministic: summarize {#ch12-development-workflows}
echo "=== Summary ==="
echo "Test failures: $(grep -c FAIL test-output.txt || echo 0)"
echo "Type errors: $(grep -c error type-output.txt || echo 0)"
echo "Lint issues: $(grep -c '✖' lint-output.txt || echo 0)"

# Output for agent to analyze {#ch12-development-workflows}
cat test-output.txt type-output.txt lint-output.txt
```

Deterministic data gathering (fast, reliable) combined with agent judgment on what to fix (intelligent). Best of both worlds.

## Playwright Script Loop

Using Playwright via Model Context Protocol (MCP) tool calls for validation creates slow feedback loops. Each tool call requires API round-trips. For a 10-step validation flow, MCP might take 2-3 minutes. A direct script runs in 10-20 seconds. This 10x slowdown kills development velocity.

### The Pattern

Generate Playwright validation scripts as executable code artifacts instead of using MCP tool calls:

1. Generate code (implementation)
2. Write Playwright validation script (as code artifact)
3. Run script (execute locally)
4. Analyze failures (all at once)
5. Fix issues (batch fixes)
6. Loop until all validations pass

### Speed Comparison

**Using Playwright MCP** (10 steps):
```
Total time: 2-3 minutes
Issues found: 1 at a time
```

**Using Playwright Script**:
```typescript
// validate-login.ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="submit"]');
  await page.waitForURL('/dashboard');
});
```

```bash
$ npx playwright test validate-login.ts
Running 1 test...
✓ login flow (12s)

Total time: 12 seconds
Issues found: All at once
```

### Why Scripts Are Superior

Scripts find all failures at once while MCP finds them one by one. Scripts run locally with minimal overhead. Scripts become part of the test suite. Scripts can be run in Continuous Integration (CI) automatically. Scripts are debuggable with breakpoints and trace viewers.

### The Iteration Loop

```bash
# Iteration 1: Generate and run {#ch12-development-workflows}
$ npx playwright test tests/validation/login-flow.spec.ts

❌ 3 failed: Email input not found, Password input not found, Submit button not found

# Iteration 2: Add data-testid attributes, run again {#ch12-development-workflows}
$ npx playwright test tests/validation/login-flow.spec.ts

❌ 1 failed: Expected redirect to /dashboard, got /login

# Iteration 3: Fix redirect logic, run again {#ch12-development-workflows}
$ npx playwright test tests/validation/login-flow.spec.ts

✓ 3 passed
```

Three iterations in 36 seconds plus fix time. Compare to MCP: 9+ minutes for the same validation.

## AST-Grep for Precision Transformations

Abstract Syntax Tree (AST) grep tools parse code as structured syntax rather than plain text. Traditional text-based search tools like grep treat code as plain text, not structured syntax. They cannot distinguish code from comments, strings from identifiers, function calls from definitions, or similar names from exact matches. This produces false positives that waste time and risk errors.

### The Problem with Text Search

```bash
$ grep -r "fetchUserData" .

./src/api/users.ts:  const userData = await fetchUserData(userId);
./src/api/users.ts:  // TODO: fetchUserData should handle errors better
./src/api/users.ts:  console.log("Calling fetchUserData");
./README.md:The `fetchUserData` function retrieves user data from the API.
./tests/mocks.ts:  fetchUserData: jest.fn(),
```

Only 1 of 5 matches is the actual function call you are looking for.

### AST-Based Search

AST-grep parses code into an Abstract Syntax Tree and searches for structural patterns:

```bash
# Find all calls to fetchUserData (not comments, strings, or definitions) {#ch12-development-workflows}
ast-grep --pattern 'fetchUserData($$$)'
```

This matches only function calls, ignoring everything else.

### Pattern Syntax

**Single metavariable (`$VAR`)**: Matches a single AST node
**Ellipsis (`$$$`)**: Matches zero or more nodes

```bash
# Find all async function definitions {#ch12-development-workflows}
ast-grep --pattern 'async function $NAME($$$) { $$$ }'

# Find all destructured useState calls {#ch12-development-workflows}
ast-grep --pattern 'const [$STATE, $SETTER] = useState($$$)'

# Find all try-catch blocks {#ch12-development-workflows}
ast-grep --pattern 'try { $$$ } catch ($ERR) { $$$ }'
```

### Refactoring with AST-Grep

Rename a function everywhere it is called (not in comments or docs):

```bash
# Find all function calls {#ch12-development-workflows}
ast-grep --pattern 'fetchUserData($$$)' --json

# Rewrite all matches {#ch12-development-workflows}
ast-grep --pattern 'fetchUserData($$$)' \
  --rewrite 'getUserData($$$)' \
  --update-all
```

Only actual function calls are renamed. Comments, strings, and documentation are untouched.

### When to Use Each Tool

- **grep/ripgrep**: Quick, fuzzy searches; searching strings and comments; exploration
- **ast-grep**: Precise code structure queries; refactoring; AI context retrieval

The best approach: Start with grep for exploration, refine with ast-grep for precision.

## Skills System Deep Dive

Claude Code skills are reusable capabilities that extend the agent's functionality. They range from simple command shortcuts to complex multi-step workflows.

### Built-in Skills

Claude Code ships with skills like `/commit` (create git commits), `/pr` (create pull requests), and `/review` (review code changes). These encode best practices and save typing.

### Creating Custom Skills

Custom skills live in `.claude/commands/`:

```markdown
# .claude/commands/feature-branch.md {#ch12-development-workflows}
Create a new feature branch for the given description:

1. Generate a slug from the description
2. Create branch: `git checkout -b feature/$SLUG`
3. Push with upstream: `git push -u origin feature/$SLUG`
4. Report the branch name

Feature description: $ARGUMENTS
```

Usage: `/feature-branch User authentication with OAuth`

### Skills vs Sub-Agents

Skills are stateless, single-purpose commands. Sub-agents (covered in Chapter 11) are specialized agents with their own context, tools, and state. Use skills for repeatable workflows that need no persistence. Use sub-agents for complex, multi-turn tasks requiring specialized expertise.

### Skill Composition

Skills can invoke other skills or scripts:

```markdown
# .claude/commands/ship-feature.md {#ch12-development-workflows}
Complete sequence to ship the current feature:

1. Run `/test` to verify tests pass
2. Run `/lint` to check code quality
3. Run `/commit` to create a commit
4. Run `/pr` to create pull request

If any step fails, stop and report the failure.
```

This composes multiple capabilities into a single workflow.

## Exercises

### Exercise 1: Plan Mode Practice

For a feature in your backlog:

1. Enter Plan Mode (Shift+Tab) and create a detailed plan
2. Ask at least three clarifying questions about the plan
3. Request one alternative approach and compare trade-offs
4. Refine the plan based on your review
5. Exit Plan Mode and implement using the plan as your guide

Track how many implementation iterations you need. Compare to your typical iteration count without planning.

### Exercise 2: Parallel Development Setup

Configure worktrees for parallel AI development:

1. Create a new project or use an existing one
2. Set up 2-3 worktrees for different features or experiments
3. Symlink your CLAUDE.md and .claude directory to each worktree
4. Launch Claude Code sessions in parallel
5. Work on different aspects simultaneously
6. Merge the completed work back to main

Measure the wall-clock time compared to sequential development.

### Exercise 3: Script Capture

Convert an ad-hoc workflow to a deterministic script:

1. Identify a task you do repeatedly with Claude Code (at least 3 times)
2. Document the exact steps the agent performs
3. Write a bash or TypeScript script that performs the same steps
4. Create a slash command wrapper in `.claude/commands/`
5. Test the script to ensure reliable behavior
6. Compare execution time: ad-hoc flow vs script

## Summary

Development workflows compound your productivity by eliminating repetitive cognitive overhead:

- **Plan Mode** provides strategic thinking before execution, reducing refactoring cycles
- **Git worktrees** enable parallel development with multiple AI agents simultaneously
- **Incremental development** reduces error rates by 90% through small, validated steps
- **Deterministic scripts** replace ad-hoc flows, saving time and tokens
- **Playwright scripts** provide 10x faster validation than MCP tool calls
- **AST-grep** enables precision code transformations without false positives
- **Skills** extend Claude Code with reusable, composable capabilities

These workflows do not exist in isolation. Plan Mode informs your worktree setup. Incremental development guides your script structure. Playwright validation confirms your AST-grep transformations. Each technique reinforces the others.

The key insight: workflows are force multipliers. A 10% improvement in each workflow compounds across your entire development process. Master these patterns and watch your velocity accelerate.

---

*Related chapters:*

- **[Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md)** for long-running agent automation built on workflows
- **[Chapter 11: Sub-Agent Architecture](ch11-sub-agent-architecture.md)** for skills evolving into specialized sub-agents
- **[Chapter 13: Building the Harness](ch13-building-the-harness.md)** for codifying workflows into production infrastructure
- **[Chapter 4: Writing Your First CLAUDE.md](ch04-writing-your-first-claude-md.md)** for project instructions that workflows reference
