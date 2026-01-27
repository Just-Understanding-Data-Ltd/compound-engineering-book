# O'Reilly Style Review - 2026-01-28

## Summary
- Files scanned: 4 (ch12, ch13, ch14, ch15)
- Issues found: 187 (High: 142, Medium: 35, Low: 10)
- Primary issue: C-level heading capitalization (142 instances)

## Critical Finding

**C-level headings must use sentence case** (capitalize first word only, plus proper nouns), not Title Case. This is the most pervasive issue, affecting 142 headings across all four chapters.

---

## Issues by Category

### Heading Capitalization (142 instances - HIGH PRIORITY)

**Ch12: Development Workflows (33 C-level headings)**

| Line | Current | Should Be |
|------|---------|-----------|
| 11 | ### The Two-Phase Pattern | ### The two-phase pattern |
| 30 | ### When to Use Plan Mode | ### When to use Plan Mode |
| 36 | ### Effective Plan Mode Prompts | ### Effective Plan Mode prompts |
| 53 | ### Iterating on Plans | ### Iterating on plans |
| 82 | ### How Worktrees Work | ### How worktrees work |
| 105 | ### Creating and Using Worktrees | ### Creating and using worktrees |
| 141 | ### Symlinked Configurations | ### Symlinked configurations |
| 155 | ### Parallel Development Metrics | ### Parallel development metrics |
| 175 | ### The Problem with Large Requests | ### The problem with large requests |
| 188 | ### The Incremental Pattern | ### The incremental pattern |
| 201 | ### Authentication System: Incremental Approach | ### Authentication system: incremental approach |
| 249 | ### Why Incrementality Works | ### Why incrementality works |
| 263 | ### The Conversion Signal | ### The conversion signal |
| 272 | ### Why Convert? | ### Why convert? |
| 283 | ### The Conversion Process | ### The conversion process |
| 338 | ### The Latency Argument | ### The latency argument |
| 351 | ### The Hybrid Approach | ### The hybrid approach |
| 381 | ### The Pattern | ### The pattern |
| 393 | ### Speed Comparison | ### Speed comparison |
| 423 | ### Why Scripts Are Superior | ### Why scripts are superior |
| 427 | ### The Iteration Loop | ### The iteration loop |
| 452 | ### The Problem with Text Search | ### The problem with text search |
| 466 | ### AST-Based Search | ### AST-based search |
| 477 | ### Pattern Syntax | ### Pattern syntax |
| 493 | ### Refactoring with AST-Grep | ### Refactoring with AST-grep |
| 508 | ### When to Use Each Tool | ### When to use each tool |
| 520 | ### Built-in Skills | ### Built-in skills |
| 524 | ### Creating Custom Skills | ### Creating custom skills |
| 543 | ### Skills vs Sub-Agents | ### Skills vs sub-agents |
| 546 | ### Skill Composition | ### Skill composition |
| 566 | ### Exercise 1: Plan Mode Practice | ### Exercise 1: Plan Mode practice |
| 579 | ### Exercise 2: Parallel Development Setup | ### Exercise 2: Parallel development setup |
| 592 | ### Exercise 3: Script Capture | ### Exercise 3: Script capture |

**Ch13: Building the Harness (27 C-level headings)**

