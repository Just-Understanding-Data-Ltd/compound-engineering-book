# Learnings

> Accumulated insights from RALPH loop iterations. Each iteration adds to this file.

---

## Format

Each learning entry should follow this format:

```
### [Date] - [Brief Title]

**Context**: What were you working on?
**Observation**: What did you notice?
**Implication**: How should this change future work?
**Action**: Specific change to make (CLAUDE.md update, new convention, etc.)
```

---

## Compacted History (18 entries from 2026-01-27 to 2026-01-28)

### Diagram Creation Patterns

**Multi-view diagrams** (Jan 27): Always include 2-3 alternative views (table, flow, comparison) for each diagram. Different readers learn differently. Include "Usage" section linking to specific chapter lines.

**Mathematical concepts** (Jan 28): Replace formulas with visual pipelines showing transformation. Use concrete numbers (20 bits -> 5 bits, not "entropy reduction"). Include before/after comparisons and summary tables.

**State machine diagrams** (Jan 28): Include both abstract view (stateDiagram-v2) and concrete view (sequenceDiagram showing realistic scenario). Abstract provides framework, concrete provides intuition.

### KB Articles & Content Synthesis

**KB article structure** (Jan 28): Follow consistent structure: frontmatter, summary, problem, solution, TypeScript examples, best practices, pitfalls, related concepts. Cross-references create interconnected knowledge web.

**Multi-source synthesis** (Jan 28): Find the unifying thread connecting disparate sources. Use Problem -> Defense -> Recovery -> Improvement framework. List each source's core concept in a table first.

**Content enhancement** (Jan 28): Include specific metrics from source articles (90%, 60%, 150-200), not vague advice. Separate research from writing phases.

### Quality Gates & Review

**Complementary review passes** (Jan 27): AI slop and term introduction are different categories of reader friction. Always run both slop-checker AND term-intro-checker. Neither alone is sufficient.

**Programmatic verification** (Jan 27): Quality gates should be deterministic and scriptable. Word count, em dashes, AI slop, diagrams, exercises, cross-refs can all be automated. Human judgment for content quality only.

**Silent dependencies** (Jan 28): Cross-reference sections don't trigger automated errors. Explicitly tail last 15 lines to verify "Related chapters" section exists.

**Deterministic final gates** (Jan 29): Run all 8 checks in sequence, document results, only mark complete when all pass. The final milestone is verification script, not human review.

### Acronym/Term Management

**Acronym density** (Jan 28): Technical chapters accumulate ~5 undefined acronyms each. Scan for `\b[A-Z]{3,}\b`, check for prior definitions. Exception: API, URL, HTTP can skip.

**Predictable categories** (Jan 27-28): Security chapters need JWT/OAuth/CORS. Testing needs TDD/BDD/E2E. Infrastructure needs K8s/Docker. AI chapters need LLM/GPT/RAG.

**Workflow chapter density** (Jan 28): Expect 50-100% more acronyms than single-topic chapters. They integrate multiple domains.

**Meta-engineering layers** (Jan 28): Architecture chapters span AI, infrastructure, DevOps, business layers. Expect 1-2 acronyms per layer. Check for forward references.

### Git & Task Tracking

**Git as external memory** (Jan 28): Commits are "save games" between iterations. Messages need: what accomplished, current state, what next iteration should do.

**JSON-based tracking** (Jan 28): Use features.json/tasks.json, not markdown TASKS.md. Machine-parseable, single source of truth, colocated with milestones.

### Cross-Reference Validation

**Filename mismatches** (Jan 28): 40% missing connector ("and"), 40% missing article ("the-"), 20% hyphen variation. Extract links with grep, verify each exists.

### SDK Migration

**Agent SDK pattern** (Jan 28): Three-step migration: (1) update imports to `{ query, type SDKMessage }`, (2) add extractTextContent helper, (3) replace `client.messages.create()` with `query()` + streaming loop. Pattern is consistent across all files.

---

## Recent Entries (Last 10)

### 2026-01-29 - Em Dash Removal Follows Predictable Context-Based Patterns

**Context**: Fixing em dashes (—) in PRD files for publication readiness. Task reported 13 em dashes but actual count was ~45 across 9 files.

