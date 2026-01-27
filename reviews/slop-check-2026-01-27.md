# AI Slop Check - 2026-01-27

## Summary
- **Files scanned**: 15 chapter files + 9 PRD files = 24 total files
- **Total issues found**: 60 (Critical: 46, High: 2, Medium: 14)
  - Critical em dashes: 44
  - Critical "crucial": 1
  - Critical other: 1
  - High priority paradigm: 2
  - Medium: 14 (8 "powerful" + 6 "comprehensive")
- **Status**: Chapters EXCELLENT | PRDs require em dash and term cleanup

---

## Issues by File

### prds/ch01.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | Critical | Em dash (—) | Omitted long matching line | Replace em dash with colon or period |

### prds/ch02.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 55 | Critical | Em dash (—) | Not ChatGPT in a terminal. It's an agent—a tool | Replace with colon: "It's an agent: a tool that reads..." |

### prds/ch04.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 249 | Critical | Em dash (—) | Tools aren't magic framework objects—they're JSON outputs | Replace with colon: "objects: they're JSON outputs" |
| 696 | Critical | Em dash (—) | **Phase 1: Foundation (Factors 1, 2, 3, 5) — Week 1** | Use hyphen: "Foundation - Week 1" |
| 704 | Critical | Em dash (—) | **Phase 2: Reliability (Factors 6, 7, 8, 9) — Week 2** | Use hyphen: "Reliability - Week 2" |
| 712 | Critical | Em dash (—) | **Phase 3: Scope & Scale (Factors 10, 11, 12) — Week 3+** | Use hyphen: "Scope - Week 3+" |

### prds/ch06.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 12 | Critical | Em dash (—) | Omitted long matching line | Replace em dash with colon or period |
| 23 | Critical | Em dash (—) | with ROI of 100-1000x—with ROI of 100-1000x | Replace with colon or semicolon |
| 376 | Critical | Em dash (—) | No manual explanation needed—errors are self-documenting | Replace: "needed: errors are self-documenting" |
| 415 | Critical | Em dash (—) | Order matters less than completeness—get all 6 gates ASAP | Replace: "completeness. Get all 6 gates ASAP" |
| 765 | Critical | Crucial (Word) | And here's the **crucial insight**: when you stack these gates together | Replace "crucial" with "key" or "important" |
| 765 | Critical | Em dash (—) | Omitted long matching line (contains em dash) | Replace em dash with colon or period |

### prds/ch07.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 10 | Critical | Em dash (—) | Omitted long matching line | Replace em dash with colon or period |

### prds/ch09.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 12 | Critical | Em dash (—) | specialized sub-agent architectures—a pattern that mirrors | Replace: "architectures: a pattern that mirrors" |
| 24 | Critical | Em dash (—) | Execute accuracy vs. latency trade-offs—knowing when sub-agents | Replace: "trade-offs: knowing when sub-agents" |
| 284 | Critical | Em dash (—) | LLMs are probabilistic—4 runs find more issues than 1 run | Replace: "probabilistic; 4 runs find more issues" |

### prds/ch10.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 13 | Critical | Em dash (—) | Omitted long matching line | Replace em dash with colon or period |
| 84 | Critical | Em dash (—) | configure the innermost harness—Claude Code itself | Replace: "harness: Claude Code itself" |
| 256 | Critical | Em dash (—) | Level 1: AI-assisted features (5-10x) — Most developers stop | Replace: "features - Most developers stop" |

### prds/ch11.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | Critical | Em dash (—) | from "builder" to "meta-builder"—from writing code to designing | Replace: "meta-builder": from writing code to designing" |
| 165 | Critical | Em dash (—) | Using AI heavily WILL cause atrophy—it's not a question, it's physics | Replace: "atrophy. It's not a question, it's physics" |
| 373 | Critical | Em dash (—) | Not wishes, not aspirations—actual constraints that fail builds | Replace: "aspirations: actual constraints that fail" |
| 805-813 | Critical | Em dashes (—) | Multiple em dashes in cross-references section | Replace all em dashes with colons or periods |
| 848 | Critical | Em dash (—) | James Phoenix's voice—data-driven, pragmatic, leveraging first principles | Replace: "James Phoenix's voice: data-driven, pragmatic..." |
| 885 | Critical | Em dash (—) | as the operational layer of compound systems thinking—moving from philosophy | Replace: "thinking. Moving from philosophy" |

