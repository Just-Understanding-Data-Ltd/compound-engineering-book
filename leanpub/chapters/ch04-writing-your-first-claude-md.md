# Chapter 4: Writing Your First CLAUDE.md {#ch04-writing-your-first-claude-md}

You ask Claude to implement a Temporal workflow, but it generates API patterns instead. You need database migration code, but it produces React components. Every session starts with a correction: "No, we use factory functions here, not classes."

This is the context problem. Without project-specific guidance, Claude has zero knowledge of your codebase at session start. It cannot learn from previous sessions. Every request must include essential context, or you waste cycles fixing pattern mismatches.

This chapter teaches you to write effective CLAUDE.md files that solve this problem. You will learn the WHY-WHAT-HOW framework for structuring context, understand why less is more when it comes to instructions, and discover how to scale documentation through hierarchical files as your project grows.

## Why CLAUDE.md Matters

Large Language Models (LLMs) function as stateless systems with frozen weights at inference time. Claude starts each session with:

- Zero codebase knowledge
- No memory of previous sessions
- Only the knowledge contained within provided tokens

This makes CLAUDE.md the preferred delivery mechanism for essential project context. Without it, every conversation requires manual explanation of your tech stack, conventions, and workflows. With it, Claude understands your project from the first prompt.

Consider what happens without CLAUDE.md. You ask Claude to add a new API endpoint. Claude generates Express.js code, but your project uses FastAPI. You correct it. Claude uses classes, but your team uses factory functions. You correct it again. Claude imports from wrong paths because it does not know your monorepo structure. Three corrections before any useful work happens.

Now consider the same request with an effective CLAUDE.md. Claude reads the file, understands you use FastAPI with factory functions, knows your route structure, and generates correct code on the first try. The 30 seconds spent loading context saves 15 minutes of corrections.

Bad CLAUDE.md files cascade errors through every phase of AI-assisted development. When planning reads incorrect patterns, implementation follows those incorrect patterns, and generated artifacts inherit the mistakes. One poorly crafted instruction multiplies into hundreds of wrong code generations.

Good CLAUDE.md files multiply your effectiveness. A well-crafted 50-line file improves every code generation across your entire project. The effort invested in writing it pays dividends in reduced corrections and faster iterations.

There is a subtle but important point here about Claude's system prompt. Anthropic injects a reminder with your CLAUDE.md that says the context "may or may not be relevant" and Claude should not respond to it unless it is "highly relevant." This means vague or overly broad instructions get filtered out. Only specific, universally applicable guidance reliably influences Claude's behavior.

## The Instruction-Following Degradation Curve

Research on frontier models shows instruction-following accuracy degrades as instruction count increases. Smaller models degrade exponentially. Larger models degrade linearly but still degrade.

The reliable range sits around 150-200 instructions. Claude Code's system prompt already consumes roughly 50 instructions. This leaves approximately 100-150 instructions for your CLAUDE.md file before accuracy starts declining.

This constraint shapes everything about how you write CLAUDE.md:

- Keep files under 300 lines, ideally under 100
- Include only universally applicable guidance
- Avoid style rules that can be enforced with tooling
- Use progressive disclosure instead of embedding everything

The temptation to document everything fights against instruction-following limits. More documentation does not mean better results. Focused documentation means better results.

## The WHY-WHAT-HOW Framework

Every effective CLAUDE.md covers three dimensions:

**WHY**: Purpose and context. What problem does this project solve? What business domain does it operate in? Why do certain architectural decisions exist?

**WHAT**: Technology stack and structure. What languages and frameworks does the project use? How is the codebase organized? What packages live where?

**HOW**: Workflow requirements. How do developers run tests? How do they build for production? What verification steps happen before committing?

A minimal example demonstrates the pattern:

```markdown
# Social Media Scheduler {#ch04-writing-your-first-claude-md}

## Why

SaaS product helping marketers schedule social media posts across platforms.
Saves 5+ hours per week through automated scheduling and content recycling.

## What

- Next.js 14 app with TypeScript
- Python FastAPI backend in `/api`
- Supabase database with RLS policies
- Temporal for background job orchestration

Monorepo structure:
- `/packages/web` - Next.js frontend
- `/packages/api` - FastAPI backend
- `/packages/database` - Database migrations and types
- `/packages/workflows` - Temporal workflows

## How

- Use `bun` not `npm` for package management
- Run `bun test` before committing
- Run `bun build` to type-check everything
- API changes require updating `/packages/types`
```

This file runs about 30 lines. It provides enough context for Claude to understand the project without overwhelming the instruction budget.

