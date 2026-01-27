# Test Validation Markdown

This file is used to test the code block validator.

## Passing TypeScript Block

```typescript
console.log("This should pass!")
```

## Passing Bash Block

```bash
echo "Hello from bash"
```

## Skipped Block

```typescript
// skip-validation
console.log("This should be skipped")
throw new Error("This would fail if not skipped")
```
