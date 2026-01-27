# Technical Accuracy Review - 2026-01-27 (Updated)

## Summary
- Files scanned: 13
- Issues found: 23 (Errors: 13, Warnings: 10)

## Issues by File

### ch01-the-compound-systems-engineer.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 359 | Error | Cross-reference says "Chapter 7: Context Engineering Deep Dive" but ch07 is "Quality Gates That Compound" | Update to "Chapter 9: Context Engineering Deep Dive" |
| 360 | Error | Cross-reference to "ch08-the-ralph-loop.md" but ch08 is "Error Handling and Debugging" | Update to "Chapter 10: The RALPH Loop" |
| 361 | Error | Cross-reference to "ch10-building-the-harness.md" but ch10 is "The RALPH Loop" | Update to "Chapter 13: Building the Harness" |

### ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 40-42 | Warning | Installation command `npm install -g @anthropic-ai/claude-code` needs verification | Verify correct package name with official docs |
| 52-54 | Error | `claude init` command does not exist in Claude Code CLI | Remove or replace with manual CLAUDE.md creation instructions |
| 84 | Error | States Claude Code has `claude ask` and `claude chat` subcommands | Actual CLI uses `claude` for interactive and `claude -p "prompt"` for single-turn |
| 91 | Error | `claude ask "..."` syntax is incorrect | Use `claude -p "..."` for non-interactive queries |
| 103-105 | Error | `claude chat` subcommand doesn't exist | Use `claude` to start interactive session |
| 150-151 | Error | Lists "Observability" as one of "seven core tools" | Observability is not a tool. Core tools are: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit, TodoWrite |
| 213-216 | Warning | "Observability" section describes it as a tool | Reframe as "feedback from Bash tool output" rather than a distinct tool |
| 360-409 | Error | Multiple uses of `claude ask` subcommand (lines 360, 366, 376, 388, 406, 407, 409) | Replace all with `claude -p "..."` or interactive `claude` examples |

### ch03-prompting-fundamentals.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 496 | Warning | Cross-reference to "Chapter 9: Context Engineering Deep Dive" | Verify chapter numbering matches actual structure (appears correct) |

### ch04-writing-your-first-claude-md.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 322-339 | Warning | Symlink targets `.cursorrules` and `.aider/AGENTS.md` may be incorrect paths | Verify correct config file names for Cursor and Aider with their respective documentation |

### ch05-the-12-factor-agent.md

No technical accuracy issues found. Code examples demonstrate conceptual patterns correctly.

### ch06-the-verification-ladder.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 455-473 | Warning | GitHub Actions workflow missing `actions/setup-node` step before `npm` commands | Add `- uses: actions/setup-node@v4` with `node-version` before npm commands |

### ch07-quality-gates-that-compound.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 236-295 | Error | Claude Code hooks use `.claude/hooks/` directory with JSON files - this structure is incorrect | Claude Code hooks are configured in `.claude/settings.json` under the `hooks` key, not as separate JSON files |
| 246-250 | Error | Hook JSON schema with `command`, `description`, `continueOnError` is incorrect | Hooks use a different schema with `matcher` and `command` properties |
| 263 | Warning | `{file}` placeholder in hook command needs verification | Verify placeholder syntax matches actual hook variable substitution |
| 299 | Warning | States "Ctrl+O" views complete error output | Verify this is the correct keyboard shortcut in current Claude Code version |

### ch08-error-handling-and-debugging.md

No technical accuracy issues found. Error patterns and diagnostic framework are accurate.

### ch09-context-engineering-deep-dive.md

No technical accuracy issues found. Information theory concepts are accurately explained.

### ch10-the-ralph-loop.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 415 | Error | `claude --print "..."` flag does not exist | Use `claude -p "..."` for non-interactive prompt execution |

### ch11-sub-agent-architecture.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 724 | Warning | References "Chapter 15: Model Strategy" which does not exist in current book structure | Remove reference or update to existing chapter |