## Anatomy of an Effective CLAUDE.md

Build your file around these sections:

```markdown
# Project Name {#ch04-writing-your-first-claude-md}

## Stack
[Language, frameworks, key dependencies - 5-10 lines]

## Structure
[Directory layout, package purposes - 10-20 lines]

## Commands
[Package manager, how to test, build, deploy - 10-15 lines]

## Conventions
[1-2 critical patterns only - 10-20 lines]

## Before Committing
[Verification steps - 5-10 lines]

## Documentation
[Links to task-specific docs - 5-10 lines]
```

The optimal file lands under 100 lines. Yellow flag territory sits between 100-300 lines. Red flag territory exceeds 300 lines.

Before shipping a CLAUDE.md, verify against this checklist:

- Under 300 lines (ideally under 100)
- Every instruction applies universally to all work
- No style or linting rules (use tooling instead)
- No inline code snippets (use file references instead)
- Task-specific documentation lives in separate files
- Manually crafted, not auto-generated
- Covers WHY, WHAT, and HOW

## What Belongs and What Does Not Belong

Apply the universal applicability test to every instruction: "Will every developer working on every file need to know this?"

If yes, include it in CLAUDE.md:
- Package manager and build tool
- Monorepo structure and package purposes
- Global architecture patterns
- Verification procedures before committing

If no, create task-specific documentation instead:
- Database schema details
- API endpoint documentation
- Framework-specific patterns for one domain
- Domain-specific business rules

For content that fails the universal test, use progressive disclosure. Create an `agent_docs/` directory with focused files:

```
agent_docs/
  ├── building_the_project.md
  ├── running_tests.md
  ├── database_schema.md
  ├── service_architecture.md
  └── deployment.md
```

Then reference these from CLAUDE.md:

```markdown
## Documentation

For specific work areas, read the relevant doc first:
- Building/deploying: See `agent_docs/building_the_project.md`
- Database work: See `agent_docs/database_schema.md`
- Adding services: See `agent_docs/service_architecture.md`
```

This pattern keeps root CLAUDE.md lean while maintaining access to detailed documentation when needed.

## Hierarchical CLAUDE.md for Scaling Codebases

A 10,000-line monolithic CLAUDE.md creates a problem. When implementing a Temporal workflow, the LLM loads 10,000 lines but only 800 matter. The other 9,200 lines about API patterns, database migrations, and React components become noise that dilutes attention.

The solution distributes documentation hierarchically across your codebase:

```
/
├── CLAUDE.md (30-50 lines)
│   ├── Global architecture
│   ├── Core principles
│   └── Links to domain docs
│
├── packages/
│   ├── api/
│   │   └── CLAUDE.md (200-300 lines)
│   │       ├── tRPC patterns
│   │       ├── Route conventions
│   │       └── Validation approach
│   │
│   ├── database/
│   │   └── CLAUDE.md (250-350 lines)
│   │       ├── Schema patterns
│   │       ├── Migration rules
│   │       └── RLS policies
│   │
│   └── workflows/
│       └── CLAUDE.md (300-400 lines)
│           ├── Temporal patterns
│           ├── Determinism requirements
│           └── Activity patterns
```

When working on `packages/workflows/src/send-email.ts`, Claude loads:
- Root CLAUDE.md (40 lines)
- workflows/CLAUDE.md (300 lines)
- Total: 340 lines, 95%+ relevant

Compare this to monolithic loading:
- Root CLAUDE.md (10,000 lines)
- Relevant content (~800 lines)
- Relevance: 8%

The hierarchical approach achieves 70-90% context reduction with 80-95% relevance improvement.

Follow these guidelines for file sizes at each level:

| Level | Target | Maximum |
|-------|--------|---------|
| Root | 20-50 lines | 100 lines |
| Domain | 100-200 lines | 300 lines |
| Subdomain | 50-150 lines | 200 lines |

Create domain-level files when patterns diverge between directories. Create subdomain files when a particular area has unique constraints that differ from its parent domain. Limit hierarchy to 3-4 levels maximum.

Here is what a domain CLAUDE.md might look like for the workflows package:

