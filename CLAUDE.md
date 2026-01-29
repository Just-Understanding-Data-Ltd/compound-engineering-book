# Compound Engineering Book

> A comprehensive guide to AI-assisted software development: from beginner to expert with Claude Code.

**Source**: [Anthropic Long-Running Agent Harness](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents) | [Geoffrey Huntley's RALPH](https://ghuntley.com/ralph)

---

## Agent Operating Instructions

This project uses a **two-phase agent harness** for long-running work:

1. **Initializer Agent** (first run): Sets up environment, creates tracking files
2. **Coding Agent** (each iteration): Makes incremental progress, commits, updates tracking

Never create a TASKS.md file. It is not used. Only use tasks.json.

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

| Factor         | Values                                                           |
| -------------- | ---------------------------------------------------------------- |
| Priority       | critical: 1000, high: 750, medium: 500, normal: 250, low: 100    |
| Type           | chapter: 100, fix: 80, kb-article: 60, diagram: 40, appendix: 20 |
| Chapter        | Earlier chapters score higher (ch01 > ch15)                      |
| Blocking       | +25 per task this blocks                                         |
| Age            | +50 if waiting 24h+, +100 if 48h+                                |
| Review flagged | +200                                                             |

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

| Milestone           | Criteria                                                 |
| ------------------- | -------------------------------------------------------- |
| `prd_complete`      | PRD exists and is finalized                              |
| `first_draft`       | Content written to `chapters/chXX-title.md`              |
| `code_written`      | All code examples written to `examples/chXX/`            |
| `code_tested`       | All code compiles/runs, tests pass with cached responses |
| `reviewed`          | Passed review (no AI slop, technical accuracy)           |
| `diagrams_complete` | All required diagrams created in `assets/diagrams/`      |
| `exercises_added`   | 2-3 "Try It Yourself" exercises included                 |
| `final`             | Ready for Leanpub publishing                             |

### Code Testing Requirements

All code examples use **TypeScript only** with the Anthropic SDK or Agent SDK.

**CRITICAL: SDK Usage by Chapter**

| Chapters  | SDK                                                 | Focus                                        |
| --------- | --------------------------------------------------- | -------------------------------------------- |
| Ch01-Ch05 | Native Anthropic SDK (`@anthropic-ai/sdk`)          | API fundamentals, basic prompting, CLAUDE.md |
| Ch06-Ch15 | Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Custom agents, sub-agents, agentic patterns  |

**Ch01-Ch05: Native SDK (API Fundamentals)**

```typescript
// Native Anthropic SDK for learning API basics
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
});
```

**Ch06-Ch15: Agent SDK (Custom Agents)**

```typescript
// Agent SDK v2 for building custom agents
import {
  unstable_v2_prompt,
  unstable_v2_createSession,
} from "@anthropic-ai/claude-agent-sdk";

// One-shot agent prompt
const result = await unstable_v2_prompt(prompt, {
  model: "claude-sonnet-4-5-20250929",
});

// Multi-turn agent session
await using session = unstable_v2_createSession({
  model: "claude-sonnet-4-5-20250929",
});
await session.send("message");
for await (const msg of session.stream()) {
  /* handle response */
}
```

**WRONG: Standalone utility without SDK**

```typescript
function buildPrompt(config) {
  return `...`;
} // NO - must show SDK usage
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
  file: "src/app.ts",
  additions: ["const logger = createLogger();"],
  deletions: [],
}; // NO - agents see raw text, not structured data
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
import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";
const result = await unstable_v2_prompt("query", {
  model: "claude-sonnet-4-5-20250929",
});

// Multi-turn session
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";
await using session = unstable_v2_createSession({
  model: "claude-sonnet-4-5-20250929",
});
await session.send("message");
for await (const msg of session.stream()) {
  /* handle response */
}

// Resume session
import { unstable_v2_resumeSession } from "@anthropic-ai/claude-agent-sdk";
await using session = unstable_v2_resumeSession(sessionId, {
  model: "claude-sonnet-4-5-20250929",
});
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

| Aspect         | Convention                                        |
| -------------- | ------------------------------------------------- |
| Difficulty     | Progressive within chapter (easy → medium → hard) |
| Time           | 10-30 minutes per exercise                        |
| Code           | All code must be testable with Exercise Validator |
| Solutions      | Provide in `solutions/` subfolder, not inline     |
| Real-world     | Base on realistic scenarios, not toy examples     |
| Self-contained | Each exercise works independently                 |

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

This ensures all code examples use current API signatures, correct model names, and up-to-date patterns. Never assume SDK methods exist - verify them first. 6. Validate all code with `bun infra/scripts/exercise-validator.ts`

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

**Auto-Compaction Trigger:**

When `LEARNINGS.md` exceeds **40,000 characters**, immediately compact it to **~20,000 characters**:

```bash
# Check character count
wc -c LEARNINGS.md

# If > 40000 characters, compact by:
# 1. Keep the header and format section (top ~30 lines)
# 2. Keep the 10 most recent entries in full detail
# 3. Summarize older entries by theme/category:
#    - Group related learnings (e.g., "Typography", "Agent SDK", "Diagrams")
#    - Preserve key insights and actions, drop verbose context
# 4. Target: ~20,000 characters total
```

Compaction preserves:
- Header and format documentation
- Last 10 detailed learning entries
- Thematic summaries of older learnings with key actions
- Cross-references to git commits where full details live

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

## Image Generation for Book Figures

Use the **image-generator MCP server** (GPT Image) for professional book infographics. This replaces ASCII art and Mermaid diagrams with polished O'Reilly-style visuals.

### Design Philosophy: O'Reilly Technical Infographics

**CRITICAL STYLE RULES:**

1. **FLAT 2D ONLY** - Absolutely NO 3D effects, NO perspective, NO depth, NO shadows, NO gradients suggesting depth
2. **Infographic style** - NOT cartoon, NOT photo-realistic, NOT isometric
3. **Include text labels** - Clear, readable labels on diagram elements
4. **Minimal background** - Pure white background, completely clean
5. **Simple geometric shapes** - Rectangles, circles, arrows. No embellishments.
6. **O'Reilly aesthetic** - Think textbook diagrams, not marketing graphics

**DO NOT:**
- 3D effects of any kind (perspective, depth, shadows, gradients)
- Isometric or pseudo-3D illustrations
- Cartoon/childish graphics (rainbow colors, rounded bubbly shapes)
- Photo-realistic renders
- Dark/busy backgrounds
- Abstract art without clear meaning
- Generic stock illustration style
- Decorative elements that don't convey information

### MCP Server Setup

Configured in `.mcp.json`. Requires `OPENAI_API_KEY` environment variable.

```bash
# Test the MCP server
claude mcp get image-generator
```

### Master Prompt Template

```
Create a professional INFOGRAPHIC for an O'Reilly-style technical book about software engineering.

TOPIC: [What the diagram explains]
TYPE: [Pyramid | Pipeline | Cycle | Layers | Comparison | Flow]

CONTENT (include these exact labels):
- [Label 1]: [Brief description]
- [Label 2]: [Brief description]
- [Label 3]: [Brief description]
- [Label 4]: [Brief description]
- [Label 5]: [Brief description]

STYLE REQUIREMENTS:
- FLAT 2D ONLY - absolutely NO 3D, NO perspective, NO depth, NO shadows
- Pure white background, completely clean
- Simple geometric shapes: rectangles, circles, lines, arrows
- Modern sans-serif text labels (dark gray or black text)
- Color palette: Navy blue (#1e3a5f), Steel blue (#4682b4), Teal accent (#0d9488)
- NO gradients, NO shadows, NO embossing, NO decorative elements
- Textbook diagram quality - functional, not decorative
- 1024x1024 resolution
```

### Diagram Templates by Type

**Verification Ladder (5-Level Pyramid):**
```
Create a professional INFOGRAPHIC showing a 5-level verification pyramid for a technical book.

TOPIC: Software Testing Verification Ladder
TYPE: Pyramid/Staircase

CONTENT (label each level clearly):
- Level 1 (bottom, widest): "SYNTAX" - Code compiles
- Level 2: "RUNTIME" - Executes without crashes
- Level 3: "LOGIC" - Correct behavior
- Level 4: "INTEGRATION" - Components work together
- Level 5 (top, smallest): "E2E" - Full workflows pass

STYLE:
- Vertical staircase or pyramid, ascending left-to-right or bottom-to-top
- Each level a distinct horizontal bar with clear label
- Gradient from light blue (bottom) to dark navy (top)
- Small icons optional: checkmark, gear, brain, puzzle, user
- White background, clean professional infographic style
- NOT cartoon - think McKinsey or Gartner report quality
```

**Quality Gates Pipeline:**
```
Create a professional INFOGRAPHIC showing a quality gates pipeline for a technical book.

TOPIC: Code Quality Gates Pipeline
TYPE: Horizontal flow/pipeline

CONTENT (5 gates, left to right):
- Gate 1: "LINT" - Style checks
- Gate 2: "TYPE" - Type safety
- Gate 3: "TEST" - Unit tests
- Gate 4: "BUILD" - Compilation
- Gate 5: "DEPLOY" - Production ready

STYLE:
- Horizontal pipeline flowing left to right
- Each gate as a distinct checkpoint/barrier
- Code/data particles flowing through
- Green checkmarks for passed gates
- Clean white background
- Professional tech infographic, modern flat design
```

**Ratchet Effect (One-Way Progress):**
```
Create a professional INFOGRAPHIC showing a ratchet mechanism for a technical book.

TOPIC: Quality Ratchet - Progress Cannot Reverse
TYPE: Mechanical diagram

CONTENT (labeled components):
- "QUALITY LEVEL" - Current position indicator
- "RATCHET GEAR" - Main progress wheel
- "PAWL" - Prevents backward motion
- "FORWARD ONLY" - Direction arrow
- "BASELINE" - Minimum quality floor

STYLE:
- Technical illustration, blueprint-inspired
- Clean mechanical drawing with labels
- Blue/gray color scheme
- White background with subtle grid lines optional
- Professional engineering diagram quality
```

**RALPH Loop (4-Phase Cycle):**
```
Create a professional INFOGRAPHIC showing a 4-phase development cycle for a technical book.

TOPIC: RALPH Loop - Autonomous Agent Iteration Cycle
TYPE: Circular cycle

CONTENT (4 phases, clockwise):
- Phase 1: "READ" - Load context and state
- Phase 2: "ACT" - Execute one task
- Phase 3: "LOG" - Commit and document
- Phase 4: "PAUSE" - Clean exit for next iteration

STYLE:
- Circular diagram with 4 distinct segments
- Arrows showing clockwise flow
- Each segment clearly labeled
- Center could show "RALPH" or iteration icon
- Professional cycle diagram, not cartoon
- Navy/teal color scheme on white background
```

**Architecture Layers:**
```
Create a professional INFOGRAPHIC showing layered architecture for a technical book.

TOPIC: [Specific architecture name]
TYPE: Layered stack

CONTENT (layers, top to bottom or bottom to top):
- Layer 1: "[Name]" - [Purpose]
- Layer 2: "[Name]" - [Purpose]
- Layer 3: "[Name]" - [Purpose]
- Layer 4: "[Name]" - [Purpose]

STYLE:
- Horizontal stacked layers
- Clear boundaries between layers
- Arrows showing data/control flow direction
- Each layer labeled with name
- Professional architecture diagram
- Clean white background
```

### File Naming & Storage

**Absolute path for image generation:**
```
/Users/jamesaphoenix/Desktop/projects/just_understanding_data/compound-engineering-book/assets/images/
```

**Naming convention:**
```
ch[XX]-[concept-name].png

Examples:
- ch06-verification-ladder.png
- ch07-quality-gates-pipeline.png
- ch07-ratchet-effect.png
- ch10-ralph-loop-cycle.png
```

**Full path example for MCP tool:**
```
/Users/jamesaphoenix/Desktop/projects/just_understanding_data/compound-engineering-book/assets/images/ch06-verification-ladder.png
```

### Quality Checklist

Before accepting a generated image:
- [ ] Has clear, readable text labels
- [ ] White/light minimal background
- [ ] NOT cartoon or photo-realistic
- [ ] Professional infographic quality (O'Reilly/Manning level)
- [ ] Colors are professional (navy, steel blue, teal, gray)
- [ ] Would look good printed in a technical book
- [ ] Conveys the concept clearly without additional explanation

### Regeneration

If an image looks wrong:
1. Delete the bad image: `rm assets/images/ch[XX]-[name].png`
2. Refine the prompt with more specific style guidance
3. Regenerate with emphasis on "NOT cartoon, infographic style, O'Reilly quality"

**Circular Process / Cycle:**
```
Create a professional cycle diagram for a technical book.

CONCEPT: [Specific cycle, e.g., debugging cycle]
VISUAL METAPHOR: Continuous loop with distinct phases
STYLE: Modern infographic, clean geometric shapes
COLORS: Each phase a different shade in the blue-teal spectrum
LAYOUT: Circular with clockwise flow

SPECIFIC ELEMENTS:
- 4 distinct segments arranged in a circle
- Curved arrows connecting each segment
- Central hub connecting all phases
- Subtle icons representing each phase (no text)

REQUIREMENTS: NO text, balanced composition, professional presentation
```

**Architecture Layers:**
```
Create a professional layered architecture diagram for a technical book.

CONCEPT: [Specific architecture, e.g., agent memory tiers]
VISUAL METAPHOR: Stacked horizontal layers with connections
STYLE: Modern flat design, clean separation between layers
COLORS: Each layer a distinct shade, darker at bottom
LAYOUT: Vertical stack with clear boundaries

SPECIFIC ELEMENTS:
- [N] distinct horizontal layers
- Vertical connectors showing data flow between layers
- Each layer with subtle texture or pattern
- Clear visual separation with shadows or lines

REQUIREMENTS: NO text, clear hierarchy, professional corporate style
```

### File Naming Convention

```
assets/images/ch[XX]-[concept-name].png

Examples:
- assets/images/ch06-verification-ladder.png
- assets/images/ch07-quality-gates.png
- assets/images/ch07-ratchet-effect.png
- assets/images/ch08-debugging-cycle.png
- assets/images/ch09-context-window.png
```

### Usage with MCP Tool

```typescript
// Example: Generate verification ladder diagram
mcp__image_generator__generate_image({
  prompt: "Create a professional pyramid diagram...", // Use template above
  outputPath: "/absolute/path/to/assets/images/ch06-verification-ladder",
  size: "1024x1024"
})
```

### Integration with AsciiDoc

```asciidoc
[[fig-verification-ladder]]
.The Verification Ladder: Five levels of testing confidence
image::ch06-verification-ladder.png[Verification Ladder,width=600,align=center]
```

### Quality Checklist for Generated Images

- [ ] Clear visual hierarchy and focal point
- [ ] NO embedded text (verify before saving)
- [ ] Professional color palette (blues, grays, teal accents)
- [ ] Works on both light and dark backgrounds
- [ ] 1024x1024 resolution minimum
- [ ] Consistent style with other book diagrams
- [ ] Saved as PNG in assets/images/

---

## External References

- [Anthropic: Effective Harnesses for Long-Running Agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Geoffrey Huntley: RALPH Technique](https://ghuntley.com/ralph)
- [Claude Code Documentation](https://code.claude.com/docs/llms.txt)
- [Leanpub Manual](https://leanpub.com/help/manual)

---

## Book Details

**Title**: The Meta-Engineer: 10x Was the Floor

**Subtitle**: Building Autonomous AI Systems with Claude Code

**URL**: https://leanpub.com/the-meta-engineer

**Target Audience**: Software engineers transitioning to AI-assisted development

**Core Teaching Objectives**:
This book teaches three interrelated skills together:

1. **Claude Code Mastery**: Hands-on proficiency with Claude Code CLI, CLAUDE.md files, hooks, sub-agents, MCP servers, and the Agent SDK for building production AI systems

2. **Systems Thinking**: Understanding information theory, context engineering, verification ladders, and quality gates as interconnected systems that compound over time

3. **Meta-Engineering**: The practice of orchestrating AI tools to build systems that build systems. Moving from typing code to directing AI agents that compound your engineering output.

**Structure**:

- Part I: Foundations (Ch 1-3) - Beginner
- Part II: Core Techniques (Ch 4-6) - Intermediate
- Part III: Advanced Patterns (Ch 7-9) - Advanced
- Part IV: Production Systems (Ch 10-15) - Expert

**Word Count**: 54,132 words (target 45,000-57,000)

**Status**: ALL 151 TASKS COMPLETE - Ready for publication

**Publishing**: Leanpub (EPUB upload)

**Build Pipeline**:
```bash
./scripts/leanpub-build.sh    # Convert chapters to Markua
pandoc ... -o the-meta-engineer.epub  # Generate EPUB
# Upload to Leanpub
```

---

## Improving Content with Context7 and Knowledge Base

When writing or improving chapters, use these resources:

### Context7 MCP Plugin (REQUIRED for SDK Work)

**ALWAYS use Context7 before writing Agent SDK code.** This ensures you use current API patterns, not outdated ones.

```
# Step 1: Resolve library ID
mcp__plugin_context7_context7__resolve-library-id("Claude Agent SDK TypeScript")

# Step 2: Query for specific patterns
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "create session streaming messages custom tools")
```

**Key Library IDs for this book:**

| Library              | ID                                        | Snippets | Use For                  |
| -------------------- | ----------------------------------------- | -------- | ------------------------ |
| Agent SDK Docs       | `/websites/platform_claude_en_agent-sdk`  | 868      | Concepts, architecture   |
| Agent SDK TypeScript | `/anthropics/claude-agent-sdk-typescript` | 31       | TypeScript code patterns |
| Agent SDK Python     | `/anthropics/claude-agent-sdk-python`     | 59       | Python examples          |

**Common Context7 Queries for Agent SDK Migration:**

```
# Session management
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "unstable_v2_createSession unstable_v2_prompt multi-turn")

