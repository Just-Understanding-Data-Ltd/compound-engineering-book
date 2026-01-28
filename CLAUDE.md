# Compound Engineering Book

> A comprehensive guide to AI-assisted software development: from beginner to expert with Claude Code.

**Source**: [Anthropic Long-Running Agent Harness](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents) | [Geoffrey Huntley's RALPH](https://ghuntley.com/ralph)

---

## Agent Operating Instructions

This project uses a **two-phase agent harness** for long-running work:

1. **Initializer Agent** (first run): Sets up environment, creates tracking files
2. **Coding Agent** (each iteration): Makes incremental progress, commits, updates tracking

### Getting Up to Speed Protocol

Every session, run these steps FIRST:

```
1. pwd                              # Confirm directory
2. Read claude-progress.txt         # Recent work summary
3. Read tasks.json                  # Flat task list (primary)
4. git log --oneline -10            # Recent commits
5. Read @LEARNINGS.md               # Accumulated insights
```

### Session Workflow (Iteration-Based)

The prompt tells you the iteration number. Use it to decide what to do:

```
┌─────────────────────────────────────────────────────────────┐
│  EVERY iteration:                                            │
│    1. Read CLAUDE.md, tasks.json, claude-progress.txt        │
│    2. Pick highest-scored pending task                       │
│    3. Complete ONE task                                      │
│    4. Update tasks.json (status + recalculate scores)        │
│    5. Update claude-progress.txt                             │
│    6. Git commit                                             │
│                                                              │
│  IF iteration % 3 == 0 (every 3rd):                          │
│    → Also curate queue: clean duplicates, adjust priorities  │
│                                                              │
│  IF iteration % 6 == 0 (every 6th):                          │
│    → Also run all 7 review agents IN PARALLEL                │
│                                                              │
│  IF iteration % 5 == 0 (every 5th):                          │
│    → Also add learning to @LEARNINGS.md                      │
└─────────────────────────────────────────────────────────────┘
```

**Parallel reviews:** Use Task tool to launch all 7 at once:
- slop-checker, diagram-reviewer, tech-accuracy, term-intro-checker
- oreilly-style, cross-ref-validator, progress-summarizer

### Critical Rules

- **ONE task per session**. No more.
- **Leave environment clean**. Next agent should be able to start immediately.
- **Document blockers**. If stuck, write it down and move on.
- **Never delete completed work** without explicit reason.
- **Commit after every task**. Memory lives in git.
- **Capture learnings every 5 iterations** into @LEARNINGS.md.

---

## Context Recovery After Compaction

When context is compacted, the RALPH loop re-injects:
1. **Full CLAUDE.md** - All project instructions
2. **tasks.json** - Flat task list with all pending work
3. **@LEARNINGS.md** - Accumulated insights from previous iterations

This means you always have what you need to continue, even after compaction.

---

## PRDs vs Tasks

**PRDs (Product Requirements Documents)** are reference specs stored in `tasks.json.prds`:
- Define chapter scope, learning objectives, and structure
- Include word count targets, diagrams needed, code examples
- Are completed once and serve as reference for chapter work
- Located in `prds/` folder as markdown files

**Tasks** are work items stored in `tasks.json.tasks`:
- Flat list with dynamic scoring
- Each task has: id, type, title, status, priority, score
- Status: "pending" → "in_progress" → "complete" | "blocked"

**Workflow:** Read PRD for context → Complete highest-scored pending task → Queue auto-updates

---

## Task Scoring System

Tasks are scored automatically. Always pick the **highest-scored pending task**.

**Score calculation:**
```
score = priority + type + chapter_sequence + blocking_bonus + age_bonus
```

| Factor | Values |
|--------|--------|
| Priority | critical: 1000, high: 750, medium: 500, normal: 250, low: 100 |
| Type | chapter: 100, fix: 80, kb-article: 60, diagram: 40, appendix: 20 |
| Chapter | Earlier chapters score higher (ch01 > ch15) |
| Blocking | +25 per task this blocks |
| Age | +50 if waiting 24h+, +100 if 48h+ |
| Review flagged | +200 |

**Get next task:**
```bash
jq '.tasks | map(select(.status == "pending")) | sort_by(-.score) | first | {id, score, title}' tasks.json
```

**Queue updates automatically** after each task via `scripts/update-queue.cjs`:
1. Marks completed dependencies
2. Unblocks waiting tasks
3. Recalculates all scores
4. Sorts by score

**Workflow**: Read the PRD for context, then complete tasks against that spec.

### What to Read on Each Iteration

```
1. pwd                           # Confirm directory
2. claude-progress.txt           # What happened recently
3. tasks.json                    # Task list with scores
4. git log --oneline -5          # Recent commits
5. The relevant PRD              # If working on a chapter
```

---

## Completion Criteria

### PRD Completion

A PRD is **COMPLETE** when:
- Status in `tasks.json.prds[chXX].status` = "complete"
- The .md file exists in `prds/`
- All required sections are filled out per `prds/index.md` structure:
  1. Overview (1 paragraph)
  2. Learning Objectives (3-5 bullet points)
  3. Source Articles (list)
  4. Detailed Outline (sections and subsections)
  5. Key Examples (what code/scenarios to include)
  6. Diagrams Needed (with descriptions)
  7. Exercises (2-3 "Try It Yourself" activities)
  8. Cross-References (links to other chapters)
  9. Word Count Target
  10. Status: Draft/Review/Complete

### Chapter Completion

A chapter is **COMPLETE** when all milestones in `tasks.json.prds[chXX].milestones` are true:

| Milestone | Criteria |
|-----------|----------|
| `prd_complete` | PRD exists and is finalized |
| `first_draft` | Content written to `chapters/chXX-title.md` |
| `code_written` | All code examples written to `examples/chXX/` |
| `code_tested` | All code compiles/runs, tests pass with cached responses |
| `reviewed` | Passed review (no AI slop, technical accuracy) |
| `diagrams_complete` | All required diagrams created in `assets/diagrams/` |
| `exercises_added` | 2-3 "Try It Yourself" exercises included |
| `final` | Ready for Leanpub publishing |

### Code Testing Requirements

All code examples use **TypeScript only** with the Anthropic SDK or Agent SDK.

**CRITICAL: SDK Usage by Chapter**

| Chapters | SDK | Focus |
|----------|-----|-------|
| Ch01-Ch05 | Native Anthropic SDK (`@anthropic-ai/sdk`) | API fundamentals, basic prompting, CLAUDE.md |
| Ch06-Ch15 | Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Custom agents, sub-agents, agentic patterns |

**Ch01-Ch05: Native SDK (API Fundamentals)**
```typescript
// Native Anthropic SDK for learning API basics
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }]
});
```

**Ch06-Ch15: Agent SDK (Custom Agents)**
```typescript
// Agent SDK v2 for building custom agents
import { unstable_v2_prompt, unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk';

// One-shot agent prompt
const result = await unstable_v2_prompt(prompt, { model: 'claude-sonnet-4-5-20250929' });

// Multi-turn agent session
await using session = unstable_v2_createSession({ model: 'claude-sonnet-4-5-20250929' });
await session.send('message');
for await (const msg of session.stream()) { /* handle response */ }
```

**WRONG: Standalone utility without SDK**
```typescript
function buildPrompt(config) { return `...`; }  // NO - must show SDK usage
```

**Why this matters:** Readers learn API basics first (Ch01-05), then graduate to building custom agents (Ch06-15). The Agent SDK is the focus for the majority of the book because it teaches agentic patterns.

### Simulating Tool Outputs (Git, Shell, etc.)

When code examples simulate tool outputs like git diffs, shell commands, or file contents:

**ALWAYS output exact text format, NOT structured arrays or objects.**

```typescript
// CORRECT: Exact text output matching real tool behavior
const gitDiff = `diff --git a/src/app.ts b/src/app.ts
index 1234567..abcdef0 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,6 +10,7 @@ export function main() {
   const config = loadConfig();
+  const logger = createLogger();
   return run(config);
 }`;

// WRONG: Structured representation
const gitDiff = {
  file: 'src/app.ts',
  additions: ['const logger = createLogger();'],
  deletions: []
};  // NO - agents see raw text, not structured data
```

**Why this matters:** Claude Code and custom agents receive tool outputs as raw text. Teaching structured representations misleads readers about how agents actually process information. Always show the exact text format that tools produce.

**Testing requirements:**
1. All TypeScript examples must compile with `tsc --noEmit`
2. Examples must import and use `@anthropic-ai/sdk` or `@anthropic-ai/claude-agent-sdk`
3. Use mock API responses stored in `examples/.cache/` for offline testing
4. Integration tests use Anthropic prompt caching to avoid repeated API costs

**Agent SDK v2 reference:** https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview
**Anthropic SDK reference:** https://docs.anthropic.com/en/api/client-sdks

Code examples live in `examples/chXX/` with structure:
```
examples/
├── ch04/
│   ├── email-campaign-agent.ts
│   ├── email-with-approval.ts
│   ├── resumable-deployment.ts
│   └── .cache/
│       └── responses.json
```

**Key v2 SDK patterns:**
```typescript
// One-shot prompt
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'
const result = await unstable_v2_prompt('query', { model: 'claude-sonnet-4-5-20250929' })

// Multi-turn session
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'
await using session = unstable_v2_createSession({ model: 'claude-sonnet-4-5-20250929' })
await session.send('message')
for await (const msg of session.stream()) { /* handle response */ }

// Resume session
import { unstable_v2_resumeSession } from '@anthropic-ai/claude-agent-sdk'
await using session = unstable_v2_resumeSession(sessionId, { model: 'claude-sonnet-4-5-20250929' })
```

### Exercises Structure

Each chapter includes 2-3 "Try It Yourself" exercises. Exercises live in `exercises/chXX/` with this structure:

```
exercises/
├── README.md              # Overview and conventions
├── ch01/
│   ├── README.md          # Chapter exercise overview
│   ├── 01-first-claude-md.md
│   ├── 02-leverage-audit.md
│   └── solutions/
│       ├── 01-solution.md
│       └── 02-solution.md
├── ch02/
│   ├── README.md
│   ├── 01-explore-codebase.md
│   ├── 02-iterative-development.md
│   ├── 03-tool-selection.md
│   └── solutions/
│       └── ...
└── ch03/
    └── ...
```

**Exercise File Format:**

```markdown
# Exercise: [Title]

## Objective
[1-2 sentences: what the reader will learn/build]

## Prerequisites
- [Required knowledge/setup]
- [Files or tools needed]

## Scenario
[Real-world context for the exercise]

## Tasks
1. [Specific, actionable step]
2. [Next step with clear success criteria]
3. [Final step]

## Hints
<details>
<summary>Hint 1: [Topic]</summary>
[Guidance without giving away the answer]
</details>

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Stretch Goals (Optional)
- [Advanced extension]
```

**Exercise Conventions:**

| Aspect | Convention |
|--------|------------|
| Difficulty | Progressive within chapter (easy → medium → hard) |
| Time | 10-30 minutes per exercise |
| Code | All code must be testable with Exercise Validator |
| Solutions | Provide in `solutions/` subfolder, not inline |
| Real-world | Base on realistic scenarios, not toy examples |
| Self-contained | Each exercise works independently |

**Creating Exercises:**

1. Read the chapter content first
2. Identify 2-3 key concepts that benefit from hands-on practice
3. Design exercises that build on each other
4. Write clear success criteria (testable outcomes)
5. Create solutions that demonstrate best practices

**IMPORTANT: Verify Code with Web Research**

When writing exercises or code examples, ALWAYS verify accuracy by:

1. **Use Context7** to fetch latest SDK documentation:
   ```
   mcp__plugin_context7_context7__resolve-library-id("Anthropic SDK")
   mcp__plugin_context7_context7__query-docs("/anthropics/anthropic-sdk-python", "messages API create")
   ```

2. **Use WebFetch** to check official docs:
   - Anthropic API: https://docs.anthropic.com/en/api/
   - Agent SDK: https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/sdk
   - Claude Code: https://docs.anthropic.com/en/docs/claude-code

3. **Use WebSearch** for recent patterns and best practices

This ensures all code examples use current API signatures, correct model names, and up-to-date patterns. Never assume SDK methods exist - verify them first.
6. Validate all code with `bun infra/scripts/exercise-validator.ts`

### Exercise Validator (Unified Code Testing Tool)

The Exercise Validator (`infra/scripts/exercise-validator.ts`) provides hash-based caching for all code execution. Use it to:

1. **Run individual scripts** (exercises, examples):
   ```bash
   bun infra/scripts/exercise-validator.ts run examples/ch04/agent.ts
   bun infra/scripts/exercise-validator.ts run --force examples/ch04/agent.ts  # Force re-run
   ```

2. **Validate markdown code blocks** (end-to-end book testing):
   ```bash
   bun infra/scripts/exercise-validator.ts validate chapters/ch04.md -v
   bun infra/scripts/exercise-validator.ts validate --all -v  # All chapters
   bun infra/scripts/exercise-validator.ts validate --check chapters/ch04.md  # Check only, no execution
   ```

3. **Manage cache**:
   ```bash
   bun infra/scripts/exercise-validator.ts cache --stats   # View statistics
   bun infra/scripts/exercise-validator.ts cache --clear   # Clear cache
   bun infra/scripts/exercise-validator.ts cache --status examples/ch04/agent.ts
   ```

**How it works:**
- Computes SHA256 hash of script/code block content
- Skips execution if hash matches cached entry
- Stores results in `.exercise-cache.json`
- Supports timeout (30s default) for runaway scripts
- Validates bash, typescript, and javascript code blocks

**Skip markers** (add to code blocks to skip validation):
- `# skip-validation`
- `// skip-validation`
- `<!-- skip-validation -->`

**Use in RALPH loop:**
After writing code examples, validate them:
```bash
bun infra/scripts/exercise-validator.ts validate chapters/ch04.md -v
```

### How to Update tasks.json

When completing a task:
```json
// Before
{
  "id": "task-004",
  "status": "pending",  // <- Change this
  "score": 845
}

// After
{
  "id": "task-004",
  "status": "complete",   // <- Updated
  "completedAt": "2026-01-27T16:00:00Z"
}
```

Also update:
- `stats`: Aggregate counts at bottom of tasks.json
- Run `node scripts/update-queue.cjs` to recalculate scores

---

## Progress Tracking System

### claude-progress.txt (Primary State File)

This file is the **single source of truth** for what's happening. It uses a compaction strategy to prevent unbounded growth.

**Structure:**

```
# Compound Engineering Book - Progress Log

## Current Status (Updated: YYYY-MM-DD HH:MM)
- Phase: [PRD Completion | Chapter Writing | Diagrams | Review | Polish]
- Active Chapter: ch07
- Last Completed: ch06.md first draft
- Blockers: None

## Recent Activity (Last 10 Entries)
[Keep only the 10 most recent entries here]

### YYYY-MM-DD HH:MM - [Task Title]
- What: [Brief description]
- Files: [Changed files]
- Outcome: [Success/Partial/Blocked]
- Next: [Recommended next action]

## Compacted History
[Summarized older entries, grouped by week or milestone]

### Week of YYYY-MM-DD
- Completed: 5 chapter PRDs, 2 first drafts
- Issues resolved: X, Y
- Key decisions: Z
```

**Compaction Rules:**

1. Keep detailed entries for the **last 10 sessions**
2. When adding entry #11, compact oldest entry into weekly summary
3. Weekly summaries live in "Compacted History" section
4. Monthly: Compact weekly summaries into monthly summary

**Auto-Compaction Trigger:**

When `claude-progress.txt` exceeds **2000 lines**, immediately compact it to **1000 lines**:

```bash
# Check line count
wc -l claude-progress.txt

# If > 2000 lines, compact by:
# 1. Keep "Current Status" section (top ~20 lines)
# 2. Keep "Recent Activity" with last 10 entries (~100 lines)
# 3. Summarize everything else into "Compacted History" grouped by week
# 4. Target: ~1000 lines total
```

Compaction preserves:
- Current status and blockers
- Last 10 detailed session entries
- Weekly summaries of older work
- Key decisions and learnings

### tasks.json (Task Tracking)

```json
{
  "lastUpdated": "2026-01-27T16:00:00Z",
  "prds": {
    "ch01": { "status": "complete", "title": "The Compound Systems Engineer" }
  },
  "tasks": [
    {
      "id": "task-001",
      "type": "chapter",
      "title": "ch01: The Compound Systems Engineer",
      "status": "pending",
      "priority": "high",
      "score": 945,
      "subtasks": [
        { "id": "task-002", "title": "code_written", "status": "complete" },
        { "id": "task-003", "title": "code_tested", "status": "complete" },
        { "id": "task-004", "title": "reviewed", "status": "pending" }
      ]
    }
  ],
  "checkpoints": {
    "lastGoodCommit": "abc123",
    "lastSuccessfulTask": "task-003",
    "consecutiveFailures": 0
  },
  "stats": { "pending": 180, "complete": 25, "blocked": 0 }
}
```

### Task Priority (from tasks.json)

Work through tasks by priority:
1. **Blocked tasks** - Check if any tasks are blocked
2. **High priority** - Chapter work, critical fixes
3. **Medium priority** - Diagrams, cross-refs
4. **Normal priority** - KB articles, content
5. **Low priority** - Appendices, final review

**All tasks tracked in tasks.json** - no separate TASKS.md files.

### Task Discovery and Addition

When you discover new work items, add them to tasks.json:

**Adding a new task:**
```json
{
  "id": "task-XXX",
  "type": "fix",
  "title": "Fix broken link in ch05",
  "description": "Update reference to new chapter number",
  "status": "pending",
  "priority": "medium"
}
```

**Adding a subtask to existing task:**
```json
{
  "id": "task-XXX-sub",
  "parentId": "task-XXX",
  "type": "milestone",
  "title": "code tested",
  "status": "pending"
}
```

**Task statuses:** `pending` → `in_progress` → `complete`

**When completing a task:** Update status in tasks.json, update stats, then commit.

**Sources of new tasks:**
- Review agent outputs in `reviews/`
- Errors encountered during work
- Missing cross-references or term introductions
- Code that needs testing
- Diagrams mentioned in chapters but not yet created

### Task Queries (jq commands)

Use these to quickly find work:

```bash
# Get stats
jq '.stats' tasks.json

# List next 10 pending tasks
jq '.tasks[] | select(.status == "pending") | {id, type, title, priority}' tasks.json | head -40

# Count pending by type
jq '[.tasks[] | select(.status == "pending")] | group_by(.type) | map({type: .[0].type, count: length})' tasks.json

# Find high priority tasks
jq '.tasks[] | select(.priority == "high" and .status == "pending") | .title' tasks.json

# Get subtasks for a task
jq '.tasks[] | select(.id == "task-001") | .subtasks' tasks.json

# Find chapter tasks
jq '.tasks[] | select(.type == "chapter") | {id, title, subtaskCount: (.subtasks | length)}' tasks.json

# Get PRD for a chapter
jq '.prds.ch05' tasks.json
```

### Task Compaction

When completed tasks exceed 20 items, compact them:

```bash
# Move completed tasks to compacted section
jq '[.tasks[] | select(.status == "complete")] | length' tasks.json

# Or run the queue update script
node scripts/update-queue.cjs
```

**Compaction preserves:** id, title, completedAt (timestamp)
**Details preserved in:** git history

### @LEARNINGS.md (Accumulated Insights)

Every 5 iterations, capture learnings:
```markdown
### [Date] - [Brief Title]

**Context**: What were you working on?
**Observation**: What did you notice?
**Implication**: How should this change future work?
**Action**: Specific change to make
```

Reference: @LEARNINGS.md

---

## Reliability Features

### Circuit Breaker

RALPH stops automatically after 3 consecutive failures to prevent runaway loops:

```bash
# Check circuit breaker status
jq '.checkpoints' tasks.json

# Reset after fixing issues
jq '.checkpoints.consecutiveFailures = 0 | .checkpoints.circuitBreakerTripped = false' tasks.json
```

**Triggers:** No new git commit after an iteration (indicates task wasn't completed)

### Checkpoints

After each successful task, RALPH saves a checkpoint:

```json
{
  "checkpoints": {
    "lastGoodCommit": "abc123",
    "lastSuccessfulTask": "task-045",
    "lastCheckpoint": "2026-01-27T15:30:00Z",
    "consecutiveFailures": 0
  }
}
```

**Recovery:** If things go wrong, rollback to `lastGoodCommit`

### Health Checks

Run manually or automatically every review cycle:

```bash
./scripts/health-check.sh
```

**Checks:**
- RALPH process running
- Recent git commits
- Task progress
- Log errors
- Disk space
- Progress file size

### Task Validation

Validate tasks.json structure and fix stats:

```bash
node scripts/validate-tasks.cjs        # Check only
node scripts/validate-tasks.cjs --fix  # Fix stats
```

**Validates:**
- Task structure (id, type, title, status)
- Dependency references exist
- No circular dependencies
- Stats match actual counts

### Dependencies

Tasks can declare blockers:

```json
{
  "id": "task-050",
  "blockedBy": ["task-045", "task-046"],
  "status": "blocked"
}
```

**Rules:**
- Don't start blocked tasks
- When blocker completes, update blocked task status
- Circular dependencies are errors

### Time Tracking

Tasks track timestamps:

```json
{
  "createdAt": "2026-01-27T14:00:00Z",
  "startedAt": "2026-01-27T15:30:00Z",
  "completedAt": "2026-01-27T16:00:00Z",
  "estimatedMinutes": 30
}
```

**Update when:**
- `startedAt`: Set when changing status to `in_progress`
- `completedAt`: Set when changing status to `complete`

---

## Project Structure

```
compound-engineering-book/
├── CLAUDE.md              # This file (agent instructions)
├── LEARNINGS.md           # Accumulated insights
├── claude-progress.txt    # Progress state (with compaction)
├── tasks.json             # Task queue and tracking
├── init.sh                # Environment verification script
├── prds/
│   ├── index.md           # Master PRD
│   ├── toc.md             # Table of contents
│   └── ch01-ch12.md       # Chapter PRDs
├── chapters/              # Actual book content
├── exercises/             # Try It Yourself exercises per chapter
├── assets/diagrams/       # Mermaid/Excalidraw diagrams
├── reviews/               # Review agent outputs
├── scripts/
│   └── ralph.sh           # RALPH loop runner
└── prompts/
    ├── writer.md          # Chapter writing prompt
    ├── reviewer.md        # Review prompt
    ├── diagram-check.md   # Diagram checker
    └── leanpub-format.md  # Leanpub formatting
```

---

## Source Knowledge Base

The knowledge base is located at `~/Desktop/knowledge-base`. Use `@` imports to reference source material:

Key sources (use these `@` imports in CLAUDE.md or when referencing):
- `@~/Desktop/knowledge-base/01-Compound-Engineering/context-engineering/` - 90+ articles
- `@~/Desktop/knowledge-base/01-Compound-Engineering/my-doctrine.md` - Core philosophy
- `@~/Desktop/knowledge-base/01-Compound-Engineering/index.md` - Topic overview

---

## Writing Conventions

### Style

1. **No em dashes (—)** - Use periods or commas. Em dashes are AI-text tells.
2. **Active voice** - "Claude reads the file" not "The file is read"
3. **Second person** - Address reader as "you"
4. **Varied sentence structure** - Mix short and long sentences
5. **Concrete examples** - Every concept needs runnable code

### AI Slop Blacklist

Never use these words/phrases:
- "delve", "crucial", "pivotal", "robust"
- "cutting-edge", "game-changer", "leverage" (as verb)
- "Additionally", "Furthermore", "Moreover"
- "It's important to note", "It could be argued"
- "In many ways", "One might say"

### Chapter Standards

- **Word count**: 2,500-4,000 words per chapter
- **Code examples**: 3-5 per chapter, syntactically correct
- **Diagrams**: 2-4 per chapter
- **Exercises**: 2-3 "Try It Yourself" per chapter
- **Cross-references**: Link to related chapters

---

## Custom Subagents

All agents are defined in `.claude/agents/` and can be used both in the RALPH loop and interactively via the Task tool.

### Review Agents (Run Every 6 Iterations)

These agents run in the review cycle to catch issues early.

#### slop-checker
Scans for AI-generated text tells:
- Words: delve, crucial, pivotal, robust, cutting-edge, game-changer
- Phrases: Additionally, Furthermore, Moreover, It's important to note
- Repetitive patterns and overused terms

#### diagram-reviewer
Identifies diagram opportunities:
- Process flows (3+ steps)
- Architecture layers and components
- Decision trees and state machines
- Generates Mermaid code drafts

#### tech-accuracy
Validates technical correctness:
- Code syntax for stated language
- Claude Code tool names and CLI syntax
- Configuration and API accuracy
- Terminology consistency

#### term-intro-checker
Ensures acronyms and technical terms are properly introduced:
- Acronyms defined on first use (e.g., "Domain-Driven Design (DDD)")
- Technical jargon explained in context
- Tool names introduced with brief descriptions
- Common acronyms: DDD, OTEL, API, CRUD, CLI, CI/CD, K8s, LLM, PRD, MCP

#### oreilly-style
Applies O'Reilly Media publishing standards:
- Heading capitalization (Title Case for A/B, sentence case for C)
- Cross-reference formatting (specific refs before figures/tables)
- Typography conventions (italic for filenames, constant width for code)
- Word list preferences (email, website, frontend, backend, etc.)
- Inclusive language checks

#### cross-ref-validator
Checks internal references:
- Chapter links work
- PRD to chapter alignment
- Broken markdown links
- Section reference accuracy

#### progress-summarizer
Creates status reports:
- Completion percentage by milestone
- Quality metrics from other reviews
- Velocity and estimated sessions remaining
- Top 5 priority actions

---

## RALPH Loop Commands

```bash
# Default: 3 hours, infinite iterations, review every 6
./scripts/ralph.sh

# Run overnight (8 hours)
./scripts/ralph.sh --max-hours 8

# Quick sprint (1 hour, review every 3)
./scripts/ralph.sh --max-hours 1 --review-every 3

# Limit iterations (0 = infinite, default)
./scripts/ralph.sh --max-iterations 50

# Full overnight session
./scripts/ralph.sh --max-hours 10 --review-every 8

# Environment variables also work
MAX_HOURS=12 REVIEW_EVERY=10 ./scripts/ralph.sh
```

---

## Quality Gates

Before marking a chapter complete:

- [ ] Word count in range (2,500-4,000)
- [ ] All code examples tested
- [ ] No em dashes (grep for "—")
- [ ] No blacklisted AI phrases
- [ ] Diagrams created for complex concepts
- [ ] Cross-references added
- [ ] Exercises included
- [ ] Proofread for flow

---

## Git Conventions

Commit message format:
```
[chapter/prd/review/infra]: Brief description

- Detailed change 1
- Detailed change 2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Examples:
```
[chapter]: Add first draft of ch07 context engineering

- 3,200 words covering information theory foundations
- 4 code examples for progressive disclosure
- Mermaid diagram for context window anatomy

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Failure Recovery

### If agent gets stuck:
1. Document the blocker in TASKS.md under "Blockers & Notes"
2. Move to the next task
3. Create a specific task to resolve the blocker later

### If environment is broken:
1. Run `git status` to see uncommitted changes
2. If needed, `git stash` or `git checkout .` to reset
3. Read `claude-progress.txt` for last known good state
4. Resume from there

### If progress.txt is corrupted:
1. Reconstruct from `git log`
2. Read `tasks.json` for task and milestone status
3. Create fresh progress.txt with current state

---

## Known Failure Modes (for TypeScript Port)

### EPIPE Error (Error: write EPIPE / ERR_STREAM_DESTROYED)

**What it is:**
EPIPE is a Unix error that occurs when a process tries to write to a pipe whose reading end has been closed. In Node.js, this manifests as `Error: write EPIPE` or `Error [ERR_STREAM_DESTROYED]: Cannot call write after a stream was destroyed`.

**When it happens:**
- Claude Code CLI running in print mode (`-p`) for long-running operations
- The timeout command (gtimeout) terminates the process before output completes
- Parent shell/script closes stdout before Claude finishes writing
- Particularly common during review cycles that spawn multiple sub-agents

**Root cause:**
The Claude CLI writes output asynchronously. When the receiving pipe closes (due to timeout, parent exit, or signal), pending writes fail with EPIPE. This is a race condition between output generation and pipe lifecycle.

**Affected versions:**
- Claude Code 2.1.17-2.1.20 (all have this issue in print mode)
- More frequent with complex prompts that generate lots of output

**Workarounds:**
1. Capture output to file first, then cat: `cmd > file 2>&1; cat file`
2. Increase timeout significantly (600s+ for review cycles)
3. Detect EPIPE in output and treat as retryable failure
4. Use `--signal=TERM --kill-after=30` for graceful timeout

**TypeScript port considerations:**
- Use proper stream error handling with `.on('error', handler)`
- Consider buffering output before writing to avoid partial writes
- Implement retry logic for EPIPE errors
- Don't rely on stdout for long-running operations; write to files instead

### API Concurrency Error (400: tool use concurrency issues)

**What it is:**
Claude API returns HTTP 400 with message about "tool use concurrency issues" or "tool_use ids were found without tool_result blocks".

**When it happens:**
- Multiple parallel tool calls in a single prompt
- Multiple Claude sessions competing for API slots
- Bug in Claude Code 2.1.18-2.1.20 print mode

**Workaround:**
- Downgrade to Claude Code 2.1.17: `npm install -g @anthropic-ai/claude-code@2.1.17`
- Run tool calls sequentially instead of parallel
- Close other Claude sessions

**TypeScript port considerations:**
- Implement request queuing to avoid concurrent tool calls
- Add exponential backoff for 400 errors
- Track tool_use IDs and ensure matching tool_result blocks

---

## External References

- [Anthropic: Effective Harnesses for Long-Running Agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Geoffrey Huntley: RALPH Technique](https://ghuntley.com/ralph)
- [Claude Code Documentation](https://code.claude.com/docs/llms.txt)
- [Leanpub Manual](https://leanpub.com/help/manual)

---

## Book Details

**Title**: Compound Engineering: Master AI-Assisted Development with Claude Code

**Target Audience**: Software engineers transitioning to AI-assisted development

**Core Teaching Objectives**:
This book teaches three interrelated skills together:

1. **Claude Code Mastery**: Hands-on proficiency with Claude Code CLI, CLAUDE.md files, hooks, sub-agents, MCP servers, and the Agent SDK for building production AI systems

2. **Systems Thinking**: Understanding information theory, context engineering, verification ladders, and quality gates as interconnected systems that compound over time

3. **Compound Engineering Leverage**: The meta-skill of orchestrating AI tools to build systems that build systems. Moving from typing code to directing AI agents that compound your engineering output.

**Structure**:
- Part I: Foundations (Ch 1-3) - Beginner
- Part II: Core Techniques (Ch 4-6) - Intermediate
- Part III: Advanced Patterns (Ch 7-9) - Advanced
- Part IV: Production Systems (Ch 10-12) - Expert
- Appendices A-D

**Word Count Target**: 45,000-57,000 words

**Publishing**: Leanpub (Markua format)

---

## Improving Content with Context7 and Knowledge Base

When writing or improving chapters, use these resources:

### Context7 MCP Plugin
Use the Context7 plugin to query up-to-date documentation for any library:
```
# Resolve library ID first
mcp__plugin_context7_context7__resolve-library-id("Claude Agent SDK")

# Then query docs
mcp__plugin_context7_context7__query-docs("/websites/platform_claude_en_agent-sdk", "custom tools MCP human approval")
```

Key libraries for this book:
- `/websites/platform_claude_en_agent-sdk` - Claude Agent SDK docs (868 snippets)
- `/anthropics/claude-agent-sdk-python` - Python SDK (59 snippets)
- `/anthropics/claude-agent-sdk-typescript` - TypeScript SDK (31 snippets)

### Knowledge Base (`~/Desktop/knowledge-base`)
Source articles for all chapters. Key directories:
- `01-Compound-Engineering/context-engineering/` - 90+ articles on context, agents, verification
- `01-Compound-Engineering/my-doctrine.md` - Core philosophy
- `01-Compound-Engineering/index.md` - Topic overview

**Workflow for improving content:**
1. Read the relevant PRD to understand chapter scope
2. Query Context7 for latest SDK patterns and examples
3. Cross-reference with knowledge base articles
4. Update PRD or chapter with accurate, current information
5. Verify code examples work with latest SDK versions
