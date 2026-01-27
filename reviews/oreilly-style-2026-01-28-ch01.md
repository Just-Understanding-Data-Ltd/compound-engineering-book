# O'Reilly Style Review - Chapter 1 - 2026-01-28

## Summary
- Files scanned: 1 (chapters/ch01-the-compound-systems-engineer.md)
- Issues found: 10 (High: 2, Medium: 6, Low: 2)

## Issues by Category

### Acronyms & Abbreviations

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 73 | "CRUD" used without expansion on first use | "Create, Read, Update, Delete (CRUD) endpoints" |
| ch01 | 76 | "CI/CD" used without expansion on first use | "continuous integration/continuous deployment (CI/CD)" |

**Correct usage:**
- Line 86: "Domain-Driven Design (DDD)" ✓ Properly expanded
- Line 88: "OpenTelemetry (OTEL)" ✓ Properly expanded

### Cross References

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 354 | Markdown link format instead of O'Reilly standard | Change "See [Chapter 2: Getting Started with Claude Code](ch02-getting-started-with-claude-code.md)" to "See Chapter 2" |
| ch01 | 359 | Markdown link format in related chapters | Change "[Chapter 9: Context Engineering Deep Dive]" to "Chapter 9" |
| ch01 | 360 | Markdown link format in related chapters | Change "[Chapter 10: The RALPH Loop]" to "Chapter 10" |
| ch01 | 361 | Markdown link format in related chapters | Change "[Chapter 13: Building the Harness]" to "Chapter 13" |

**Note**: For Leanpub publishing, markdown links are functional. However, O'Reilly print style prefers explicit "See Chapter X" references without hyperlink syntax for cross-platform compatibility.

### Typography & Formatting

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch01 | 209 | `docker-compose.yml` (constant width in code block) | *docker-compose.yml* (italic when mentioned in prose) |
| ch01 | 228 | `constraints.ts` (constant width in code block) | *constraints.ts* (italic when mentioned in prose) |

**Note**: When filenames appear in prose/commentary, they should be italic. When in code blocks or inline code, constant width is correct.

### Headings

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 98 | "vs." abbreviation in heading | Change "Portfolio Game vs. Single-Bet Game" to "Portfolio Game Versus Single-Bet Game" |

