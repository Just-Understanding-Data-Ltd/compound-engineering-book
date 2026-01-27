# Term Introduction Check - 2026-01-28

## Summary
- Files scanned: 15 (all chapters)
- Issues found: 62 (initial scan)
- Additional detailed issues found in ch12-ch15: 12 new specific issues
- Total actionable issues: 74

---

## Issues by File

### ch01-the-compound-systems-engineer.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 73 | CRUD | Acronym used before introduction | Change to "Create, Read, Update, Delete (CRUD) endpoints" on first use |
| 76 | CI/CD | Acronym used before introduction | Change to "Continuous Integration/Continuous Deployment (CI/CD)" on first use |
| 86 | DDD | Acronym used before introduction | Change to "Domain-Driven Design (DDD)" on first use |
| 88 | OTEL | Acronym used before introduction | Change to "OpenTelemetry (OTEL)" on first use |
| 89 | Terraform | Tool without explanation | Add "Terraform (infrastructure as code tool)" on first use |
| 89 | Docker | Tool without explanation | Add "Docker (containerization platform)" on first use |
| 89 | Kubernetes | Tool without explanation | Add "Kubernetes (container orchestration platform)" on first use |
| 186 | Bounded contexts | Jargon without explanation | Add brief definition: "bounded contexts (self-contained domain areas)" |
| 188 | Aggregate roots | Jargon without explanation | Add brief definition: "aggregate roots (domain entities that enforce invariants)" |
| 190 | Trace spans | Jargon without explanation | Add brief definition: "trace spans (segments of distributed request execution)" |
| 291 | Stripe | Tool without explanation | Add "Stripe (payment processing platform)" on first use |
| 291 | idempotency | Jargon without explanation | Add brief definition: "idempotency (operations that produce the same result when repeated)" |

### ch02-getting-started-with-claude-code.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 17 | JSDoc | Acronym/tool used before introduction | Change to "JSDoc (JavaScript documentation comments)" on first use |
| 157 | JWT | Acronym used before introduction | Change to "JSON Web Token (JWT)" on first use |

### ch03-prompting-fundamentals.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | LLM | Acronym used before introduction | Change to "Large Language Model (LLM)" on first use |
| 28 | Zod | Tool without explanation | Add "Zod (TypeScript schema validation library)" on first use |

### ch04-writing-your-first-claude-md.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | Temporal | Tool without explanation | Add "Temporal (workflow orchestration platform)" on first use |
| 10 | LLMs | Acronym used before introduction | Change to "Large Language Models (LLMs)" or reference Chapter 3 definition |
| 67 | Supabase | Tool without explanation | Add "Supabase (open-source Firebase alternative)" on first use |
| 68 | RLS | Acronym used before introduction | Change to "Row-Level Security (RLS)" on first use |
| 167 | tRPC | Tool without explanation | Add "tRPC (TypeScript RPC framework)" on first use |
| 324 | Cursor | Tool without explanation | Add "Cursor (AI-powered code editor)" on first use |
| 324 | Aider | Tool without explanation | Add "Aider (AI pair programming tool)" on first use |

### ch05-the-12-factor-agent.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 5 | LLM | Acronym used before introduction | Change to "Large Language Model (LLM)" or add cross-reference to ch03 |
| 391 | DAG | Acronym used before introduction | Change to "Directed Acyclic Graph (DAG)" on first use |

### ch06-the-verification-ladder.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 13 | TLA+ | Tool without explanation | Add "TLA+ (formal specification language)" on first use |
| 13 | Z3 | Tool without explanation | Add "Z3 (automated theorem prover)" on first use |
| 14 | fast-check | Tool without explanation | Add "fast-check (property-based testing library)" on first use |
| 14 | Hypothesis | Tool without explanation | Add "Hypothesis (Python property-based testing library)" on first use |
| 21 | Zod | Tool without explanation | Add "Zod (TypeScript schema validation library)" on first use |
| 21 | io-ts | Tool without explanation | Add "io-ts (TypeScript runtime type validation)" on first use |
| 325 | LLM | Acronym used without chapter introduction | Add introduction or cross-reference to ch03 |

### ch07-quality-gates-that-compound.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 167 | DDD | Acronym used before introduction | Move full form "Domain-Driven Design (DDD)" to line 167 instead of line 469 |
| 234 | hooks | Jargon introduced abruptly | Consider adding "(automated scripts triggered by tool actions)" after first use |

