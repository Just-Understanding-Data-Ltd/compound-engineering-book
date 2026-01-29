---
name: kindle-review
description: Preview and analyze EPUB rendering on Kindle devices using Kindle Previewer 3 and Gemini vision API. Use when the user wants to test Kindle compatibility, check e-reader rendering, or verify the book displays correctly on Kindle devices. Triggers on mentions of Kindle preview, e-reader testing, or Kindle compatibility.
---

# Kindle Preview Review

Preview the book's EPUB in Kindle Previewer 3, capture screenshots of how it renders on different Kindle devices, and analyze with Gemini's vision API.

## Prerequisites

**Kindle Previewer 3** must be installed manually (requires sudo):

```bash
# Option 1: Homebrew (requires sudo password prompt)
brew install --cask kindle-previewer

# Option 2: Direct download from Amazon
# https://www.amazon.com/Kindle-Previewer/b?ie=UTF8&node=21381691011
```

**Other requirements:**
- `GEMINI_API_KEY` in `.env` file
- `@google/genai` npm package installed
- macOS (uses AppleScript for automation)

## Quick Start

```bash
# Full review (all devices, 10 pages each)
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/kindle-preview.ts

# Specific EPUB file
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/kindle-preview.ts \
  --epub output/the-meta-engineer.epub

# Single device
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/kindle-preview.ts \
  --device "Kindle Paperwhite 5"

# More pages
source .env && GEMINI_API_KEY=$GEMINI_API_KEY npx tsx scripts/kindle-preview.ts \
  --pages 20

# Screenshots only (no Gemini)
npx tsx scripts/kindle-preview.ts --screenshots-only
```

## Supported Devices

The script tests on these Kindle devices/apps:

| Device | Type | Notes |
|--------|------|-------|
| Kindle Paperwhite 5 | E-ink | Most popular e-reader |
| Kindle Oasis 3 | E-ink | Larger screen |
| Kindle (2022) | E-ink | Basic e-reader |
| Kindle Fire HD 10 | Tablet | Color display |
| Kindle iOS | App | iPhone/iPad rendering |

## Workflow

1. **Open in Kindle Previewer**:
   - Launches Kindle Previewer 3 via AppleScript
   - Opens the EPUB file
   - Waits for rendering to complete

2. **Capture Screenshots**:
   - Uses macOS `screencapture` to capture the preview window
   - Navigates through pages using keyboard simulation
   - Saves PNGs to `.kindle-review/screenshots/<device>/`

3. **Gemini Analysis**:
   - Sends screenshots to `gemini-2.5-flash` vision model
   - Analyzes Kindle-specific rendering issues:
     - Code block readability on e-ink
     - Font sizing and typography
     - Table rendering on small screens
     - Image clarity and sizing
     - Page breaks and navigation
   - Saves report to `.kindle-review-report.md`

4. **Create Tasks** (manual step after review):
   - Read `.kindle-review-report.md`
   - For critical Kindle issues, create tasks in `tasks.json`
   - Priority: issues affecting e-ink readability = high

## Output Files

| File | Description |
|------|-------------|
| `.kindle-review/screenshots/` | Device-specific screenshot folders |
| `.kindle-review-report.md` | Gemini analysis report |

All output files are gitignored.

## Common Kindle Issues

After reviewing the report, common fixes include:

### E-ink Readability
- Increase code block font size
- Ensure sufficient contrast
- Avoid color-dependent information

### Code Blocks
- May need wider margins on Paperwhite
- Consider shorter line lengths for better wrapping
- Test syntax highlighting visibility on e-ink

### Tables
- Wide tables may need horizontal scrolling
- Consider responsive table CSS
- Test column alignment on narrow screens

### Images
- Verify diagrams are readable on e-ink
- Check image sizing on different devices
- Ensure alt text is meaningful

## Differences from epub-review

| Aspect | epub-review | kindle-review |
|--------|-------------|---------------|
| Tool | Playwright (browser) | Kindle Previewer (native) |
| Focus | General EPUB formatting | Kindle device compatibility |
| CSS | Custom EPUB stylesheet | Kindle's built-in rendering |
| Devices | N/A | Multiple Kindle models |
| Output | How it looks in any reader | How it looks on Kindle |

## Troubleshooting

### "Kindle Previewer 3 not installed"
Install with Homebrew (requires sudo):
```bash
brew install --cask kindle-previewer
```

### AppleScript Accessibility
Grant Terminal/Claude Code accessibility permissions in:
System Settings > Privacy & Security > Accessibility

### Screenshots Not Capturing
Ensure Kindle Previewer window is visible and not minimized.

### EPUB Not Found
Build the EPUB first:
```bash
./scripts/build-asciidoc.sh --epub
```
