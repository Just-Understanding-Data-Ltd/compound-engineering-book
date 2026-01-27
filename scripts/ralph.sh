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
CURATOR_EVERY=${CURATOR_EVERY:-3}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-5}
ITERATION_TIMEOUT=${ITERATION_TIMEOUT:-300}
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SESSION_ID=$(date +%Y%m%d-%H%M%S)-$$
LOCK_FILE="$PROJECT_DIR/.ralph.lock"
STATE_FILE="$PROJECT_DIR/.ralph-state"
LOG_FILE="$PROJECT_DIR/logs/ralph-$SESSION_ID.log"

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
        --curator-every)
            CURATOR_EVERY="$2"
            shift 2
            ;;
        --sleep)
            SLEEP_BETWEEN="$2"
            shift 2
            ;;
        --resume)
            RESUME=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Calculate max runtime in seconds
MAX_SECONDS=$(echo "$MAX_HOURS * 3600" | bc | cut -d'.' -f1)
START_TIME=$(date +%s)

cd "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/logs" "$PROJECT_DIR/reviews"

# ==============================================================================
# Lock File (Prevent Multiple Instances)
# ==============================================================================

if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "ERROR: RALPH already running (PID $PID)"
        echo "Kill it with: kill $PID"
        exit 1
    else
        echo "Removing stale lock file"
        rm -f "$LOCK_FILE"
    fi
fi
echo $$ > "$LOCK_FILE"

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

preflight() {
    local errors=0

    [ ! -f "CLAUDE.md" ] && echo "ERROR: Missing CLAUDE.md" && errors=$((errors + 1))
    [ ! -f "tasks.json" ] && echo "ERROR: Missing tasks.json" && errors=$((errors + 1))
    command -v jq &>/dev/null || { echo "ERROR: jq required"; errors=$((errors + 1)); }
    command -v claude &>/dev/null || { echo "ERROR: claude CLI required"; errors=$((errors + 1)); }

    if [ -n "$(git status --porcelain)" ]; then
        echo "WARNING: Uncommitted changes detected"
    fi

    if [ $errors -gt 0 ]; then
        echo "Pre-flight failed with $errors errors"
        exit 1
    fi

    echo "Pre-flight: OK"
}

preflight

# ==============================================================================
# Graceful Shutdown
# ==============================================================================

