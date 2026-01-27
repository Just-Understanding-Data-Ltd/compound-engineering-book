# Chapter 4: Hierarchical CLAUDE.md for Scaling

## Diagram Description
Shows how hierarchical CLAUDE.md files distribute documentation across a codebase to achieve high context relevance instead of monolithic loading.

## Primary View: Tree Structure with Line Counts

```mermaid
flowchart TB
    subgraph Root["/ Root"]
        R["CLAUDE.md<br/><b>30-50 lines</b>"]
        R1["Global architecture"]
        R2["Core principles"]
        R3["Links to domains"]
    end

    subgraph Packages["packages/"]
        subgraph API["api/"]
            A["CLAUDE.md<br/><b>200-300 lines</b>"]
            A1["tRPC patterns"]
            A2["Route conventions"]
        end

        subgraph DB["database/"]
            D["CLAUDE.md<br/><b>250-350 lines</b>"]
            D1["Schema patterns"]
            D2["RLS policies"]
        end

        subgraph WF["workflows/"]
            W["CLAUDE.md<br/><b>300-400 lines</b>"]
            W1["Temporal patterns"]
            W2["Determinism rules"]
        end
    end

    R --> A
    R --> D
    R --> W

    style R fill:#e8f5e9,stroke:#2e7d32
    style A fill:#e3f2fd,stroke:#1565c0
    style D fill:#fff3e0,stroke:#ef6c00
    style W fill:#f3e5f5,stroke:#7b1fa2
```

## Alternative View: Monolithic vs Hierarchical Comparison

```mermaid
flowchart LR
    subgraph Mono["Monolithic (Before)"]
        M1["Root CLAUDE.md<br/><b>10,000 lines</b>"]
        M2["Task: Temporal workflow"]
        M3["Relevant: ~800 lines<br/><b>8% relevance</b>"]
    end

    subgraph Hier["Hierarchical (After)"]
        H1["Root: 45 lines"]
        H2["workflows/: 180 lines"]
        H3["Total: 225 lines<br/><b>92% relevance</b>"]
    end

    Mono -->|"Refactor"| Hier

    style M3 fill:#ffcdd2
    style H3 fill:#c8e6c9
```

## Alternative View: Context Loading for Specific Task

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Claude as Claude Code
    participant Files as CLAUDE.md Files

    Dev->>Claude: Implement new Temporal workflow
    Claude->>Files: Read root CLAUDE.md (45 lines)
    Files-->>Claude: Global architecture, links

    Note over Claude: Claude sees "workflows" domain

    Claude->>Files: Read packages/workflows/CLAUDE.md (180 lines)
    Files-->>Claude: Temporal patterns, determinism rules

    Note over Claude: Total: 225 lines, 92% relevant

    Claude->>Dev: Correct workflow code (first try)
```

## Alternative View: File Size Guidelines

| Level | Target Lines | Maximum | Purpose |
|-------|-------------|---------|---------|
| **Root** | 20-50 | 100 | Global architecture, links only |
| **Domain** | 100-200 | 300 | Package-specific patterns |
| **Subdomain** | 50-150 | 200 | Highly specialized areas |

**When to create:**
- Domain file: When patterns diverge between directories
- Subdomain file: When area has unique constraints from parent
- Maximum depth: 3-4 levels

## Alternative View: Relevance Improvement

```mermaid
pie title Context Relevance (Temporal Workflow Task)
    "Relevant Content" : 8
    "Noise (other domains)" : 92
```

**Monolithic: 8% relevance**

```mermaid
pie title Context Relevance (After Hierarchical)
    "Relevant Content" : 92
    "Global Context" : 8
```

**Hierarchical: 92% relevance**

## Usage

This diagram appears in **Chapter 4, Section 4.6** (lines 165-218) where hierarchical CLAUDE.md for scaling codebases is explained. It helps readers understand the structure, sizing guidelines, and relevance improvements.

**Suggested placement**: After the problem statement (line 167) and file structure example (line 196).

## Context from Chapter

> "A 10,000-line monolithic CLAUDE.md creates a problem. When implementing a Temporal workflow, the LLM loads 10,000 lines but only 800 matter. The other 9,200 lines about API patterns, database migrations, and React components become noise that dilutes attention."
>
> "The hierarchical approach achieves 70-90% context reduction with 80-95% relevance improvement."
>
> "When working on packages/workflows/src/send-email.ts, Claude loads:
> - Root CLAUDE.md (40 lines)
> - workflows/CLAUDE.md (300 lines)
> - Total: 340 lines, 95%+ relevant"

The diagram visualizes the dramatic improvement from 8% to 92%+ relevance when using hierarchical documentation.