```markdown
# Workflows Package {#ch04-writing-your-first-claude-md}

## Architecture

Temporal SDK orchestrates long-running background jobs.
- `src/workflows/` - Workflow definitions (deterministic logic)
- `src/activities/` - Activity implementations (side effects)
- `src/worker.ts` - Worker process that executes workflows

## Patterns

### Workflow Determinism

Workflows MUST be deterministic. Replaying history must produce identical results.

DO:
- Use `workflow.uuid()` for randomness
- Use `workflow.now()` for current time
- Use `proxyActivities()` for external calls

DON'T:
- Use `Math.random()` (non-deterministic)
- Use `Date.now()` (non-deterministic)
- Make HTTP calls directly (side effects)

### Activity Pattern

All external calls go through activities:

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function welcomeWorkflow(userId: string) {
  await sendEmail({ to: userId, template: 'welcome' });
}

## Related

- Parent: See root CLAUDE.md for global architecture
- Siblings: packages/api/CLAUDE.md for endpoints that trigger workflows
```

This domain file runs about 60 lines. It focuses exclusively on Temporal patterns. API developers never need to read this file. Workflow developers always get relevant context.

Always link between levels:

```markdown
## Related

- Parent: See root CLAUDE.md for global architecture
- Siblings: packages/database/CLAUDE.md for DTOs
- Children: src/routes/campaigns/CLAUDE.md for campaign rules
```

## Common Mistakes and How to Avoid Them

### Auto-Generating CLAUDE.md

Tools that auto-generate CLAUDE.md files create generic, low-signal content. The output looks reasonable but lacks the specific context that makes AI assistance effective. Bad instructions cascade through planning and implementation phases, multiplying errors.

Solution: Invest deliberate effort in crafting each line. Treat CLAUDE.md as first-class code that deserves thoughtful writing.

### Using CLAUDE.md as a Style Guide

Instructions like "Use 2 spaces not 4" or "CamelCase for variables" consume instruction budget for rules that tooling handles better. Style enforcement through CLAUDE.md has high cognitive load and poor accuracy.

Solution: Use auto-fixing linters. One line stating "We use Biome for formatting" replaces 50 lines of style rules with 100% enforcement accuracy.

### Monolithic Growth

CLAUDE.md starts at 100 lines and grows to 5,000+ as teams add domain-specific patterns. Different developers working on different domains see irrelevant context that dilutes attention.

Solution: Extract domain patterns into domain CLAUDE.md files when root exceeds 100 lines. Audit regularly and move content closer to where it applies.

### Inline Code Snippets That Rot

A 500-line code example embedded in CLAUDE.md becomes stale as the actual code evolves. The documentation drifts from reality, leading Claude to generate outdated patterns.

Solution: Use file references instead. Write "See `src/routes/users.ts:45-80` for the pattern" instead of embedding the code. References stay current because they point to the actual source of truth.

### Duplicating Content Across Levels

The same instruction appears in both root and domain files. This wastes instruction budget and creates maintenance burden when patterns change.

Solution: Root states the principle; domain specializes it. Root might say "Use factory functions" while domain shows "Routes use factory pattern: `export const createHandler = (deps) => { ... }`"

### Not Linking Between Levels

Claude does not automatically discover that `packages/api/src/routes/campaigns/CLAUDE.md` exists. Without explicit links, domain-specific context gets ignored.

Solution: Always include a "Related" section with links to parent, children, and sibling files.

### Stale Context

Code patterns evolve but CLAUDE.md remains frozen. The documentation describes patterns from six months ago while the actual code has moved on. Claude generates code matching the stale documentation, creating inconsistency with the current codebase.

Solution: Update CLAUDE.md in the same pull request as code changes. If you change how route handlers work, update the API CLAUDE.md in the same commit. Treat documentation as code that requires the same maintenance discipline. Some teams add git hooks that warn when code in a directory changes but its CLAUDE.md does not.

## Multi-Tool Strategy

Teams using multiple AI tools face duplication problems. Claude Code reads CLAUDE.md, Cursor reads .cursorrules, Aider reads .aider/AGENTS.md. Maintaining separate files creates drift between tools.

Symlinks solve this:

```bash
# Create master rules file {#ch04-writing-your-first-claude-md}
touch RULES.md

# Link tools to master {#ch04-writing-your-first-claude-md}
ln -s RULES.md CLAUDE.md
ln -s RULES.md .cursorrules
mkdir -p .aider && ln -s ../RULES.md .aider/AGENTS.md
```

All tools now read from a single source. Updates to RULES.md propagate everywhere. Symlinks work in git on macOS and Linux. Windows developers need `git config core.symlinks true`.

## Case Study: Before and After

A real project demonstrates the impact. Before refactoring, the team had a single 8,500-line CLAUDE.md at the root. It documented everything: API patterns, database migrations, React components, Temporal workflows, command-line interface (CLI) tools, and deployment procedures.