cleanup() {
    echo ""
    echo "Shutting down gracefully..."
    update_checkpoint "interrupted-$iteration"
    save_metrics
    rm -f "$LOCK_FILE"
    rm -rf "$PROMPT_DIR"

    # macOS notification
    if command -v osascript &>/dev/null; then
        osascript -e "display notification \"Stopped after $iteration iterations\" with title \"RALPH\"" 2>/dev/null || true
    fi

    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Create temp directory for prompts
PROMPT_DIR=$(mktemp -d)

# ==============================================================================
# Helper Functions
# ==============================================================================

get_elapsed_seconds() {
    echo $(( $(date +%s) - START_TIME ))
}

get_elapsed_hours() {
    echo "scale=2; $(get_elapsed_seconds) / 3600" | bc
}

check_time_limit() {
    if [ $(get_elapsed_seconds) -ge $MAX_SECONDS ]; then
        echo ""
        echo "========================================"
        echo "TIME LIMIT REACHED: $(get_elapsed_hours) hours"
        echo "========================================"
        return 1
    fi
    return 0
}

count_incomplete_tasks() {
    jq '.stats.pending // 0' tasks.json 2>/dev/null || echo "0"
}

get_last_commit() {
    git rev-parse HEAD 2>/dev/null || echo ""
}

# ==============================================================================
# Metrics & State
# ==============================================================================

INITIAL_COMMIT=$(get_last_commit)

save_state() {
    echo "$iteration" > "$STATE_FILE"
}

load_state() {
    if [ "$RESUME" = true ] && [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo 0
    fi
}

save_metrics() {
    local commits=$(git rev-list "$INITIAL_COMMIT"..HEAD --count 2>/dev/null || echo 0)
    local pending=$(count_incomplete_tasks)

    jq -n \
      --arg session "$SESSION_ID" \
      --argjson iteration "$iteration" \
      --argjson elapsed "$(get_elapsed_seconds)" \
      --argjson commits "$commits" \
      --argjson pending "$pending" \
      --argjson failures "$TOTAL_FAILURES" \
      '{timestamp: now | todate, session: $session, iterations: $iteration, elapsed_seconds: $elapsed, commits: $commits, pending_tasks: $pending, total_failures: $failures}' \
      >> logs/metrics.jsonl 2>/dev/null || true
}

# ==============================================================================
# Circuit Breaker & Checkpoints
# ==============================================================================

CONSECUTIVE_FAILURES=0
TOTAL_FAILURES=0
MAX_CONSECUTIVE_FAILURES=3
BACKOFF=5

update_checkpoint() {
    local task_id="$1"
    local commit_hash=$(get_last_commit)

    jq --arg commit "$commit_hash" \
       --arg task "$task_id" \
       --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.checkpoints.lastGoodCommit = $commit |
        .checkpoints.lastSuccessfulTask = $task |
        .checkpoints.lastCheckpoint = $time |
        .checkpoints.consecutiveFailures = 0' \
       tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json 2>/dev/null || true
}

record_failure() {
    CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
    TOTAL_FAILURES=$((TOTAL_FAILURES + 1))

    jq --argjson failures "$CONSECUTIVE_FAILURES" \
       '.checkpoints.consecutiveFailures = $failures |
        .checkpoints.failedAttempts = (.checkpoints.failedAttempts + 1)' \
       tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json 2>/dev/null || true

    echo "WARNING: Task failed (attempt $CONSECUTIVE_FAILURES of $MAX_CONSECUTIVE_FAILURES)"

    # Exponential backoff
    BACKOFF=$((BACKOFF * 2))
    [ $BACKOFF -gt 300 ] && BACKOFF=300
    echo "Backing off ${BACKOFF}s..."
    sleep $BACKOFF
}

on_success() {
    CONSECUTIVE_FAILURES=0
    BACKOFF=5
}

check_circuit_breaker() {
    if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
        echo ""
        echo "========================================"
        echo "CIRCUIT BREAKER TRIGGERED"
        echo "Too many consecutive failures: $CONSECUTIVE_FAILURES"
        echo "Last good commit: $(jq -r '.checkpoints.lastGoodCommit // "unknown"' tasks.json 2>/dev/null)"
        echo "========================================"

        jq '.checkpoints.circuitBreakerTripped = true' tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json 2>/dev/null || true
        return 1
    fi
    return 0
}

reset_circuit_breaker() {
    CONSECUTIVE_FAILURES=0
    BACKOFF=5
    jq '.checkpoints.consecutiveFailures = 0 | .checkpoints.circuitBreakerTripped = false' \
       tasks.json > tasks.json.tmp && mv tasks.json.tmp tasks.json 2>/dev/null || true
}

# ==============================================================================
# Run Claude with timeout (macOS compatible)
# ==============================================================================

# Detect timeout command (gtimeout on macOS with coreutils, timeout on Linux)
if command -v gtimeout &>/dev/null; then
    TIMEOUT_CMD="gtimeout"
elif command -v timeout &>/dev/null; then
    TIMEOUT_CMD="timeout"
else
    TIMEOUT_CMD=""
    echo "WARNING: No timeout command found. Install coreutils: brew install coreutils"
fi

run_claude() {
    local prompt_file="$1"
    if [ -n "$TIMEOUT_CMD" ]; then
        $TIMEOUT_CMD $ITERATION_TIMEOUT claude --dangerously-skip-permissions -p - < "$prompt_file"
    else
        # Run without timeout on systems that don't have it
        claude --dangerously-skip-permissions -p - < "$prompt_file"
    fi
    return $?
}

# ==============================================================================
# Work-in-Progress Detection
# ==============================================================================

check_wip() {
    local wip=$(jq '[.tasks[] | select(.status == "in_progress")] | length' tasks.json 2>/dev/null || echo 0)
    if [ "$wip" -gt 0 ]; then
        echo "Found $wip task(s) in_progress - will resume those"
    fi
}

# ==============================================================================
# Agents
# ==============================================================================

run_initializer_agent() {
    echo ""
    echo "=== INITIALIZER ==="

    local prompt_file="$PROMPT_DIR/init.md"
    cat > "$prompt_file" << 'EOF'
First run setup. Read CLAUDE.md, create claude-progress.txt if missing, verify tasks.json exists. Commit setup.
EOF
    run_claude "$prompt_file"
}

run_coding_agent() {
    local iteration=$1
    local prompt_file="$PROMPT_DIR/code.md"

    # Warmup on first iteration
    if [ $iteration -eq 1 ]; then
        cat > "$prompt_file" << 'EOF'
Warmup iteration. Read CLAUDE.md thoroughly, understand the project, review tasks.json, then complete ONE high-scored pending task. Commit when done.
EOF
    else
        cat > "$prompt_file" << EOF
Iteration $iteration. Complete ONE task from tasks.json (highest score, pending, not blocked). Commit when done.
EOF
    fi

    run_claude "$prompt_file"
}

run_curator() {
    local iteration=$1
    echo ""
    echo "--- Task Curator ---"

    local prompt_file="$PROMPT_DIR/curator.md"
    cat > "$prompt_file" << 'EOF'
Curate the task queue: read tasks.json and claude-progress.txt. Clean duplicates, adjust priorities based on context (finish nearly-done chapters first), update scores. Commit changes.
EOF
    run_claude "$prompt_file"
}

# Compact progress file if too large (>2000 lines -> 1000 lines)
compact_progress() {
    local file="claude-progress.txt"
    [ ! -f "$file" ] && return

    local lines=$(wc -l < "$file" | tr -d ' ')
    if [ "$lines" -gt 2000 ]; then
        echo ""
        echo "--- Compacting Progress File ($lines lines) ---"

        local prompt_file="$PROMPT_DIR/compact.md"
        cat > "$prompt_file" << 'EOF'
claude-progress.txt exceeds 2000 lines. Compact it to ~1000 lines:
1. Keep "Current Status" section (top ~20 lines)
2. Keep "Recent Activity" with last 10 detailed entries
3. Summarize older entries into "Compacted History" grouped by week
4. Preserve key decisions and blockers
Commit the compacted file.
EOF
        run_claude "$prompt_file"
    fi
}

run_review_agents() {
    local iteration=$1
    local today=$(date +%Y-%m-%d)

    echo ""
    echo "=== REVIEW CYCLE ==="

    local prompt_file="$PROMPT_DIR/review.md"
    cat > "$prompt_file" << EOF
Run all 7 review agents IN PARALLEL using Task tool (single message, 7 calls):
slop-checker, diagram-reviewer, tech-accuracy, term-intro-checker, oreilly-style, cross-ref-validator, progress-summarizer

Write summary to reviews/review-${today}.md and commit.
EOF
    run_claude "$prompt_file"
}

run_health_check() {
    [ -f "scripts/health-check.sh" ] && bash scripts/health-check.sh
}

# ==============================================================================
# Main Loop
# ==============================================================================

echo "========================================"
echo "RALPH Loop - Session $SESSION_ID"
echo "========================================"
echo "Project: $PROJECT_DIR"
echo "Max iterations: ${MAX_ITERATIONS:-infinite}"
echo "Max runtime: $MAX_HOURS hours"
echo "Review every: $REVIEW_EVERY | Curator every: $CURATOR_EVERY"
echo "Iteration timeout: ${ITERATION_TIMEOUT}s"
echo "Started: $(date)"
echo ""

# First run check
if [ ! -f "claude-progress.txt" ]; then
    echo "First run detected..."
    run_initializer_agent
fi

# Resume or fresh start
iteration=$(load_state)
reset_circuit_breaker
check_wip

SAFE_COMMIT=$(get_last_commit)

while true; do
    iteration=$((iteration + 1))
    save_state

    # Check limits
    check_circuit_breaker || { echo "Circuit breaker triggered"; break; }
    [ "$MAX_ITERATIONS" -gt 0 ] && [ $iteration -gt $MAX_ITERATIONS ] && { echo "Max iterations reached"; break; }
    check_time_limit || break

    echo ""
    echo "========================================"
    echo "Iteration $iteration | $(get_elapsed_hours)h elapsed | Failures: $CONSECUTIVE_FAILURES"
    echo "========================================"

    INCOMPLETE=$(count_incomplete_tasks)
    echo "Pending tasks: $INCOMPLETE"

    [ "$INCOMPLETE" -eq 0 ] && { echo "ALL TASKS COMPLETE!"; break; }

    # Curator every N iterations
    if [ $((iteration % CURATOR_EVERY)) -eq 0 ]; then
        run_curator $iteration
        compact_progress
    fi

    # Coding agent with progress detection
    BEFORE_COMMIT=$(get_last_commit)
    BEFORE_TASKS=$(md5sum tasks.json 2>/dev/null || echo "")

    if run_coding_agent $iteration; then
        AFTER_COMMIT=$(get_last_commit)
        AFTER_TASKS=$(md5sum tasks.json 2>/dev/null || echo "")

        if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
            echo "✓ New commit: $(git log --oneline -1)"
            update_checkpoint "iteration-$iteration"
            on_success
            node scripts/update-queue.cjs 2>/dev/null || true
            SAFE_COMMIT=$AFTER_COMMIT
        elif [ "$BEFORE_TASKS" != "$AFTER_TASKS" ]; then
            echo "✓ Tasks updated (no commit)"
            on_success
        else
            echo "⚠ No progress detected"
            record_failure
        fi
    else
        echo "⚠ Claude timed out or failed"
        record_failure
        # Rollback if tasks.json is broken
        if ! jq empty tasks.json 2>/dev/null; then
            echo "Rolling back broken tasks.json..."
            git checkout "$SAFE_COMMIT" -- tasks.json 2>/dev/null || true
        fi
    fi

    # Review cycle
    if [ $((iteration % REVIEW_EVERY)) -eq 0 ]; then
        run_review_agents $iteration
        run_health_check
    fi

    echo "Sleeping ${SLEEP_BETWEEN}s..."
    sleep $SLEEP_BETWEEN
done

echo ""
echo "========================================"
echo "RALPH Complete"
echo "========================================"
echo "Session: $SESSION_ID"
echo "Iterations: $iteration"
echo "Time: $(get_elapsed_hours) hours"
echo "Commits: $(git rev-list "$INITIAL_COMMIT"..HEAD --count 2>/dev/null || echo 0)"
save_metrics
run_health_check

# Notification
if command -v osascript &>/dev/null; then
    osascript -e "display notification \"Complete: $iteration iterations, $(git rev-list "$INITIAL_COMMIT"..HEAD --count) commits\" with title \"RALPH\"" 2>/dev/null || true
fi
