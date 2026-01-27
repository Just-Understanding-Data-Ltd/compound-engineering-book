---
name: run-exercise
description: Run TypeScript exercise files with hash-based caching. Only re-runs if the script content has changed. Use when testing book exercises, running code examples, or validating TypeScript snippets.
argument-hint: <filepath.ts>
allowed-tools: Bash(bun:*), Read, Write
disable-model-invocation: true
---

# TypeScript Exercise Runner

Run TypeScript exercises with intelligent caching. Scripts are only executed if their content has changed since the last run.

## How it works

1. Computes SHA256 hash of the script content
2. Checks `.exercise-cache.json` for previous run with same hash
3. If hash matches, skips execution and shows cached result
4. If hash differs or not cached, runs with `bun` and caches the result

## Usage

Run the exercise runner script:

```bash
bun ~/.claude/skills/run-exercise/scripts/runner.ts $ARGUMENTS
```

## Cache location

Results are cached in `.exercise-cache.json` in the project root. This file tracks:
- Script path
- Content hash
- Last run timestamp
- Exit code
- Stdout/stderr (truncated to 10KB each)

## Clearing cache

To force a re-run, either:
1. Modify the script (changes the hash)
2. Delete `.exercise-cache.json`
3. Run with `--force` flag: `bun ~/.claude/skills/run-exercise/scripts/runner.ts --force $ARGUMENTS`

## Why caching matters

Running exercises through the book can be expensive (API calls, compute time). This skill ensures:
- Students don't accidentally re-run expensive operations
- Idempotent exercise validation during book development
- Fast feedback when script hasn't changed
