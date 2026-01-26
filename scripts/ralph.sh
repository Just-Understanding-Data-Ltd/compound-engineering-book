#!/bin/bash
# ralph.sh - Enhanced RALPH Loop for book writing
#
# Based on:
# - Geoffrey Huntley's RALPH technique: https://ghuntley.com/ralph
# - Anthropic's long-running agent harness: https://anthropic.com/engineering/effective-harnesses-for-long-running-agents
#
# Usage:
#   ./scripts/ralph.sh                     # Run with defaults (3 hours, infinite iterations, review every 6)
#   ./scripts/ralph.sh --max-hours 8       # Run for 8 hours max (overnight)
#   ./scripts/ralph.sh --max-iterations 50 # Run for 50 iterations max (0 = infinite)
#   ./scripts/ralph.sh --review-every 3    # Review every 3 iterations

set -e

# ==============================================================================
# Configuration
# ==============================================================================

MAX_ITERATIONS=${MAX_ITERATIONS:-0}
MAX_HOURS=${MAX_HOURS:-3}
REVIEW_EVERY=${REVIEW_EVERY:-6}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-5}
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        --max-hours)
            MAX_HOURS="$2"
            shift 2
            ;;
        --review-every)
            REVIEW_EVERY="$2"
            shift 2
            ;;
        --sleep)
            SLEEP_BETWEEN="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Calculate max runtime in seconds (supports decimal hours like 0.5 for 30 min)
MAX_SECONDS=$(echo "$MAX_HOURS * 3600" | bc | cut -d'.' -f1)
START_TIME=$(date +%s)

cd "$PROJECT_DIR"

# Create temp directory for prompts
PROMPT_DIR=$(mktemp -d)
trap "rm -rf $PROMPT_DIR" EXIT

# ==============================================================================
# Helper Functions
# ==============================================================================

get_elapsed_seconds() {
    local now=$(date +%s)
    echo $((now - START_TIME))
}

get_elapsed_hours() {
    local elapsed=$(get_elapsed_seconds)
    echo "scale=2; $elapsed / 3600" | bc
}

check_time_limit() {
    local elapsed=$(get_elapsed_seconds)
    if [ $elapsed -ge $MAX_SECONDS ]; then
        echo ""
        echo "========================================"
        echo "TIME LIMIT REACHED"
        echo "Elapsed: $(get_elapsed_hours) hours"
        echo "========================================"
        return 1
    fi
    return 0
}

