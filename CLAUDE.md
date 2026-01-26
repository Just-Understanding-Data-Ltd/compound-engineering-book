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
3. Read TASKS.md                    # Task queue
4. git log --oneline -10            # Recent commits
5. Read features.json               # Milestone status
```

### Session Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Get up to speed (protocol above)                        │
│  2. Choose FIRST incomplete task from TASKS.md              │
│  3. Read relevant source from @kb/                          │
│  4. Complete the single task                                │
│  5. Verify work (word count, formatting, examples)          │
│  6. Update TASKS.md (mark [x])                              │
│  7. Update claude-progress.txt (add entry)                  │
│  8. Update features.json if milestone reached               │
│  9. Git commit with descriptive message                     │
│  10. Exit cleanly for fresh context                         │
└─────────────────────────────────────────────────────────────┘
```

### Critical Rules

- **ONE task per session**. No more.
- **Leave environment clean**. Next agent should be able to start immediately.
- **Document blockers**. If stuck, write it down and move on.
- **Never delete completed work** without explicit reason.
- **Commit after every task**. Memory lives in git.

---

## Context Recovery After Compaction

When context is compacted, the RALPH loop re-injects:
1. **Full CLAUDE.md** - All project instructions
2. **PRD Index** - Status of all PRDs from features.json
3. **Task Queue** - First 10 incomplete tasks from TASKS.md

This means you always have what you need to continue, even after compaction.

### What to Read on Each Iteration

```
1. pwd                           # Confirm directory
2. claude-progress.txt           # What happened recently
3. features.json                 # Detailed milestone status
4. git log --oneline -5          # Recent commits
5. The relevant PRD              # If working on a chapter
```

---

## Completion Criteria

### PRD Completion

A PRD is **COMPLETE** when:
- Status in `features.json.prds[chXX].status` = "complete"
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

A chapter is **COMPLETE** when all milestones in `features.json.chapters[chXX].milestones` are true:

| Milestone | Criteria |
|-----------|----------|
| `prd_complete` | PRD exists and is finalized |
| `first_draft` | Content written to `chapters/chXX-title.md` |
| `reviewed` | Passed review (no AI slop, technical accuracy) |
| `diagrams_complete` | All required diagrams created in `assets/diagrams/` |
| `exercises_added` | 2-3 "Try It Yourself" exercises included |
| `final` | Ready for Leanpub publishing |

### How to Update features.json

When completing a milestone:
```json
// Before
"milestones": {
  "prd_complete": true,
  "first_draft": false,  // <- Change this
  ...
}

// After
"milestones": {
  "prd_complete": true,
  "first_draft": true,   // <- Updated
  ...
}
```

Also update:
- `wordCount`: Actual word count of chapter
- `status`: "not_started" | "in_progress" | "draft" | "review" | "complete"
- `stats`: Aggregate counts at bottom of features.json

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

### features.json (Milestone Tracking)

```json
{
  "lastUpdated": "2026-01-26T22:00:00Z",
  "chapters": [
    {
      "id": "ch01",
      "title": "The Compound Systems Engineer",
      "milestones": {
        "prd_complete": true,
        "first_draft": false,
        "reviewed": false,
        "diagrams_complete": false,
        "final": false
      },
      "wordCount": 0,
      "issues": []
    }
  ],
  "stats": {
    "totalChapters": 12,
    "prdsComplete": 12,
    "draftsComplete": 0,
    "reviewed": 0,
    "diagramsComplete": 0
  }
}
```

### TASKS.md (Task Queue)

Task format:
```
- [ ] [Task description] (Est: X sessions)
- [x] [Completed task] (Completed: YYYY-MM-DD)
```

Priority order:
1. Blockers and fixes first
2. Then sequential chapter work
3. Then improvements and polish

---

## Project Structure

```
compound-engineering-book/
├── CLAUDE.md              # This file (agent instructions)
├── TASKS.md               # Task queue
├── LEARNINGS.md           # Accumulated insights
├── claude-progress.txt    # Progress state (with compaction)
├── features.json          # Milestone tracking
├── init.sh                # Environment verification script
├── @kb -> knowledge-base  # Symlink to source material
├── prds/
│   ├── index.md           # Master PRD
│   ├── toc.md             # Table of contents
│   └── ch01-ch12.md       # Chapter PRDs
├── chapters/              # Actual book content
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

**Symlink**: `@kb` -> `/Users/jamesaphoenix/Desktop/knowledge-base`

Key directories:
- `@kb/01-Compound-Engineering/context-engineering/` - 90+ articles
- `@kb/01-Compound-Engineering/my-doctrine.md` - Core philosophy
- `@kb/01-Compound-Engineering/index.md` - Topic overview

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

### Review Agents (Run Every 5 Iterations)

These agents run in the review cycle to catch issues early.

#### slop-checker
Scans for AI-generated text tells:
- Em dashes
- Blacklisted phrases
- Passive voice overuse
- Repetitive patterns

#### diagram-reviewer
Identifies diagram opportunities:
- Process flows
- Architecture diagrams
- Hierarchies and comparisons
- Generates Mermaid drafts

#### tech-accuracy-reviewer
Validates technical correctness:
- Code syntax
- Tool name accuracy
- API references
- Terminology consistency

#### cross-ref-validator
Checks internal references:
- Chapter links
- PRD alignment
- Orphan content
- Section references

#### progress-summarizer
Creates status reports:
- Completion percentage
- Velocity metrics
- Issue aggregation
- Priority recommendations

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
2. Read `features.json` for milestone status
3. Create fresh progress.txt with current state

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

**Structure**:
- Part I: Foundations (Ch 1-3) - Beginner
- Part II: Core Techniques (Ch 4-6) - Intermediate
- Part III: Advanced Patterns (Ch 7-9) - Advanced
- Part IV: Production Systems (Ch 10-12) - Expert
- Appendices A-D

**Word Count Target**: 45,000-57,000 words

**Publishing**: Leanpub (Markua format)