### ch08-error-handling-and-debugging.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 86 | bcrypt | Tool without explanation | Add "bcrypt (password hashing library)" on first use |
| 222 | Opus, Sonnet | Model names without introduction | Add "Claude Opus (most capable model) instead of Sonnet (faster, lower-cost model)" |
| 361 | Zod | Tool without explanation | Add brief reminder or reference to earlier chapter definition |

---

## NEW FINDINGS FOR CH09-CH15 (DETAILED SCAN)

### ch09-context-engineering-deep-dive.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| --- | --- | Model | Excellent | Chapter explains information theory concepts (entropy, mutual information, channel capacity) thoroughly as they're introduced |

**Note:** This chapter is a model for term introduction. No issues found.

### ch10-the-ralph-loop.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 9 | LLM | Status | Good | "Large language models (LLMs)" properly introduced on first use |
| 16 | JWT | Undefined | MEDIUM | Acronym used without definition in context: "Try using JWT refresh tokens" - should be "JSON Web Token (JWT) refresh tokens" |
| 31 | JWT | Undefined | MEDIUM | Continues undefined usage: "Model is now anchored on JWT approach" |
| 175 | idempotent | Undefined | MEDIUM | Technical jargon: "Migrations must be idempotent" - needs explanation: "idempotent (safe to retry multiple times without side effects)" |

**Summary:** 3 actionable issues - JWT needs definition on first use (line 16), idempotent needs context on line 175.

### ch11-sub-agent-architecture.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 35 | Result type | Pattern without context | LOW | Add "Result type (a pattern for returning success/failure instead of throwing exceptions)" |
| 64 | hexagonal architecture | Jargon without explanation | MEDIUM | Add "hexagonal architecture (pattern where dependencies flow inward to the domain)" |
| 96 | REST | Undefined | MEDIUM | "Design URL following REST conventions" - should be "Representational State Transfer (REST) conventions" |
| 127 | JWT | Undefined | MEDIUM | "Use JWT tokens with our custom middleware" - should be "JSON Web Token (JWT) tokens" |
| 512 | JWT | Undefined | MEDIUM | Section heading "Real-World Example: JWT Authentication" - continuing undefined usage |

**Summary:** 5 issues - REST and JWT need formal introductions, hexagonal architecture needs brief definition.

### ch12-development-workflows.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 43 | JWT | Undefined | MEDIUM | "Plan how to add JWT-based authentication:" - should define JWT on first use in chapter |
| 47 | API | Undefined | **NEW** HIGH | "Impact on existing API endpoints?" - Application Programming Interface (API) not defined on first use in chapter |
| 59 | JWT | Undefined | MEDIUM | Continues undefined usage in dialogue |
| 96 | REST | Undefined | MEDIUM | "Create Representational State Transfer (REST) API endpoints" - REST IS defined here (properly) |
| 131 | REST, CRUD | Status | GOOD | "Representational State Transfer (REST) API endpoints for user Create, Read, Update, Delete (CRUD)" - BOTH properly defined ✓ |
| 449 | AST | Undefined in heading | LOW | "AST-Grep for Precision Transformations" - acronym used before expansion. Should be "Abstract Syntax Tree (AST)-Grep" |
| 450 | AST | Status | GOOD | "Abstract Syntax Tree (AST) grep tools parse..." - DEFINED on first use in text ✓ |
| 515 | slash command | Feature undefined | LOW | "Make it a slash command" - should explain "(custom commands defined in .claude/commands/)" |

**Summary:** 6 issues total - API needs definition at line 47 (NEW), JWT needs definition at line 43, AST heading should be expanded (minor).

