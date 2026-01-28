#!/bin/bash
# Build Leanpub manuscript from source chapters

set -e
cd "$(dirname "$0")/.."

echo "=== Leanpub Build ==="
echo "Converting chapters to Markua format..."

# Clean and recreate chapters dir
rm -rf leanpub/chapters
mkdir -p leanpub/chapters leanpub/images

# Copy and convert each chapter
for src in chapters/ch*.md; do
  filename=$(basename "$src")
  dest="leanpub/chapters/$filename"

  echo "  Converting: $filename"

  # Convert standard markdown to Markua
  cat "$src" | \
    # Add chapter anchor to first h1 header only (line 1)
    sed -E '1s/^# (.+)$/# \1 {#'"${filename%.md}"'}/' | \
    # Convert > blockquotes to {blurb} for tips
    sed -E 's/^> \*\*Tip:\*\* (.+)$/{blurb, class: tip}\n\1\n{\/blurb}/' | \
    # Convert > **Warning:** to warning blurbs
    sed -E 's/^> \*\*Warning:\*\* (.+)$/{blurb, class: warning}\n\1\n{\/blurb}/' | \
    # Convert > **Note:** to information blurbs
    sed -E 's/^> \*\*Note:\*\* (.+)$/{blurb, class: information}\n\1\n{\/blurb}/' | \
    # Add width to images
    sed -E 's/^!\[([^]]*)\]\(([^)]+)\)$/{width=80%}\n![\1](\2)/' | \
    # Strip .md cross-reference links (keep text, remove link)
    # Converts [Chapter Title](chXX-filename.md) to Chapter Title
    sed -E 's/\[([^]]+)\]\(ch[0-9]+[^)]*\.md\)/\1/g' \
    > "$dest"
done

# Copy diagrams as images
echo "Copying diagrams..."
if [ -d "assets/diagrams" ]; then
  find assets/diagrams -type f \( -name "*.png" -o -name "*.svg" \) -exec cp {} leanpub/images/ \; 2>/dev/null || true
fi

# Generate word count report
echo ""
echo "=== Manuscript Stats ==="
total=0
for f in leanpub/chapters/*.md; do
  words=$(wc -w < "$f" | tr -d ' ')
  total=$((total + words))
  printf "  %-50s %6d words\n" "$(basename "$f")" "$words"
done
echo "  ----------------------------------------"
printf "  %-50s %6d words\n" "TOTAL" "$total"

echo ""
echo "=== Build Complete ==="
echo "Manuscript ready in: leanpub/"
echo ""
echo "Next steps:"
echo "  1. Create book at https://leanpub.com/create/book"
echo "  2. Connect GitHub repo or upload leanpub/ folder"
echo "  3. Go to Preview > Generate Preview"
echo "  4. Review PDF/EPUB and publish!"
