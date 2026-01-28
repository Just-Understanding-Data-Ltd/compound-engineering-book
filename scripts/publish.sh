#!/bin/bash
# Leanpub Build + Publish Pipeline
# Usage: ./scripts/publish.sh [preview|publish]
# Requires: LEANPUB_API_KEY environment variable

set -e
cd "$(dirname "$0")/.."

# Load .env if it exists
[ -f .env ] && export $(grep -v '^#' .env | xargs)

SLUG="the-meta-engineer"
ACTION="${1:-preview}"
API_KEY="${LEANPUB_API_KEY:?Error: Set LEANPUB_API_KEY in .env or environment}"

echo "=== Leanpub Pipeline ==="
echo "Book: $SLUG"
echo "Action: $ACTION"
echo ""

# Step 1: Build manuscript
echo "--- Step 1: Build Manuscript ---"
./scripts/leanpub-build.sh
echo ""

# Step 2: Generate EPUB
echo "--- Step 2: Generate EPUB ---"
pandoc \
  leanpub/frontmatter.md \
  leanpub/part1.md \
  chapters/ch01-the-compound-systems-engineer.md \
  chapters/ch02-getting-started-with-claude-code.md \
  chapters/ch03-prompting-fundamentals.md \
  leanpub/part2.md \
  chapters/ch04-writing-your-first-claude-md.md \
  chapters/ch05-the-12-factor-agent.md \
  chapters/ch06-the-verification-ladder.md \
  leanpub/part3.md \
  chapters/ch07-quality-gates-that-compound.md \
  chapters/ch08-error-handling-and-debugging.md \
  chapters/ch09-context-engineering-deep-dive.md \
  leanpub/part4.md \
  chapters/ch10-the-ralph-loop.md \
  chapters/ch11-sub-agent-architecture.md \
  chapters/ch12-development-workflows.md \
  chapters/ch13-building-the-harness.md \
  chapters/ch14-the-meta-engineer-playbook.md \
  chapters/ch15-model-strategy-and-cost-optimization.md \
  leanpub/backmatter.md \
  --metadata title="The Meta-Engineer: 10x Was the Floor" \
  --metadata subtitle="Building Autonomous AI Systems with Claude Code" \
  --metadata author="James Phoenix" \
  --epub-cover-image=leanpub/images/cover.jpg \
  --css=leanpub/epub-style.css \
  --from markdown-yaml_metadata_block \
  --lua-filter=leanpub/filters/strip-md-links.lua \
  --syntax-highlighting=tango \
  --toc \
  --toc-depth=2 \
  -o the-meta-engineer.epub

echo "EPUB generated: $(ls -lh the-meta-engineer.epub | awk '{print $5}')"
echo ""

# Step 3: Check book exists
echo "--- Step 3: Verify Book ---"
EXISTS=$(curl -s "https://leanpub.com/$SLUG/exists.json?api_key=$API_KEY")
echo "Book status: $EXISTS"
echo ""

# Step 4: Preview or Publish
if [ "$ACTION" = "preview" ]; then
  echo "--- Step 4: Triggering Preview ---"
  RESULT=$(curl -s -X POST -d "api_key=$API_KEY" \
    "https://leanpub.com/$SLUG/preview.json")
  echo "Preview result: $RESULT"

elif [ "$ACTION" = "publish" ]; then
  echo "--- Step 4: Publishing ---"
  NOTES="Published from commit $(git rev-parse --short HEAD) on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  RESULT=$(curl -s -X POST \
    -d "api_key=$API_KEY" \
    -d "publish[email_readers]=false" \
    -d "publish[release_notes]=$NOTES" \
    "https://leanpub.com/$SLUG/publish.json")
  echo "Publish result: $RESULT"

else
  echo "Unknown action: $ACTION (use 'preview' or 'publish')"
  exit 1
fi

echo ""

# Step 5: Poll job status
echo "--- Step 5: Waiting for job ---"
while true; do
  STATUS=$(curl -s "https://leanpub.com/$SLUG/job_status.json?api_key=$API_KEY")
  if [ "$STATUS" = "{}" ] || [ -z "$STATUS" ]; then
    echo "Job complete!"
    break
  fi
  MSG=$(echo "$STATUS" | jq -r '.message // "Processing..."')
  NUM=$(echo "$STATUS" | jq -r '.num // 0')
  TOTAL=$(echo "$STATUS" | jq -r '.total // 0')
  printf "\r  %s (%s/%s)   " "$MSG" "$NUM" "$TOTAL"
  sleep 5
done

echo ""

# Step 6: Get book info
echo "--- Step 6: Book Info ---"
INFO=$(curl -s "https://leanpub.com/$SLUG.json?api_key=$API_KEY")
echo "$INFO" | jq '{
  title: .title,
  url: .url,
  word_count: .word_count,
  page_count: .page_count,
  total_copies_sold: .total_copies_sold,
  total_revenue: .total_revenue,
  last_published_at: .last_published_at
}'

echo ""
echo "=== Pipeline Complete ==="
echo "Book URL: https://leanpub.com/$SLUG"