**Observation**: Em dashes appear in predictable locations and require context-specific replacements:

| Location | Example | Replacement Strategy |
|----------|---------|---------------------|
| Section headings | "Case Study—AI Rank Tracker" | Colon: "Case Study: AI Rank Tracker" |
| Cross-reference lists | "Chapter 1 — Meta-engineering is..." | Colon: "Chapter 1: Meta-engineering..." |
| Inline parenthetical | "coding agents—treating AI code" | Comma: "coding agents, treating AI code" |
| Explanatory aside | "This is physics—it's not a question" | Period: "This is physics. It's not a question" |
| Contrast/addition | "don't just add—they multiply" | Semicolon: "don't just add; they multiply" |
| Definitional | "capacity—the context window—as" | Parentheses: "capacity (the context window) as" |

The original task underreported the count because grep's "[Omitted long matching line]" message hid em dashes in long paragraphs. The actual count was 3.5x higher than reported.

**Implication**: AI slop detection reports may undercount when using grep on files with long lines. When a slop-checker reports N issues, expect actual count to be 2-4x higher if files contain lengthy paragraphs.

**Action**: When fixing em dashes at scale:
1. Run `grep -c "—" file` to get accurate count per file before starting
2. Categorize each em dash by context (heading, list, inline, aside)
3. Apply replacement systematically by category
4. Verify with `grep "—" file` after each file (should return 0 matches)

---

### 2026-01-29 - Reliability Math as Content Architecture Guide

**Context**: Adding agent reliability patterns to Chapter 13 based on agent-reliability-chasm.md KB article. The core insight is that 95% per-action reliability yields only 36% overall success at 20 actions.

**Observation**: Mathematical relationships (like reliability compounding) serve as natural content organization anchors. The formula `Overall = (Per-Action)^N` structures everything: the problem (0.95^20 = 0.36), defenses (four-turn framework), verification (pre/post-action), and improvement table.

**Implication**: When translating KB articles into chapter content, identify the mathematical core if one exists. Structure content as: (1) the math, (2) what it implies, (3) how to improve variables.

**Action**: For reliability/optimization chapters:
1. Find the underlying mathematical relationship
2. Lead with a simple table showing concrete numbers (not formulas)
3. Structure sections as "ways to improve the variables"
4. End with improvement table showing payoff

---

### 2026-01-29 - Complementary Diagrams Across Chapters for Same Concept

**Context**: Creating the Cost Protection Layers diagram for Chapter 13, when a similar diagram already exists for Chapter 8.

**Observation**: The same concept (five-layer cost protection) serves different pedagogical purposes. Ch08 emphasizes failure scenarios and recovery. Ch13 emphasizes cost calculations and optimization savings ($71.28 -> $20.24, 72% savings).

**Implication**: When the same concept appears in multiple chapters, create distinct diagrams tailored to each chapter's context. The concept is the same, but framing, metrics, and connections differ.

**Action**: Check for existing diagrams, identify different pedagogical focus, create new diagram emphasizing current chapter's perspective.

---

### 2026-01-28 - AI Slop Checks Require Category Separation and False Positive Awareness

**Context**: Running AI slop check across all 15 chapters. Checking for em dashes, blacklisted words, transition phrases, and hedging phrases.

**Observation**: AI slop checks should be four independent category scans. Code examples demonstrating quality gates can contain the very words being scanned for (meta-examples). "Leverage" as noun is acceptable; only verb forms ("leveraged", "leveraging") are problematic.

**Implication**: AI slop scanners need context awareness. Words in code blocks are categorically different from prose.

**Action**: Run four separate scans, exclude code blocks, search verb forms for "leverage", document meta-examples as intentional false positives.

---

### 2026-01-28 - EPUB CSS: Distinguishing Visual Elements Through Layered Specificity

**Context**: Improving EPUB inline code and callout/blockquote styling. CSS needed to handle `code` in three contexts: prose, code blocks, blockquotes.

**Observation**: EPUB styling requires careful CSS specificity layering:
- Prose `code`: Stand out with background, border, padding
- `pre code`: Inherit parent, reset background/border/padding to none
- `blockquote code`: Use `rgba(255, 255, 255, 0.6)` to harmonize with blue tint

