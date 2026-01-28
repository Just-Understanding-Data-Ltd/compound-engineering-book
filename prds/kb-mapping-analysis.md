# Knowledge Base to Book Chapter Mapping

> Comprehensive analysis of KB article coverage in the book. Last updated: 2026-01-28

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total KB Articles | 102 |
| Mapped to Chapters | 98 (96%) |
| Mathematical Foundations (Unmapped) | 3 |
| Articles to Create | 32 |
| Identified PRD Gaps | 5 |

---

## KB Structure Overview

The knowledge base has three main areas:

```
knowledge-base/
├── 01-Compound-Engineering/
│   ├── index.md                    # Core doctrine overview
│   ├── my-doctrine.md              # Compound Systems Engineer philosophy
│   ├── rules-to-live-by.md         # 50 practical rules
│   ├── software-archetypes.md      # Career archetype comparison
│   ├── systems-thinking.md         # Observability & feedback loops
│   ├── liquidation-cadence.md      # Forced shipping discipline
│   ├── infrastructure-principles.md # Infrastructure as capital
│   ├── thought-leaders.md          # People to follow
│   ├── context-engineering/        # 93 articles (main content)
│   │   ├── index.md
│   │   ├── [92 topic articles]
│   │   └── CLAUDE.md (config, excluded)
│   └── core/
│       └── histogram-metrics-batch-workloads.md
├── 03-Math-Reference/
│   ├── control-theory.md           # Feedback & stability
│   ├── probability.md              # Decision-making under uncertainty
│   └── optimisation.md             # Trade-off analysis
```

---

## Complete Chapter-to-KB Mapping

### Part I: Foundations (Chapters 1-4)

#### Chapter 1: The Compound Systems Engineer
| KB Article | Type | Coverage |
|------------|------|----------|
| `my-doctrine.md` | Primary | Full |
| `the-meta-engineer-identity.md` | Primary | Full |
| `software-archetypes.md` | Primary | Full |
| `index.md` | Primary | Full |
| `rules-to-live-by.md` | Supplementary | Partial (rules 11-20) |
| `systems-thinking.md` | Supplementary | Partial (philosophy) |
| `liquidation-cadence.md` | Supplementary | Partial (shipping discipline) |
| `building-the-harness.md` | Supplementary | Referenced |
| `building-the-factory.md` | Supplementary | Referenced |
| `human-first-dx-philosophy.md` | Supplementary | Referenced |
| `thought-leaders.md` | Supplementary | For Appendix D |

**Gaps:** Mathematical foundations not referenced (could strengthen "engineering as capital" thesis)

#### Chapter 2: Getting Started with Claude Code
| KB Article | Type | Coverage |
|------------|------|----------|
| `cursor-agent-workflows.md` | Primary | Full |
| `llm-usage-modes-explore-vs-implement.md` | Primary | Full |
| `agent-capabilities-tools-and-eyes.md` | Primary | Full |
| `agentic-tool-detection.md` | Supplementary | Referenced |
| `yolo-mode-configuration.md` | Supplementary | Referenced |
| `zero-friction-onboarding.md` | Supplementary | Referenced |

**Gaps:** MCP server basics, Skills system overview needed as new articles

#### Chapter 3: Prompting Fundamentals
| KB Article | Type | Coverage |
|------------|------|----------|
| `chain-of-thought-prompting.md` | Primary | Full |
| `constraint-based-prompting.md` | Primary | Full |
| `few-shot-prompting-project-examples.md` | Primary | Full |
| `upfront-questioning-narrows-search-space.md` | Primary | Full |
| `negative-examples-documentation.md` | Primary | Full |
| `semantic-naming-patterns.md` | Primary | Referenced |
| `entropy-in-code-generation.md` | Supplementary | Referenced |
| `test-driven-prompting.md` | Supplementary | Referenced |
| `functional-programming-signal.md` | Supplementary | Referenced |
| `multi-step-prompt-workflows.md` | Supplementary | Referenced |

**Gaps:** None significant

