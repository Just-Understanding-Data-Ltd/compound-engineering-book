# AI Slop Check - 2026-01-27 (Verified 2026-01-27)

## Summary
- Files scanned: 34 (15 chapters, 19 PRDs)
- Issues found: 53 (Critical: 1, High: 3, Medium: 49)

### Good News
- **No "delve"** in any file
- **No "crucial", "pivotal", "robust"** in chapters
- **1 "crucial"** in PRD (prds/ch06.md:765) - CRITICAL: fix before chapter conversion
- **No em dashes** in any chapter (chapters are clean!)
- **No transition phrases** (Additionally, Furthermore, Moreover)
- **No hedging phrases** (It's important to note, It could be argued, etc.)

### Areas of Concern
- "paradigm" appears 3 times (1 chapter, 2 PRDs)
- "powerful" and "comprehensive" used frequently (medium priority)
- Em dashes present in PRDs (should be cleaned before chapter conversion)

---

## Issues by File

### CRITICAL: prds/ch06.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 765 | Critical | "crucial" | "And here's the crucial insight: when you stack these gates..." | Replace with "key insight" or "core insight" |

---

### chapters/ch14-the-meta-engineer-playbook.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 316 | High | paradigm | "represent a paradigm shift" | Replace with "fundamental change" or "major shift" |

### prds/ch11.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 65 | High | paradigm | "six-wave paradigm" | Replace with "six-wave model" or "six-wave framework" |
| 248 | High | paradigm | "The Paradigm Shift" | Replace with "The Fundamental Shift" |
| 11 | Medium | em dash | "meta-builder--from writing code" | Use period or comma |
| 165 | Medium | em dash | "WILL cause atrophy--it's not" | Use period |
| 373 | Medium | em dash | "aspirations--actual constraints" | Use period |
| 805-813 | Medium | em dash | Multiple chapter cross-references | Use colon or period |
| 848 | Medium | em dash | "James Phoenix's voice--data-driven" | Use colon |
| 885 | Medium | em dash | "compound systems thinking--moving" | Use period |

### prds/ch09.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 24 | Medium | em dash | "trade-offs--knowing when" | Use colon or period |
| 284 | Medium | em dash | "probabilistic--4 runs" | Use period |
| 353 | Medium | powerful | "Slightly less powerful" | Acceptable in context (comparing models) |

### prds/ch12.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 22 | Medium | em dash | "in the book--readers" | Use period |
| 79+ | Medium | em dash | Section titles with em dashes | Use colon for section titles |

### prds/ch02.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 55 | Medium | em dash | "an agent--a tool" | Use colon or parentheses |

### prds/ch04.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 249 | Medium | em dash | "magic framework objects--they're" | Use period |
| 696-712 | Medium | em dash | Phase headers | Use colon |

### prds/ch06.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 23 | Medium | em dash | "test coverage--with ROI" | Use period or comma |
| 376 | Medium | em dash | "explanation needed--errors" | Use period |
| 415 | Medium | em dash | "completeness--get all 6" | Use period |

### prds/ch07.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 10 | Medium | em dash | (long line omitted) | Review and fix |

### prds/ch10.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 84 | Medium | em dash | "innermost harness--Claude Code" | Use colon |
| 256 | Medium | em dash | "5-10x) -- Most developers" | Use period |

### prds/ch01.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | Medium | em dash | (long line omitted) | Review and fix |

---

## Medium Priority: "powerful" and "comprehensive" Usage

These words appear frequently but are acceptable in technical contexts. Review for overuse:

### "powerful" (11 occurrences in chapters)
- ch08:133 - "more powerful model" - Acceptable (comparing model capabilities)
- ch08:222 - "more powerful models" - Acceptable
- ch08:248 - "more powerful models" - Consider "stronger" or "larger"
- ch09:410, 565 - "more powerful model" - Acceptable
- ch12:3 - "Individual techniques are powerful" - Consider "effective" or "valuable"
- ch15:606 - "creating powerful workflows" - Consider "sophisticated" or "effective"
- ch07:11 - "something more powerful than" - Consider "more than" or "beyond"

### "comprehensive" (8 occurrences in chapters)
- ch13:559 - "comprehensive test suites" - Acceptable (standard testing term)
- ch10:338 - "Comprehensive test suite" - Acceptable
- ch06:441 - "comprehensive endpoint testing" - Acceptable
- ch11:5, 25, 39 - "comprehensive tests" - Acceptable (used 3x in same chapter, consider varying)
- ch02:167 - "comprehensive tests" - Acceptable

---

## "This" at Sentence Start Analysis

Total: 63 occurrences across 14 chapter files

| File | Count | Status |
|------|-------|--------|
| ch01-the-compound-systems-engineer.md | 10 | Review paragraphs |
| ch10-the-ralph-loop.md | 10 | Review paragraphs |
| ch14-the-meta-engineer-playbook.md | 7 | Review paragraphs |
| ch04-writing-your-first-claude-md.md | 7 | Review paragraphs |
| ch05-the-12-factor-agent.md | 4 | OK |
| ch13-building-the-harness.md | 4 | OK |
| ch03-prompting-fundamentals.md | 4 | OK |
| ch08-error-handling-and-debugging.md | 3 | OK |
| ch06-the-verification-ladder.md | 3 | OK |
| ch02-getting-started-with-claude-code.md | 3 | OK |
| ch11-sub-agent-architecture.md | 2 | OK |
| ch12-development-workflows.md | 2 | OK |
| ch07-quality-gates-that-compound.md | 2 | OK |
| ch15-model-strategy-and-cost-optimization.md | 2 | OK |

**Recommendation**: Review ch01, ch10, ch14, and ch04 for overuse of "This" at sentence starts. Target: no more than 2-3 per 500 words.

---

## Note on "leverage"

The word "leverage" appears 74+ times across chapters. This is **intentional and appropriate** as it's a core concept of the book ("compound leverage", "leverage curve", etc.). Not flagged as slop.

---

## Action Items

### Must Fix (Critical)
1. **prds/ch06.md:765** - Replace "crucial insight" with "key insight"

### Must Fix (High Priority)
1. ch14:316 - Replace "paradigm shift"
2. prds/ch11.md:65, 248 - Replace "paradigm" instances

### Should Fix (Medium Priority)
1. Clean em dashes from all PRD files before converting to chapters
2. Review ch01, ch10, ch14, ch04 for "This" sentence starters
3. Consider varying "comprehensive" usage in ch11

### Optional
1. Review "powerful" usage for variety
2. Consider "effective" or "valuable" as alternatives

---

## Verification Command

Re-run check with:
\`\`\`bash
grep -rn "delve\|crucial\|pivotal\|robust" chapters/
grep -rn "paradigm\|cutting-edge\|game-changer" chapters/
\`\`\`
