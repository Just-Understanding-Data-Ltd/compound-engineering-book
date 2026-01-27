# Term Introduction Check - 2026-01-27 (v4 - updated with OAuth and 2FA findings)

## Summary
- Files scanned: 15 chapters
- Issues found: 58 (54 previous + 4 new OAuth/2FA issues)
- Last updated: 2026-01-27

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
| 29 | WSL2 | Acronym used without introduction | Change to "Windows Subsystem for Linux 2 (WSL2)" on first use |
| 157 | JWT | Acronym used before introduction | Change to "JSON Web Token (JWT)" on first use |

### ch03-prompting-fundamentals.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | LLM | Acronym used before introduction | Change to "Large Language Model (LLM)" on first use |
| 5-6 | entropy | Technical term used without context | Add brief explanation: "entropy (a measure of uncertainty in possible outputs)" |
| 28 | Zod | Tool without explanation | Add "Zod (TypeScript schema validation library)" on first use |

### ch04-writing-your-first-claude-md.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | Temporal | Tool without explanation | Add "Temporal (workflow orchestration platform)" on first use |
| 11 | LLMs | Acronym used before introduction | Change to "Large Language Models (LLMs)" or reference Chapter 3 definition |
| 67 | Supabase | Tool without explanation | Add "Supabase (open-source Firebase alternative)" on first use |
| 68 | RLS | Acronym used before introduction | Change to "Row-Level Security (RLS)" on first use |
| 167 | tRPC | Tool without explanation | Add "tRPC (TypeScript RPC framework)" on first use |
| 324 | Cursor | Tool without explanation | Add "Cursor (AI-powered code editor)" on first use |
| 324 | Aider | Tool without explanation | Add "Aider (AI pair programming tool)" on first use |

### ch05-the-12-factor-agent.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 5 | LLM | Acronym used before introduction | Change to "Large Language Model (LLM)" or add cross-reference to ch03 |
| 91 | JWT | Acronym used before introduction | Change to "JSON Web Token (JWT)" on first use |
| 126 | idempotency | Jargon mentioned without explanation | Add "idempotency (operations that produce the same result when repeated)" |
| 391 | DAG | Acronym used before introduction | Change to "Directed Acyclic Graph (DAG)" on first use |

### ch06-the-verification-ladder.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 13 | TLA+ | Tool without explanation | Add "TLA+ (formal specification language)" on first use |
| 13 | Z3 | Tool without explanation | Add "Z3 (automated theorem prover)" on first use |
| 14 | fast-check | Tool without explanation | Add "fast-check (property-based testing library)" on first use |
| 14 | Hypothesis | Tool without explanation | Add "Hypothesis (Python property-based testing library)" on first use |
| 21 | Zod | Tool referenced again | Consider adding brief reminder or reference to earlier chapter definition |
| 21 | io-ts | Tool without explanation | Add "io-ts (TypeScript runtime type validation)" on first use |
| 325 | LLM | Acronym used without chapter introduction | Add introduction or cross-reference to ch03 |

### ch07-quality-gates-that-compound.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 167 | DDD | Acronym used before introduction | Move full form "Domain-Driven Design (DDD)" to line 167 instead of line 469 |
| 234 | hooks | Jargon introduced abruptly | Consider adding "(automated scripts triggered by tool actions)" after first use |
| 398 | Biome | Tool without introduction | Add brief description: "Biome (fast formatter and linter)" |
| 399 | ESLint | Tool without introduction | Add brief description: "ESLint (JavaScript/TypeScript linter)" |

### ch08-error-handling-and-debugging.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 78 | bcrypt | Tool without explanation | Add context: "bcrypt (password hashing library)" |
| 212 | OAuth | Acronym used without definition | Change to "We'll add OAuth (Open Authorization) and 2FA (Two-Factor Authentication) in subsequent steps." |
| 212 | 2FA | Acronym used without definition | Change to "We'll add OAuth (Open Authorization) and 2FA (Two-Factor Authentication) in subsequent steps." |
| 222 | Opus, Sonnet | Model names without introduction | Add "Claude Opus (most capable model) instead of Sonnet (faster, lower-cost model)" |
| 265 | LLMs | Acronym used without introduction | Change to "Large Language Models (LLMs)" or reference earlier chapter |
| 361 | Zod | Tool without explanation | Add brief reminder or reference to earlier chapter definition |

### ch09-context-engineering-deep-dive.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 7 | LLM | Acronym used | Consider adding chapter introduction or cross-reference |

**Note:** This chapter is a model for term introduction. It properly explains entropy, mutual information, channel capacity, and other technical concepts as they appear. The information theory terminology is well-introduced.

### ch10-the-ralph-loop.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 16-35 | JWT | Multiple uses before definition | JWT is used on lines 16, 21, 26, 31 before being defined on line 35. Consider moving definition to the first use or earlier in the chapter. |

**Note:** This chapter properly introduces LLMs on first use (line 9). JWT usage should follow the same pattern.

