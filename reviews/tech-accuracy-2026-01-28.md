# Technical Accuracy Review - 2026-01-28

## Summary
- Files scanned: 15
- Issues found: 18 (Errors: 7, Warnings: 11)

---

## Issues by File

### ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 40 | Warning | Package name `@anthropic-ai/claude-code` may be outdated | Verify current npm package name for Claude Code CLI |
| 55 | Warning | `claude init` command referenced | Verify this subcommand exists in current Claude Code CLI |
| 84-106 | Error | `claude ask` and `claude chat` subcommands do not exist | Claude Code CLI uses `claude` for interactive mode or `claude -p "prompt"` for non-interactive. Replace with accurate CLI syntax. |
| 150 | Error | Lists "Observability" as one of seven core tools | "Observability" is not a Claude Code tool. The actual core tools are: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit. Update tool list accordingly. |
| 452 | Warning | Tool list mentions "Observability" again | Should reference actual tools like Task for sub-agents or WebFetch for web content |

### ch07-quality-gates-that-compound.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 237-295 | Warning | Hooks described as JSON files in `.claude/hooks/post-write.json` | Verify current hook format. Claude Code hooks may use different configuration format. |
| 299 | Warning | Keyboard shortcut "Ctrl+O" for viewing hook output | Verify this shortcut exists in current Claude Code |

### ch10-the-ralph-loop.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 415 | Error | Uses `claude --print "..."` flag | The correct flag is `-p` not `--print`. Should be `claude -p "prompt"` |

### ch11-sub-agent-architecture.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 139-168 | Warning | Tool access control shown as TypeScript config | This is conceptual/illustrative, not a built-in Claude Code feature. Consider adding a note clarifying this is a pattern to implement, not native functionality. |

### ch12-development-workflows.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 9 | Warning | "Activated with Shift+Tab" for Plan Mode | Verify this keyboard shortcut matches current Claude Code |

### ch13-building-the-harness.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 51-66 | Error | Hooks shown as shell scripts `.claude/hooks/pre-commit.sh` | Inconsistent with Chapter 7 which shows JSON format. Standardize hook format across chapters. |
| 494-522 | Warning | MCP server code uses older SDK patterns | Verify against current MCP SDK documentation |

### ch14-the-meta-engineer-playbook.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 86-91 | Warning | Slash command shown in `.claude/commands/deploy-staging.md` | The code block uses escaped backticks `\`\`\`bash` which is incorrect markdown |

### ch15-model-strategy-and-cost-optimization.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 439 | Error | `claude --dangerously-skip-permissions --allowedTools "*"` | The `--allowedTools` flag syntax may be incorrect. Verify against current CLI documentation. |
| 48-82 | Warning | Model pricing listed (Haiku $0.25/MTok, Sonnet $3/MTok, Opus $15/MTok) | Verify these prices are current. Model pricing changes frequently. |
| 541 | Error | `nohup claude --dangerously-skip-permissions -p "$(cat task.txt)" &` | Uses `-p` flag which contradicts Chapter 10's use of `--print`. Should be consistent across chapters. |

---

## Cross-Chapter Consistency Issues

### Claude Code CLI Syntax
Multiple chapters use inconsistent CLI syntax:
- Ch2: `claude ask "..."`, `claude chat`
- Ch10: `claude --print "..."`
- Ch15: `claude -p "..."`

**Recommendation**: Standardize on the actual CLI syntax throughout. The correct forms are:
- Interactive: `claude`
- Non-interactive: `claude -p "prompt"` or piping input

### Hook Configuration Format
Inconsistent hook formats between chapters:
- Ch7 (lines 259-295): JSON files in `.claude/hooks/post-write.json`
- Ch13 (lines 51-66): Shell scripts in `.claude/hooks/pre-commit.sh`

**Recommendation**: Verify actual Claude Code hook format and standardize across chapters.

### Tool List Accuracy
Ch2 lists seven tools including "Observability" which is not a real Claude Code tool.

**Recommendation**: Update to actual tool names: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit, TodoWrite, etc.

---

## Code Syntax Verification

All TypeScript code examples appear syntactically correct. Examples marked with `// skip-validation` in Chapter 15 appropriately indicate they are illustrative.

---

## Terminology Consistency

| Term | Usage | Status |
|------|-------|--------|
| CLAUDE.md | Consistent | ✓ |
| Sub-agent | Consistent | ✓ |
| Quality gates | Consistent | ✓ |
| Context window | Consistent | ✓ |
| RALPH loop | Consistent | ✓ |
| Hooks | Inconsistent format (JSON vs shell) | ⚠ |

---

## Recommendations

1. **High Priority**: Fix CLI syntax in Ch2. The `claude ask` and `claude chat` commands do not exist.

2. **High Priority**: Update tool list in Ch2 to remove "Observability" and include actual tools.

3. **High Priority**: Standardize hook format across Ch7 and Ch13.

4. **Medium Priority**: Verify model pricing in Ch15 is current.

5. **Medium Priority**: Ensure all CLI flags are consistent (`-p` vs `--print`).

6. **Low Priority**: Add notes clarifying which code examples are illustrative patterns vs. copy-paste ready.

---

*Review generated by tech-accuracy agent*
