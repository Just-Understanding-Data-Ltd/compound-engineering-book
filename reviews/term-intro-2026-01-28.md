# Term Introduction Check - 2026-01-28

## Summary
- Files scanned: 15
- Issues found: 58

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

### ch09-context-engineering-deep-dive.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| --- | --- | No major issues | Chapter explains concepts well as they are introduced |

**Note:** This chapter is a model for term introduction. It properly explains entropy, mutual information, channel capacity, and other technical concepts as they appear.

### ch10-the-ralph-loop.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| --- | --- | LLMs properly introduced | Line 9: "Large language models (LLMs) maintain internal state..." |

**Note:** This chapter properly introduces LLMs on first use (line 9). Other chapters should follow this pattern.

### ch11-sub-agent-architecture.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 35 | Result type | Pattern without context | Add "Result type (a pattern for returning success/failure instead of throwing exceptions)" |
| 64 | hexagonal architecture | Jargon without explanation | Add "hexagonal architecture (pattern where dependencies flow inward to the domain)" |
| 512 | JWT | Acronym used without introduction | Change to "JSON Web Token (JWT)" on first use in this chapter |

### ch12-development-workflows.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 449 | AST | Acronym in heading before expansion | Consider "AST-Grep: Abstract Syntax Tree Search" for heading, or expand in first sentence |
| 515 | slash command | Feature without explanation | Add "(custom commands defined in .claude/commands/)" on first use |

**Note:** Line 465 properly expands AST as "Abstract Syntax Tree" but the section heading on line 449 uses it first.

### ch13-building-the-harness.md

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| --- | --- | Excellent term introductions | This chapter properly introduces terms |

**Properly Introduced Terms in Ch13:**
- Line 99: "OpenTelemetry (OTEL)"
- Line 159: "Domain-Driven Design (DDD)"
- Line 474: "MCP (Model Context Protocol)"

**Note:** Chapter 13 is an excellent model for term introduction. All major acronyms and tools are properly expanded on first use.

### ch14-the-meta-engineer-playbook.md (NEW)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 536 | K8s | Abbreviation used without introduction | Change to "Kubernetes (K8s)" or use full "Kubernetes" |
| 547 | Factorio | Gaming reference without context | Add "(a factory-building video game)" for readers unfamiliar with the reference |

**Note:** Chapter 14 generally introduces concepts well. The skill atrophy framework and six waves are explained thoroughly.

### ch15-model-strategy-and-cost-optimization.md (NEW)

| Line | Term | Issue | Suggested Fix |
|------|------|-------|---------------|
| 48-50 | Haiku, Sonnet, Opus | Model tier names without context | Add on first use: "Claude offers three model tiers: Haiku (fastest/cheapest), Sonnet (balanced), and Opus (most capable)" |
| 65 | MTok | Abbreviation without introduction | Change to "million tokens (MTok)" on first use |
| 437 | YOLO mode | Term used without full explanation | Add "(You Only Live Once mode, skipping all permission prompts)" near first use |
| 629 | AI ecosystem | Vague term | Consider clarifying which providers/tools are meant |

---

## Critical Issues (High Priority)

These issues appear in early chapters and affect reader comprehension:

1. **ch01:73** - CRUD: Used in a comparison table without definition. Readers new to programming may not know this acronym.

2. **ch01:86-89** - DDD, OTEL, Terraform, Docker, Kubernetes: Multiple undefined terms in the "skill stack" section. This is a key conceptual section that needs clarity.

3. **ch03:3** - LLM: First chapter to use this acronym extensively. Should define it at the start since this is a foundational concept for the book.

4. **ch04:3** - Temporal: Opening sentence mentions this tool without explanation, potentially confusing readers.

5. **ch08:222** - Opus/Sonnet: Model tier names used without explaining what they are. Readers unfamiliar with Claude models need context.

6. **ch11:64** - hexagonal architecture: Architectural pattern mentioned casually without explanation.

