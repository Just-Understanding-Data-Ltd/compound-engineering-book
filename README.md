# The Meta-Engineer: 10x Was the Floor

**Building Autonomous AI Systems with Claude Code**

by James Phoenix

---

## About

This is the companion repository for *The Meta-Engineer*, a book about building compound engineering systems with Claude Code. It contains all runnable code examples, exercises, and the infrastructure used to write the book itself.

The book teaches meta-engineering: orchestrating AI agents to build systems that build systems.

## Get the Book

Available on [Leanpub](https://leanpub.com/the-meta-engineer).

## Code Examples

Every chapter includes runnable TypeScript examples. Clone the repo and run any example:

```bash
git clone https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book.git
cd compound-engineering-book
npm install
npx tsx examples/ch04/agent.ts
```

### Examples by Chapter

| Chapter | Topic | Examples |
|---------|-------|----------|
| [Ch01](examples/ch01/) | The Compound Systems Engineer | 2 |
| [Ch02](examples/ch02/) | Getting Started with Claude Code | 3 |
| [Ch03](examples/ch03/) | Prompting Fundamentals | 3 |
| [Ch04](examples/ch04/) | Writing Your First CLAUDE.md | 4 |
| [Ch05](examples/ch05/) | The 12-Factor Agent | 5 |
| [Ch06](examples/ch06/) | The Verification Ladder | 3 |
| [Ch07](examples/ch07/) | Quality Gates That Compound | 3 |
| [Ch08](examples/ch08/) | Error Handling & Debugging | 7 |
| [Ch09](examples/ch09/) | Context Engineering Deep Dive | 7 |
| [Ch10](examples/ch10/) | The RALPH Loop | 5 |
| [Ch11](examples/ch11/) | Sub-Agent Architecture | 5 |
| [Ch12](examples/ch12/) | Development Workflows | 6 |
| [Ch13](examples/ch13/) | Building the Harness | 5 |
| [Ch14](examples/ch14/) | The Meta-Engineer Playbook | 6 |
| [Ch15](examples/ch15/) | Model Strategy & Cost Optimization | 8 |

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- TypeScript (`npm install -g typescript`)

### Running Examples

```bash
# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Run any example
npx tsx examples/ch08/circuit-breaker.ts
npx tsx examples/ch10/ralph-loop.ts
npx tsx examples/ch13/agent-swarm.ts
```

## Book Structure

```
chapters/          # Book content (15 chapters)
examples/          # Runnable TypeScript code examples
exercises/         # Try It Yourself exercises
assets/diagrams/   # Mermaid diagrams
prds/              # Product requirement documents
```

**Part I: Foundations** (Ch 1-3) - Start here if you're new to Claude Code

**Part II: Core Techniques** (Ch 4-6) - Essential patterns for daily work

**Part III: Advanced Patterns** (Ch 7-9) - Deep dives for power users

**Part IV: Production Systems** (Ch 10-15) - Building autonomous systems

## How This Book Was Written

This book was written using the techniques it teaches. A RALPH loop (Ch10) ran autonomously, picking tasks from a scored queue, writing content, running reviews, and committing. 151 tasks were completed across 60+ iterations.

The meta-engineering approach (Ch14) meant the author spent time directing agents rather than typing content. The book is proof that the patterns work.

## License

All rights reserved. Code examples are MIT licensed for educational use.
