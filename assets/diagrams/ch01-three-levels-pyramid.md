# Chapter 1: The Three Levels of Engineering

## Diagram Description
A pyramid visualization showing the three levels of engineering work, from Level 1 (most common) at the base to Level 3 (meta-engineering) at the top. Each level shows the type of output, leverage characteristics, and time to competence.

## Mermaid Code

```mermaid
flowchart TB
    subgraph Pyramid["The Three Levels of Engineering"]
        direction TB

        subgraph L3["Level 3: Write Systems That Write Systems"]
            L3_output["Output: AI pipelines, self-improving harnesses, constraint systems"]
            L3_leverage["Leverage: Compounds (future projects inherit past investments)"]
            L3_time["Time to Competence: 3-5 years"]
        end

        subgraph L2["Level 2: Write Systems"]
            L2_output["Output: Architecture, frameworks, observability infrastructure"]
            L2_leverage["Leverage: Sublinear (reusable but requires tuning)"]
            L2_time["Time to Competence: 2-3 years"]
        end

        subgraph L1["Level 1: Write Code"]
            L1_output["Output: Features, bug fixes, technical debt reduction"]
            L1_leverage["Leverage: Linear (more code = more time)"]
            L1_time["Time to Competence: Months"]
        end
    end

    L1 --> L2 --> L3

    subgraph Multiplier["Output Multiplier"]
        M1["Level 1: 1x"]
        M2["Level 2: 2x"]
        M3["Level 3: 10x (and growing)"]
    end
```

## Alternative: Horizontal Pyramid View

```mermaid
flowchart LR
    subgraph Base["Most Engineers"]
        L1["Level 1\nWrite Code\n1x Output"]
    end

    subgraph Middle["Some Engineers"]
        L2["Level 2\nWrite Systems\n2x Output"]
    end

    subgraph Top["Meta-Engineers"]
        L3["Level 3\nWrite Systems\nThat Write Systems\n10x Output"]
    end

    L1 -->|"Years of\nDeliberate\nPractice"| L2 -->|"Systems\nThinking +\nAI Skills"| L3
```

## Simple Table View

```mermaid
flowchart TB
    subgraph Comparison["Engineering Levels Comparison"]
        direction LR

        subgraph Level1["Level 1"]
            A1["Write Code"]
            A2["Linear Leverage"]
            A3["Months to Learn"]
            A4["1x Output"]
        end

        subgraph Level2["Level 2"]
            B1["Write Systems"]
            B2["Sublinear Leverage"]
            B3["Years to Learn"]
            B4["2x Output"]
        end

        subgraph Level3["Level 3"]
            C1["Meta-Systems"]
            C2["Compound Leverage"]
            C3["3-5 Years"]
            C4["10x+ Output"]
        end
    end

    Level1 --> Level2 --> Level3
```

## Usage
This diagram should appear in the "Three Levels of Engineering" section (around line 55-66 of Chapter 1). It visualizes the core progression from writing code to writing systems to writing systems that write systems. Use the first diagram for detailed presentations, or the alternative views for simpler inline references.

## Context from Chapter
The chapter explains:
- Level 1: Most engineers stop here. Output is features and bug fixes. Leverage is linear.
- Level 2: Some engineers reach this level. Output is architecture and frameworks. Leverage becomes sublinear.
- Level 3: Meta-engineers operate here. Output is AI pipelines and self-improving systems. Leverage compounds.

The key insight: "You have probably been operating at Level 1. You can reach Level 2 within a few years. Level 3 is where the game fundamentally changes."
