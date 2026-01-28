# Chapter 3: Prompting Fundamentals

> Master the art of communicating with LLMs through effective prompting techniques.

---

## Overview

Before you can write effective CLAUDE.md files or build production agents, you need to understand how to communicate with LLMs. This chapter covers the foundational prompting techniques that make AI-assisted development effective: chain-of-thought reasoning, constraint-based prompting, few-shot examples, and the critical skill of asking the right questions upfront.

---

## Learning Objectives

By the end of this chapter, you will be able to:

1. Structure prompts that guide LLMs to produce better code
2. Use chain-of-thought prompting for complex multi-step tasks
3. Apply constraint-based prompting to narrow the solution space
4. Create effective few-shot examples from your project's codebase
5. Ask upfront questions that dramatically reduce iteration cycles

---

## Source Articles

### Primary Sources (Core Chapter Content)
| KB Article | Chapter Section | Content Coverage |
|------------|-----------------|------------------|
| `chain-of-thought-prompting.md` | 3.2 Chain-of-Thought Prompting | Step-by-step reasoning, 5 prompt patterns, when to use vs skip, 60-80% fewer bugs |
| `constraint-based-prompting.md` | 3.3 Constraint-Based Prompting | Declarative over imperative, MUST statements, verification strategies, 50-70% shorter prompts |
| `few-shot-prompting-project-examples.md` | 3.4 Few-Shot Prompting | 2-3 examples optimal, selection criteria, storage in CLAUDE.md, 40%->85% accuracy |
| `upfront-questioning-narrows-search-space.md` | 3.5 Upfront Questioning | Clarification checkpoint pattern, UI search space vs backend, exponential cost savings |
| `negative-examples-documentation.md` | 3.6 Anti-Patterns | DON'T/DO patterns, contrastive learning, 20% first-try improvement |

### Supplementary Sources (Advanced Techniques)
| KB Article | Potential Addition | Notes |
|------------|-------------------|-------|
| `layered-prompts-architecture.md` | Advanced: 4-layer prompt structure | Core/Domain/Application/Task layers, A/B testing, prompt caching integration |
| `test-driven-prompting.md` | Advanced: Tests as executable specs | 600x success improvement, entropy reduction formula, property-based testing |
| `multi-step-prompt-workflows.md` | Advanced: Breaking complex tasks | Verification gates, cognitive load reduction, error isolation |
| `semantic-naming-patterns.md` | Related: Naming for retrieval | 60-80% retrieval improvement, supports few-shot pattern discovery |

### Sources for Future Expansion
- `entropy-in-code-generation.md` - Mathematical foundation for constraint-based prompting
- `prompt-caching-strategy.md` - Cost optimization when using layered prompts
- `actor-critic-adversarial-coding.md` - Combines with chain-of-thought for review cycles

---

## Detailed Outline

### 3.1 The Anatomy of an Effective Prompt
- Why prompting is different from searching
- The three parts: context, instruction, constraints
- How LLMs process your prompts
- The difference between vague and specific instructions

### 3.2 Chain-of-Thought Prompting
- What is chain-of-thought (CoT)?
- When to use CoT vs direct prompting
- Step-by-step reasoning for debugging
- CoT for architecture decisions
- **Exercise**: Debug a complex error using CoT

### 3.3 Constraint-Based Prompting
- Constraints as guardrails, not limitations
- Types of constraints: format, style, scope, language
- How constraints reduce entropy in outputs
- The "impossible states" principle for prompts
- **Example**: Constraining code style to match your project

### 3.4 Few-Shot Prompting with Project Examples
- What are few-shot examples?
- Mining your codebase for examples
- Good examples vs bad examples
- How many examples are enough?
- **Exercise**: Create a few-shot prompt for a new API endpoint

### 3.5 Upfront Questioning
- Why upfront questions save time
- The "explore vs implement" decision
- Questions that narrow the search space
- Avoiding premature implementation
- **Pattern**: The clarification checkpoint

### 3.6 Anti-Patterns: What NOT to Do
- Vague prompts ("make it better")
- Over-constrained prompts
- Missing context
- Prompt injection vulnerabilities
- The "just do it" trap

---

## Key Examples

### Example 1: Chain-of-Thought Debug Session
```typescript
// Prompt demonstrating CoT for debugging
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929'
})

const debugPrompt = `
I'm seeing this error in production:
TypeError: Cannot read property 'email' of undefined at getUserProfile