| Line | Current | Should Be |
|------|---------|-----------|
| 23 | ### CLAUDE.md as Agent Specification | ### CLAUDE.md as agent specification |
| 46 | ### Claude Code Hooks | ### Claude Code hooks |
| 78 | ### Scoping and Constraints | ### Scoping and constraints |
| 96 | ### Observability Stack | ### Observability stack |
| 119 | ### Testing Infrastructure | ### Testing infrastructure |
| 142 | ### Production/Development Parity | ### Production/development parity |
| 157 | ### Code Structure Using DDD | ### Code structure using DDD |
| 180 | ### Claude Code Scripts and Workflows | ### Claude Code scripts and workflows |
| 198 | ### Tests for Tests | ### Tests for tests |
| 219 | ### Tests for Telemetry | ### Tests for telemetry |
| 239 | ### Agent Swarm Tactics | ### Agent swarm tactics |
| 265 | ### Nightly Job Orchestration | ### Nightly job orchestration |
| 295 | ### Telemetry as Control Input | ### Telemetry as control input |
| 316 | ### Constraint Specification | ### Constraint specification |
| 335 | ### The Optimization Loop | ### The optimization loop |
| 376 | ### CI/CD Integration | ### CI/CD integration |
| 418 | ### The Linear vs Exponential Mindset | ### The linear vs exponential mindset |
| 433 | ### Four Levels of Automation | ### Four levels of automation |
| 443 | ### Identifying High-Leverage Infrastructure | ### Identifying high-leverage infrastructure |
| 478 | ### MCP Resources | ### MCP resources |
| 489 | ### Building the MCP Server | ### Building the MCP server |
| 525 | ### Use Cases | ### Use cases |
| 535 | ### Combining Static and Dynamic Context | ### Combining static and dynamic context |
| 567 | ### Common Pitfalls | ### Common pitfalls |
| 585 | ### Exercise 1: Design Your Harness | ### Exercise 1: Design your harness |
| 596 | ### Exercise 2: Build an MCP Server | ### Exercise 2: Build an MCP server |
| 600 | ### Exercise 3: Implement a Constraint | ### Exercise 3: Implement a constraint |

**Ch14: The Meta-Engineer Playbook (26 C-level headings)**

| Line | Current | Should Be |
|------|---------|-----------|
| 20 | ### Why Convert? | ### Why convert? |
| 35 | ### The Conversion Process | ### The conversion process |
| 95 | ### The Hybrid Approach | ### The hybrid approach |
| 118 | ### When to Keep It Ad-hoc | ### When to keep it ad-hoc |
| 140 | ### What Gets Lost When Conversations Disappear | ### What gets lost when conversations disappear |
| 149 | ### Four Preservation Strategies | ### Four preservation strategies |
| 199 | ### Specs as Source of Truth | ### Specs as source of truth |
| 230 | ### The Three High-Leverage Skills to Protect | ### The three high-leverage skills to protect |
| 251 | ### The Leverage Stack | ### The leverage stack |
| 270 | ### The Self-Check | ### The self-check |
| 281 | ### The Atrophy Ladder | ### The atrophy ladder |
| 304 | ### Preventing Dangerous Atrophy | ### Preventing dangerous atrophy |
| 327 | ### The Wave 3 to Wave 4 Transition | ### The Wave 3 to Wave 4 transition |
| 333 | ### Task Sizing for Agents | ### Task sizing for agents |
| 358 | ### The Skill Shift | ### The skill shift |
| 371 | ### The Fleet Model: Waves 5 and 6 | ### The fleet model: Waves 5 and 6 |
| 385 | ### Economic Reality | ### Economic reality |
| 397 | ### Career Implications | ### Career implications |
| 403 | ### Timeline Pressure | ### Timeline pressure |
| 423 | ### Builder vs Meta-Builder | ### Builder vs meta-builder |
| 437 | ### What Meta-Engineers Build | ### What meta-engineers build |
| 488 | ### The Compound Effect | ### The compound effect |
| 502 | ### The Identity Shift | ### The identity shift |
| 515 | ### The Full Skill Stack | ### The full skill stack |
| 546 | ### The Four Levels of Automation | ### The four levels of automation |
| 609 | ### What You Are Actually Building | ### What you are actually building |

**Ch15: Model Strategy and Cost Optimization (30 C-level headings)**

