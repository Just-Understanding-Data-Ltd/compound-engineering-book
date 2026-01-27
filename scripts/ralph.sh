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
    if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
        # Count pending tasks from tasks.json
        jq '.stats.pending' tasks.json 2>/dev/null || echo "0"
    elif [ -f "features.json" ] && command -v jq &> /dev/null; then
        # Fallback to features.json
        local chapter_tasks=$(jq '[.chapters[].milestones | to_entries[] | select(.value == false)] | length' features.json 2>/dev/null || echo "0")
        local pending_tasks=$(jq '[.tasks.kbArticlesToCreate[]?, .tasks.appendices[]?, .tasks.crossRefFixes[]?, .tasks.generalReview[]? | select(.status == "pending")] | length' features.json 2>/dev/null || echo "0")
        echo $((chapter_tasks + pending_tasks))
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
    if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
        echo "## Task Queue (from tasks.json)"
        echo ""
        echo "### Stats"
        jq -r '"Pending: \(.stats.pending) | Complete: \(.stats.complete) | Total: \(.stats.total)"' tasks.json 2>/dev/null
        echo ""
        echo "### Next 10 Pending Tasks"
        jq -r '.tasks[] | select(.status == "pending") | "- [\(.type)] \(.title)"' tasks.json 2>/dev/null | head -10
        echo ""
    elif [ -f "features.json" ] && command -v jq &> /dev/null; then
        echo "## Task Queue (from features.json - fallback)"
        jq -r '.chapters | to_entries[] | select(.value.milestones | to_entries | map(select(.value == false)) | length > 0) | "- \(.key)"' features.json 2>/dev/null | head -10
        echo ""
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

3. Verify features.json exists and has tasks
4. Read prds/index.md to understand book structure
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
   - Read tasks.json (primary task list)
   - Read @LEARNINGS.md
   - Run `git log --oneline -5`

2. Choose FIRST pending task from tasks.json:
   ```bash
   jq '.tasks[] | select(.status == "pending") | {id, type, title}' tasks.json | head -20
   ```

3. If task has subtasks, complete ONE subtask:
   ```bash
   jq '.tasks[] | select(.id == "task-001") | .subtasks[] | select(.status == "pending")' tasks.json
   ```

4. If writing content:
   - Read the PRD first (from tasks.json prds section or prds/ folder)
   - Read source articles from ~/Desktop/knowledge-base/
   - Write to chapters/ or kb/

5. Complete ONE task/subtask only

6. Update tracking:
   - Update task status in tasks.json ("pending" -> "complete")
   - Update stats in tasks.json
   - Add entry to claude-progress.txt
   - Every 5 iterations: add learning to @LEARNINGS.md

7. Discover new tasks:
   - Check reviews/ for issues found
   - Add new tasks to tasks.json

8. Git commit with descriptive message

Rules:
- ONE task per session
- Always read PRD before writing chapter
- No em dashes in content
- Commit after every task
- All tasks tracked in tasks.json
CODING_INSTRUCTIONS

    run_claude "$prompt_file"
}

# ==============================================================================
# Review Sub-Agents (Every N Iterations)
# ==============================================================================

# Helper to extract markdown body from agent file (strips YAML frontmatter)
get_agent_prompt() {
    local agent_file="$1"
    if [ -f "$agent_file" ]; then
        # Skip YAML frontmatter (between --- markers) and return the rest
        awk '/^---$/{if(++c==2)next}c>=2' "$agent_file"
    else
        echo "# Agent file not found: $agent_file"
    fi
}

run_review_agents() {
    local iteration=$1
    local agents_dir="$PROJECT_DIR/.claude/agents"

    echo ""
    echo "========================================"
    echo "REVIEW CYCLE - Iteration $iteration"
    echo "========================================"

    # Agent 1: Slop Checker
    echo ""
    echo "--- Review 1: Anti-AI Slop ---"
    local slop_file="$PROMPT_DIR/slop.md"
    get_agent_prompt "$agents_dir/slop-checker.md" > "$slop_file"
    run_claude "$slop_file"

    # Agent 2: Diagram Reviewer
    echo ""
    echo "--- Review 2: Diagrams ---"
    local diag_file="$PROMPT_DIR/diagrams.md"
    get_agent_prompt "$agents_dir/diagram-reviewer.md" > "$diag_file"
    run_claude "$diag_file"

    # Agent 3: Tech Accuracy
    echo ""
    echo "--- Review 3: Technical Accuracy ---"
    local tech_file="$PROMPT_DIR/tech.md"
    get_agent_prompt "$agents_dir/tech-accuracy.md" > "$tech_file"
    run_claude "$tech_file"

    # Agent 4: Term Introduction Checker
    echo ""
    echo "--- Review 4: Term Introductions ---"
    local term_file="$PROMPT_DIR/terms.md"
    get_agent_prompt "$agents_dir/term-intro-checker.md" > "$term_file"
    run_claude "$term_file"

    # Agent 5: O'Reilly Style
    echo ""
    echo "--- Review 5: O'Reilly Style ---"
    local style_file="$PROMPT_DIR/oreilly.md"
    get_agent_prompt "$agents_dir/oreilly-style.md" > "$style_file"
    run_claude "$style_file"

    # Agent 6: Cross-refs
    echo ""
    echo "--- Review 6: Cross-References ---"
    local xref_file="$PROMPT_DIR/xref.md"
    get_agent_prompt "$agents_dir/cross-ref-validator.md" > "$xref_file"
    run_claude "$xref_file"

    # Agent 7: Summary
    echo ""
    echo "--- Review 7: Progress Summary ---"
    local sum_file="$PROMPT_DIR/summary.md"
    get_agent_prompt "$agents_dir/progress-summarizer.md" > "$sum_file"
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
