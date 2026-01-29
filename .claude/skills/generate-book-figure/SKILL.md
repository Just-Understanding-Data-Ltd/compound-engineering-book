---
name: generate-book-figure
description: Generate professional O'Reilly-style infographic for the book. Use when creating diagrams, figures, or visual explanations for chapters.
allowed-tools: Bash, Read, Write
---

# Generate Book Figure

Generate professional infographics for "The Meta-Engineer" book using the image-generator MCP server.

## Design Philosophy

**MUST follow O'Reilly technical book style:**
- Infographic style with clear TEXT LABELS
- Minimal white/light background
- NOT cartoon, NOT photo-realistic
- Professional tech vibes (McKinsey/Gartner quality)
- Navy blue (#1e3a5f), steel blue (#4682b4), teal (#0d9488) palette

## How to Generate

Use the image-generator MCP tool:

```
mcp__image_generator__generate_image({
  prompt: "<detailed prompt>",
  outputPath: "/absolute/path/to/assets/images/chXX-name",
  size: "1024x1024"
})
```

## Master Prompt Template

```
Create a professional INFOGRAPHIC for an O'Reilly-style technical book.

TOPIC: [What the diagram explains]
TYPE: [Pyramid | Pipeline | Cycle | Layers | Comparison | Flow]

CONTENT (include these exact text labels):
- [Label 1]: [Description]
- [Label 2]: [Description]
- [Label 3]: [Description]

CRITICAL STYLE REQUIREMENTS:
- MUST include readable text labels on the diagram
- Professional tech infographic, NOT cartoon or photo-realistic
- Clean white or very light gray background
- Modern sans-serif text (dark navy or black)
- Color palette: Navy (#1e3a5f), Steel blue (#4682b4), Teal (#0d9488)
- Corporate presentation quality, suitable for print
- Think McKinsey report or Gartner quadrant quality
```

## Diagram Type Examples

### Verification Ladder (Pyramid)
```
Create a professional INFOGRAPHIC showing a 5-level verification pyramid.

TOPIC: Software Testing Verification Ladder
TYPE: Ascending staircase/pyramid

CONTENT (label each level with readable text):
- Level 1 (bottom): "SYNTAX"
- Level 2: "RUNTIME"
- Level 3: "LOGIC"
- Level 4: "INTEGRATION"
- Level 5 (top): "E2E"

STYLE: Ascending steps or pyramid, each level clearly labeled with text, gradient from light blue to navy, white background, professional infographic NOT cartoon.
```

### Quality Gates Pipeline
```
Create a professional INFOGRAPHIC showing a quality gates pipeline.

TOPIC: Code Quality Gates
TYPE: Horizontal flow with checkpoints

CONTENT (5 gates with text labels):
- "LINT" → "TYPE" → "TEST" → "BUILD" → "DEPLOY"

STYLE: Horizontal pipeline with labeled checkpoints, green checkmarks for passed gates, white background, corporate presentation quality.
```

### RALPH Loop Cycle
```
Create a professional INFOGRAPHIC showing a 4-phase cycle.

TOPIC: RALPH Loop - Agent Iteration Cycle
TYPE: Circular diagram

CONTENT (4 phases with text labels, clockwise):
- "READ" - Load context
- "ACT" - Execute task
- "LOG" - Commit changes
- "PAUSE" - Clean exit

STYLE: Circular diagram with 4 segments, arrows showing clockwise flow, each segment labeled with text, navy/teal colors, white background.
```

## File Naming

Save to: `assets/images/ch[XX]-[concept-name].png`

Examples:
- `assets/images/ch06-verification-ladder.png`
- `assets/images/ch07-quality-gates.png`
- `assets/images/ch10-ralph-loop.png`

## Quality Checklist

Before accepting:
- [ ] Has clear, readable text labels
- [ ] White/light minimal background
- [ ] NOT cartoon or photo-realistic
- [ ] Professional infographic quality
- [ ] Would look good printed in a technical book

## If Image Looks Wrong

1. Delete: `rm assets/images/chXX-name.png`
2. Refine prompt: Add "MUST include readable text labels" and "NOT cartoon"
3. Regenerate with emphasis on "O'Reilly quality, professional infographic"
