#!/bin/bash
# ralph.sh - Enhanced RALPH Loop for book writing
#
# Based on:
# - Geoffrey Huntley's RALPH technique: https://ghuntley.com/ralph
# - Anthropic's long-running agent harness: https://anthropic.com/engineering/effective-harnesses-for-long-running-agents
#
# Key innovations:
# 1. Two-phase approach: Initializer agent (first run) + Coding agent (subsequent)
# 2. Sub-agent review critique every N iterations
# 3. Configurable maximum runtime
# 4. Progress tracking with claude-progress.txt
# 5. Feature list with pass/fail status
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

# Calculate max runtime in seconds
MAX_SECONDS=$((MAX_HOURS * 3600))
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
# Initializer Agent (First Run Only)
# ==============================================================================

run_initializer_agent() {
    echo ""
    echo "========================================"
    echo "INITIALIZER AGENT"
    echo "Setting up environment for long-running work"
    echo "========================================"

    claude --print "
You are the INITIALIZER AGENT for a long-running book writing project.
Your job is to set up the environment so that future CODING AGENTS can work effectively.

## Your Tasks

1. **Read CLAUDE.md** to understand the project structure and conventions.

2. **Create/update claude-progress.txt** with this structure:
   - Current status summary
   - What has been completed
   - What is in progress
   - Blockers or issues
   - Next recommended actions

3. **Verify TASKS.md exists** and has proper structure:
   - Tasks should be marked with [ ] (incomplete) or [x] (complete)
   - Tasks should be ordered by priority
   - Each task should be specific and completable in one session

4. **Create init.sh** if it doesn't exist:
   - Script to verify environment is ready
   - Check that all required files exist
   - Validate markdown formatting tools are available

5. **Read the PRDs** and create a features.json file tracking:
   - Each chapter's completion status
   - Key milestones (PRD done, first draft, reviewed, diagrams complete)
   - Use this structure:
   \`\`\`json
   {
     \"chapters\": [
       {
         \"id\": \"ch01\",
         \"title\": \"The Compound Systems Engineer\",
         \"milestones\": {
           \"prd_complete\": true,
           \"first_draft\": false,
           \"reviewed\": false,
           \"diagrams_complete\": false
         }
       }
     ]
   }
   \`\`\`

6. **Make an initial git commit** documenting your setup work.

7. **Update claude-progress.txt** with what you did.

Remember: You are setting up the environment for future agents. Be thorough and document everything.
"
}

# ==============================================================================
# Coding Agent (Each Iteration)
# ==============================================================================

run_coding_agent() {
    local iteration=$1

    claude --print "
You are a CODING AGENT working on a long-running book writing project.
This is iteration $iteration. Previous agents have done work before you.

## Getting Up to Speed (Do This First)

1. Run \`pwd\` to confirm you're in the right directory.
2. Read \`claude-progress.txt\` to see what was recently worked on.
3. Read \`TASKS.md\` to see the task queue.
4. Run \`git log --oneline -10\` to see recent commits.
5. If \`features.json\` exists, read it to understand milestone status.

## Your Workflow

1. **Choose ONE incomplete task** from TASKS.md (the first [ ] item).
2. **Read relevant source material** from @kb/ (the knowledge base symlink).
3. **Complete the task** following project conventions:
   - No em dashes (use periods or commas instead)
   - Practical examples for every concept
   - Progressive complexity
4. **Verify your work**:
   - Check word count if writing a chapter
   - Validate markdown formatting
   - Ensure cross-references are correct
5. **Update status**:
   - Mark task complete in TASKS.md (change [ ] to [x])
   - Update features.json if a milestone was reached
   - Add entry to claude-progress.txt
6. **Commit your work** with a descriptive message.

## Important Rules

- Complete exactly ONE task per session
- Leave the environment clean for the next agent
- Document any blockers in TASKS.md under 'Blockers & Notes'
- If you encounter an issue you can't resolve, document it and move to the next task
- Never remove or modify existing completed work without explicit need

## Quality Standards

- Chapters: 2,500-4,000 words
- No AI slop: varied sentence structure, no em dashes
- Every concept needs a concrete example
- Cross-references to other chapters

Now begin by getting up to speed, then complete one task.
"
}

# ==============================================================================
# Review Sub-Agents (Every N Iterations)
# ==============================================================================

run_review_agents() {
    local iteration=$1

    echo ""
    echo "========================================"
    echo "REVIEW CYCLE - Iteration $iteration"
    echo "Running 5 specialized review sub-agents"
    echo "========================================"

    # Run all 5 review agents
    echo ""
    echo "--- Review Agent 1: Anti-AI Slop Checker ---"
    claude --print "
You are the ANTI-AI-SLOP reviewer for a book project.

## Your Task

Scan all content in chapters/ and prds/ for AI-generated text tells:

1. **Em dashes (—)**: Find and report all instances. These must be replaced with periods or commas.
2. **Overused phrases**: Look for 'delve', 'crucial', 'pivotal', 'robust', 'cutting-edge', 'game-changer', 'leverage' (as verb).
3. **Repetitive sentence starters**: 'Additionally', 'Furthermore', 'Moreover', 'It's important to note'.
4. **Passive voice overuse**: Identify passages with excessive passive constructions.
5. **Generic hedging**: 'It could be argued', 'One might say', 'In many ways'.

## Output Format

Create a file: reviews/slop-check-$(date +%Y%m%d-%H%M).md

Structure:
- File path
- Line number
- Issue type
- Specific text
- Suggested fix

If no issues found, still create the file noting the clean scan.
Commit your review file.
"

    echo ""
    echo "--- Review Agent 2: Diagram Opportunity Checker ---"
    claude --print "
You are the DIAGRAM REVIEWER for a book project.

## Your Task

Review all chapters/ content and identify where diagrams would improve comprehension.

Look for:
1. **Process flows** - Steps that happen in sequence (RALPH loop, verification ladder)
2. **Architecture diagrams** - Components and relationships (harness layers, sub-agents)
3. **Hierarchies** - Nested structures (CLAUDE.md files, context patterns)
4. **Comparisons** - Before/after, tradeoffs
5. **Mental models** - Abstract concepts needing visualization

## Output Format

Create a file: reviews/diagram-opportunities-$(date +%Y%m%d-%H%M).md

For each opportunity:
- Chapter and section
- Concept that needs visualization
- Diagram type (flowchart, architecture, hierarchy, comparison)
- Draft Mermaid code if possible
- Priority (must-have, should-have, nice-to-have)

Update TASKS.md with any must-have diagrams not yet in the task list.
Commit your review file.
"

    echo ""
    echo "--- Review Agent 3: Technical Accuracy Reviewer ---"
    claude --print "
You are the TECHNICAL ACCURACY reviewer for a book about AI-assisted development.

## Your Task

Review chapters/ for technical correctness:

1. **Code examples**: Are they syntactically correct? Would they run?
2. **Tool references**: Are Claude Code tool names accurate (Read, Write, Edit, Glob, Grep, Bash)?
3. **API accuracy**: Are any API references current?
4. **Consistent terminology**: Is the same concept called the same thing throughout?
5. **Version accuracy**: Are version numbers mentioned still relevant?

## Output Format

Create a file: reviews/tech-accuracy-$(date +%Y%m%d-%H%M).md

For each issue:
- File and line
- Issue description
- Severity (critical, important, minor)
- Suggested correction

Commit your review file.
"

    echo ""
    echo "--- Review Agent 4: Cross-Reference Validator ---"
    claude --print "
You are the CROSS-REFERENCE validator for a book project.

## Your Task

Validate all internal references across the book:

1. **Chapter references**: Do 'See Chapter X' references point to correct content?
2. **Section references**: Do internal section links work?
3. **PRD to chapter alignment**: Does each chapter cover what its PRD specified?
4. **Orphan content**: Is there any content not referenced from anywhere?
5. **Circular dependencies**: Are there any circular reference issues?

## Output Format

Create a file: reviews/cross-refs-$(date +%Y%m%d-%H%M).md

List:
- Broken references (file:line -> missing target)
- Misaligned references (claims X, actually Y)
- PRD coverage gaps
- Orphan sections

Update TASKS.md with any critical fixes needed.
Commit your review file.
"

    echo ""
    echo "--- Review Agent 5: Progress & Quality Summary ---"
    claude --print "
You are the PROGRESS & QUALITY summarizer for a book project.

## Your Task

Create a comprehensive status report:

1. **Read all review files** from this cycle in reviews/
2. **Check features.json** for milestone completion
3. **Analyze TASKS.md** for progress and blockers
4. **Read claude-progress.txt** for recent activity

## Output Format

Create a file: reviews/summary-$(date +%Y%m%d-%H%M).md

Include:
- Overall completion percentage
- Chapters status (draft/reviewed/complete)
- Top 5 issues to address (from other reviews)
- Velocity estimate (tasks completed per iteration)
- Recommended priority for next 5 iterations
- Any systemic issues observed

Update claude-progress.txt with this summary.
Commit your review and update.
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
    echo "Iteration $iteration / $MAX_ITERATIONS"
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

    # Run coding agent
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
