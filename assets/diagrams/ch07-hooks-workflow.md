# Diagram: Claude Code Hooks Execution Timeline

## Description
Visualizes how Claude Code hooks automate quality gate verification, turning manual verification cycles into automatic feedback loops. Shows the timeline of hook execution and the Ctrl+O keyboard shortcut for viewing full error output.

## Primary View: Hook Execution Flow

```mermaid
sequenceDiagram
    participant U as User Request
    participant C as Claude Code
    participant H as Hooks
    participant G as Quality Gates
    participant R as Result

    U->>C: "Add auth function"
    C->>C: Plan changes
    Note over C: Pre-commit hook runs
    C->>H: Write file
    H->>G: post-write.json triggers
    G->>G: eslint {file} --fix
    G->>G: tsc --noEmit
    G->>G: npm test --related

    alt All gates pass
        G-->>C: Success
        C-->>R: Clean code delivered
    else Gate fails
        G-->>C: Error output
        Note over C: Press Ctrl+O for details
        C->>C: Auto-fix issues
        C->>H: Rewrite file
        H->>G: Hooks re-run
        G-->>C: Success
        C-->>R: Clean code delivered
    end
```

## Alternative View 1: Hook Types and Timing

```mermaid
flowchart LR
    subgraph Trigger["Trigger Events"]
        T1["File Write"]
        T2["File Edit"]
        T3["Before Commit"]
    end

    subgraph Hooks["Hook Files"]
        H1["post-write.json"]
        H2["post-edit.json"]
        H3["pre-commit.json"]
    end

    subgraph Actions["Automated Actions"]
        A1["ESLint --fix"]
        A2["tsc --noEmit"]
        A3["npm test"]
        A4["Check for TODOs"]
        A5["Check for secrets"]
    end

    T1 --> H1
    T2 --> H2
    T3 --> H3

    H1 --> A1
    H1 --> A3
    H2 --> A2
    H3 --> A4
    H3 --> A5

    style T1 fill:#e6f3ff
    style T2 fill:#e6f3ff
    style T3 fill:#e6f3ff
```

## Alternative View 2: Manual vs. Automated Workflow

```
MANUAL WORKFLOW (Without Hooks):
────────────────────────────────
1. Claude writes file           [2 sec]
2. You run: npm run lint        [5 sec]
3. Find 5 lint errors
4. Ask Claude to fix            [30 sec]
5. You run: tsc --noEmit        [8 sec]
6. Find 3 type errors
7. Ask Claude to fix            [30 sec]
8. You run: npm test            [15 sec]
9. Find 2 test failures
10. Ask Claude to fix           [30 sec]
11. Repeat steps 2-10...        [???]

Total: 8-10 minutes, 6 manual commands


AUTOMATED WORKFLOW (With Hooks):
────────────────────────────────
1. Claude writes file           [2 sec]
2. Hook runs automatically      [5 sec]
   └─ eslint --fix
   └─ tsc --noEmit
   └─ npm test --related
3. Hook fails? Press Ctrl+O     [1 sec]
4. Claude reads error, fixes    [10 sec]
5. Hook re-runs automatically   [5 sec]
6. Done!                        [0 sec]

Total: 2-3 minutes, 0 manual commands
Savings: 60-70% time reduction
```

## Alternative View 3: Hook Configuration Example

```json
// .claude/hooks/post-write.json
{
  "command": "npx eslint {file} --fix && tsc --noEmit && npm test -- --related {file} --passWithNoTests",
  "description": "Lint, type check, and test in one pass",
  "continueOnError": false
}
```

**Command breakdown**:
| Part | Purpose |
|------|---------|
| `npx eslint {file} --fix` | Auto-fix style issues |
| `&&` | Stop on first failure |
| `tsc --noEmit` | Type check without emitting |
| `npm test -- --related {file}` | Run only related tests |
| `--passWithNoTests` | Don't fail if no tests exist |

## Alternative View 4: Ctrl+O Workflow

```mermaid
flowchart TB
    subgraph Normal["Normal Flow"]
        N1["Claude writes code"]
        N2["Hook runs"]
        N3["Gate fails"]
        N4["Brief error shown"]
    end

    subgraph CtrlO["After Ctrl+O"]
        O1["Full error output"]
        O2["Which hook failed"]
        O3["Exact command run"]
        O4["Stack traces"]
        O5["Assertion details"]
    end

    subgraph Fix["Fix Flow"]
        F1["Claude reads full error"]
        F2["Identifies root cause"]
        F3["Fixes code"]
        F4["Hook re-runs"]
        F5["Gate passes"]
    end

    N1 --> N2 --> N3 --> N4
    N4 -->|"Press Ctrl+O"| O1
    O1 --> O2 --> O3 --> O4 --> O5
    O5 --> F1 --> F2 --> F3 --> F4 --> F5

    style N3 fill:#ffcccc
    style F5 fill:#ccffcc
```

## Alternative View 5: Impact Metrics

| Metric | Without Hooks | With Hooks | Improvement |
|--------|--------------|------------|-------------|
| Time per feature | 8-10 min | 2-3 min | 60-70% faster |
| Manual commands | 6 | 0 | 100% automated |
| Feedback delay | 30-60 sec | 2-5 sec | 90% faster |
| Error discovery | Late | Immediate | Real-time |
| Context switches | Many | Zero | Eliminated |

## Directory Structure

```
project-root/
├── .claude/
│   └── hooks/
│       ├── pre-commit.json    # Before git commit
│       ├── post-edit.json     # After editing existing file
│       └── post-write.json    # After creating/overwriting file
├── src/
│   └── auth.ts                # Files being written
└── package.json
```

## Usage Notes

**Where this appears in chapter**: Section "Automating Gates with Claude Code Hooks" (lines 213-329)

**Key teaching point**: Hooks transform manual verification from "run command, read output, ask for fix" into automatic feedback loops where Claude sees and fixes errors immediately.

**Keyboard shortcut**: Ctrl+O shows complete error output when a hook fails, enabling Claude to understand and fix the root cause.

## Context from Chapter

From ch07-quality-gates-that-compound.md lines 213-227:
> "Manual verification of AI-generated code creates a tedious cycle... This manual verification loop is time-consuming, error-prone, and frustrating."

From ch07-quality-gates-that-compound.md lines 317-329:
> "Without hooks:
> - 8-10 minutes per feature
> - 6 manual commands
> With hooks:
> - 2-3 minutes per feature
> - 0 manual commands"
