# Chapter 2: Agent vs Chat Mental Model

## Diagram Description
A comparison visualization showing the fundamental difference between chat-based LLM interaction (ChatGPT-style) and agent-based interaction (Claude Code). The chat path shows isolated, passive text exchange while the agent path shows active codebase interaction with read/write/execute capabilities.

## Mermaid Code

```mermaid
flowchart TB
    subgraph Chat["Chat Mode (ChatGPT)"]
        direction TB
        C1["👤 Developer copies code into chat"]
        C2["💬 LLM generates text response"]
        C3["👤 Developer manually applies suggestions"]
        C4["🔄 Repeat if needed"]

        C1 --> C2 --> C3 --> C4
        C4 -.->|"Manual iteration"| C1
    end

    subgraph Agent["Agent Mode (Claude Code)"]
        direction TB
        A1["📂 Agent reads codebase directly"]
        A2["🧠 Agent reasons about patterns"]
        A3["✏️ Agent modifies files"]
        A4["⚡ Agent runs commands"]
        A5["👁️ Agent observes results"]

        A1 --> A2 --> A3 --> A4 --> A5
        A5 -.->|"Automatic iteration"| A2
    end

    subgraph Result["Outcome"]
        R1["Chat: You do the work"]
        R2["Agent: AI does the work"]
    end

    Chat --> R1
    Agent --> R2
```

## Alternative: Capability Comparison View

```mermaid
flowchart LR
    subgraph ChatCapabilities["Chat Capabilities"]
        CC1["Read: Paste only"]
        CC2["Write: Text output"]
        CC3["Execute: None"]
        CC4["Verify: Manual"]
    end

    subgraph AgentCapabilities["Agent Capabilities"]
        AC1["Read: Full codebase"]
        AC2["Write: Direct file edits"]
        AC3["Execute: Tests, builds, CLI"]
        AC4["Verify: Automatic feedback loop"]
    end

    subgraph Difference["Key Difference"]
        D1["Chat = Advisor"]
        D2["Agent = Worker"]
    end

    ChatCapabilities --> D1
    AgentCapabilities --> D2
```

## Alternative: Information Flow View

```mermaid
flowchart TB
    subgraph ChatFlow["Chat Information Flow"]
        direction LR
        CF1["Your Code"] -->|"You copy"| CF2["Chat Window"]
        CF2 -->|"LLM responds"| CF3["Suggestions"]
        CF3 -->|"You apply"| CF4["Your Code"]
    end

    subgraph AgentFlow["Agent Information Flow"]
        direction LR
        AF1["Your Codebase"] <-->|"Direct access"| AF2["Claude Code"]
        AF2 <-->|"Tool calls"| AF3["Read/Write/Bash"]
        AF3 <-->|"Results"| AF2
    end

    subgraph Implication["What This Means"]
        I1["Chat: Context is limited to what you paste"]
        I2["Agent: Context is your entire project"]
    end

    ChatFlow --> I1
    AgentFlow --> I2
```

## Simple Table View

```mermaid
flowchart TB
    subgraph Comparison["Chat vs Agent Comparison"]
        direction LR

        subgraph Chat["Chat"]
            T1["Medium: Web/paste"]
            T2["Context: Conversation"]
            T3["Output: Text blocks"]
            T4["Action: Manual"]
            T5["Verification: None"]
        end

        subgraph Agent["Agent"]
            U1["Medium: Terminal/CLI"]
            U2["Context: Full codebase"]
            U3["Output: File changes"]
            U4["Action: Automatic"]
            U5["Verification: Built-in"]
        end
    end
```

## Usage
This diagram should appear early in Chapter 2, in the "The Agent Mindset" section (around lines 9-24). It visualizes why the shift from "ask it to write code" to "ask it to solve a problem given context" matters.

The primary diagram shows:
- Chat: Manual, iterative, you-do-the-work loop
- Agent: Automatic, read-reason-act-verify loop

## Context from Chapter
The chapter opens with: "Claude Code is not ChatGPT in a terminal. It is an agent: a tool that reads your codebase, makes changes, runs commands, and reasons iteratively about what to do next."

The key insight is the mindset shift:
- **Chat mindset**: "I'll ask it to write code" → requires you to apply, verify, iterate
- **Agent mindset**: "I'll ask it to solve a problem given context" → it reads, acts, verifies

This is why the same underlying LLM produces dramatically different results: context access and action capability change everything.
