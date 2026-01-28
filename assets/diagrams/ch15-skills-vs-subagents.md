# Chapter 15: Skills vs Sub-Agents Decision Framework

## Diagram Description
Decision framework for choosing between Skills and Sub-Agents in Claude Code workflows. Skills handle linear, repeatable workflows while Sub-Agents handle tasks requiring judgment or parallel execution.

## Primary Diagram: Decision Tree

```mermaid
flowchart TB
    A["Need to automate\na workflow?"]

    A --> B{"Same steps\nevery time?"}

    B -->|"Yes"| C{"Requires\njudgment?"}
    B -->|"No"| AGENT["Use Sub-Agent\n(adaptive execution)"]

    C -->|"No"| SKILL["Use Skill\n(deterministic)"]
    C -->|"Yes"| D{"Parallel\nexecution?"}

    D -->|"Yes"| AGENT
    D -->|"No"| E{"Maintains\nstate?"}

    E -->|"Yes"| AGENT
    E -->|"No"| SKILL

    subgraph Examples[""]
        EX1["Skills:\n/commit, /deploy,\n/release"]
        EX2["Sub-Agents:\ncode reviewer,\narchitect agent"]
    end

    SKILL -.- EX1
    AGENT -.- EX2

    style SKILL fill:#6bff9f
    style AGENT fill:#6bffff
```

## Alternative View: Comparison Matrix

```mermaid
flowchart TB
    subgraph Skills["Skills"]
        S1["Linear execution"]
        S2["Stateless"]
        S3["Inherited context"]
        S4["Repeatable workflows"]
    end

    subgraph SubAgents["Sub-Agents"]
        A1["Adaptive execution"]
        A2["Can maintain state"]
        A3["Isolated context"]
        A4["Complex judgment"]
    end

    S1 <-->|"vs"| A1
    S2 <-->|"vs"| A2
    S3 <-->|"vs"| A3
    S4 <-->|"vs"| A4

    style Skills fill:#6bff9f
    style SubAgents fill:#6bffff
```

## Detailed Comparison Table

| Characteristic | Skills | Sub-Agents |
|----------------|--------|------------|
| **Execution pattern** | Linear, deterministic | Adaptive, iterative |
| **State management** | Stateless | Can maintain state |
| **Context scope** | Inherited from parent | Isolated context |
| **Best for** | Repeatable workflows | Complex judgment tasks |
| **Predictability** | High (same output for same input) | Variable (depends on context) |
| **Cost** | Lower (fewer tokens) | Higher (full context per agent) |
| **Composability** | Skills can call skills | Agents can spawn agents |
| **Error handling** | Fail fast | Can retry and adapt |

## When to Use Each

### Use Skills When:
- [ ] Steps are the same every time
- [ ] No judgment required during execution
- [ ] Output is deterministic
- [ ] Workflow is well-defined
- [ ] Speed matters more than flexibility

**Examples:**
- `/commit` - stage and commit changes
- `/deploy staging` - run tests, build, deploy
- `/release patch` - version bump, changelog, tag

### Use Sub-Agents When:
- [ ] Task requires analysis or judgment
- [ ] Different inputs need different approaches
- [ ] Parallel execution improves performance
- [ ] State needs to persist across steps
- [ ] Quality varies by context

**Examples:**
- Code reviewer agent (different feedback per codebase)
- Architect agent (designs vary by requirements)
- Test generator (adapts to code complexity)

## Alternative View: Execution Patterns

```mermaid
flowchart LR
    subgraph SkillFlow["Skill: /deploy"]
        S1["Run tests"] --> S2["Build app"]
        S2 --> S3["Deploy"]
        S3 --> S4["Health check"]
    end

    subgraph AgentFlow["Agent: Code Review"]
        A1["Analyze code"] --> A2{"Issue\nfound?"}
        A2 -->|"Yes"| A3["Investigate"]
        A3 --> A4["Suggest fix"]
        A4 --> A2
        A2 -->|"No"| A5["Report"]
    end

    style SkillFlow fill:#e8ffe8
    style AgentFlow fill:#e8f4ff
```

## Cost Comparison

| Workflow Type | Skill Cost | Sub-Agent Cost | Recommendation |
|---------------|------------|----------------|----------------|
| Simple deploy | ~$0.01 | ~$0.05 | Skill |
| Code review (small) | ~$0.02 | ~$0.08 | Skill may suffice |
| Code review (large) | N/A | ~$0.15 | Sub-Agent needed |
| Architecture decision | N/A | ~$0.30 | Sub-Agent needed |
| Routine commit | ~$0.005 | ~$0.03 | Skill |

## Skill Composition Pattern

```mermaid
flowchart TB
    subgraph Release["/release Skill"]
        R1["/commit"]
        R2["npm version"]
        R3["Generate changelog"]
        R4["/commit"]
        R5["Create tag"]
        R6["/deploy staging"]
        R7["/deploy production"]
    end

    R1 --> R2 --> R3 --> R4 --> R5 --> R6 --> R7

    style Release fill:#e8ffe8
```

## Usage

This diagram appears in Chapter 15, section "Skills vs Sub-Agents" (lines 592-603). It helps readers decide:
1. When to use Skills for linear, repeatable workflows
2. When to use Sub-Agents for judgment-heavy tasks
3. How to compose Skills for complex workflows

## Context from Chapter

> "Use skills for linear, repeatable workflows. Use sub-agents for tasks requiring judgment or parallel execution. A deploy skill runs the same steps every time. A code review sub-agent applies judgment to different codebases."

> "Skills compound over time. Each workflow you automate saves minutes per day. Those minutes accumulate into hours per month."
