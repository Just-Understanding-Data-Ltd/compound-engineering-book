# Tasks

> Task queue for RALPH loop. Work top-to-bottom. Mark complete with [x].

---

## Phase 1: PRD Completion

- [x] Write ch01.md PRD (The Compound Systems Engineer) (Completed: 2026-01-26)
- [x] Write ch02.md PRD (Getting Started with Claude Code) (Completed: 2026-01-26)
- [x] Write ch03.md PRD (Writing Your First CLAUDE.md) (Completed: 2026-01-26)
- [x] Write ch04.md PRD (The 12-Factor Agent) (Completed: 2026-01-26)
- [x] Write ch05.md PRD (The Verification Ladder) (Completed: 2026-01-26)
- [x] Write ch06.md PRD (Quality Gates That Compound) (Completed: 2026-01-26)
- [x] Write ch07.md PRD (Context Engineering Deep Dive) (Completed: 2026-01-26)
- [x] Write ch08.md PRD (The RALPH Loop) (Completed: 2026-01-26)
- [x] Write ch09.md PRD (Sub-Agent Architecture) (Completed: 2026-01-26)
- [x] Write ch10.md PRD (Building the Harness) (Completed: 2026-01-26)
- [x] Write ch11.md PRD (The Meta-Engineer Playbook) (Completed: 2026-01-26)
- [x] Write ch12.md PRD (Case Studies & Reference) (Completed: 2026-01-26)
- [x] Review all PRDs for consistency (Completed: 2026-01-26)

## Phase 1.5: PRD Enhancement (Based on Sub-Agent Analysis)

> These tasks come from the sub-agent analysis of PRDs vs Knowledge Base (Jan 27, 2026)

### Ch01-Ch04 PRD Improvements
- [ ] Add liquidation-cadence.md reference to ch01 PRD (builds on "when to persist" section)
- [ ] Add building-the-harness.md reference to ch01 PRD (harness philosophy)
- [ ] Add building-the-factory.md reference to ch01 PRD (factory vs product)
- [ ] Add information-theory-prompting.md reference to ch03 PRD (entropy reduction)
- [ ] Add prompt-caching-strategies.md reference to ch03 PRD
- [ ] Update ch04 PRD with Agent SDK v2-preview patterns (unstable_v2_* APIs) (Completed: 2026-01-27)

### Ch05-Ch08 PRD Improvements
- [ ] Add entropy-in-code-generation.md reference to ch05 PRD (verification theory)
- [ ] Add agent-reliability-chasm.md reference to ch05 PRD
- [ ] Add flaky-test-diagnosis-script.md reference to ch08 PRD
- [ ] Add ai-cost-protection-timeouts.md reference to ch08/ch15 PRDs
- [ ] Add errors-md-pattern.md reference to ch08 PRD

### Ch09-Ch12 PRD Improvements
- [ ] Add sub-agent-context-hierarchy.md concepts to ch09 PRD (context isolation patterns)
- [ ] Add tool-access-control.md concepts to ch09 PRD (permission boundaries)
- [ ] Add orchestration-patterns.md concepts to ch10 PRD
- [ ] Add parallel-agent-execution.md reference to ch10 PRD (git worktrees pattern)
- [ ] Add plan-mode-workflow.md reference to ch12 PRD
- [ ] Add incremental-development.md reference to ch12 PRD

### Cross-Cutting Improvements
- [ ] Create index of all KB articles used in each PRD
- [ ] Add Model Strategy (YOLO/Skills/Haiku-Sonnet-Opus) content to ch15 PRD
- [ ] Ensure all 93 KB articles have at least one PRD reference

### New KB Articles Needed (Critical Gaps)
- [ ] Create @kb/sub-agent-context-hierarchy.md (how sub-agents manage context isolation)
- [ ] Create @kb/tool-access-control.md (granting/restricting tool access to sub-agents)
- [ ] Create @kb/orchestration-patterns.md (coordinator, swarm, pipeline patterns)
- [ ] Create @kb/actor-critic-pattern.md (writer agent + reviewer agent pattern)
- [ ] Create @kb/agent-memory-patterns.md (checkpoint/resume, state persistence)

