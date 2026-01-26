# Leanpub Formatting Guide

Leanpub uses Markua, a Markdown dialect. Follow these conventions.

## Book Structure

```
manuscript/
├── Book.txt          # Chapter order
├── ch01-title.md
├── ch02-title.md
├── ...
└── images/
    └── diagram.png
```

## Book.txt

```
frontmatter:
  preface.md

mainmatter:
  ch01-compound-engineer.md
  ch02-getting-started.md
  ...

backmatter:
  appendix-a.md
  appendix-b.md
```

## Chapter Headers

```markdown
# Chapter Title

{#chapter-id}
This is the chapter content...
```

Use `{#id}` for cross-references.

## Code Blocks

```markdown
{lang=typescript}
~~~~~~~~
const example = "code";
~~~~~~~~
```

Or standard fenced blocks:

```typescript
const example = "code";
```

## Callouts

### Information
```markdown
I> This is an informational aside.
I>
I> It can span multiple paragraphs.
```

### Warning
```markdown
W> Warning: This is important!
```

### Tip
```markdown
T> Tip: A helpful suggestion.
```

### Error
```markdown
E> Error: What not to do.
```

## Images

```markdown
![Caption](images/diagram.png)
```

With attributes:
```markdown
{width=80%}
![Caption](images/diagram.png)
```

## Cross-References

```markdown
See [Chapter 5](#chapter-5) for more details.
```

## Aside/Sidebar

```markdown
A> ### Sidebar Title
A>
A> Sidebar content goes here.
A> Can include code, lists, etc.
```

## Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Formatting

- **Bold**: `**text**`
- *Italic*: `*text*`
- `Code`: `` `code` ``
- Links: `[text](url)`

## Sample Conversion

Before (standard markdown):
```markdown
> **Note**: This is important.
```

After (Markua):
```markdown
I> **Note**: This is important.
```

## Preview

Use Leanpub's preview feature to check formatting before publishing.

## Common Issues

1. **Images not showing**: Check path is relative to manuscript folder
2. **Code highlighting wrong**: Specify language explicitly
3. **Callouts not rendering**: Ensure no space before `I>`, `W>`, etc.
4. **Cross-refs broken**: Check ID matches exactly, including case
