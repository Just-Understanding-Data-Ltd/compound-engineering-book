# Cross-Reference Validation Review

**Date**: 2026-01-28
**Validator**: Claude Opus 4.5
**Scope**: All files in `chapters/` and `prds/`
**Files Scanned**: 15 chapters, 18 PRDs

---

## Summary

| Category | Issues Found | Critical | Fixed Since Last Review |
|----------|--------------|----------|-------------------------|
| Broken Links | 3 | 3 | 1 (ch11 Ch15 ref now valid) |
| PRD Misalignments | 5 | 0 | Managed via features.json mapping |
| Missing Cross-Refs | 4 | 0 | 0 |
| Chapter Reference Issues | 1 | 1 | 4 (ch14, ch15 now written) |

**Overall Status**: 3 critical broken links remaining in ch01

---

## Broken Links

| File | Line | Link Target | Status | Fix |
|------|------|-------------|--------|-----|
| ch01-the-compound-systems-engineer.md | 359 | `ch07-context-engineering-deep-dive.md` | BROKEN | Should be `ch09-context-engineering-deep-dive.md` |
| ch01-the-compound-systems-engineer.md | 360 | `ch08-the-ralph-loop.md` | BROKEN | Should be `ch10-the-ralph-loop.md` |
| ch01-the-compound-systems-engineer.md | 361 | `ch10-building-the-harness.md` | BROKEN | Should be `ch13-building-the-harness.md` |

**Note**: All three broken links in ch01 refer to non-existent files. The chapters exist but with different numbering due to the addition of 4 new chapters.

---

## Chapter Reference Issues

### ch01 Incorrect Chapter Numbers (Critical)

Lines 359-361 in ch01 use the OLD chapter numbering scheme:

```markdown
## Current (WRONG)
- [Chapter 7: Context Engineering Deep Dive](ch07-context-engineering-deep-dive.md)
- [Chapter 8: The RALPH Loop](ch08-the-ralph-loop.md)
- [Chapter 10: Building the Harness](ch10-building-the-harness.md)

## Should Be (CORRECT)
- [Chapter 9: Context Engineering Deep Dive](ch09-context-engineering-deep-dive.md)
- [Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md)
- [Chapter 13: Building the Harness](ch13-building-the-harness.md)
```

---

## Resolved Issues (Since 2026-01-27 Review)

| Issue | Status |
|-------|--------|
| ch11 references Chapter 15 which didn't exist | RESOLVED - Chapter 15 now written |
| ch03 references ch09 which didn't exist | RESOLVED - Chapter 9 now written |
| Forward references to unwritten ch10-ch15 | RESOLVED - All chapters now written |

---

## Missing Cross-Reference Sections

| Chapter | Has "Related Chapters" Section | Status |
|---------|-------------------------------|--------|
| ch04 | **NO** | Should add |
| ch05 | **NO** | Should add |
| ch06 | Yes (incomplete) | Should complete |
| ch07 | **NO** | Should add |
| ch09 | **NO** | Should add |

### Chapters with Good Cross-Reference Sections (use as models)

- ch01 (lines 357-361) - Has section but wrong chapter numbers
- ch02 (lines 459-463) - Valid references
- ch03 (lines 492-496) - Valid references
- ch08 (lines 693-700) - Valid references
- ch10 (lines 538-545) - Valid references
- ch11 (lines 718-724) - Valid references
- ch12 (lines 618-623) - Valid references
- ch13 (lines 612-618) - Valid references
- ch14 (lines 671-677) - Valid references
- ch15 (lines 916-920) - Valid references

---

## PRD to Chapter Mapping

The PRD file naming uses the OLD numbering scheme. The mapping is documented in `features.json`:

| PRD File | Describes | Actual Chapter |
|----------|-----------|----------------|
| prds/ch01.md | The Compound Systems Engineer | ch01 |
| prds/ch02.md | Getting Started with Claude Code | ch02 |
| prds/ch03-prompting-fundamentals.md | Prompting Fundamentals | ch03 (NEW) |
| prds/ch03.md | Writing Your First CLAUDE.md | ch04 |
| prds/ch04.md | The 12-Factor Agent | ch05 |
| prds/ch05.md | The Verification Ladder | ch06 |
| prds/ch06.md | Quality Gates That Compound | ch07 |
| prds/ch08-error-handling.md | Error Handling & Debugging | ch08 (NEW) |
| prds/ch07.md | Context Engineering Deep Dive | ch09 |
| prds/ch08.md | The RALPH Loop | ch10 |
| prds/ch09.md | Sub-Agent Architecture | ch11 |
| prds/ch12-development-workflows.md | Development Workflows | ch12 (NEW) |
| prds/ch10.md | Building the Harness | ch13 |
| prds/ch11.md | The Meta-Engineer Playbook | ch14 |
| prds/ch15-model-strategy.md | Model Strategy & Cost Optimization | ch15 (NEW) |

**Status**: Mapping is documented in features.json, so the naming inconsistency is manageable.

---

## Asset References

All diagram placeholder files exist in `assets/diagrams/`:
- ch01-compound-flywheel.md
- ch03-prompt-anatomy.md
- ch04-claudemd-hierarchy.md
- ch05-12factor-overview.md
- ch06-verification-ladder.md
- ch07-quality-gates.md
- ch08-error-diagnostic.md
- ch09-context-window.md
- ch10-ralph-loop.md
- ch11-subagent-architecture.md
- ch12-workflows.md
- ch13-harness-architecture.md
- ch14-six-waves.md
- ch15-model-selection.md

**Note**: ch02 diagram file is missing (ch02-tool-ecosystem.md not found)

No chapters currently include inline image references to these diagrams.

---

## Recommended Fixes

### Critical (Block Publishing)

1. **Fix ch01 cross-references** (lines 359-361):
   ```markdown
   - [Chapter 9: Context Engineering Deep Dive](ch09-context-engineering-deep-dive.md)
   - [Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md)
   - [Chapter 13: Building the Harness](ch13-building-the-harness.md)
   ```

### Medium Priority

2. **Add Related Chapters sections** to ch04, ch05, ch07, ch09

3. **Complete ch06 cross-reference section**

4. **Create ch02 diagram file** (ch02-tool-ecosystem.md)

### Low Priority

5. Consider renaming PRD files to match actual chapter numbers (optional since features.json has mapping)

---

## Validation Method

1. Globbed all files in `chapters/` and `prds/`
2. Read each chapter file (15 total)
3. Extracted all markdown links with pattern `(ch*-*.md)`
4. Verified each link target file exists
5. Cross-checked chapter number references against actual file names
6. Compared against previous review (2026-01-27) for delta analysis

---

*Generated by cross-ref-validator agent*
