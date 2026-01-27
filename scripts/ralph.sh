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

# ==============================================================================
# Circuit Breaker & Checkpoints
# ==============================================================================

CONSECUTIVE_FAILURES=0
MAX_CONSECUTIVE_FAILURES=3

get_last_commit() {
    git rev-parse HEAD 2>/dev/null || echo ""
}

update_checkpoint() {
    local task_id="$1"
    local commit_hash=$(get_last_commit)

    if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
        jq --arg commit "$commit_hash" \
           --arg task "$task_id" \
           --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           '.checkpoints.lastGoodCommit = $commit |
            .checkpoints.lastSuccessfulTask = $task |
            .checkpoints.lastCheckpoint = $time |
            .checkpoints.consecutiveFailures = 0' \
           tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json
    fi
}

record_failure() {
    CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))

    if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
        jq --argjson failures "$CONSECUTIVE_FAILURES" \
           '.checkpoints.consecutiveFailures = $failures |
            .checkpoints.failedAttempts = (.checkpoints.failedAttempts + 1)' \
           tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json
    fi

    echo "WARNING: Task failed (attempt $CONSECUTIVE_FAILURES of $MAX_CONSECUTIVE_FAILURES)"
}

check_circuit_breaker() {
    if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
        echo ""
        echo "========================================"
        echo "CIRCUIT BREAKER TRIGGERED"
        echo "Too many consecutive failures: $CONSECUTIVE_FAILURES"
        echo "Last good commit: $(jq -r '.checkpoints.lastGoodCommit // "unknown"' tasks.json 2>/dev/null)"
        echo "========================================"

        if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
            jq '.checkpoints.circuitBreakerTripped = true' tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json
        fi

        return 1
    fi
    return 0
}

reset_circuit_breaker() {
    CONSECUTIVE_FAILURES=0
    if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
        jq '.checkpoints.consecutiveFailures = 0 | .checkpoints.circuitBreakerTripped = false' \
           tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json
    fi
}

run_health_check() {
    if [ -f "scripts/health-check.sh" ]; then
        echo ""
        echo "--- Running Health Check ---"
        bash scripts/health-check.sh
    fi
}

# Run claude with prompt from file (avoids shell escaping issues)
run_claude() {
    local prompt_file="$1"
    cat "$prompt_file" | claude --dangerously-skip-permissions -p -
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

    cat > "$prompt_file" << PROMPT_EOF
Iteration $iteration. Read CLAUDE.md, then complete ONE task from tasks.json. Commit when done.
PROMPT_EOF

    run_claude "$prompt_file"
}

# ==============================================================================
# Review Swarm (Every N Iterations)
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
    local today=$(date +%Y-%m-%d)

    echo ""
    echo "========================================"
    echo "REVIEW CYCLE - Iteration $iteration"
    echo "========================================"

    local prompt_file="$PROMPT_DIR/review.md"

    cat > "$prompt_file" << REVIEW_EOF
Run all 7 review agents IN PARALLEL using the Task tool. Send a single message with 7 Task tool calls.

Agents to run (all in parallel):
1. slop-checker - Check for AI slop words
2. diagram-reviewer - Find diagram opportunities
3. tech-accuracy - Validate code and tools
4. term-intro-checker - Check term introductions
5. oreilly-style - Check O'Reilly conventions
6. cross-ref-validator - Verify cross-references
7. progress-summarizer - Summarize progress

After all complete, write summary to reviews/review-${today}.md and commit.
REVIEW_EOF

    run_claude "$prompt_file"

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

# Reset circuit breaker on fresh start
reset_circuit_breaker

iteration=0
LAST_COMMIT=$(get_last_commit)

while true; do
    iteration=$((iteration + 1))

    # Check circuit breaker
    if ! check_circuit_breaker; then
        echo "Exiting due to circuit breaker"
        exit 1
    fi

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
    echo "Consecutive failures: $CONSECUTIVE_FAILURES"
    echo "========================================"

    INCOMPLETE=$(count_incomplete_tasks)
    echo "Incomplete tasks: $INCOMPLETE"

    if [ "$INCOMPLETE" -eq 0 ]; then
        echo ""
        echo "ALL TASKS COMPLETE!"
        run_health_check
        exit 0
    fi

    # Run task curator every 3 iterations to clean/prioritize queue
    if [ $((iteration % 3)) -eq 0 ]; then
        echo ""
        echo "--- Task Curator ---"
        local curator_file="$PROMPT_DIR/curator.md"
        cat > "$curator_file" << 'CURATOR_EOF'
Use the task-curator agent to review tasks.json and claude-progress.txt. Clean duplicates, adjust priorities, and recommend the next task.
CURATOR_EOF
        run_claude "$curator_file"
    fi

    # Run coding agent
    BEFORE_COMMIT=$(get_last_commit)
    run_coding_agent $iteration
    AFTER_COMMIT=$(get_last_commit)

    # Check if progress was made (new commit)
    if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
        echo "✓ Progress made - new commit: $(git log --oneline -1)"
        update_checkpoint "iteration-$iteration"
        CONSECUTIVE_FAILURES=0

        # Update queue scores and unblock tasks
        echo "Updating task queue..."
        node scripts/update-queue.cjs 2>/dev/null || echo "Queue update skipped"
    else
        echo "⚠ No new commit this iteration"
        record_failure
    fi

    # Run review cycle
    if [ $((iteration % REVIEW_EVERY)) -eq 0 ]; then
        run_review_agents $iteration
        run_health_check
    fi

    echo ""
    echo "Sleeping ${SLEEP_BETWEEN}s..."
    sleep $SLEEP_BETWEEN
done

echo ""
echo "========================================"
echo "RALPH Loop Complete"
echo "========================================"
echo "Iterations: $iteration"
echo "Time: $(get_elapsed_hours) hours"
echo "Final commit: $(get_last_commit)"
run_health_check
