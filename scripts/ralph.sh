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
REVIEW_EVERY=${REVIEW_EVERY:-20}
CURATOR_EVERY=${CURATOR_EVERY:-5}
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
    command -v bc &>/dev/null || { echo "ERROR: bc required (brew install bc)"; errors=$((errors + 1)); }

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

# Use Claude 2.1.17 to avoid print mode bug in 2.1.19/2.1.20
# See: https://github.com/anthropics/claude-code/issues/18131
CLAUDE_BIN="${CLAUDE_BIN:-/Users/jamesaphoenix/.npm-global/bin/claude}"
if [ ! -x "$CLAUDE_BIN" ]; then
    CLAUDE_BIN="claude"  # Fallback to PATH
fi

run_claude() {
    local prompt_file="$1"
    local output_file="$PROMPT_DIR/last_output.txt"
    local exit_code=0

    if [ -n "$TIMEOUT_CMD" ]; then
        $TIMEOUT_CMD $ITERATION_TIMEOUT $CLAUDE_BIN --dangerously-skip-permissions -p - < "$prompt_file" 2>&1 | tee "$output_file"
        exit_code=${PIPESTATUS[0]}
    else
        $CLAUDE_BIN --dangerously-skip-permissions -p - < "$prompt_file" 2>&1 | tee "$output_file"
        exit_code=${PIPESTATUS[0]}
    fi

    # Detect API concurrency errors and add extra cooldown
    if grep -q "concurrency\|rate.limit\|429\|too many" "$output_file" 2>/dev/null; then
        echo ""
        echo "⚠ API CONCURRENCY ERROR detected - adding 60s cooldown"
        echo "  (Parallel sub-agent calls may have exceeded rate limits)"
        sleep 60
    fi

    return $exit_code
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
IMPORTANT: Execute tools ONE AT A TIME to avoid API concurrency errors. Never call multiple tools in parallel.

Warmup iteration:
1. First, read CLAUDE.md
2. Then read tasks.json
3. Pick ONE high-scored pending task
4. Complete it
5. Commit when done
EOF
    else
        cat > "$prompt_file" << EOF
IMPORTANT: Execute tools ONE AT A TIME to avoid API concurrency errors. Never call multiple tools in parallel.

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
IMPORTANT: Execute tools ONE AT A TIME to avoid API concurrency errors.

Curate the task queue:
1. Read tasks.json
2. Read claude-progress.txt
3. Clean duplicates, adjust priorities
4. Update scores
5. Commit changes
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

# ==============================================================================
# Adaptive Review System (Convergence-Based)
# ==============================================================================
# Instead of fixed intervals, we adapt based on new issues found.
# Like TCP congestion control: backoff when improving, pressure when regressing.
#
# Algorithm uses 1.3/0.7 ratios (net 0.91 per oscillation cycle) to prevent
# interval from collapsing to MIN during normal issue fluctuation.

METRICS_DIR="$PROJECT_DIR/.metrics"
mkdir -p "$METRICS_DIR"

ADAPTIVE_INTERVAL=${REVIEW_EVERY}  # Start with configured value
MIN_REVIEW_INTERVAL=5
MAX_REVIEW_INTERVAL=50
LAST_REVIEW_ITERATION=0

# Load persisted state
load_adaptive_state() {
    if [ -f "$METRICS_DIR/current_interval" ]; then
        local saved=$(cat "$METRICS_DIR/current_interval" 2>/dev/null)
        if [[ "$saved" =~ ^[0-9]+$ ]] && [ "$saved" -gt 0 ]; then
            ADAPTIVE_INTERVAL=$saved
        fi
    fi
    if [ -f "$METRICS_DIR/last_review_iteration" ]; then
        local saved=$(cat "$METRICS_DIR/last_review_iteration" 2>/dev/null)
        if [[ "$saved" =~ ^[0-9]+$ ]]; then
            LAST_REVIEW_ITERATION=$saved
        fi
    fi
}

# Save adaptive state (call after review)
save_adaptive_state() {
    echo "$ADAPTIVE_INTERVAL" > "$METRICS_DIR/current_interval"
    echo "$LAST_REVIEW_ITERATION" > "$METRICS_DIR/last_review_iteration"
}

# Validate numeric value with default fallback
validate_numeric() {
    local value="$1"
    local default="$2"
    value=$(echo "$value" | tr -dc '0-9')
    if [ -n "$value" ] && [ "$value" -ge 0 ] 2>/dev/null; then
        echo "$value"
    else
        echo "$default"
    fi
}

# Count issues cheaply (no agent needed)
count_issues() {
    local critical=0 medium=0 low=0

    # Critical: FIXMEs, TODOs with BUG (word boundaries to avoid DEBUG, etc.)
    critical=$(grep -rE '\bFIXME\b|\bBUG\b|TODO.*(bug|critical)' chapters/ examples/ 2>/dev/null | wc -l | tr -d ' ')
    critical=$(validate_numeric "$critical" "0")

    # Medium: em dashes (AI slop indicator) - recursive through all .md files
    medium=$(grep -r "—" chapters/ examples/ --include="*.md" 2>/dev/null | wc -l | tr -d ' ')
    medium=$(validate_numeric "$medium" "0")

    # Low: AI slop phrases (exclude meta-discussion about avoiding these words)
    low=$(grep -riE '\bdelve\b|\bcrucial\b|\bleverage\b|\butilize\b|\baforementioned\b' chapters/ examples/ 2>/dev/null | \
          grep -viE "don.t use|avoid|blacklist|never use" 2>/dev/null | wc -l | tr -d ' ')
    low=$(validate_numeric "$low" "0")

    echo "$((critical * 10 + medium * 3 + low))"
}

# Calculate weighted issue score
get_issue_score() {
    count_issues
}

# Update adaptive interval based on new issues found
update_adaptive_interval() {
    local new_issues=$1
    local prev_file="$METRICS_DIR/prev_new_issues"
    local history_file="$METRICS_DIR/issues_history.txt"

    # Validate input
    new_issues=$(validate_numeric "$new_issues" "0")

    # Trim history file if > 100 lines (prevent unbounded growth)
    if [ -f "$history_file" ]; then
        local lines=$(wc -l < "$history_file" 2>/dev/null | tr -d ' ')
        if [ "${lines:-0}" -gt 100 ]; then
            tail -100 "$history_file" > "$history_file.tmp" && mv "$history_file.tmp" "$history_file"
        fi
    fi

    # Record history
    echo "$(date +%s) $new_issues" >> "$history_file"

    # Get previous issues count with validation
    local prev_issues=999
    if [ -f "$prev_file" ]; then
        prev_issues=$(validate_numeric "$(cat "$prev_file" 2>/dev/null)" "999")
    fi

    # Save current for next time
    echo "$new_issues" > "$prev_file"

    # Adaptive backoff/pressure using 1.3/0.7 ratios (net 0.91 per oscillation)
    if [ "$new_issues" -lt "$prev_issues" ]; then
        # Improving! Backoff (multiply by 1.3)
        ADAPTIVE_INTERVAL=$(echo "$ADAPTIVE_INTERVAL * 13 / 10" | bc 2>/dev/null)
        ADAPTIVE_INTERVAL=$(validate_numeric "$ADAPTIVE_INTERVAL" "$REVIEW_EVERY")
        echo "  ↓ Issues decreasing ($prev_issues → $new_issues). Backing off to $ADAPTIVE_INTERVAL"
    elif [ "$new_issues" -gt "$prev_issues" ]; then
        # Regressing! More pressure (multiply by 0.7)
        ADAPTIVE_INTERVAL=$(echo "$ADAPTIVE_INTERVAL * 7 / 10" | bc 2>/dev/null)
        ADAPTIVE_INTERVAL=$(validate_numeric "$ADAPTIVE_INTERVAL" "$MIN_REVIEW_INTERVAL")
        echo "  ↑ Issues increasing ($prev_issues → $new_issues). Pressure to $ADAPTIVE_INTERVAL"
    else
        # Stable - behavior depends on absolute level
        if [ "$new_issues" -lt 10 ]; then
            ADAPTIVE_INTERVAL=$(echo "$ADAPTIVE_INTERVAL * 11 / 10" | bc 2>/dev/null)
            ADAPTIVE_INTERVAL=$(validate_numeric "$ADAPTIVE_INTERVAL" "$REVIEW_EVERY")
            echo "  → Stable and low ($new_issues). Backing off to $ADAPTIVE_INTERVAL"
        else
            echo "  → Stable but elevated ($new_issues). Maintaining $ADAPTIVE_INTERVAL"
        fi
    fi

    # Clamp to bounds
    [ "$ADAPTIVE_INTERVAL" -lt "$MIN_REVIEW_INTERVAL" ] && ADAPTIVE_INTERVAL=$MIN_REVIEW_INTERVAL
    [ "$ADAPTIVE_INTERVAL" -gt "$MAX_REVIEW_INTERVAL" ] && ADAPTIVE_INTERVAL=$MAX_REVIEW_INTERVAL

    # Check for convergence: ALL of last 3 reviews must have ≤2 issues each
    if [ -f "$history_file" ]; then
        local converged=$(tail -3 "$history_file" 2>/dev/null | awk '$2 <= 2 {c++} END {print (c >= 3 ? 1 : 0)}')
        if [ "${converged:-0}" -eq 1 ]; then
            echo "  ✓ CONVERGED: ≤2 issues in each of last 3 reviews. System is clean."
            ADAPTIVE_INTERVAL=$MAX_REVIEW_INTERVAL
        fi
    fi

    # Save state
    save_adaptive_state
}

# Probe interval - maximum iterations between full reviews regardless of adaptive state
# This catches false positive convergence (blind spots in quick scan)
MAX_PROBE_INTERVAL=25
LAST_PROBE_ITERATION=0

load_probe_state() {
    if [ -f "$METRICS_DIR/last_probe_iteration" ]; then
        local saved=$(cat "$METRICS_DIR/last_probe_iteration" 2>/dev/null)
        if [[ "$saved" =~ ^[0-9]+$ ]]; then
            LAST_PROBE_ITERATION=$saved
        fi
    fi
}

save_probe_state() {
    echo "$LAST_PROBE_ITERATION" > "$METRICS_DIR/last_probe_iteration"
}

# Check if review is needed (adaptive + probe)
should_review() {
    local iteration=$1

    # Load persisted state
    load_adaptive_state
    load_probe_state

    local since_last=$((iteration - LAST_REVIEW_ITERATION))
    local since_probe=$((iteration - LAST_PROBE_ITERATION))

    # PROBE: Force review if too long since last full review (catch blind spots)
    if [ "$since_probe" -ge "$MAX_PROBE_INTERVAL" ]; then
        echo "  🔍 PROBE: $since_probe iterations since last review (max: $MAX_PROBE_INTERVAL)"
        return 0  # Force review
    fi

    # Normal adaptive check
    if [ "$since_last" -ge "$ADAPTIVE_INTERVAL" ]; then
        return 0  # Yes, review
    else
        return 1  # No, skip
    fi
}

run_review_agents() {
    local iteration=$1
    local today=$(date +%Y-%m-%d)

    LAST_REVIEW_ITERATION=$iteration
    LAST_PROBE_ITERATION=$iteration
    save_probe_state

    echo ""
    echo "=== REVIEW CYCLE (Adaptive Interval: $ADAPTIVE_INTERVAL, Probe: $MAX_PROBE_INTERVAL) ==="

    # Count issues BEFORE review
    local issues_before=$(get_issue_score)
    echo "Issues before review: $issues_before"

    local prompt_file="$PROMPT_DIR/review.md"
    cat > "$prompt_file" << EOF
Run review agents SEQUENTIALLY (one at a time) to avoid API concurrency errors:
1. slop-checker
2. tech-accuracy
3. term-intro-checker
4. progress-summarizer

(Skip diagram-reviewer, oreilly-style, cross-ref-validator for speed)

Write summary to reviews/review-${today}.md and commit.

IMPORTANT: At the end, count total issues found (critical, medium, low) and output:
ISSUES_FOUND: <number>
EOF
    run_claude "$prompt_file"

    # Count issues AFTER review (agents may have fixed some)
    local issues_after=$(get_issue_score)
    local delta=$((issues_before - issues_after))

    echo "Issues after review: $issues_after (Δ: $delta)"

    # Update adaptive interval and save state
    update_adaptive_interval "$issues_after"
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
echo "Review: ADAPTIVE (start: $REVIEW_EVERY, range: $MIN_REVIEW_INTERVAL-$MAX_REVIEW_INTERVAL)"
echo "Curator every: $CURATOR_EVERY | Timeout: ${ITERATION_TIMEOUT}s"
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

    # Review cycle (adaptive based on convergence)
    if should_review $iteration; then
        run_review_agents $iteration
        run_health_check
    else
        # Quick issue check without full review
        current_issues=$(get_issue_score)
        iterations_until_review=$((ADAPTIVE_INTERVAL - (iteration - LAST_REVIEW_ITERATION)))
        echo "Quick scan: $current_issues weighted issues (next review in $iterations_until_review iterations)"

        # REGRESSION DETECTION: If issues spike above threshold, force early review
        REGRESSION_THRESHOLD=15
        if [ "$current_issues" -ge "$REGRESSION_THRESHOLD" ] && [ "$ADAPTIVE_INTERVAL" -gt "$MIN_REVIEW_INTERVAL" ]; then
            echo "  ⚠ REGRESSION DETECTED: $current_issues issues (threshold: $REGRESSION_THRESHOLD)"
            echo "  → Forcing early review next iteration"
            ADAPTIVE_INTERVAL=$MIN_REVIEW_INTERVAL
            LAST_REVIEW_ITERATION=$((iteration - MIN_REVIEW_INTERVAL + 1))
            save_adaptive_state
        fi
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
