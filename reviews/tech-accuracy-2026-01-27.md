# Technical Accuracy Review - 2026-01-27

## Summary
- Files scanned: 7
- Issues found: 18 (Errors: 8, Warnings: 10)

## Issues by File

### ch01-the-compound-systems-engineer.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 359 | Error | Cross-reference says "Chapter 7: Context Engineering Deep Dive" but ch07 is "Quality Gates That Compound" | Update to correct chapter title or point to correct chapter |
| 360 | Error | Cross-reference to ch08-the-ralph-loop.md may not exist | Verify chapter exists or remove reference |
| 361 | Error | Cross-reference to ch10-building-the-harness.md may not exist | Verify chapter exists or remove reference |

### ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 40-42 | Warning | Installation command `npm install -g @anthropic-ai/claude-code` needs verification | Verify correct package name with official docs |
| 52-54 | Warning | `claude init` command may not exist in Claude Code CLI | Verify command exists; may need to be `claude` with initialization prompt |
| 84 | Error | States Claude Code has `claude ask` and `claude chat` subcommands | Actual CLI uses `claude` for interactive and `claude -p "prompt"` for single-turn |
| 91 | Error | `claude ask "..."` syntax is incorrect | Use `claude -p "..."` for non-interactive queries |
| 103-105 | Error | `claude chat` subcommand doesn't exist | Use `claude` to start interactive session |
| 150-151 | Error | Lists "Observability" as a Claude Code tool | Observability is not a tool. Core tools are: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit |
| 213-216 | Warning | "Observability" section describes it as a tool | Reframe as "feedback from tool output" rather than a distinct tool |
| 360, 366, 376, 388, 406, 407, 409 | Error | Multiple uses of `claude ask` subcommand | Replace all with `claude -p "..."` or interactive `claude` examples |
| 451 | Error | "Seven core tools" with incorrect tool list | Update to accurate tool list without "Observability" |

### ch03-prompting-fundamentals.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 496 | Warning | Cross-reference to "Chapter 9: Context Engineering Deep Dive" may have naming inconsistency | Verify chapter numbering and titles match actual chapters |

### ch04-writing-your-first-claude-md.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 322-339 | Warning | Symlink targets `.cursorrules` and `.aider/AGENTS.md` may be incorrect paths | Verify correct config file names for Cursor and Aider |

### ch05-the-12-factor-agent.md

No technical accuracy issues found. Code examples demonstrate conceptual patterns correctly.

### ch06-the-verification-ladder.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 455-473 | Warning | GitHub Actions workflow missing `actions/setup-node` step before `npm` commands | Add `- uses: actions/setup-node@v4` with `node-version` before npm commands |

### ch07-quality-gates-that-compound.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 236-295 | Warning | Claude Code hooks directory structure and JSON format needs verification | Verify `.claude/hooks/` is correct path and JSON schema matches actual hook configuration |
| 246-250 | Warning | Hook JSON schema with `command`, `description`, `continueOnError` needs verification | Verify these are the actual hook configuration properties |
| 263 | Warning | `{file}` placeholder in hook command needs verification | Verify placeholder syntax is supported |
| 299 | Warning | States "Ctrl+O" views complete error output | Verify this is the correct keyboard shortcut in Claude Code |

## Recommendations

### High Priority Fixes

1. **Chapter 2 CLI Syntax**: The entire chapter uses incorrect CLI subcommands (`claude ask`, `claude chat`). This needs systematic replacement:
   - `claude ask "..."` → `claude -p "..."`
   - `claude chat` → `claude` (interactive mode)

2. **Chapter 2 Tool List**: Remove "Observability" from the tool list and replace with accurate tools. Consider listing: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit.

3. **Cross-References**: Multiple chapters have cross-references to chapter titles that don't match actual chapter files. Create a consistent chapter index and update all references.

### Medium Priority Fixes

4. **Verify Claude Code Installation**: Confirm the npm package name is correct with official documentation.

5. **Verify Hook Configuration**: Test Claude Code hooks to confirm the directory structure, JSON schema, and placeholder syntax.

6. **External Tool Configs**: Verify correct file names for Cursor (`.cursorrules` vs `.cursorrc`) and Aider configurations.

### Low Priority Improvements

7. **GitHub Actions Workflows**: Add explicit Node.js setup steps for completeness.

## Technical Debt Notes

The CLI syntax issues in Chapter 2 are pervasive (appears ~15 times) and would benefit from a search-and-replace approach. Consider:

```bash
# Find all instances
grep -n "claude ask" chapters/ch02*.md
grep -n "claude chat" chapters/ch02*.md
```

## Verification Checklist

- [ ] Verify Claude Code npm package name
- [ ] Verify `claude init` command exists
- [ ] Verify `claude -p` is correct for single-turn
- [ ] Verify hook configuration format
- [ ] Verify Ctrl+O keyboard shortcut
- [ ] Verify cross-reference chapter titles
- [ ] Test all code examples compile