### ch11-sub-agent-architecture.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 35 | Result type | Pattern without context | Add "Result type (a pattern for returning success/failure instead of throwing exceptions)" |
| 37 | QA | Acronym used without introduction | Change to "Quality Assurance (QA) Engineer" on first use |
| 64 | hexagonal architecture | Jargon without explanation | Add "hexagonal architecture (pattern where dependencies flow inward to the domain)" |
| 512 | JWT | Acronym used without introduction | Change to "JSON Web Token (JWT)" on first use in this chapter |

### ch12-development-workflows.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 449 | AST | Acronym in heading before expansion | Consider "AST-Grep: Abstract Syntax Tree Search" for heading, or expand in first sentence |
| 515 | slash command | Feature without explanation | Add "(custom commands defined in .claude/commands/)" on first use |
| 540 | OAuth | Acronym used without definition | Change to "Usage: `/feature-branch User authentication with OAuth (Open Authorization)`" |

**Note:** Line 470 properly expands AST as "Abstract Syntax Tree" but the section heading on line 449 uses it first.

### ch13-building-the-harness.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 3 | LLM | Acronym used in title without definition | Change line 3 to: "Claude Code is a harness around a Large Language Model (LLM). Your job is to build a harness around Claude Code." |
| 9 | LLM | Acronym used | Properly define in opening paragraph when LLM is first mentioned |
| 101 | Jaeger | Tool without introduction | Add "Jaeger (distributed tracing platform)" |
| 159 | DDD | Acronym introduced here | Good - "Domain-Driven Design (DDD)" properly introduced |

**Properly Introduced Terms in Ch13:**
- Line 100: "OpenTelemetry (OTEL)"
- Line 159: "Domain-Driven Design (DDD)"
- Line 474: "MCP (Model Context Protocol)"

**Note:** Chapter 13 is an excellent model for term introduction, except for the LLM definition at the start.

### ch14-the-meta-engineer-playbook.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 590 | ROI | Acronym used without introduction | Change to "Return on Investment (ROI)" on first use |
| 315-326 | Wave terminology | Framework terminology | Good - explained with table |

### ch15-model-strategy-and-cost-optimization.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 18 | MTok | Abbreviation without explanation | Add "(million tokens)" after first use: "$3/MTok (million tokens)" |
| 112 | OAuth | Acronym used without definition | Change to "A task like 'redesign the authentication system to support OAuth (Open Authorization)' maps to Opus." |
| 267 | max_tokens | API parameter without context | Brief explanation that this is an API parameter would help beginners |

**Note:** Model tiers (Haiku, Sonnet, Opus) are well-introduced in context starting at line 46.

---

## Critical Issues (High Priority)

These issues appear in early chapters and affect reader comprehension:

1. **ch01:73** - CRUD: Used in a comparison table without definition. Readers new to programming may not know this acronym.

2. **ch01:86-89** - DDD, OTEL, Terraform, Docker, Kubernetes: Multiple undefined terms in the "skill stack" section. This is a key conceptual section that needs clarity.

3. **ch03:3** - LLM: First chapter to use this acronym extensively. Should define it at the start since this is a foundational concept for the book.

4. **ch04:3** - Temporal: Opening sentence mentions this tool without explanation, potentially confusing readers.

5. **ch08:212** - OAuth and 2FA: Both authentication-related acronyms used without definition. This is surprising given the security context.

6. **ch08:222** - Opus/Sonnet: Model tier names used without explaining what they are. Readers unfamiliar with Claude models need context.

7. **ch11:64** - hexagonal architecture: Architectural pattern mentioned casually without explanation.

8. **ch13:3** - LLM: Acronym used in chapter title without ever being formally defined in the chapter.

---

## Chapters With Good Term Practices

These chapters demonstrate proper term introduction and can serve as models:

1. **ch09-context-engineering-deep-dive.md**: Explains information theory concepts (entropy, mutual information, channel capacity) thoroughly as they're introduced.

2. **ch10-the-ralph-loop.md**: Opens with proper LLM introduction: "Large language models (LLMs)..."

3. **ch13-building-the-harness.md**: Properly introduces OTEL, DDD, and MCP with full expansions on first use (except LLM in title).

4. **ch15-model-strategy-and-cost-optimization.md**: Model tiers (Haiku, Sonnet, Opus) are well-explained in context.

---

## Cross-Chapter Consistency Issues

### LLM (Large Language Model)
First introduced properly: **Chapter 10, line 9**

Used without introduction: Chapters 3, 4, 5, 6, 8, 9, 13

**Recommendation:** Introduce "Large Language Model (LLM)" in Chapter 1 or the book's introduction, then use abbreviation throughout.

### DDD (Domain-Driven Design)
First introduced properly: **Chapter 13, line 159**

Used without introduction: Chapters 1, 7

**Recommendation:** Introduce "Domain-Driven Design (DDD)" in Chapter 1 (line 86) where it first appears, with a brief explanation.

### JWT (JSON Web Token)
First introduced properly: **Chapter 2, line 157** (but actually used much earlier in ch10)