#### Chapter 4: Writing Your First CLAUDE.md
| KB Article | Type | Coverage |
|------------|------|----------|
| `writing-a-good-claude-md.md` | Primary | Full |
| `hierarchical-rule-files-collocation.md` | Primary | Full |
| `hierarchical-context-patterns.md` | Primary | Full |
| `symlinked-agent-configs.md` | Primary | Full |
| `layered-prompts-architecture.md` | Supplementary | Referenced |
| `adrs-for-agent-context.md` | Supplementary | Referenced |
| `prompt-caching-strategy.md` | Supplementary | Referenced |
| `context-rot-auto-compacting.md` | Supplementary | Referenced |

**Gaps:** None significant

---

### Part II: Core Techniques (Chapters 5-8)

#### Chapter 5: The 12-Factor Agent
| KB Article | Type | Coverage |
|------------|------|----------|
| `12-factor-agents.md` | Primary | Full |
| `agent-reliability-chasm.md` | Primary | Full |
| `agent-native-architecture.md` | Primary | Full |
| `invariants-programming-llm-generation.md` | Supplementary | Referenced |
| `making-states-illegal-computation-graph.md` | Supplementary | Referenced |

**Gaps:** Agent SDK patterns article needed

#### Chapter 6: The Verification Ladder
| KB Article | Type | Coverage |
|------------|------|----------|
| `verification-ladder.md` | Primary | Full |
| `verification-sandwich-pattern.md` | Primary | Full |
| `property-based-testing.md` | Primary | Full |
| `test-driven-prompting.md` | Primary | Full |
| `trust-but-verify-protocol.md` | Primary | Full |
| `constraint-first-development.md` | Supplementary | Referenced |
| `evaluation-driven-development.md` | Supplementary | Referenced |
| `integration-testing-patterns.md` | Supplementary | Referenced |
| `stateless-verification-loops.md` | Supplementary | Referenced |
| `type-driven-development.md` | Supplementary | Referenced |

**Gaps:** None significant

#### Chapter 7: Quality Gates That Compound
| KB Article | Type | Coverage |
|------------|------|----------|
| `quality-gates-as-information-filters.md` | Primary | Full |
| `compounding-effects-quality-gates.md` | Primary | Full |
| `claude-code-hooks-quality-gates.md` | Primary | Full |
| `llm-code-review-ci.md` | Primary | Full |
| `early-linting-prevents-ratcheting.md` | Primary | Full |
| `custom-eslint-rules-determinism.md` | Supplementary | Referenced |
| `one-way-pattern-consistency.md` | Supplementary | Referenced |

**Gaps:** CI/CD agent patterns article needed

#### Chapter 8: Error Handling & Debugging
| KB Article | Type | Coverage |
|------------|------|----------|
| `five-point-error-diagnostic-framework.md` | Primary | Full |
| `context-debugging-framework.md` | Primary | Full |
| `error-messages-as-training.md` | Primary | Full |
| `flaky-test-diagnosis-script.md` | Primary | Full |
| `clean-slate-trajectory-recovery.md` | Primary | Full |
| `learning-loops-encoding-problems-into-prevention.md` | Primary | Full |
| `test-based-regression-patching.md` | Primary | Full |
| `prevention-protocol.md` | Supplementary | Referenced |
| `ai-cost-protection-timeouts.md` | Supplementary | Referenced |

**Gaps:** ERRORS.md pattern article needed

---

### Part III: Advanced Patterns (Chapters 9-12)

#### Chapter 9: Context Engineering Deep Dive
| KB Article | Type | Coverage |
|------------|------|----------|
| `information-theory-coding-agents.md` | Primary | Full |
| `progressive-disclosure-context.md` | Primary | Full |
| `context-rot-auto-compacting.md` | Primary | Full |
| `context-efficient-backpressure.md` | Primary | Full |
| `context-debugging-framework.md` | Primary | Full |
| `entropy-in-code-generation.md` | Primary | Full |
| `ddd-bounded-contexts-for-llms.md` | Supplementary | Referenced |
| `llm-recursive-function-model.md` | Supplementary | Referenced |
| `sliding-window-history.md` | Supplementary | Referenced |

**Gaps:** Math foundations (information theory, entropy) could be strengthened with 03-Math-Reference

