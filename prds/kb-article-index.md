# Knowledge Base Article Index

> Complete index of all KB articles and their chapter references. This ensures 100% coverage of the knowledge base.

**Last Updated**: 2026-01-28
**Total PRD Files**: 16
**Total KB Articles**: 93 (context-engineering) + 9 (parent/core) + 3 (03-Math-Reference) = 105 total
**Referenced**: 98 articles (93%)
**To Be Created**: 32 articles
**Gap Analysis**: See [kb-mapping-analysis.md](kb-mapping-analysis.md) for comprehensive mapping

**NEW (2026-01-28):** Added comprehensive gap analysis identifying:
- 3 Mathematical Foundation articles NOT in any chapter (control-theory, probability, optimisation)
- 32 KB articles to be created (9 high priority, 18 medium, 6 lower)
- 5 PRD gaps to address
- Cross-reference analysis showing most-referenced articles

---

## Overview

This index ensures every KB article has at least one PRD reference. Articles are organized by chapter with both primary (core content) and supplementary (supporting concepts) designations.

**Coverage Summary:**
- context-engineering/: 92/93 referenced (CLAUDE.md excluded as config file)
- parent directory: 9/9 referenced
- Phantom references fixed: 10 articles moved to "TO BE CREATED"

---

## Chapter-to-Article Mapping

### Chapter 1: The Compound Systems Engineer (`ch01.md`)

**Primary Sources:**
- `my-doctrine.md`
- `the-meta-engineer-identity.md`
- `software-archetypes.md`
- `index.md`

**Supplementary Sources:**
- `liquidation-cadence.md`
- `building-the-harness.md`
- `building-the-factory.md`
- `human-first-dx-philosophy.md` **(NEW)**
- `rules-to-live-by.md` **(NEW - parent directory)**
- `systems-thinking.md` **(NEW - parent directory)**
- `thought-leaders.md` **(NEW - parent directory, reference)**

---

### Chapter 2: Getting Started with Claude Code (`ch02.md`)

**Primary Sources:**
- `cursor-agent-workflows.md`
- `llm-usage-modes-explore-vs-implement.md`
- `agent-capabilities-tools-and-eyes.md`

**Supplementary Sources:**
- `agentic-tool-detection.md` **(NEW)**
- `yolo-mode-configuration.md` **(NEW - replaces phantom yolo-mode-patterns.md)**
- `zero-friction-onboarding.md` **(NEW)**
- `mcp-server-patterns.md` **(TO BE CREATED)**
- `claude-code-terminal-basics.md` **(TO BE CREATED)**
- `skills-system.md` **(TO BE CREATED)**

---

### Chapter 3: Prompting Fundamentals (`ch03-prompting-fundamentals.md`)

**Primary Sources:**
- `chain-of-thought-prompting.md`
- `constraint-based-prompting.md`
- `few-shot-prompting-project-examples.md`
- `upfront-questioning-narrows-search-space.md`
- `negative-examples-documentation.md`
- `semantic-naming-patterns.md`

**Supplementary Sources:**
- `entropy-in-code-generation.md`
- `test-driven-prompting.md`
- `functional-programming-signal.md` **(NEW)**
- `multi-step-prompt-workflows.md` **(NEW)**
- `information-theory-prompting.md` **(TO BE CREATED)**
- `prompt-injection-prevention.md` **(TO BE CREATED)**

---

### Chapter 4: Writing Your First CLAUDE.md (`ch03.md` - now ch04)

**Primary Sources:**
- `writing-a-good-claude-md.md`
- `hierarchical-rule-files-collocation.md`
- `hierarchical-context-patterns.md`
- `symlinked-agent-configs.md`

**Supplementary Sources:**
- `prompt-caching-strategy.md`
- `context-rot-auto-compacting.md`
- `adrs-for-agent-context.md` **(NEW)**
- `layered-prompts-architecture.md` **(NEW)**
- `few-shot-prompting-patterns.md` **(TO BE CREATED)**

---

### Chapter 5: The 12-Factor Agent (`ch04.md` - now ch05)

**Primary Sources:**
- `12-factor-agents.md`
- `agent-reliability-chasm.md`
- `agent-native-architecture.md`