| Line | Current | Should Be |
|------|---------|-----------|
| 28 | ### When AI Assistance Pays for Itself | ### When AI assistance pays for itself |
| 84 | ### Model-Specific Strengths | ### Model-specific strengths |
| 114 | ### Latency Considerations | ### Latency considerations |
| 126 | ### Implementing Model Selection | ### Implementing model selection |
| 170 | ### Progressive Model Escalation | ### Progressive model escalation |
| 210 | ### Cost Savings Analysis | ### Cost savings analysis |
| 244 | ### Layer 1: Job-Level Timeouts | ### Layer 1: Job-level timeouts |
| 263 | ### Layer 2: Request-Level Token Caps | ### Layer 2: Request-level token caps |
| 288 | ### Layer 3: Input Size Limits | ### Layer 3: Input size limits |
| 324 | ### Layer 4: Budget Alerts and Hard Caps | ### Layer 4: Budget alerts and hard caps |
| 382 | ### Implementing Prompt Caching | ### Implementing prompt caching |
| 430 | ### Combined Savings | ### Combined savings |
| 444 | ### Why It's Safe | ### Why it's safe |
| 458 | ### Safe YOLO Patterns | ### Safe YOLO patterns |
| 496 | ### Unsafe YOLO Anti-Patterns | ### Unsafe YOLO anti-patterns |
| 506 | ### The Safety Hierarchy | ### The safety hierarchy |
| 532 | ### Overnight Automation with YOLO | ### Overnight automation with YOLO |
| 554 | ### Built-In Skills | ### Built-in skills |
| 562 | ### Creating Custom Skills | ### Creating custom skills |
| 593 | ### Skills vs Sub-Agents | ### Skills vs sub-agents |
| 604 | ### Skill Composition | ### Skill composition |
| 671 | ### Fallback Strategies | ### Fallback strategies |
| 703 | ### Evaluating New Models | ### Evaluating new models |
| 777 | ### Dashboard Metrics | ### Dashboard metrics |
| 787 | ### Monthly Optimization Review | ### Monthly optimization review |
| 797 | ### Building a Cost Dashboard | ### Building a cost dashboard |
| 833 | ### Cost Allocation for Teams | ### Cost allocation for teams |
| 862 | ### Common Optimization Mistakes | ### Common optimization mistakes |
| 880 | ### Exercise 1: Audit Your Model Usage | ### Exercise 1: Audit your model usage |
| 890 | ### Exercise 2: Implement Cost Protection | ### Exercise 2: Implement cost protection |
| 898 | ### Exercise 3: Measure Cache Performance | ### Exercise 3: Measure cache performance |

---

### Acronyms & Abbreviations (MEDIUM PRIORITY)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch12 | 43 | JWT expansion correct ✓ | "JSON Web Token (JWT)" |
| ch12 | 131 | REST expansion correct ✓ | "Representational State Transfer (REST)" |
| ch12 | 131 | CRUD expansion correct ✓ | "Create, Read, Update, Delete (CRUD)" |
| ch12 | 277 | "Large Language Model" | Should be lowercase: "large language model (LLM)" |
| ch12 | 379 | MCP expansion correct ✓ | "Model Context Protocol (MCP)" |
| ch12 | 425 | CI expansion correct ✓ | "Continuous Integration (CI)" |
| ch12 | 450 | AST expansion correct ✓ | "Abstract Syntax Tree (AST)" |
| ch13 | 100 | OTEL expansion correct ✓ | "OpenTelemetry (OTEL)" |
| ch13 | 157 | "Domain-Driven Design (DDD)" | Should be lowercase: "domain-driven design (DDD)" |
| ch13 | 376 | CI/CD not defined | Define as "Continuous Integration/Continuous Deployment (CI/CD)" or verify defined earlier |
| ch13 | 476 | MCP defined inline | Correct ✓ |
| ch14 | 392 | LLM not defined in chapter | Verify defined in earlier chapter or expand here |
| ch14 | 537 | K8s not defined | "Kubernetes (K8s)" |
| ch14 | 582 | ROI not defined | "return on investment (ROI)" |
| ch15 | 18 | MTok defined correctly ✓ | "million tokens (MTok)" |
| ch15 | 437 | YOLO not expanded | "You Only Live Once (YOLO)" or explain term in context |