When a developer asked Claude to implement a new Temporal workflow, Claude loaded all 8,500 lines. The relevant Temporal section started at line 6,200. Claude often generated code using API error handling patterns instead of Temporal's `ApplicationFailure`. Code that compiled but violated workflow determinism requirements appeared frequently. Each task required 3-5 iterations to produce correct output.

After refactoring to hierarchical structure:
- Root CLAUDE.md: 45 lines (architecture overview, links to domains)
- packages/workflows/CLAUDE.md: 180 lines (Temporal patterns, determinism rules)
- packages/api/CLAUDE.md: 220 lines (tRPC patterns, validation)
- packages/database/CLAUDE.md: 190 lines (migration rules, RLS policies)

For the same Temporal workflow task, Claude now loads 45 + 180 = 225 lines. Context relevance improved from 8% to 92%. First-try correctness improved from 35% to 78%. The team stopped correcting pattern mismatches.

The total documentation stayed roughly the same. The same information now lives closer to where developers need it, organized by domain rather than dumped into one file.

## Measuring Success

Track these metrics to evaluate your CLAUDE.md effectiveness:

**Context Relevance**: Relevant lines divided by total lines loaded. Target above 80%. Monolithic files achieve 5-10%. Hierarchical files achieve 80-95%.

To measure this, pick a task like "implement a new Temporal workflow." Count how many lines of CLAUDE.md content would load. Count how many of those lines actually apply to Temporal work. Divide to get relevance percentage.

**First-Try Correctness**: Percentage of generated code that works without iteration. Poor CLAUDE.md: 30-40%. Good CLAUDE.md: 70-85%.

Track this informally over a week. Each time Claude generates code, note whether it needed corrections for pattern violations. After 20-30 generations, calculate the percentage that worked correctly on first attempt.

**Time to Find Patterns**: How long to locate relevant documentation. Monolithic: 5-10 minutes searching thousands of lines. Hierarchical: under 30 seconds, file lives next to code.

With hierarchical structure, developers can run `cat packages/workflows/CLAUDE.md` and immediately see all relevant patterns. No searching, no scrolling, no asking teammates.

**Developer Adoption**: Survey your team with one question: "Do you actually read CLAUDE.md before starting work in a new area?" If fewer than 80% say yes, your documentation is probably too long, too generic, or too stale to be useful.

## Exercises

### Exercise 1: Audit Your CLAUDE.md

If you have an existing CLAUDE.md, analyze it against the checklist from this chapter:

1. Count total lines
2. Identify instructions that are not universally applicable
3. Find any style guide rules that should use tooling instead
4. Check for inline code snippets older than 6 months
5. List what is missing from WHY, WHAT, or HOW
6. Propose 3 specific improvements

### Exercise 2: Write Your First CLAUDE.md

If you do not have a CLAUDE.md, create one:

1. Start with WHY: one paragraph on project purpose
2. Add WHAT: tech stack and directory structure
3. Add HOW: package manager, test commands, build commands
4. Add conventions: 1-2 critical patterns maximum
5. Review against the checklist
6. Target under 60 lines

Start a new Claude Code session and ask it to implement something in your codebase. Observe whether it uses correct patterns on the first try. If not, note what was missing from your CLAUDE.md and add it. Iterate until first-try correctness improves noticeably.

### Exercise 3: Design Domain Hierarchy

If your project exceeds 150 lines in root CLAUDE.md:

1. List all domains in your project
2. Estimate current lines per domain
3. Sketch folder structure for domain files
4. Design linking strategy between levels
5. Calculate line counts before and after
6. Identify which domain needs subdomain files

## Summary

CLAUDE.md provides essential project context to stateless LLMs. The WHY-WHAT-HOW framework structures documentation effectively. Instruction-following constraints demand keeping files under 100-300 lines.

As projects grow, hierarchical CLAUDE.md files distribute context to achieve 80-95% relevance instead of 5-10% with monolithic files. Progressive disclosure keeps root lean while maintaining access to detailed documentation.

Avoid common mistakes: auto-generation, style guide duplication, monolithic growth, inline snippets, and missing links. Use symlinks for multi-tool consistency.

The investment in crafting effective CLAUDE.md files pays dividends across every AI-assisted coding session. One well-crafted file improves thousands of code generations.

---

*Related chapters:*
- [Chapter 2: Getting Started with Claude Code](ch02-getting-started-with-claude-code.md) for installation and basic tool usage
- [Chapter 3: Prompting Fundamentals](ch03-prompting-fundamentals.md) for techniques that make your CLAUDE.md instructions more effective
- [Chapter 9: Context Engineering Deep Dive](ch09-context-engineering-deep-dive.md) for advanced information theory behind context optimization