count_incomplete_tasks() {
    if [ -f "TASKS.md" ]; then
        grep -c "- \[ \]" TASKS.md 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Run claude with prompt from file (avoids shell escaping issues)
run_claude() {
    local prompt_file="$1"
    cat "$prompt_file" | claude --dangerously-skip-permissions -p -
}

# ==============================================================================
# Prompt Building Functions
# ==============================================================================

get_master_prompt() {
    if [ -f "CLAUDE.md" ]; then
        cat "CLAUDE.md"
    else
        echo "# No CLAUDE.md found"
    fi
}

get_prd_index() {
    if [ -f "features.json" ] && command -v jq &> /dev/null; then
        echo "## PRD Index"
        echo ""
        echo "| Chapter | Title | PRD | Chapter Status | Words |"
        echo "|---------|-------|-----|----------------|-------|"
        jq -r '.chapters | to_entries[] | "| \(.key) | \(.value.title) | \(if .value.milestones.prd_complete then "✅" else "⬜" end) | \(.value.status) | \(.value.wordCount) |"' features.json 2>/dev/null || echo "| Error parsing |"
        echo ""
    fi
}

get_task_summary() {
    if [ -f "TASKS.md" ]; then
        echo "## Task Queue (first 10 incomplete)"
        echo ""
        grep "- \[ \]" TASKS.md | head -10
        echo ""
        local total=$(grep -c "- \[ \]" TASKS.md 2>/dev/null || echo "0")
        echo "($total total incomplete)"
    fi
}

# ==============================================================================
# Initializer Agent (First Run Only)
# ==============================================================================

run_initializer_agent() {
    echo ""
    echo "========================================"
    echo "INITIALIZER AGENT"
    echo "========================================"

    local prompt_file="$PROMPT_DIR/init_prompt.md"

    cat > "$prompt_file" << 'INIT_EOF'
# INITIALIZER AGENT

You are setting up a book writing project for long-running agent work.

## Tasks

1. Read CLAUDE.md to understand the project
2. Create claude-progress.txt with this structure:

```
# Progress Log

## Current Status
- Phase: Chapter Writing
- Active: None
- Blockers: None

## Recent Activity
(entries will be added here)

## Compacted History
(older entries summarized here)
```

3. Verify features.json exists
4. Verify TASKS.md has [ ] markers
5. Read prds/index.md to understand book structure
6. Git commit your setup work
7. Update claude-progress.txt

Be thorough. Future agents depend on your setup.
INIT_EOF

    run_claude "$prompt_file"
}

# ==============================================================================
# Coding Agent (Each Iteration)
# ==============================================================================

run_coding_agent() {
    local iteration=$1
    local prompt_file="$PROMPT_DIR/coding_prompt.md"

    # Build the prompt file
    cat > "$prompt_file" << CODING_HEADER
# CODING AGENT - Iteration $iteration

CODING_HEADER

    echo "## Master Context" >> "$prompt_file"
    echo "" >> "$prompt_file"
    get_master_prompt >> "$prompt_file"
    echo "" >> "$prompt_file"
    echo "---" >> "$prompt_file"
    echo "" >> "$prompt_file"

    get_prd_index >> "$prompt_file"
    echo "---" >> "$prompt_file"
    echo "" >> "$prompt_file"

    get_task_summary >> "$prompt_file"
    echo "---" >> "$prompt_file"
    echo "" >> "$prompt_file"

    cat >> "$prompt_file" << 'CODING_INSTRUCTIONS'
## Instructions

1. Get up to speed:
   - Run `pwd`
   - Read claude-progress.txt
   - Read features.json
   - Run `git log --oneline -5`

2. Choose FIRST incomplete task from TASKS.md

3. If writing a chapter:
   - Read the PRD first (prds/chXX.md)
   - Read source articles from @kb/
   - Write to chapters/

4. Complete ONE task only

5. Update tracking:
   - Mark task [x] in TASKS.md
   - Update features.json milestones
   - Add entry to claude-progress.txt

6. Git commit with descriptive message

Rules:
- ONE task per session
- Always read PRD before writing chapter
- No em dashes in content
- Commit after every task
CODING_INSTRUCTIONS

    run_claude "$prompt_file"
}

# ==============================================================================
# Review Sub-Agents (Every N Iterations)
# ==============================================================================

run_review_agents() {
    local iteration=$1

    echo ""
    echo "========================================"
    echo "REVIEW CYCLE - Iteration $iteration"
    echo "========================================"

    # Agent 1: Slop Checker
    echo ""
    echo "--- Review 1: Anti-AI Slop ---"
    local slop_file="$PROMPT_DIR/slop.md"
    cat > "$slop_file" << 'SLOP_EOF'
# SLOP CHECKER

Scan chapters/ and prds/ for AI-generated text patterns:

1. Em dashes (—) - CRITICAL
2. Words: delve, crucial, pivotal, robust, cutting-edge, game-changer
3. Phrases: Additionally, Furthermore, Moreover, It's important to note

Output to: reviews/slop-check-DATE.md

Format: | File | Line | Pattern | Text | Fix |

Commit your review.
SLOP_EOF
    run_claude "$slop_file"

    # Agent 2: Diagram Checker
    echo ""
    echo "--- Review 2: Diagrams ---"
    local diag_file="$PROMPT_DIR/diagrams.md"
    cat > "$diag_file" << 'DIAG_EOF'
# DIAGRAM REVIEWER

Check chapters/ for diagram opportunities:
- Process flows (3+ steps)
- Architecture layers
- Decision trees

Output to: reviews/diagrams-DATE.md

Include Mermaid code drafts.
Update TASKS.md with must-have diagrams.
Commit your review.
DIAG_EOF
    run_claude "$diag_file"

    # Agent 3: Tech Accuracy
    echo ""
    echo "--- Review 3: Technical Accuracy ---"
    local tech_file="$PROMPT_DIR/tech.md"
    cat > "$tech_file" << 'TECH_EOF'
# TECHNICAL ACCURACY

Validate chapters/:
- Code syntax correctness
- Claude Code tool names (Read, Write, Edit, Glob, Grep, Bash, Task)
- Terminology consistency

Output to: reviews/tech-DATE.md
Commit your review.
TECH_EOF
    run_claude "$tech_file"

    # Agent 4: Cross-refs
    echo ""
    echo "--- Review 4: Cross-References ---"
    local xref_file="$PROMPT_DIR/xref.md"
    cat > "$xref_file" << 'XREF_EOF'
# CROSS-REFERENCE VALIDATOR

Check:
- Chapter references work
- PRD to chapter alignment
- Broken links

Output to: reviews/xrefs-DATE.md
Update TASKS.md with fixes needed.
Commit your review.
XREF_EOF
    run_claude "$xref_file"

    # Agent 5: Summary
    echo ""
    echo "--- Review 5: Progress Summary ---"
    local sum_file="$PROMPT_DIR/summary.md"
    cat > "$sum_file" << 'SUM_EOF'
# PROGRESS SUMMARIZER

Create status report from:
- reviews/ files
- features.json
- TASKS.md
- git log

Output to: reviews/summary-DATE.md

Include:
- Completion %
- Top 5 priority actions
- Velocity estimate

Update claude-progress.txt with summary.
Commit all updates.
SUM_EOF
    run_claude "$sum_file"

    echo ""
    echo "Review cycle complete."
}

# ==============================================================================
# Main Loop
# ==============================================================================

echo "========================================"
echo "RALPH Loop - Compound Engineering Book"
echo "========================================"
echo "Project: $PROJECT_DIR"
if [ "$MAX_ITERATIONS" -eq 0 ]; then
    echo "Max iterations: infinite"
else
    echo "Max iterations: $MAX_ITERATIONS"
fi
echo "Max runtime: $MAX_HOURS hours"
echo "Review every: $REVIEW_EVERY iterations"
echo "Started: $(date)"
echo ""

mkdir -p "$PROJECT_DIR/reviews"

# First run check
if [ ! -f "claude-progress.txt" ]; then
    echo "First run detected. Running initializer..."
    run_initializer_agent
    echo ""
    echo "Initializer complete."
fi

iteration=0
while true; do
    iteration=$((iteration + 1))

    # Check iteration limit
    if [ "$MAX_ITERATIONS" -gt 0 ] && [ $iteration -gt $MAX_ITERATIONS ]; then
        echo ""
        echo "MAX ITERATIONS REACHED: $MAX_ITERATIONS"
        break
    fi

    # Check time limit
    if ! check_time_limit; then
        break
    fi

    echo ""
    echo "========================================"
    echo "Iteration $iteration"
    echo "Elapsed: $(get_elapsed_hours)h / ${MAX_HOURS}h"
    echo "Time: $(date '+%H:%M:%S')"
    echo "========================================"

    INCOMPLETE=$(count_incomplete_tasks)
    echo "Incomplete tasks: $INCOMPLETE"

    if [ "$INCOMPLETE" -eq 0 ]; then
        echo ""
        echo "ALL TASKS COMPLETE!"
        exit 0
    fi

    run_coding_agent $iteration

    if [ $((iteration % REVIEW_EVERY)) -eq 0 ]; then
        run_review_agents $iteration
    fi

    echo ""
    echo "Sleeping ${SLEEP_BETWEEN}s..."
    sleep $SLEEP_BETWEEN
done

echo ""
echo "RALPH Loop Complete"
echo "Iterations: $iteration"
echo "Time: $(get_elapsed_hours) hours"
