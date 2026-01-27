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

### 2026-01-27 - Mermaid Diagram Structure and Multi-View Approach

**Context**: Creating diagrams for chapters 1 and 2 (iterations 1-5: three-levels-pyramid through tool-ecosystem-radial).

**Observation**: The most effective diagram files follow a consistent structure:
1. Diagram description (what concept it visualizes)
2. Primary Mermaid diagram (the main visual)
3. Alternative views (2-3 different perspectives on the same concept)
4. Usage notes (where in the chapter this appears)
5. Context from chapter (relevant quotes/concepts)

The multi-view approach is particularly valuable. For example, the tool-ecosystem-radial diagram includes:
- Primary flow view (understand → agent → act → observe loop)
- Circular cycle view (4-stage reasoning cycle)
- Tool categories breakdown (detailed descriptions)
- Simple reference table (quick lookup)

Different readers learn differently. Some prefer flowcharts, others prefer tables. Providing 3-4 views of the same concept increases accessibility without requiring separate diagrams.

**Implication**: Future diagrams should always include multiple views. This increases the chances that at least one view resonates with each reader. It also provides options during editing, allowing editors to choose the clearest view for the final book.

**Action**: When creating diagrams, always:
1. Start with a primary view that matches the chapter's narrative
2. Add 2-3 alternative views (table, flow, comparison)
3. Include "Usage" section linking to specific chapter lines
4. Copy relevant chapter context verbatim for reference

---

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

### 2026-01-27 - Term Introduction vs AI Slop as Complementary Review Passes

**Context**: Reviewing ch01 for the "reviewed" milestone (iteration 10).

**Observation**: A chapter can pass all AI slop checks (no em dashes, no blacklisted phrases like "delve" or "crucial") while still having undefined acronyms that confuse readers. In ch01, the AI slop checker found zero issues, but the term introduction check found two undefined acronyms:
- "DDD" used without defining Domain-Driven Design
- "OTEL" used without defining OpenTelemetry

These are different categories of reader friction:
- AI slop creates skepticism ("this sounds like generic AI text")
- Undefined terms create confusion ("what does this acronym mean?")

Both hurt readability, but they require different detection methods.

**Implication**: The review process should run multiple complementary passes rather than relying on a single "review" step. The slop-checker agent catches stylistic issues; the term-intro-checker agent catches comprehension issues. Neither alone is sufficient.

**Action**: Always run both slop-checker AND term-intro-checker during the "reviewed" milestone. Consider adding a checklist to CLAUDE.md that explicitly lists review passes:
1. AI slop check (em dashes, blacklisted phrases)
2. Term introduction check (acronyms defined on first use)
3. Technical accuracy check (code syntax, tool names)
4. Cross-reference validation (links work)

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