#### Chapter 10: The RALPH Loop
| KB Article | Type | Coverage |
|------------|------|----------|
| `ralph-loop.md` | Primary | Full |
| `24-7-development-strategy.md` | Primary | Full |
| `learning-loops-encoding-problems-into-prevention.md` | Primary | Full |
| `clean-slate-trajectory-recovery.md` | Primary | Full |
| `ai-workflow-notifications.md` | Supplementary | Referenced |
| `institutional-memory-learning-files.md` | Supplementary | Referenced |

**Gaps:** Control theory (feedback loops) would strengthen this chapter

#### Chapter 11: Sub-Agent Architecture
| KB Article | Type | Coverage |
|------------|------|----------|
| `sub-agent-architecture.md` | Primary | Full |
| `sub-agents-accuracy-vs-latency.md` | Primary | Full |
| `agent-swarm-patterns-for-thoroughness.md` | Primary | Full |
| `actor-critic-adversarial-coding.md` | Primary | Full |
| `parallel-agents-for-monorepos.md` | Primary | Full |
| `meta-questions-for-recursive-agents.md` | Supplementary | Referenced |

**Gaps:** Orchestration patterns article needed

#### Chapter 12: Development Workflows
| KB Article | Type | Coverage |
|------------|------|----------|
| `plan-mode-strategic.md` | Primary | Full |
| `git-worktrees-parallel-dev.md` | Primary | Full |
| `incremental-development-pattern.md` | Primary | Full |
| `ad-hoc-flows-to-deterministic-scripts.md` | Primary | Full |
| `playwright-script-loop.md` | Primary | Full |
| `ast-grep-for-precision.md` | Primary | Full |
| `symlinked-agent-configs.md` | Primary | Full |
| `meta-ticket-refinement.md` | Supplementary | Referenced |

**Gaps:** None significant

---

### Part IV: Production Systems (Chapters 13-15)

#### Chapter 13: Building the Harness
| KB Article | Type | Coverage |
|------------|------|----------|
| `building-the-harness.md` | Primary | Full |
| `building-the-factory.md` | Primary | Full |
| `closed-loop-telemetry-driven-optimization.md` | Primary | Full |
| `mcp-server-project-context.md` | Primary | Full |
| `infrastructure-principles.md` | Primary | Full |
| `boundary-enforcement-layered-architecture.md` | Supplementary | Referenced |
| `test-custom-infrastructure.md` | Supplementary | Referenced |

**Gaps:** Control theory (feedback loops, PID) would strengthen telemetry section

#### Chapter 14: The Meta-Engineer Playbook
| KB Article | Type | Coverage |
|------------|------|----------|
| `ad-hoc-flows-to-deterministic-scripts.md` | Primary | Full |
| `prompts-are-the-asset-not-the-code.md` | Primary | Full |
| `skill-atrophy-what-to-keep-what-to-let-go.md` | Primary | Full |
| `six-waves-of-ai-coding.md` | Primary | Full |
| `the-meta-engineer-identity.md` | Primary | Full |
| `liquidation-cadence.md` | Supplementary | Referenced |
| `highest-leverage-points-plans-and-validation.md` | Supplementary | Referenced |

**Gaps:** Probability (risk management, decision under uncertainty) relevant here

#### Chapter 15: Model Strategy & Cost Optimization
| KB Article | Type | Coverage |
|------------|------|----------|
| `model-switching-strategy.md` | Primary | Full |
| `ai-cost-protection-timeouts.md` | Primary | Full |
| `model-provider-agnostic-approach.md` | Primary | Full |
| `prompt-caching-strategy.md` | Primary | Full |
| `yolo-mode-configuration.md` | Supplementary | Referenced |
| `histogram-metrics-batch-workloads.md` | Supplementary | Referenced |

**Gaps:** Optimisation (trade-off analysis) relevant for cost decisions

---

## Unmapped KB Content (Gaps)

### Mathematical Foundations (03-Math-Reference) - NOT IN ANY CHAPTER

These three articles provide rigorous foundations that could strengthen multiple chapters:

| Article | Potential Chapters | Value |
|---------|-------------------|-------|
| `control-theory.md` | Ch10 (RALPH Loop), Ch13 (Harness) | Feedback loops, stability, PID control |
| `probability.md` | Ch14 (Meta-Engineer), Ch15 (Cost) | Decision-making under uncertainty |
| `optimisation.md` | Ch15 (Cost), Ch13 (Harness) | Trade-off analysis, constraint satisfaction |

