# Chapter 2: Getting Started with Claude Code {#ch02-getting-started-with-claude-code}

Claude Code is not ChatGPT in a terminal. It is an agent: a tool that reads your codebase, makes changes, runs commands, and reasons iteratively about what to do next. Understanding this distinction matters because it changes how you work.

When you use ChatGPT, you copy code into the chat, get suggestions back, and manually apply them. The conversation is isolated from your project. Claude Code operates differently. It sees your files directly, runs your tests, understands your project structure from CLAUDE.md, and takes action based on what it observes. Every tool invocation is visible. Every file change is tracked.

This represents a fundamental shift in AI-assisted development. Industry observers call it the "Wave 4" transition: from chat-based coding (Wave 3) where developers drive conversations and manually apply suggestions, to coding agents (Wave 4) that operate autonomously on multi-step tasks and only need intervention when stuck. The key skill shift is not writing code faster. It is task decomposition for agent delegation: breaking work into right-sized chunks that agents can execute independently.

This chapter teaches you to install Claude Code, run your first conversation, understand the tool ecosystem, and apply basic prompting patterns. By the end, you will know when to use Claude Code versus Cursor versus ChatGPT, and you will understand the two-mode mental model that separates beginners from productive practitioners.

## The Agent Mindset

The shift in thinking is this: instead of asking Claude Code to write code, ask it to solve a problem given context. The difference sounds subtle but produces dramatically different results.

Consider these two prompts:

**Prompt A**: "Write a function that validates email addresses."

**Prompt B**: "In src/utils/validation.ts, add an email validation function following the pattern in src/utils/string.ts. Use TypeScript, export with JSDoc comments, and include tests in tests/utils/validation.test.ts."

Prompt A produces generic code that may or may not match your project. Prompt B produces code that fits your architecture because you gave context.

Claude Code has access to your entire codebase. It can read files, search for patterns, run tests, and verify its own work. When you provide context about existing patterns, it generates code that matches them on the first try. When you leave it guessing, it produces code that requires multiple iterations to fix.

The agent mindset is: every prompt should reference what exists, specify where changes go, and define how success is measured.

## Installation and Setup

### System Requirements

Claude Code runs on macOS 11+, Linux (Ubuntu 20+), and Windows 10+ (with WSL2 (Windows Subsystem for Linux 2) or native). You need Node.js 18 or higher.

### Installation Steps

1. Download Claude Code from the official website:
   - Visit https://claude.com/download
   - Select your platform (macOS, Windows, or Linux)
   - Run the installer

2. Verify installation:
```bash
claude --version
claude --help
```

3. Navigate to your project:
```bash
cd your-project
```

4. Create a CLAUDE.md file in your project root. This file provides context about your project: what language you use, how to run tests, what patterns to follow. Claude Code reads it automatically at the start of every conversation.

### Your First CLAUDE.md

Here is a minimal starter template:

```markdown
# Project Context {#ch02-getting-started-with-claude-code}

## Quick Start
- Language: TypeScript
- Package manager: npm
- Main entry: src/index.ts

## Key Commands
- Build: npm run build
- Test: npm test
- Lint: npm run lint

## Important Patterns
- Use ES modules (import/export), not CommonJS
- Error handling uses Result<T, E> pattern
- All functions need JSDoc comments
```

This file is your first leverage investment. Five minutes of documentation saves hours of explaining context in every conversation. Claude Code references it automatically, which means your prompts can stay focused on the task instead of repeating project details.

## Your First Conversation

Claude Code supports two primary modes: single-turn queries with `claude -p` and interactive sessions with `claude`.

### Single-Turn Query

For quick questions or small tasks:

```bash
claude -p "What files exist in src/? Give me the project structure."
```

Claude Code will:
1. Read your CLAUDE.md to understand project context
2. Use the Glob tool to list files in src/
3. Return a structured response

### Interactive Session

For longer work involving multiple steps:

```bash
claude
```

This opens an interactive session where you can have a conversation. Each turn builds on previous context. Claude Code remembers what it changed and what you discussed.

### Walkthrough: Building a CLI Tool