**Supplementary Sources:**
- `invariants-programming-llm-generation.md` **(NEW)**
- `making-states-illegal-computation-graph.md` **(NEW)**
- `agent-sdk-patterns.md` **(TO BE CREATED)**
- `human-in-the-loop-patterns.md` **(TO BE CREATED)**
- `event-sourcing-agents.md` **(TO BE CREATED)**
- `tool-call-validation.md` **(TO BE CREATED)**

---

### Chapter 6: The Verification Ladder (`ch05.md` - now ch06)

**Primary Sources:**
- `verification-ladder.md`
- `verification-sandwich-pattern.md`
- `property-based-testing.md`
- `test-driven-prompting.md`
- `trust-but-verify-protocol.md`

**Supplementary Sources:**
- `entropy-in-code-generation.md`
- `agent-reliability-chasm.md`
- `constraint-first-development.md`
- `evaluation-driven-development.md` **(NEW)**
- `integration-testing-patterns.md` **(NEW)**
- `stateless-verification-loops.md` **(NEW)**
- `type-driven-development.md` **(NEW)**
- `information-theory-prompting.md` **(TO BE CREATED)**
- `ci-cd-agent-patterns.md` **(TO BE CREATED)**

---

### Chapter 7: Quality Gates That Compound (`ch06.md` - now ch07)

**Primary Sources:**
- `quality-gates-as-information-filters.md`
- `compounding-effects-quality-gates.md`
- `claude-code-hooks-quality-gates.md`
- `llm-code-review-ci.md`
- `early-linting-prevents-ratcheting.md`

**Supplementary Sources:**
- `entropy-in-code-generation.md`
- `constraint-first-development.md`
- `custom-eslint-rules-determinism.md` **(NEW)**
- `one-way-pattern-consistency.md` **(NEW)**
- `information-theory-prompting.md` **(TO BE CREATED)**
- `ci-cd-agent-patterns.md` **(TO BE CREATED)**

---

### Chapter 8: Error Handling & Debugging (`ch08-error-handling.md`)

**Primary Sources:**
- `five-point-error-diagnostic-framework.md`
- `context-debugging-framework.md`
- `error-messages-as-training.md`
- `flaky-test-diagnosis-script.md`
- `clean-slate-trajectory-recovery.md`
- `learning-loops-encoding-problems-into-prevention.md`
- `test-based-regression-patching.md`

**Supplementary Sources:**
- `ai-cost-protection-timeouts.md`
- `prevention-protocol.md` **(NEW)**
- `errors-md-pattern.md` **(TO BE CREATED)**
- `agent-retry-strategies.md` **(TO BE CREATED)**
- `context-pollution-recovery.md` **(TO BE CREATED)**

---

### Chapter 9: Context Engineering Deep Dive (`ch07.md` - now ch09)

**Primary Sources:**
- `information-theory-coding-agents.md`
- `progressive-disclosure-context.md`
- `context-rot-auto-compacting.md`
- `context-efficient-backpressure.md`
- `context-debugging-framework.md`

**Supplementary Sources:**
- `entropy-in-code-generation.md`
- `ddd-bounded-contexts-for-llms.md` **(NEW)**
- `llm-recursive-function-model.md` **(NEW)**
- `sliding-window-history.md` **(NEW)**
- `mutual-information-context.md` **(TO BE CREATED)**
- `token-budgeting-strategies.md` **(TO BE CREATED)**
- `lost-in-the-middle-mitigation.md` **(TO BE CREATED)**

---

### Chapter 10: The RALPH Loop (`ch08.md` - now ch10)

**Primary Sources:**
- `ralph-loop.md`
- `24-7-development-strategy.md`
- `learning-loops-encoding-problems-into-prevention.md`
- `clean-slate-trajectory-recovery.md`

**Supplementary Sources:**
- `ai-workflow-notifications.md` **(NEW)**
- `institutional-memory-learning-files.md` **(NEW)**
- `ralph-loop-patterns.md` **(TO BE CREATED)**

---

### Chapter 11: Sub-Agent Architecture (`ch09.md` - now ch11)

