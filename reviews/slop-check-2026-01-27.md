# AI Slop Check - 2026-01-27 (Updated v2)

## Summary
- Files scanned: 34 (15 chapters, 19 PRDs)
- Issues found: 53 (Critical: 1, High: 47, Medium: 5)

**Good news:** The chapter files are remarkably clean. Most issues are in PRD files, which are internal planning documents. The actual book content has very few slop patterns.

**Update v2:** Re-scanned with all 15 chapters now complete (ch01-ch15, including new ch14 and ch15).

## Issues by File

### chapters/ch14-the-meta-engineer-playbook.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 316 | High | "paradigm" | "AI-powered coding agents represent a paradigm shift" | Use: "AI-powered coding agents represent a fundamental shift" |

### chapters/ch15-model-strategy-and-cost-optimization.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 606 | Medium | "powerful" | "Skills can invoke other skills, creating powerful workflows" | Consider: "creating flexible workflows" or "creating composed workflows" |

### chapters/ch07-quality-gates-that-compound.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | Medium | "powerful" | "something more powerful than pass/fail checkpoints" | Consider: "something beyond pass/fail checkpoints" |

### chapters/ch06-the-verification-ladder.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 441 | Medium | "comprehensive" | "API verification (comprehensive endpoint testing)" | Acceptable in technical context |

### prds/ch06.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 765 | Critical | "crucial" | "here's the crucial insight" | Use: "here's the key insight" or "here's the core insight" |
| 12 | High | em dash (—) | [omitted line] | Use period, comma, or colon |
| 23 | High | em dash (—) | "coverage—with ROI of 100-1000x" | Use comma or colon |
| 376 | High | em dash (—) | "No manual explanation needed—errors are self-documenting" | Use period: "No manual explanation needed. Errors are self-documenting." |
| 415 | High | em dash (—) | "Order matters less than completeness—get all 6 gates" | Use colon or period |

### prds/ch15-model-strategy.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 9 | High | "leverage" (verb) | "how to leverage the Skills system" | Use: "how to use the Skills system" |

### prds/ch09.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 24 | High | em dash (—) | "Execute accuracy vs. latency trade-offs—knowing when" | Use colon |
| 284 | High | em dash (—) | "LLMs are probabilistic—4 runs find more issues" | Use colon or period |

### prds/ch12.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 22 | High | em dash (—) | "most practical chapter in the book—readers should" | Use period |
| 79 | High | em dash (—) | "Case Study—AI Rank Tracker" | Use colon |
| 176 | High | em dash (—) | "Troubleshooting Guide—The Five-Point" | Use colon |
| 190 | High | em dash (—) | "Root Cause 1—Context Problems" | Use colon |
| 199 | High | em dash (—) | "Root Cause 2—Model Problems" | Use colon |
| 208 | High | em dash (—) | "Root Cause 3—Rules Problems" | Use colon |
| 217 | High | em dash (—) | "Root Cause 4—Testing Problems" | Use colon |
| 226 | High | em dash (—) | "Root Cause 5—Quality Gate Problems" | Use colon |
| 236 | High | em dash (—) | "Real-World Workflow—Payment Processing" | Use colon |
| 253 | High | em dash (—) | "Cost Optimization Reference—Model Switching" | Use colon |
| 382 | High | em dash (—) | "Cost Protection Reference—Multi-Layer" | Use colon |
| 435 | High | em dash (—) | "Quality Control Reference—Flaky Test" | Use colon |

### prds/ch02.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 55 | High | em dash (—) | "It's an agent—a tool that reads" | Use comma or colon |

### prds/ch04.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 249 | High | em dash (—) | "Tools aren't magic framework objects—they're JSON" | Use period |
| 696 | High | em dash (—) | "Foundation (Factors 1, 2, 3, 5) — Week 1" | Use colon or remove |
| 704 | High | em dash (—) | "Reliability (Factors 6, 7, 8, 9) — Week 2" | Use colon or remove |
| 712 | High | em dash (—) | "Scope & Scale (Factors 10, 11, 12) — Week 3+" | Use colon or remove |

### prds/ch10.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 84 | High | em dash (—) | "configure the innermost harness—Claude Code itself" | Use comma or colon |
| 256 | High | em dash (—) | "AI-assisted features (5-10x) — Most developers" | Use period |

