# Diagram: State Space Reduction Through Quality Gates

## Description
Visualizes how quality gates progressively filter the state space of valid programs through set intersection. Each gate eliminates invalid implementations, narrowing from millions of possible programs to a small set of semantically equivalent correct implementations.

## Primary View: Nested Set Reduction

```mermaid
flowchart TB
    subgraph S0["S₀: All Syntactically Valid Programs"]
        subgraph S1["S₁: After Type Checker (50,000)"]
            subgraph S2["S₂: After Linter (5,000)"]
                subgraph S3["S₃: After Tests (200)"]
                    CORRECT["Correct\nImplementations"]
                end
            end
        end
    end

    S0 -->|"1,000,000 programs"| S0
    S1 -->|"95% eliminated"| S1
    S2 -->|"99.5% eliminated"| S2
    S3 -->|"99.98% eliminated"| S3

    style S0 fill:#ffcccc,stroke:#ff6666
    style S1 fill:#ffe6cc,stroke:#ff9933
    style S2 fill:#ffffcc,stroke:#ffcc00
    style S3 fill:#ccffcc,stroke:#66cc66
    style CORRECT fill:#99ff99,stroke:#33cc33
```

## Alternative View 1: Sequential Filter Pipeline

```mermaid
flowchart LR
    S0["S₀\n1,000,000\nprograms"] --> G1["Type\nChecker"]
    G1 --> S1["S₁\n50,000\nprograms"]
    S1 --> G2["Linter"]
    G2 --> S2["S₂\n5,000\nprograms"]
    S2 --> G3["Tests"]
    G3 --> S3["S₃\n200\nprograms"]

    G1 -.->|"95% filtered"| FILTER1["950,000\neliminated"]
    G2 -.->|"90% filtered"| FILTER2["45,000\neliminated"]
    G3 -.->|"96% filtered"| FILTER3["4,800\neliminated"]

    style S0 fill:#ff6b6b
    style S1 fill:#ffa06b
    style S2 fill:#ffd06b
    style S3 fill:#6bff9f
    style G1 fill:#e6e6fa
    style G2 fill:#e6e6fa
    style G3 fill:#e6e6fa
    style FILTER1 fill:#ffcccc,stroke-dasharray: 5 5
    style FILTER2 fill:#ffcccc,stroke-dasharray: 5 5
    style FILTER3 fill:#ffcccc,stroke-dasharray: 5 5
```

## Alternative View 2: Set Intersection Formula

```
Mathematical Model:

S₀ = All syntactically valid TypeScript programs
G₁ = Programs passing type checker
G₂ = Programs passing linter
G₃ = Programs passing tests

Sequential intersection:
S₁ = S₀ ∩ G₁   (type-safe programs)
S₂ = S₁ ∩ G₂   (type-safe AND lint-clean)
S₃ = S₂ ∩ G₃   (lint-clean AND passing tests)

Key property - monotonic reduction:
|S₀| > |S₁| > |S₂| > |S₃| > ... > |Sₙ|

Each gate ONLY removes invalid states, never adds new ones.
```

## Alternative View 3: Authentication Function Example

| Gate | Set Size | Eliminated | Cumulative | What Gets Filtered |
|------|----------|------------|------------|-------------------|
| S₀ (baseline) | 1,000,000 | - | 0% | All valid TypeScript functions |
| S₁ (types) | 50,000 | 950,000 | 95.0% | Wrong return types, wrong params, non-async |
| S₂ (linter) | 5,000 | 45,000 | 99.5% | Console.logs, vague errors, complex control flow |
| S₃ (tests) | 200 | 4,800 | 99.98% | Wrong business logic, missing edge cases |

**Final 200 implementations**: Semantically equivalent, all correct. Differ only in minor style choices.

## Alternative View 4: What Each Gate Filters

```mermaid
mindmap
    root((State Space Reduction))
        Type Checker
            Wrong return types
            Wrong parameter types
            Non-async where async needed
            Missing interface fields
            Type mismatches
        Linter
            Console.log statements
            Implicit any usage
            Missing error messages
            Complex cyclomatic complexity
            Floating promises
        Tests
            Wrong business logic
            Missing edge cases
            Improper error handling
            Race conditions
            Invalid state transitions
```

## Usage Notes

**Where this appears in chapter**: Section "Gates as Information Filters" (lines 9-132)

**Key teaching point**: Quality gates are not pass/fail checkpoints. They are mathematical information filters that reduce the universe of possible programs through set intersection.

**Related concepts**:
- Information theory foundation
- Why gates compound (each works on reduced set)
- LLM probability distributions

## Context from Chapter

From ch07-quality-gates-that-compound.md lines 13-14:
> "Each quality gate performs a set intersection, eliminating invalid states and narrowing the space until only correct implementations remain."

From ch07-quality-gates-that-compound.md lines 32-38:
> "The key property is monotonic reduction. Each intersection reduces the size of the set... Each gate eliminates invalid states without adding new ones."