Let's debug this step by step:
1. First, identify where 'email' is accessed
2. Then, trace back what could be undefined
3. Check if there's a null check missing
4. Propose a fix with proper error handling

Walk me through your reasoning.
`

await session.send(debugPrompt)
```

### Example 2: Constraint-Based Code Generation
```typescript
// Prompt with explicit constraints
const constrainedPrompt = `
Create a user validation function with these constraints:
- Use Zod for schema validation
- Return Result<ValidUser, ValidationError> (never throw)
- Follow the existing pattern in src/validators/
- Include JSDoc with @example
- Handle null/undefined inputs explicitly
- Maximum 30 lines of code

Existing pattern to follow:
${fewShotExample}
`
```

### Example 3: Few-Shot API Endpoint
```typescript
// Using project examples as few-shot prompts
const fewShotPrompt = `
Here are two existing API endpoints in our codebase:

Example 1 (GET endpoint):
${readFile('src/api/users/get-user.ts')}

Example 2 (POST endpoint):
${readFile('src/api/users/create-user.ts')}

Now create a new endpoint: PUT /api/users/:id/profile
Follow the exact same patterns you see above.
`
```

### Example 4: Upfront Questioning Pattern
```typescript
// The clarification checkpoint pattern
const clarifyFirst = `
Before implementing, I need to understand:

1. What database are we using? (Postgres/MySQL/MongoDB)
2. Should this be a REST or GraphQL endpoint?
3. What authentication is required?
4. Are there existing patterns I should follow?
5. What error cases need handling?

Please answer these so I can implement correctly the first time.
`
```

---

## Diagrams Needed

1. **Prompt Anatomy Diagram**
   - Visual showing context → instruction → constraints flow
   - How each part affects LLM output

2. **Chain-of-Thought Flow**
   - Flowchart showing step-by-step reasoning
   - Compare to direct prompting (single step)

3. **Constraint Funnel**
   - How constraints narrow the solution space
   - Visualization of entropy reduction

4. **Few-Shot Example Selection**
   - Decision tree for choosing good examples
   - What makes an example effective

---

## Exercises

### Exercise 1: Build a Prompting Toolkit
Create a personal prompting toolkit with:
- [ ] 3 chain-of-thought templates for common tasks
- [ ] A constraint checklist for code generation
- [ ] 5 few-shot examples from your codebase
- [ ] A list of upfront questions for new features

### Exercise 2: Prompt Comparison Experiment
Take the same task and try it with:
1. A vague prompt ("add user authentication")
2. A constrained prompt (with specific requirements)
3. A few-shot prompt (with examples)

Compare the results and document what worked best.

### Exercise 3: The Clarification Challenge
Practice upfront questioning by:
1. Take a feature request from your backlog
2. Write 5-7 clarifying questions
3. Ask Claude to answer them based on your codebase
4. Only then implement the feature

---

## Cross-References

- **Builds on**: Chapter 2 (Getting Started with Claude Code)
- **Leads to**: Chapter 4 (Writing Your First CLAUDE.md) - prompting skills become CLAUDE.md sections
- **Related**: Chapter 9 (Context Engineering) - prompting is context engineering at the micro level

---

## Word Count Target

2,500 - 3,500 words

---

## Status

**Status**: Complete

**Milestones**:
- [x] PRD complete (2026-01-27)
- [x] First draft (2026-01-27)
- [x] Code examples written (2026-01-28)
- [x] Code examples tested (2026-01-28)
- [x] Reviewed (2026-01-28)
- [x] Diagrams complete (2026-01-28)
- [x] Exercises validated (2026-01-28)
- [x] Final (2026-01-28)

**Chapter Stats**:
- Word count: ~3,200 words
- Code examples: 4 (debug CoT, constrained prompt, few-shot API, clarification pattern)
- Diagrams: 4 (prompt anatomy, CoT flow, constraint funnel, few-shot selection)
- Exercises: 3

---

## KB Article Mapping Summary (Jan 28, 2026)

**Source scan performed**: `/Users/jamesaphoenix/Desktop/knowledge-base/01-Compound-Engineering/`

**Relevant articles found**: 9 total
- 5 primary sources used in chapter content
- 4 supplementary sources available for future expansion

**Coverage assessment**: Chapter comprehensively covers core prompting techniques. Advanced topics (layered prompts, test-driven prompting, multi-step workflows) could be added in future editions or as advanced appendix content.
