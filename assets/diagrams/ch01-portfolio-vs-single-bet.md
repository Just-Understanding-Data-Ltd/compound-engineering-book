# Chapter 1: Portfolio Game vs Single-Bet Game

## Diagram Description
A comparison visualization showing the two different approaches to independent engineering work. The single-bet approach treats each product as an all-or-nothing gamble, while the portfolio approach treats each product as one data point in a larger investment strategy. The key insight is that in portfolio mode, failures become learning data rather than existential crises.

## Mermaid Code

```mermaid
flowchart TB
    subgraph SingleBet["Single-Bet Game"]
        direction TB
        SB_start["Start: One Product"]
        SB_outcome{{"Outcome?"}}
        SB_success["Success\n(Continue)"]
        SB_fail["Failure\n(Abandon Path)"]

        SB_start --> SB_outcome
        SB_outcome -->|"Works"| SB_success
        SB_outcome -->|"Doesn't Work"| SB_fail

        SB_char1["High Variance"]
        SB_char2["Emotional Coupling"]
        SB_char3["Binary Exit Logic"]
        SB_char4["One miss = Existential"]
    end

    subgraph Portfolio["Portfolio Game"]
        direction TB
        PF_start["Start: Many Products"]
        PF_p1["Product 1"]
        PF_p2["Product 2"]
        PF_p3["Product N"]
        PF_compound["Total Capital\nCompounds"]

        PF_start --> PF_p1
        PF_start --> PF_p2
        PF_start --> PF_p3
        PF_p1 --> PF_compound
        PF_p2 --> PF_compound
        PF_p3 --> PF_compound

        PF_char1["Per-product variance high"]
        PF_char2["Portfolio variance low"]
        PF_char3["Slope-based exit logic"]
        PF_char4["One miss = Data point"]
    end
```

## Alternative: Failure Response Comparison

```mermaid
flowchart LR
    subgraph SingleBetFlow["Single-Bet: Failure Response"]
        direction TB
        SB1["Product Fails"] --> SB2["Evaluate Self"]
        SB2 --> SB3["'This doesn't work'"]
        SB3 --> SB4["Quit Path"]
    end

    subgraph PortfolioFlow["Portfolio: Failure Response"]
        direction TB
        PF1["Product Fails"] --> PF2["Update Model"]
        PF2 --> PF3["'Learned: X doesn't work'"]
        PF3 --> PF4["Try Next Experiment"]
        PF4 --> PF5["Infrastructure\nImproves"]
    end

    SingleBetFlow -.->|"Different Mindset"| PortfolioFlow
```

## Simple Table View

```mermaid
flowchart TB
    subgraph Comparison["Strategy Comparison"]
        direction LR

        subgraph Single["Single-Bet"]
            S1["One product"]
            S2["Success OR failure"]
            S3["High variance"]
            S4["Exit on failure"]
            S5["Miss = Identity crisis"]
        end

        subgraph Port["Portfolio"]
            P1["Many products"]
            P2["Capital compounds"]
            P3["Low portfolio variance"]
            P4["Exit when slope negative"]
            P5["Miss = Data point"]
        end
    end
```

## Key Metric Comparison

```mermaid
flowchart LR
    subgraph Metrics["What Determines Exit?"]
        direction TB

        subgraph SingleMetric["Single-Bet Logic"]
            SM1["Did it work?"]
            SM2["Yes → Continue"]
            SM3["No → Stop Everything"]
        end

        subgraph PortfolioMetric["Portfolio Logic"]
            PM1["Is leverage increasing?"]
            PM2["Is infrastructure reusable?"]
            PM3["Are experiments getting cheaper?"]
            PM4["Is downside capped?"]
            PM5["All Yes → Continue"]
        end
    end
```

## Usage
This diagram should appear in the "Portfolio Game vs. Single-Bet Game" section (around lines 98-105 of Chapter 1). It visualizes the fundamental difference in how compound systems engineers approach their work versus how most people approach independent projects. Use the first diagram for the primary comparison, and the alternative views to emphasize the different responses to failure.

## Context from Chapter
The chapter explains:
- Single-bet game: "one product, one outcome determines success or failure. Variance is extremely high. Your emotional state is tightly coupled to results. Exit logic is binary: success or failure, nothing between."
- Portfolio game: "many products, total capital compounds. Variance is high per product but low across the portfolio. Expected value depends on infrastructure reusability and learning velocity. Exit logic depends on slope: continue while leverage is increasing."

The key insight: "In single-bet mode, one miss feels existential. In portfolio mode, one miss is data."