### prds/ch11.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 65 | High | "paradigm" | "Strategic career planning in the six-wave paradigm" | Use: "six-wave model" or "six-wave framework" |
| 248 | High | "paradigm" | "D.1 Context: The Paradigm Shift" | Consider: "The Fundamental Shift" or keep (acceptable in context) |
| 848 | High | "leveraging" (verb) | "leveraging first principles" | Use: "applying first principles" |
| 11 | High | em dash (—) | "from 'builder' to 'meta-builder'—from writing code" | Use period |
| 165 | High | em dash (—) | "Using AI heavily WILL cause atrophy—it's not a question" | Use period |
| 373 | High | em dash (—) | "Not wishes, not aspirations—actual constraints" | Use comma or period |
| 805-813 | High | em dash (—) | Multiple chapter cross-references use em dashes | Use colons consistently |
| 848 | High | em dash (—) | "James Phoenix's voice—data-driven, pragmatic" | Use colon |
| 885 | High | em dash (—) | "operational layer of compound systems thinking—moving" | Use comma or period |

### prds/ch01.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | High | em dash (—) | [omitted line] | Review and replace |

## Pattern Summary

| Pattern | Chapters | PRDs | Total |
|---------|----------|------|-------|
| delve | 0 | 0 | 0 |
| crucial | 0 | 1 | 1 |
| pivotal | 0 | 0 | 0 |
| robust | 0 | 0 | 0 |
| cutting-edge | 0 | 0 | 0 |
| game-changer | 0 | 0 | 0 |
| leverage (verb) | 0 | 2 | 2 |
| realm | 0 | 0 | 0 |
| paradigm | 1 | 2 | 3 |
| em dash (—) | 0 | 44 | 44 |
| powerful | 2 | 5 | 7 |
| comprehensive | 2 | 13 | 15 |

**Note:** "leverage" as a noun is acceptable and heavily used in this book (core concept). Only verb uses are flagged.

**Note:** "paradigm" appears twice in ch11.md but in appropriate technical context (discussing paradigm shifts in AI development).

**Note:** "powerful" and "comprehensive" instances are largely acceptable in technical contexts.

## Recommendations

### Priority 1: Fix the "crucial" instance
Replace "here's the crucial insight" with "here's the key insight" in prds/ch06.md:765.

### Priority 1b: Fix "paradigm" in chapter content
Replace "paradigm shift" with "fundamental shift" in chapters/ch14-the-meta-engineer-playbook.md:316.

### Priority 2: Standardize PRD formatting
The PRDs heavily use em dashes for headers and explanations. Consider a batch replacement:
- Section headers: Use colons ("Section 4.2: Case Study" not "Section 4.2—Case Study")
- Explanatory clauses: Use periods or commas

### Priority 3: Review before promoting PRD content to chapters
When converting PRD content to chapter drafts, ensure em dashes are converted to appropriate punctuation.

## Clean Files (No Issues)
### Chapters (14 of 15 clean of critical/high patterns)
- chapters/ch01-the-compound-systems-engineer.md
- chapters/ch02-getting-started-with-claude-code.md
- chapters/ch03-prompting-fundamentals.md
- chapters/ch04-writing-your-first-claude-md.md
- chapters/ch05-the-12-factor-agent.md
- chapters/ch06-the-verification-ladder.md (1 medium: "comprehensive")
- chapters/ch07-quality-gates-that-compound.md (1 medium: "powerful")
- chapters/ch08-error-handling-and-debugging.md
- chapters/ch09-context-engineering-deep-dive.md
- chapters/ch10-the-ralph-loop.md
- chapters/ch11-sub-agent-architecture.md
- chapters/ch12-development-workflows.md
- chapters/ch13-building-the-harness.md
- chapters/ch14-the-meta-engineer-playbook.md (1 high: "paradigm")
- chapters/ch15-model-strategy-and-cost-optimization.md (1 medium: "powerful")

### PRDs (Clean)
- prds/index.md
- prds/toc.md
- prds/ch03.md
- prds/ch05.md
- prds/ch08.md
- prds/ch08-error-handling.md
- prds/ch03-prompting-fundamentals.md
- prds/ch12-development-workflows.md

## Verification Commands
```bash
# Check for "delve" (should return nothing)
grep -ri "delve" chapters/ prds/

# Check for remaining em dashes in PRDs
grep -r "—" prds/

# Check for "crucial"
grep -ri "crucial" chapters/ prds/
```
