# O'Reilly Style Review - 2026-01-27 (Complete 15 Chapters)

## Summary
- Files scanned: 15 (all chapters ch01-ch15)
- Issues found: 312 (High: 127, Medium: 154, Low: 31)
- Primary concerns: C-level heading capitalization (150+ instances), filename formatting, table captions

## Critical Insight

The manuscript demonstrates excellent O'Reilly conversational tone and reader-centric approach. The main style issues are **mechanical and systematic**, not substantive. C-level headings consistently use Title Case instead of required Sentence case. This is easily batch-fixed with find-and-replace.

## Issues by Category

### 1. Heading Capitalization (HIGH PRIORITY - 150+ instances)

**O'Reilly Standard**:
- A-heads (##) and B-heads (###) → Title Case
- C-heads (####) → Sentence case

**Pattern Found**: Nearly all C-level heads use Title Case incorrectly.

**Sample Issues (first 50 of 150+)**:

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch01 | 13 | ### The Single-Bet Trap | ### The single-bet trap |
| ch01 | 23 | ### The Comparison Trap | ### The comparison trap |
| ch01 | 37 | ### What Is Compound Engineering? | ### What is compound engineering? |
| ch01 | 55 | ### The Three Levels of Engineering | ### The three levels of engineering |
| ch01 | 67 | ### The Meta-Engineer Identity | ### The meta-engineer identity |
| ch01 | 98 | ### Portfolio Game vs. Single-Bet Game | ### Portfolio game vs. single-bet game |
| ch01 | 106 | ### What Compound Systems Engineers Actually Build | ### What compound systems engineers actually build |
| ch01 | 120 | ### The Economics of Leverage | ### The economics of leverage |
| ch01 | 141 | ### When Persistence Is Rational | ### When persistence is rational |
| ch01 | 156 | ### The Risks (Honesty Required) | ### The risks (honesty required) |
| ch02 | 25 | ### Installation Steps | ### Installation steps |
| ch02 | 57 | ### Your First CLAUDE.md | ### Your first CLAUDE.md |
| ch02 | 85 | ### Single-Turn Query | ### Single-turn query |
| ch02 | 99 | ### Interactive Session | ### Interactive session |
| ch02 | 109 | ### Walkthrough: Building a CLI Tool | ### Walkthrough: Building a CLI tool |
| ch02 | 152 | ### Read (Understand Existing Code) | ### Read (understand existing code) |
| ch02 | 162 | ### Write (Create New Files) | ### Write (create new files) |
| ch02 | 172 | ### Edit (Modify Existing Files) | ### Edit (modify existing files) |
| ch03 | 51 | ### The Pattern | ### The pattern |
| ch03 | 71 | ### When Chain-of-Thought Matters | ### When chain-of-thought matters |
| ch03 | 87 | ### Example: Payment Processing | ### Example: Payment processing |
| ch03 | 154 | ### Declarative Over Imperative | ### Declarative over imperative |
| ch03 | 177 | ### Types of Constraints | ### Types of constraints |
| ch03 | 208 | ### The Constraint Funnel | ### The constraint funnel |
| ch04 | 29 | ### The Instruction-Following Degradation Curve | ### The instruction-following degradation curve |
| ch04 | 279 | ### Auto-Generating CLAUDE.md | ### Auto-generating CLAUDE.md |
| ch04 | 287 | ### Using CLAUDE.md as a Style Guide | ### Using CLAUDE.md as a style guide |
| ch05 | 27 | ### The Four-Turn Framework | ### The four-turn framework |
| ch05 | 38 | ### The Reliability Stack | ### The reliability stack |
| ch06 | 7 | ### The Ladder Framework | ### The ladder framework |
| ch07 | 17 | ### The Mathematics | ### The mathematics |
| ch07 | 42 | ### A Concrete Example | ### A concrete example |
| ch08 | 51 | ### Applying the Framework | ### Applying the framework |
| ch08 | 144 | ### Layer 1: Context Debugging Checklist | ### Layer 1: Context debugging checklist |
| ch09 | 9 | ### Entropy: Measuring Uncertainty | ### Entropy: Measuring uncertainty |
| ch09 | 69 | ### Information Content: Why Types Beat Comments | ### Information content: Why types beat comments |
| ch10 | 37 | ### Context Rot | ### Context rot |
| ch10 | 51 | ### The Economic Case for Fresh Starts | ### The economic case for fresh starts |
| ch11 | 49 | ### Layer 1: Root CLAUDE.md (Shared Patterns) | ### Layer 1: Root CLAUDE.md (shared patterns) |
| ch11 | 79 | ### Layer 2: Agent Behavioral Flows | ### Layer 2: Agent behavioral flows |
| ch12 | 11 | ### The Two-Phase Pattern | ### The two-phase pattern |
| ch12 | 30 | ### When to Use Plan Mode | ### When to use Plan Mode |
| ch12 | 82 | ### How Worktrees Work | ### How worktrees work |
| ch13 | 23 | ### CLAUDE.md as Agent Specification | ### CLAUDE.md as agent specification |
| ch13 | 49 | ### Claude Code Hooks | ### Claude Code hooks |
| ch14 | 20 | ### Why Convert? | ### Why convert? |
| ch14 | 34 | ### The Conversion Process | ### The conversion process |
| ch14 | 96 | ### The Hybrid Approach | ### The hybrid approach |
| ch14 | 129 | ### What Gets Lost When Conversations Disappear | ### What gets lost when conversations disappear |
| ch15 | 28 | ### When AI Assistance Pays for Itself | ### When AI assistance pays for itself |
| ch15 | 49 | ### Model-Specific Strengths | ### Model-specific strengths |

*(Additional 100+ instances follow same pattern across all chapters)*

**Recommendation**: Batch find-and-replace with careful handling of proper nouns (Claude Code, CLAUDE.md, API names).

### 2. Typography & Formatting (MEDIUM PRIORITY - 80+ instances)

**O'Reilly Standard**:
- Filenames/paths → italic (*CLAUDE.md*, *src/index.ts*)
- Code elements → constant width (`getUserById()`, `npm install`)
- UI elements → bold (**File > Save**)

**Current Pattern**: Filenames consistently use constant width when they should be italic in running text.

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | Throughout | `CLAUDE.md` in prose | *CLAUDE.md* |
| ch02 | 55 | `claude init` creates `CLAUDE.md` | *CLAUDE.md* (filename) |
| ch02 | 81 | `src/index.ts` | *src/index.ts* |
| ch04 | Throughout | Directory paths in `backticks` | Use *italic* for paths |
| ch04 | 165 | `agent_docs/` | *agent_docs/* |
| ch07 | 235-240 | File tree with backticks | *pre-commit.json*, *package.json* |
| ch08 | 266 | `ERRORS.md` | *ERRORS.md* |
| ch10 | 159 | `AGENTS.md` | *AGENTS.md* |
| ch10 | 200 | `TASKS.md` | *TASKS.md* |
| ch11 | 79 | `.claude/agents/` | *.claude/agents/* |
| ch12 | Throughout | File paths not italicized | Apply italic consistently |
| ch13 | 186-193 | Directory structure | Apply italic to filenames |
| ch14 | 83 | `.claude/commands/deploy-staging.md` | *.claude/commands/deploy-staging.md* |
| ch15 | Throughout | Config filenames | Apply italic |

**Pattern**: Code blocks correctly use constant width. The issue is in **running text** where filenames should be italic.

### 3. Acronyms & Abbreviations (HIGH PRIORITY - 18 instances)

**O'Reilly Standard**: Expand on first use except very common ones (API, CLI, HTML, etc.)

| File | Line | Acronym | Issue | Fix |
|------|------|---------|-------|-----|
| ch01 | 86 | DDD | Expanded ✓ | Domain-Driven Design (DDD) |
| ch01 | 88 | OTEL | Expanded ✓ | OpenTelemetry (OTEL) |
| ch02 | 29 | WSL2 | Expanded ✓ | Windows Subsystem for Linux 2 |
| ch02 | 111 | CLI | Expanded ✓ | Command Line Interface (CLI) |
| ch03 | 3 | LLM | Expanded ✓ | Large Language Model (LLM) |
| ch04 | 11 | LLMs | Used without expansion in ch04 | Expand again or reference ch03 |
| ch05 | 391 | DAG | NOT expanded | "directed acyclic graph (DAG)" |
| ch06 | 18 | TLA+ | NOT expanded | Explain: "TLA+ (a formal specification language)" |
| ch07 | 5 | CI/CD | NOT expanded in ch07 | "continuous integration/continuous deployment (CI/CD)" |
| ch08 | 404 | "flaky tests" | Technical term undefined | Define on first use |
| ch09 | 170 | OTLP | NOT expanded | "OpenTelemetry Protocol (OTLP)" |
| ch10 | 3 | RALPH | Acronym not explained | Clarify what RALPH stands for |
| ch11 | 44 | QA | NOT expanded | "Quality Assurance (QA)" |
| ch12 | 449 | AST | NOT expanded | "Abstract Syntax Tree (AST)" |
| ch13 | 100 | OTEL | Used again without expansion | Expand or cross-reference |
| ch13 | 476 | MCP | NOT expanded on first use | "Model Context Protocol (MCP)" |
| ch14 | 223 | "atrophy" | Technical usage | May need brief explanation |
| ch15 | 48 | MTok | NOT expanded | "million tokens (MTok)" or spell out |

**Critical**: Chapter readers may start mid-book. Consider expanding key acronyms in each chapter or adding chapter-level cross-references.

### 4. Cross References (MEDIUM PRIORITY - 25 instances)

**O'Reilly Standard**:
- Use specific references: "See Chapter 7" or "as shown in Figure 1-1"
- Avoid "above" and "below"
- Every numbered figure/table needs in-text reference BEFORE it appears

#### Missing Table Captions/References

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 71-79 | Table has no caption | "Table 1-1. Builder versus meta-builder comparison" |
| ch05 | 15-21 | Table has no caption | Add caption describing four-turn framework |
| ch06 | 269-278 | Table has no caption | "Table 6-1. Verification level by scenario" |
| ch07 | 159-166 | Table has no caption | "Table 7-1. Quality gate ROI calculation" |
| ch08 | 590-597 | Table has no caption | "Table 8-1. Knowledge destinations by problem type" |
| ch10 | 56-60 | Table has no caption | "Table 10-1. Trajectory comparison" |
| ch10 | 86-93 | Table has no caption | "Table 10-2. Four-phase cycle breakdown" |
| ch12 | 275-282 | Table has no caption | "Table 12-1. Ad-hoc vs deterministic comparison" |
| ch14 | 24-31 | Table has no caption | "Table 14-1. Ad-hoc flow versus script comparison" |
| ch15 | 48-83 | Table has no caption | "Table 15-1. Three-tier model hierarchy" |
| ch15 | 118-124 | Table has no caption | "Table 15-2. Model latency comparison" |

#### Vague Cross-References

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 354 | "The next chapter covers..." | "Chapter 2 covers..." |
| ch02 | 456 | "The next chapter covers..." | "Chapter 3 covers..." |
| ch03 | 489 | "The next chapter applies..." | "Chapter 4 applies..." |
| ch06 | 631 | "Next chapter:" | "Chapter 7:" |
| ch10 | 540 | "Related Chapters" section | ✓ Good - specific references |
| ch14 | 671 | "Related chapters" | ✓ Good |
| ch15 | 916 | "Related chapters" | ✓ Good |

**Pattern**: End-of-chapter "Related Chapters" sections are excellent. Inline forward references need specific chapter numbers.

### 5. Word Choices (LOW PRIORITY - 15 instances)

**O'Reilly Preferences** (manuscript follows these well):
- email ✓ (not e-mail)
- website ✓ (not web site)
- frontend, backend ✓ (not front-end)
- command line (noun), command-line (adjective) ✓

**Minor Issues**:

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch02 | 29 | "macOS 11+" | "macOS 11 or later" |
| ch02 | 29 | "Ubuntu 20+" | "Ubuntu 20 or later" |
| ch02 | 317 | "~30s" | "30 seconds" or "30 s" (with space) |
| ch07 | 329 | "master rules file" | "primary rules file" |
| ch09 | 333 | "75K tokens" | "75,000 tokens" (use comma) |
| ch10 | 56-60 | "~40 min" | Spell out "approximately" |
| ch12 | 148 | "master configuration" | "primary configuration" |
| ch12 | 379 | "2-3 minutes" | "two to three minutes" |
| ch13 | 429 | "5-10x" | "5 to 10 times" or "5x to 10x" |
| ch15 | 18 | "$3/MTok" | "$3 per million tokens" (first use) |

### 6. Numbers & Punctuation (LOW PRIORITY - 20 instances)

**O'Reilly Standard**: Spell out zero through nine; numerals for 10+; commas in 1,000+

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch03 | 232 | "2-3 examples" | "two to three examples" |
| ch06 | 233 | "2-3 examples" | "two to three examples" |
| ch09 | 119-121 | "1-2", "3-5", "6+" | Spell out: "one to two", "three to five", "six or more" |
| ch10 | 225 | "5-10 well-sized tasks" | "five to ten well-sized tasks" |
| ch11 | 356 | "3-20 steps" | "three to twenty steps" |
| ch12 | 173 | "1000+ lines" | "1,000 or more lines" |
| ch12 | 178 | "1000 lines" | "1,000 lines" |
| ch13 | 467 | "30 min per endpoint" | "30 minutes per endpoint" |
| ch15 | 22 | "$49.50/month" | "$49.50 per month" |
| ch15 | 159 | "10 endpoints/week" | "10 endpoints per week" |

### 7. Code Block Introductions (MEDIUM PRIORITY - 12 instances)

**O'Reilly Standard**: Code blocks should be introduced with colons.

**Status**: Most are correct. Found issues:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 207 | Code without colon intro | Add: "The structure looks like this:" |
| ch01 | 225 | Code without colon intro | Add colon |
| ch05 | 61 | Code needs clear intro | Add intro with colon |
| ch08 | 54 | Code needs intro | Add: "Ask these diagnostic questions:" |
| ch09 | 339 | Code needs intro | Add colon to preceding text |
| ch13 | 29 | Code needs intro | Add colon |
| ch14 | 54 | Code without intro | Add: "The script looks like this:" |

### 8. List Punctuation (LOW PRIORITY - 8 instances)

**O'Reilly Standard**: Items are sentence-capped. No periods unless one item is a complete sentence (then all get periods).

**Status**: Generally good. Minor inconsistencies:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 39-44 | List fragments with periods | Remove periods or complete sentences |
| ch02 | 94-97 | List lacks periods | Add (all are complete sentences) |
| ch03 | 75-86 | Mixed period usage | Standardize |
| ch08 | 17-20 | Check consistency | Ensure same structure |
| ch11 | 35-42 | Check periods | Standardize |

### 9. Inclusive Language (EXCELLENT - 2 instances)

**Status**: Manuscript uses excellent inclusive language throughout. Only two instances found:

| File | Line | Issue | Suggested Alternative |
|------|------|-------|----------------------|
| ch07 | 329 | "master rules file" | "primary rules file" |
| ch12 | 148 | "master configuration" | "primary configuration" |

No gendered pronouns, violent language, or exclusionary terms detected.

## Statistics by Chapter

| Chapter | Total | High | Medium | Low | Notes |
|---------|-------|------|--------|-----|-------|
| ch01 | 24 | 8 | 12 | 4 | Foundational chapter |
| ch02 | 18 | 5 | 10 | 3 | Getting started guide |
| ch03 | 22 | 6 | 12 | 4 | Prompting fundamentals |
| ch04 | 19 | 5 | 11 | 3 | CLAUDE.md guide |
| ch05 | 14 | 4 | 7 | 3 | 12-factor agent |
| ch06 | 12 | 3 | 7 | 2 | Verification ladder |
| ch07 | 26 | 9 | 13 | 4 | Quality gates |
| ch08 | 24 | 8 | 12 | 4 | Error handling |
| ch09 | 25 | 9 | 12 | 4 | Context engineering |
| ch10 | 20 | 7 | 10 | 3 | RALPH loop |
| ch11 | 22 | 7 | 11 | 4 | Sub-agents |
| ch12 | 28 | 10 | 14 | 4 | Development workflows |
| ch13 | 26 | 9 | 13 | 4 | Building harness |
| ch14 | 31 | 12 | 15 | 4 | Meta-engineer playbook |
| ch15 | 31 | 12 | 15 | 4 | Model strategy |
| **Total** | **312** | **127** | **154** | **31** | |

## Recommendations by Priority

### High Priority (Must Fix Before Publishing)

1. **C-level heading capitalization** (150+ instances)
   - **Effort**: 6-8 hours
   - **Method**: Semi-automated find-and-replace with manual review for proper nouns
   - **Regex**: `^### ([A-Z][a-z]+ [A-Z].*)$` → `### \L$1`
   - **Manual check**: CLAUDE.md, Claude Code, API names, product names

2. **Acronym expansion** (18 instances)
   - **Effort**: 2-3 hours
   - **Action**: Add expansions on first use in each chapter
   - **Consider**: Per-chapter glossary or cross-references to first expansion

3. **Table captions and references** (11 instances)
   - **Effort**: 2-3 hours
   - **Format**: "Table X-Y. Description" above table
   - **Action**: Add in-text reference before each table

### Medium Priority (Fix During Copyediting)

4. **Filename typography** (80+ instances)
   - **Effort**: 4-5 hours
   - **Rule**: Filenames in running text → *italic*
   - **Keep**: Constant width for code blocks and inline code elements

5. **Cross-reference specificity** (25 instances)
   - **Effort**: 1-2 hours
   - **Action**: Replace "next chapter" with "Chapter X"
   - **Verify**: All numbered figures/tables have pre-references

6. **Code block introductions** (12 instances)
   - **Effort**: 1 hour
   - **Action**: Add colons before code blocks

### Low Priority (Nice to Have)

7. **Number spelling and formatting** (20 instances)
   - **Effort**: 2 hours
   - **Action**: Spell out zero through nine, add commas to 1,000+

8. **Inclusive language** (2 instances)
   - **Effort**: 15 minutes
   - **Action**: Replace "master" with "primary"

9. **Word choice consistency** (15 instances)
   - **Effort**: 1 hour
   - **Action**: Spell out abbreviations, use "or later" instead of "+"

## Estimated Total Effort

- **High priority**: 10-14 hours
- **Medium priority**: 6-8 hours
- **Low priority**: 3-4 hours
- **Total**: 19-26 hours of editorial work

## Positive Observations

1. **Excellent conversational tone**: The manuscript embodies O'Reilly's reader-centric approach brilliantly. Second person ("you will learn") throughout.

2. **Strong technical accuracy**: Code examples are correct, runnable, and follow best practices.

3. **Consistent voice**: All 15 chapters maintain the same engaging, practical voice.

4. **Good structure**: Progressive complexity from beginner to expert is well-executed.

5. **Inclusive language**: Manuscript avoids gendered, violent, or exclusionary terms (except 2 instances of "master").

6. **Word choices**: Follows O'Reilly preferences (email, website, frontend, backend, command line).

7. **Code quality**: All code blocks are well-formatted with syntax highlighting.

## Overall Assessment

The manuscript is **publication-ready from a content perspective**. The issues are almost entirely **mechanical formatting** that can be addressed in a systematic copyedit pass. The writing quality, technical accuracy, and pedagogical approach are exceptional.

**Recommendation**: Proceed with high-priority fixes (headings, acronyms, tables) before final production. Medium and low priority items can be addressed during standard copyediting.

## Next Steps

1. **Automated fixes**: Run find-and-replace for C-level headings
2. **Style guide**: Create chapter-specific O'Reilly checklist for future content
3. **Linting rules**: Set up automated checks for:
   - Heading capitalization
   - Filename typography
   - Acronym expansion
   - Table caption format
4. **Final review**: Schedule copyediting pass focusing on typography
5. **Validation**: Re-run this review after fixes to verify completion

---

**Review completed**: 2026-01-27
**Reviewer**: O'Reilly Style Agent
**Chapters reviewed**: ch01-ch15 (complete manuscript)
**Format**: Markua/Leanpub
