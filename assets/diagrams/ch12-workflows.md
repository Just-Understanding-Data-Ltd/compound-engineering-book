# Chapter 12: Development Workflows

## Diagram Description
Key development workflow patterns for AI-assisted development.

## Mermaid Code

```mermaid
flowchart TB
    subgraph PlanMode["📋 Plan Mode Workflow"]
        P1["User: /plan"]
        P2["AI: Explore codebase"]
        P3["AI: Create plan.md"]
        P4["User: Review & approve"]
        P5["AI: Implement"]

        P1 --> P2 --> P3 --> P4
        P4 -->|"Approved"| P5
        P4 -->|"Revise"| P3
    end
```

## Git Worktrees Pattern

```mermaid
flowchart LR
    subgraph Main["📁 Main Repo"]
        M["./project"]
    end

    subgraph Worktrees["🌳 Worktrees"]
        W1["../project-frontend\n(feature/dashboard)"]
        W2["../project-backend\n(feature/api-v2)"]
        W3["../project-tests\n(feature/e2e)"]
    end

    subgraph Agents["🤖 Parallel Agents"]
        A1["Agent 1\n(Frontend)"]
        A2["Agent 2\n(Backend)"]
        A3["Agent 3\n(Tests)"]
    end

    Main --> W1
    Main --> W2
    Main --> W3

    W1 --> A1
    W2 --> A2
    W3 --> A3

    A1 -->|"Merge"| Main
    A2 -->|"Merge"| Main
    A3 -->|"Merge"| Main
```

## Incremental Development Cycle

```mermaid
flowchart TB
    subgraph Cycle["🔄 Incremental Cycle"]
        C1["1. Plan step"]
        C2["2. Implement"]
        C3["3. Verify (tests)"]
        C4["4. Commit"]
        C5["5. Next step?"]

        C1 --> C2 --> C3
        C3 -->|"Pass"| C4 --> C5
        C3 -->|"Fail"| C2
        C5 -->|"Yes"| C1
        C5 -->|"No"| D["Done"]
    end
```
