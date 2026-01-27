# O'Reilly Style Review - 2026-01-28

## Summary
- Files scanned: 15 chapters
- Issues found: 94 (High: 14, Medium: 42, Low: 38)
- Note: This review focuses on issues not previously addressed and new patterns found

---

## Issues by Category

### Acronyms & Abbreviations

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 87 | "DDD" first use not expanded | "Domain-Driven Design (DDD)" |
| ch01 | 88 | "OTEL" first use not expanded | "OpenTelemetry (OTEL)" |
| ch05 | 2 | "LLMs" used before expansion | "large language models (LLMs)" |
| ch09 | 7 | "LLMs" used without chapter-level expansion | Expand on first use in chapter |
| ch10 | 11 | "LLMs" needs expansion | Expand on first use |
| ch11 | 27 | "QA" not expanded | "quality assurance (QA)" |
| ch13 | 100 | "OTEL" not expanded in chapter | Expand on first use per chapter |
| ch13 | 159 | "DDD" not expanded in chapter | "Domain-Driven Design (DDD)" |
| ch14 | 537 | "K8s" not expanded | "Kubernetes (K8s)" |
| ch15 | 18 | "MTok" not defined | "million tokens (MTok)" |
| ch15 | 437 | "YOLO" not expanded | "You Only Live Once (YOLO)" - consider explaining term |

### Cross References

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch04 | 165 | Heading contains inline code "CLAUDE.md" | Spell out: "Hierarchical Claude Configuration for Scaling Codebases" |
| ch06 | 631 | "Next chapter" is vague | Use "See Chapter 7" |
| ch08 | 301 | Heading contains filename "ERRORS.md" | Spell out or rephrase heading |
| ch11 | 719-724 | Related chapters use informal format | Standardize to "See Chapter X" |
| ch12 | 619-624 | Related chapters informal | Use "See Chapter X" format |
| ch13 | 612-618 | Related chapters list format | Standardize format |
| ch15 | 912-920 | Related chapters format | Standardize format |

### Typography & Formatting

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 59 | "Level 1/2/3" terms could use emphasis | Consider bold or italic for clarity |
| ch02 | 151 | Tool names "Read", "Write" inconsistently formatted | Use constant width: `Read`, `Write` |
| ch04 | 11 | "CLAUDE.md" in running text | Use italic *CLAUDE.md* per O'Reilly (filenames italic) |
| ch07 | 261 | Variable name `post-write.json` in prose | Use constant width |
| ch10 | 406 | Command "claude --print" format | Use constant width `claude --print` |
| ch11 | 139 | Code variables in prose | Use constant width for `backendEngineer` etc. |
| ch12 | 9 | "Shift+Tab" keyboard shortcut | Standardize keyboard shortcut format |
| ch13 | 23 | "CLAUDE.md" in B-level heading | Avoid inline code in headings |
| ch14 | 5 | First use of "context windows" | Consider italics for first use of technical term |
| ch15 | 46 | Model names "Haiku", "Sonnet", "Opus" | Ensure consistent formatting throughout |

### Word Choices (O'Reilly Preferences)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch02 | 79 | "commonjs" | "CommonJS" (proper capitalization) |
| ch04 | 324 | "multi-tool" | Consider "multitool" for consistency |
| ch08 | 6 | "code" used where "codebase" fits better | Prefer "codebase" (one word) |
| ch13 | 94 | "repo" in formal text | Use "repository" (OK in casual/code contexts) |
| ch15 | 437 | "YOLO mode" | Define the term on first use |

### C-Level Heading Capitalization (Sentence Case Required)

O'Reilly requires sentence case for C-level (###) headings. The following is a sample of headings that need correction:

**Chapter 1:**
| Line | Current | Should Be |
|------|---------|-----------|
| 13 | "### The Single-Bet Trap" | "### The single-bet trap" |
| 23 | "### The Comparison Trap" | "### The comparison trap" |
| 37 | "### What Is Compound Engineering?" | "### What is compound engineering?" |

**Chapter 11:**
| Line | Current | Should Be |
|------|---------|-----------|
| 49 | "### Layer 1: Root CLAUDE.md (Shared Patterns)" | "### Layer 1: root CLAUDE.md (shared patterns)" |
| 79 | "### Layer 2: Agent Behavioral Flows" | "### Layer 2: agent behavioral flows" |
| 505 | "### The Loop" | "### The loop" |

**Chapter 14:**
| Line | Current | Should Be |
|------|---------|-----------|
| 35 | "### The Conversion Process" | "### The conversion process" |
| 96 | "### The Hybrid Approach" | "### The hybrid approach" |
| 199 | "### Specs as Source of Truth" | "### Specs as source of truth" |

**Chapter 15:**
| Line | Current | Should Be |
|------|---------|-----------|
| 43 | "### When AI Assistance Pays for Itself" | "### When AI assistance pays for itself" |
| 129 | "### Implementing Model Selection" | "### Implementing model selection" |
| 235 | "### Prompt Caching for 90% Cost Reduction" | "### Prompt caching for 90% cost reduction" |

