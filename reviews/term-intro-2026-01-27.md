# Term Introduction Check - 2026-01-27

## Summary
- Files scanned: 7
- Issues found: 38

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

## Critical Issues (High Priority)

These issues appear in early chapters and affect reader comprehension:

1. **ch01:73** - CRUD: Used in a comparison table without definition. Readers new to programming may not know this acronym.

2. **ch01:86-89** - DDD, OTEL, Terraform, Docker, Kubernetes: Multiple undefined terms in the "skill stack" section. This is a key conceptual section that needs clarity.

3. **ch03:3** - LLM: First chapter to use this acronym extensively. Should define it at the start since this is a foundational concept for the book.

4. **ch04:3** - Temporal: Opening sentence mentions this tool without explanation, potentially confusing readers.

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
Given the number of technical terms, consider adding an appendix glossary that chapters can reference.

## Term Index

For reference, here are all identified terms that need introduction:

**Acronyms:**
- API (Application Programming Interface) - Commonly known, low priority
- CI/CD (Continuous Integration/Continuous Deployment)
- CRUD (Create, Read, Update, Delete)
- DAG (Directed Acyclic Graph)
- DDD (Domain-Driven Design)
- JSDoc (JavaScript Documentation)
- JWT (JSON Web Token)
- LLM (Large Language Model)
- OTEL (OpenTelemetry)
- RLS (Row-Level Security)
- tRPC (TypeScript Remote Procedure Call)

**Tools:**
- Aider (AI pair programming tool)
- Cursor (AI-powered code editor)
- Docker (containerization platform)
- fast-check (property-based testing library)
- Hypothesis (Python property-based testing)
- io-ts (TypeScript runtime validation)
- Kubernetes/K8s (container orchestration)
- Stripe (payment processing)
- Supabase (backend-as-a-service)
- Temporal (workflow orchestration)
- Terraform (infrastructure as code)
- TLA+ (formal specification language)
- Z3 (theorem prover)
- Zod (TypeScript schema validation)

**Jargon:**
- Aggregate roots
- Bounded contexts
- Idempotency
- Trace spans
