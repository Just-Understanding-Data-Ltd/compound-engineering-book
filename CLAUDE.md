# Compound Engineering Book

> A comprehensive guide to AI-assisted software development: from beginner to expert with Claude Code.

## Project Overview

**Goal**: Compile James Phoenix's 90+ context engineering articles into a publishable Leanpub book.

**Target Audience**: Software engineers transitioning to AI-assisted development, from beginners who've never used Claude Code to experts building production agent systems.

**Source Material**: `/Users/jamesaphoenix/Desktop/knowledge-base/01-Compound-Engineering/`

## Structure

```
compound-engineering-book/
├── CLAUDE.md              # This file - agent instructions
├── TASKS.md               # Current task queue for RALPH loop
├── LEARNINGS.md           # Accumulated insights from iterations
├── prds/
│   ├── index.md           # Master PRD with book vision
│   ├── toc.md             # Table of contents
│   ├── ch01.md            # Part I: Foundations (beginner)
│   ├── ch02.md            # Part I: Getting Started with Claude Code
│   ├── ch03.md            # Part I: Your First CLAUDE.md
│   ├── ch04.md            # Part II: Agent Architecture
│   ├── ch05.md            # Part II: The Verification Ladder
│   ├── ch06.md            # Part II: Quality Gates
│   ├── ch07.md            # Part III: Context Engineering
│   ├── ch08.md            # Part III: The RALPH Loop
│   ├── ch09.md            # Part III: Sub-Agent Patterns
│   ├── ch10.md            # Part IV: Production Systems
│   ├── ch11.md            # Part IV: The Meta-Engineer
│   └── ch12.md            # Appendices & Reference
├── chapters/              # Actual book content (Markdown)
├── assets/
│   └── diagrams/          # Mermaid/Excalidraw diagrams
├── scripts/
│   └── ralph.sh           # The RALPH loop runner
└── prompts/
    ├── writer.md          # Chapter writing prompt
    ├── reviewer.md        # Chapter review prompt
    ├── diagram-check.md   # Diagram opportunity checker
    └── leanpub-format.md  # Leanpub formatting guide
```

## Source Knowledge Base

**Symlink**: `@kb` points to `/Users/jamesaphoenix/Desktop/knowledge-base`

Key source directories:
- `@kb/01-Compound-Engineering/context-engineering/` - 90+ articles
- `@kb/01-Compound-Engineering/my-doctrine.md` - Core philosophy
- `@kb/01-Compound-Engineering/infrastructure-principles.md` - Engineering principles

## Writing Conventions

1. **No em dashes** - Use periods or commas instead (em dashes are a tell for AI text)
2. **Practical examples** - Every concept needs runnable code
3. **Progressive complexity** - Start simple, build to advanced
4. **Real production context** - Reference actual ~350K LOC codebase experience
5. **Leanpub format** - Use Markua markdown dialect

## RALPH Loop Protocol

Each iteration should:
1. Read `TASKS.md` for the next incomplete task
2. Read relevant source articles from `@kb/`
3. Complete ONE task (write one section, review one chapter, etc.)
4. Run quality checks (lint, word count, structure)
5. Update `TASKS.md` with completion status
6. Add learnings to `LEARNINGS.md`
7. Exit cleanly for fresh context

## Quality Gates

Before marking a chapter complete:
- [ ] All code examples tested
- [ ] Diagrams created for complex concepts
- [ ] Cross-references to other chapters added
- [ ] Leanpub formatting validated
- [ ] Word count within target (2000-4000 per chapter)

## Diagram Workflow

When a concept would benefit from a diagram:
1. Create Mermaid diagram in `assets/diagrams/`
2. Include in chapter with `![Description](assets/diagrams/name.png)`
3. Log in chapter PRD which diagrams are needed/completed

## Commands

```bash
# Run RALPH loop
./scripts/ralph.sh

# Check word counts
wc -w chapters/*.md

# Validate Leanpub format
# (Use Leanpub's manuscript validator)
```

## Related Projects

- [O'Reilly Book: Prompt Engineering for LLMs](https://www.oreilly.com/library/view/prompt-engineering-for/9781098156145/) - Author's previous work
- [Udemy Course](https://www.udemy.com/course/chatgpt-and-langchain-the-complete-developers-masterclass/) - 304K+ learners

## Agent Instructions

When working on this book:
1. Always check `TASKS.md` first
2. Read source articles before writing
3. Maintain consistent voice and style
4. Add practical Claude Code examples throughout
5. Target developers who want to 10x their productivity
6. Include "Try it yourself" exercises
7. Reference the knowledge base but write fresh content
