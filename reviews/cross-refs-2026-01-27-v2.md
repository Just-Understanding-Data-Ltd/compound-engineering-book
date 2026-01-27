# Cross-Reference Validation - 2026-01-27 (v2)

**Validator**: Claude Opus 4.5
**Scope**: All files in `chapters/` and `prds/`

---

## Summary

- **Files scanned**: 15 chapters, 16 PRD files
- **Issues found**: 12 (Broken links: 3, Bad refs: 3, Misalignments: 6)

| Category | Count | Critical |
|----------|-------|----------|
| Broken Links | 3 | 3 |
| Incorrect Chapter Numbers | 3 | 3 |
| Missing Cross-Ref Sections | 5 | 0 |
| PRD Naming Misalignment | 6 | 0 |

**Status**: 6 critical issues require immediate fixes before publishing.

---

## Broken Links

| File | Line | Link | Issue |
|------|------|------|-------|
| ch01-the-compound-systems-engineer.md | 359 | `[Chapter 7: Context Engineering Deep Dive](ch07-context-engineering-deep-dive.md)` | **BROKEN** - File does not exist. Should be `ch09-context-engineering-deep-dive.md` |
| ch01-the-compound-systems-engineer.md | 360 | `[Chapter 8: The RALPH Loop](ch08-the-ralph-loop.md)` | **BROKEN** - File does not exist. Should be `ch10-the-ralph-loop.md` |
| ch01-the-compound-systems-engineer.md | 361 | `[Chapter 10: Building the Harness](ch10-building-the-harness.md)` | **BROKEN** - File does not exist. Should be `ch13-building-the-harness.md` |

---

## Chapter Reference Issues

| File | Line | Reference | Issue |
|------|------|-----------|-------|
| ch01-the-compound-systems-engineer.md | 359 | "Chapter 7: Context Engineering" | **WRONG NUMBER** - Context Engineering is Chapter 9, not 7 |
| ch01-the-compound-systems-engineer.md | 360 | "Chapter 8: The RALPH Loop" | **WRONG NUMBER** - RALPH Loop is Chapter 10, not 8 |
| ch01-the-compound-systems-engineer.md | 361 | "Chapter 10: Building the Harness" | **WRONG NUMBER** - Building the Harness is Chapter 13, not 10 |

### Root Cause

The ch01 cross-references use the OLD chapter numbering from before four new chapters were added:
- ch03 (Prompting Fundamentals) - NEW
- ch08 (Error Handling) - NEW
- ch12 (Development Workflows) - NEW
- ch15 (Model Strategy) - NEW

This shifted all subsequent chapters forward by 1-4 positions.

### Recommended Fix

Replace lines 358-361 in `ch01-the-compound-systems-engineer.md`:

```markdown
*Related chapters:*
- [Chapter 9: Context Engineering Deep Dive](ch09-context-engineering-deep-dive.md) for deep dives on constraints and observability
- [Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md) for the practical execution system
- [Chapter 13: Building the Harness](ch13-building-the-harness.md) for implementing the four-layer infrastructure
```

---

## PRD Misalignments

The PRD file naming does NOT match actual chapter numbers:

| PRD File | PRD Title | Actual Chapter |
|----------|-----------|----------------|
| prds/ch03.md | Writing Your First CLAUDE.md | ch04 |
| prds/ch04.md | The 12-Factor Agent | ch05 |
| prds/ch05.md | The Verification Ladder | ch06 |
| prds/ch06.md | Quality Gates That Compound | ch07 |
| prds/ch07.md | Context Engineering Deep Dive | ch09 |
| prds/ch08.md | The RALPH Loop | ch10 |
| prds/ch09.md | Sub-Agent Architecture | ch11 |
| prds/ch10.md | Building the Harness | ch13 |
| prds/ch11.md | The Meta-Engineer Playbook | ch14 |

**Status**: Documented in features.json mapping. Low priority to rename files.

### PRD ch01 Cross-References Are Outdated

The ch01 PRD (prds/ch01.md) section 8 references chapters that no longer exist:
- "Chapter 2: Building the Harness" - Should be "Chapter 2: Getting Started with Claude Code"
- "Chapter 3: Agents as Leverage" - Should be "Chapter 3: Prompting Fundamentals"
- etc.

**Status**: Low priority since PRDs are reference docs, not published content.

---

## Missing Cross-Reference Sections

Chapters missing the `## Related Chapters` or `*Related chapters:*` section:

