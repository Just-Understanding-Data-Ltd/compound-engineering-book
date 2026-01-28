# Chapter 14: Prompts and Specs as Assets

## Diagram Description

Visualizes the insight that code is derivative of specs and prompts, not the other way around. Shows how prompts and specifications are the true source of value, with code being regenerable output. Illustrates the four preservation strategies for conversation assets.

## Primary View: Code is Derivative

```mermaid
flowchart LR
    subgraph SOURCE["SOURCE (The Real Asset)"]
        direction TB
        SPEC["Specifications<br/>Requirements<br/>Constraints"]
        PROMPTS["Prompts<br/>Conversations<br/>Design decisions"]
    end

    subgraph PROCESS["GENERATION"]
        LLM["LLM<br/>Processing"]
    end

    subgraph OUTPUT["OUTPUT (Derivative)"]
        CODE["Code<br/>Implementation"]
    end

    SPEC --> LLM
    PROMPTS --> LLM
    LLM --> CODE

    CODE -.->|"Can be regenerated"| LLM
    SPEC -.->|"Enables regeneration"| LLM
    PROMPTS -.->|"Enables regeneration"| LLM

    style SOURCE fill:#66ff66
    style PROCESS fill:#ffeeaa
    style OUTPUT fill:#aaffff
```

## Alternative View: What Gets Lost

```mermaid
flowchart TB
    subgraph LOST["WHEN CONVERSATIONS DISAPPEAR, YOU LOSE:"]
        direction TB
        I["Intent<br/>The 'why' behind decisions"]
        IT["Iterations<br/>Dead ends that taught what doesn't work"]
        C["Context<br/>What you knew, what was unknown"]
        T["Tradeoffs<br/>What was considered and rejected"]
        R["Regeneration ability<br/>Can you reproduce the code?"]
    end

    subgraph CONSEQUENCE["CONSEQUENCE"]
        RE["Reverse-engineering intent<br/>from implementation"]
    end

    LOST --> CONSEQUENCE

    style LOST fill:#ffcccc
    style CONSEQUENCE fill:#ff9999
```

## Alternative View: Four Preservation Strategies

```mermaid
flowchart TB
    subgraph STRATEGIES["FOUR PRESERVATION STRATEGIES"]
        direction LR

        subgraph S1["Strategy 1<br/>LOCAL ARCHIVE"]
            S1D[".claude/conversation-archive/"]
            S1P["+ Simple, in repo<br/>- Large files"]
        end

        subgraph S2["Strategy 2<br/>GIT COMMITS"]
            S2D["Snapshot with code changes"]
            S2P["+ Tied to commits<br/>- Bloats repo"]
        end

        subgraph S3["Strategy 3<br/>EXTRACTION"]
            S3D["Mine patterns, document KB"]
            S3P["+ Curated, searchable<br/>- Requires extraction"]
        end

        subgraph S4["Strategy 4<br/>CLOUD SYNC"]
            S4D["Rsync to cloud storage"]
            S4P["+ Automatic backup<br/>- Cloud dependency"]
        end
    end

    subgraph RECOMMENDED["RECOMMENDED MINIMUM"]
        R["Local Archive (S1)<br/>+<br/>Automated Extraction (S3)"]
    end

    S1 --> RECOMMENDED
    S3 --> RECOMMENDED

    style RECOMMENDED fill:#ccffcc,stroke:#22aa22,stroke-width:2px
```

## Alternative View: Traditional vs Inverted Thinking

| Aspect | Traditional View | Inverted View (Correct) |
|--------|-----------------|------------------------|
| **Primary Asset** | Code | Specs + Prompts |
| **Secondary** | Documentation | Code |
| **What to back up** | Code repository | Conversations + Specs |
| **On code loss** | Disaster | Regenerate from specs |
| **On spec loss** | Minor inconvenience | Disaster |
| **Version control focus** | Code changes | Spec evolution |

## Alternative View: The Regeneration Pattern

