---
name: run-exercise
description: Run TypeScript exercises or validate markdown code blocks with hash-based caching. Only re-runs if content has changed. Use for testing book exercises, validating code examples, or running the full validation suite.
argument-hint: <filepath.ts|chapters/*.md|--all>
allowed-tools: Bash(bun:*), Read, Write
disable-model-invocation: true
---

# Exercise Validator

Run TypeScript exercises or validate markdown code blocks with intelligent hash-based caching. Scripts and code blocks are only executed if their content has changed since the last run.

## How it works

1. Computes SHA256 hash of the script/code block content
2. Checks `.exercise-cache.json` for previous run with same hash
3. If hash matches, skips execution and shows cached result
4. If hash differs or not cached, runs with `bun` and caches the result

## Usage

The unified validator supports three modes:

### Run a single script

```bash
bun infra/scripts/exercise-validator.ts run $ARGUMENTS
```

Options:
- `--force` - Force re-run ignoring cache

### Validate markdown code blocks

```bash
bun infra/scripts/exercise-validator.ts validate $ARGUMENTS
```

Options:
- `--all` - Validate all chapters/*.md
- `--check` - Check cache status only (no execution)
- `-v, --verbose` - Show detailed output

### Cache management

```bash
bun infra/scripts/exercise-validator.ts cache --status <script.ts>
bun infra/scripts/exercise-validator.ts cache --clear
bun infra/scripts/exercise-validator.ts cache --stats
```

## Cache location

Results are cached in `.exercise-cache.json` in the project root. This file tracks:
- Script path or code block location
- Content hash
- Last run timestamp
- Exit code
- Stdout/stderr (truncated to 10KB each)

## Skip markers

Add any of these to skip validation of a code block:
- `# skip-validation`
- `// skip-validation`
- `<!-- skip-validation -->`

## Examples

```bash
# Run a single exercise
bun infra/scripts/exercise-validator.ts run examples/ch04/agent.ts

# Force re-run
bun infra/scripts/exercise-validator.ts run --force examples/ch04/agent.ts

# Validate a chapter
bun infra/scripts/exercise-validator.ts validate chapters/ch04.md -v

# Validate all chapters
bun infra/scripts/exercise-validator.ts validate --all -v

# Check what would run (no execution)
bun infra/scripts/exercise-validator.ts validate --check chapters/ch04.md

# View cache stats
bun infra/scripts/exercise-validator.ts cache --stats

# Clear cache
bun infra/scripts/exercise-validator.ts cache --clear
```

## Why caching matters

Running exercises through the book can be expensive (API calls, compute time). This skill ensures:
- Students don't accidentally re-run expensive operations
- Idempotent exercise validation during book development
- Fast feedback when content hasn't changed
- End-to-end testing of all code examples in the book
