# O'Reilly Style Review - 2026-01-27 (v2)

## Summary
- Files scanned: 15 (all chapters)
- Issues found: 168 (High: 35, Medium: 85, Low: 48)
- New since v1: ch14 and ch15 added; additional issues identified

---

## New Issues in Chapters 14 & 15

### Chapter 14: The Meta-Engineer Playbook

#### Acronyms & Abbreviations

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 228 | "C" and "Python" referenced without context about Assembly | Add brief context |
| ch14 | 319-325 | "Wave 3", "Wave 4" etc. used without clear definition | Define "waves" framework on first use |

#### Headings (C-level should be sentence case)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch14 | 23 | "### Why Convert?" | "### Why convert?" |
| ch14 | 35 | "### The Conversion Process" | "### The conversion process" |
| ch14 | 95 | "### The Hybrid Approach" | "### The hybrid approach" |
| ch14 | 119 | "### When to Keep It Ad-hoc" | "### When to keep it ad hoc" |
| ch14 | 139 | "### What Gets Lost When Conversations Disappear" | "### What gets lost when conversations disappear" |
| ch14 | 149 | "### Four Preservation Strategies" | "### Four preservation strategies" |
| ch14 | 199 | "### Specs as Source of Truth" | "### Specs as source of truth" |
| ch14 | 225 | "### The Three High-Leverage Skills to Protect" | "### The three high-leverage skills to protect" |
| ch14 | 251 | "### The Leverage Stack" | "### The leverage stack" |
| ch14 | 270 | "### The Self-Check" | "### The self-check" |
| ch14 | 282 | "### The Atrophy Ladder" | "### The atrophy ladder" |
| ch14 | 302 | "### Preventing Dangerous Atrophy" | "### Preventing dangerous atrophy" |
| ch14 | 330 | "### The Wave 3 to Wave 4 Transition" | "### The Wave 3 to Wave 4 transition" |
| ch14 | 335 | "### Task Sizing for Agents" | "### Task sizing for agents" |
| ch14 | 359 | "### The Skill Shift" | "### The skill shift" |
| ch14 | 371 | "### The Fleet Model: Waves 5 and 6" | "### The fleet model: Waves 5 and 6" |
| ch14 | 388 | "### Economic Reality" | "### Economic reality" |
| ch14 | 399 | "### Career Implications" | "### Career implications" |
| ch14 | 405 | "### Timeline Pressure" | "### Timeline pressure" |
| ch14 | 418 | "### Builder vs Meta-Builder" | "### Builder vs meta-builder" |
| ch14 | 436 | "### What Meta-Engineers Build" | "### What meta-engineers build" |
| ch14 | 486 | "### The Compound Effect" | "### The compound effect" |
| ch14 | 500 | "### The Identity Shift" | "### The identity shift" |
| ch14 | 512 | "### The Full Skill Stack" | "### The full skill stack" |
| ch14 | 545 | "### The Four Levels of Automation" | "### The four levels of automation" |
| ch14 | 582 | "### The ROI Calculation" | "### The ROI calculation" |
| ch14 | 609 | "### What You Are Actually Building" | "### What you are actually building" |

