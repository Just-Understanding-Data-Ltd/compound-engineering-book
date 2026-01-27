# Chapter 13: Signal Processing Harness

## Diagram Description

Visualizes the four-layer harness model as a signal processing system. Each layer filters noise and amplifies signal, transforming unreliable probabilistic outputs (30-50% failure rate) into consistent, high-quality code (<1% failure rate).

## Primary View: Signal Flow

```mermaid
flowchart TB
    subgraph Input["Raw LLM Output"]
        L0["Noisy Signal<br/>High variance<br/>30-50% failure"]
    end

    subgraph Layer1["Layer 1: Claude Code Config"]
        L1["CLAUDE.md + Hooks<br/>Constraints applied<br/>15-25% failure"]
    end

    subgraph Layer2["Layer 2: Repository Engineering"]
        L2["Tests + Structure<br/>Clear feedback loops<br/>8-12% failure"]
    end

    subgraph Layer3["Layer 3: Meta-Engineering"]
        L3["Automation + Tools<br/>Self-correcting<br/>3-5% failure"]
    end

    subgraph Layer4["Layer 4: Closed-Loop"]
        L4["Constraints + Optimization<br/>Self-optimizing<br/><1% failure"]
    end

    L0 -->|"Signal: 1x"| L1
    L1 -->|"Signal: 3x"| L2
    L2 -->|"Signal: 2x"| L3
    L3 -->|"Signal: 2x"| L4
    L4 -->|"Signal: 2-5x"| Output["Clean Output<br/>Production Ready"]

    style Input fill:#ffcccc
    style Layer1 fill:#ffddaa
    style Layer2 fill:#ffffaa
    style Layer3 fill:#ddffaa
    style Layer4 fill:#aaffaa
    style Output fill:#88ff88
```

## Alternative View: Noise Reduction Pipeline

```mermaid
flowchart LR
    subgraph Noise["Noise Sources"]
        N1["Hallucinations"]
        N2["Style drift"]
        N3["Missing context"]
        N4["API errors"]
    end

    subgraph Filters["Harness Filters"]
        F1["CLAUDE.md<br/>Constraints"]
        F2["Type checks<br/>Tests"]
        F3["Hooks<br/>Automation"]
        F4["Telemetry<br/>Feedback"]
    end

    subgraph Result["Filtered Output"]
        R1["Verified code"]
        R2["Consistent style"]
        R3["Correct APIs"]
        R4["Tested behavior"]
    end

    N1 --> F1 --> R1
    N2 --> F2 --> R2
    N3 --> F3 --> R3
    N4 --> F4 --> R4
```

## Alternative View: Failure Rate Table

| Layer | What It Does | Mechanism | Failure Rate |
|-------|-------------|-----------|--------------|
| 0: Raw LLM | Generates code | Probabilistic | 30-50% |
| 1: Claude Code | Applies constraints | CLAUDE.md, hooks | 15-25% |
| 2: Repository | Provides feedback | Tests, types, structure | 8-12% |
| 3: Meta-Engineering | Automates correction | MCP servers, agents | 3-5% |
| 4: Closed-Loop | Self-optimizes | Telemetry, constraints | <1% |

**Key insight**: Each layer provides 2-3x signal improvement. Stacked together, they transform a 30-50% failure rate into <1%.

## Alternative View: Investment vs Return

```mermaid
flowchart TB
    subgraph Investment["Time Investment"]
        I1["Minutes: CLAUDE.md"]
        I2["Hours: Testing setup"]
        I3["Days: Automation"]
        I4["Weeks: Full harness"]
    end

    subgraph Return["Reliability Return"]
        R1["2x improvement"]
        R2["4x improvement"]
        R3["10x improvement"]
        R4["50x improvement"]
    end

    I1 --> R1
    I2 --> R2
    I3 --> R3
    I4 --> R4

    style I1 fill:#ddffdd
    style I2 fill:#ccffcc
    style I3 fill:#bbffbb
    style I4 fill:#aaffaa
```

## Usage

**Chapter reference**: Lines 7-17, "The Signal Processing Mental Model" section

**Key passage from chapter**:
> "Each layer of harness you add filters noise and amplifies signal. The first layer configures Claude Code itself. The second layer engineers your repository for clarity. The third layer automates your processes. The fourth layer closes the feedback loop so the system optimizes itself."

**Where to use this diagram**:
- After line 17, before "Layer 1: Configuring Claude Code"
- Primary view shows the flow from noise to clean output
- Table view provides quick reference for reader recall
- Use noise reduction pipeline view for presentations

## Related Diagrams

- ch13-harness-architecture.md - Four-layer structural view
- ch06-verification-ladder.md - Quality gates at each level
- ch09-context-channel-capacity.md - Information theory foundation
