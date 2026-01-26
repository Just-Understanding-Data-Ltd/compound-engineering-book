#!/bin/bash
# ralph.sh - Enhanced RALPH Loop for book writing
#
# Based on:
# - Geoffrey Huntley's RALPH technique: https://ghuntley.com/ralph
# - Anthropic's long-running agent harness: https://anthropic.com/engineering/effective-harnesses-for-long-running-agents
#
# Key innovations:
# 1. Two-phase approach: Initializer agent (first run) + Coding agent (subsequent)
# 2. Master prompt (CLAUDE.md) injected into EVERY agent invocation
# 3. PRD index traversal on each iteration
# 4. Sub-agent review critique every N iterations
# 5. Configurable maximum runtime
# 6. Progress tracking with claude-progress.txt compaction
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

# MAX_ITERATIONS: 0 = infinite (default), any positive number = limit
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

# ==============================================================================
# Master Prompt Injection
# ==============================================================================
# Every agent invocation gets CLAUDE.md injected as context.
# This ensures consistent behavior across compaction boundaries.

get_master_prompt() {
    if [ -f "CLAUDE.md" ]; then
        cat "CLAUDE.md"
    else
        echo "# No CLAUDE.md found - using minimal instructions"
        echo "Complete tasks from TASKS.md one at a time."
    fi
}

get_prd_index() {
    # Generate a summary of all PRDs and their status from features.json
    if [ -f "features.json" ]; then
        echo "## PRD Index (from features.json)"
        echo ""
        echo "| Chapter | Title | PRD Status | Chapter Status | Word Count |"
        echo "|---------|-------|------------|----------------|------------|"

        # Use jq if available, otherwise basic parsing
        if command -v jq &> /dev/null; then
            jq -r '.chapters | to_entries[] | "| \(.key) | \(.value.title) | \(if .value.milestones.prd_complete then "✅" else "⬜" end) | \(.value.status) | \(.value.wordCount)/\(.value.targetWordCount[0])-\(.value.targetWordCount[1]) |"' features.json 2>/dev/null || echo "| Error parsing features.json |"
        else
            echo "| (install jq for detailed PRD index) |"
        fi
        echo ""
    else
        echo "## No features.json found"
        echo "PRD tracking not initialized. Run initializer agent first."
    fi
}

get_task_summary() {
    if [ -f "TASKS.md" ]; then
        echo "## Current Task Queue"
        echo ""
        # Get first 10 incomplete tasks
        grep "- \[ \]" TASKS.md | head -10
        echo ""
        TOTAL=$(grep -c "- \[ \]" TASKS.md 2>/dev/null || echo "0")
        echo "($TOTAL total incomplete tasks)"
    fi
}

# ==============================================================================
# Initializer Agent (First Run Only)
# ==============================================================================

