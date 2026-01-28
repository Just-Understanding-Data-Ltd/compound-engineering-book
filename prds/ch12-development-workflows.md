# Chapter 12: Development Workflows

> Master the practical workflows that make AI-assisted development efficient at scale.

---

## Overview

Individual techniques are powerful, but workflows tie them together. This chapter covers the practical patterns that professional AI-assisted developers use daily: plan mode for strategic thinking, git worktrees for parallel development, incremental development patterns, automation scripts, and specialized tools like Playwright and AST-grep. These workflows compound your productivity.

---

## Learning Objectives

By the end of this chapter, you will be able to:

1. Use plan mode strategically to think before implementing
2. Set up git worktrees for parallel AI-assisted development
3. Apply incremental development patterns for complex features
4. Convert ad-hoc workflows into deterministic scripts
5. Use Playwright and AST-grep for specialized automation

---

## Source Articles

### Primary Sources
- `plan-mode-strategic.md` - Strategic thinking before implementation
- `git-worktrees-parallel-dev.md` - Parallel development branches
- `incremental-development-pattern.md` - Step-by-step feature building
- `ad-hoc-flows-to-deterministic-scripts.md` - Workflow automation
- `playwright-script-loop.md` - Browser automation patterns
- `ast-grep-for-precision.md` - AST-based code transformations
- `symlinked-agent-configs.md` - Sharing configs across worktrees

### Supplementary Sources (Added from KB Analysis Jan 27, 2026)
- `parallel-agents-for-monorepos.md` - Scaling parallel agent execution patterns (10x speedup)
- `llm-usage-modes-explore-vs-implement.md` - When to explore vs when to implement
- `checkpoint-commit-patterns.md` - Git commit strategies for AI workflows (checkpoint commits, RALPH integration)

### Additional Sources (Added from KB Analysis Jan 28, 2026)
- `24-7-development-strategy.md` - Autonomous agents running overnight with worktrees
- `agent-swarm-patterns-for-thoroughness.md` - Parallel agent orchestration patterns
- `yolo-mode-configuration.md` - Permission-free parallel sessions across worktrees

---

## Detailed Outline

### 12.1 Plan Mode: Think Before You Implement
- What is plan mode in Claude Code?
- When to use plan mode (complexity thresholds)
- The planning document structure
- Review and refinement cycle
- Plan mode vs immediate implementation
- **Exercise**: Use plan mode for a medium-complexity feature

### 12.2 Git Worktrees for Parallel Development
- What are git worktrees?
- Setting up worktrees for AI development
- Running multiple agents in parallel
- Symlinked agent configs across worktrees
- Merging parallel work streams
- **Example**: Three worktrees for frontend, backend, tests

### 12.3 Incremental Development Pattern
- Why incremental beats big-bang
- The incremental cycle: plan → implement → verify → commit
- Checkpoint commits for rollback safety
- Progressive complexity (simple → complete)
- Avoiding the "90% done" trap
- **Exercise**: Build a feature incrementally

### 12.4 Ad-Hoc to Deterministic Scripts
- Recognizing repeatable workflows
- The script capture pattern
- Parameterizing scripts for reuse
- Building a personal automation library
- When scripts beat ad-hoc prompting
- **Example**: Converting a manual process to script

### 12.5 Playwright Script Loop
- Browser automation with Claude Code
- The Playwright MCP server
- Common automation patterns (scraping, testing, form filling)
- Handling dynamic content
- Error recovery in browser automation
- **Exercise**: Automate a repetitive browser task

### 12.6 AST-Grep for Precision Transformations
- What is AST-grep and when to use it
- Pattern matching vs text matching
- Writing AST-grep rules
- Combining with Claude Code for mass refactors
- Precision transformations at scale
- **Example**: Refactor all API calls to new pattern

### 12.7 Skills System Deep Dive
- What are Claude Code skills?
- Built-in skills overview
- Creating custom skills
- Skills vs sub-agents (when to use each)
- Skill composition patterns
- **Exercise**: Create a custom skill for your workflow

---

## Key Examples

### Example 1: Plan Mode Session
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// Strategic planning before implementation
await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929'
})

// Enter plan mode
await session.send(`
/plan

Feature: User authentication with OAuth

Before implementing, create a plan covering:
1. Architecture decisions (session vs JWT)
2. Files to create/modify
3. Dependencies needed
4. Testing strategy
5. Migration considerations

Do not write any code yet. Output a structured plan.
`)

// Review plan, then implement
await session.send(`
The plan looks good. Now implement step 1: OAuth provider setup.
After each step, commit with a descriptive message.
`)
```

### Example 2: Git Worktrees Setup
```bash
#!/bin/bash
# setup-worktrees.sh - Parallel development environment

# Create worktrees for parallel AI development
git worktree add ../project-frontend feature/new-dashboard
git worktree add ../project-backend feature/api-v2
git worktree add ../project-tests feature/e2e-coverage

# Symlink shared configs
for worktree in ../project-frontend ../project-backend ../project-tests; do
  ln -sf $(pwd)/CLAUDE.md $worktree/CLAUDE.md
  ln -sf $(pwd)/.claude $worktree/.claude
done