Let me show you a real workflow. Suppose you want to create a simple CLI (Command Line Interface) tool that reads CSV files.

**Step 1: Explore the project**

```bash
claude -p "Show me the current project structure \
  and how existing CLI tools are organized."
```

Claude Code reads files, searches for patterns, and explains what it finds. You now understand where your new tool should live.

**Step 2: Request implementation**

```bash
claude -p "Create a CLI tool in \
  src/tools/csv-reader.ts that reads a CSV file \
  and prints a summary.

Context:
- Follow the pattern from src/tools/json-parser.ts
- Use the argument parsing from src/utils/args.ts
- Output format should match our other tools

Success criteria:
- Running 'npm run csv-reader data/test.csv' prints row count and column names
- Include basic error handling for missing files"
```

Claude Code searches for the patterns you mentioned, understands the existing conventions, and generates code that fits.

**Step 3: Iterate with feedback**

```bash
claude -p "The CSV reader works, but add filtering \
  by column name. Make it work with test files \
  in data/samples/ and verify with npm test."
```

Claude Code reads its previous work, understands what needs to change, makes the modifications, and runs tests to verify.

The pattern: Explore first to understand context. Implement with specific references to existing patterns. Iterate based on concrete feedback.

## The Tool Ecosystem

Claude Code has six core tools. Understanding when to use each one makes your prompts more effective.

### Read (Understand Existing Code)

Read fetches file contents so Claude Code can understand patterns, architecture, or implementation details.

```bash
claude -p "Read src/services/auth.ts and explain \
  how JWT (JSON Web Token) tokens are verified"
```

When to use: Learning existing patterns. Understanding a file before editing. Debugging issues.

### Write (Create New Files)

Write creates new files from scratch. Use it when the file does not exist.

```bash
claude -p "Create tests/payment.test.ts with comprehensive tests for payment processing"
```

When to use: New test files. New configuration. Documentation. Never use Write on existing files; use Edit instead.

### Edit (Modify Existing Files)

Edit makes surgical changes to existing code. It replaces specific text blocks while preserving surrounding context.

```bash
claude -p "In src/api/handler.ts, add rate limiting \
  middleware to the POST /users endpoint"
```

When to use: Adding features to existing code. Small targeted changes. Safer than Write for modifications.

### Glob (Find Files by Pattern)

Glob discovers files matching patterns. It is the agent-friendly version of `find`.

```bash
claude -p "Find all test files (*.test.ts) in the src/ directory"
```

When to use: Finding files by extension. Pattern matching. Before Read operations to locate relevant files.

### Grep (Search File Contents)

Grep performs full-text regex search across your codebase. It finds code patterns, strings, and identifiers.

```bash
claude -p "Search for all calls to authenticateUser() in the codebase"
```

When to use: Finding function calls. Searching for patterns. Understanding how code is used across files.

### Bash (Execute Commands)

Bash runs any CLI command: builds, tests, linters, deployments.

```bash
claude -p "Run npm test and tell me which tests are failing"
```

When to use: Running tests. Building code. Executing linters. Infrastructure operations.

### The Feedback Loop

Every Bash execution produces output that Claude Code can read and reason about. This observability is what makes agents effective.

When tests fail, Claude Code sees the failure message, understands what went wrong, and can propose fixes. When builds break, it sees the error and can diagnose the problem. This feedback loop is automatic; you do not need to do anything special. The six tools listed above, combined with this observability capability, form the agent's complete toolkit.

## Basic Prompting Patterns

Four patterns produce consistently good results.

### Pattern 1: Context + Goal + Success Criteria

Bad prompt:
```
"Add authentication to the API"
```

Good prompt:
```
"Add JWT authentication to POST /users in src/api/users.ts.

Context:
- Auth service exists at src/services/auth.ts
- Use existing authenticateUser() function
- Error format: { success: false, error: { code, message } }
- Reference src/api/posts.ts for middleware pattern

Success criteria:
- Unauthenticated requests return 401
- Valid tokens return user data
- Tests in tests/auth.test.ts pass"
```

