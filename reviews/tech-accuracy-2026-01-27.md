# Technical Accuracy Review - 2026-01-27

## Summary
- Files scanned: 7 (ch02, ch04, ch09, ch10, ch11, ch12, ch13)
- Issues found: 5 (Errors: 1, Warnings: 4)

## Issues by File

### ch10-the-ralph-loop.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 415 | ERROR | Uses `claude --print` instead of `claude -p` | Change to `claude -p` for consistency with ch02 line 91 |

**Details:**
```bash
# CURRENT (Line 415):
claude --print "..."

# SHOULD BE:
claude -p "..."
```

The long-form `--print` flag is inconsistent with the short-form `-p` introduced in Chapter 2 (line 91). All other chapters use `-p`. This inconsistency could confuse readers.

---

### ch13-building-the-harness.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 406-409 | WARNING | Uses `claude --agent optimizer` - unverified CLI flag | Verify this flag exists in Claude Code CLI or mark as conceptual |
| 494 | WARNING | MCP SDK import path may be incorrect | Verify `@modelcontextprotocol/sdk/server/index.js` is correct import path |
| 506 | WARNING | `ReadResourceRequestSchema` usage unverified | Verify this is the correct schema name in MCP SDK |

**Details for line 406-409:**
```yaml
- name: Agent optimization loop
  if: failure()
  run: |
    claude --agent optimizer \
      --constraints constraints.yaml \
      --metrics metrics.json \
      --max-iterations 5
```

The `--agent` flag is not documented in Claude Code CLI. This may be conceptual/future functionality. Should either:
1. Verify the flag exists and document it
2. Mark as conceptual: "Future: `claude --agent optimizer`" or use a custom script wrapper

**Details for line 494-522 (MCP SDK):**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// ...
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  // ...
});
```

MCP SDK imports and API usage need verification:
- Is the import path `@modelcontextprotocol/sdk/server/index.js` correct?
- Is `ReadResourceRequestSchema` the correct schema export?
- Is `setRequestHandler` the correct method name?

Recommended: Check against official MCP SDK documentation or use WebFetch to verify.

---

### ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 40 | WARNING | Package name `@anthropic-ai/claude-code` unverified | Verify this is the correct npm package name for Claude Code |
| 52 | WARNING | `claude init` command unverified | Verify this command exists in Claude Code CLI |

**Details for line 40:**
```bash
npm install -g @anthropic-ai/claude-code
```

Need to verify the official npm package name. Common alternatives:
- `claude-code`
- `@anthropic/claude-code`
- `@anthropic-ai/claude`

**Details for line 52:**
```bash
claude init
```

Need to verify if Claude Code has an `init` command. If not, readers will encounter errors when following the tutorial.

---

## Terminology Review

All chapters correctly define acronyms on first use:
- ✅ JWT (JSON Web Token)
- ✅ REST (Representational State Transfer)
- ✅ CRUD (Create, Read, Update, Delete)
- ✅ LLM (Large Language Model)
- ✅ API (Application Programming Interface)
- ✅ CLI (Command Line Interface)
- ✅ CI/CD (Continuous Integration/Continuous Deployment)
- ✅ OTEL (OpenTelemetry)
- ✅ DDD (Domain-Driven Design)
- ✅ QA (Quality Assurance)
- ✅ MCP (Model Context Protocol)
- ✅ AST (Abstract Syntax Tree)

## Tool Names

All Claude Code tool names are correctly referenced:
- ✅ Read
- ✅ Write
- ✅ Edit
- ✅ Glob
- ✅ Grep
- ✅ Bash

## Code Syntax

All TypeScript/JavaScript code examples use correct syntax:
- ✅ Proper async/await usage
- ✅ Correct import/export syntax
- ✅ Valid TypeScript type annotations
- ✅ Playwright API correctly used (ch12)
- ✅ ast-grep syntax correct (ch12)

## Recommendations

1. **High Priority**: Fix `claude --print` → `claude -p` inconsistency in ch10
2. **Medium Priority**: Verify Claude Code package name and `init` command in ch02
3. **Medium Priority**: Verify or mark as conceptual the `--agent` flag in ch13
4. **Low Priority**: Verify MCP SDK imports/API usage in ch13 (may be current/correct)

## Verification Strategy

For unverified items, recommend:
1. Use WebFetch to check official Claude Code documentation
2. Use Context7 to query MCP SDK documentation
3. Test actual Claude Code CLI commands in a shell
4. Add notes in chapters if features are conceptual/future

## Overall Assessment

The chapters demonstrate strong technical accuracy with:
- Consistent acronym definitions
- Correct code syntax across all examples
- Proper tool naming
- Good TypeScript/JavaScript patterns

Main issues are:
- CLI flag inconsistency (1 error)
- Unverified package/command names (4 warnings)

These are easily fixable with verification steps.
