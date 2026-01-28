# Chapter 14: Ad-hoc to Deterministic Flow

## Diagram Description

Visualizes the conversion process from ad-hoc agent workflows to deterministic scripts. Shows the contrast between variable latency/cost of agent-driven flows versus fast, predictable scripts. Includes the hybrid approach where scripts gather data and agents apply judgment.

## Primary View: Conversion Flow

```mermaid
flowchart TB
    subgraph ADHOC["AD-HOC AGENT FLOW"]
        direction TB
        P["Prompt: 'Run tests,<br/>fix failures, lint'"]
        R["LLM Reasoning<br/>~45 seconds"]
        E["Execution<br/>~15 seconds"]
        V["Variable outcome<br/>(might differ each run)"]

        P --> R --> E --> V
    end

    subgraph CONVERT["CONVERSION PROCESS"]
        direction TB
        C1["1. Identify repeated flow<br/>(used 3+ times)"]
        C2["2. Document exact steps"]
        C3["3. Write shell script"]
        C4["4. Wrap in slash command"]

        C1 --> C2 --> C3 --> C4
    end

    subgraph DETERMINISTIC["DETERMINISTIC SCRIPT"]
        direction TB
        S["./scripts/test-cycle.sh"]
        X["Direct execution<br/>~3 seconds"]
        O["Same behavior<br/>every time"]

        S --> X --> O
    end

    ADHOC -->|"3+ uses"| CONVERT
    CONVERT --> DETERMINISTIC

    style ADHOC fill:#ffeeaa
    style CONVERT fill:#aaffff
    style DETERMINISTIC fill:#ccffcc
```

## Alternative View: Cost and Latency Comparison

| Metric | Ad-hoc Agent Flow | Deterministic Script |
|--------|-------------------|---------------------|
| **Latency** | ~60 seconds (45s reasoning + 15s execution) | ~3 seconds |
| **Token Cost** | $0.02-0.10 per run | $0.00 |
| **Consistency** | Variable (might differ) | Identical every time |
| **Context Use** | Consumes context window | Zero context used |
| **Error Handling** | Agent decides | Explicit in script |
| **Debugging** | Opaque (LLM reasoning) | Transparent (read script) |

**Impact over 100 runs:**
- Latency saved: ~95 minutes
- Tokens saved: $2-10
- Consistency: 100% vs ~85%

## Alternative View: The 3-Use Threshold

```mermaid
flowchart LR
    subgraph Decision["WORKFLOW DECISION"]
        direction TB
        Q{"How many times<br/>have you run this?"}

        ONCE["1-2 times"]
        THREE["3+ times"]

        KEEP["Keep as<br/>ad-hoc conversation"]
        SCRIPT["Convert to<br/>deterministic script"]
    end

    Q -->|"Once or twice"| ONCE
    Q -->|"Three or more"| THREE

    ONCE --> KEEP
    THREE --> SCRIPT

    style KEEP fill:#ffeeaa
    style SCRIPT fill:#ccffcc
```

## Alternative View: Hybrid Approach

```mermaid
flowchart TB
    subgraph HYBRID["THE HYBRID APPROACH"]
        direction TB

        subgraph SCRIPT_PART["SCRIPT (Deterministic)"]
            S1["Run tests"]
            S2["Capture output"]
            S3["Run typecheck"]
            S4["Capture output"]
            S5["Count errors"]
        end

        subgraph AGENT_PART["AGENT (Judgment)"]
            A1["Analyze outputs"]
            A2["Prioritize fixes"]
            A3["Explain tradeoffs"]
        end

        S1 --> S2 --> S3 --> S4 --> S5
        S5 -->|"Raw data"| A1
        A1 --> A2 --> A3
    end

    subgraph BENEFIT["BENEFITS"]
        B1["Fast data gathering"]
        B2["Consistent diagnostics"]
        B3["Intelligent prioritization"]
    end

    HYBRID --> BENEFIT

    style SCRIPT_PART fill:#ccffcc
    style AGENT_PART fill:#ffeeaa
    style BENEFIT fill:#aaffff
```

## Alternative View: When to Keep Ad-hoc

```mermaid
flowchart TB
    subgraph ADHOC_OK["KEEP AD-HOC WHEN:"]
        direction TB
        E["Exploratory work<br/>(unknown steps)"]
        N["Novel problems<br/>(needs reasoning)"]
        L["Learning new codebase<br/>(one-off work)"]
        D["Decision-heavy tasks<br/>(judgment throughout)"]
    end

    subgraph SCRIPT_OK["SCRIPT WHEN:"]
        direction TB
        R["Repetitive execution<br/>(same steps each time)"]
        P["Predictable workflow<br/>(known outcomes)"]
        F["Fast turnaround needed<br/>(latency matters)"]
        C["Consistency required<br/>(same behavior)"]
    end

    style ADHOC_OK fill:#ffeeaa
    style SCRIPT_OK fill:#ccffcc
```

## Alternative View: The Slash Command Pattern

```mermaid
flowchart LR
    subgraph BEFORE["BEFORE"]
        P1["User types:<br/>'Run tests, fix failures,<br/>then lint the code'"]
    end

    subgraph AFTER["AFTER"]
        P2["User types:<br/>/test-cycle"]
    end

    subgraph IMPL["IMPLEMENTATION"]
        direction TB
        MD[".claude/commands/<br/>test-cycle.md"]
        SH["scripts/<br/>test-cycle.sh"]

        MD -->|"runs"| SH
    end

    BEFORE -->|"Convert"| IMPL
    IMPL --> AFTER

    style BEFORE fill:#ffcccc
    style AFTER fill:#ccffcc
    style IMPL fill:#aaffff
```

## Alternative View: Impact Calculation

| Scenario | Ad-hoc Time | Script Time | Savings per Run | Over 100 Runs |
|----------|-------------|-------------|-----------------|---------------|
| Test cycle | 60s | 3s | 57s | **95 minutes** |
| Deploy to staging | 120s | 15s | 105s | **175 minutes** |
| Lint and format | 45s | 2s | 43s | **72 minutes** |
| Database migration | 90s | 10s | 80s | **133 minutes** |

**Key insight**: The savings compound. Every repeated workflow converted to a script saves hours over time.

## Usage

**Chapter reference**: Lines 7-127, "Converting Ad-hoc Workflows to Deterministic Scripts" section

**Key passages from chapter**:
> "Every time you prompt an agent to 'run tests, fix failures, then lint,' you are burning context, tokens, and time. If you have typed that sequence three times, it should be a script."

> "The latency argument alone is compelling. An ad-hoc flow takes about 45 seconds of LLM reasoning plus 15 seconds of execution. A script takes 3 seconds total."

**Where to use this diagram**:
- After line 16, following the ad-hoc/deterministic pattern explanation
- Cost/latency table supports the numbers in lines 22-32
- Hybrid approach diagram aligns with lines 95-116

**Design notes**:
- Yellow = ad-hoc (flexible but slow)
- Green = deterministic (fast and consistent)
- Blue = conversion process or hybrid benefits

## Related Diagrams

- ch14-leverage-stack.md - What skills to keep vs delegate
- ch14-task-decomposition.md - How to size tasks for agents
- ch14-compound-effect-loop.md - How meta-engineering investments compound