Used without introduction or with late definition: Chapters 5, 10 (lines 16-35 before definition), 11

**Recommendation:** Introduce "JSON Web Token (JWT)" on first use in Chapter 2, and ensure ch10 defines it before use on line 16.

### OAuth (Open Authorization)
First introduced properly: **NEVER - NEW FINDING**

Used without introduction: Chapters 8 (line 212), 12 (line 540), 15 (line 112)

**Recommendation:** Define "OAuth (Open Authorization)" when first mentioned in Chapter 8, line 212.

### 2FA (Two-Factor Authentication)
First introduced properly: **NEVER - NEW FINDING**

Used without introduction: Chapter 8 (line 212)

**Recommendation:** Define "2FA (Two-Factor Authentication)" on line 212 of Chapter 8.

### OTEL (OpenTelemetry)
First introduced properly: **Chapter 13, line 100**

Used without introduction: Chapter 1

**Recommendation:** Introduce in Chapter 1 or add cross-reference to Chapter 13.

---

## Recommendations

### Pattern 1: First Use Definition
For acronyms, use the pattern "Full Name (ACRONYM)" on first occurrence:
```
Domain-Driven Design (DDD) helps organize complex domains...
```

### Pattern 2: Brief Tool Descriptions
For tools, add a brief parenthetical on first mention:
```
...using Temporal (a workflow orchestration platform) to handle...
```

### Pattern 3: Cross-Chapter References
For terms defined in earlier chapters, add a brief reminder or reference:
```
LLMs (see Chapter 3) function as stateless systems...
```

### Pattern 4: Glossary Consideration
Given the number of technical terms (now 58 issues), consider adding an appendix glossary that chapters can reference.

### Pattern 5: Model Name Introduction
When discussing Claude model tiers:
```
Claude Opus (the most capable model tier) excels at complex reasoning,
while Sonnet (faster and more cost-effective) handles routine tasks.
```

---

## Term Index

For reference, here are all identified terms that need introduction:

**Acronyms:**
- 2FA (Two-Factor Authentication) - ch08 [NEW]
- AST (Abstract Syntax Tree) - ch12
- CI/CD (Continuous Integration/Continuous Deployment) - ch01
- CRUD (Create, Read, Update, Delete) - ch01
- DAG (Directed Acyclic Graph) - ch05
- DDD (Domain-Driven Design) - ch01, ch07, ch13 (introduced)
- JSDoc (JavaScript Documentation) - ch02
- JWT (JSON Web Token) - ch02, ch05, ch10 (late definition), ch11
- LLM (Large Language Model) - ch03, ch04, ch05, ch06, ch08, ch09, ch10 (introduced), ch13
- MCP (Model Context Protocol) - ch13 (introduced)
- MTok (Million Tokens) - ch15
- OAuth (Open Authorization) - ch08, ch12, ch15 [NEW - NOT INTRODUCED]
- OTEL (OpenTelemetry) - ch01, ch13 (introduced)
- QA (Quality Assurance) - ch11
- RLS (Row-Level Security) - ch04
- ROI (Return on Investment) - ch14
- tRPC (TypeScript Remote Procedure Call) - ch04
- WSL2 (Windows Subsystem for Linux 2) - ch02

**Tools:**
- Aider (AI pair programming tool) - ch04
- bcrypt (password hashing library) - ch08
- Biome (fast formatter and linter) - ch07
- Cursor (AI-powered code editor) - ch04
- Docker (containerization platform) - ch01
- ESLint (JavaScript/TypeScript linter) - ch07
- fast-check (property-based testing library) - ch06
- Hypothesis (Python property-based testing) - ch06
- io-ts (TypeScript runtime validation) - ch06
- Jaeger (distributed tracing platform) - ch13
- Kubernetes/K8s (container orchestration) - ch01
- Stripe (payment processing) - ch01
- Supabase (backend-as-a-service) - ch04
- Temporal (workflow orchestration) - ch04
- Terraform (infrastructure as code) - ch01
- TLA+ (formal specification language) - ch06
- Z3 (theorem prover) - ch06
- Zod (TypeScript schema validation) - ch03, ch06, ch08

**Jargon:**
- Aggregate roots - ch01
- Bounded contexts - ch01
- Hexagonal architecture - ch11
- Hooks (automated scripts) - ch07
- Idempotency - ch01, ch05
- Result type (error handling pattern) - ch11
- Slash command (Claude Code feature) - ch12
- Trace spans - ch01

**Model Names:**
- Claude Haiku (fastest tier) - ch15 (introduced)
- Claude Opus (most capable tier) - ch08, ch15 (introduced)
- Claude Sonnet (balanced tier) - ch08, ch15 (introduced)

---

## Status Legend
- (introduced) = Properly introduced in at least one chapter
- [NEW] = Newly identified issues
- No mark = Needs introduction in all occurrences

---

**Review completed:** 2026-01-27 (v4)
**Reviewer:** term-intro-checker agent
**Updates:** Added OAuth (3 instances), 2FA (1 instance), and refined ch10 JWT analysis
