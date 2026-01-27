# Exercises

> Hands-on "Try It Yourself" exercises for each chapter.

## Structure

```
exercises/
├── ch01/                  # Chapter 1 exercises
│   ├── README.md          # Chapter overview
│   ├── 01-exercise.md     # Exercise files
│   └── solutions/         # Solution files
├── ch02/
└── ...
```

## Conventions

### Difficulty Levels

Each chapter contains 2-3 exercises with progressive difficulty:

| Level | Time | Description |
|-------|------|-------------|
| Easy | 10-15 min | Apply one concept directly |
| Medium | 15-25 min | Combine 2-3 concepts |
| Hard | 25-30 min | Real-world scenario with edge cases |

### Exercise Format

Every exercise file follows this structure:

1. **Objective** - What you'll learn (1-2 sentences)
2. **Prerequisites** - Required knowledge and setup
3. **Scenario** - Real-world context
4. **Tasks** - Numbered, actionable steps
5. **Hints** - Collapsible guidance
6. **Success Criteria** - Checkboxes for self-assessment
7. **Stretch Goals** - Optional advanced extensions

### Solutions

- Solutions live in `solutions/` subfolder
- Named to match exercise: `01-solution.md` for `01-exercise.md`
- Include explanation of approach, not just code
- Show common mistakes and how to avoid them

## Validation

All exercises with code must pass validation:

```bash
bun infra/scripts/exercise-validator.ts validate exercises/ch01/01-exercise.md
```

## Creating New Exercises

1. Read the chapter thoroughly
2. Identify 2-3 concepts that need hands-on practice
3. Design progressive difficulty (easy → medium → hard)
4. Write clear, testable success criteria
5. Create solutions demonstrating best practices
6. Validate all code blocks
