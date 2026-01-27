# Cross-Reference Validation Review

**Date**: 2026-01-27 (Updated with ch08-13 analysis)
**Validator**: Claude Opus 4.5
**Scope**: All files in `chapters/` and `prds/`
**Files Scanned**: 13 chapters, 18 PRDs

---

## Summary

| Category | Issues Found | Critical |
|----------|--------------|----------|
| Broken Links | 4 | 4 |
| PRD Misalignments | 5 | 5 |
| Missing Cross-Refs | 3 | 0 |
| Chapter Reference Issues | 5 | 3 |
| Non-Existent Chapter Refs | 1 | 1 |

**Overall Status**: Requires attention before publishing

---

## Broken Links

| File | Line | Link Target | Status | Fix |
|------|------|-------------|--------|-----|
| ch01-the-compound-systems-engineer.md | 359 | `ch07-context-engineering-deep-dive.md` | BROKEN | Should link to ch09 (Context Engineering is ch09 per TOC) |
| ch01-the-compound-systems-engineer.md | 360 | `ch08-the-ralph-loop.md` | BROKEN | Chapter 10 per new TOC, file doesn't exist yet |
| ch01-the-compound-systems-engineer.md | 361 | `ch10-building-the-harness.md` | BROKEN | Chapter 13 per new TOC, file doesn't exist yet |
| ch03-prompting-fundamentals.md | 496 | `ch09-context-engineering-deep-dive.md` | BROKEN | File doesn't exist yet (chapter not written) |

---

## PRD Misalignments

The PRDs use an **outdated numbering scheme** that predates the addition of 4 new chapters (ch03, ch08, ch12, ch15).

| PRD File | PRD Describes | TOC Chapter | Correct PRD Should Be |
|----------|---------------|-------------|----------------------|
| prds/ch03.md | Writing Your First CLAUDE.md | Ch04: Writing Your First CLAUDE.md | ch04.md |
| prds/ch04.md | The 12-Factor Agent | Ch05: The 12-Factor Agent | ch05.md |
| prds/ch05.md | The Verification Ladder | Ch06: The Verification Ladder | ch06.md |
| prds/ch06.md | Quality Gates That Compound | Ch07: Quality Gates That Compound | ch07.md |
| prds/ch07.md | Context Engineering Deep Dive | Ch09: Context Engineering Deep Dive | ch09.md |

### Missing PRDs (New Chapters)

| Chapter | Title | PRD Status |
|---------|-------|------------|
| Ch03 | Prompting Fundamentals | **MISSING** |
| Ch08 | Error Handling & Debugging | **MISSING** |
| Ch12 | Development Workflows | **MISSING** |
| Ch15 | Model Strategy & Cost Optimization | **MISSING** |

---

## Chapter Reference Issues

| File | Issue | Severity |
|------|-------|----------|
| ch01 | References ch07/ch08/ch10 with old numbers (should be ch09/ch10/ch13) | Critical |
| ch02 | References ch01, ch03, ch04, ch06 - mostly correct | Low |
| ch03 | References ch09 (Context Engineering) - NOW EXISTS | Fixed |
| ch06 | Cross-reference section exists but is incomplete | Low |
| ch11 | References Chapter 15 (Model Strategy) - DOES NOT EXIST | Critical |

### Forward References to Unwritten Chapters

| Source | Target Chapter | Status |
|--------|----------------|--------|
| ch01 | Context Engineering Deep Dive | NOW WRITTEN (ch09) - link still broken |
| ch01 | The RALPH Loop | NOW WRITTEN (ch10) - link still broken |
| ch01 | Building the Harness | NOW WRITTEN (ch13) - link still broken |
| ch03 | Context Engineering Deep Dive | NOW WRITTEN (ch09) |
| ch11 | Model Strategy (Chapter 15) | NOT WRITTEN - chapter doesn't exist |

### Chapters 8-13 Cross-Reference Validation (NEW)

All chapters 8-13 have been written. Here's their cross-reference status:

| Chapter | Related Chapters Section | Cross-Refs Valid | Issues |
|---------|-------------------------|------------------|--------|
| ch08 | Yes (lines ~350) | ✓ Valid | References ch06, ch07, ch09, ch10 correctly |
| ch09 | Yes (lines ~380) | ✓ Valid | References ch03, ch04, ch07, ch10 correctly |
| ch10 | Yes (lines ~330) | ✓ Valid | References ch04, ch07, ch08, ch09, ch11, ch13 correctly |
| ch11 | Yes (lines ~718-724) | ✗ ISSUE | References **Chapter 15** which doesn't exist |
| ch12 | Yes (lines ~619-623) | ✓ Valid | References ch04, ch10, ch11, ch13 correctly |
| ch13 | Yes (lines ~612-618) | ✓ Valid | References ch04, ch07, ch09, ch10, ch11 correctly |

**Critical Issue Found:**
- **ch11 line 724**: `- Chapter 15 (Model Strategy) covers using different model tiers for different agent roles`
- Chapter 15 is listed in `prds/toc.md` but has NOT been written yet
- This forward reference should either be removed or marked as "(upcoming chapter)"

---

## Missing Cross-Reference Sections

| Chapter | Has "Related Chapters" Section | Recommendation |
|---------|-------------------------------|----------------|
| ch01 | Yes (lines 355-362) | Update chapter numbers |
| ch02 | Yes (lines 430+) | OK |
| ch03 | Yes (lines 492+) | Update ch09 reference |
| ch04 | **NO** | Add related chapters section |
| ch05 | **NO** | Add related chapters section |
| ch06 | Yes (incomplete) | Complete the section |
| ch07 | **NO** | Add related chapters section |

---

## Recommendations

### Critical (Must Fix)

1. **Renumber PRDs to match TOC**: Rename prds/ch03.md through ch07.md to match actual chapter numbers, or create a PRD mapping document

2. **Create missing PRDs**: Write PRDs for new chapters:
   - prds/ch03.md (Prompting Fundamentals)
   - prds/ch08.md (Error Handling & Debugging)
   - prds/ch12.md (Development Workflows)
   - prds/ch15.md (Model Strategy & Cost Optimization)

3. **Update ch01 cross-references**: Fix lines 359-361 to use correct chapter numbers:
   - ch07 -> ch09 (Context Engineering)
   - ch08 -> ch10 (RALPH Loop)
   - ch10 -> ch13 (Building the Harness)

4. **Fix ch11 Chapter 15 reference** (line 724):
   - Either remove the reference entirely
   - Or change to: "Chapter 15 (Model Strategy) will cover using different model tiers for different agent roles (upcoming)"
   - Or write Chapter 15 first

### Medium Priority

5. **Add cross-reference sections** to ch04, ch05, ch07

6. **Complete ch06 cross-reference section**

7. ~~Update ch03 reference to ch09~~ - ch09 now exists, reference is valid

### Low Priority

8. Consider adding a `chapter-map.md` file that documents the PRD-to-chapter mapping to prevent future confusion

---

## Asset References

All diagram placeholders exist in `assets/diagrams/`:
- ch01-compound-flywheel.md through ch15-model-decision-tree.md (15 files)
- No broken asset references found

---

## Validation Method

1. Globbed all files in `chapters/` and `prds/`
2. Read each chapter file, extracted markdown links and cross-references
3. Compared PRD topics against TOC chapter assignments
4. Verified asset paths against `assets/diagrams/` directory
5. Cross-checked chapter numbers in cross-reference sections

---

*Generated by cross-ref-validator agent*
