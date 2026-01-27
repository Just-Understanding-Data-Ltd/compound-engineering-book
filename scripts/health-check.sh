#!/bin/bash
# Health Check Script for RALPH Loop
# Monitors agent progress and detects issues

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== RALPH Health Check ==="
echo "Time: $(date)"
echo ""

# Check 1: Is RALPH running?
echo "1. Process Status"
RALPH_PID=$(pgrep -f "ralph.sh" 2>/dev/null | head -1 || echo "")
if [ -n "$RALPH_PID" ]; then
    echo -e "   ${GREEN}✓ RALPH is running (PID: $RALPH_PID)${NC}"

    # Get runtime
    RALPH_START=$(ps -o lstart= -p $RALPH_PID 2>/dev/null | head -1 || echo "unknown")
    echo "   Started: $RALPH_START"
else
    echo -e "   ${YELLOW}⚠ RALPH is not running${NC}"
fi

CLAUDE_PIDS=$(pgrep -f "claude.*--dangerously-skip-permissions" 2>/dev/null | head -3 || echo "")
if [ -n "$CLAUDE_PIDS" ]; then
    CLAUDE_COUNT=$(echo "$CLAUDE_PIDS" | wc -l | tr -d ' ')
    echo -e "   ${GREEN}✓ Claude agents active: $CLAUDE_COUNT${NC}"
else
    echo -e "   ${YELLOW}⚠ No Claude agents running${NC}"
fi

# Check 2: Recent commits
echo ""
echo "2. Git Activity"
COMMITS_LAST_HOUR=$(git log --since="1 hour ago" --oneline 2>/dev/null | wc -l | tr -d ' ')
COMMITS_LAST_15MIN=$(git log --since="15 minutes ago" --oneline 2>/dev/null | wc -l | tr -d ' ')

if [ "$COMMITS_LAST_HOUR" -gt 0 ]; then
    echo -e "   ${GREEN}✓ $COMMITS_LAST_HOUR commits in last hour${NC}"
    echo "   Last 3 commits:"
    git log --oneline -3 | sed 's/^/      /'
else
    echo -e "   ${YELLOW}⚠ No commits in last hour${NC}"
fi

if [ "$COMMITS_LAST_15MIN" -eq 0 ] && [ -n "$RALPH_PID" ]; then
    echo -e "   ${YELLOW}⚠ No commits in last 15 minutes (may be working on task)${NC}"
fi

# Check 3: Task progress
echo ""
echo "3. Task Status"
if [ -f "tasks.json" ] && command -v jq &> /dev/null; then
    PENDING=$(jq '.stats.pending // 0' tasks.json)
    IN_PROGRESS=$(jq '.stats.inProgress // 0' tasks.json)
    COMPLETE=$(jq '.stats.complete // 0' tasks.json)
    BLOCKED=$(jq '.stats.blocked // 0' tasks.json)
    TOTAL=$(jq '.stats.total // 0' tasks.json)

    if [ "$TOTAL" -gt 0 ]; then
        PCT=$(echo "scale=1; $COMPLETE * 100 / $TOTAL" | bc)
        echo "   Progress: $COMPLETE/$TOTAL ($PCT%)"
    fi

    echo "   Pending: $PENDING | In Progress: $IN_PROGRESS | Complete: $COMPLETE | Blocked: $BLOCKED"

    if [ "$BLOCKED" -gt 0 ]; then
        echo -e "   ${YELLOW}⚠ $BLOCKED blocked tasks${NC}"
    fi

    # Check checkpoints
    FAILED_ATTEMPTS=$(jq '.checkpoints.failedAttempts // 0' tasks.json)
    if [ "$FAILED_ATTEMPTS" -gt 0 ]; then
        echo -e "   ${YELLOW}⚠ Failed attempts: $FAILED_ATTEMPTS${NC}"
    fi

    if [ "$FAILED_ATTEMPTS" -ge 3 ]; then
        echo -e "   ${RED}❌ Circuit breaker may trigger soon${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠ tasks.json not found or jq not available${NC}"
fi

# Check 4: Log analysis
echo ""
echo "4. Log Analysis"
LATEST_LOG=$(ls -t logs/ralph-*.log 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
    echo "   Latest log: $LATEST_LOG"
    LOG_SIZE=$(wc -l < "$LATEST_LOG" | tr -d ' ')
    echo "   Log size: $LOG_SIZE lines"

    # Check for errors
    ERROR_COUNT=$(grep -c -i "error\|fail\|exception" "$LATEST_LOG" 2>/dev/null || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "   ${YELLOW}⚠ Found $ERROR_COUNT potential errors in log${NC}"
    fi

    # Last activity
    echo "   Last 3 lines:"
    tail -3 "$LATEST_LOG" | sed 's/^/      /'
else
    echo "   No log files found"
fi

# Check 5: Disk space
echo ""
echo "5. System Resources"
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
echo "   Disk usage: $DISK_USAGE"

# Check 6: Progress file
echo ""
echo "6. Progress Tracking"
if [ -f "claude-progress.txt" ]; then
    PROGRESS_LINES=$(wc -l < claude-progress.txt | tr -d ' ')
    echo "   claude-progress.txt: $PROGRESS_LINES lines"

    if [ "$PROGRESS_LINES" -gt 2000 ]; then
        echo -e "   ${YELLOW}⚠ Progress file large ($PROGRESS_LINES lines) - consider compaction${NC}"
    fi

    # Last entry
    echo "   Last entry:"
    grep "^###" claude-progress.txt | tail -1 | sed 's/^/      /'
else
    echo "   claude-progress.txt not found"
fi

# Summary
echo ""
echo "=== Summary ==="
ISSUES=0

if [ -z "$RALPH_PID" ]; then
    echo -e "${YELLOW}⚠ RALPH not running${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ "$COMMITS_LAST_HOUR" -eq 0 ] && [ -n "$RALPH_PID" ]; then
    echo -e "${YELLOW}⚠ No recent commits despite RALPH running${NC}"
    ISSUES=$((ISSUES + 1))
fi

BLOCKED_COUNT="${BLOCKED:-0}"
if [ "$BLOCKED_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "${YELLOW}⚠ Blocked tasks exist${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✓ All systems healthy${NC}"
fi

exit 0