7. **ch15:48-50** - Haiku/Sonnet/Opus: Model tiers introduced without explaining these are Claude model names. This is the chapter on model strategy, so proper introduction is essential.

8. **ch15:65** - MTok: Pricing uses "MTok" abbreviation without defining it means "million tokens."

---

## Chapters With Good Term Practices

These chapters demonstrate proper term introduction and can serve as models:

1. **ch09-context-engineering-deep-dive.md**: Explains information theory concepts (entropy, mutual information, channel capacity) thoroughly as they're introduced.

2. **ch10-the-ralph-loop.md**: Opens with proper LLM introduction: "Large language models (LLMs)..."

3. **ch13-building-the-harness.md**: Properly introduces OTEL, DDD, and MCP with full expansions on first use.

4. **ch14-the-meta-engineer-playbook.md**: Explains the six waves framework and skill atrophy concept thoroughly.

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

### Pattern 4: Model Name Introduction
When discussing Claude model tiers (especially in Chapter 15):
```
Claude offers three model tiers:
- Haiku: Fastest and most cost-effective, ideal for simple tasks
- Sonnet: Balanced performance for standard development work
- Opus: Maximum capability for complex reasoning and architecture
```

### Pattern 5: Abbreviation Introduction
For pricing/technical abbreviations:
```
At Claude Sonnet pricing ($3 per million tokens, or $3/MTok input)...
```

### Pattern 6: Gaming/Cultural References
For references that may be unfamiliar:
```
Think like a Factorio player (the factory-building video game where
automation is key). Don't mine ore by hand...
```

---

## Term Index

For reference, here are all identified terms that need introduction:

**Acronyms:**
- AST (Abstract Syntax Tree) - ch12
- CI/CD (Continuous Integration/Continuous Deployment) - ch01
- CRUD (Create, Read, Update, Delete) - ch01
- DAG (Directed Acyclic Graph) - ch05
- DDD (Domain-Driven Design) - ch01, ch07, ch13
- JSDoc (JavaScript Documentation) - ch02
- JWT (JSON Web Token) - ch02, ch11
- K8s (Kubernetes) - ch14
- LLM (Large Language Model) - ch03, ch04, ch05, ch06, ch10
- MCP (Model Context Protocol) - ch13
- MTok (Million Tokens) - ch15
- OTEL (OpenTelemetry) - ch01, ch13
- RLS (Row-Level Security) - ch04
- tRPC (TypeScript Remote Procedure Call) - ch04

**Tools:**
- Aider (AI pair programming tool) - ch04
- bcrypt (password hashing library) - ch08
- Cursor (AI-powered code editor) - ch04
- Docker (containerization platform) - ch01
- fast-check (property-based testing library) - ch06
- Hypothesis (Python property-based testing) - ch06
- io-ts (TypeScript runtime validation) - ch06
- Kubernetes/K8s (container orchestration) - ch01, ch14
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
- Idempotency - ch01
- Result type (error handling pattern) - ch11
- Slash command (Claude Code feature) - ch12
- Trace spans - ch01
- YOLO mode (skip permissions mode) - ch15

**Model Names:**
- Claude Haiku (fastest tier) - ch15
- Claude Opus (most capable tier) - ch08, ch15
- Claude Sonnet (balanced tier) - ch08, ch15

**Cultural References:**
- Factorio (factory-building game) - ch14

---

## Changes from Previous Review (2026-01-27)

**Added chapters:**
- ch14-the-meta-engineer-playbook.md (2 issues)
- ch15-model-strategy-and-cost-optimization.md (4 issues)

**Total issues increased from 52 to 58**

**New critical issues:**
1. ch15 needs proper introduction of Haiku/Sonnet/Opus model names
2. ch15 needs MTok abbreviation defined
3. ch14 uses K8s without defining it

---

## Status Legend
- Properly introduced in at least one chapter (noted in text)
- No mark = Needs introduction in all occurrences
