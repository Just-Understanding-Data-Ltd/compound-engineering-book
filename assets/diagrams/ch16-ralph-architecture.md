# Chapter 16: RALPH Architecture

## Diagram Description

Visualizes the complete RALPH (Recursive Agent Loop with Progress Handoffs) system architecture as implemented for this book. Shows the orchestrator, executor, and task manager components, along with the circuit breaker, review cycle triggers, and three-tier memory system.

## Primary View: System Architecture

```mermaid
flowchart TB
    subgraph Orchestrator["🎭 Orchestrator (ralph.sh)"]
        direction TB
        CONFIG["Configuration<br/>MAX_HOURS, REVIEW_EVERY<br/>ITERATION_TIMEOUT"]
        LOOP["Main Loop<br/>while tasks pending"]
        CHECK["Check Limits<br/>Time, iterations, circuit"]
    end

    subgraph Executor["⚡ Executor (Claude Code)"]
        direction TB
        SPAWN["Spawn Fresh<br/>claude -p"]
        READ["Read Context<br/>CLAUDE.md, tasks.json"]
        WORK["Complete ONE Task<br/>Highest score, not blocked"]
        COMMIT["Git Commit<br/>Structured message"]
    end

    subgraph TaskManager["📋 Task Manager (tasks.json)"]
        direction TB
        QUEUE["Task Queue<br/>Flat structure"]
        SCORE["Dynamic Scoring<br/>Priority + Type + Age + Blocking"]
        STATS["Stats Tracking<br/>pending, complete, blocked"]
    end

    subgraph SafetyNet["🛡️ Circuit Breaker"]
        CB["3 consecutive<br/>failures = STOP"]
        LAST["lastGoodCommit<br/>Recovery point"]
    end

    CONFIG --> LOOP
    LOOP --> CHECK
    CHECK -->|"Pass"| SPAWN
    CHECK -->|"Fail"| CB
    SPAWN --> READ
    READ --> TaskManager
    TaskManager --> WORK
    WORK --> COMMIT
    COMMIT --> LOOP
    CB --> LAST

    style Orchestrator fill:#e6f3ff
    style Executor fill:#fff3e6
    style TaskManager fill:#e6ffe6
    style SafetyNet fill:#ffe6e6
```

## Alternative View: Iteration Flow

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant C as Claude Code
    participant T as tasks.json
    participant G as Git
    participant R as Review Agents

    loop Every Iteration
        O->>O: Check circuit breaker
        O->>O: Check time limit
        O->>C: Spawn fresh instance
        C->>T: Read task queue
        T-->>C: Highest score task
        C->>C: Complete task
        C->>T: Update status
        C->>G: Commit work
        G-->>O: Verify new commit
        O->>O: Reset failure counter
    end

    alt Every N iterations (adaptive)
        O->>R: Spawn 7 review agents
        R->>T: Create fix tasks
    end

    alt Circuit breaker trips
        O->>G: Record lastGoodCommit
        O->>O: Stop loop
    end
```

## Alternative View: Memory Tier System

```mermaid
flowchart LR
    subgraph Tier1["Tier 1: Conversation"]
        T1["Current iteration context<br/>Tool results, reasoning<br/>Lifetime: Single session"]
    end

    subgraph Tier2["Tier 2: Files"]
        T2A["claude-progress.txt<br/>Recent activity, status"]
        T2B["tasks.json<br/>Queue, scores, stats"]
        T2C["@LEARNINGS.md<br/>Accumulated insights"]
    end

    subgraph Tier3["Tier 3: Git"]
        T3["Commit history<br/>Checkpoint recovery<br/>Lifetime: Permanent"]
    end

    T1 -->|"Compaction"| T2A
    T1 -->|"Task updates"| T2B
    T1 -->|"Every 5 iter"| T2C
    T2A -->|"Compacts at 2000 lines"| T3
    T2B -->|"Each commit"| T3
    T2C -->|"Each commit"| T3

    style Tier1 fill:#ffeeee
    style Tier2 fill:#eeeeff
    style Tier3 fill:#eeffee
```

## Alternative View: Task Scoring Algorithm

| Factor | Values | Purpose |
|--------|--------|---------|
| Priority | critical: 1000, high: 750, medium: 500, normal: 250, low: 100 | Business importance |
| Type | blocker: 200, chapter: 100, fix: 80, diagram: 40 | Work category |
| Chapter Sequence | (20 - chapterNum) * 5 | Earlier = higher |
| Blocking Bonus | +25 per blocked task | Unblock dependencies |
| Age Bonus | +50 at 24h, +100 at 48h | Prevent starvation |

## Alternative View: Adaptive Review Interval

```mermaid
flowchart TB
    START["Review Cycle"]
    COUNT["Count issues<br/>Slop + Tech + Terms"]

    subgraph Adjust["Adaptive Adjustment"]
        BETTER{{"Issues < Previous?"}}
        WORSE{{"Issues > Previous?"}}
        BACKOFF["Interval * 1.3<br/>(max 50)"]
        PRESSURE["Interval * 0.7<br/>(min 5)"]
    end

    PROBE["Probe every 25<br/>regardless of state"]

    START --> COUNT
    COUNT --> BETTER
    BETTER -->|"Yes"| BACKOFF
    BETTER -->|"No"| WORSE
    WORSE -->|"Yes"| PRESSURE
    WORSE -->|"No"| PROBE
    BACKOFF --> PROBE
    PRESSURE --> PROBE

    style BACKOFF fill:#aaffaa
    style PRESSURE fill:#ffaaaa
    style PROBE fill:#aaaaff
```

## Alternative View: Component Summary Table

| Component | File/Script | Responsibility | Key Methods |
|-----------|-------------|----------------|-------------|
| Orchestrator | ralph.sh | Spawn iterations, enforce limits | check_circuit_breaker, should_review |
| Executor | Claude Code | Complete one task per iteration | Read context, update queue, commit |
| Task Manager | tasks.json | Score tasks, track status | calculateScore, sortByScore |
| Memory | claude-progress.txt | Track recent activity | Auto-compact at 2000 lines |
| Learnings | @LEARNINGS.md | Preserve insights | Capture every 5 iterations |
| Safety | Circuit breaker | Prevent runaway loops | 3 failures = stop |

## Usage

**Chapter reference**: Lines 38-185, "The RALPH Loop Architecture" section

**Key passages from chapter**:
> "The RALPH loop has three components: an orchestrator script that spawns iterations, an executor that completes one task per iteration, and a task manager that tracks progress."

> "The circuit breaker prevents runaway failures. After three consecutive iterations without progress (no new commit), the loop stops."

**Where to use this diagram**:
- After line 40, to provide visual overview before code examples
- Primary architecture view shows component relationships
- Iteration flow shows runtime behavior
- Memory tiers explain state persistence

## Related Diagrams

- ch10-ralph-loop.md - Basic RALPH acronym explanation
- ch10-memory-architecture.md - Detailed memory tier design
- ch13-harness-architecture.md - Four-layer harness context
- ch16-review-agents.md - Adversarial review system detail