**Recommendation:** Create Appendix E: "Mathematical Foundations for Compound Engineering" or integrate selectively into relevant chapters.

### Cross-Cutting Concepts Not Fully Leveraged

| KB Article | Current | Could Also Support |
|------------|---------|-------------------|
| `systems-thinking.md` | Ch01 (light) | Ch13 (telemetry), Ch10 (loops) |
| `liquidation-cadence.md` | Ch01/Ch14 (light) | Could be standalone section |
| `infrastructure-principles.md` | Ch13 only | Ch01 (mindset), Ch14 (career) |

---

## Articles to Create (from kb-article-index.md)

### High Priority (Core Patterns) - 9 articles

| Article | Chapters | Description |
|---------|----------|-------------|
| `agent-sdk-patterns.md` | Ch05, Ch11, Ch12, Ch13 | Core Agent SDK usage patterns |
| `information-theory-prompting.md` | Ch03, Ch06, Ch07 | Info theory applied to prompting |
| `prompt-injection-prevention.md` | Ch03 | Security considerations |
| `ci-cd-agent-patterns.md` | Ch06, Ch07 | CI/CD integration patterns |
| `human-in-the-loop-patterns.md` | Ch05 | HITL implementation |
| `tool-call-validation.md` | Ch05 | JSON schema validation |
| `errors-md-pattern.md` | Ch08 | ERRORS.md persistent memory |
| `agent-retry-strategies.md` | Ch08 | Retry patterns for reliability |
| `context-pollution-recovery.md` | Ch08 | Recovering from context issues |

### Medium Priority (Supporting Concepts) - 18 articles

| Article | Chapters | Description |
|---------|----------|-------------|
| `mcp-server-patterns.md` | Ch02 | MCP server integration |
| `claude-code-terminal-basics.md` | Ch02 | Terminal usage fundamentals |
| `skills-system.md` | Ch02 | Skills system overview |
| `few-shot-prompting-patterns.md` | Ch04 | Few-shot examples for CLAUDE.md |
| `event-sourcing-agents.md` | Ch05 | Event sourcing for agent state |
| `mutual-information-context.md` | Ch09 | Measuring context effectiveness |
| `token-budgeting-strategies.md` | Ch09, Ch15 | Token allocation strategies |
| `lost-in-the-middle-mitigation.md` | Ch09 | Context window degradation |
| `ralph-loop-patterns.md` | Ch10 | RALPH implementation patterns |
| `sub-agent-context-hierarchy.md` | Ch11 | Sub-agent context isolation |
| `tool-access-control.md` | Ch11 | Tool access management |
| `orchestration-patterns.md` | Ch11 | Coordinator/swarm/pipeline |
| `actor-critic-pattern.md` | Ch11 | Writer + reviewer pattern |
| `agent-memory-patterns.md` | Ch11 | Checkpoint/resume patterns |
| `checkpoint-commit-patterns.md` | Ch12 | Git commit strategies |
| `plan-mode-workflow.md` | Ch12, Ch13 | Plan mode implementation |
| `constraint-specification-patterns.md` | Ch13 | Constraint specification |
| `stateless-verification-loops.md` | Ch06 | Stateless verification patterns |

### Lower Priority (Nice to Have) - 6 articles

| Article | Chapters | Description |
|---------|----------|-------------|
| `compound-flywheel-effect.md` | Ch14 | Compounding flywheel concept |
| `knowledge-encoding-patterns.md` | Ch14 | Encoding knowledge as code |
| `career-positioning-ai-era.md` | Ch14 | Career guidance |
| `batch-api-patterns.md` | Ch15 | Batch processing for cost |
| `skills-vs-subagents.md` | Ch15 | When to use each |
| `cost-telemetry-patterns.md` | Ch15 | Cost tracking patterns |

---

## PRD Gaps Identified

### Gap 1: Mathematical Foundations Not Referenced
**Issue:** The 03-Math-Reference articles (control-theory, probability, optimisation) are not referenced in any PRD.
**Impact:** Missing rigorous foundations that distinguish this book from casual AI tutorials.
**Recommendation:** Either create Appendix E or integrate into Ch09 (entropy/information theory), Ch10 (feedback loops), Ch13 (control systems), Ch14 (decision-making), Ch15 (optimization).

