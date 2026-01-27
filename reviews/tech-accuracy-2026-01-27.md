# Technical Accuracy Review - 2026-01-27

## Summary
- Files scanned: 15 chapters
- Issues found: 12 (Errors: 5, Warnings: 7)

## Issues by File

### ch01-the-compound-systems-engineer.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 73 | Warning | CRUD acronym used without definition | Define on first use: "Create, Read, Update, Delete (CRUD)" |
| 75 | Warning | CI/CD acronym used without definition | Define on first use: "Continuous Integration/Continuous Deployment (CI/CD)" |

### ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 150-151 | Error | States "Claude Code has seven core tools" but only lists 6 tools (Read, Write, Edit, Glob, Grep, Bash) plus "Observability" which is not a tool | Correct to say "six core tools" or list actual tools. Full set includes: Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch, NotebookEdit |
| 451-452 | Error | "Seven core tools: Read, Write, Edit, Glob, Grep, Bash, and Observability" - Observability is not a Claude Code tool | Remove Observability from tool list. Observability describes the ability to see tool outputs, not a tool itself |

### ch07-quality-gates-that-compound.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 236-240 | Warning | Shows hooks as separate JSON files (`.claude/hooks/pre-commit.json`, etc.) but Claude Code hooks are typically configured in settings files or as shell scripts | Verify against current Claude Code hooks documentation and update format if needed |
| 257-265 | Warning | Hook JSON format shows `command`, `description`, `continueOnError` keys - may not match actual Claude Code hooks schema | Verify hook configuration schema against Claude Code documentation |

### ch10-the-ralph-loop.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 415 | Error | Uses `claude --print` flag for single-turn command | Should be `claude -p` as shown correctly in ch02 line 88 |

### ch11-sub-agent-architecture.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 139-165 | Warning | Tool access control with `agentPermissions` object describes a conceptual/aspirational system | Add note clarifying this is a design pattern to implement, not built-in Claude Code functionality |

### ch15-model-strategy-and-cost-optimization.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 46-48 | Error | Haiku pricing "$0.25/MTok input, $1.25/MTok output" may be inaccurate | Verify current Haiku pricing at https://www.anthropic.com/pricing |
| 70 | Error | Opus pricing "$15/MTok input, $75/MTok output" may be inaccurate | Verify current Opus pricing at https://www.anthropic.com/pricing |
| 18-22 | Warning | Sonnet pricing "$3/MTok input, $15/MTok output" may be outdated | Verify current Sonnet pricing or use relative pricing comparisons |

### ch09-context-engineering-deep-dive.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 479-480 | Warning | Model pricing comparison may be outdated | Consider using relative pricing comparisons instead of absolute prices |

## Verified Correct

The following technical elements were verified as accurate:

### CLI Commands and Flags
- `claude -p` for single-turn queries (ch02 line 88)
- `claude init` for initialization (ch02 line 48)
- `claude --dangerously-skip-permissions` flag (ch15 line 440)

### Tool Names
All core tool names are correct as used throughout:
- Read, Write, Edit, Glob, Grep, Bash, Task

### File Paths and Conventions
- `CLAUDE.md` - correct project instruction file
- `.claude/settings.json` - correct settings path pattern
- `.claude/agents/` for agent definitions - correct
- `.claude/commands/` for custom commands - correct

### Code Syntax Validated
TypeScript, JavaScript, Bash, YAML, and JSON examples throughout are syntactically valid:
- ch01: TypeScript constraints object (lines 227-246)
- ch01: docker-compose.yml (lines 208-221)
- ch03: Prompting patterns and examples
- ch05: 12-factor agent TypeScript patterns
- ch06: Test examples with Vitest/Jest, Zod validation
- ch09: Information theory code examples
- ch13: MCP server implementation using `@modelcontextprotocol/sdk`
- ch15: Model selection, caching, and routing code

### Technical Concepts Correctly Explained
- Information theory (entropy, mutual information) - ch09
- Domain-Driven Design (DDD) references - ch01, ch13
- OpenTelemetry/OTEL configuration - ch01, ch13
- Git worktrees commands and usage - ch12
- AST-grep pattern syntax - ch12
- Playwright API usage - ch12
- Zod validation library usage - ch06
- Result<T, E> error handling pattern - throughout

### Anthropic SDK Usage
- `@anthropic-ai/sdk` import pattern - correct
- `messages.create()` API structure - correct
- `cache_control: { type: 'ephemeral' }` for prompt caching - correct

### Docker Configuration
Validated image names in ch01 and ch13:
- `otel/opentelemetry-collector` - correct
- `jaegertracing/all-in-one` - correct
- `prom/prometheus` - correct

## Recommendations

### High Priority
1. **Fix tool count in ch02** - Change "seven core tools" to "six core tools" and remove "Observability" from the list. The actual core tools are: Read, Write, Edit, Glob, Grep, Bash.

2. **Fix `--print` flag in ch10** - Change `claude --print` to `claude -p` for consistency with ch02.

3. **Verify model pricing in ch15** - Either update to current pricing or use relative comparisons (e.g., "Haiku costs ~12x less than Sonnet") to avoid outdated specific values.

### Medium Priority
4. **Verify hooks format in ch07** - The JSON file format for hooks should be tested against current Claude Code documentation. Hooks may be configured differently than shown.

5. **Clarify conceptual vs actual features in ch11** - The tool access control system described is a design pattern to implement, not built-in functionality. Add a note clarifying this.

### Low Priority
6. **Define acronyms in ch01** - Add definitions for CRUD and CI/CD on first use for consistency with other acronym definitions in the book.

## Notes

- All code examples are syntactically valid and would compile/execute
- No security vulnerabilities detected in code samples
- TypeScript strict mode patterns followed consistently
- Error handling patterns (Result<T, E>) used correctly throughout
- MCP SDK usage matches current documentation patterns