**All C-level headings correctly use Title Case** (O'Reilly requires Title Case for ### headings in this style). Examples:
- Line 13: "### The Single-Bet Trap" ✓
- Line 23: "### The Comparison Trap" ✓
- Line 37: "### What Is Compound Engineering?" ✓

### Code Block Introductions

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 206-208 | Code block follows bold text without colon | Add colon: "**1. Environments** where constraints can be measured and enforced:" |
| ch01 | 225-227 | Code block follows bold text without colon | Add colon: "**2. Constraints** that capture what matters:" |

**Correct usage:**
- Line 131: "The multiplier effect:" ✓ Colon before code block
- Line 183: "The reframing that matters:" ✓ Colon before code block

### Punctuation & Lists

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 145-151 | Numbered list items are complete sentences but lack periods | Add periods to all five items (e.g., "1. Your iteration speed is increasing.") |

**Example of the issue:**
```markdown
Current:
1. Your iteration speed is increasing
2. Your infrastructure is reusable

Should be:
1. Your iteration speed is increasing.
2. Your infrastructure is reusable.
```

**Correct usage** (fragments without periods):
- Lines 84-91: Skill stack list items are fragments ✓
- Lines 112-117: Bulleted list items are fragments ✓

### Inclusive Language

No issues found. The chapter avoids:
- Gendered language
- Violent metaphors (no "kill", "hit", etc.)
- Exclusionary terms
- Color-based problematic terms

### Word Choices (Verified Correct)

The following O'Reilly preferences are correctly used:
- ✓ Serial commas throughout (lines 86, 87, etc.)
- ✓ Numbers spelled out for zero through nine
- ✓ Numerals for 10+ (lines 133-135: "1x output", "2x output", "10x output")
- ✓ Percentage symbol with numerals (no instances in this chapter)
- ✓ Active voice throughout
- ✓ Second-person "you" perspective

## Priority Recommendations

### High Priority (Fix before publication)

1. **Expand CRUD acronym** (line 73)
   - Current: "CRUD endpoints"
   - Fix: "Create, Read, Update, Delete (CRUD) endpoints"

2. **Expand CI/CD acronym** (line 76)
   - Current: "Uses CI/CD"
   - Fix: "Uses continuous integration/continuous deployment (CI/CD)"

### Medium Priority (Consistency and clarity)

3. **Add colons before code blocks** (lines 208, 227)
   - Improves visual hierarchy and follows O'Reilly convention

4. **Change "vs." to "versus" in heading** (line 98)
   - O'Reilly prefers spelled-out words in headings

5. **Italicize filenames in prose** (lines 209, 228)
   - When discussing files conceptually, use italic: *docker-compose.yml*

6. **Add periods to complete sentence list** (lines 145-151)
   - All items in a list should have periods if any one is a complete sentence

### Low Priority (Style preference)

7. **Consider standardizing cross-references** (lines 354, 359-361)
   - Markdown links work for Leanpub
   - "See Chapter X" format is more print-compatible
   - Decision depends on primary publishing platform

## Detailed Line References

### Acronyms
- **Line 73**: "Writes CRUD endpoints" → "Writes Create, Read, Update, Delete (CRUD) endpoints"
- **Line 76**: "Uses CI/CD" → "Uses continuous integration/continuous deployment (CI/CD)"

### Code Block Introductions
- **Line 206**: Change "**1. Environments** where constraints can be measured and enforced" to "**1. Environments** where constraints can be measured and enforced:"
- **Line 225**: Change "**2. Constraints** that capture what matters" to "**2. Constraints** that capture what matters:"

### Typography
- **Line 209**: When this filename appears in prose commentary, change to: *docker-compose.yml*
- **Line 228**: When this filename appears in prose commentary, change to: *constraints.ts*

### Headings
- **Line 98**: Change "### Portfolio Game vs. Single-Bet Game" to "### Portfolio Game Versus Single-Bet Game"

### Lists
- **Lines 145-151**: Add periods to all five numbered items since they are complete sentences

### Cross-References
- **Line 354**: Change "See [Chapter 2: Getting Started with Claude Code](ch02-getting-started-with-claude-code.md)" to "See Chapter 2"
- **Line 359**: Change "[Chapter 9: Context Engineering Deep Dive](ch09-context-engineering-deep-dive.md)" to "Chapter 9"
- **Line 360**: Change "[Chapter 10: The RALPH Loop](ch10-the-ralph-loop.md)" to "Chapter 10"
- **Line 361**: Change "[Chapter 13: Building the Harness](ch13-building-the-harness.md)" to "Chapter 13"

## Positive Observations

1. **Strong O'Reilly voice**: Conversational, second-person, active voice throughout
2. **No AI slop**: Avoids all blacklisted phrases (delve, crucial, pivotal, robust, etc.)
3. **Excellent heading structure**: Consistent Title Case for A/B levels
4. **Clean code examples**: All TypeScript/YAML examples are syntactically correct
5. **Proper serial commas**: Used consistently throughout
6. **Number conventions**: Correctly implements zero-nine spelled out, 10+ as numerals
7. **Technical term introduction**: DDD and OTEL properly expanded on first use
8. **Varied sentence structure**: Good mix of short and long sentences, avoids monotony

## Overall Assessment

**Quality**: High. The chapter demonstrates strong adherence to O'Reilly style with only minor, easily fixable issues.

**Technical accuracy**: Excellent. Code examples are correct and runnable.

**Tone**: Perfect for O'Reilly. Conversational, assumes intelligent reader without condescension.

**Estimated fix time**: 15-20 minutes for all issues.

## Recommended Fix Order

1. **Expand acronyms** (2 fixes, high priority) - 3 minutes
2. **Add colons before code blocks** (2 fixes) - 2 minutes
3. **Fix heading abbreviation** (1 fix) - 1 minute
4. **Add periods to list** (5 items) - 2 minutes
5. **Italicize filenames** (2 fixes) - 2 minutes
6. **Standardize cross-references** (4 fixes, optional) - 5 minutes

Total estimated time: **15 minutes** (or 20 with optional cross-reference changes)