### prds/ch12.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 22 | Critical | Em dash (—) | most practical chapter in the book—readers should keep it bookmarked | Replace: "book. Readers should keep it bookmarked" |
| 79 | Critical | Em dash (—) | Case Study—AI Rank Tracker: A 350K LOC Production System | Replace: "Case Study: AI Rank Tracker" |
| 176 | Critical | Em dash (—) | Troubleshooting Guide—The Five-Point Error Diagnostic Framework | Replace: "Guide: The Five-Point Framework" |
| 190-226 | Critical | Em dashes (—) | Six em dashes in Root Cause headers (lines 190, 199, 208, 217, 226) | Replace all with colons: "Root Cause 1: Context..." |
| 236 | Critical | Em dash (—) | Real-World Workflow—Payment Processing Feature | Replace: "Workflow: Payment Processing Feature" |
| 253 | Critical | Em dash (—) | Cost Optimization Reference—Model Switching Strategy | Replace: "Reference: Model Switching Strategy" |
| 382 | Critical | Em dash (—) | Cost Protection Reference—Multi-Layer Timeout Limits | Replace: "Reference: Multi-Layer Timeout Limits" |
| 435 | Critical | Em dash (—) | Quality Control Reference—Flaky Test Diagnosis | Replace: "Reference: Flaky Test Diagnosis" |

### chapters/ch14-the-meta-engineer-playbook.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 316 | High | paradigm shift | AI-powered coding agents represent a **paradigm shift** | Replace with "fundamental change" or "major shift" |

### chapters/ch07-quality-gates-that-compound.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 11 | Medium | powerful | quality gates are something **more powerful** than pass/fail checkpoints | Replace with "more capable" or "more effective" |

### chapters/ch08-error-handling-and-debugging.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 133 | Medium | powerful | Escalate to **more powerful model** for complex reasoning | Replace with "higher-capacity model" |
| 222 | Medium | powerful | Some tasks genuinely need **more powerful models** | Replace with "higher-capacity models" |
| 248 | Medium | powerful | If you're escalating to **more powerful models** frequently | Replace with "higher-capacity models" |

### chapters/ch09-context-engineering-deep-dive.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 410 | Medium | powerful | Escalate to **more powerful model** for complex reasoning | Replace with "higher-capacity model" |
| 565 | Medium | powerful | Layer 3: Escalate to **more powerful model** | Replace with "higher-capacity model" |

### chapters/ch12-development-workflows.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 3 | Medium | powerful | Individual techniques are **powerful**, but workflows tie them together | Replace with "effective" or "useful" |

### chapters/ch15-model-strategy-and-cost-optimization.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 606 | Medium | powerful | Skills can invoke other skills, creating **powerful workflows** | Replace with "effective workflows" |

### chapters/ch02-getting-started-with-claude-code.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 167 | Medium | comprehensive | Create tests/payment.test.ts with **comprehensive tests** | Replace with "thorough tests" |

### chapters/ch06-the-verification-ladder.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 443 | Medium | comprehensive | API verification (**comprehensive endpoint testing**) | Replace with "thorough endpoint testing" |

### chapters/ch11-sub-agent-architecture.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 5 | Medium | comprehensive | a QA engineer for **comprehensive tests** | Replace with "thorough tests" |
| 25 | Medium | comprehensive | Test coverage: 85% (**comprehensive edge cases**) | Replace with "thorough edge cases" |
| 39 | Medium | comprehensive | **QA Engineer**: Writes **comprehensive tests** covering happy paths | Replace with "thorough tests" |

