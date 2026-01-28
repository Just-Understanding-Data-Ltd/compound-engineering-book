# Chapter 13: Cost Protection Layers

## Diagram Description

Visualizes the five-layer cost protection model for autonomous LLM workflows within the harness architecture. Each layer operates independently, providing defense in depth against runaway costs. Outer layers catch catastrophic failures; inner layers optimize normal operations.

## Primary View: Nested Defense Circles

```mermaid
flowchart TB
    subgraph L1["Layer 1: Job Timeout"]
        direction TB
        L1T["15 min limit<br/>Catches: Infinite loops"]
        subgraph L2["Layer 2: Request Tokens"]
            direction TB
            L2T["4,096 max tokens<br/>Catches: Verbose responses"]
            subgraph L3["Layer 3: Input Size Limits"]
                direction TB
                L3T["50 files × 500 lines<br/>Catches: File explosions"]
                subgraph L4["Layer 4: Budget Alerts"]
                    direction TB
                    L4T["$10/day, $100/month<br/>Catches: Sustained overuse"]
                    subgraph L5["Layer 5: Model Selection"]
                        direction TB
                        L5T["Haiku/Sonnet/Opus<br/>Optimizes: Cost per task"]
                        CORE["AI<br/>Operation"]
                    end
                end
            end
        end
    end

    style L1 fill:#ef4444,stroke:#b91c1c,color:#fff
    style L2 fill:#f97316,stroke:#c2410c,color:#000
    style L3 fill:#eab308,stroke:#a16207,color:#000
    style L4 fill:#22c55e,stroke:#15803d,color:#000
    style L5 fill:#06b6d4,stroke:#0891b2,color:#000
    style CORE fill:#f8fafc,stroke:#475569,color:#000
```

## Alternative View: Linear Protection Pipeline

```mermaid
flowchart LR
    subgraph Input["Request"]
        REQ["AI Call"]
    end

    subgraph Pipeline["Protection Pipeline"]
        direction LR
        M["Model<br/>Check"]
        B["Budget<br/>Check"]
        I["Input<br/>Check"]
        T["Token<br/>Check"]
        J["Job<br/>Timeout"]
    end

    subgraph Output["Result"]
        EXEC["Execute"]
    end

    REQ --> M
    M -->|"Pass"| B
    B -->|"Pass"| I
    I -->|"Pass"| T
    T -->|"Pass"| J
    J -->|"Pass"| EXEC

    M -.->|"Haiku: $0.25/MTok"| X1["Use cheaper"]
    B -.->|">$10/day"| X2["Block"]
    I -.->|">50 files"| X3["Block"]
    T -.->|">4K tokens"| X4["Truncate"]
    J -.->|">15 min"| X5["Kill"]

    style M fill:#06b6d4
    style B fill:#22c55e
    style I fill:#eab308
    style T fill:#f97316
    style J fill:#ef4444
    style EXEC fill:#22c55e
```

## Reference Table: Five-Layer Protection Model

| Layer | Protection Type | Example Limit | What It Catches | Without Protection |
|-------|----------------|---------------|-----------------|-------------------|
| 1 (Outer) | Job Timeout | 15 minutes | Infinite loops, env issues | $87+ until manual kill |
| 2 | Request Tokens | `max_tokens: 4096` | Verbose, bloated responses | $75 per 50K token response |
| 3 | Input Size | 50 files, 500 lines each | node_modules, file explosions | $234 for 150K files |
| 4 | Budget Alerts | $10/day, $100/month | Accumulated overrun | Unlimited monthly spend |
| 5 (Inner) | Model Selection | Haiku for simple tasks | Wrong model for complexity | 60x cost multiplier |

**Design principle:** Outer layers (1-2) catch catastrophic failures. Inner layers (4-5) optimize normal operations. Layer 3 prevents unexpected scale.

## Cost Calculation View

```mermaid
flowchart TB
    subgraph Config["Configuration"]
        C1["Model: Sonnet<br/>$3/MTok in, $15/MTok out"]
        C2["Max Input: 250K tokens<br/>50 files × 500 lines × 40 chars"]
        C3["Max Output: 4,096 tokens"]
        C4["Frequency: 4 PRs/day"]
    end

    subgraph Calc["Per-Review Cost"]
        IN["Input: 250K × $0.000003<br/>= $0.75"]
        OUT["Output: 4K × $0.000015<br/>= $0.06"]
        TOTAL["Total: $0.81"]
    end

    subgraph Scale["Scaling"]
        DAILY["Daily: 4 × $0.81<br/>= $3.24"]
        MONTHLY["Monthly: $3.24 × 22<br/>= $71.28"]
    end

    subgraph Optimize["With Model Switching"]
        OPT["Haiku for 80% of tasks<br/>Sonnet for complex only"]
        SAVE["New Monthly: $20.24<br/>Savings: 72%"]
    end

    C1 --> IN
    C2 --> IN
    C3 --> OUT
    IN --> TOTAL
    OUT --> TOTAL
    TOTAL --> DAILY
    C4 --> DAILY
    DAILY --> MONTHLY
    MONTHLY --> OPT
    OPT --> SAVE

    style TOTAL fill:#f97316
    style SAVE fill:#22c55e
```