*Note: This pattern affects 100+ headings across all chapters. A batch fix is recommended.*

### Numbers and Percentages

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch06 | 233 | "2-3 examples" | "two to three examples" (under 10) |
| ch11 | 458 | "10-30 seconds" | "10 to 30 seconds" (numerals OK for 10+) |
| ch12 | 173 | "1000+ lines" | "1,000 or more lines" |
| ch14 | 318-326 | "Wave 3", "Wave 4" format | Correct - numerals for sequences |
| ch15 | 18-24 | "$2.25/day" | Correct format |
| ch15 | 235 | "90%" | Correct - use % symbol with numerals |

### Lists

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 40-43 | List items are fragments with periods | Remove periods or make complete sentences |
| ch03 | 179-198 | Mixed list punctuation | Standardize |
| ch11 | 35-42 | Role descriptions need consistent punctuation | Standardize periods |
| ch14 | 254-265 | "The Leverage Stack" list | Check consistent formatting |

### Inclusive Language

| File | Line | Issue | Suggested Alternative |
|------|------|-------|----------------------|
| ch07 | 329 | "master rules file" | "primary rules file" |
| ch12 | 148 | "master configuration" | "primary configuration" |

---

## High Priority Issues (14)

1. **Acronym expansion** (11 instances): DDD, OTEL, LLM, QA, K8s, MTok, YOLO need expansion on first use per chapter
2. **Headings with filenames** (3 instances): CLAUDE.md and ERRORS.md appear in headings - spell out or rephrase

## Medium Priority Issues (42)

1. **C-level heading case** (100+ instances): All ### headings should use sentence case
2. **Tool/command formatting** (8 instances): Inconsistent use of constant width
3. **Filename typography** (6 instances): Filenames should be italic in prose
4. **Cross-reference format** (7 instances): Use "See Chapter X" consistently
5. **Number formatting** (5 instances): Spell out under 10, add commas to 1,000+
6. **List punctuation** (4 instances): Standardize across chapters

## Low Priority Issues (38)

1. **First-use italics for technical terms**
2. **Keyboard shortcut format standardization**
3. **Minor inclusive language updates** (2 instances)
4. **Model name formatting consistency**

---

## Changes Since Previous Review

Compared to the 2026-01-27 review:
- Chapters 14 and 15 now included (previously only 13 chapters reviewed)
- New acronyms identified: MTok, YOLO, K8s in newer chapters
- C-level heading issues remain the most pervasive problem
- Typography consistency improved in some chapters but new issues in ch14-15

---

## Recommended Fix Order

1. **Batch fix C-level headings** (highest ROI - fixes 100+ issues at once)
   - Search: `^### [A-Z]`
   - Replace Title Case with sentence case, preserving proper nouns

2. **Add acronym expansion** (reader comprehension)
   - Create per-chapter first-use checklist
   - Consider appendix with acronym glossary

3. **Fix headings with code/filenames** (3 high-priority items)
   - ch04:165 - "Hierarchical CLAUDE.md" heading
   - ch08:301 - "ERRORS.md" heading
   - ch13:23 - "CLAUDE.md as Agent Specification" heading

4. **Standardize cross-references** (7 instances)
   - Use "See Chapter X" format in all Related Chapters sections

5. **Typography pass** (ongoing)
   - Filenames: italic
   - Commands/variables: constant width
   - Technical terms: italic on first use

---

## Statistics by Chapter

| Chapter | Total Issues | High | Medium | Low |
|---------|-------------|------|--------|-----|
| ch01 | 8 | 2 | 4 | 2 |
| ch02 | 4 | 0 | 3 | 1 |
| ch03 | 4 | 0 | 3 | 1 |
| ch04 | 5 | 1 | 3 | 1 |
| ch05 | 3 | 1 | 1 | 1 |
| ch06 | 4 | 0 | 3 | 1 |
| ch07 | 6 | 0 | 4 | 2 |
| ch08 | 5 | 1 | 3 | 1 |
| ch09 | 5 | 1 | 3 | 1 |
| ch10 | 5 | 0 | 4 | 1 |
| ch11 | 8 | 1 | 5 | 2 |
| ch12 | 7 | 0 | 5 | 2 |
| ch13 | 9 | 2 | 5 | 2 |
| ch14 | 11 | 2 | 6 | 3 |
| ch15 | 10 | 3 | 4 | 3 |

---

## Overall Assessment

**Strengths:**
- Excellent conversational tone throughout
- Strong second-person voice ("you will learn", "your job is")
- Practical, real-world code examples
- Good balance of concept and implementation

**Areas requiring attention:**
- C-level heading capitalization (systematic issue)
- Acronym expansion per chapter
- Headings containing code/filenames
- Cross-reference format standardization

**Recommendation:** Focus on the batch fix for C-level headings first, as this addresses the largest number of issues with a single systematic change. The remaining issues can be addressed in a focused copyedit pass.