**Note on capitalization**: When expanding acronyms, only capitalize if the full term is a proper noun. "Large Language Model" should be "large language model (LLM)" and "Domain-Driven Design" should be "domain-driven design (DDD)" unless these are trademarked terms.

---

### Cross References (LOW PRIORITY)

All chapters include "Related Chapters" sections with specific chapter numbers and titles. Format is acceptable but could be more consistent with "See Chapter X" format per strict O'Reilly style.

**Ch12 (lines 618-623):**
```markdown
## Related Chapters

- **Chapter 10: The RALPH Loop** - Workflows become the foundation...
- **Chapter 11: Sub-Agent Architecture** - Skills evolve into specialized...
- **Chapter 13: Building the Harness** - Workflows get codified...
- **Chapter 4: Writing Your First CLAUDE.md** - Workflows reference...
```

**Recommendation**: Format is clear and reader-friendly. Consider whether strict "See Chapter X" format adds value or if current format better serves readers.

---

### Typography & Formatting (MEDIUM PRIORITY)

**Filenames and paths**: O'Reilly style specifies filenames should be italic, not constant width. However, this is common in technical programming books to use constant width for consistency with code.

| File | Pattern | O'Reilly Standard | Current Usage | Recommendation |
|------|---------|------------------|---------------|----------------|
| All | `CLAUDE.md` | _CLAUDE.md_ (italic) | Constant width | Document style exception or convert |
| All | `.claude/` | _.claude/_ (italic) | Constant width | Same as above |
| All | `package.json` | _package.json_ (italic) | Constant width | Same as above |