## safeAIOperation Wrapper Pattern

```mermaid
flowchart TB
    CALL["safeAIOperation(op)"]

    CHECK["Check today's spend"]

    OVER{{"spent >= dailyLimit?"}}
    WARN{{"spent >= 80% limit?"}}

    BLOCK["Throw: Budget exceeded"]
    ALERT["Log: Budget warning"]

    EXEC["Execute operation"]
    RETURN["Return result"]

    CALL --> CHECK
    CHECK --> OVER
    OVER -->|"Yes"| BLOCK
    OVER -->|"No"| WARN
    WARN -->|"Yes"| ALERT
    WARN -->|"No"| EXEC
    ALERT --> EXEC
    EXEC --> RETURN

    style BLOCK fill:#ef4444,color:#fff
    style ALERT fill:#eab308
    style RETURN fill:#22c55e
```

## Real-World Failure Scenarios

| Scenario | What Happened | Which Layer Catches It | Outcome |
|----------|---------------|----------------------|---------|
| Infinite test loop | Agent kept regenerating fixes for env issue | Layer 1: Job timeout | Killed at 15 min, $2.50 instead of $87 |
| node_modules scan | Agent processed 150K files in dependencies | Layer 3: Input limits | Blocked at 50 files, $0.75 instead of $234 |
| Verbose summaries | Agent returned 50K token analysis | Layer 2: Token cap | Truncated at 4K, $0.06 instead of $75 |
| Nightly runaway | CI job ran 200 times due to flaky test | Layer 4: Budget cap | Stopped at $10/day instead of $400 |
| Opus for grep | Used expensive model for simple search | Layer 5: Model selection | Haiku auto-selected, $0.25 instead of $15 |

## Configuration Quick Reference

```text
Layer 1: Job Timeout
  └── GitHub Actions: timeout-minutes: 15
  └── Or: setTimeout(operation, 15 * 60 * 1000)

Layer 2: Request Tokens
  └── API: max_tokens: 4096
  └── Or: response.slice(0, 4096)

Layer 3: Input Size Limits
  └── maxFiles: 50
  └── maxLinesPerFile: 500
  └── maxTotalTokens: 50000

Layer 4: Budget Alerts
  └── dailyLimit: $10
  └── monthlyLimit: $100
  └── alertThreshold: 0.8 (warn at 80%)

Layer 5: Model Selection
  └── Simple (grep, rename): haiku ($0.25/MTok)
  └── Standard (review, refactor): sonnet ($3/MTok)
  └── Complex (architecture, multi-file): opus ($15/MTok)
```

## Integration with Harness Architecture

```mermaid
flowchart TB
    subgraph Layer4["Layer 4: Closed-Loop Optimization"]
        direction TB
        CI["CI/CD Integration"]
        COST["Cost Protection"]
        OBS["Observability"]
        FEED["Feedback Loops"]
    end

    subgraph CostStack["Cost Protection Stack"]
        direction TB
        P1["Job Timeout"]
        P2["Token Caps"]
        P3["Input Limits"]
        P4["Budget Alerts"]
        P5["Model Selection"]
    end

    CI --> COST
    COST --> CostStack
    CostStack --> OBS
    OBS --> FEED
    FEED -->|"Tune limits"| COST

    style COST fill:#22c55e
    style CostStack fill:#f0fdf4
```

## Usage Notes

**Where this appears:** Chapter 13, Section "Multi-Layer Cost Protection" within Layer 4: Closed-Loop Optimization.

**Key concepts illustrated:**
1. Defense in depth: five independent protection layers
2. Outer layers catch catastrophic failures (infinite loops, env issues)
3. Inner layers optimize normal operations (model selection, budgets)
4. Cost predictability through hard limits at every level

**Related chapter content:**
- ch13 lines 969-1038: Multi-Layer Cost Protection section
- ch08 Section 8.6: Circuit Breakers and Reliability Patterns
- ch15: Model Strategy and Cost Optimization

**Source material:**
- [ai-cost-protection-timeouts.md](../../../kb/ai-cost-protection-timeouts.md)
- Chapter 13 cost calculation example ($71.28 → $20.24 with model switching)
