# Chapter 5: Reliability Cascade (The Reliability Chasm)

## Diagram Description
Visualizes the exponential reliability decay in multi-step agent workflows. Shows why demo agents (5 steps) succeed while production agents (20+ steps) fail catastrophically.

## Primary View: Exponential Decay Chart

```mermaid
xychart-beta
    title "Agent Reliability vs. Workflow Steps"
    x-axis "Number of Steps" [1, 5, 10, 15, 20, 25, 30]
    y-axis "Overall Success Rate %" 0 --> 100
    line "0.95^N Reliability" [95, 77, 60, 46, 36, 28, 21]
    line "50% Baseline" [50, 50, 50, 50, 50, 50, 50]
```

## Alternative View: Cascade Flowchart

```mermaid
flowchart LR
    subgraph Demo["Demo Agent (5 steps)"]
        D1["Step 1<br/>95%"] --> D2["Step 2<br/>90%"] --> D3["Step 3<br/>86%"] --> D4["Step 4<br/>81%"] --> D5["Step 5<br/>77%"]
    end

    subgraph Production["Production Agent (20 steps)"]
        P1["Steps 1-5<br/>77%"] --> P2["Steps 6-10<br/>60%"] --> P3["Steps 11-15<br/>46%"] --> P4["Steps 16-20<br/>36%"]
    end

    Demo -->|"Looks good!"| Production
    Production -->|"64% failure rate"| FAIL["FAILURE"]

    style D5 fill:#90EE90
    style P4 fill:#FFB6C1
    style FAIL fill:#FF6B6B,color:#fff
```

## Alternative View: Reliability Table

| Steps | Per-Step Success | Cumulative | Status |
|-------|-----------------|------------|--------|
| 1 | 95% | 95% | Safe |
| 5 | 95% | 77% | Demo zone |
| 10 | 95% | 60% | Warning |
| 15 | 95% | 46% | Danger |
| 20 | 95% | 36% | Critical |
| 25 | 95% | 28% | Failing |
| 30 | 95% | 21% | Broken |

## Alternative View: Comparison Diagram

```mermaid
flowchart TB
    subgraph Left["Demo Agent"]
        direction TB
        DA["5 Steps Total"]
        DA --> DS["77% Success"]
        DS --> DM["Humans catch<br/>remaining 23%"]
        DM --> DO["Appears to work"]
        style DO fill:#90EE90
    end

    subgraph Right["Production Agent"]
        direction TB
        PA["20+ Steps Total"]
        PA --> PS["36% Success"]
        PS --> PM["Errors compound<br/>no human backup"]
        PM --> PO["Catastrophic failure"]
        style PO fill:#FF6B6B,color:#fff
    end

    Left -.->|"Same code"| Right

    style Left fill:#E8F5E9
    style Right fill:#FFEBEE
```

## Why Demo Agents Appear Reliable

```mermaid
flowchart LR
    subgraph Demo["Demo Environment"]
        D1["Low stakes<br/>(test data)"]
        D2["Short chains<br/>(5 steps)"]
        D3["Manual verification<br/>(humans catch errors)"]
        D4["Constrained context<br/>(few variables)"]
    end

    subgraph Prod["Production Environment"]
        P1["High stakes<br/>(real data, real money)"]
        P2["Long chains<br/>(20+ steps)"]
        P3["Automated verification<br/>(agent must self-check)"]
        P4["Complex context<br/>(many variables, history)"]
    end

    Demo -->|"Scaling gap"| Prod

    style Demo fill:#E8F5E9
    style Prod fill:#FFEBEE
```

## Usage
This diagram appears in Section 5.1 "The Reliability Chasm" to explain why 95% of agent PoCs never reach production.

## Context from Chapter
> "The formula is simple: `0.95^N`. A 10-step workflow has 60% reliability, worse than a coin flip for business-critical operations. Production workflows commonly require 15-25 steps."

> "This exponential failure explains why up to 95% of agent proof-of-concepts never reach production."
