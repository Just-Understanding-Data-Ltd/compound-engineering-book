# Technical Accuracy Review - 2026-01-27

## Summary
- Files scanned: 15
- Issues found: 18 (Errors: 7, Warnings: 11)

## Issues by File

### ch11-sub-agent-architecture.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 327 | WARNING | Jest mock syntax may be outdated | Verify `jest.MockedClass` is current TypeScript jest syntax |
| 335 | WARNING | Mock method chaining | Verify `mockStripe.prototype.paymentIntents.create.mockResolvedValue` works with current jest version |
| 484 | WARNING | Inconsistent import style | Uses `Promise.all()` without import, but other examples show explicit imports |

### ch12-development-workflows.md

| Line | Type | ERROR | Issue | Correction |
|------|------|-------|------------|
| 329-331 | ERROR | Incorrect code block nesting | Bash code block inside markdown should be properly escaped - the closing backticks at line 331 will break parsing |

**Issue detail:**
```markdown
# .claude/commands/deploy-staging.md
Run the staging deployment script:

```bash  ← This opens a nested code block
./scripts/deploy-staging.sh
```  ← This closes it

Report the outcome.
```  ← This tries to close the outer markdown block
```

Should use escaped backticks or remove nesting.

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 403-411 | WARNING | Playwright test syntax | Verify current Playwright API - `page.fill('[data-testid="email"]')` syntax is correct but older versions used different selectors |
| 471-473 | WARNING | AST-grep pattern syntax | Pattern `fetchUserData($$$)` - verify current ast-grep supports `$$$` for variadic matching (some versions use `...`) |
| 502-504 | WARNING | AST-grep rewrite syntax | Command `ast-grep --pattern 'fetchUserData($$$)' --rewrite 'getUserData($$$)' --update-all` - verify flags match current ast-grep CLI |

### ch13-building-the-harness.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 212-214 | WARNING | Mock test syntax | `runSilent("failing test", "exit 1")` - function signature not defined elsewhere, may confuse readers |
| 347 | ERROR | Python code in TypeScript book | Lines 347-372 show Python code (`class EventProcessor:`) in a book focused on TypeScript - should convert to TypeScript or add context about why Python is used |
| 406-410 | ERROR | Incorrect claude CLI syntax | `claude --agent optimizer --constraints constraints.yaml --metrics metrics.json --max-iterations 5` - the `--agent` flag doesn't exist in Claude Code CLI. Should be a custom script or MCP server |
| 494 | WARNING | MCP SDK import path | `import { Server } from '@modelcontextprotocol/sdk/server/index.js'` - verify this is the correct import path for current MCP SDK version |
| 506 | WARNING | MCP handler syntax | `server.setRequestHandler(ReadResourceRequestSchema, ...)` - `ReadResourceRequestSchema` is not imported or defined |

### ch14-the-meta-engineer-playbook.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 542 | WARNING | YOLO mode flag placement | `nohup claude --dangerously-skip-permissions -p "$(cat task.txt)" &` - mixing long and short flags; verify `-p` is correct for print mode |

### ch15-model-strategy-and-cost-optimization.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 18 | ERROR | Incorrect pricing format | `$3 per million tokens (MTok)` - while MTok is defined, mixing $/MTok notation inconsistently. Line 48 uses `$0.25/MTok` format which is clearer |
| 131-164 | ERROR | TypeScript example has `// skip-validation` but contains syntax issues | Function `selectModel` returns `ModelTier` but doesn't handle all code paths - missing final return for edge cases |
| 269 | ERROR | API syntax error | `const response = await anthropic.messages.create({ model: 'claude-sonnet-4-5-20250929', max_tokens: 4096, messages: [{ role: 'user', content: code.slice(0, 10000) }] })` - missing Anthropic client initialization, `anthropic` is not defined |
| 386-417 | ERROR | Incorrect cache_control syntax | `cache_control: { type: 'ephemeral' }` - this syntax is outdated. Current Anthropic API uses different cache control structure |
| 440 | ERROR | Incorrect CLI flags | `claude --dangerously-skip-permissions --allowedTools "*"` - `--allowedTools` flag doesn't exist in Claude Code CLI |

## Model Name Verification

All chapters use correct model naming:
- `claude-sonnet-4-5-20250929` ✓
- `claude-opus-4-5-20251101` ✓ (mentioned in system context)
- `claude-haiku-...` pattern is consistent ✓

## Tool Names Verification

All tool references are correct:
- Read, Write, Edit, Glob, Grep, Bash, Task ✓
- WebFetch, WebSearch mentioned but not extensively used ✓
- NotebookEdit not mentioned (acceptable for this book's scope) ✓

## Configuration Accuracy

| File | Status | Notes |
|------|--------|-------|
| CLAUDE.md structure | ✓ | Consistent across all chapters |
| .claude/agents/ | ✓ | Correct directory structure |
| .claude/commands/ | ✓ | Correct for custom skills |
| .claude/hooks/ | ✓ | Pre-commit and post-edit hooks are valid |
| .claude/settings.json | ⚠️ | Not mentioned but may be needed for some configurations |

## Critical Issues Requiring Fixes

### 1. Anthropic SDK Cache Control (ch15:386-417)
**Current code:**
```typescript
cache_control: { type: 'ephemeral' }
```

**Should be:**
```typescript
// Current Anthropic SDK doesn't use cache_control in this way
// Caching is handled automatically by the API
// Remove cache_control or update to current API documentation
```

### 2. Claude CLI flags (ch15:440, ch13:406-410)
**Current:**
```bash
claude --dangerously-skip-permissions --allowedTools "*"
claude --agent optimizer --constraints file.yaml
```

**Should be:**
```bash
claude --dangerously-skip-permissions
# Note: --allowedTools and --agent flags don't exist
# Use custom scripts or wrapper functions instead
```

### 3. Python code in TypeScript book (ch13:347-372)
Should either convert to TypeScript or add explicit explanation for why Python is used in this specific example.

### 4. Nested code blocks (ch12:329-331)
Breaks markdown parsing. Use alternative formatting.

### 5. Missing Anthropic client initialization (ch15:269)
Add proper import and client setup:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

## Recommendations

1. **Update cache control examples** to match current Anthropic API documentation
2. **Verify all CLI flags** against latest Claude Code documentation
3. **Add imports** to all code examples that reference external libraries
4. **Convert Python examples** to TypeScript for consistency
5. **Fix markdown nesting** in ch12 command examples
6. **Add skip-validation markers** to all pseudo-code examples that aren't meant to compile
7. **Verify MCP SDK imports** against current package versions
8. **Test all bash scripts** for syntax correctness
9. **Add TypeScript interfaces** for any mock functions used in examples
10. **Clarify model tier pricing** with consistent notation (prefer $/MTok throughout)

## Next Steps

1. Fix critical errors (cache_control, CLI flags, missing imports)
2. Address warnings (verify external library versions)
3. Test all code examples with Exercise Validator
4. Cross-reference with latest Anthropic and Claude Code documentation
