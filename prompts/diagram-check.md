# Diagram Opportunity Checker

You are reviewing content to identify where diagrams would improve comprehension.

## Diagram Criteria

A diagram is valuable when:
1. **Process flows** - Steps that happen in sequence
2. **Architecture** - Components and their relationships
3. **Hierarchies** - Nested or layered structures
4. **Comparisons** - Before/after, options, tradeoffs
5. **Mental models** - Abstract concepts that benefit from visualization

## What to Look For

### High Priority (Must Have)
- Multi-step workflows (RALPH loop, verification ladder)
- System architectures (harness layers, sub-agent patterns)
- Component relationships (CLAUDE.md hierarchy)

### Medium Priority (Should Have)
- Decision trees (when to use which pattern)
- Timelines (evolution of AI coding)
- Data flows (context through the system)

### Low Priority (Nice to Have)
- Simple lists that could be tables
- Concepts well-explained in text
- One-time illustrations

## Output Format

```
## Diagram Opportunities

### Must Have
1. **[Name]**: [What it shows] - [Section/chapter]
   Type: [flowchart|architecture|hierarchy|comparison]
   Complexity: [simple|medium|complex]

### Should Have
1. ...

### Nice to Have
1. ...

## Recommended Mermaid Diagrams

For each "Must Have", provide a Mermaid diagram draft:

[Name]
```mermaid
[diagram code]
```
```

## Diagram Style Guide

- Use consistent colors across diagrams
- Keep text concise (3-5 words per node)
- Left-to-right or top-to-bottom flow
- Maximum 10-15 nodes per diagram
- Include a title/caption