# Now run agents in parallel
# Terminal 1: cd ../project-frontend && claude
# Terminal 2: cd ../project-backend && claude
# Terminal 3: cd ../project-tests && claude
```

### Example 3: Incremental Development
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// Incremental feature development
async function incrementalFeature(featureSpec: string) {
  await using session = unstable_v2_createSession({
    model: 'claude-sonnet-4-5-20250929',
    tools: [
      { name: 'write_file', /* ... */ },
      { name: 'run_tests', /* ... */ },
      { name: 'git_commit', /* ... */ }
    ]
  })

  const steps = [
    'Create types and interfaces (no implementation)',
    'Implement core logic with happy path only',
    'Add error handling for edge cases',
    'Write unit tests',
    'Add integration with existing code',
    'Write integration tests',
    'Add documentation'
  ]

  for (const step of steps) {
    await session.send(`
      Feature: ${featureSpec}

      Current step: ${step}

      Implement ONLY this step. After completion:
      1. Run tests to verify
      2. Git commit with descriptive message
      3. Report what you did

      Do not proceed to next step.
    `)

    // Verify before continuing
    const testsPass = await runTests()
    if (!testsPass) {
      await session.send('Tests failed. Fix before proceeding.')
    }
  }
}
```

### Example 4: Playwright Automation
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// Browser automation with Playwright MCP
await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929',
  mcpServers: ['playwright']
})

await session.send(`
Use the Playwright tools to:

1. Navigate to https://example.com/admin
2. Fill login form (user: test@example.com, pass: from env)
3. Navigate to /users page
4. Extract all user emails into a JSON array
5. Save to users-export.json

Handle any popups or dynamic loading.
`)
```

### Example 5: AST-Grep Refactor
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

// Precision code transformation
await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929'
})

await session.send(`
Use ast-grep to refactor all API calls in the codebase.

Current pattern to find:
\`\`\`
fetch('/api/$ENDPOINT', { method: '$METHOD', body: $BODY })
\`\`\`

New pattern to replace with:
\`\`\`
apiClient.$METHOD('$ENDPOINT', $BODY)
\`\`\`

1. First, show me how many matches exist
2. Then apply the transformation
3. Run tests to verify nothing broke
`)
```

---

## Diagrams Needed

1. **Plan Mode Decision Tree**
   - When to use plan mode vs immediate implementation
   - Complexity thresholds

2. **Git Worktrees Architecture**
   - Main repo and worktree relationship
   - Shared vs isolated files

3. **Incremental Development Cycle**
   - The plan → implement → verify → commit loop
   - Checkpoint visualization

4. **Script Evolution**
   - Ad-hoc → parameterized → library
   - Maturity stages of automation

5. **Playwright Loop Pattern**
   - Navigate → interact → extract → verify cycle
   - Error handling branches

---

## Exercises

### Exercise 1: Plan Mode Practice
For a feature in your backlog:
- [ ] Enter plan mode and create a plan
- [ ] Have the plan reviewed (by Claude or colleague)
- [ ] Refine based on feedback
- [ ] Implement using the plan

### Exercise 2: Set Up Parallel Development
Configure worktrees for your project:
- [ ] Create 2-3 worktrees for different features
- [ ] Symlink shared configs
- [ ] Run agents in parallel
- [ ] Merge the work

### Exercise 3: Script Capture
Convert an ad-hoc workflow to a script:
- [ ] Identify a task you do repeatedly
- [ ] Document the steps
- [ ] Create a parameterized script
- [ ] Test and refine

---

## Cross-References

- **Builds on**: Chapter 10 (RALPH Loop), Chapter 11 (Sub-Agent Architecture)
- **Leads to**: Chapter 13 (Building the Harness) - workflows become infrastructure
- **Related**: Chapter 4 (CLAUDE.md) - workflows reference project instructions
- **Related**: Chapter 10 (RALPH Loop) - checkpoint commits integrate with RALPH iterations

---

## Future Enhancements (KB Content Available)

These KB articles contain additional content that could enhance future editions:

1. **Parallel Agents for Monorepos** (`parallel-agents-for-monorepos.md`)
   - 10x speedup for monorepo-wide changes
   - Batched agent execution patterns
   - Dependency-aware ordering

2. **24/7 Development Strategy** (`24-7-development-strategy.md`)
   - Autonomous agents running overnight with worktrees
   - Notification and handoff patterns

3. **Agent Swarm Patterns** (`agent-swarm-patterns-for-thoroughness.md`)
   - Orchestrating multiple agents for thorough coverage
   - Combining parallel execution with quality gates

---

## Word Count Target

3,000 - 4,000 words

---

## Status

**Status**: Complete

**Milestones**:
- [x] PRD complete
- [x] First draft
- [x] Code examples written (examples/ch12/ - 5 TypeScript files)
- [x] Code examples tested (59 tests pass, 123 assertions)
- [x] Reviewed (fixed 6 term introductions: JWT, REST/CRUD, MCP, CI, AST, LLM)
- [x] Diagrams complete (5 diagrams: Plan Mode, Git Worktrees, Incremental Dev, Script Evolution, Playwright Loop)
- [x] Exercises validated
- [x] Final (2026-01-28T22:54:00Z)