# Streaming responses
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "streaming message types assistant tool_call error handling")

# Custom tools
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "createSdkMcpServer tool zod schema custom tools")

# One-shot queries
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "query function prompt options workingDirectory")

# Session resumption
mcp__plugin_context7_context7__query-docs("/anthropics/claude-agent-sdk-typescript", "unstable_v2_resumeSession session_id checkpoint")
```

**Agent SDK Key Patterns (from Context7):**

```typescript
// One-shot query with streaming
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Analyze this code",
  options: { model: "claude-sonnet-4-5", workingDirectory: "/path" },
});

for await (const message of response) {
  if (message.type === "assistant") console.log(message.content);
}

// Multi-turn session
import {
  unstable_v2_createSession,
  unstable_v2_prompt,
} from "@anthropic-ai/claude-agent-sdk";

const session = await unstable_v2_createSession({
  model: "claude-sonnet-4-5",
  systemPrompt: "You are a coding assistant.",
});

const response = unstable_v2_prompt(session, { prompt: "Help me refactor" });
for await (const msg of response) {
  /* handle */
}

// Custom MCP tools
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const tools = createSdkMcpServer({
  name: "my-tools",
  tools: [
    tool("my_tool", "Description", { param: z.string() }, async (args) => {
      return { content: [{ type: "text", text: "result" }] };
    }),
  ],
});
```

### Knowledge Base (`~/Desktop/knowledge-base`)

Source articles for all chapters. Key directories:

- `01-Compound-Engineering/context-engineering/` - 90+ articles on context, agents, verification
- `01-Compound-Engineering/my-doctrine.md` - Core philosophy
- `01-Compound-Engineering/index.md` - Topic overview

**Workflow for Agent SDK Migration (ch06-ch15):**

1. Read the existing code file to understand current patterns
2. **Query Context7** for equivalent Agent SDK patterns
3. Identify which Agent SDK imports to use:
   - `query` for one-shot prompts
   - `unstable_v2_createSession` + `unstable_v2_prompt` for multi-turn
   - `createSdkMcpServer` + `tool` for custom tools
4. Rewrite the code using Agent SDK patterns
5. Update message handling to use streaming pattern (`for await...of`)
6. Test with `bun run` to verify it works