```mermaid
flowchart TB
    subgraph DISASTER["SCENARIO: Code Lost"]
        LOST["Repository deleted,<br/>no backup"]
    end

    subgraph TRAD["TRADITIONAL (No Specs)"]
        T1["Panic"]
        T2["Try to remember implementation"]
        T3["Rebuild from memory"]
        T4["Weeks of work lost"]
    end

    subgraph INVERT["INVERTED (Specs Preserved)"]
        I1["Retrieve specs"]
        I2["Load conversation archives"]
        I3["Regenerate from prompts"]
        I4["Hours to recover"]
    end

    DISASTER -->|"Without preservation"| TRAD
    DISASTER -->|"With preservation"| INVERT

    style TRAD fill:#ffcccc
    style INVERT fill:#ccffcc
```

## Alternative View: Spec Structure

```mermaid
flowchart TB
    subgraph SPECS["SPEC FOLDER STRUCTURE"]
        direction TB
        ROOT["specs/"]
        FEAT["features/"]
        ARCH["architecture/"]

        F1["auth-flow.md"]
        F2["payment-integration.md"]
        F3["notification-system.md"]

        A1["api-design.md"]
        A2["data-model.md"]

        ROOT --> FEAT
        ROOT --> ARCH
        FEAT --> F1
        FEAT --> F2
        FEAT --> F3
        ARCH --> A1
        ARCH --> A2
    end

    subgraph REGEN["REGENERATION PATTERN"]
        PROMPT["Given the spec in<br/>specs/features/auth-flow.md,<br/>implement the login endpoint."]
    end

    F1 --> PROMPT

    style SPECS fill:#aaffff
    style REGEN fill:#ccffcc
```

## Alternative View: Extraction Command

```mermaid
flowchart LR
    subgraph INPUT["CONVERSATION"]
        CONV["2-hour auth<br/>implementation<br/>session"]
    end

    subgraph EXTRACT["EXTRACTION COMMAND"]
        CMD["/extract"]
        PROCESS["Extract:<br/>1. Key decisions + rationale<br/>2. Problems + solutions<br/>3. Patterns to document<br/>4. CLAUDE.md updates"]
    end

    subgraph OUTPUT["KNOWLEDGE BASE"]
        KB["knowledge-base/<br/>sessions/<br/>2026-01-28-auth.md"]
    end

    INPUT --> CMD --> PROCESS --> OUTPUT

    style INPUT fill:#ffeeaa
    style EXTRACT fill:#aaffff
    style OUTPUT fill:#ccffcc
```

## Alternative View: Implementation Roadmap

| Week | Action | Outcome |
|------|--------|---------|
| **1** | Create `.claude/conversation-archive/` + .gitignore | Immediate backup capability |
| **2** | Build `/extract` command | Convert conversations to knowledge |
| **3** | Create spec templates in `specs/features/` | Standardized requirement capture |
| **4** | Integrate into post-session workflow | Systematic preservation |

## Usage

**Chapter reference**: Lines 129-222, "Treating Prompts and Specs as First-Class Assets" section

**Key passages from chapter**:
> "Here is an insight that inverts how most engineers think: code is derivative. The prompts and specs that generated it are the source."

> "If you lose the code, you can regenerate it from the prompts. If you lose the prompts, you are back to reverse-engineering intent from implementation."

**Where to use this diagram**:
- After line 136, following the "Spec + Prompts → LLM → Code" formula
- Four strategies diagram supports lines 149-198
- Extraction command diagram supports lines 173-188

**Design notes**:
- Green = assets (specs, prompts, knowledge base)
- Yellow = process (conversations, extraction)
- Blue = structures (folders, commands)
- Red = loss scenarios (what happens without preservation)

## Related Diagrams

- ch14-adhoc-to-deterministic.md - Converting workflows to scripts
- ch14-compound-effect-loop.md - How investments compound
- ch14-meta-skill-stack.md - The full meta-engineer skill stack