## Phase 2: Chapter Writing

- [x] Write Chapter 1 first draft (Completed: 2026-01-27)
- [ ] Write Chapter 2 first draft
- [ ] Write Chapter 3 first draft (Prompting Fundamentals - NEW)
- [ ] Write Chapter 4 first draft (CLAUDE.md - was ch03)
- [ ] Write Chapter 5 first draft (12-Factor Agent - was ch04)
- [ ] Write Chapter 6 first draft (Verification Ladder - was ch05)
- [ ] Write Chapter 7 first draft (Quality Gates - was ch06)
- [ ] Write Chapter 8 first draft (Error Handling - NEW)
- [ ] Write Chapter 9 first draft (Context Engineering - was ch07)
- [ ] Write Chapter 10 first draft (RALPH Loop - was ch08)
- [ ] Write Chapter 11 first draft (Sub-Agent Architecture - was ch09)
- [ ] Write Chapter 12 first draft (Development Workflows - NEW)
- [ ] Write Chapter 13 first draft (Building the Harness - was ch10)
- [ ] Write Chapter 14 first draft (Meta-Engineer Playbook - was ch11)
- [ ] Write Chapter 15 first draft (Model Strategy & Cost - NEW)

## Phase 3: Diagrams

- [x] Create Mermaid diagram shells for all chapters (Completed: 2026-01-27)
- [ ] Create compound flywheel diagram (Ch 1)
- [ ] Create tool ecosystem diagram (Ch 2)
- [ ] Create prompt anatomy diagram (Ch 3 - NEW)
- [ ] Create CLAUDE.md hierarchy diagram (Ch 4)
- [ ] Create 12-factor overview diagram (Ch 5)
- [ ] Create verification ladder diagram (Ch 6)
- [ ] Create quality gate pipeline diagram (Ch 7)
- [ ] Create error diagnostic flowchart (Ch 8 - NEW)
- [ ] Create context window anatomy diagram (Ch 9)
- [ ] Create RALPH loop cycle diagram (Ch 10)
- [ ] Create sub-agent architecture diagram (Ch 11)
- [ ] Create development workflows diagram (Ch 12 - NEW)
- [ ] Create four-layer harness diagram (Ch 13)
- [ ] Create six waves timeline diagram (Ch 14)
- [ ] Create model selection decision tree (Ch 15 - NEW)

## Phase 4: Appendices

- [ ] Write Appendix A: CLAUDE.md Templates
- [ ] Write Appendix B: Prompt Library
- [ ] Write Appendix C: Troubleshooting
- [ ] Write Appendix D: Further Reading

## Phase 5: Review & Polish

- [ ] Technical review all chapters
- [ ] Style consistency pass
- [ ] Validate all code examples
- [ ] Cross-reference check
- [ ] Final proofread

---

## Blockers & Notes

### Sub-Agent Analysis Summary (Jan 27, 2026)

**Coverage Statistics:**
- KB articles referenced: ~55/93 (59%)
- Unreferenced articles: 29 (30.5%)
- PRDs with complete KB coverage: 0/15

**Priority Improvements:**
1. Part III chapters (Advanced) need most work - missing entropy/reliability concepts
2. Ch09 (Sub-Agent) and Ch10 (Harness) have critical missing articles
3. New KB articles needed for orchestration patterns and actor-critic
4. Ch15 (Model Strategy) needs YOLO mode, Skills system, cost protection content

**TOC Restructuring Options (from sub-agent):**
- Option A (Minimal): Add missing KB refs to existing PRDs
- Option B (Moderate): Reorder some chapters for better flow
- Option C (Comprehensive): Split some chapters, merge others

**Current Recommendation:** Start with Option A (PRD enhancement), evaluate B/C after chapter drafts.
