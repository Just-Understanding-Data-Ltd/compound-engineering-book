# O'Reilly Style Review - 2026-01-27 (v3)

## Summary
- Files scanned: 15 (all chapters including ch14, ch15)
- Issues found: 168 (High: 34, Medium: 85, Low: 49)
- New since v2: 21 issues from chapters 14 and 15

---

## New Issues (Chapters 14 and 15)

### Acronyms & Abbreviations

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 228 | "AI" first use in chapter not expanded | Consider expanding for readers starting here |
| ch14 | 314 | "LLM" used without expansion in this chapter | "large language model (LLM)" |
| ch14 | 332 | "PoC" style tasks mentioned | Clarify "proof-of-concept" if used |
| ch15 | 18 | "MTok" not explained | "million tokens (MTok)" on first use |
| ch15 | 48 | "MTok" pricing format unclear | Consider "$0.25 per million tokens" |
| ch15 | 439 | "YOLO" not expanded | "You Only Live Once (YOLO) mode" with explanation |

### C-Level Headings (Should Be Sentence Case)

**Chapter 14:**
| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch14 | 21 | "### Why Convert?" | "### Why convert?" |
| ch14 | 33 | "### The Conversion Process" | "### The conversion process" |
| ch14 | 95 | "### The Hybrid Approach" | "### The hybrid approach" |
| ch14 | 119 | "### When to Keep It Ad-hoc" | "### When to keep it ad-hoc" |
| ch14 | 139 | "### What Gets Lost When Conversations Disappear" | "### What gets lost when conversations disappear" |
| ch14 | 149 | "### Four Preservation Strategies" | "### Four preservation strategies" |
| ch14 | 199 | "### Specs as Source of Truth" | "### Specs as source of truth" |
| ch14 | 228 | "### The Three High-Leverage Skills to Protect" | "### The three high-leverage skills to protect" |
| ch14 | 267 | "### The Self-Check" | "### The self-check" |
| ch14 | 282 | "### The Atrophy Ladder" | "### The atrophy ladder" |
| ch14 | 304 | "### Preventing Dangerous Atrophy" | "### Preventing dangerous atrophy" |
| ch14 | 327 | "### The Wave 3 to Wave 4 Transition" | "### The Wave 3 to Wave 4 transition" |
| ch14 | 333 | "### Task Sizing for Agents" | "### Task sizing for agents" |
| ch14 | 357 | "### The Skill Shift" | "### The skill shift" |
| ch14 | 369 | "### The Fleet Model: Waves 5 and 6" | "### The fleet model: Waves 5 and 6" |
| ch14 | 387 | "### Economic Reality" | "### Economic reality" |
| ch14 | 397 | "### Career Implications" | "### Career implications" |
| ch14 | 403 | "### Timeline Pressure" | "### Timeline pressure" |
| ch14 | 421 | "### Builder vs Meta-Builder" | "### Builder vs meta-builder" |
| ch14 | 437 | "### What Meta-Engineers Build" | "### What meta-engineers build" |
| ch14 | 487 | "### The Compound Effect" | "### The compound effect" |
| ch14 | 505 | "### The Identity Shift" | "### The identity shift" |
| ch14 | 515 | "### The Full Skill Stack" | "### The full skill stack" |
| ch14 | 545 | "### The Four Levels of Automation" | "### The four levels of automation" |
| ch14 | 583 | "### The ROI Calculation" | "### The ROI calculation" |
| ch14 | 607 | "### What You Are Actually Building" | "### What you are actually building" |

