# Chapter 5: Four-Turn Framework

## Diagram Description
Visualizes the production agent loop: Understand, Decide, Execute, Verify. Contrasts with the basic agent loop that skips understanding and verification.

## Primary View: Full Framework

```mermaid
flowchart LR
    subgraph Production["Production Agent Loop"]
        direction LR
        U["1. UNDERSTAND<br/>Verify context<br/>& requirements"] --> D["2. DECIDE<br/>Choose appropriate<br/>response"]
        D --> E["3. EXECUTE<br/>Perform<br/>the task"]
        E --> V["4. VERIFY<br/>Confirm<br/>success"]
        V -->|"Next action"| U
    end

    style U fill:#E3F2FD
    style D fill:#FFF3E0
    style E fill:#E8F5E9
    style V fill:#FCE4EC
```

## Alternative View: Demo vs Production Comparison

```mermaid
flowchart TB
    subgraph Basic["Basic Agent Loop (Demo)"]
        direction LR
        B1["Input"] --> B2["LLM"] --> B3["Action"]
    end

    subgraph Full["Production Agent Loop"]
        direction LR
        P1["1. Understand"] --> P2["2. Decide"] --> P3["3. Execute"] --> P4["4. Verify"]
    end

    Basic -->|"Skips 1 & 4"| FAIL["80% of failures<br/>happen here"]
    Full -->|"Complete loop"| SUCCESS["Production-ready"]

    style B1 fill:#90EE90
    style B2 fill:#FFD700
    style B3 fill:#87CEEB
    style FAIL fill:#FF6B6B,color:#fff
    style SUCCESS fill:#90EE90

    style P1 fill:#E3F2FD
    style P2 fill:#FFF3E0
    style P3 fill:#E8F5E9
    style P4 fill:#FCE4EC
```

## Alternative View: Turn Details

```mermaid
flowchart TB
    subgraph Turn1["Turn 1: UNDERSTAND"]
        U1["Parse input"]
        U2["Validate context"]
        U3["Check prerequisites"]
        U4["Identify ambiguity"]
    end

    subgraph Turn2["Turn 2: DECIDE"]
        D1["Evaluate options"]
        D2["Assess risk"]
        D3["Select action"]
        D4["Plan execution"]
    end

    subgraph Turn3["Turn 3: EXECUTE"]
        E1["Call tool"]
        E2["Handle response"]
        E3["Log event"]
        E4["Update state"]
    end

    subgraph Turn4["Turn 4: VERIFY"]
        V1["Check outcome"]
        V2["Validate result"]
        V3["Detect errors"]
        V4["Escalate if needed"]
    end

    Turn1 --> Turn2 --> Turn3 --> Turn4
    Turn4 -->|"Continue"| Turn1
    Turn4 -->|"Complete"| DONE["Done"]
    Turn4 -->|"Error"| ESCALATE["Human"]

    style Turn1 fill:#E3F2FD
    style Turn2 fill:#FFF3E0
    style Turn3 fill:#E8F5E9
    style Turn4 fill:#FCE4EC
```

## Alternative View: Where Failures Occur

| Turn | Skip Rate in Demos | Failure Impact |
|------|-------------------|----------------|
| 1. Understand | 60% skipped | Misinterprets task, wrong assumptions |
| 2. Decide | 10% skipped | Usually present (LLM does this) |
| 3. Execute | 5% skipped | Usually present (action happens) |
| 4. Verify | 80% skipped | Silent failures, corrupted state |

**Key insight:** Turns 1 and 4 are where 80% of production failures occur, yet demos routinely skip them.

## Alternative View: Verification Focus

```mermaid
flowchart LR
    subgraph Before["Pre-Action (Turn 1)"]
        direction TB
        A1["Do we have required info?"]
        A2["Is this action safe?"]
        A3["Are prerequisites met?"]
    end

    subgraph After["Post-Action (Turn 4)"]
        direction TB
        B1["Did the action succeed?"]
        B2["Does state match expectations?"]
        B3["Any silent failures?"]
    end

    Before -->|"Execute"| After
    After -->|"If OK"| NEXT["Next Turn"]
    After -->|"If Bad"| ESCALATE["Escalate"]

    style Before fill:#E3F2FD
    style After fill:#FCE4EC
```

## Usage
This diagram appears in Section 5.1 "The Four-Turn Framework" to explain the production agent loop structure.

## Context from Chapter
> "Basic agents run a simple loop: Input, LLM, Action. Production agents need four turns:
> 1. **Understand**: Verify context and requirements
> 2. **Decide**: Choose the appropriate response
> 3. **Execute**: Perform the task
> 4. **Verify**: Confirm success
>
> Most demo agents skip turns 1 and 4. They assume context is clear and trust API responses. This is exactly where 80% of production failures occur."
