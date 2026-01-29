#!/bin/bash
# Build PDF version of the book using WeasyPrint
set -e
cd "$(dirname "$0")/.."

echo "=== Building PDF ==="

# Combine all chapters
echo "Combining chapters..."
cat leanpub/frontmatter.md > /tmp/book-combined.md
echo "" >> /tmp/book-combined.md

for ch in leanpub/chapters/ch*.md; do
  echo "  Adding: $(basename "$ch")"
  cat "$ch" >> /tmp/book-combined.md
  echo -e "\n\n" >> /tmp/book-combined.md
done

# Convert to PDF via HTML (WeasyPrint)
echo "Converting to HTML..."
pandoc /tmp/book-combined.md \
  -o /tmp/book.html \
  --standalone \
  --toc \
  --toc-depth=2 \
  --metadata title="The Meta-Engineer" \
  --metadata author="James Phoenix" \
  --css=leanpub/pdf-style.css \
  --embed-resources \
  --highlight-style=tango

echo "Converting HTML to PDF with WeasyPrint..."
weasyprint /tmp/book.html the-meta-engineer.pdf \
  --stylesheet leanpub/pdf-style.css

# Get stats
pages=$(pdfinfo the-meta-engineer.pdf 2>/dev/null | grep Pages | awk '{print $2}' || echo "?")
size=$(ls -lh the-meta-engineer.pdf | awk '{print $5}')

echo ""
echo "=== PDF Build Complete ==="
echo "Output: the-meta-engineer.pdf"
echo "Size: $size"
echo "Pages: $pages"