**Primary Sources:**
- `sub-agent-architecture.md`
- `sub-agents-accuracy-vs-latency.md`
- `agent-swarm-patterns-for-thoroughness.md`
- `actor-critic-adversarial-coding.md`
- `parallel-agents-for-monorepos.md`

**Supplementary Sources:**
- `meta-questions-for-recursive-agents.md` **(NEW)**
- `sub-agent-context-hierarchy.md` **(TO BE CREATED)**
- `tool-access-control.md` **(TO BE CREATED)**
- `orchestration-patterns.md` **(TO BE CREATED)**
- `actor-critic-pattern.md` **(TO BE CREATED)**
- `agent-memory-patterns.md` **(TO BE CREATED)**
- `agent-sdk-patterns.md` **(TO BE CREATED)**

---

### Chapter 12: Development Workflows (`ch12-development-workflows.md`)

**Primary Sources:**
- `plan-mode-strategic.md`
- `git-worktrees-parallel-dev.md`
- `incremental-development-pattern.md`
- `ad-hoc-flows-to-deterministic-scripts.md`
- `playwright-script-loop.md`
- `ast-grep-for-precision.md`
- `symlinked-agent-configs.md`

**Supplementary Sources:**
- `parallel-agents-for-monorepos.md`
- `llm-usage-modes-explore-vs-implement.md`
- `meta-ticket-refinement.md` **(NEW)**
- `checkpoint-commit-patterns.md` **(TO BE CREATED)**
- `plan-mode-workflow.md` **(TO BE CREATED)**
- `agent-sdk-patterns.md` **(TO BE CREATED)**

---

### Chapter 13: Building the Harness (`ch10.md` - now ch13)

**Primary Sources:**
- `building-the-harness.md`
- `building-the-factory.md`
- `closed-loop-telemetry-driven-optimization.md`
- `mcp-server-project-context.md`
- `infrastructure-principles.md`

**Supplementary Sources:**
- `parallel-agents-for-monorepos.md`
- `boundary-enforcement-layered-architecture.md` **(NEW)**
- `test-custom-infrastructure.md` **(NEW)**
- `constraint-specification-patterns.md` **(TO BE CREATED)**
- `agent-sdk-patterns.md` **(TO BE CREATED)**
- `plan-mode-workflow.md` **(TO BE CREATED)**

---

### Chapter 14: The Meta-Engineer Playbook (`ch11.md` - now ch14)

**Primary Sources:**
- `ad-hoc-flows-to-deterministic-scripts.md`
- `prompts-are-the-asset-not-the-code.md`
- `skill-atrophy-what-to-keep-what-to-let-go.md`
- `six-waves-of-ai-coding.md`
- `the-meta-engineer-identity.md`

**Supplementary Sources:**
- `liquidation-cadence.md`
- `highest-leverage-points-plans-and-validation.md` **(NEW)**
- `compound-flywheel-effect.md` **(TO BE CREATED)**
- `knowledge-encoding-patterns.md` **(TO BE CREATED)**
- `career-positioning-ai-era.md` **(TO BE CREATED)**

---

### Chapter 15: Model Strategy & Cost Optimization (`ch15-model-strategy.md`)

**Primary Sources:**
- `model-switching-strategy.md`
- `ai-cost-protection-timeouts.md`
- `model-provider-agnostic-approach.md`
- `prompt-caching-strategy.md`

**Supplementary Sources:**
- `yolo-mode-configuration.md` **(NEW)**
- `histogram-metrics-batch-workloads.md` **(NEW - core/ directory)**
- `batch-api-patterns.md` **(TO BE CREATED)**
- `token-budgeting-strategies.md` **(TO BE CREATED)**
- `skills-vs-subagents.md` **(TO BE CREATED)**
- `cost-telemetry-patterns.md` **(TO BE CREATED)**

---

### Chapter 12 Legacy: Case Studies & Reference (`ch12.md` - deprecated)

> This chapter was replaced by ch15 (Model Strategy). Content redistributed.

**Primary Sources:**
- `model-switching-strategy.md` → moved to ch15
- `ai-cost-protection-timeouts.md` → moved to ch15, ch08
- `five-point-error-diagnostic-framework.md` → moved to ch08
- `flaky-test-diagnosis-script.md` → moved to ch08

