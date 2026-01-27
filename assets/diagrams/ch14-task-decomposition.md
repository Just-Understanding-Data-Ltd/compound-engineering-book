# Chapter 14: Task Decomposition Comparison

## Diagram Description

Visualizes the difference between monolithic tasks (which cause agents to fail) and properly decomposed tasks (which agents complete successfully). Shows the contrast between a 15-step block that overwhelms agents versus 8 smaller tasks with clear boundaries. Key insight: Oversizing is the primary cause of agent failure.

## Primary View: Before/After Comparison

```mermaid
flowchart TB
    subgraph BEFORE["BEFORE: Monolithic Task"]
        direction TB
        MONO["Refactor entire API from Express to Fastify,<br/>migrate all routes, update tests,<br/>deploy to staging, run smoke tests,<br/>and monitor for 30 minutes"]

        subgraph FAIL["Agent Failure Modes"]
            F1["Loses context mid-task"]
            F2["Spins on cascading errors"]
            F3["Produces garbage output"]
            F4["15+ steps, no checkpoints"]
        end

        MONO --> FAIL
    end

    subgraph AFTER["AFTER: Decomposed Tasks"]
        direction TB
        T1["Task 1: Set up Fastify structure"]
        T2["Task 2: Migrate /auth/* (5 routes)"]
        T3["Task 3: Run tests, fix failures"]
        T4["Task 4: Migrate /api/* (8 routes)"]
        T5["Task 5: Migrate /admin/* (3 routes)"]
        T6["Task 6: Run full test suite"]
        T7["Task 7: Deploy + smoke tests"]
        T8["Task 8: Monitor 30 min"]

        T1 --> T2 --> T3 --> T4 --> T5 --> T6 --> T7 --> T8
    end

    subgraph RESULT["Outcomes"]
        FAIL_OUT["Agent fails at step 6,<br/>loses work, starts over"]
        WIN_OUT["Agent completes each task,<br/>commits progress,<br/>recovers from any failure"]
    end

    FAIL --> FAIL_OUT
    T8 --> WIN_OUT

    style BEFORE fill:#ffcccc
    style AFTER fill:#ccffcc
    style FAIL fill:#ff6666
    style RESULT fill:#f0f0f0
    style FAIL_OUT fill:#ff9999
    style WIN_OUT fill:#99ff99
```

## Alternative View: Task Sizing Guidelines

```mermaid
flowchart LR
    subgraph Size["Task Size Spectrum"]
        direction TB
        TOO_SMALL["Too Small<br/>1-2 steps<br/>❌ Overhead wasteful"]
        IDEAL["Ideal Range<br/>3-20 steps<br/>✅ Agent succeeds"]
        TOO_BIG["Too Large<br/>21+ steps<br/>❌ Agent fails"]
    end

    subgraph Examples["Examples"]
        direction TB
        E_SMALL["'Fix typo in line 42'"]
        E_IDEAL["'Migrate /auth/* routes<br/>to new framework<br/>(5 routes)'"]
        E_BIG["'Refactor entire codebase<br/>and deploy'"]
    end

    TOO_SMALL --> E_SMALL
    IDEAL --> E_IDEAL
    TOO_BIG --> E_BIG

    style TOO_SMALL fill:#ffeeaa
    style IDEAL fill:#66ff66
    style TOO_BIG fill:#ffcccc
```

## Alternative View: Decomposition Decision Tree

```mermaid
flowchart TB
    START["New task received"]

    Q1{"How many<br/>logical steps?"}
    Q2{"Has clear<br/>checkpoint?"}
    Q3{"Can verify<br/>completion?"}

    ACTION_SPLIT["SPLIT into<br/>smaller tasks"]
    ACTION_COMBINE["Consider COMBINING<br/>with next task"]
    ACTION_READY["READY for<br/>agent execution"]

    START --> Q1

    Q1 -->|"21+ steps"| ACTION_SPLIT
    Q1 -->|"3-20 steps"| Q2
    Q1 -->|"1-2 steps"| ACTION_COMBINE

    Q2 -->|"No checkpoint"| ACTION_SPLIT
    Q2 -->|"Has checkpoint"| Q3

    Q3 -->|"Can't verify"| ACTION_SPLIT
    Q3 -->|"Can verify"| ACTION_READY

    ACTION_SPLIT -->|"Re-evaluate"| START
    ACTION_COMBINE -->|"Re-evaluate"| START

    style ACTION_READY fill:#66ff66
    style ACTION_SPLIT fill:#ffeeaa
    style ACTION_COMBINE fill:#ffeeaa
```

