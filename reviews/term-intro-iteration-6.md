# Term Introduction Check - 2026-01-27

## Summary

Scan of chapters ch05-ch15 for undefined acronyms and technical jargon.

- **Files scanned:** 11 chapters (ch05 through ch15)
- **Issues found:** 18 term introductions needed
- **Priority:** 3 critical, 8 high, 7 medium

---

## Critical Issues (Must Fix Before Publishing)

These terms appear in early paragraphs where readers may not have prior exposure:

| Chapter | Line | Term | First Use Context | Suggested Fix |
|---------|------|------|-------------------|---------------|
| ch05 | 5 | LLM | "LLM era" in opening paragraph | Change to "Large Language Model (LLM) era" |
| ch06 | 3 | API | "API endpoint" in opening | Change to "Application Programming Interface (API) endpoint" |
| ch11 | 96-120 | REST | "REST conventions" and "RESTful endpoints" | Add: "REST (Representational State Transfer) conventions" on first use at line 96 |

---

## Issues by Chapter

### Chapter 5 (The 12-Factor Agent)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 5 | LLM | Used in "LLM era" without definition | Change to "Large Language Model (LLM) era" on first use |

**Context:** Chapter 3 (Prompting Fundamentals) defines LLM as "Large Language Model (LLM)" but readers starting at Chapter 5 would lack this definition.

---

### Chapter 6 (The Verification Ladder)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | API | Used as "API endpoint" without introduction | Change to "Application Programming Interface (API) endpoint" |
| 25 | io-ts | Tool mentioned without brief description | Add: "io-ts (a TypeScript runtime type validation library)" |
| 68 | Zod | Tool used without introduction | Add: "Zod is a TypeScript-first schema validation library" before first use |

**Context:** Lines 3, 25, and 68 all use validation library names without context. Readers need to know these are schema validation tools.

---

### Chapter 7 (Quality Gates That Compound)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 5 | CI/CD | Used in opening without definition | Change to "Continuous Integration/Continuous Deployment (CI/CD) pipelines" |
| 164-198 | DDD | Used in formulas without introduction in this chapter | Add parenthetical on first use: "DDD (Domain-Driven Design): 1 + 0.20 = 1.20" |

**Context:** While DDD is mentioned later (line 468), it should be defined on first use in the formulas section.

---

### Chapter 8 (Error Handling and Debugging)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 283 | CI/CD | Used without definition in this chapter | Add: "Continuous Integration/Continuous Deployment (CI/CD)" on first mention |
| 313 | AST-grep | Tool mentioned without brief introduction | Change to "AST-grep (a code structure query and transformation tool)" |

**Context:** Chapter 8 is self-contained; readers may not have read earlier chapters defining CI/CD.

---

### Chapter 9 (Context Engineering Deep Dive)

No critical issues found. Terms are properly introduced.

---

### Chapter 10 (The RALPH Loop)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 175 | idempotent | Technical term used without explanation | Add: "idempotent (able to be run multiple times with the same result)" |

**Context:** "Migrations must be idempotent" assumes readers know the term. Add brief explanation.

---

### Chapter 11 (Sub-Agent Architecture)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 96 | REST | Used as "REST conventions" without definition | Change to "REST (Representational State Transfer) conventions" |
| 120 | REST | Used as "RESTful endpoints" | Relies on line 96 definition; ensure previous fix addresses this |

**Context:** REST is a fundamental API design pattern and should be introduced formally.

---

### Chapter 12 (Development Workflows)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 379 | MCP | Used as "Playwright MCP tool calls" without definition | Add: "Model Context Protocol (MCP) tool calls" on first use |
| 449 | AST-grep | Tool used without introduction | Add: "AST-grep (Abstract Syntax Tree-based code transformation tool)" |

**Context:** MCP is mentioned in Chapter 13 but should be introduced in Chapter 12 when first used.

---

### Chapter 13 (Building the Harness)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 100 | Jaeger | Tool mentioned without brief description | Change to "OpenTelemetry (OTEL) and Jaeger (a distributed tracing system)" |
| 376 | CI/CD | Used without definition in this chapter | Add: "Continuous Integration/Continuous Deployment (CI/CD)" on first mention |
| 439 | MCP | Used as "MCP server" in code context | Already defined on line 476 as "Model Context Protocol (MCP)" - ensure definition appears first |

**Context:** Chapter 13 defines MCP on line 476 but uses it on line 439. Reorder or move definition earlier.

**Fix:** Move the section "Queryable Project Context with MCP" definition up, or reference it on first use at line 439.

---

### Chapter 14 (The Meta-Engineer Playbook)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 537 | K8s | Listed as "Terraform, Docker, K8s" without explanation | Change to "Terraform, Docker, K8s (Kubernetes, a container orchestration platform)" |
| 560 | MCP | Used as "MCP server" without definition in this chapter | Add: "Model Context Protocol (MCP) server" - add definition earlier in chapter |