Why it works: Claude Code knows exactly where to look, what patterns to follow, and how to verify success.

### Pattern 2: Reference Existing Code

Bad prompt:
```
"Add a date utility function"
```

Good prompt:
```
"Add date utilities to src/utils/date.ts following the pattern in src/utils/string.ts.

Functions needed:
- parseISO(str: string): Date | null
- formatDate(date: Date, format: string): string
- isValidDate(val: unknown): val is Date

Follow the same export style and JSDoc conventions as string.ts.
Include unit tests in tests/utils/date.test.ts."
```

Why it works: Claude Code reads the pattern file and matches its conventions automatically.

### Pattern 3: Tests as Specification

Bad prompt:
```
"Add email validation"
```

Good prompt:
```
"Write tests for email validation in tests/validation.test.ts.

Test cases:
- Valid: user@example.com, john.doe+test@company.co.uk
- Invalid: missing @, empty string, spaces
- Edge cases: international domains, subdomains

After tests pass review, implement
src/utils/validation.ts:validateEmail()
to pass all tests."
```

Why it works: Tests define concrete behavior. Claude Code writes code to pass tests, not to match vague descriptions.

**The Verification Workflow**

The tests-as-specification pattern becomes more powerful when you request verification alongside implementation. Instead of reviewing 500 lines of generated code, you review 10 lines of test output.

The prompt structure:
```
"[Implementation request]

After implementation, run the tests and show me the output."
```

Example workflow:

**Step 1: Request implementation with verification:**
```
"Implement email validation in
src/utils/validation.ts to pass the tests
in tests/validation.test.ts.

After implementation:
1. Run npm test tests/validation.test.ts
2. Show me the test output"
```

**Step 2: Review test output, not code.**

Claude Code responds with:
```
✅ validates standard email format: PASSED
✅ validates email with plus addressing: PASSED
✅ rejects missing @ symbol: PASSED
✅ rejects empty string: PASSED
❌ handles international domains: FAILED
   Expected: true for "user@例え.jp"
   Actual: false
5/6 tests passed, 1 failed
```

Your review: Scan output for failures. Takes 10 seconds instead of reading 200 lines of regex code.

**Step 3: Fix failures immediately:**
```
"Fix the international domain handling and re-run tests."
```

After fix:
```
✅ 6/6 tests passed
```

Why the verification workflow works:

- **Shifted burden**: You review test output, not implementation code. 10 lines versus 200 lines.
- **Immediate fixes**: Context is fresh when failures appear. Fixes take minutes, not hours.
- **Quality gates**: Tests become permanent artifacts. Future changes must pass them.
- **Compound learning**: Claude Code sees what "correct" looks like through passing tests. Each verification cycle improves future generations.

### Pattern 4: Exploration Before Implementation

Bad prompt (mixing modes):
```
"Add a new payment provider that works with Stripe and PayPal"
```

Good prompt (separated):
```
Step 1: "How is payment processing structured in this codebase?
Show me the PaymentProvider interface and one implementation."

Step 2 (after understanding): "Create StripeProvider implementing PaymentProvider.
Follow the pattern from PayPalProvider. Use config from src/config/stripe.ts.
Add tests following tests/providers/paypal.test.ts pattern."
```

Why it works: Exploration builds understanding. Implementation uses that understanding for first-try correctness.

### Pattern 5: Incremental Development

Bad prompt:
```
"Build a complete user authentication system
with JWT tokens, password hashing,
login/logout endpoints, password reset flow
with email verification, session refresh
tokens, rate limiting, and an admin dashboard."
```

Good prompt (broken into increments):
```
Increment 1: "Create a User interface with id,
email, passwordHash, createdAt fields
in src/models/user.ts"

[Validate: Types compile. Continue.]

Increment 2: "Add hashPassword and verifyPassword
functions in src/utils/auth.ts using bcrypt.
Export with JSDoc comments."

[Validate: Quick test shows hashing works.]

Increment 3: "Create an authenticate function that
takes email/password and returns AuthResult with
success boolean, optional user, and optional
error message."

[Validate: Function works with test credentials.]
```