| Chapter | Status | Recommendation |
|---------|--------|----------------|
| ch04-writing-your-first-claude-md.md | **MISSING** | Add related chapters section |
| ch05-the-12-factor-agent.md | **MISSING** | Add related chapters section |
| ch07-quality-gates-that-compound.md | **MISSING** | Add related chapters section |
| ch09-context-engineering-deep-dive.md | **MISSING** | Add related chapters section |
| ch06-the-verification-ladder.md | Incomplete | Has partial section, needs expansion |

### Chapters with Complete Cross-Reference Sections (Use as Model)

- ch02 (lines 459-463) - Good example
- ch03 (lines 492-496) - Good example with links
- ch08 (lines 693-700) - Good example
- ch10 (lines 538-545) - Good example
- ch11 (lines 718-724) - Good example
- ch12 (lines 618-623) - Good example
- ch13 (lines 612-618) - Good example
- ch14 (lines 671-677) - Good example
- ch15 (lines 916-920) - Good example

---

## Word Count Analysis

All chapters are within target range (2,500-4,000 words):

| Chapter | Words | Target | Status |
|---------|-------|--------|--------|
| ch01 | 2,573 | 2,500-4,000 | OK |
| ch02 | 2,588 | 2,500-4,000 | OK |
| ch03 | 2,568 | 2,500-4,000 | OK |
| ch04 | 2,767 | 2,500-4,000 | OK |
| ch05 | 2,499 | 2,500-4,000 | BORDERLINE (1 word under) |
| ch06 | 2,816 | 2,500-4,000 | OK |
| ch07 | 2,838 | 2,500-4,000 | OK |
| ch08 | 3,133 | 2,500-4,000 | OK |
| ch09 | 2,673 | 2,500-4,000 | OK |
| ch10 | 2,974 | 2,500-4,000 | OK |
| ch11 | 3,294 | 2,500-4,000 | OK |
| ch12 | 3,043 | 2,500-4,000 | OK |
| ch13 | 3,316 | 2,500-4,000 | OK |
| ch14 | 3,511 | 2,500-4,000 | OK |
| ch15 | 3,667 | 2,500-4,000 | OK |

**Total**: 44,260 words (Target: 45,000-57,000)

---

## Asset References

All diagram files exist in `assets/diagrams/`:
- ch01: compound-flywheel.md, three-levels-pyramid.md, portfolio-vs-single-bet.md, feedback-loop-observability.md
- ch02: agent-vs-chat.md, tool-ecosystem-radial.md, two-mode-mental-model.md
- ch03: prompt-anatomy.md
- ch04: claudemd-hierarchy.md
- ch05: 12factor-overview.md
- ch06: verification-ladder.md
- ch07: quality-gates.md
- ch08: error-diagnostic.md
- ch09: context-window.md
- ch10: ralph-loop.md
- ch11: subagent-architecture.md
- ch12: workflows.md
- ch13: harness-architecture.md
- ch14: six-waves.md
- ch15: model-selection.md

**Status**: All diagram placeholder files present. No chapters currently embed images inline.

---

## Priority Fixes

### Critical (Must Fix Before Publishing)

1. **Fix ch01 broken links** (3 issues at lines 359-361)
   - Change ch07 -> ch09
   - Change ch08 -> ch10
   - Change ch10 -> ch13

### Medium Priority

2. **Add Related Chapters sections** to ch04, ch05, ch07, ch09

3. **Complete ch06 cross-reference section**

### Low Priority

4. **Update PRD ch01 cross-references** (section 8)

5. **Consider renaming PRD files** to match actual chapter numbers (optional since mapping exists in features.json)

---

## Tasks to Add to tasks.json

```json
[
  {
    "id": "fix-ch01-cross-refs",
    "type": "fix",
    "title": "Fix broken cross-references in ch01 (lines 359-361)",
    "priority": "critical",
    "description": "Update chapter numbers and file names: ch07->ch09, ch08->ch10, ch10->ch13"
  },
  {
    "id": "add-ch04-related-chapters",
    "type": "fix",
    "title": "Add Related Chapters section to ch04",
    "priority": "medium"
  },
  {
    "id": "add-ch05-related-chapters",
    "type": "fix",
    "title": "Add Related Chapters section to ch05",
    "priority": "medium"
  },
  {
    "id": "add-ch07-related-chapters",
    "type": "fix",
    "title": "Add Related Chapters section to ch07",
    "priority": "medium"
  },
  {
    "id": "add-ch09-related-chapters",
    "type": "fix",
    "title": "Add Related Chapters section to ch09",
    "priority": "medium"
  }
]
```

---

*Generated by cross-ref-validator agent*