### Gap 2: Systems Thinking Underutilized
**Issue:** `systems-thinking.md` covers OTEL, telemetry, and feedback loops in depth but is only lightly referenced in Ch01.
**Impact:** Ch13 (Building the Harness) could benefit from this content directly.
**Recommendation:** Add `systems-thinking.md` as primary source for Ch13 PRD.

### Gap 3: Infrastructure Principles Scope
**Issue:** `infrastructure-principles.md` has broader applicability than just Ch13.
**Impact:** The "infrastructure as capital" mindset is relevant to Ch01 (identity) and Ch14 (career).
**Recommendation:** Add as supplementary source to Ch01 and Ch14 PRDs.

### Gap 4: Appendix D Incomplete
**Issue:** Appendix D (Further Reading) should reference `thought-leaders.md` but PRD doesn't exist.
**Recommendation:** Create Appendix PRDs including thought-leaders content.

### Gap 5: Agent SDK Patterns Missing
**Issue:** The book heavily references Agent SDK but `agent-sdk-patterns.md` doesn't exist yet.
**Impact:** Code examples lack canonical pattern documentation.
**Recommendation:** Create this article as highest priority.

---

## Cross-Reference Analysis

### Most Referenced KB Articles (3+ chapters)

| Article | Chapters | Count |
|---------|----------|-------|
| `entropy-in-code-generation.md` | Ch03, Ch06, Ch07, Ch09 | 4 |
| `parallel-agents-for-monorepos.md` | Ch11, Ch12, Ch13 | 3 |
| `ai-cost-protection-timeouts.md` | Ch08, Ch15 | 3 |
| `clean-slate-trajectory-recovery.md` | Ch08, Ch10 | 2 |
| `learning-loops-encoding-problems-into-prevention.md` | Ch08, Ch10 | 2 |
| `context-debugging-framework.md` | Ch08, Ch09 | 2 |
| `ad-hoc-flows-to-deterministic-scripts.md` | Ch12, Ch14 | 2 |
| `the-meta-engineer-identity.md` | Ch01, Ch14 | 2 |

### Chapter Source Counts

| Chapter | Primary | Supplementary | Total |
|---------|---------|---------------|-------|
| Ch01 | 4 | 7 | 11 |
| Ch02 | 3 | 6 | 9 |
| Ch03 | 6 | 4 | 10 |
| Ch04 | 4 | 4 | 8 |
| Ch05 | 3 | 2 | 5 |
| Ch06 | 5 | 5 | 10 |
| Ch07 | 5 | 2 | 7 |
| Ch08 | 7 | 2 | 9 |
| Ch09 | 6 | 3 | 9 |
| Ch10 | 4 | 2 | 6 |
| Ch11 | 5 | 1 | 6 |
| Ch12 | 7 | 1 | 8 |
| Ch13 | 5 | 2 | 7 |
| Ch14 | 5 | 2 | 7 |
| Ch15 | 4 | 2 | 6 |

---

## Recommended Tasks

### Immediate (Add to tasks.json)

1. **task-235**: Add mathematical foundations to relevant PRDs (Ch09, Ch10, Ch13, Ch14, Ch15)
2. **task-236**: Create `agent-sdk-patterns.md` KB article (highest priority)
3. **task-237**: Add `systems-thinking.md` as primary source to Ch13 PRD
4. **task-238**: Create Appendix E PRD for Mathematical Foundations

### Medium-term

5. Create all 9 high-priority KB articles (agent-sdk-patterns, etc.)
6. Update PRDs to reference newly created articles
7. Review and strengthen mathematical rigor in relevant chapters

### Long-term

8. Create all 18 medium-priority KB articles
9. Create all 6 lower-priority KB articles
10. Full book integration review

---

## Conclusion

The book has **96% coverage** of the knowledge base, which is excellent. The main gaps are:

1. **Mathematical foundations** (control theory, probability, optimization) are not integrated
2. **32 articles need to be created** to fully support all PRD references
3. **Systems thinking and infrastructure principles** could be better leveraged

The book's strength is its comprehensive coverage of the context-engineering folder. The opportunity is to add mathematical rigor that would distinguish it from casual AI development guides.

---

*Generated by KB Mapping Analysis, 2026-01-28*