### ch13-building-the-harness.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 3 | LLM | Undefined in chapter | MEDIUM | "This is already a harness around the raw LLM" - LLM should be defined in this chapter context: "Large Language Model (LLM)" |
| 11 | APIs | Undefined | **NEW** MEDIUM | "It might hallucinate APIs that do not exist" - API plural used without definition |
| 100 | OTEL | Status | GOOD | "OpenTelemetry (OTEL)" - properly defined on first use ✓ |
| 100 | Jaeger | Undefined | MEDIUM | "...uses OpenTelemetry (OTEL) and Jaeger:" - Jaeger needs brief description: "Jaeger (distributed tracing tool)" |
| 139 | E2E tests | Undefined | **NEW** MEDIUM | "E2E tests: Confirm real user flows work" - should be "End-to-End (E2E) tests" |
| 159 | DDD | Status | GOOD | "Domain-Driven Design (DDD) gives LLMs clear boundaries" - properly defined ✓ |
| 317 | invariants | Undefined | MEDIUM | "Define performance constraints as mathematical invariants:" - should add "(conditions that must always be satisfied)" |
| 376 | CI/CD | Undefined heading | **NEW** LOW | Section heading "CI/CD Integration" - acronym not defined in context |
| 391 | LLM | Undefined context | MEDIUM | "Large Language Model spend" - continuing use as assumed knowledge |
| 425 | CI | Undefined | **NEW** LOW | "Scripts can be run in Continuous Integration (CI) automatically" - CI mentioned without definition here |
| 439 | MCP | Undefined initial use | **NEW** MEDIUM | "An MCP server that scaffolds CRUD endpoints" - MCP used BEFORE definition (defined line 476) |
| 439 | CRUD | Undefined | **NEW** MEDIUM | "scaffolds CRUD endpoints" - Create, Read, Update, Delete not defined |
| 476 | MCP | Status | GOOD | "MCP (Model Context Protocol) servers provide..." - properly defined ✓ |

**Summary:** 7 NEW actionable issues identified - API, E2E, CI/CD, MCP (premature use), CRUD need definitions or clarification.

### ch14-the-meta-engineer-playbook.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 26 | LLM | Undefined | MEDIUM | "Large Language Model thinking time" - LLM not defined in chapter (assumed knowledge) |
| 134 | LLM | Undefined | MEDIUM | "Variable latency (LLM reasoning + execution)" - continuing undefined use |
| 268 | invariant thinking | Undefined | MEDIUM | "...invariant thinking, complexity analysis..." - should clarify: "invariant thinking (reasoning about conditions that must remain true)" |
| 427 | CRUD | Undefined | **NEW** MEDIUM | "Writes CRUD endpoints" - Create, Read, Update, Delete should be defined in this table |
| 430 | CI/CD | Undefined | **NEW** MEDIUM | "Uses CI/CD" - should be "Continuous Integration/Continuous Deployment (CI/CD)" |
| 449 | OTEL | Undefined | **NEW** MEDIUM | "OTEL_EXPORTER_OTLP_ENDPOINT" - acronym embedded without definition context |
| 537 | Terraform | Undefined | **NEW** LOW | "Terraform (infrastructure as code tool)" - tool described (good), but listed without description in context |
| 537 | Docker | Undefined | **NEW** LOW | "Docker (containerization platform)" - tool described (good), but listed without description in context |
| 537 | K8s | Undefined | MEDIUM | "(Terraform, Docker, K8s)" in skills stack - should be "(Terraform, Docker, Kubernetes (K8s))" |
| 547 | Factorio | Cultural reference undefined | LOW | "Think like a Factorio player..." - should add "(a factory-building video game)" for unfamiliar readers |
| 560 | MCP | Undefined reference | **NEW** LOW | "A prompt like 'Build an MCP server that scaffolds CRUD endpoints'" - both MCP and CRUD referenced without definition |
| 560 | CRUD | Undefined again | **NEW** LOW | "scaffolds CRUD endpoints" - second occurrence without definition |

**Summary:** 7 NEW actionable issues - CRUD, CI/CD, OTEL, Terraform/Docker, MCP/CRUD need definitions.

### ch15-model-strategy-and-cost-optimization.md

| Line | Term | Issue | Severity | Suggested Fix |
|------|------|-------|----------|---------------|
| 18 | MTok | **NEW** MEDIUM | First use: "per million tokens (MTok input)" - MTok is abbreviation but could be clearer |
| 26 | LLM | Undefined | MEDIUM | "Most teams default to mid-tier models" - LLM context assumed without definition |
| 39 | ROI | **NEW** MEDIUM | "ROI: 37-93x return on AI spend" - Return on Investment (ROI) not defined |
| 48 | Haiku, Sonnet, Opus | Model tiers undefined | MEDIUM | "Tier 1: Haiku, Tier 2: Sonnet, Tier 3: Opus" - should have intro: "Claude offers three model tiers: Haiku (fastest/cheapest), Sonnet (balanced), Opus (most capable)" |
| 93 | AST | **NEW** MEDIUM | "AST navigation and symbol lookup" - Abstract Syntax Tree (AST) not defined (defined later in ch12) |
| 270 | API | **NEW** MEDIUM | "const response = await anthropic.messages.create({" - API context used without explicit definition in chapter |
| 431 | MTok | Status | CONFIRMED | "per million tokens (MTok)" - same abbreviation, acceptable if defined at line 18 |
| 437 | YOLO mode | Undefined | MEDIUM | "YOLO mode eliminates permission prompts:" - should explain: "YOLO mode (You Only Live Once, skipping all permission prompts)" |
| 523 | CI/CD | Undefined | MEDIUM | "Daily development, CI/CD automation" - CI/CD not defined in this chapter. Should be: "Continuous Integration/Continuous Deployment (CI/CD)" |

