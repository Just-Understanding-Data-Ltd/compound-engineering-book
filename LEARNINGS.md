# Learnings

> Accumulated insights from RALPH loop iterations. Each iteration adds to this file.

---

## Format

Each learning entry should follow this format:

```
### [Date] - [Brief Title]

**Context**: What were you working on?
**Observation**: What did you notice?
**Implication**: How should this change future work?
**Action**: Specific change to make (CLAUDE.md update, new convention, etc.)
```

---

## Entries

### 2026-01-28 - KB Article Structure and Cross-Referencing

**Context**: Creating KB articles for the Compound Engineering book (iterations 1-5: sub-agent-context-hierarchy through checkpoint-commit-patterns).

**Observation**: The most effective KB articles follow a consistent structure:
1. Frontmatter with metadata (title, taxonomy, difficulty, tags)
2. Summary (one paragraph)
3. Problem statement (what pain this addresses)
4. Solution overview (the pattern/approach)
5. Implementation with TypeScript code examples
6. Best practices (5-10 concrete recommendations)
7. Common pitfalls (what to avoid)
8. Related concepts (links to other KB articles)

The "Related Concepts" section is particularly valuable. It creates a web of interconnected knowledge rather than isolated documents. When writing the checkpoint-commit-patterns.md article, linking to agent-memory-patterns.md, incremental-development-pattern.md, and ralph-loop.md helped position the new article within the existing knowledge structure.

**Implication**: Future KB articles should maintain this structure for consistency. The cross-referencing pattern means each new article strengthens the overall knowledge base by connecting to existing content.

**Action**: When creating KB articles, always:
1. Start with the standard frontmatter template
2. Include 2-4 concrete TypeScript code examples
3. Add 5+ cross-references to related KB articles
4. End with external references for further reading

---

### 2026-01-28 - Git as External Memory for RALPH Loop

**Context**: Writing checkpoint-commit-patterns.md and reviewing how git integrates with agent memory patterns.

**Observation**: Git commits serve as the "save game" between RALPH loop iterations. Each iteration:
1. Reads git log to understand recent progress
2. Completes one task
3. Commits with descriptive message capturing intent
4. Exits cleanly for fresh context

The commit message becomes documentation for the next agent. Messages like "[progress]: complete task 3 of 7 - add user validation" provide context that file-based memory (progress.txt) complements but doesn't replace.

**Implication**: Commit messages in RALPH workflows should be structured differently than typical commits. They need to capture:
- What was accomplished
- Current state (tests passing, build status)
- What the next iteration should do

This is more verbose than conventional commits but necessary for agent-to-agent communication.

**Action**: Update commit message templates in CLAUDE.md to include explicit "Next:" section for RALPH workflows. Current convention already does this, but it should be emphasized.

---

### 2026-01-28 - Centralized Task Tracking in features.json

**Context**: Working through KB article creation tasks tracked in features.json rather than separate TASKS.md files.

**Observation**: Having all tasks in features.json provides several benefits:
1. Single source of truth (no sync issues between files)
2. Machine-parseable (scripts can read task status)
3. Colocated with milestones (tasks and progress together)
4. History in git (task transitions are committed)

The structure `tasks.kbArticlesToCreate[].status` makes it trivial to find the next pending task and mark it complete. Contrast with markdown TASKS.md files that require parsing checkbox syntax.

**Implication**: All task tracking for agent workflows should be JSON-based, not markdown-based. Markdown is great for human reading but poor for automation.

**Action**: Continue using features.json for all task tracking. If task lists grow too long (>50 items), implement compaction by moving completed tasks to a summary field.

---