---

## Reverse Index: Article-to-Chapter Mapping

### Most Referenced Articles (3+ chapters)

| Article | Chapters | Count |
|---------|----------|-------|
| `entropy-in-code-generation.md` | ch03, ch06, ch07, ch09 | 4 |
| `parallel-agents-for-monorepos.md` | ch11, ch12, ch13 | 3 |
| `ai-cost-protection-timeouts.md` | ch08, ch15, (ch12-legacy) | 3 |
| `constraint-first-development.md` | ch06, ch07 | 2 |
| `the-meta-engineer-identity.md` | ch01, ch14 | 2 |
| `liquidation-cadence.md` | ch01, ch14 | 2 |
| `building-the-harness.md` | ch01, ch13 | 2 |
| `building-the-factory.md` | ch01, ch13 | 2 |
| `llm-usage-modes-explore-vs-implement.md` | ch02, ch12 | 2 |
| `context-rot-auto-compacting.md` | ch04, ch09 | 2 |
| `test-driven-prompting.md` | ch03, ch06 | 2 |
| `agent-reliability-chasm.md` | ch05, ch06 | 2 |
| `clean-slate-trajectory-recovery.md` | ch08, ch10 | 2 |
| `learning-loops-encoding-problems-into-prevention.md` | ch08, ch10 | 2 |
| `context-debugging-framework.md` | ch08, ch09 | 2 |
| `ad-hoc-flows-to-deterministic-scripts.md` | ch12, ch14 | 2 |
| `yolo-mode-configuration.md` | ch02, ch15 | 2 |
| `symlinked-agent-configs.md` | ch04, ch12 | 2 |
| `prompt-caching-strategy.md` | ch04, ch15 | 2 |

### Complete Alphabetical Index (Existing Articles)

