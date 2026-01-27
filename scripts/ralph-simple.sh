#!/bin/bash
# ralph-simple.sh - Ultra simple RALPH loop
# All intelligence is in CLAUDE.md, this just loops

MAX_HOURS=${1:-4}
MAX_SECONDS=$((MAX_HOURS * 3600))
START_TIME=$(date +%s)

cd "$(dirname "$0")/.." || exit 1
mkdir -p logs

echo "RALPH Simple - Max $MAX_HOURS hours"
echo "Started: $(date)"

iteration=0
last_commit=$(git rev-parse HEAD)

while true; do
    iteration=$((iteration + 1))
    elapsed=$(( $(date +%s) - START_TIME ))

    # Time limit
    [ $elapsed -ge $MAX_SECONDS ] && echo "Time limit reached" && break

    echo ""
    echo "=== Iteration $iteration ($(( elapsed / 60 ))m elapsed) ==="

    # Run Claude with just iteration number - CLAUDE.md has all instructions
    echo "Iteration $iteration" | claude --dangerously-skip-permissions -p -

    # Check progress
    new_commit=$(git rev-parse HEAD)
    if [ "$new_commit" != "$last_commit" ]; then
        echo "✓ Progress: $(git log --oneline -1)"
        last_commit=$new_commit
    else
        echo "⚠ No commit this iteration"
    fi

    sleep 5
done

echo ""
echo "Done. $iteration iterations in $(( elapsed / 60 )) minutes"