**Context:** Docker is a tool name but K8s is an acronym that needs definition. MCP should be defined once per chapter.

---

### Chapter 15 (Model Strategy and Cost Optimization)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 523 | CI/CD | Used without definition in this chapter | Add: "Continuous Integration/Continuous Deployment (CI/CD)" on first mention |

**Context:** Chapter 15 is self-contained; CI/CD needs definition in chapter context.

---

## Common Acronyms Status

| Acronym | Definition | Status |
|---------|-----------|--------|
| API | Application Programming Interface | Missing in ch06 |
| CLI | Command Line Interface | Not found in ch05-ch15 ✓ |
| CI/CD | Continuous Integration/Continuous Deployment | Missing in ch05-ch15 (defined in ch01 only) |
| CRUD | Create, Read, Update, Delete | Not explicitly introduced in ch05-ch15 ✓ |
| DDD | Domain-Driven Design | Partially defined; missing on first use in ch07 |
| JWT | JSON Web Token | Not introduced in ch05-ch15 (used but not acronymized) ✓ |
| K8s | Kubernetes | Missing definition in ch14 |
| LLM | Large Language Model | Missing in ch05 (defined in ch03) |
| MCP | Model Context Protocol | Missing on first use in ch12 |
| REST | Representational State Transfer | Missing in ch11 |
| OTEL | OpenTelemetry | Properly defined in ch13 and ch01 ✓ |

---

## Tool Names Needing Brief Introductions

| Tool | Where Used | Issue | Suggested Fix |
|------|-----------|-------|---------------|
| AST-grep | ch08:313, ch12:449 | Mentioned without brief context | "AST-grep (a code structure query tool)" |
| Docker | ch14:537 | Listed without context | "Docker (containerization platform)" |
| Jaeger | ch13:100 | Tool name without description | "Jaeger (a distributed tracing system)" |
| Zod | ch06:68 | Validation library without context | "Zod (a TypeScript schema validation library)" |
| io-ts | ch06:25 | Validation library without context | "io-ts (a runtime type validation library)" |
| Terraform | ch14:537 | Infrastructure tool without context | "Terraform (infrastructure as code tool)" |

---

## Technical Jargon Needing Explanation

| Term | Chapter | Line | Current Context | Suggested Addition |
|------|---------|------|-----------------|-------------------|
| idempotent | ch10 | 175 | "Migrations must be idempotent" | Add: "(able to be executed multiple times with the same result)" |
| bounded context | ch01 (not in ch05-15) | - | Not found in scope | Referenced in ch01; ensure clarity in DDD contexts |

---

## Recommendations for Priority Fixes

### Tier 1 - Do First (Reader Clarity)
1. Fix Chapter 5, Line 5: Define LLM in opening
2. Fix Chapter 6, Line 3: Define API in opening
3. Fix Chapter 11, Line 96: Define REST on first use
4. Fix Chapter 13, Line 439: Move MCP definition before first use

### Tier 2 - Do Before Final Edit (Consistency)
5. Add CI/CD definitions to chapters that lack them (ch07, ch08, ch13, ch15)
6. Define technical terms (idempotent, bounded context) on first use
7. Introduce tool names with brief context (AST-grep, Jaeger, Docker, Terraform, K8s)

### Tier 3 - Nice to Have (Completeness)
8. Standardize acronym introduction format across all chapters
9. Add glossary to appendix with all acronyms and jargon terms
10. Create index linking each acronym to first definition location

---

## Pattern Observations

1. **Chapters are inconsistently self-contained.** Some assume readers have read earlier chapters (CI/CD defined in ch01 but reused without definition).

2. **Tool names vary in formality.** Some tools are mentioned casually (Zod, io-ts) while others have context (Jaeger).

3. **Acronyms expand and contract.** Some chapters expand (REST → Representational State Transfer) while others use unexpanded form (MCP).

---

## Files to Modify

- `/chapters/ch05-the-12-factor-agent.md` (line 5)
- `/chapters/ch06-the-verification-ladder.md` (lines 3, 25, 68)
- `/chapters/ch07-quality-gates-that-compound.md` (lines 5, 164)
- `/chapters/ch08-error-handling-and-debugging.md` (lines 283, 313)
- `/chapters/ch10-the-ralph-loop.md` (line 175)
- `/chapters/ch11-sub-agent-architecture.md` (line 96)
- `/chapters/ch12-development-workflows.md` (lines 379, 449)
- `/chapters/ch13-building-the-harness.md` (lines 100, 376, 439)
- `/chapters/ch14-the-meta-engineer-playbook.md` (lines 537, 560)
- `/chapters/ch15-model-strategy-and-cost-optimization.md` (line 523)

---

## Estimated Effort

- **Total fixes:** 18 term introductions
- **Average per fix:** 1-2 minutes
- **Total time:** ~30 minutes
- **Risk level:** Low (all are additive changes, no deletion)