| Article | Location | Referenced In |
|---------|----------|---------------|
| `12-factor-agents.md` | context-engineering | ch05 |
| `24-7-development-strategy.md` | context-engineering | ch10 |
| `actor-critic-adversarial-coding.md` | context-engineering | ch11 |
| `ad-hoc-flows-to-deterministic-scripts.md` | context-engineering | ch12, ch14 |
| `adrs-for-agent-context.md` | context-engineering | ch04 |
| `agent-capabilities-tools-and-eyes.md` | context-engineering | ch02 |
| `agent-native-architecture.md` | context-engineering | ch05 |
| `agent-reliability-chasm.md` | context-engineering | ch05, ch06 |
| `agent-swarm-patterns-for-thoroughness.md` | context-engineering | ch11 |
| `agentic-tool-detection.md` | context-engineering | ch02 |
| `ai-cost-protection-timeouts.md` | context-engineering | ch08, ch15 |
| `ai-workflow-notifications.md` | context-engineering | ch10 |
| `ast-grep-for-precision.md` | context-engineering | ch12 |
| `boundary-enforcement-layered-architecture.md` | context-engineering | ch13 |
| `building-the-factory.md` | context-engineering | ch01, ch13 |
| `building-the-harness.md` | context-engineering | ch01, ch13 |
| `chain-of-thought-prompting.md` | context-engineering | ch03 |
| `claude-code-hooks-quality-gates.md` | context-engineering | ch07 |
| `clean-slate-trajectory-recovery.md` | context-engineering | ch08, ch10 |
| `closed-loop-telemetry-driven-optimization.md` | context-engineering | ch13 |
| `compounding-effects-quality-gates.md` | context-engineering | ch07 |
| `constraint-based-prompting.md` | context-engineering | ch03 |
| `constraint-first-development.md` | context-engineering | ch06, ch07 |
| `context-debugging-framework.md` | context-engineering | ch08, ch09 |
| `context-efficient-backpressure.md` | context-engineering | ch09 |
| `context-rot-auto-compacting.md` | context-engineering | ch04, ch09 |
| `cursor-agent-workflows.md` | context-engineering | ch02 |
| `custom-eslint-rules-determinism.md` | context-engineering | ch07 |
| `ddd-bounded-contexts-for-llms.md` | context-engineering | ch09 |
| `early-linting-prevents-ratcheting.md` | context-engineering | ch07 |
| `entropy-in-code-generation.md` | context-engineering | ch03, ch06, ch07, ch09 |
| `error-messages-as-training.md` | context-engineering | ch08 |
| `evaluation-driven-development.md` | context-engineering | ch06 |
| `few-shot-prompting-project-examples.md` | context-engineering | ch03 |
| `five-point-error-diagnostic-framework.md` | context-engineering | ch08 |
| `flaky-test-diagnosis-script.md` | context-engineering | ch08 |
| `functional-programming-signal.md` | context-engineering | ch03 |
| `git-worktrees-parallel-dev.md` | context-engineering | ch12 |
| `hierarchical-context-patterns.md` | context-engineering | ch04 |
| `hierarchical-rule-files-collocation.md` | context-engineering | ch04 |
| `highest-leverage-points-plans-and-validation.md` | context-engineering | ch14 |
| `histogram-metrics-batch-workloads.md` | core | ch15 |
| `human-first-dx-philosophy.md` | context-engineering | ch01 |
| `incremental-development-pattern.md` | context-engineering | ch12 |
| `index.md` | context-engineering | ch01 |
| `index.md` | parent | ch01 |
| `information-theory-coding-agents.md` | context-engineering | ch09 |
| `infrastructure-principles.md` | parent | ch13 |
| `institutional-memory-learning-files.md` | context-engineering | ch10 |
| `integration-testing-patterns.md` | context-engineering | ch06 |
| `invariants-programming-llm-generation.md` | context-engineering | ch05 |
| `layered-prompts-architecture.md` | context-engineering | ch04 |
| `learning-loops-encoding-problems-into-prevention.md` | context-engineering | ch08, ch10 |
| `liquidation-cadence.md` | parent | ch01, ch14 |
| `llm-code-review-ci.md` | context-engineering | ch07 |
| `llm-recursive-function-model.md` | context-engineering | ch09 |
| `llm-usage-modes-explore-vs-implement.md` | context-engineering | ch02, ch12 |
| `making-states-illegal-computation-graph.md` | context-engineering | ch05 |
| `mcp-server-project-context.md` | context-engineering | ch13 |
| `meta-questions-for-recursive-agents.md` | context-engineering | ch11 |
| `meta-ticket-refinement.md` | context-engineering | ch12 |
| `model-provider-agnostic-approach.md` | context-engineering | ch15 |
| `model-switching-strategy.md` | context-engineering | ch15 |
| `multi-step-prompt-workflows.md` | context-engineering | ch03 |
| `my-doctrine.md` | parent | ch01 |
| `negative-examples-documentation.md` | context-engineering | ch03 |
| `one-way-pattern-consistency.md` | context-engineering | ch07 |
| `parallel-agents-for-monorepos.md` | context-engineering | ch11, ch12, ch13 |
| `plan-mode-strategic.md` | context-engineering | ch12 |
| `playwright-script-loop.md` | context-engineering | ch12 |
| `prevention-protocol.md` | context-engineering | ch08 |
| `progressive-disclosure-context.md` | context-engineering | ch09 |
| `prompt-caching-strategy.md` | context-engineering | ch04, ch15 |
| `prompts-are-the-asset-not-the-code.md` | context-engineering | ch14 |
| `property-based-testing.md` | context-engineering | ch06 |
| `quality-gates-as-information-filters.md` | context-engineering | ch07 |
| `ralph-loop.md` | context-engineering | ch10 |
| `rules-to-live-by.md` | parent | ch01 |
| `semantic-naming-patterns.md` | context-engineering | ch03, ch04 |
| `six-waves-of-ai-coding.md` | context-engineering | ch14 |
| `skill-atrophy-what-to-keep-what-to-let-go.md` | context-engineering | ch14 |
| `sliding-window-history.md` | context-engineering | ch09 |
| `software-archetypes.md` | parent | ch01 |
| `stateless-verification-loops.md` | context-engineering | ch06 |
| `sub-agent-architecture.md` | context-engineering | ch11 |
| `sub-agents-accuracy-vs-latency.md` | context-engineering | ch11 |
| `symlinked-agent-configs.md` | context-engineering | ch04, ch12 |
| `systems-thinking.md` | parent | ch01 |
| `test-based-regression-patching.md` | context-engineering | ch08 |
| `test-custom-infrastructure.md` | context-engineering | ch13 |
| `test-driven-prompting.md` | context-engineering | ch03, ch06 |
| `the-meta-engineer-identity.md` | context-engineering | ch01, ch14 |
| `thought-leaders.md` | parent | ch01 |
| `trust-but-verify-protocol.md` | context-engineering | ch06 |
| `type-driven-development.md` | context-engineering | ch06 |
| `upfront-questioning-narrows-search-space.md` | context-engineering | ch03 |
| `verification-ladder.md` | context-engineering | ch06 |
| `verification-sandwich-pattern.md` | context-engineering | ch06 |
| `writing-a-good-claude-md.md` | context-engineering | ch04 |
| `yolo-mode-configuration.md` | context-engineering | ch02, ch15 |
| `zero-friction-onboarding.md` | context-engineering | ch02 |

