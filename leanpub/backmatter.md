# Appendix A: Quick Reference

## Essential Commands

```bash
# Start Claude Code
claude

# Run with specific prompt
claude -p "your prompt here"

# Resume session
claude --resume

# Run RALPH loop
./scripts/ralph.sh --max-hours 3
```

## Key Patterns

| Pattern | Use Case |
|---------|----------|
| Progressive Disclosure | Load context on demand |
| Verification Ladder | Catch errors at each level |
| Circuit Breaker | Prevent runaway failures |
| Clean Slate Recovery | Reset corrupted context |

# Appendix B: Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/sdk)

# About the Author

James Phoenix is a software engineer focused on AI-assisted development and compound engineering systems.