Why it works: Large requests generate 1,000+ lines where errors compound and debugging becomes archaeology. Incremental requests generate 20 to 100 lines at a time, where each piece can be validated immediately. Errors are caught at the source, not buried under subsequent code.

The validation loop is critical: after each increment, run the code, verify it works, fix any issues before proceeding. Working code becomes context for the next increment, which means Claude Code sees concrete examples of what you want rather than inferring from descriptions.

**The numbers**: Teams measuring this pattern report 90% error rate reduction compared to large batch requests. The first increment produces working code in 5 minutes instead of debugging 1,000 lines for 90 minutes.

**Increment sizing guide**:
- Single interface or type: 5 to 20 lines
- Single utility function: 10 to 30 lines
- Single service method: 20 to 50 lines
- Single API endpoint: 20 to 60 lines

If an increment feels large, split it further. The cost of additional prompts is far less than the cost of debugging cascading errors.

## Claude Code vs Cursor vs ChatGPT

Each tool excels in different contexts. Knowing when to use each saves time.

| Dimension | Claude Code | Cursor | ChatGPT |
|-----------|------------|--------|---------|
| Best for | Multi-file workflows, automation | Quick edits, real-time coding | Concepts, brainstorming |
| Codebase context | Full repo via CLAUDE.md + tools | Open files + search | Paste-based, limited |
| Speed per turn | ~30s (read/execute/reason) | <1s (inline) | ~5s (API) |
| Verification | Runs tests, builds, linters | Limited | None |
| Cost | Token-based | Subscription | Subscription |

**Use Claude Code when:**
- Task spans 3+ files
- You need to run tests or builds
- Full codebase context is essential
- You are building automation

**Use Cursor when:**
- You are actively coding
- Task is small and visible on screen
- You want fastest iteration

**Use ChatGPT when:**
- Explaining a concept
- Brainstorming architecture
- No codebase context needed

## The Two-Mode Mental Model

The single most important pattern for productive agent work is separating exploration from implementation.

### Why Two Modes?

Without exploration, code generation is a lottery. You ask Claude Code to implement a feature, it generates code, and you discover it does not match your patterns. You ask for a refactor, it generates different code, still wrong. Three or four iterations later, you have something that works. Total time: 30 minutes, 800 lines generated, significant frustration.

With exploration, you first ask questions. How does authentication work in this codebase? Show me an example. What error handling pattern do we use? After 5 minutes, you understand the landscape. Then you ask for implementation with informed context. Claude Code generates correct code on the first try. Total time: 7 minutes, 200 lines, working code.

The difference: 23 minutes saved, 75% fewer lines generated, first-try correctness.

### Exploration Mode

Goal: Build understanding before writing code.

Key questions:
- "How is [feature] currently implemented?"
- "What patterns should I follow?"
- "Show me an example."

Example workflow:

```bash
claude -p "How does error handling work in this codebase? Show me 3 examples."
# Claude Code greps for error patterns, shows Result<T, E> usage, explains conventions {#ch02-getting-started-with-claude-code}

claude -p "Should I use Result<T, E> or exceptions for the new payment service?"
# Claude Code analyzes codebase, shows you chose Result<T, E>, explains why {#ch02-getting-started-with-claude-code}
```

Time invested: 5 minutes. Understanding gained: enough to implement correctly.

### Implementation Mode

Goal: Generate correct code on first try.

Key pattern: Reference discoveries from exploration in your implementation prompt.

```bash
claude -p "Create PaymentService using these patterns from exploration:

- Result<T, E> error type
- Log all operations to AuditLog
- Unit tests following existing pattern

Methods: processPayment(), refundPayment(), getStatus()
Config from src/config/payments.ts
Tests in tests/services/payment.test.ts

Success: All methods return Result<T, PaymentError>, tests pass, npm run lint passes."
```

Time: 2 minutes. Result: Correct, working code.

### When to Use Each

Use exploration when starting new features, working in unfamiliar codebases, evaluating approaches, or debugging unclear issues.

Use implementation when you understand the patterns, are repeating established work, or have explicit examples to follow.