## Alternative View: Failure Mode Analysis

| Aspect | Monolithic Task | Decomposed Tasks |
|--------|-----------------|------------------|
| **Steps** | 15+ steps in one block | 3-8 steps per task |
| **Checkpoints** | None (all or nothing) | Commit after each task |
| **Context Loss** | Happens around step 6-8 | Reset with fresh context |
| **Error Recovery** | Start over from beginning | Retry failed task only |
| **Progress Visibility** | Unknown until complete | Clear progress (3/8, 5/8, etc.) |
| **Time to First Value** | Hours or never | Minutes per task |
| **Agent Success Rate** | ~30% (often fails) | ~95% (usually succeeds) |

## Alternative View: The 8-Task Migration Example

```mermaid
flowchart TB
    subgraph TASKS["Decomposed Migration"]
        direction TB

        T1["Task 1<br/>━━━━━━━━━━━━<br/>Fastify setup<br/>~5 steps"]
        T2["Task 2<br/>━━━━━━━━━━━━<br/>/auth/* routes<br/>~8 steps"]
        T3["Task 3<br/>━━━━━━━━━━━━<br/>Test + fix<br/>~6 steps"]
        T4["Task 4<br/>━━━━━━━━━━━━<br/>/api/* routes<br/>~10 steps"]
        T5["Task 5<br/>━━━━━━━━━━━━<br/>/admin/* routes<br/>~5 steps"]
        T6["Task 6<br/>━━━━━━━━━━━━<br/>Full test suite<br/>~4 steps"]
        T7["Task 7<br/>━━━━━━━━━━━━<br/>Deploy + smoke<br/>~6 steps"]
        T8["Task 8<br/>━━━━━━━━━━━━<br/>Monitor 30min<br/>~3 steps"]
    end

    subgraph COMMITS["Checkpoints"]
        C1["commit"]
        C2["commit"]
        C3["commit"]
        C4["commit"]
        C5["commit"]
        C6["commit"]
        C7["commit"]
        C8["done"]
    end

    T1 --> C1 --> T2 --> C2 --> T3 --> C3 --> T4 --> C4
    T5 --> C5 --> T6 --> C6 --> T7 --> C7 --> T8 --> C8

    style TASKS fill:#e8f5e9
    style COMMITS fill:#bbdefb
```

## Alternative View: Why Oversizing Causes Failure

```mermaid
flowchart TB
    subgraph CAUSE["Root Cause: Oversizing"]
        BIG["Task too large<br/>(15+ steps)"]
    end

    subgraph CASCADE["Failure Cascade"]
        direction TB
        F1["Context window fills up"]
        F2["Earlier decisions forgotten"]
        F3["Inconsistent choices made"]
        F4["Errors compound on errors"]
        F5["Agent produces garbage"]
    end

    subgraph FIX["The Fix"]
        DECOMPOSE["Task decomposition<br/>3-20 steps per task<br/>Clear boundaries<br/>Commit after each"]
    end

    BIG --> F1 --> F2 --> F3 --> F4 --> F5
    F5 -.->|"Solution"| DECOMPOSE

    style CAUSE fill:#ffcccc
    style CASCADE fill:#ffeeaa
    style FIX fill:#ccffcc
```

## Alternative View: Task Designer Mindset

| Old Mindset | New Mindset |
|-------------|-------------|
| "I'll code this myself" | "How do I break this into agent tasks?" |
| "One big PR when done" | "One commit per completed task" |
| "Fix errors as I go" | "Run tests, commit, then next task" |
| "All routes in one session" | "Group routes by domain (5-10 per task)" |
| "Deploy when everything works" | "Staging deploy is its own task" |
| "Monitor while coding" | "Monitoring is a separate task" |

**Key Principle**: Think like a task designer, not a code writer.

## Usage

This diagram appears in Chapter 14: The Meta-Engineer Playbook, section "Task Sizing for Agents" (lines 333-356). It illustrates the critical insight that oversizing is the primary cause of agent failure, and demonstrates how proper task decomposition with 3-20 steps and clear boundaries enables agents to succeed.

## Context from Chapter

> "Agents fail spectacularly when tasks are too large. They lose context, spin on errors, and produce garbage. Right-sized tasks have 3-20 steps with clear boundaries."

> "Oversizing is the primary cause of agent failure. Think like a task designer, not a code writer."