**Implication**: Any element appearing in multiple parent contexts needs explicit CSS overrides for each context.

**Action**: Identify all parent contexts, add explicit overrides where defaults create conflicts, use `rgba()` for elements inside colored containers.

---

### 2026-01-28 - Three-Font-Family Typography Creates Visual Hierarchy

**Context**: Implementing typography overhaul for EPUB with Source Serif 4 (body), Source Sans 3 (headings), JetBrains Mono (code).

**Observation**: Font roles signal content type:
- Serif body: "Read carefully" (oldstyle-nums, tight letter-spacing)
- Sans headings: "Navigate/scan" (lining-nums, semibold)
- Mono code: "This is executable" (0.82em size)

Print conventions like `p + p { text-indent: 1.5em }` and `orphans: 2; widows: 2` make text feel like printed book.

**Implication**: Think in "font roles" not "font choices." Each role has different requirements for numeric style, weight, spacing.

**Action**: Define roles first, use `font-variant-numeric` per context, reset inherited styles when crossing role boundaries.

---

### 2026-01-28 - Gemini Vision Reviews Require CSS Injection Timing Awareness

**Context**: Running EPUB visual review using Gemini 2.5 Flash vision API across 23 chapters.

**Observation**: Gemini flagged 40+ issues that were actually false positives from CSS injection timing. Manual Playwright verification found zero actionable issues across 4 chapters. Gemini cannot know intended vs missing CSS properties.

**Implication**: Gemini vision reviews are screening tools, not source of truth. Manual Playwright verification provides ground truth.

**Action**: Always manually verify reported issues before creating tasks. Distinguish "missing feature" suggestions from actual rendering bugs.

---

### 2026-01-29 - AsciiDoc Conversion Preserves Structure When Using Pandoc

**Context**: Converting chapters 01-03 from Markdown to AsciiDoc for O'Reilly-compatible pipeline.

**Observation**: Pandoc's conversion is remarkably accurate:
- `# Chapter` -> `== Chapter`
- ` ```typescript ` -> `[source,typescript]` + `----`
- `[text](link)` -> `link[text]`

Post-processing: smart quote normalization only. Zero validation errors.

**Implication**: Batch Markdown-to-AsciiDoc conversion is viable. Both formats share structural semantics.

**Action**: Use `pandoc -t asciidoc --wrap=none`, post-process smart quotes, validate with asciidoctor.

---

### 2026-01-30 - MCP Image Generation Requires Guide Reading Before First Use

**Context**: Generating RALPH Loop diagram using image-generator MCP server. Initial prompts failed.

**Observation**: The MCP enforces "read the guide first" pattern. GPT-Image-1.5 prompting structure:
1. Background/scene
2. Subject
3. Key details
4. Constraints (what NOT to include)

Text must be quoted exactly with typography specified. Generation succeeded on first attempt after following structure.

**Implication**: MCP tools may have initialization gates requiring documentation reading. The friction is intentional and valuable.

**Action**: Check for associated resources (e.g., `image-generator://prompting-guide`), read before use, structure prompts per tool's format.

---

### 2026-01-29 - Code Block Callouts as Inline Documentation Strategy

**Context**: Adding AsciiDoc callouts to complex code blocks across chapters 6, 10, 11, and 13.

**Observation**: Callouts serve different purpose than prose. Prose explains WHY/WHEN. Callouts explain WHAT/HOW at the exact moment reader sees the code.

Effective patterns:
- Pattern identification: "Result pattern: explicit success/error states"
- Constraint explanation: "Scoped file paths prevent agents from conflicting"
- Chain explanation: "Validation runs second: rejects malformed payloads"
- Critical emphasis: "Critical: reviewer is read-only"

Code blocks benefit from callouts when introducing new patterns, showing multiple concepts, or demonstrating workflows.

**Implication**: Callouts create point-of-need documentation. Reader doesn't need to hold prose in working memory.

**Action**: Target blocks with new patterns, limit to 4-6 callouts, use verb phrases for actions, place markers at END of line.

---