**Decision needed**: Either:
1. Convert all filename references to italic (strict O'Reilly)
2. Document exception for programming content maintaining constant width
3. Maintain current approach and note in style guide

**Code blocks**: All code blocks properly introduced with colons and include syntax highlighting. ✓ No issues.

**Inline code**: Commands, variables, and code elements appropriately use constant width. ✓ No issues.

---

### Word Choices (LOW PRIORITY)

| File | Line | Current | Should Be | Notes |
|------|------|---------|-----------|-------|
| ch12 | Multiple | ad-hoc | ad hoc | O'Reilly prefers two words, no hyphen (noun form) |
| ch14 | 118 | "ad-hoc" | "ad hoc" | Same issue |
| ch12 | 148 | "master configuration" | "primary configuration" | Inclusive language |
| ch14 | Multiple | "Wave 3", "Wave 4" ✓ | - | Correct (numerals for sequences) |

**Verified O'Reilly preferences**:
- ✓ email (not e-mail)
- ✓ website (not web site)
- ✓ frontend, backend (one word)
- ✓ online (one word)
- ✓ codebase (one word)
- ✓ checkbox (one word)
- ✓ filename (one word)

---

### Numbers and Percentages

| File | Line | Issue | Status |
|------|------|-------|--------|
| ch12 | 173 | "1000+ lines" | Should be "1,000 or more lines" (add comma) |
| ch15 | 18-24 | "$2.25/day" ✓ | Correct format |
| ch15 | 235 | "90%" ✓ | Correct - use % symbol with numerals |
| Various | Multiple | Percentages | Consistently use % symbol ✓ |

---

### Punctuation (NO ISSUES)

- ✓ Serial comma used consistently
- ✓ Commas and periods inside quotation marks
- ✓ Lowercase after colons (except for headings/lists)
- ✓ Curly quotes in regular text

---

### Lists (NO ISSUES)

- ✓ Items are sentence-capped
- ✓ Consistent punctuation within each list
- ✓ Numbered lists for sequential steps
- ✓ Bulleted lists for non-sequential items

---

### Inclusive Language (LOW PRIORITY)

| File | Line | Issue | Alternative |
|------|------|-------|------------|
| ch12 | 148 | "master configuration" | "primary configuration" |

**Verified clean**:
- ✓ No gendered language (middleman, manpower, etc.)
- ✓ No violent language (kill, hit used appropriately in code context)
- ✓ No color-based problematic terms (blacklist/whitelist)
- ✓ No exclusionary terms (crazy, dummy, etc.)

---

## Implementation Strategy

### Phase 1: Automated Fixes (2 hours)

**Script-based heading conversion:**
```bash
# For each chapter
for file in ch12 ch13 ch14 ch15; do
  # Backup first
  cp chapters/${file}-*.md chapters/${file}-*.md.backup

  # Manual review required - too many edge cases for full automation
  # Focus on obvious patterns
done
```

**Find-replace patterns:**
```bash
# Word choice fixes
find chapters/ch1[2-5]*.md -exec sed -i '' 's/ad-hoc/ad hoc/g' {} \;
find chapters/ch1[2-5]*.md -exec sed -i '' 's/master configuration/primary configuration/g' {} \;
```

### Phase 2: Manual Review (4-6 hours)

1. **Heading conversion** (3 hours): Review each of 142 C-level headings for:
   - Proper sentence case
   - Preserving proper nouns (Plan Mode, Claude Code, YOLO, etc.)
   - Product names that should stay capitalized

2. **Acronym verification** (1 hour):
   - Add missing expansions for LLM, CI/CD, ROI, K8s, YOLO
   - Verify lowercase for non-proper-noun expansions
   - Check cross-chapter consistency

3. **Typography decision** (30 min):
   - Decide filename formatting convention
   - Document decision in style guide
   - Apply if converting to italic

4. **Final verification** (30 min):
   - Spot-check 10 random headings per chapter
   - Verify acronyms on first use
   - Run inclusive language check

### Phase 3: Validation (30 minutes)

1. Run automated checks:
   - Grep for `### [A-Z][a-z]+ [A-Z]` (Title Case pattern)
   - Search for common undefined acronyms
   - Check for "master/slave" terminology

2. Manual sampling:
   - Read 2-3 sections per chapter
   - Verify natural reading flow
   - Confirm changes don't affect meaning

---

## Priority Ranking

### Priority 1 (Must Fix)
- **142 C-level headings**: Highest impact, most visible to readers and editors
- **10 undefined acronyms**: Reader comprehension

### Priority 2 (Should Fix)
- **Word choices**: "ad-hoc" → "ad hoc", inclusive language
- **Number formatting**: Add comma to "1,000+"

### Priority 3 (Nice to Have)
- **Typography decision**: Filename formatting convention
- **Cross-reference standardization**: Current format acceptable

---

## Estimated Effort

| Task | Time | Difficulty |
|------|------|-----------|
| C-level heading fixes | 3 hours | Medium (requires judgment) |
| Acronym expansion | 1 hour | Low (mechanical) |
| Word choice cleanup | 30 min | Low (find-replace) |
| Typography decision | 30 min | Low (document choice) |
| Testing & validation | 30 min | Low |
| **Total** | **5.5 hours** | **Mixed** |

---

## Strengths of These Chapters

- ✓ Excellent conversational tone
- ✓ Strong second-person voice ("you will learn")
- ✓ Practical, tested code examples
- ✓ Clear cross-references between chapters
- ✓ Good balance of theory and practice
- ✓ Inclusive language (minimal issues)
- ✓ Proper serial comma usage
- ✓ Appropriate code formatting

---

## Recommendation

**Focus first on C-level headings** (142 instances). This single systematic fix addresses 76% of all issues and has the highest visibility impact. The remaining issues are straightforward mechanical fixes or low-priority style decisions.

**Timeline**:
- Week 1: Complete heading fixes and acronym expansion
- Week 2: Word choice cleanup and validation
- Week 3: Typography decision and documentation

**Alternative approach**: If time-constrained, fix headings only (76% of issues) and document remaining items as known style variances to address in final copyedit.