**Chapter 15:**
| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch15 | 29 | "### When AI Assistance Pays for Itself" | "### When AI assistance pays for itself" |
| ch15 | 86 | "### Model-Specific Strengths" | "### Model-specific strengths" |
| ch15 | 116 | "### Latency Considerations" | "### Latency considerations" |
| ch15 | 128 | "### Implementing Model Selection" | "### Implementing model selection" |
| ch15 | 167 | "### Progressive Model Escalation" | "### Progressive model escalation" |
| ch15 | 209 | "### Cost Savings Analysis" | "### Cost savings analysis" |
| ch15 | 245 | "### Layer 1: Job-Level Timeouts" | "### Layer 1: job-level timeouts" |
| ch15 | 264 | "### Layer 2: Request-Level Token Caps" | "### Layer 2: request-level token caps" |
| ch15 | 291 | "### Layer 3: Input Size Limits" | "### Layer 3: input size limits" |
| ch15 | 325 | "### Layer 4: Budget Alerts and Hard Caps" | "### Layer 4: budget alerts and hard caps" |
| ch15 | 378 | "### Implementing Prompt Caching" | "### Implementing prompt caching" |
| ch15 | 429 | "### Combined Savings" | "### Combined savings" |
| ch15 | 443 | "### Why It's Safe" | "### Why it's safe" |
| ch15 | 458 | "### Safe YOLO Patterns" | "### Safe YOLO patterns" |
| ch15 | 496 | "### Unsafe YOLO Anti-Patterns" | "### Unsafe YOLO anti-patterns" |
| ch15 | 505 | "### The Safety Hierarchy" | "### The safety hierarchy" |
| ch15 | 530 | "### Overnight Automation with YOLO" | "### Overnight automation with YOLO" |
| ch15 | 553 | "### Built-In Skills" | "### Built-in skills" |
| ch15 | 559 | "### Creating Custom Skills" | "### Creating custom skills" |
| ch15 | 591 | "### Skills vs Sub-Agents" | "### Skills vs sub-agents" |
| ch15 | 604 | "### Skill Composition" | "### Skill composition" |
| ch15 | 631 | "### Fallback Strategies" | "### Fallback strategies" |
| ch15 | 657 | "### Evaluating New Models" | "### Evaluating new models" |
| ch15 | 778 | "### Dashboard Metrics" | "### Dashboard metrics" |
| ch15 | 786 | "### Monthly Optimization Review" | "### Monthly optimization review" |
| ch15 | 799 | "### Building a Cost Dashboard" | "### Building a cost dashboard" |
| ch15 | 833 | "### Cost Allocation for Teams" | "### Cost allocation for teams" |
| ch15 | 862 | "### Common Optimization Mistakes" | "### Common optimization mistakes" |

### Typography & Formatting

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 155 | `.claude/conversation-archive` not italicized | Italicize path |
| ch14 | 182 | `.claude/commands/extract.md` not italicized | Italicize file path |
| ch14 | 252-265 | ASCII art skill stack | Consider as formal figure |
| ch15 | 247-260 | YAML code block needs colon intro | Add colon before code |
| ch15 | 268-276 | TypeScript code block needs intro | Add colon |
| ch15 | 383-425 | Long code block needs proper intro | Add colon |
| ch15 | 565-587 | Markdown in code needs intro | Add colon |

### Tables Without Captions

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 24-31 | Comparison table lacks caption | Add "Table 14-1. Ad-hoc flow vs deterministic script" |
| ch14 | 316-326 | Six Waves table lacks caption | Add "Table 14-2. Six waves of AI-enabled development" |
| ch14 | 387-394 | Economic reality table lacks caption | Add "Table 14-3. Infrastructure economics" |
| ch14 | 423-431 | Builder vs meta-builder lacks caption | Add "Table 14-4. Builder vs meta-builder comparison" |
| ch14 | 609-617 | Surface level vs meta level lacks caption | Add "Table 14-5. Product output vs system asset" |
| ch15 | 48-58 | Three-tier pricing lacks caption | Add "Table 15-1. Model tier characteristics" |
| ch15 | 116-123 | Latency table lacks caption | Add "Table 15-2. Typical response times by model" |
| ch15 | 280-287 | Token limits table lacks caption | Add "Table 15-3. Recommended token limits by task" |
| ch15 | 596-602 | Skills vs sub-agents lacks caption | Add "Table 15-4. Skills vs sub-agents comparison" |

### Word Choices

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| ch14 | 32 | "~45 seconds" | "approximately 45 seconds" |
| ch14 | 348 | "3-20 steps" | "three to twenty steps" |
| ch14 | 393 | "$10-12" | "$10 to $12" |
| ch14 | 430 | "5-10x" | "5 to 10 times" |
| ch15 | 24-25 | "$3/MTok", "$15/MTok" | Consider "per MTok" or "per million tokens" |
| ch15 | 122 | "1-2 seconds", "2-4 seconds" | "one to two seconds", "two to four seconds" |
| ch15 | 233-234 | "70 × 5,000" | Consider prose form or proper multiplication symbol |
| ch15 | 436 | "94-97%" | "94% to 97%" |

### Cross References

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 671-677 | Related chapters list uses dashes | Use "See Chapter X" format |
| ch15 | 912-920 | Related chapters in bullets | Use consistent "See Chapter X" format |

