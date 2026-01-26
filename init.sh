#!/bin/bash
# init.sh - Environment verification for Compound Engineering Book
#
# Run this script to verify the environment is ready for the RALPH loop.
# The initializer agent creates this, and coding agents can run it to verify state.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================"
echo "Environment Verification"
echo "Project: Compound Engineering Book"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check required files
echo "Checking required files..."

check_file() {
    if [ -f "$1" ]; then
        echo "  ✓ $1"
    else
        echo "  ✗ $1 (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo "  ✓ $1/"
    else
        echo "  ✗ $1/ (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

check_file "CLAUDE.md"
check_file "TASKS.md"
check_file "LEARNINGS.md"
check_dir "prds"
check_dir "chapters"
check_dir "assets/diagrams"
check_dir "scripts"
check_dir "prompts"

echo ""

# Check symlink
echo "Checking knowledge base symlink..."
if [ -L "@kb" ]; then
    TARGET=$(readlink "@kb")
    if [ -d "$TARGET" ]; then
        echo "  ✓ @kb -> $TARGET"
    else
        echo "  ✗ @kb symlink target doesn't exist: $TARGET"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ✗ @kb symlink missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check git
echo "Checking git repository..."
if [ -d ".git" ]; then
    echo "  ✓ Git repository initialized"
    COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    echo "  ✓ $COMMITS commits"
else
    echo "  ✗ Not a git repository"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check PRDs
echo "Checking PRD files..."
PRD_COUNT=$(ls -1 prds/ch*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  Found $PRD_COUNT chapter PRDs"
if [ "$PRD_COUNT" -lt 12 ]; then
    echo "  ⚠ Expected 12 chapter PRDs"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check progress tracking
echo "Checking progress tracking..."
if [ -f "claude-progress.txt" ]; then
    echo "  ✓ claude-progress.txt exists"
    LINES=$(wc -l < claude-progress.txt | tr -d ' ')
    echo "  ✓ $LINES lines"
else
    echo "  ⚠ claude-progress.txt not found (will be created by initializer)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "features.json" ]; then
    echo "  ✓ features.json exists"
else
    echo "  ⚠ features.json not found (will be created by initializer)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check tasks
echo "Checking task queue..."
if [ -f "TASKS.md" ]; then
    INCOMPLETE=$(grep -c "- \[ \]" TASKS.md 2>/dev/null || echo "0")
    COMPLETE=$(grep -c "- \[x\]" TASKS.md 2>/dev/null || echo "0")
    echo "  ✓ $INCOMPLETE incomplete tasks"
    echo "  ✓ $COMPLETE completed tasks"
fi

echo ""

# Check subagents
echo "Checking custom subagents..."
if [ -d ".claude/agents" ]; then
    AGENT_COUNT=$(ls -1 .claude/agents/*.md 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✓ $AGENT_COUNT custom subagents defined"
else
    echo "  ⚠ No custom subagents (.claude/agents/)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Summary
echo "========================================"
echo "Summary"
echo "========================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✓ Environment is ready!"
    echo ""
    echo "To start the RALPH loop:"
    echo "  ./scripts/ralph.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠ Environment ready with $WARNINGS warnings"
    echo ""
    echo "You can start the RALPH loop, but check warnings above."
    exit 0
else
    echo "✗ $ERRORS errors, $WARNINGS warnings"
    echo ""
    echo "Fix errors before running the RALPH loop."
    exit 1
fi
