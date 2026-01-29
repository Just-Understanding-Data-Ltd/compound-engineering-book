# Chapter 16: Review Agent Parallel Execution

## Diagram Description

Visualizes the adversarial review system with 7 specialized agents running in parallel during review cycles. Each agent focuses on a narrow quality dimension, producing findings that feed back into the task queue as actionable fix tasks. The parallel execution pattern avoids API concurrency issues by using separate Claude invocations.

## Primary View: Parallel Agent Execution

```mermaid
flowchart TB
    subgraph Trigger["Review Cycle Trigger"]
        ITER["Iteration N<br/>where N % review_interval == 0"]
    end

    subgraph Orchestrator["Orchestrator (ralph.sh)"]
        SPAWN["Spawn 7 Agents<br/>Separate Claude invocations"]
    end

    subgraph Agents["7 Adversarial Review Agents"]
        direction LR
        A1["slop-checker<br/>AI text tells"]
        A2["tech-accuracy<br/>Code correctness"]
        A3["term-intro<br/>Undefined acronyms"]
        A4["diagram-reviewer<br/>Missing visuals"]
        A5["oreilly-style<br/>Publishing rules"]
        A6["cross-ref<br/>Broken links"]
        A7["progress-summarizer<br/>Status synthesis"]
    end

    subgraph Output["Findings"]
        F1["slop-check.md"]
        F2["tech-accuracy.md"]
        F3["term-intro.md"]
        F4["diagram-gaps.md"]
        F5["style-issues.md"]
        F6["broken-links.md"]
        F7["progress-summary.md"]
    end

    subgraph Queue["Task Queue (tasks.json)"]
        TASKS["New fix tasks<br/>created from findings"]
    end

    ITER --> SPAWN
    SPAWN --> A1 & A2 & A3 & A4 & A5 & A6 & A7
    A1 --> F1
    A2 --> F2
    A3 --> F3
    A4 --> F4
    A5 --> F5
    A6 --> F6
    A7 --> F7
    F1 & F2 & F3 & F4 & F5 & F6 & F7 --> TASKS

    style Trigger fill:#e6f3ff
    style Orchestrator fill:#fff3e6
    style Agents fill:#ffe6e6
    style Output fill:#e6ffe6
    style Queue fill:#eeeeff
```

## Alternative View: Agent Specialization Grid

| Agent | Model | Focus Area | Detection Pattern | Output Format |
|-------|-------|------------|-------------------|---------------|
| slop-checker | haiku | AI text tells | "delve", "crucial", em dashes | Markdown list with line refs |
| tech-accuracy | haiku | Code correctness | Syntax errors, wrong tool names | Error list with fixes |
| term-intro-checker | haiku | Undefined terms | All-caps 3+ chars without definition | Acronym list with suggested defs |
| diagram-reviewer | haiku | Missing visuals | Processes with 3+ steps | Opportunity list with Mermaid drafts |
| oreilly-style | haiku | Publishing rules | Heading case, terminology | Style violations with corrections |
| cross-ref-validator | haiku | Broken links | Markdown links to missing files | Broken link list with targets |
| progress-summarizer | haiku | Status synthesis | Metrics, completion rates | Summary report with recommendations |

## Alternative View: Agent Execution Sequence

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant A1 as slop-checker
    participant A2 as tech-accuracy
    participant A3 as term-intro
    participant A4 as diagram-rev
    participant A5 as oreilly-style
    participant A6 as cross-ref
    participant A7 as progress
    participant R as reviews/
    participant Q as tasks.json

    Note over O: Review cycle triggered

    par Parallel Execution
        O->>A1: Spawn (claude -p)
        O->>A2: Spawn (claude -p)
        O->>A3: Spawn (claude -p)
        O->>A4: Spawn (claude -p)
        O->>A5: Spawn (claude -p)
        O->>A6: Spawn (claude -p)
        O->>A7: Spawn (claude -p)
    end

    A1->>R: slop-check-{date}.md
    A2->>R: tech-accuracy-{date}.md
    A3->>R: term-intro-{date}.md
    A4->>R: diagram-gaps-{date}.md
    A5->>R: style-issues-{date}.md
    A6->>R: broken-links-{date}.md
    A7->>R: progress-summary-{date}.md

    Note over O: Parse all review files

    O->>Q: Create fix tasks from findings
    Note over Q: Tasks scored and queued