Use both for complex features. Explore the architecture, then implement with informed context.

## Common Pitfalls for Newcomers

Learning Claude Code involves unlearning habits that work fine with traditional coding but cause friction with agents. Here are the five mistakes that trip up nearly every newcomer.

### Pitfall 1: Oversized Tasks

The instinct is to batch work into large requests. "Build me a complete user authentication system with registration, login, password reset, and OAuth integration." This approach fails reliably.

Large tasks have exponential error surfaces. Each component interacts with others, and a mistake in one propagates through all. When the result does not work, debugging becomes archaeology: which of the fifteen changes caused the problem?

The fix: incremental development. Break the authentication system into discrete tasks. First, add the User model. Verify it works. Then add registration. Verify. Then add login. Each step is small enough that errors are obvious and fixes are simple. This pattern reduces errors by roughly 90% compared to large batch requests.

A good rule of thumb: if your prompt describes more than one logical change, split it.

### Pitfall 2: Skipping Exploration

Newcomers often jump directly to implementation. "Add a payment provider that integrates with Stripe." Claude Code generates something, but it does not match your existing payment abstractions, error handling conventions, or test patterns. You spend the next hour fixing inconsistencies.

The fix was covered earlier: explore first. Five minutes of exploration questions ("How is payment processing structured? Show me the PaymentProvider interface.") produces understanding that makes implementation accurate on the first try. Teams that adopt explore-first patterns report 60% fewer iterations to working code.

Exploration is not wasted time. It is an investment that pays off in reduced rework.

### Pitfall 3: Long Conversations Without Restart

Context accumulates noise over a conversation. Early turns contain stale information about files that have since changed. Failed experiments clutter the history. Claude Code continues referencing outdated context because it has no way to know what is still relevant.

The fix: restart conversations when context becomes stale. A good signal is when Claude Code makes mistakes about things it understood earlier, or when you notice it referencing old versions of code. Fresh context is more valuable than accumulated history.

Some practitioners restart after every major feature. Others restart when hitting three consecutive confusing responses. Find what works for your workflow, but recognize that "just keep going" in a long conversation often costs more time than starting fresh.

### Pitfall 4: Bloated CLAUDE.md Files

The temptation is to document everything. Every convention, every edge case, every historical decision. CLAUDE.md files balloon to thousands of lines.

The problem: instruction-following degrades as instruction count increases. Research shows frontier LLMs reliably follow approximately 150 to 200 instructions before quality drops. Past that threshold, compliance becomes unpredictable. Smaller models degrade exponentially. Frontier reasoning models degrade linearly, but they still degrade.

There is another constraint you may not have considered: Claude Code's system prompt already contains roughly 50 instructions. That consumes one-third of your reliable instruction budget before you write a single line of CLAUDE.md. A 300-instruction CLAUDE.md puts you 100 instructions over the reliability threshold.

**The Structure Comparison**

Lean CLAUDE.md (works reliably):
```markdown
# Project Context {#ch02-getting-started-with-claude-code}

## Stack (5 items)
## Commands (4 items)
## Conventions (3 items)

Total: ~12 instructions across 3 sections
```

Bloated CLAUDE.md (degrades quality):
```markdown
# Project Context {#ch02-getting-started-with-claude-code}

## Stack (15 items)
## Commands (20 items)
## Conventions (40 items)
## Database Schema (30 items)
## API Patterns (25 items)
## Error Handling (20 items)
## Testing Patterns (15 items)
## Deployment (10 items)

Total: ~175+ instructions across 8+ sections
```

The bloated version looks thorough, but Claude Code will miss critical rules buried in the noise. Section 7 gets less attention than section 1 because attention mechanisms have finite capacity.

**The Fix: Progressive Disclosure**

Instead of embedding everything, maintain task-specific documentation separately:

```
agent_docs/
  ├── database_schema.md
  ├── testing_patterns.md
  ├── deployment.md
  └── api_conventions.md
```

Then in CLAUDE.md, add pointers:

```markdown
## Documentation
- Database work: see `agent_docs/database_schema.md`
- Testing: see `agent_docs/testing_patterns.md`
```

