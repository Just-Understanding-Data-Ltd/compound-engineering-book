# Chapter 10: Clean Slate Recovery - The Decision Point

## Diagram Description
When an agent gets stuck in a broken trajectory (repeated failed attempts, circular reasoning, declining suggestion quality), continuing is counterproductive. The Clean Slate Recovery pattern recognizes the inflection point (typically at attempt 3) where starting fresh with explicit constraints becomes more economical than persisting.

## Primary Mermaid Diagram

```mermaid
flowchart TB
    subgraph Broken["❌ Broken Trajectory"]
        B1["Attempt 1: Initial approach"]
        B2["Attempt 2: Refinement"]
        B3["Attempt 3: Alternative"]
        B4["Attempt 4: Variations..."]
        B5["Attempt 5: More variations..."]
        B6["Attempt 6: Stuck loop"]

        B1 --> B2 --> B3
        B3 -->|"Context rot"| B4 --> B5 --> B6
    end

    Decision{{"3+ failures?\nContext rot?"}}
    B3 --> Decision

    subgraph Recovery["✅ Clean Slate Recovery"]
        R1["Terminate session"]
        R2["Document failures"]
        R3["Start fresh context"]
        R4["Frame with constraints"]
        R5["Success!"]

        R1 --> R2 --> R3 --> R4 --> R5
    end

    Decision -->|"Yes"| R1
    Decision -->|"No"| B4

    subgraph Cost["💰 Cost Comparison"]
        C1["Broken: 30 mins, 30K tokens\nSuccess rate: ~30%"]
        C2["Recovery: 10 mins, 8K tokens\nSuccess rate: ~80%"]
    end

    style Recovery fill:#d4edda,stroke:#155724
    style Broken fill:#f8d7da,stroke:#721c24
```

## Alternative View 1: Warning Signs Checklist

```mermaid
flowchart TB
    subgraph Signs["⚠️ Warning Signs"]
        S1["Same approach variations\n'try X... try X with Y...'"]
        S2["Circular reasoning\n'maybe we should go back to...'"]
        S3["Declining quality\n'later suggestions worse'"]
        S4["The 'stuck' feeling\n'nothing is working'"]
    end

    Signs --> Threshold["🛑 3-Attempt Threshold"]
    Threshold --> Action["🔄 Trigger Clean Slate"]
```

## Alternative View 2: The 3-Attempt Threshold

| Attempt | Purpose | Action if Fails |
|---------|---------|-----------------|
| **1** | Initial approach | Refine |
| **2** | Refinement/variation | Try alternative |
| **3** | Alternative approach | **STOP - Clean Slate** |
| 4+ | Diminishing returns | Wasted tokens |

## Alternative View 3: Clean Slate Process

```mermaid
sequenceDiagram
    participant Old as Old Session
    participant Dev as Developer
    participant New as New Session

    Old->>Dev: Failed after 3 attempts
    Dev->>Dev: Analyze root cause (not symptoms)

    Dev->>New: Start fresh session
    Dev->>New: Provide task description
    Dev->>New: List what failed and why
    Dev->>New: Explicit constraints
    Dev->>New: Required approach boundaries

    New->>Dev: Propose new approach
    Dev->>New: Approve approach
    New->>Dev: Implement successfully
```

## Alternative View 4: Example Recovery - JWT Auth Problem

**Old Trajectory (stuck):**
```
Attempt 1: JWT refresh tokens
  → Failed: API doesn't support refresh endpoint

Attempt 2: Store refresh token in localStorage
  → Failed: Still no endpoint to use it

Attempt 3: Adjust token validation
  → Failed: API design issue, not validation

Decision: TRIGGER CLEAN SLATE
```

**New Session (clean slate with constraints):**
```markdown
Task: Implement authentication that keeps users logged in.

Context: Previous approach tried JWT refresh tokens but failed
because our API doesn't expose refresh endpoints and we cannot
modify the backend.

Constraints:
- Must use session-based auth (API provides session cookies)
- Cannot modify backend API (external service)
- Must handle 401 responses by redirecting to login
- Should persist session across page refreshes

Result: Agent proposes axios interceptor + session cookies
→ Success on first attempt!
```

## Alternative View 5: Economic Analysis

```mermaid
flowchart LR
    subgraph Broken["Continuing Broken Trajectory"]
        BA["8-10 attempts"]
        BB["35K+ tokens"]
        BC["35+ minutes"]
        BD["~30% success"]
    end

    subgraph Recovery["Clean Slate Recovery"]
        RA["1-2 attempts"]
        RB["8K tokens"]
        RC["10 minutes"]
        RD["~80% success"]
    end

    Broken -->|"vs"| Recovery

    subgraph Savings["💰 Savings"]
        S1["25 minutes saved"]
        S2["27K tokens saved"]
        S3["5x lower cost"]
        S4["2.7x better success"]
    end

    Recovery --> Savings
```

## Usage
- **Chapter location**: Section 4.8 "Clean Slate Recovery Patterns"
- **Key insight**: Fresh context is cheaper than broken context
- **Critical point**: Recognize the inflection point at attempt 3

## Context from Chapter
> "The intuition to 'push through' is wrong when applied to LLM conversations. Each failed attempt pollutes the context window, making subsequent attempts more likely to fail. The 3-attempt threshold is not arbitrary - it's the point where the cost of continuing exceeds the cost of starting fresh. Document the root cause (not symptoms), frame with explicit constraints, and watch the fresh context solve in 1-2 attempts what the broken trajectory couldn't solve in 6+."

## Framing Template for Clean Slate

```markdown
Task: [What you're trying to accomplish]

Context: Previous approaches tried [X, Y, Z] but failed because
[root cause analysis].

Constraints:
- [Hard constraint 1]
- [Hard constraint 2]
- [What cannot change]

Boundaries:
- [What the solution must do]
- [What the solution must not do]

Propose approach before implementing.
```