```

## Alternative View: Finding to Task Pipeline

```mermaid
flowchart LR
    subgraph Finding["Review Finding"]
        F["Issue detected<br/>File: ch05.md<br/>Line: 142<br/>Type: em dash"]
    end

    subgraph Parse["Parse Finding"]
        P["Extract:<br/>- File path<br/>- Line number<br/>- Issue type<br/>- Suggested fix"]
    end

    subgraph Task["Generated Task"]
        T["id: task-XXX<br/>type: fix<br/>title: Fix em dash in ch05<br/>priority: medium<br/>file: ch05.md<br/>line: 142"]
    end

    subgraph Queue["Task Queue"]
        Q["Sorted by score<br/>Awaiting execution"]
    end

    Finding --> Parse --> Task --> Queue

    style Finding fill:#ffe6e6
    style Parse fill:#fff3e6
    style Task fill:#e6ffe6
    style Queue fill:#e6f3ff
```

## Alternative View: Agent Error Handling

```mermaid
flowchart TB
    START["Agent spawned"]
    RUN["Execute review"]

    SUCCESS{{"Success?"}}

    OK["Write findings<br/>to reviews/"]
    FAIL["Log error<br/>Continue other agents"]

    NEXT["Other agents<br/>unaffected"]
    MERGE["Merge all findings<br/>Create tasks"]

    START --> RUN
    RUN --> SUCCESS
    SUCCESS -->|"Yes"| OK
    SUCCESS -->|"No"| FAIL
    OK --> MERGE
    FAIL --> NEXT
    NEXT --> MERGE

    style OK fill:#aaffaa
    style FAIL fill:#ffaaaa
    style MERGE fill:#aaaaff
```

## Alternative View: Issue Severity Classification

| Severity | Source Agents | Action | Example |
|----------|---------------|--------|---------|
| Critical | slop-checker, tech-accuracy | Fix before commit | Syntax error in code block |
| High | term-intro-checker, cross-ref | Fix in next iteration | Undefined acronym on first use |
| Medium | diagram-reviewer, oreilly-style | Queue for later | Missing diagram opportunity |
| Low | progress-summarizer | Informational | Velocity tracking note |

## Alternative View: Review Cycle Integration

```mermaid
flowchart TB
    subgraph MainLoop["RALPH Main Loop"]
        I1["Iteration 1"]
        I2["Iteration 2"]
        I3["..."]
        IN["Iteration N"]
    end

    subgraph ReviewCycle["Review Cycle (Every N)"]
        R["Spawn 7 agents"]
        F["Collect findings"]
        T["Generate tasks"]
    end

    subgraph TaskQueue["Updated Queue"]
        Q["Existing tasks<br/>+ New fix tasks"]
    end

    IN -->|"N % interval == 0"| R
    R --> F
    F --> T
    T --> Q
    Q --> I1

    style MainLoop fill:#e6f3ff
    style ReviewCycle fill:#ffe6e6
    style TaskQueue fill:#e6ffe6
```

## Usage

**Chapter reference**: Lines 299-373, "Adversarial Review Agents" section

**Key passages from chapter**:
> "The agent that writes content cannot objectively review it. Adversarial review agents solve this problem by specializing in different error categories."

> "Each agent runs as a separate Claude invocation. This avoids EPIPE errors from large outputs and allows independent failure handling. If one agent fails, the others continue."

> "Review findings become tasks. When slop-checker finds em dashes, a task appears in the queue."

**Where to use this diagram**:
- After line 314, to visualize the seven agent system
- Primary view shows parallel execution and data flow
- Specialization grid provides quick reference for each agent
- Sequence diagram shows runtime behavior

## Related Diagrams

- ch16-ralph-architecture.md - Overall RALPH loop context
- ch10-memory-architecture.md - How findings persist in memory
- ch13-harness-architecture.md - Where review agents fit in harness layers
- ch08-circuit-breaker.md - Error handling patterns used by agents
