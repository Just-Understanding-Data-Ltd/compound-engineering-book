# Responsive Table Strategy for Small Screens

This document describes the pattern for handling tables with 4+ columns that need to render differently for PDF (wide screens) vs EPUB/Kindle (narrow screens).

## The Problem

Tables with 4+ columns become unreadable on EPUB readers and phones. Column text wraps excessively or gets truncated.

## The Solution

Use AsciiDoc backend conditionals to show:
- **PDF**: Full table with all columns
- **EPUB**: Either simplified table (fewer columns) or stacked definition list format

## Pattern 1: Conditional Full vs Simplified Table

```asciidoc
// PDF: Show full table with all columns
ifdef::backend-pdf[]
[width="100%",cols="25%,25%,25%,25%",options="header"]
|===
|Column A |Column B |Column C |Column D
|Value 1 |Value 2 |Value 3 |Value 4
|===
endif::[]

// EPUB: Show simplified 2-column version
ifndef::backend-pdf[]
[width="100%",cols="40%,60%",options="header"]
|===
|Item |Details
|Value 1 |Value 2, Value 3, Value 4
|===
endif::[]
```

## Pattern 2: Table in PDF, Definition List in EPUB

For complex data, use a definition list in EPUB which stacks naturally:

```asciidoc
// PDF: Full table
ifdef::backend-pdf[]
[width="100%",cols="20%,20%,30%,30%",options="header"]
|===
|Tool |Best For |Strengths |Limitations
|Claude Code |Multi-file |Full repo context |~30s per turn
|Cursor |Quick edits |Sub-second |Limited context
|===
endif::[]

// EPUB: Definition list (stacks on narrow screens)
ifndef::backend-pdf[]
*Claude Code*:: Best for multi-file workflows. Provides full repo context. Trade-off: ~30s per turn.

*Cursor*:: Best for quick edits. Sub-second response. Trade-off: limited context window.
endif::[]
```

## Pattern 3: Rotated Table (Long Headers, Short Values)

When headers are long but values are short, swap rows and columns:

```asciidoc
// PDF: Original orientation
ifdef::backend-pdf[]
[width="100%",cols="25%,25%,25%,25%",options="header"]
|===
|Standard Input |Batch Input |Standard Output |Batch Output
|$3/MTok |$1.50/MTok |$15/MTok |$7.50/MTok
|===
endif::[]

// EPUB: Rotated to 2 columns
ifndef::backend-pdf[]
[width="100%",cols="50%,50%"]
|===
|Standard Input |$3/MTok
|Batch Input |$1.50/MTok
|Standard Output |$15/MTok
|Batch Output |$7.50/MTok
|===
endif::[]
```

## Tables Updated With Responsive Strategy

The following tables have been updated with conditional rendering:

1. **ch02**: Claude Code vs Cursor vs ChatGPT comparison (4 cols)
2. **ch06**: Verification ladder levels (4 cols)
3. **ch10**: RALPH phases (4 cols)
4. **ch13**: Layer descriptions (4 cols, 2 tables)
5. **ch14**: Playbook reference (4 cols)
6. **ch15**: Batch cost savings (5 cols)
7. **ch16**: Review agent config (4 cols), Health check schedule (5 cols)

## When to Use Each Pattern

| Scenario | Recommended Pattern |
|----------|---------------------|
| Comparison tables (vs) | Pattern 1: Simplified merge |
| Reference tables | Pattern 2: Definition list |
| Numeric data (pricing) | Pattern 3: Rotated |
| Sequential steps | Pattern 2: Definition list |

## Testing

To verify responsive rendering:

```bash
# Build PDF (should show full tables)
./scripts/build-asciidoc.sh --pdf

# Build EPUB (should show simplified/stacked)
./scripts/build-asciidoc.sh --epub
```

Open both outputs and compare table readability.
