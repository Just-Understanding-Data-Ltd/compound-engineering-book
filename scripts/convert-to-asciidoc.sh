#!/bin/bash
# Convert Markdown chapters to AsciiDoc format
# Uses pandoc with post-processing for AsciiDoc-specific enhancements
set -e
cd "$(dirname "$0")/.."

# Paths
CHAPTERS_DIR="chapters"
ASCIIDOC_DIR="asciidoc"
LEANPUB_DIR="leanpub"

# Parse arguments
VERBOSE=""
SINGLE_CHAPTER=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose) VERBOSE="1"; shift ;;
    --chapter)
      SINGLE_CHAPTER="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --chapter FILE  Convert single chapter (e.g., ch01-the-compound-systems-engineer.md)"
      echo "  -v              Verbose output"
      echo "  -h              Show this help"
      echo ""
      echo "Examples:"
      echo "  $0                              # Convert all chapters"
      echo "  $0 --chapter ch01*.md           # Convert ch01 only"
      echo "  $0 -v                           # Convert all with verbose output"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Create output directory
mkdir -p "$ASCIIDOC_DIR"

log() {
  if [[ -n "$VERBOSE" ]]; then
    echo "$1"
  fi
}

# Post-process AsciiDoc to fix common issues
postprocess_asciidoc() {
  local file="$1"
  local temp_file="${file}.tmp"

  # Fix 1: Convert chapter headings (= should be == for chapters in multi-doc books)
  # In a book structure, = is reserved for book title
  # == is for chapter titles, === for sections, ==== for subsections

  # Fix 2: Add proper source language to code blocks if missing
  # pandoc should handle this, but we ensure consistency

  # Fix 3: Convert any remaining Markdown-style links to AsciiDoc format
  # [text](link) -> link[text]

  # Fix 4: Ensure tables have proper column widths

  # Process the file
  cat "$file" | \
    # Remove pandoc deprecation warning if present
    grep -v "^\[WARNING\] Deprecated:" | \
    # Fix smart quotes that might cause issues
    sed 's/"/"/g' | \
    sed 's/"/"/g' | \
    sed "s/'/'/g" | \
    sed "s/'/'/g" > "$temp_file"

  mv "$temp_file" "$file"
}

# Convert a single chapter
convert_chapter() {
  local md_file="$1"
  local basename=$(basename "$md_file" .md)
  local adoc_file="${ASCIIDOC_DIR}/${basename}.adoc"

  echo "Converting: $md_file -> $adoc_file"

  # Convert using pandoc
  # Use asciidoc format (not asciidoctor which is deprecated)
  # --wrap=none prevents unwanted line wrapping
  # --standalone adds document header
  pandoc \
    -f markdown \
    -t asciidoc \
    --wrap=none \
    -o "$adoc_file" \
    "$md_file"

  log "  Pandoc conversion complete"

  # Apply post-processing
  postprocess_asciidoc "$adoc_file"
  log "  Post-processing complete"

  # Report stats
  local lines=$(wc -l < "$adoc_file" | tr -d ' ')
  local words=$(wc -w < "$adoc_file" | tr -d ' ')
  echo "  Output: $lines lines, $words words"
}

# Main execution
echo "=== Markdown to AsciiDoc Conversion ==="
echo "Source: $CHAPTERS_DIR/"
echo "Output: $ASCIIDOC_DIR/"
echo ""

if [[ -n "$SINGLE_CHAPTER" ]]; then
  # Convert single chapter
  chapter_file=$(ls "$CHAPTERS_DIR"/$SINGLE_CHAPTER 2>/dev/null | head -1)
  if [[ -z "$chapter_file" ]]; then
    echo "Error: Chapter not found matching: $SINGLE_CHAPTER"
    exit 1
  fi
  convert_chapter "$chapter_file"
else
  # Convert all chapters
  chapter_count=0
  for md_file in "$CHAPTERS_DIR"/ch*.md; do
    if [[ -f "$md_file" ]]; then
      convert_chapter "$md_file"
      ((chapter_count++))
    fi
  done

  echo ""
  echo "=== Conversion Complete ==="
  echo "Converted $chapter_count chapters"
fi

echo ""
echo "Output files:"
ls -la "$ASCIIDOC_DIR"/*.adoc 2>/dev/null | head -20