### chapters/ch13-building-the-harness.md
| Line | Severity | Pattern | Text | Suggested Fix |
|------|----------|---------|------|---------------|
| 559 | Medium | comprehensive | Build **comprehensive test suites** | Replace with "thorough test suites" |

---

## Severity Breakdown

### Critical (45 Em Dashes + 1 Crucial)
- **Em dashes**: 44 total occurrences across 9 PRD files
- **Crucial**: 1 occurrence in prds/ch06.md line 765
- **Issue**: Em dashes and "crucial" are blacklisted AI-generated text tells per CLAUDE.md
- **Action**: Replace all em dashes with colons, periods, hyphens, or semicolons depending on context

### High Priority (2 Paradigm Issues)
1. **paradigm shift** - chapters/ch14-the-meta-engineer-playbook.md:316
2. **paradigm** - prds/ch11.md:65 (noted in existing report)
- **Action**: Replace with "model", "framework", "transition", or "change"

### Medium Priority (14 Instances)
- **powerful** (8 instances) - Overused adjective, consider "effective", "capable", "higher-capacity"
- **comprehensive** (6 instances) - Overused adjective, consider "thorough", "complete", "full"

---

## Em Dash Distribution by File

| File | Count | Status |
|------|-------|--------|
| prds/ch01.md | 1 | Critical |
| prds/ch02.md | 1 | Critical |
| prds/ch04.md | 4 | Critical |
| prds/ch06.md | 5 | Critical |
| prds/ch07.md | 1 | Critical |
| prds/ch09.md | 3 | Critical |
| prds/ch10.md | 3 | Critical |
| prds/ch11.md | 14 | Critical |
| prds/ch12.md | 12 | Critical |
| **TOTAL** | **44** | **Critical** |

---

## Recommendations

### CRITICAL (Must Fix Before Merge)
1. **Replace all 44 em dashes in PRD files**:
   - Independent clauses → period or semicolon
   - Appositive phrases → colon or semicolon
   - Section titles → hyphen (-) or colon (:)

2. **Remove "crucial" from prds/ch06.md:765**:
   - Replace "the crucial insight" with "the key insight" or "the important insight"

### HIGH PRIORITY (Must Fix for Publication)
1. **chapters/ch14:316** - Replace "paradigm shift" with one of:
   - "fundamental change"
   - "major transition"
   - "significant transformation"

### MEDIUM PRIORITY (Optional Polish)
1. Reduce instances of "powerful" (8 occurrences) - generally acceptable but could be more specific
2. Reduce instances of "comprehensive" (6 occurrences) - standard technical terminology but could be more precise

---

## Files with No Issues Found
- chapters/ch01-the-compound-systems-engineer.md
- chapters/ch03-prompting-fundamentals.md
- chapters/ch04-writing-your-first-claude-md.md
- chapters/ch05-the-12-factor-agent.md
- chapters/ch10-the-ralph-loop.md
- prds/ch03.md
- prds/ch05.md
- prds/ch08.md
- prds/ch08-error-handling.md
- prds/index.md
- prds/kb-article-index.md
- prds/ch03-prompting-fundamentals.md
- prds/toc.md
- prds/ch15-model-strategy.md

---

## Quality Assessment

| Category | Status | Notes |
|----------|--------|-------|
| **Chapters - AI Slop** | GOOD | 1 high-priority paradigm issue, 14 medium-priority term uses |
| **Chapters - Writing** | EXCELLENT | Professional, direct, well-structured |
| **PRDs - Formatting** | NEEDS WORK | 44 em dashes to replace |
| **PRDs - Terminology** | GOOD | 1 "crucial" to remove, 1 "paradigm" issue |
| **Overall Quality** | READY (with fixes) | Publication-ready after applying critical fixes |

---

**Report prepared**: 2026-01-27
**Prepared by**: AI Slop Checker Agent
**Scan methodology**: Comprehensive regex scanning across 24 files (15 chapters + 9 PRDs)