#### Typography & Formatting

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 155 | ".claude/conversation-archive" should be italic | *\\.claude/conversation-archive* |
| ch14 | 180 | ".claude/commands/extract.md" should be italic | Use italic |
| ch14 | 203-212 | Directory paths should be italic | Apply italic formatting |
| ch14 | 228 | "fear-mongering" hyphenation | "fearmongering" (one word) |
| ch14 | 360 | "multi-step" | "multistep" (one word per O'Reilly) |

#### Word Choices

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch14 | 319-325 | Table uses "Q1 2025", "Q2-Q3 2025" | Spell out or format consistently |
| ch14 | 391-394 | "$10-12" | "$10 to $12" |
| ch14 | 391-394 | "$80-100" | "$80 to $100" |
| ch14 | 391-394 | "~$50k" | "approximately $50,000" |

#### Lists

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 139-147 | List items are complete sentences | Ensure all end with periods |
| ch14 | 360-369 | "What was important" vs "What matters now" lists | Check parallel structure |

### Chapter 15: Model Strategy and Cost Optimization

#### Acronyms & Abbreviations

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch15 | 49 | "MTok" not expanded | "million tokens (MTok)" on first use |
| ch15 | 435 | "YOLO" not expanded | "You Only Live Once (YOLO)" or just explain the mode |

#### Headings (C-level should be sentence case)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch15 | 29 | "### When AI Assistance Pays for Itself" | "### When AI assistance pays for itself" |
| ch15 | 88 | "### Model-Specific Strengths" | "### Model-specific strengths" |
| ch15 | 117 | "### Latency Considerations" | "### Latency considerations" |
| ch15 | 129 | "### Implementing Model Selection" | "### Implementing model selection" |
| ch15 | 169 | "### Progressive Model Escalation" | "### Progressive model escalation" |
| ch15 | 210 | "### Cost Savings Analysis" | "### Cost savings analysis" |
| ch15 | 240 | "### Layer 1: Job-Level Timeouts" | "### Layer 1: job-level timeouts" |
| ch15 | 258 | "### Layer 2: Request-Level Token Caps" | "### Layer 2: request-level token caps" |
| ch15 | 281 | "### Layer 3: Input Size Limits" | "### Layer 3: input size limits" |
| ch15 | 306 | "### Layer 4: Budget Alerts and Hard Caps" | "### Layer 4: budget alerts and hard caps" |
| ch15 | 356 | "### Implementing Prompt Caching" | "### Implementing prompt caching" |
| ch15 | 434 | "### Why It's Safe" | "### Why it's safe" |
| ch15 | 457 | "### Safe YOLO Patterns" | "### Safe YOLO patterns" |
| ch15 | 496 | "### Unsafe YOLO Anti-Patterns" | "### Unsafe YOLO antipatterns" |
| ch15 | 506 | "### The Safety Hierarchy" | "### The safety hierarchy" |
| ch15 | 532 | "### Overnight Automation with YOLO" | "### Overnight automation with YOLO" |
| ch15 | 554 | "### Built-In Skills" | "### Built-in skills" |
| ch15 | 562 | "### Creating Custom Skills" | "### Creating custom skills" |
| ch15 | 592 | "### Skills vs Sub-Agents" | "### Skills vs sub-agents" |
| ch15 | 604 | "### Skill Composition" | "### Skill composition" |
| ch15 | 631 | "### Fallback Strategies" | "### Fallback strategies" |
| ch15 | 656 | "### Evaluating New Models" | "### Evaluating new models" |
| ch15 | 756 | "### Dashboard Metrics" | "### Dashboard metrics" |
| ch15 | 767 | "### Monthly Optimization Review" | "### Monthly optimization review" |
| ch15 | 779 | "### Building a Cost Dashboard" | "### Building a cost dashboard" |
| ch15 | 832 | "### Cost Allocation for Teams" | "### Cost allocation for teams" |
| ch15 | 863 | "### Common Optimization Mistakes" | "### Common optimization mistakes" |

#### Typography & Formatting

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch15 | 496 | "Anti-Patterns" should be "Antipatterns" | "antipatterns" (one word) |
| ch15 | 76-80 | "Multi-file" | "Multifile" (one word) |
| ch15 | 562-588 | File paths in markdown code blocks | OK as code |
| ch15 | 770-777 | Numbered list structure | Check parallel structure |

#### Word Choices

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch15 | 17-23 | "$3/MTok", "$15/MTok" | "$3 per MTok" or expand MTok |
| ch15 | 42 | "$2-5" | "$2 to $5" |
| ch15 | 42 | "37-93x" | "37 to 93 times" or "37x to 93x" |
| ch15 | 119-123 | "1-2 seconds", "2-4 seconds" | "one to two seconds" etc. |
| ch15 | 234 | "44%" with parenthetical | Consider formatting |
| ch15 | 431 | "94-97%" | "94% to 97%" |

#### Tables

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch15 | 117-124 | Table lacks caption | Add "Table 15-1. Model latency comparison" |
| ch15 | 274-280 | Table lacks caption | Add "Table 15-2. Recommended token limits by task type" |
| ch15 | 506-530 | Safety hierarchy table lacks caption | Add "Table 15-3. YOLO mode safety hierarchy" |
| ch15 | 592-603 | Skills vs sub-agents table lacks caption | Add "Table 15-4. Skills versus sub-agents comparison" |

---

## Consolidated Issues from v1 (All Chapters)

### Acronyms & Abbreviations (Updated Count: 15)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch01 | 87 | "DDD" not expanded on first use | "Domain-Driven Design (DDD)" |
| ch01 | 88 | "OTEL" not expanded on first use | "OpenTelemetry (OTEL)" |
| ch04 | 11 | "LLMs" not expanded on first use in chapter | "Large language models (LLMs)" |
| ch05 | 391 | "DAG" not expanded on first use | "directed acyclic graph (DAG)" |
| ch06 | 13 | "TLA+" referenced without context | Add brief description |
| ch07 | 5 | "CI/CD" not expanded on first use | "continuous integration/continuous deployment (CI/CD)" |
| ch09 | 170 | "OTLP" not expanded | "OpenTelemetry Protocol (OTLP)" |
| ch10 | 3 | "RALPH" not explained | Clarify origin or meaning |
| ch11 | 44 | "QA" not expanded on first use | "Quality Assurance (QA)" |
| ch12 | 449 | "AST" not expanded on first use | "Abstract Syntax Tree (AST)" |
| ch13 | 476 | "MCP" not expanded on first use | "Model Context Protocol (MCP)" |
| ch14 | 319 | "Wave" framework undefined | Define on first use |
| ch15 | 49 | "MTok" not expanded | "million tokens (MTok)" |
| ch15 | 435 | "YOLO" not expanded | Expand or explain |

### C-Level Headings (150+ issues)

All chapters have numerous C-level headings (###) in Title Case that should be sentence case. This is the most pervasive issue. See v1 review for complete list by chapter.

**Summary by chapter:**
- ch01: 15 headings need case change
- ch02: 3 headings
- ch03: 13 headings
- ch04: 8 headings
- ch05: 2 headings
- ch06: 1 heading
- ch07: 18 headings
- ch08: 18 headings
- ch09: 17 headings
- ch10: 12 headings
- ch11: 16 headings
- ch12: 22 headings
- ch13: 25 headings
- ch14: 27 headings
- ch15: 27 headings

### Typography Issues (Updated)

- Filenames in prose should be italic, not code font
- Technical terms should be italicized on first use
- Compound words: "antipatterns", "multistep", "multifile" (no hyphens)
- "fearmongering" (one word)

### Word Choice Standardization

| Current | Should Be |
|---------|-----------|
| "anti-patterns" | "antipatterns" |
| "multi-step" | "multistep" |
| "multi-file" | "multifile" |
| "fear-mongering" | "fearmongering" |
| "10+" (versions) | "10 or later" |
| "$10-12" | "$10 to $12" |
| "2-3 minutes" | "two to three minutes" |
| "5-10x" | "5 to 10 times" or "5x to 10x" |

### Tables Needing Captions (13 total)

All tables should have:
1. Caption above in format "Table X-Y. Description"
2. In-text reference before the table appears

| Chapter | Line | Description |
|---------|------|-------------|
| ch01 | 71-79 | Builder vs meta-builder |
| ch05 | 15-21 | Framework statistics |
| ch06 | 269-278 | Verification levels |
| ch07 | 159-166 | Compounding calculation |
| ch08 | 590-597 | Knowledge destinations |
| ch10 | 56-60 | Trajectory comparison |
| ch10 | 86-93 | Four-phase cycle |
| ch12 | 275-282 | Ad-hoc vs deterministic |
| ch14 | 319-325 | Wave timeline |
| ch15 | 117-124 | Model latency |
| ch15 | 274-280 | Token limits |
| ch15 | 506-530 | Safety hierarchy |
| ch15 | 592-603 | Skills vs sub-agents |

### Inclusive Language (2 issues)

| File | Line | Issue | Suggested Alternative |
|------|------|-------|----------------------|
| ch07 | 329 | "master rules file" | "primary rules file" |
| ch12 | 148 | "master configuration" | "primary configuration" |

---

## Priority Fixes

### High Priority (35 issues)
1. **Acronym expansion** (15 issues): All acronyms need expansion on first use per chapter
2. **Table captions** (13 issues): All tables need captions and pre-references
3. **C-level heading case** (150+ issues): Convert all ### headings to sentence case
4. **Compound word formatting** (5 issues): antipatterns, multistep, multifile, fearmongering

### Medium Priority (85 issues)
1. Typography: Filenames should be italic in prose
2. First-use italics: Technical terms need italicization
3. Code block introductions: Add colons before code blocks
4. List consistency: Standardize period usage
5. Number formatting: Spell out numbers under 10
6. Word choices: Version numbers, ranges, time expressions
7. Cross-reference format: Use consistent "See Chapter X" style

### Low Priority (48 issues)
1. Time abbreviations: Use space between number and unit
2. Minor formatting adjustments
3. Inclusive language: Replace "master" with "primary"

---

## Statistics by Chapter

| Chapter | Issues | High | Medium | Low |
|---------|--------|------|--------|-----|
| ch01 | 18 | 3 | 11 | 4 |
| ch02 | 9 | 1 | 5 | 3 |
| ch03 | 15 | 1 | 10 | 4 |
| ch04 | 10 | 1 | 6 | 3 |
| ch05 | 6 | 1 | 3 | 2 |
| ch06 | 5 | 2 | 2 | 1 |
| ch07 | 21 | 2 | 14 | 5 |
| ch08 | 20 | 2 | 12 | 6 |
| ch09 | 20 | 3 | 12 | 5 |
| ch10 | 12 | 2 | 7 | 3 |
| ch11 | 17 | 2 | 11 | 4 |
| ch12 | 22 | 3 | 14 | 5 |
| ch13 | 18 | 3 | 11 | 4 |
| ch14 | 32 | 4 | 20 | 8 |
| ch15 | 35 | 5 | 22 | 8 |

---

## Overall Assessment

The manuscript maintains strong adherence to O'Reilly's conversational tone. Chapters 14 and 15 follow the same quality patterns as earlier chapters.

**Strengths:**
- Engaging, practical content throughout
- Excellent code examples with proper introductions
- Consistent second-person voice
- Good balance of theory and practice
- Strong cross-references between chapters

**Primary areas for improvement:**
1. **C-level heading capitalization** - Most pervasive issue (150+ occurrences)
2. **Acronym expansion** - Each chapter should expand acronyms on first use
3. **Table formatting** - All tables need captions and in-text references
4. **Compound words** - Several need adjustment per O'Reilly word list

The issues are largely mechanical and can be addressed efficiently in a copyedit pass.
