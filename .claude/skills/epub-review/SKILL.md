---
name: epub-review
description: Review EPUB formatting using Gemini vision API. Use when the user wants to visually review the book's EPUB output, check formatting quality, identify styling issues, or generate formatting improvement tasks. Triggers on mentions of EPUB review, book formatting, visual review, or Gemini review.
---

# EPUB Visual Review

Review the book's EPUB formatting by rendering chapters as screenshots and analyzing them with Gemini's vision API.

## Quick Start

```bash
# Full review (all chapters)
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/epub-review.ts

# Single chapter
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/epub-review.ts --chapter 5

# Screenshots only (no Gemini)
npx tsx scripts/epub-review.ts --screenshots-only

# Rebuild EPUB first, then review
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/epub-review.ts --rebuild
```

## Prerequisites

- `GEMINI_API_KEY` in `.env` file
- `@google/genai` and `playwright` npm packages installed
- Chromium browser installed (`npx playwright install chromium`)

## Workflow

1. **Rebuild EPUB** (optional with `--rebuild`):
   - Runs `scripts/leanpub-build.sh` to convert chapters
   - Runs pandoc with `--syntax-highlighting=tango --css=leanpub/epub-style.css`

2. **Extract and Screenshot**:
   - Extracts EPUB (ZIP) to `.epub-review/`
   - Opens each XHTML chapter in headless Chromium
   - Takes full-page PNG screenshots to `.epub-review/screenshots/`

3. **Gemini Analysis**:
   - Sends screenshots to `gemini-2.5-flash` vision model
   - Analyzes: code blocks, typography, tables, spacing, lists, readability
   - Saves report to `.epub-review-report.md`

4. **Create Tasks** (manual step after review):
   - Read `.epub-review-report.md`
   - For each actionable issue, create a task in `tasks.json`
   - Priority: formatting issues that hurt readability = high; cosmetic = low

## Output Files

| File | Description |
|------|-------------|
| `.epub-review/screenshots/` | PNG screenshots of each XHTML chapter |
| `.epub-review-report.md` | Gemini formatting analysis report |

All output files are gitignored.

## Improving Formatting

After reviewing the report, common fixes include:

### CSS Changes (`leanpub/epub-style.css`)
- Code block backgrounds, borders, font sizing
- Table borders and header styling
- Blockquote/callout styling
- List spacing and indentation

### Pandoc Options (in workflow and local build)
- `--syntax-highlighting=tango` (or breezedark, kate, espresso)
- `--css=leanpub/epub-style.css`
- `--epub-chapter-level=1`

### Source Markdown Fixes
- Nested code fences: use 4 backticks for outer fences
- Cross-reference links: stripped by `leanpub-build.sh` for EPUB
- Language tags on code blocks: ensure `typescript`, `bash`, `markdown`, etc.

## Validation

After making changes, always validate:

```bash
epubcheck the-meta-engineer.epub
```

Target: 0 fatals, 0 errors, 0 warnings.
