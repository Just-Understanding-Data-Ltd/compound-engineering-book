# Compound Engineering Book PRD

> Master PRD for "Compound Engineering: Master AI-Assisted Development with Claude Code"

---

## Vision

Create the definitive guide for software engineers transitioning to AI-assisted development. This isn't another "prompt engineering" book. It's a complete methodology for building production systems with LLM agents.

**Unique positioning**: Written by someone with 350K+ LOC shipped using these patterns, an O'Reilly author, and an educator who's taught 304K+ learners.

---

## Target Audience

### Primary: Intermediate Developers
- 2-5 years experience
- Familiar with git, testing, CI/CD
- Curious about AI tools but haven't gone deep
- Want to 10x productivity without sacrificing quality

### Secondary: Senior Engineers
- Looking for production-grade patterns
- Want to introduce AI tooling to their teams
- Need frameworks for evaluating agent reliability
- Building their own agent infrastructure

### Tertiary: Tech Leads / Architects
- Designing AI-assisted workflows for teams
- Need to understand tradeoffs and risks
- Want case studies and real metrics

---

## Key Differentiators

1. **Beginner to Expert Journey**: Not just advanced patterns, but a complete learning path
2. **Production Focus**: Every pattern tested in real ~350K LOC codebase
3. **Claude Code Specific**: Deep integration with Claude Code CLI, not generic advice
4. **Practical Exercises**: "Try it yourself" sections in every chapter
5. **The RALPH Loop**: Novel contribution for overnight development
6. **90+ Source Articles**: Distilled from comprehensive knowledge base

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Word count | 45,000-57,000 |
| Chapters | 12 + 4 appendices |
| Code examples | 50+ |
| Diagrams | 25+ |
| Exercises | 20+ |
| Time to MVP | 2-4 weeks (with RALPH) |

---

## Content Principles

### 1. Show, Don't Tell
Every concept gets a concrete example. Abstract principles are immediately followed by code.

### 2. Progressive Complexity
Start with "hello world" level, end with production agent fleets.

### 3. Honest Tradeoffs
AI assistance isn't magic. Be clear about when it helps and when it doesn't.

### 4. Compound Thinking
Each chapter builds on previous ones. Knowledge compounds.

### 5. Immediately Applicable
Reader should be able to apply learnings within 30 minutes of reading.

---

## Chapter PRD Structure

Each chapter PRD (`ch01.md`, `ch02.md`, etc.) contains:
1. **Overview**: One-paragraph summary
2. **Learning Objectives**: 3-5 specific outcomes
3. **Source Articles**: Knowledge base articles to synthesize
4. **Outline**: Detailed section structure
5. **Key Examples**: Code examples to include
6. **Diagrams**: Visual aids needed
7. **Exercises**: "Try it yourself" activities
8. **Cross-References**: Links to other chapters
9. **Word Count Target**: Target range
10. **Status**: Draft / Review / Complete

---

## Production Workflow

### Phase 1: PRD Completion
- [ ] All chapter PRDs written and reviewed
- [ ] Diagram requirements identified
- [ ] Example code planned
- [ ] Cross-references mapped

### Phase 2: First Draft
- [ ] Run RALPH loop on each chapter
- [ ] Generate initial content from source articles
- [ ] Create all code examples
- [ ] Draft diagrams in Mermaid

### Phase 3: Review & Polish
- [ ] Technical review pass
- [ ] Style consistency pass
- [ ] Diagram finalization
- [ ] Exercise validation

### Phase 4: Leanpub Formatting
- [ ] Convert to Markua format
- [ ] Preview in Leanpub
- [ ] Fix formatting issues
- [ ] Final proofread

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Content too abstract | Require code example for every concept |
| Chapters too long | Hard cap at 5000 words per chapter |
| Diagrams missing | Dedicated diagram review pass |
| Outdated info | Focus on principles over specific versions |
| AI-sounding text | No em dashes, varied sentence structure |

---

## Tools & Infrastructure

- **Writing**: Claude Code with RALPH loop
- **Version Control**: Git with atomic commits
- **Diagrams**: Mermaid (rendered to PNG)
- **Publishing**: Leanpub (Markua format)
- **Review**: Claude Code sub-agents for consistency

---

## Related Documents

- [[toc|Table of Contents]]
- [[ch01|Chapter 1 PRD]]
- [[ch02|Chapter 2 PRD]]
- ... (all chapter PRDs)