This keeps CLAUDE.md under 100 lines while preserving access to detailed guidance. Claude Code reads the relevant file when working in that area, keeping context focused and instruction count low.

A lean CLAUDE.md that fits in 100 lines will outperform a comprehensive one at 1,000 lines because the important rules remain within the reliable instruction threshold.

### Pitfall 5: Manual Review Instead of Verification

Newcomers read generated code line by line, searching for bugs by visual inspection. This is slow and unreliable. Humans miss subtle issues that automated tools catch instantly.

The fix: let agents verify through tests, linters, and type checkers. Instead of reading the generated authentication code, run `npm test` and `npm run lint`. If tests pass and types check, the code meets your specifications. If they fail, the error messages tell you exactly what is wrong.

This is not laziness; it is leverage. Your eyes are expensive. Automated verification is cheap and more accurate. Save manual review for architecture decisions and code style, not catching typos and type errors.

### The Common Thread

All five pitfalls share a root cause: applying human coding habits to agent workflows. Humans batch work for efficiency. Humans skip exploration because they remember past projects. Humans maintain long context because their brains synthesize well. Humans review code visually because they always have.

Agents work differently. They benefit from small tasks, explicit context, fresh starts, concise instructions, and automated verification. Adapting to these patterns is the real learning curve with Claude Code.

## Exercises

### Exercise 1: Exploration Practice

Using a real project:

1. Ask Claude Code: "What is the main entry point for this project?"
2. Ask: "How does error handling work? Show me 3 examples."
3. Ask: "What testing framework is used? Show me one test file."
4. Ask: "What are the top 3 architectural patterns I should follow?"
5. Write a two-paragraph summary of what you learned.

Success criteria: You can name 3+ patterns, 2 design decisions, and you read actual code.

### Exercise 2: Prompt Quality Comparison

1. Write a vague prompt: "Add a utility function."
2. Rewrite it using Context + Goal + Success Criteria pattern.
3. Run the rewritten prompt.
4. Compare iterations needed.

Success criteria: Rewritten prompt is 3+ sentences, includes file paths, specifies success criteria, requires fewer iterations.

### Exercise 3: Full Explore + Implement Workflow

Pick a feature to add to your project.

**Part A: Explore (10 min)**
1. Ask 3 to 5 questions about existing patterns
2. Document what you discover
3. Identify where your feature fits

**Part B: Implement (15 min)**
1. Write a detailed prompt based on exploration
2. Run it
3. Verify with tests and linter

**Part C: Reflect (5 min)**
1. How many iterations would this have taken without exploration?
2. What did exploration teach you?

Success criteria: Feature works, code matches existing patterns, took fewer iterations than expected.

## Summary

Claude Code is an agent that reads your codebase, makes changes, and verifies its work. Understanding this distinction from chat-based tools changes how you work.

The key insights:

- **Context matters**: Prompts that reference existing patterns produce correct code on the first try. Vague prompts produce multiple iterations.
- **Six core tools**: Read, Write, Edit, Glob, Grep, and Bash form the agent's capability set, with automatic observability of command output.
- **Right tool for the job**: Claude Code for multi-file workflows with verification. Cursor for fast inline edits. ChatGPT for concepts and brainstorming.
- **Two modes**: Explore first to understand, then implement with informed context. This pattern reduces iterations by 60% and produces 8x fewer pattern violations.

The agent mindset is: every prompt should reference what exists, specify where changes go, and define how success is measured. Five minutes of exploration saves thirty minutes of iteration.

The next chapter covers prompting fundamentals in depth. You will learn information theory concepts that explain why some prompts work better than others, and you will develop techniques for maximizing the value per token. See Chapter 3: Prompting Fundamentals.

---

> **Companion Code**: All 3 code examples for this chapter are available at [examples/ch02/](https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book/tree/main/examples/ch02)


*Related chapters:*
- Chapter 1: The Compound Systems Engineer for the meta-engineering philosophy
- Chapter 4: Writing Your First CLAUDE.md for deep dives on project context files
- Chapter 6: The Verification Ladder for test-driven agent workflows