---

## Articles To Be Created

The following articles are referenced in PRDs but do not yet exist in the knowledge base:

### High Priority (Core Patterns)

| Article | Referenced In | Description |
|---------|---------------|-------------|
| `agent-sdk-patterns.md` | ch05, ch11, ch12, ch13 | Core Agent SDK usage patterns |
| `information-theory-prompting.md` | ch03, ch06, ch07 | Info theory applied to prompting |
| `prompt-injection-prevention.md` | ch03 | Security considerations |
| `ci-cd-agent-patterns.md` | ch06, ch07 | CI/CD integration patterns |
| `human-in-the-loop-patterns.md` | ch05 | HITL implementation |
| `tool-call-validation.md` | ch05 | JSON schema validation |
| `errors-md-pattern.md` | ch08 | ERRORS.md persistent memory |
| `agent-retry-strategies.md` | ch08 | Retry patterns for reliability |
| `context-pollution-recovery.md` | ch08 | Recovering from context issues |

### Medium Priority (Supporting Concepts)

| Article | Referenced In | Description |
|---------|---------------|-------------|
| `mcp-server-patterns.md` | ch02 | MCP server integration |
| `claude-code-terminal-basics.md` | ch02 | Terminal usage fundamentals |
| `skills-system.md` | ch02 | Skills system overview |
| `few-shot-prompting-patterns.md` | ch04 | Few-shot examples for CLAUDE.md |
| `event-sourcing-agents.md` | ch05 | Event sourcing for agent state |
| `stateless-verification-loops.md` | ch06 | Stateless verification patterns |
| `mutual-information-context.md` | ch09 | Measuring context effectiveness |
| `token-budgeting-strategies.md` | ch09, ch15 | Token allocation strategies |
| `lost-in-the-middle-mitigation.md` | ch09 | Context window degradation |
| `ralph-loop-patterns.md` | ch10 | RALPH implementation patterns |
| `sub-agent-context-hierarchy.md` | ch11 | Sub-agent context isolation |
| `tool-access-control.md` | ch11 | Tool access management |
| `orchestration-patterns.md` | ch11 | Coordinator/swarm/pipeline |
| `actor-critic-pattern.md` | ch11 | Writer + reviewer pattern |
| `agent-memory-patterns.md` | ch11 | Checkpoint/resume patterns |
| `checkpoint-commit-patterns.md` | ch12 | Git commit strategies |
| `plan-mode-workflow.md` | ch12, ch13 | Plan mode implementation |
| `constraint-specification-patterns.md` | ch13 | Constraint specification |

### Lower Priority (Nice to Have)

| Article | Referenced In | Description |
|---------|---------------|-------------|
| `compound-flywheel-effect.md` | ch14 | Compounding flywheel concept |
| `knowledge-encoding-patterns.md` | ch14 | Encoding knowledge as code |
| `career-positioning-ai-era.md` | ch14 | Career guidance |
| `batch-api-patterns.md` | ch15 | Batch processing for cost |
| `skills-vs-subagents.md` | ch15 | When to use each |
| `cost-telemetry-patterns.md` | ch15 | Cost tracking patterns |