**Summary:** 6 NEW actionable issues - MTok, ROI, AST, API, YOLO mode, CI/CD need definitions or clarification.

---

## Critical Issues Summary (All Chapters, Prioritized)

### HIGHEST PRIORITY (Used before definition or never defined in chapter)

| Chapter | Line | Term | Fix Priority | Details |
|---------|------|------|--------------|---------|
| ch13 | 439 | MCP | CRITICAL | Used BEFORE definition (appears at 476) |
| ch12 | 47 | API | HIGH | Never defined in this chapter, used early |
| ch12 | 43 | JWT | HIGH | Never defined in this chapter |
| ch10 | 16 | JWT | HIGH | Never defined in this chapter |

### HIGH PRIORITY (Technical/business terms missing definition)

| Chapter | Line | Term | Fix Priority | Details |
|---------|------|------|--------------|---------|
| ch13 | 439 | CRUD | HIGH | Core concept, not defined |
| ch14 | 427 | CRUD | HIGH | Core concept, appears in table |
| ch15 | 39 | ROI | HIGH | Business metric, not defined |
| ch15 | 437 | YOLO mode | HIGH | Feature name, not defined |
| ch15 | 93 | AST | MEDIUM | Technical term, not defined |

### MEDIUM PRIORITY (Acronyms or tools missing context)

| Chapter | Line | Term | Fix Priority | Details |
|---------|------|------|--------------|---------|
| ch13 | 11 | APIs | MEDIUM | Plural form, used without intro |
| ch13 | 139 | E2E | MEDIUM | Common acronym, needs definition |
| ch13 | 376 | CI/CD | MEDIUM | Acronym in heading |
| ch13 | 425 | CI | MEDIUM | Mentioned without definition |
| ch13 | 100 | Jaeger | MEDIUM | Tool name needs description |
| ch14 | 430 | CI/CD | MEDIUM | Used without definition in text |
| ch14 | 449 | OTEL | MEDIUM | Embedded in variable name |
| ch14 | 537 | K8s | MEDIUM | Acronym needs full form |
| ch15 | 18 | MTok | MEDIUM | Abbreviation could be clearer |
| ch15 | 270 | API | MEDIUM | Context implied but not defined |
| ch15 | 523 | CI/CD | MEDIUM | Not defined in this chapter |

---

## Exemplary Practices (Ch09-Ch15)

1. **ch09-context-engineering-deep-dive.md**: Mathematical concepts (entropy, mutual information, channel capacity) all explained as introduced. Model chapter.

2. **ch13-building-the-harness.md**: OTEL, DDD, and MCP all properly introduced with full names on first use (except MCP which appears at line 439 before definition at 476).

3. **ch12-development-workflows.md** (Partial): REST and CRUD properly defined inline at line 131.

---

## Recommendations for Fixes

### IMMEDIATE (CRITICAL/HIGH PRIORITY)

1. **CH13, Line 439**: Move MCP definition from line 476 to before line 439 (or add parenthetical definition at first use)
2. **CH12, Line 47**: Add "Application Programming Interface (API)" definition before or at line 47
3. **CH12, Line 43**: Add "JSON Web Token (JWT)" definition at chapter level
4. **CH10, Line 16**: Add "JSON Web Token (JWT)" definition at chapter level
5. **CH13, Line 439**: Add "Create, Read, Update, Delete (CRUD)" definition
6. **CH14, Line 427**: Add "Create, Read, Update, Delete (CRUD)" definition in table

### SOON (MEDIUM PRIORITY)

