#!/bin/bash
# ralph.sh - The RALPH Loop for book writing
#
# Usage: ./scripts/ralph.sh
#
# This script runs Claude Code in a loop, with fresh context each iteration.
# Memory persists through:
#   - TASKS.md (task queue)
#   - LEARNINGS.md (accumulated insights)
#   - Git history (completed work)
#   - CLAUDE.md (project instructions)
#
# Based on Geoffrey Huntley's RALPH technique:
# https://ghuntley.com/ralph

set -e

# Configuration
MAX_ITERATIONS=${MAX_ITERATIONS:-100}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-5}
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

echo "========================================"
echo "RALPH Loop - Compound Engineering Book"
echo "========================================"
echo "Project: $PROJECT_DIR"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

iteration=0
while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    echo ""
    echo "========================================"
    echo "Iteration $iteration / $MAX_ITERATIONS"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"

    # Check if there are incomplete tasks
    if [ -f "TASKS.md" ]; then
        INCOMPLETE=$(grep -c "- \[ \]" TASKS.md 2>/dev/null || echo "0")
        echo "Incomplete tasks: $INCOMPLETE"

        if [ "$INCOMPLETE" -eq 0 ]; then
            echo ""
            echo "All tasks complete!"
            echo "Total iterations: $iteration"
            exit 0
        fi
    else
        echo "No TASKS.md found. Creating initial task list..."
    fi

    # Run Claude Code with fresh context
    # The --print flag outputs the response without interactive mode
    # Adjust the prompt based on your needs
    claude --print "
You are working on the Compound Engineering book project.

STEP 1: Read CLAUDE.md for project context and conventions.
STEP 2: Read TASKS.md and identify the FIRST incomplete task (marked with [ ]).
STEP 3: Read any relevant source articles from the knowledge base.
STEP 4: Complete ONLY that one task.
STEP 5: Run any applicable quality checks.
STEP 6: Mark the task complete in TASKS.md (change [ ] to [x]).
STEP 7: Add any learnings to LEARNINGS.md.
STEP 8: Commit your changes with a descriptive message.

Important:
- Complete exactly ONE task per iteration
- Write practical, example-rich content
- No em dashes in prose
- If you encounter blockers, document them in TASKS.md and move to next task
"

    # Brief pause between iterations
    echo ""
    echo "Iteration $iteration complete. Sleeping for ${SLEEP_BETWEEN}s..."
    sleep $SLEEP_BETWEEN
done

echo ""
echo "========================================"
echo "Max iterations ($MAX_ITERATIONS) reached"
echo "========================================"