**Total To Be Created**: 32 articles

---

## Statistics

- **Total KB Articles**: 102 (93 context-engineering + 9 parent/core)
- **Existing Articles Referenced**: 98 (96% coverage)
- **Excluded**: 1 (CLAUDE.md - config file, not content)
- **Articles To Be Created**: 32
- **Most Referenced Article**: `entropy-in-code-generation.md` (4 chapters)
- **Chapters with Most Sources**: ch06 (14 articles), ch09 (12 articles)
- **Chapters with Fewest Sources**: ch10 (6 articles)

---

## Previously Unreferenced Articles (Now Mapped)

The following 31 articles were not referenced in any PRD. They are now mapped:

| Article | Now Referenced In |
|---------|-------------------|
| `adrs-for-agent-context.md` | ch04 |
| `agentic-tool-detection.md` | ch02 |
| `ai-workflow-notifications.md` | ch10 |
| `boundary-enforcement-layered-architecture.md` | ch13 |
| `custom-eslint-rules-determinism.md` | ch07 |
| `ddd-bounded-contexts-for-llms.md` | ch09 |
| `evaluation-driven-development.md` | ch06 |
| `functional-programming-signal.md` | ch03 |
| `highest-leverage-points-plans-and-validation.md` | ch14 |
| `human-first-dx-philosophy.md` | ch01 |
| `institutional-memory-learning-files.md` | ch10 |
| `integration-testing-patterns.md` | ch06 |
| `invariants-programming-llm-generation.md` | ch05 |
| `layered-prompts-architecture.md` | ch04 |
| `llm-recursive-function-model.md` | ch09 |
| `making-states-illegal-computation-graph.md` | ch05 |
| `meta-questions-for-recursive-agents.md` | ch11 |
| `meta-ticket-refinement.md` | ch12 |
| `multi-step-prompt-workflows.md` | ch03 |
| `one-way-pattern-consistency.md` | ch07 |
| `prevention-protocol.md` | ch08 |
| `sliding-window-history.md` | ch09 |
| `stateless-verification-loops.md` | ch06 |
| `test-custom-infrastructure.md` | ch13 |
| `type-driven-development.md` | ch06 |
| `yolo-mode-configuration.md` | ch02, ch15 |
| `zero-friction-onboarding.md` | ch02 |
| `rules-to-live-by.md` (parent) | ch01 |
| `systems-thinking.md` (parent) | ch01 |
| `thought-leaders.md` (parent) | ch01 |
| `histogram-metrics-batch-workloads.md` (core) | ch15 |

---

## Phantom References Fixed

The following articles were listed in PRDs but don't exist in the KB. They have been moved to "TO BE CREATED":

| Phantom Article | Status |
|-----------------|--------|
| `agent-sdk-patterns.md` | TO BE CREATED (High Priority) |
| `compound-flywheel-effect.md` | TO BE CREATED (Lower Priority) |
| `few-shot-prompting-patterns.md` | TO BE CREATED (Medium Priority) |
| `information-theory-prompting.md` | TO BE CREATED (High Priority) |
| `claude-code-terminal-basics.md` | TO BE CREATED (Medium Priority) |
| `skills-system.md` | TO BE CREATED (Medium Priority) |
| `mcp-server-patterns.md` | TO BE CREATED (Medium Priority) |
| `plan-mode-workflow.md` | TO BE CREATED (Medium Priority) |
| `ralph-loop-patterns.md` | TO BE CREATED (Medium Priority) |
| `yolo-mode-patterns.md` | Replaced by existing `yolo-mode-configuration.md` |

---

## Notes

1. **Chapter numbering**: The book was restructured from 12 to 15 chapters. PRD filenames may not match final chapter numbers.
2. **Dual references**: Some articles (like `yolo-mode-configuration.md`) are referenced in multiple chapters where relevant.
3. **Parent directory articles**: Articles in `01-Compound-Engineering/` (outside context-engineering/) are now included.
4. **Core directory**: The `core/` subdirectory contains infrastructure-focused articles.
5. **CLAUDE.md excluded**: The config file in context-engineering/ is not content and is excluded from counts.
