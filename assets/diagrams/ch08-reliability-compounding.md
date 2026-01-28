# Chapter 8: Agent Reliability Compounding

## Diagram Description
Visualizes how 95% per-action reliability degrades exponentially in multi-step agent workflows. Shows why demo agents fail in production: 10 actions at 95% reliability yields only 60% overall success.

## Primary View: Reliability Degradation Flow

```mermaid
flowchart LR
    subgraph Input["Per-Action Reliability"]
        A["95% per action"]
    end

    subgraph Compound["Compounding Effect"]
        direction TB
        S5["5 actions\n0.95^5"]
        S10["10 actions\n0.95^10"]
        S20["20 actions\n0.95^20"]
        S30["30 actions\n0.95^30"]
    end

    subgraph Output["Overall Success Rate"]
        R5["77%"]
        R10["60%"]
        R20["36%"]
        R30["21%"]
    end

    A --> S5 --> R5
    A --> S10 --> R10
    A --> S20 --> R20
    A --> S30 --> R30

    style R5 fill:#4ade80
    style R10 fill:#facc15
    style R20 fill:#fb923c
    style R30 fill:#ef4444
```

## Alternative View: Visual Decay Chart

```mermaid
xychart-beta
    title "Reliability Decay at 95% Per-Action Success"
    x-axis "Number of Actions" [5, 10, 15, 20, 25, 30]
    y-axis "Overall Success Rate (%)" 0 --> 100
    bar [77, 60, 46, 36, 28, 21]
    line [77, 60, 46, 36, 28, 21]
```

## Reference Table: The Math

| Actions | Per-Action | Calculation | Overall | Status |
|---------|------------|-------------|---------|--------|
| 5 | 95% | 0.95^5 | **77%** | Acceptable |
| 10 | 95% | 0.95^10 | **60%** | Risky |
| 15 | 95% | 0.95^15 | **46%** | Poor |
| 20 | 95% | 0.95^20 | **36%** | Worse than coin flip |
| 30 | 95% | 0.95^30 | **21%** | Failure expected |

**Formula:** `Overall = (Per-Action)^N`

## Solution View: The Reliability Stack

```mermaid
flowchart TB
    subgraph Stack["The Reliability Stack"]
        direction TB
        L4["Layer 4: Human Escalation\n'Know when to ask for help'"]
        L3["Layer 3: Post-Action Verification\n'Confirm the outcome, not the response'"]
        L2["Layer 2: Pre-Action Validation\n'Check before you act'"]
        L1["Layer 1: Task Decomposition\n'Small tasks = fewer failure points'"]
    end

    L4 --> L3 --> L2 --> L1

    style L1 fill:#6bffff
    style L2 fill:#6bff9f
    style L3 fill:#ffd06b
    style L4 fill:#ff6b6b
```

## Impact of Improving Per-Action Reliability

| Current | Target | 10-Action Workflow |
|---------|--------|-------------------|
| 95% | 99% | 60% → **90%** |
| 95% | 99.5% | 60% → **95%** |
| 95% | 99.9% | 60% → **99%** |

**Key insight:** Every 1% improvement in per-action reliability compounds dramatically. Moving from 95% to 99% transforms a 60% success rate into 90%.

## Usage Notes

**Where this appears:** This diagram supports Chapter 8's discussion of why error handling matters in agent systems. It explains the mathematical foundation behind reliability engineering.

**Key concepts illustrated:**
1. Exponential reliability decay in multi-step workflows
2. Why demo agents fail in production (demos use 5-10 actions; production uses 20-30)
3. The four-layer reliability stack as a solution
4. The compounding benefit of small reliability improvements

**Related chapter content:**
- "Compounding improvement" (ch08 conclusion)
- Error categorization and prevention
- Clean slate recovery patterns

## Source

Based on [agent-reliability-chasm.md](../../../kb/agent-reliability-chasm.md) which references Vinci Rufus's research on the reliability chasm in AI agents.
