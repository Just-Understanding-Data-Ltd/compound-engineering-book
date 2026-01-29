#!/bin/bash
# Build Leanpub manuscript from AsciiDoc source chapters

set -e
cd "$(dirname "$0")/.."

echo "=== Leanpub Build ==="
echo "Converting AsciiDoc chapters to Markua format..."

# Clean and recreate chapters dir
rm -rf leanpub/chapters
mkdir -p leanpub/chapters leanpub/images

# Check for pandoc
if ! command -v pandoc &> /dev/null; then
  echo "Error: pandoc is required but not installed."
  exit 1
fi

# Convert each AsciiDoc chapter to Markdown
for src in asciidoc/ch*.adoc; do
  basename_adoc=$(basename "$src")
  filename="${basename_adoc%.adoc}.md"
  dest="leanpub/chapters/$filename"

  echo "  Converting: $basename_adoc -> $filename"

  # Convert AsciiDoc to Markdown with pandoc, then apply Markua transforms
  pandoc -f asciidoc -t markdown --wrap=none "$src" | \
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
    sed -E 's/\[([^]]+)\]\(ch[0-9]+[^)]*\.md\)/\1/g' \
    > "$dest"
done

# Copy images
echo "Copying images..."
if [ -d "assets/images" ]; then
  find assets/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.svg" \) -exec cp {} leanpub/images/ \; 2>/dev/null || true
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
