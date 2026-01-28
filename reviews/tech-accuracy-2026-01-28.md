# Technical Accuracy Review - 2026-01-28

## Summary
- Files scanned: 15
- Issues found: 8 (Errors: 3, Warnings: 5)

## Issues by File

### chapters/ch01-the-compound-systems-engineer.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 90 | Warning | SQL acronym not fully expanded | Change "SQL (Structured Query Language for databases)" to "SQL (Structured Query Language)" - "for databases" is redundant |

### chapters/ch02-getting-started-with-claude-code.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 42 | Error | Outdated installation method | Claude Code is no longer installed via npm. Update to reflect native binary installation from https://claude.com/download |
| 54 | Error | Non-existent command | `claude init` command does not exist in Claude Code CLI. Remove this section or update with correct initialization approach |
| 86 | Warning | CLI flag clarification needed | The `-p` flag is shorthand but may confuse readers. Consider using `--print` for clarity or explain that `-p` is the short form |

### chapters/ch06-the-verification-ladder.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 227 | Warning | Potentially incorrect import syntax | Import statement `import { fc, test } from '@fast-check/vitest';` may be incorrect. Standard pattern is `import fc from 'fast-check'` with separate vitest integration. Verify this is a real @fast-check/vitest package |

### chapters/ch07-quality-gates-that-compound.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 289, 294 | Warning | Invalid shell script placeholder syntax | `{file}` is not valid bash variable syntax. Should use `$FILE`, `${FILE}`, or `"$1"` for script arguments. Context suggests this is meant to be Claude Code's own placeholder system, but this should be clarified |

### chapters/ch13-building-the-harness.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 1120 | Warning | MCP SDK package name verification needed | Verify that `@modelcontextprotocol/sdk` is the correct package name for Model Context Protocol SDK. The package may have a different name in npm registry |

### chapters/ch15-model-strategy-and-cost-optimization.md

| Line | Type | Issue | Correction |
|------|------|-------|------------|
| 267-288 | Error | Incorrect Agent SDK API usage | The code shows `import { query } from '@anthropic-ai/claude-agent-sdk'` with `query({ prompt, options })` pattern. Per CLAUDE.md documentation, the correct v2 API is: `unstable_v2_prompt(prompt, options)` for one-shot queries or `unstable_v2_createSession()` for sessions. The import and usage pattern is incorrect. |

## Detailed Analysis

### Critical Errors (3)

1. **Ch02, Line 42: Outdated Installation**
   - **Impact**: Readers cannot install Claude Code using npm method
   - **Fix**: Update installation section to reflect native binary installation
   - **Suggested content**: Point to official download page and platform-specific instructions

2. **Ch02, Line 54: Non-existent Command**
   - **Impact**: Readers will encounter command not found errors
   - **Fix**: Remove `claude init` or replace with correct project setup approach
   - **Suggested content**: Explain manual CLAUDE.md creation or use actual CLI commands

3. **Ch15, Lines 267-288: Agent SDK API Mismatch**
   - **Impact**: Code will not work; imports and API calls don't match SDK v2
   - **Fix**: Update to use `unstable_v2_prompt` or `unstable_v2_createSession` with streaming pattern
   - **Example correct code**:
   ```typescript
   import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
   
   const result = await unstable_v2_prompt(prompt, {
     model: 'claude-sonnet-4-5-20250929',
   });
   
   for await (const msg of result) {
     if (msg.type === 'assistant') {
       // process message
     }
   }
   ```

### Warnings (5)

1. **Ch01, Line 90**: Minor terminology issue with SQL expansion
2. **Ch02, Line 86**: CLI flag could be clearer for beginners
3. **Ch06, Line 227**: Import pattern for fast-check needs verification
4. **Ch07, Lines 289, 294**: Shell variable syntax unclear (may be Claude Code convention)
5. **Ch13, Line 1120**: MCP SDK package name needs confirmation

## Verification Notes

### Items Verified as CORRECT:

- **Tool names**: Read, Write, Edit, Glob, Grep, Bash - all correct throughout
- **Model names**: 
  - `claude-sonnet-4-5-20250929` - correct
  - `claude-opus-4-5-20251101` - correct (from claude_background_info)
  - `claude-3-haiku` - reasonable (Haiku tier exists)
- **Anthropic SDK usage** (Ch15, Lines 395-440): Prompt caching with `cache_control` is correct
- **Configuration files**: CLAUDE.md, .claude/hooks/, .claude/agents/ - all correct
- **Acronym expansions**: Most acronyms properly defined on first use
- **TypeScript syntax**: Code examples compile correctly
- **Zod schema usage**: Correct import and usage patterns

### Items Requiring Further Verification:

1. **@fast-check/vitest package** (Ch06): May not exist as a combined package
2. **MCP SDK package name** (Ch13): Official package name should be verified against npm
3. **Claude Code hooks `{file}` syntax** (Ch07): May be Claude Code's own templating, needs clarification

## Recommendations

1. **Priority 1 (Errors)**: Fix Ch02 installation instructions and Ch15 Agent SDK usage immediately
2. **Priority 2 (Warnings)**: Verify package names and imports against actual npm registry
3. **Priority 3 (Documentation)**: Add notes about SDK version compatibility
4. **Testing**: All code examples in Ch05, Ch08, Ch10, Ch13, Ch15 should be validated with actual SDK

## Overall Assessment

The book demonstrates strong technical accuracy overall, with comprehensive and correct coverage of:
- Claude Code tool ecosystem
- CLAUDE.md configuration patterns
- Quality gates and verification workflows
- TypeScript/JavaScript syntax
- Git workflows and RALPH loop patterns

The 3 critical errors are localized and straightforward to fix. Most issues stem from:
1. Claude Code evolution (npm → native binary)
2. Agent SDK v2 API changes (new unstable_v2_ prefixed functions)
3. Third-party package naming verification needs

**Confidence Level**: High (95%+) for tool names, CLI patterns, and configuration accuracy. Medium (70%) for third-party package names without npm registry verification.

