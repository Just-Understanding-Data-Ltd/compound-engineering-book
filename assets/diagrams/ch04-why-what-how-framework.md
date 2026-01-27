# Chapter 4: WHY-WHAT-HOW Framework

## Diagram Description
Visualizes the three dimensions of effective CLAUDE.md documentation: WHY (purpose), WHAT (structure), and HOW (workflow).

## Primary View: Three Pillars

```mermaid
flowchart TB
    subgraph WWH["Effective CLAUDE.md"]
        direction TB

        subgraph WHY["WHY: Purpose & Context"]
            W1["What problem does this solve?"]
            W2["What business domain?"]
            W3["Why do patterns exist?"]
        end

        subgraph WHAT["WHAT: Stack & Structure"]
            X1["Languages & frameworks"]
            X2["Directory organization"]
            X3["Package purposes"]
        end

        subgraph HOW["HOW: Workflow"]
            H1["How to run tests"]
            H2["How to build"]
            H3["Verification before commit"]
        end
    end

    WHY --> Context["Claude understands the project"]
    WHAT --> Context
    HOW --> Context

    Context --> Output["First-try correct code"]

    style WHY fill:#e8f5e9
    style WHAT fill:#e3f2fd
    style HOW fill:#fff3e0
```

## Alternative View: Layered Stack

```mermaid
flowchart LR
    subgraph Layers["Context Layers (Foundation to Action)"]
        direction LR

        L1["WHY<br/>Foundation"]
        L2["WHAT<br/>Structure"]
        L3["HOW<br/>Action"]
    end

    L1 --> L2 --> L3

    L1 --- D1["'SaaS for scheduling<br/>social media posts'"]
    L2 --- D2["'Next.js 14 + FastAPI<br/>in /packages/*'"]
    L3 --- D3["'bun test before commit'"]

    style L1 fill:#c8e6c9
    style L2 fill:#bbdefb
    style L3 fill:#ffe0b2
```

## Alternative View: Question Flow

```mermaid
flowchart TD
    Start["New Claude Session"] --> Q1{"Does Claude know<br/>WHY the project exists?"}

    Q1 -->|No| Bad1["Generates generic code"]
    Q1 -->|Yes| Q2{"Does Claude know<br/>WHAT stack is used?"}

    Q2 -->|No| Bad2["Wrong framework patterns"]
    Q2 -->|Yes| Q3{"Does Claude know<br/>HOW to verify?"}

    Q3 -->|No| Bad3["Missing test/build steps"]
    Q3 -->|Yes| Success["First-try correct output"]

    Bad1 --> Fix["Add missing section"]
    Bad2 --> Fix
    Bad3 --> Fix
    Fix --> Start

    style Success fill:#4caf50,color:#fff
    style Bad1 fill:#ffcdd2
    style Bad2 fill:#ffcdd2
    style Bad3 fill:#ffcdd2
```

## Alternative View: Comparison Table

| Dimension | Question Answered | Example Content | Without It |
|-----------|-------------------|-----------------|------------|
| **WHY** | "What does this project do?" | "SaaS for marketers to schedule posts" | Generic code, wrong abstractions |
| **WHAT** | "What technologies?" | "Next.js 14, FastAPI, Supabase" | Wrong framework, wrong paths |
| **HOW** | "How do I verify?" | "Run bun test, then bun build" | Missing verification, broken commits |

## Usage

This diagram appears in **Chapter 4, Section 4.4** (lines 44-84) where the WHY-WHAT-HOW framework is introduced. It helps readers visualize how these three dimensions combine to create effective CLAUDE.md files.

**Suggested placement**: After the framework introduction (line 53) and before the minimal example (line 54).

## Context from Chapter

> "Every effective CLAUDE.md covers three dimensions:
>
> **WHY**: Purpose and context. What problem does this project solve? What business domain does it operate in? Why do certain architectural decisions exist?
>
> **WHAT**: Technology stack and structure. What languages and frameworks does the project use? How is the codebase organized? What packages live where?
>
> **HOW**: Workflow requirements. How do developers run tests? How do they build for production? What verification steps happen before committing?"

The framework ensures Claude has complete context to generate correct code on the first try, avoiding the pattern mismatch corrections described at the chapter opening.