### ch12-development-workflows.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 9 | Warning | "Shift+Tab" for Plan Mode activation | Verify this keybinding matches current Claude Code documentation |
| 529-535 | Warning | `.claude/commands/` skill structure | Verify the exact directory and file format matches current Claude Code slash command documentation |

### ch13-building-the-harness.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 50-67 | Error | `.claude/hooks/pre-commit.sh` shell script format is incorrect | Claude Code hooks are not shell scripts in a hooks directory; they are configured in settings.json |
| 69-76 | Error | `.claude/hooks/post-edit.sh` shell script format is incorrect | Same issue - hooks use JSON configuration in settings.json, not shell scripts |

---

## Code Syntax Verification

All TypeScript/JavaScript code examples appear syntactically correct. The following patterns were verified:

- Zod schema definitions (ch02, ch03, ch05, ch06, ch11)
- Express/tRPC route patterns (ch05, ch11)
- Jest/Vitest test patterns (ch06, ch11)
- Property-based testing with `@fast-check/vitest` (ch06)
- Stripe integration patterns (ch11)
- MCP Server implementation with `@modelcontextprotocol/sdk` (ch13)
- Docker and docker-compose configurations (ch01, ch13)
- GitHub Actions workflows (ch06, ch13)

## Terminology Consistency

| Term | Usage | Status |
|------|-------|--------|
| CLAUDE.md | Consistent throughout | Correct |
| Claude Code | Consistent throughout | Correct |
| Result<T, E> | Used for error handling pattern | Consistent |
| RALPH Loop | Properly attributed to Geoffrey Huntley | Correct |
| MCP (Model Context Protocol) | Explained and used correctly | Correct |
| OTEL (OpenTelemetry) | Used correctly for observability | Correct |
| DDD (Domain-Driven Design) | Introduced and explained | Correct |

---

## Recommendations

### High Priority Fixes

1. **Chapter 2 CLI Syntax (Critical)**: The entire chapter uses incorrect CLI subcommands (`claude ask`, `claude chat`, `claude init`). This needs systematic replacement:
   - `claude init` → Remove or replace with manual instructions
   - `claude ask "..."` → `claude -p "..."`
   - `claude chat` → `claude` (interactive mode)

2. **Chapters 7 & 13 Hooks Configuration (Critical)**: The hooks documentation is fundamentally incorrect. Claude Code hooks are configured in settings.json, not as separate shell scripts or JSON files in a `.claude/hooks/` directory. Rewrite to show:
   ```json
   // .claude/settings.json
   {
     "hooks": {
       "preToolUse": [
         { "matcher": "Edit|Write", "command": "npm run lint -- $FILE" }
       ],
       "postToolUse": [
         { "matcher": "Edit|Write", "command": "npm run typecheck" }
       ]
     }
   }
   ```

3. **Chapter 2 Tool List**: Remove "Observability" from the tool list and replace with accurate tools. The core tools are: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit, TodoWrite, AskUserQuestion.

4. **Cross-References in Chapter 1**: Update all three cross-reference errors to point to correct chapter numbers and titles.

### Medium Priority Fixes

5. **Chapter 10 CLI Flag**: Change `claude --print` to `claude -p`.

6. **Verify Keybindings**: Confirm Shift+Tab (Plan Mode) and Ctrl+O (error output) match current Claude Code version.

7. **Chapter 11 Reference**: Remove or update reference to non-existent "Chapter 15: Model Strategy".

### Low Priority Improvements

8. **GitHub Actions Workflows**: Add explicit `actions/setup-node` steps for completeness.

9. **External Tool Configs**: Verify correct file names for Cursor and Aider configurations.

---

## Verification Checklist

- [ ] Verify Claude Code npm package name from official docs
- [ ] Confirm `claude -p` is correct for single-turn prompts
- [ ] Verify hook configuration schema in settings.json
- [ ] Verify Ctrl+O and Shift+Tab keyboard shortcuts
- [ ] Update cross-reference chapter titles throughout
- [ ] Test all code examples compile with `tsc --noEmit`

---

*Review generated by tech-accuracy agent on 2026-01-27 (updated to cover all 13 chapters)*
