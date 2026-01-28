# Chapter 8: Multi-Layer Timeout Protection

## Diagram Description
Visualizes the defense-in-depth approach to cost protection in AI workflows. Shows nested protection layers from innermost (model selection) to outermost (job timeout), where each layer catches failures that slip through inner layers.

## Primary View: Nested Protection Circles

```mermaid
flowchart TB
    subgraph L1["Layer 1: Job Timeout (15 min)"]
        subgraph L2["Layer 2: Step Timeout (10 min)"]
            subgraph L3["Layer 3: Request Limits"]
                subgraph L4["Layer 4: Budget Cap"]
                    subgraph L5["Layer 5: Model Selection"]
                        CORE["AI Operation"]
                    end
                end
            end
        end
    end

    style L1 fill:#ef4444,stroke:#dc2626,color:#fff
    style L2 fill:#fb923c,stroke:#ea580c,color:#000
    style L3 fill:#facc15,stroke:#ca8a04,color:#000
    style L4 fill:#4ade80,stroke:#16a34a,color:#000
    style L5 fill:#6bffff,stroke:#06b6d4,color:#000
    style CORE fill:#fff,stroke:#333,color:#000
```

## Alternative View: Protection Layer Stack

```mermaid
flowchart LR
    subgraph Request["AI Request"]
        OP["Operation"]
    end

    subgraph Filters["Protection Layers"]
        direction LR
        M["Model\nSelection"]
        B["Budget\nCheck"]
        T["Token\nLimits"]
        S["Step\nTimeout"]
        J["Job\nTimeout"]
    end

    OP --> M --> B --> T --> S --> J --> OUT["Execute"]

    M -.->|"$0.25-$15/MTok"| FAIL1["Block"]
    B -.->|"$10/day limit"| FAIL2["Block"]
    T -.->|"4096 max"| FAIL3["Block"]
    S -.->|"10 min"| FAIL4["Kill"]
    J -.->|"15 min"| FAIL5["Kill"]

    style M fill:#6bffff
    style B fill:#4ade80
    style T fill:#facc15
    style S fill:#fb923c
    style J fill:#ef4444
```

## Reference Table: Protection Layer Details

| Layer | Protection Type | Typical Limit | What It Catches | Cost if Layer Fails |
|-------|----------------|---------------|-----------------|---------------------|
| 5 (Inner) | Model Selection | haiku/sonnet/opus | Wrong model for task | 60x cost multiplier |
| 4 | Budget Cap | $10/day, $100/month | Accumulated overrun | Unlimited spend |
| 3 | Token Limits | max_tokens: 4096 | Verbose responses | $75+ per request |
| 2 | Step Timeout | 10 minutes | Slow operations | Time-based runaway |
| 1 (Outer) | Job Timeout | 15 minutes | Everything else | Complete failure |

**Key principle:** Each layer is independent. Even if inner layers fail, outer layers provide backup protection.

## Defense in Depth View: What Each Layer Stops

```mermaid
flowchart TB
    subgraph Threats["Failure Scenarios"]
        T1["Wrong model\n(60x cost)"]
        T2["Budget exceeded\n($100+ surprise)"]
        T3["Verbose output\n(50K tokens)"]
        T4["Slow operation\n(infinite loop)"]
        T5["Total failure\n(env issue)"]
    end

    subgraph Defenses["Protection Layers"]
        D5["L5: Model Selection"]
        D4["L4: Budget Check"]
        D3["L3: Token Limits"]
        D2["L2: Step Timeout"]
        D1["L1: Job Timeout"]
    end

    T1 --> D5
    T2 --> D4
    T3 --> D3
    T4 --> D2
    T5 --> D1

    D5 -->|"✓ Blocked"| SAFE["Safe Operation"]
    D4 -->|"✓ Blocked"| SAFE
    D3 -->|"✓ Blocked"| SAFE
    D2 -->|"✓ Killed"| SAFE
    D1 -->|"✓ Killed"| SAFE

    style D5 fill:#6bffff
    style D4 fill:#4ade80
    style D3 fill:#facc15
    style D2 fill:#fb923c
    style D1 fill:#ef4444
    style SAFE fill:#4ade80
```

## Cost Impact Summary

| Scenario | Without Protection | With All 5 Layers |
|----------|-------------------|-------------------|
| Infinite loop | $87+ (manual kill) | $0 (10 min timeout) |
| node_modules scan | $234 (150K files) | $0.75 (50 file limit) |
| Verbose response | $75 (50K tokens) | $0.06 (4K token cap) |
| Wrong model | $15/MTok (opus) | $0.25/MTok (haiku) |
| Monthly runaway | Unlimited | $100 cap |

## Configuration Quick Reference

```text
Layer 1: Job Timeout
  └── timeout-minutes: 15 (GitHub Actions)

Layer 2: Step Timeout
  └── timeout-minutes: 10 (per step)

Layer 3: Request Limits
  ├── max_tokens: 4096
  ├── maxFiles: 50
  ├── maxLinesPerFile: 500
  └── maxTotalTokens: 50000

Layer 4: Budget Cap
  ├── dailyLimit: $10
  ├── monthlyLimit: $100
  └── alertThreshold: 80%

Layer 5: Model Selection
  ├── Simple tasks → haiku ($0.25/MTok)
  ├── Standard tasks → sonnet ($3/MTok)
  └── Complex tasks → opus ($15/MTok)
```

## Usage Notes

**Where this appears:** This diagram supports Chapter 8, Section 8.6 "Circuit Breakers and Reliability Patterns" and the multi-layer timeout protection examples.

**Key concepts illustrated:**
1. Defense in depth: multiple independent protection mechanisms
2. Inner layers optimize, outer layers protect
3. Each layer has specific failure scenarios it addresses
4. Cost compounds without protection, stays predictable with it

**Related chapter content:**
- Circuit breaker patterns (ch08:8.6)
- Cost protection in production (ch15)
- RALPH loop reliability (ch10)

## Source

Based on [ai-cost-protection-timeouts.md](../../../kb/ai-cost-protection-timeouts.md) which documents multi-layer timeout patterns for CI/CD AI workflows.