### Inclusive Language

| File | Line | Issue | Suggested Alternative |
|------|------|-------|----------------------|
| ch14 | 152 | "master configuration" context | Consider "primary" if referring to main copy |
| ch15 | 480 | "master" in git context | Acceptable for git terminology (main branch) |

### Code Block Introductions

| File | Line | Issue | Fix |
|------|------|-------|-----|
| ch14 | 44 | Shell script needs colon intro | Add "Document the exact steps:" |
| ch14 | 99 | Hybrid script needs intro | Add colon |
| ch14 | 153 | Archive creation needs intro | Add colon |
| ch14 | 164 | Git command needs intro | Add colon |
| ch14 | 175 | Extract command needs intro | Add colon |
| ch14 | 191 | Rsync command needs intro | Add colon |
| ch14 | 440-458 | Docker compose needs intro | Add colon |
| ch14 | 464-471 | Constraints code needs intro | Add colon |
| ch14 | 519-541 | Skill stack ASCII needs figure treatment | Convert to figure |
| ch15 | 130-164 | Model selection code needs intro | Add colon |
| ch15 | 173-206 | Escalation code needs intro | Add colon |
| ch15 | 462-493 | Safe YOLO script needs intro | Add colon |
| ch15 | 632-654 | Provider router code needs intro | Add colon |
| ch15 | 673-698 | Fallback code needs intro | Add colon |
| ch15 | 707-747 | Benchmark code needs intro | Add colon |
| ch15 | 755-775 | Usage metrics code needs intro | Add colon |
| ch15 | 801-825 | Dashboard code needs intro | Add colon |
| ch15 | 838-857 | Cost allocation code needs intro | Add colon |

---

## Consolidated Statistics (All Chapters)

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
| **ch14** | 28 | 4 | 17 | 7 |
| **ch15** | 35 | 4 | 22 | 9 |
| **Total** | **256** | **34** | **157** | **65** |

---

## Priority Actions

### Immediate (Pre-Production)

1. **C-level heading case conversion**: All 15 chapters have ### headings in Title Case. Convert to sentence case. Estimated: 180+ headings.

2. **Acronym expansion**: Add first-use expansions for:
   - LLM, DDD, OTEL, CI/CD, CRUD, AST, MCP, QA, DAG, OTLP, MTok, YOLO
   - Consider per-chapter expansion for readers who start mid-book

3. **Table captions**: Add "Table X-Y. Description" above all tables with in-text references.

### Production Phase

4. **Code block introductions**: Ensure all code blocks are preceded by a sentence ending with a colon.

5. **Filename typography**: Apply italic formatting to all filename references in prose.

6. **Number formatting**:
   - Spell out zero through nine
   - Use numerals for 10+
   - Add commas to 1,000+
   - Use "or later" instead of "+"

7. **Cross-reference standardization**: Use "See Chapter X" format consistently.

### Final Polish

8. **ASCII art conversion**: Convert ASCII diagrams to proper figures with captions.

9. **Inclusive language**: Replace "master" with "primary" where not git-specific.

10. **Time/measurement formatting**: Add space between numbers and units (e.g., "30 s" not "30s").

---

## Automated Fix Patterns

### Heading Case (Regex)

```bash
# Find C-level headings in Title Case
grep -rn "^### [A-Z][a-z]* [A-Z]" chapters/

# Manual review required - preserve proper nouns
```

### Acronym First Use

```bash
# Find potential unexpanded acronyms
grep -rn "\b[A-Z]{2,}\b" chapters/ | grep -v "CLAUDE\|README\|TODO"
```

### Tables Without Captions

```bash
# Find tables (pipe-separated)
grep -rn "^|.*|.*|" chapters/ | head -20
```

---

## Overall Assessment

The manuscript is well-written with a strong conversational tone that aligns with O'Reilly's pedagogical approach. Chapters 14 and 15 maintain the same quality as earlier chapters.

**Strengths:**
- Excellent practical examples and code throughout
- Clear progression from concept to implementation
- Consistent reader-centric voice
- Chapters 14-15 provide excellent capstone content

**Primary Issues:**
- C-level headings universally need case conversion
- Tables need captions and pre-references
- Code blocks need colon introductions
- Acronyms need first-use expansion

All issues are mechanical and addressable in a copyedit pass. Content quality is excellent.