run_initializer_agent() {
    echo ""
    echo "========================================"
    echo "INITIALIZER AGENT"
    echo "Setting up environment for long-running work"
    echo "========================================"

    local MASTER_PROMPT=$(get_master_prompt)

    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# INITIALIZER AGENT INSTRUCTIONS

You are the INITIALIZER AGENT for a long-running book writing project.
Your job is to set up the environment so that future CODING AGENTS can work effectively.

## Context Recovery After Compaction

This prompt is injected fresh on every iteration. If you've been running for a while
and context was compacted, you have everything you need above to continue.

## Your Tasks

1. **Verify CLAUDE.md is read** - The master context above contains all project instructions.

2. **Create/update claude-progress.txt** with this structure:
   \`\`\`
   # Compound Engineering Book - Progress Log

   ## Current Status (Updated: $(date '+%Y-%m-%d %H:%M'))
   - Phase: PRD Completion
   - Active Chapter: None yet
   - Last Completed: Initial setup
   - Blockers: None

   ## Recent Activity (Last 10 Entries)
   ### $(date '+%Y-%m-%d %H:%M') - Environment Initialization
   - What: Set up project structure and tracking
   - Files: claude-progress.txt, features.json
   - Outcome: Success
   - Next: Begin chapter writing with ch01

   ## Compacted History
   (No history yet - this is the first entry)
   \`\`\`

3. **Verify features.json exists** - It should already exist with PRD status.
   If not, create it following the structure in CLAUDE.md.

4. **Verify TASKS.md has proper structure** with [ ] markers.

5. **Create init.sh** if missing (environment verification script).

6. **Read prds/index.md** to understand the book structure.

7. **Git commit** your setup work.

8. **Update claude-progress.txt** with what you did.

Remember: You are setting up for future agents. Be thorough.
"
}

# ==============================================================================
# Coding Agent (Each Iteration)
# ==============================================================================

run_coding_agent() {
    local iteration=$1

    local MASTER_PROMPT=$(get_master_prompt)
    local PRD_INDEX=$(get_prd_index)
    local TASK_SUMMARY=$(get_task_summary)

    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# PRD STATUS
$PRD_INDEX

---

# TASK QUEUE
$TASK_SUMMARY

---

# CODING AGENT INSTRUCTIONS - Iteration $iteration

You are a CODING AGENT working on a long-running book writing project.
This is iteration $iteration. Previous agents have done work before you.

## Context Recovery After Compaction

If context was compacted, everything you need is above:
- CLAUDE.md contains all project instructions and conventions
- PRD STATUS shows which chapters need work
- TASK QUEUE shows what to do next

## Getting Up to Speed Protocol

1. Run \`pwd\` to confirm directory
2. Read \`claude-progress.txt\` for recent activity
3. Read \`features.json\` to see detailed milestone status
4. Run \`git log --oneline -5\` for recent commits

## PRD Completion Criteria

A PRD is considered COMPLETE when:
- Status in features.json is 'complete'
- The .md file exists in prds/
- All required sections are filled out (check prds/index.md for structure)

## Chapter Completion Criteria

A chapter is COMPLETE when all milestones in features.json are true:
- \`first_draft\`: Content written to chapters/chXX-title.md
- \`reviewed\`: Passed review (no AI slop, technical accuracy)
- \`diagrams_complete\`: All required diagrams created
- \`exercises_added\`: 2-3 'Try It Yourself' exercises included
- \`final\`: Ready for Leanpub publishing

## Your Workflow

1. **Choose FIRST incomplete task** from TASKS.md
2. **If task is chapter writing**:
   - Read the corresponding PRD (e.g., prds/ch01.md for Chapter 1)
   - Read source articles from @kb/ as listed in PRD
   - Write to chapters/chXX-title.md
   - Update features.json milestones
3. **Complete the single task**
4. **Verify work** (word count, formatting, no em dashes)
5. **Update tracking**:
   - Mark task [x] in TASKS.md
   - Update features.json if milestone reached
   - Add entry to claude-progress.txt (compact if >10 entries)
6. **Git commit** with descriptive message

## Important Rules

- **ONE task per session**
- **Always read the PRD** before writing a chapter
- **Update features.json** when milestones change
- **Compact progress.txt** when adding 11th entry (move oldest to Compacted History)
- **Document blockers** in TASKS.md and move to next task

Now begin by getting up to speed, then complete one task.
"
}

# ==============================================================================
# Review Sub-Agents (Every N Iterations)
# ==============================================================================

run_review_agents() {
    local iteration=$1

    local MASTER_PROMPT=$(get_master_prompt)
    local PRD_INDEX=$(get_prd_index)

    echo ""
    echo "========================================"
    echo "REVIEW CYCLE - Iteration $iteration"
    echo "Running 5 specialized review sub-agents"
    echo "========================================"

    # Agent 1: Anti-AI Slop Checker
    echo ""
    echo "--- Review Agent 1: Anti-AI Slop Checker ---"
    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# SLOP CHECKER AGENT

You are the ANTI-AI-SLOP reviewer. Your job is to find AI-generated text patterns.

## What to Scan
- All files in chapters/
- All files in prds/ (check for AI slop in PRD content too)

## Detection Patterns (from CLAUDE.md AI Slop Blacklist)
1. Em dashes (—) - CRITICAL, must fix
2. 'delve', 'crucial', 'pivotal', 'robust'
3. 'cutting-edge', 'game-changer', 'leverage' (as verb)
4. 'Additionally', 'Furthermore', 'Moreover'
5. 'It's important to note', 'It could be argued'
6. Passive voice clusters (3+ in a row)

## Output
Create: reviews/slop-check-$(date +%Y%m%d-%H%M).md

Format:
| File | Line | Pattern | Text | Suggested Fix |

Commit your review file.
"

    # Agent 2: Diagram Opportunity Checker
    echo ""
    echo "--- Review Agent 2: Diagram Opportunity Checker ---"
    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# PRD STATUS
$PRD_INDEX

---

# DIAGRAM REVIEWER AGENT

You are the DIAGRAM REVIEWER. Identify where diagrams would improve comprehension.

## What to Review
- All chapter content in chapters/
- Check features.json for diagramsRequired vs diagramsComplete

## Diagram Triggers
1. Process flows (3+ sequential steps)
2. Architecture layers
3. Decision trees
4. Hierarchies

## Output
Create: reviews/diagram-opportunities-$(date +%Y%m%d-%H%M).md

Include:
- Chapter and section
- Concept needing visualization
- Diagram type
- Draft Mermaid code
- Priority (must-have/should-have/nice-to-have)

Update TASKS.md with must-have diagrams.
Commit your review file.
"

    # Agent 3: Technical Accuracy Reviewer
    echo ""
    echo "--- Review Agent 3: Technical Accuracy Reviewer ---"
    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# TECHNICAL ACCURACY AGENT

You are the TECHNICAL ACCURACY reviewer.

## What to Validate
- Code examples in chapters/ - syntax correctness
- Claude Code tool names (Read, Write, Edit, Glob, Grep, Bash, Task)
- API references
- Terminology consistency

## Output
Create: reviews/tech-accuracy-$(date +%Y%m%d-%H%M).md

Format:
| File | Line | Issue | Severity | Fix |

Commit your review file.
"

    # Agent 4: Cross-Reference Validator
    echo ""
    echo "--- Review Agent 4: Cross-Reference Validator ---"
    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# PRD STATUS
$PRD_INDEX

---

# CROSS-REFERENCE VALIDATOR AGENT

You are the CROSS-REFERENCE validator.

## What to Check
1. Chapter references ('See Chapter X')
2. PRD to chapter alignment (does chapter cover PRD requirements?)
3. Orphan content (not referenced anywhere)
4. Broken internal links

## PRD Alignment Check
For each chapter with first_draft=true in features.json:
- Read the PRD
- Read the chapter
- Verify all PRD sections are covered

## Output
Create: reviews/cross-refs-$(date +%Y%m%d-%H%M).md

Include:
- Broken references
- PRD coverage gaps
- Orphan sections

Update TASKS.md with critical fixes.
Commit your review file.
"

    # Agent 5: Progress & Quality Summary
    echo ""
    echo "--- Review Agent 5: Progress & Quality Summary ---"
    claude --dangerously-skip-permissions -p "
# MASTER CONTEXT (CLAUDE.md)
$MASTER_PROMPT

---

# PRD STATUS
$PRD_INDEX

---

# PROGRESS SUMMARIZER AGENT

You are the PROGRESS & QUALITY summarizer.

## Data Sources
1. reviews/ - All review files from this cycle
2. features.json - Milestone status for all chapters
3. TASKS.md - Task queue
4. claude-progress.txt - Recent activity
5. git log - Commit history

## Metrics to Calculate
- Completion %: draftsComplete / totalChapters
- Quality score: issues found / content written
- Velocity: tasks per iteration (from progress.txt)
- Estimated iterations to completion

## Output
Create: reviews/summary-$(date +%Y%m%d-%H%M).md

Include:
- Overall completion percentage
- Chapter-by-chapter status table
- Top 5 priority actions (aggregated from other reviews)
- Velocity estimate
- Blockers

## Actions
1. Update claude-progress.txt with summary
2. Compact progress.txt if >10 recent entries
3. Update features.json stats if changed
4. Commit all updates
"

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
    echo "Max iterations: ∞ (infinite)"
else
    echo "Max iterations: $MAX_ITERATIONS"
fi
echo "Max runtime: $MAX_HOURS hours"
echo "Review every: $REVIEW_EVERY iterations"
echo "Started: $(date)"
echo ""

# Create reviews directory if it doesn't exist
mkdir -p "$PROJECT_DIR/reviews"

# Check if this is the first run (no claude-progress.txt)
if [ ! -f "claude-progress.txt" ]; then
    echo "First run detected. Running initializer agent..."
    run_initializer_agent
    echo ""
    echo "Initializer complete. Starting main loop..."
fi

iteration=0
while true; do
    iteration=$((iteration + 1))

    # Check iteration limit (0 = infinite)
    if [ "$MAX_ITERATIONS" -gt 0 ] && [ $iteration -gt $MAX_ITERATIONS ]; then
        echo ""
        echo "========================================"
        echo "MAX ITERATIONS REACHED: $MAX_ITERATIONS"
        echo "Total time: $(get_elapsed_hours) hours"
        echo "========================================"
        break
    fi

    # Check time limit
    if ! check_time_limit; then
        break
    fi

    echo ""
    echo "========================================"
    echo "Iteration $iteration"
    if [ "$MAX_ITERATIONS" -gt 0 ]; then
        echo "Progress: $iteration / $MAX_ITERATIONS iterations"
    fi
    echo "Elapsed: $(get_elapsed_hours) hours / $MAX_HOURS hours"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"

    # Check for incomplete tasks
    INCOMPLETE=$(count_incomplete_tasks)
    echo "Incomplete tasks: $INCOMPLETE"

    if [ "$INCOMPLETE" -eq 0 ]; then
        echo ""
        echo "========================================"
        echo "ALL TASKS COMPLETE!"
        echo "Total iterations: $iteration"
        echo "Total time: $(get_elapsed_hours) hours"
        echo "========================================"
        exit 0
    fi

    # Run coding agent (with master prompt injection)
    run_coding_agent $iteration

    # Run review cycle every N iterations
    if [ $((iteration % REVIEW_EVERY)) -eq 0 ]; then
        run_review_agents $iteration
    fi

    # Brief pause between iterations
    echo ""
    echo "Iteration $iteration complete. Sleeping for ${SLEEP_BETWEEN}s..."
    sleep $SLEEP_BETWEEN
done

echo ""
echo "========================================"
echo "RALPH Loop Complete"
echo "Total iterations: $iteration"
echo "Total time: $(get_elapsed_hours) hours"
echo "========================================"