7. **CH15, Line 48**: Add introductory explanation of Claude model tiers (Haiku, Sonnet, Opus)
8. **CH15, Line 39**: Add "Return on Investment (ROI)" definition
9. **CH15, Line 437**: Add "YOLO mode (You Only Live Once, skipping permission prompts)" definition
10. **CH11, Line 96**: Define REST as "Representational State Transfer (REST)"
11. **CH13, Line 100**: Add "(distributed tracing tool)" after "Jaeger"
12. **CH13, Line 3**: Add "Large Language Model (LLM)" definition in chapter context
13. **CH13, Line 139**: Change "E2E tests" to "End-to-End (E2E) tests"
14. **CH14, Line 430**: Add "Continuous Integration/Continuous Deployment (CI/CD)"
15. **CH14, Line 537**: Change "K8s" to "Kubernetes (K8s)"
16. **CH15, Line 93**: Change "AST navigation" to "Abstract Syntax Tree (AST) navigation"
17. **CH15, Line 523**: Add "Continuous Integration/Continuous Deployment (CI/CD)"

### NICE-TO-HAVE (LOW PRIORITY)

18. **CH10, Line 175**: Add explanation of "idempotent" term
19. **CH12, Line 449**: Clarify AST in section heading: "Abstract Syntax Tree (AST)-Grep"
20. **CH13, Line 376**: Expand CI/CD heading or add definition context
21. **CH14, Line 547**: Add "(a factory-building video game)" to Factorio reference

---

## Pattern Recommendations

### Pattern for Acronyms
```markdown
First use: Full Name (ACRONYM)
Subsequent: ACRONYM
Example: Domain-Driven Design (DDD) helps organize...
```

### Pattern for Tools
```markdown
Tool name (brief description) does...
Example: Jaeger (distributed tracing tool) collects spans...
```

### Pattern for Technical Jargon
```markdown
Term (explanation of what it means) in this context...
Example: idempotent (operations that produce the same result when repeated) migrations...
```

---

## Term Index for Chapters 9-15

**Acronyms needing fixes (NEW findings):**
- API (ch12:47, ch15:270)
- AST (ch15:93)
- CI (ch13:425)
- CI/CD (ch13:376, ch14:430, ch15:523)
- CRUD (ch13:439, ch14:427, ch14:560)
- E2E (ch13:139)
- JWT (ch10:16, ch11:127, ch12:43, ch12:59)
- K8s (ch14:537)
- LLM (ch13:3, ch14:26, ch15:26)
- MCP (ch13:439 - used BEFORE definition at 476)
- MTok (ch15:18)
- OTEL (ch14:449)
- REST (ch11:96, ch12:96 - ch12 has definition)
- ROI (ch15:39)

**Technical Jargon needing context (NEW findings):**
- Factorio reference (ch14:547)
- hexagonal architecture (ch11:64)
- idempotent (ch10:175)
- invariant/invariant thinking (ch13:317, ch14:268)
- YOLO mode (ch15:437)

**Tools needing descriptions (NEW findings):**
- Docker (ch14:537)
- Jaeger (ch13:100)
- Terraform (ch14:537)

**Model names needing introduction (NEW findings):**
- Claude Haiku, Sonnet, Opus (ch15:48)

---

## Checklist for Edits (Prioritized)

### CRITICAL
- [ ] **CH13:439** - Move MCP definition or add inline
- [ ] **CH12:47** - Define API
- [ ] **CH12:43** - Define JWT in chapter context
- [ ] **CH10:16** - Define JWT in chapter context

### HIGH
- [ ] **CH13:439** - Define CRUD
- [ ] **CH14:427** - Define CRUD in table
- [ ] **CH15:39** - Define ROI
- [ ] **CH15:437** - Define YOLO mode

### MEDIUM
- [ ] **CH15:48** - Explain model tiers (Haiku, Sonnet, Opus)
- [ ] **CH15:93** - Define AST
- [ ] **CH15:523** - Define CI/CD
- [ ] **CH13:100** - Add Jaeger description
- [ ] **CH13:3** - Add LLM definition
- [ ] **CH13:139** - Expand E2E to End-to-End
- [ ] **CH13:376** - Add CI/CD context
- [ ] **CH14:430** - Define CI/CD
- [ ] **CH14:537** - Change K8s to Kubernetes
- [ ] **CH13:425** - Define CI
- [ ] **CH13:11** - Add context for APIs
- [ ] **CH14:449** - Add OTEL context
- [ ] **CH15:270** - Add API context
- [ ] **CH15:18** - Clarify MTok definition

### LOW
- [ ] **CH10:175** - Explain idempotent
- [ ] **CH12:449** - Expand AST heading
- [ ] **CH14:547** - Add Factorio context
