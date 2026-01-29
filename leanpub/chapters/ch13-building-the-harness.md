# Chapter 13: Building the Harness {#_chapter_13:_building_the_harness} {#ch13-building-the-harness}

[]{.index term="harness"} []{.index term="signal processing"} []{.index term="hooks"}

Claude Code is a harness around a Large Language Model (LLM). Your job is to build a harness around Claude Code.

This is the fundamental insight that separates productive AI-assisted developers from those who struggle. The language model itself is a noisy channel. Each layer of infrastructure you build around it increases signal-to-noise ratio, constrains the solution space, and provides feedback loops for self-correction. By the end of this chapter, you will understand how to construct a four-layer harness architecture that transforms unreliable probabilistic outputs into consistent, high-quality code.

## The Signal Processing Mental Model {#_the_signal_processing_mental_model}

Think of AI-assisted development as a signal processing problem. Your intent enters the system. Somewhere in the middle, an LLM interprets that intent and generates code. The quality of the output depends entirely on how well you control the signal path.

Without any harness, the raw LLM is unpredictable. It might produce excellent code. It might produce nonsense. It might hallucinate APIs that do not exist. The variance is too high for production use.

Each layer of harness you add filters noise and amplifies signal. The first layer configures Claude Code itself. The second layer engineers your repository for clarity. The third layer automates your processes. The fourth layer closes the feedback loop so the system optimizes itself.

The key insight is this: the LLM is the least controllable part of the system. Everything else is engineering. You cannot make the model fundamentally smarter, but you can control everything around it. Resources spent on harness construction outperform resources spent on prompt tweaking by an order of magnitude.

::: {#fig-signal-processing wrapper="1" align="center" width="700"}
![Signal Processing Model: How harness layers filter noise from intent to output](ch13-signal-processing.png){alt="Signal Processing Model"}
:::

If something fails 30% of the time, do not write 100 different prompts hoping one works. Build one layer of infrastructure that constrains the system to success.

::: {#fig-harness-architecture wrapper="1" align="center" width="600"}
![Harness Architecture: Four layers of control building on the raw LLM](ch13-harness-architecture.png){alt="Harness Architecture"}
:::

## Layer 1: Configuring Claude Code {#_layer_1:_configuring_claude_code}

The innermost layer is Claude Code itself. This is already a harness around the raw LLM, but you must configure it properly to maximize signal.

### CLAUDE.md as Agent Specification {#_claude_md_as_agent_specification}

Your CLAUDE.md file is the primary control surface. It tells the agent WHAT the project is, WHY decisions were made, and HOW to implement features correctly.

Consider an authentication system. A weak CLAUDE.md might say "This is a Node.js API." A strong one provides architectural constraints:

``` markdown
# Authentication Service

## Architecture
- All auth functions return AuthResult:
  { success: boolean, user?: User, error?: string }
- Passwords use bcrypt with cost factor 12
- Sessions stored in Redis, not memory
- Rate limiting: 5 attempts per minute per IP

## Invariants
- Never store plaintext passwords
- Never log tokens or credentials
- All auth endpoints require HTTPS in production
```

This constrains the solution space. The agent cannot accidentally store passwords in plaintext because the invariant explicitly forbids it. The required return type eliminates inconsistent error handling.

### Claude Code Hooks {#_claude_code_hooks}

Hooks run automatically at key points in the workflow. Pre-processing hooks handle linting and formatting. Post-processing hooks validate tests and types.

A pre-commit hook prevents broken code from entering version control:

``` bash
#!/bin/bash
# .claude/hooks/pre-commit.sh

# Type check
npm run typecheck || exit 1

# Lint
npm run lint || exit 1

# Run tests
npm test || exit 1

echo "All checks passed"
```

Post-edit hooks can run tests immediately after Claude makes changes, catching errors before they compound:

``` bash
#!/bin/bash
# .claude/hooks/post-edit.sh

# Run tests related to changed files
npm test -- --changed
```

### Scoping and Constraints {#_scoping_and_constraints}

Define explicit boundaries for what the agent can touch. Hard constraints prevent accidents:

``` markdown
## Scope
- You may modify files in src/features/
- You may NOT modify src/core/ without explicit approval
- Database migrations require human review
- Any changes to auth.ts must include tests
```

Quality gates enforce standards. Tests must pass before suggesting changes. Type errors must be zero. Linting must be clean. These gates catch problems early, before they propagate through the codebase.

## Layer 2: Repository Engineering {#_layer_2:_repository_engineering}

The second layer is your repository environment. Better environment equals better signal. A well-engineered repository gives the agent clear feedback about what works and what does not.

### Observability Stack {#_observability_stack}

Observability is not just monitoring for humans. It provides signal to agents. When Claude can see traces, metrics, and logs, it can diagnose problems that would otherwise require human intervention.

A basic observability stack uses OpenTelemetry (OTEL) and Jaeger (distributed tracing tool):

``` yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC

  otel-collector:
    image: otel/opentelemetry-collector:latest
    volumes:
      - ./otel-config.yaml:/etc/otel/config.yaml
```

With tracing enabled, an agent can see that a request is slow because the database query takes 800ms, not because the business logic is inefficient. This specificity eliminates guesswork.

### Testing Infrastructure {#_testing_infrastructure}

Tests are the primary feedback mechanism for agents. They must be fast, reliable, and informative.

Use context-efficient test runners that provide clear signal. Silence on success, detail on failure. This follows the backpressure pattern from Chapter 9:

``` bash
# run-tests.sh
if npm test 2>&1 | grep -q "FAIL"; then
    # Show full output only on failure
    npm test
    exit 1
else
    echo "✓ All tests passed"
fi
```

Multiple test levels provide different kinds of signal:

+---------------------------+------------------------------------------+
| Test Level                | Signal                                   |
+===========================+==========================================+
| Unit tests                | Fast feedback on individual functions    |
+---------------------------+------------------------------------------+
| Integration tests         | Verify components work together          |
+---------------------------+------------------------------------------+
| End-to-End (E2E) tests    | Confirm real user flows work             |
+===========================+==========================================+
| Load tests                | Catch performance regressions            |
+===========================+==========================================+

### Production/Development Parity {#_production/development_parity}

AI-generated code must work in production, not just locally. Dockerization ensures consistency:

``` dockerfile
FROM node:20-slim AS base
WORKDIR /app

# Same environment everywhere
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
```

When the development environment matches production, the agent's local testing actually predicts production behavior. Without parity, you get "works on my machine" failures at the worst possible time.

### Code Structure Using DDD {#_code_structure_using_ddd}

Domain-Driven Design (DDD) gives LLMs clear boundaries. Each layer has explicit responsibilities:

    src/
    ├── domain/           # Business logic (pure functions)
    │   ├── entities/
    │   └── value-objects/
    ├── application/      # Use cases (orchestration)
    │   └── services/
    ├── infrastructure/   # External concerns (databases, APIs)
    │   ├── database/
    │   └── api/
    └── presentation/     # UI and API handlers

DDD helps agents because the structure encodes design decisions. The domain layer cannot depend on infrastructure. Application services orchestrate but do not contain business logic. These constraints prevent architectural erosion.

## Layer 3: Meta-Engineering {#_layer_3:_meta_engineering}

The third layer automates the automation process itself. You build tools that make AI-assisted development more efficient.

### Claude Code Scripts and Workflows {#_claude_code_scripts_and_workflows}

Create workflow-specific agent prompts in `.claude/commands/`:

    .claude/
    ├── commands/
    │   ├── implement-feature.md   # "Given this spec, implement..."
    │   ├── fix-failing-test.md    # "This test is failing..."
    │   ├── review-pr.md           # "Review this PR for..."
    │   └── refactor-module.md     # "Refactor this to..."
    └── hooks/
        ├── pre-commit.sh
        └── post-edit.sh

Each command encapsulates a repeatable workflow. Instead of explaining the same process every time, you invoke a command and let the structured prompt guide the work.

### Tests for Tests {#_tests_for_tests}

Meta-testing verifies your test infrastructure actually works:

``` typescript
describe("test infrastructure", () => {
  it("run_silent captures failures correctly", async () => {
    const result = await runSilent("failing test", "exit 1");
    expect(result.success).toBe(false);
    expect(result.output).toContain("exit code");
  });

  it("backpressure compresses passing tests", async () => {
    const result = await runSilent("passing test", "exit 0");
    expect(result.output).toBe(""); // No noise on success
  });
});
```

If your test runner has bugs, all the tests it runs become unreliable. Testing the infrastructure catches these problems early.

### Tests for Telemetry {#_tests_for_telemetry}

Verify observability before you need it in production:

``` typescript
describe("telemetry", () => {
  it("traces propagate through services", async () => {
    const span = tracer.startSpan("test-span");
    const traceId = span.spanContext().traceId;

    await callDownstreamService({ traceId });

    const traces = await jaeger.getTraces(traceId);
    expect(traces.spans.length).toBeGreaterThan(1);
  });
});
```

This ensures that when an agent needs to diagnose a production issue, the telemetry actually provides useful data.

### Agent Swarm Tactics {#_agent_swarm_tactics}

For large tasks, parallel agent execution multiplies throughput:

``` typescript
async function swarmImplementation(spec: Spec) {
  const tasks = breakdownSpec(spec);  // ①

  // Launch agents in parallel
  const results = await Promise.all(  // ②
    tasks.map((task) =>
      spawnAgent({
        prompt: task.prompt,
        scope: task.files,  // ③
        constraints: task.constraints,
      })
    )
  );

  // Merge and resolve conflicts
  return mergeResults(results);  // ④
}
```

::: callout-list
1.  Decompose spec into independent, non-overlapping tasks

2.  `Promise.all` runs all agents concurrently (5x speedup for 5 agents)

3.  Scoped file paths prevent agents from conflicting on same files

4.  Merge step resolves any conflicts and combines outputs
:::

Five agents implementing different modules simultaneously can complete work five times faster than a single agent. The key is breaking tasks into independent units with clear boundaries.

### Nightly Job Orchestration {#_nightly_job_orchestration}

Automate repeating tasks that agents can handle:

``` typescript
// nightly-jobs.config.ts
export default {
  schedule: '0 2 * * *',  // ①
  jobs: [
    {
      name: 'update-dependencies',
      command: 'npm update && npm test',  // ②
      onSuccess: 'create-pr',  // ③
      onFailure: 'notify-slack',
    },
    {
      name: 'security-audit',
      command: 'npm audit --audit-level=moderate',
      onFailure: 'create-issue',  // ④
    },
  ],
};
```

::: callout-list
1.  Cron syntax: runs at 2 AM daily during low-traffic hours

2.  Chained commands: update dependencies then verify tests still pass

3.  Success creates PR for human review (agent doesn't merge)

4.  Security issues create GitHub issue with audit details
:::

Dependency updates, performance benchmarks, and security audits happen automatically. When something fails, the system creates issues or notifications. Work continues while you sleep.

### Agent State and Checkpoint Patterns {#_agent_state_and_checkpoint_patterns}

Long-running agents face three challenges: human-in-the-loop workflows requiring approval, fault tolerance when processes crash, and context degradation over extended sessions. Checkpoint patterns solve all three by externalizing state to durable storage.

**The Three-Tier Memory Hierarchy**

Agent memory operates across three complementary tiers:

ifdef

:   backend-pdf\[\]

    +---------------+------------------------+-----------------------------+------------------------------------+
    | Tier          | Storage                | Durability                  | Use Case                           |
    +===============+========================+=============================+====================================+
    | Session       | In-memory              | Lost on termination         | Quick sub-agent tasks              |
    +---------------+------------------------+-----------------------------+------------------------------------+
    | File-based    | TASKS.md, progress.txt | Survives process boundaries | RALPH loop iterations              |
    +===============+========================+=============================+====================================+
    | Event-sourced | Append-only event log  | Full history reconstruction | Production agents with audit needs |
    +===============+========================+=============================+====================================+

endif

:   

<!-- -->

ifndef

:   backend-pdf\[\]

**Session tier**

:   In-memory storage. Lost on termination. Use for quick sub-agent tasks.

**File-based tier**

:   TASKS.md, progress.txt. Survives process boundaries. Use for RALPH loop iterations.

**Event-sourced tier**

:   Append-only event log. Full history reconstruction. Use for production agents with audit needs.

endif

:   Most production agents combine file-based memory (human-readable, git-tracked) with event-sourcing (complete audit trail, time-travel debugging). The RALPH loop uses file-based memory because each iteration spawns a fresh agent that needs cross-session continuity.

**Checkpoint After Every Tool Call**

The key pattern for fault tolerance is checkpointing after each significant action:

``` typescript
async function runWithCheckpoints(
  thread: AgentThread
): Promise<void> {
  while (thread.status === "running") {
    const toolCall = await getNextAction(thread);

    // Append to event log
    thread.events.push({
      type: "tool_called",
      tool: toolCall.name,
      params: toolCall.params,
      timestamp: new Date(),
    });

    // Execute the tool
    const result = await executeToolCall(toolCall);

    // Checkpoint immediately after execution
    thread.events.push({
      type: "tool_result",
      result,
      timestamp: new Date(),
    });
    await saveThread(thread);  // Durable checkpoint

    // If process crashes here, we can resume from last checkpoint
  }
}
```

Without this pattern, a crash at 80% completion loses all progress. With checkpoints, the agent resumes from the last successful tool call.

**Webhook Integration for Human Approval**

When an agent needs approval before proceeding, it cannot block indefinitely. Instead, it checkpoints state and notifies humans via webhook:

``` typescript
// Agent pauses and exits cleanly
if (requiresApproval(toolCall)) {
  thread.events.push({
    type: "approval_requested",
    action: toolCall.name,
    timestamp: new Date(),
  });
  thread.status = "paused";
  await saveThread(thread);
  await notifyHuman(thread.id, toolCall);
  return thread;  // Process exits, webhook resumes later
}

// Webhook endpoint resumes the agent
app.post("/webhook/resume/:threadId", async (req, res) => {
  const { threadId } = req.params;
  const { approved, feedback, approver } = req.body;

  if (approved) {
    thread.events.push({
      type: "approval_granted",
      by: approver,
      timestamp: new Date(),
    });
    agent.resume(threadId, feedback);  // Resume in background
    res.json({ status: "resuming", threadId });
  }
});
```

This pattern enables deployment gates, PR reviews, and any workflow requiring human judgment without blocking API connections for hours.

### Agent Reliability Patterns {#_agent_reliability_patterns}

Building a demo agent is easy. Building a reliable agent is exponentially harder. Up to 95% of AI agent proof-of-concepts fail to make it to production, primarily due to reliability issues.

**The Exponential Reliability Problem**

Individual action reliability compounds catastrophically across multi-step tasks:

+----------------------+-----------------------+----------------------------+
| Actions              | Per-Action Success    | Overall Success            |
+======================+=======================+============================+
| 5                    | 95%                   | 77%                        |
+----------------------+-----------------------+----------------------------+
| 10                   | 95%                   | 60%                        |
+----------------------+-----------------------+----------------------------+
| 20                   | 95%                   | 36% (worse than coin flip) |
+======================+=======================+============================+
| 30                   | 95%                   | 21%                        |
+======================+=======================+============================+

The formula is simple: `Overall` `=` `(Per-Action)^N`. At 95% per-action reliability, a 20-action workflow succeeds only 36% of the time. This explains why demo agents fail in production. Real workflows demand complex sequences where compound failures become inevitable.

**The Four-Turn Framework**

Reliable agents operate through structured turns. Each turn has four phases:

1.  **Understand State**: Verify context and requirements before acting

2.  **Decide Action**: Choose the appropriate response based on understanding

3.  **Execute**: Perform the task

4.  **Verify Outcome**: Confirm the action actually succeeded

Most basic agents skip steps 1 and 4. They do not verify context before acting, and they trust API responses without checking outcomes. This is exactly where reliability collapses.

``` typescript
class ReliableAgent {
  async execute(task: Task): Promise<Result> {
    // Step 1: Understand
    const understanding = await this.understand(task);
    if (!understanding.confident) {
      return this.requestClarification(understanding.questions);
    }

    // Step 2: Decide
    const plan = await this.decide(understanding);

    // Step 3: Execute
    const execution = await this.executeWithRetry(plan);

    // Step 4: Verify (MANDATORY)
    const verification = await this.verify(execution, task);
    if (!verification.success) {
      return this.handleFailure(verification, task);
    }

    return execution;
  }
}
```

**Pre-Action Validation**

Before acting, agents should run explicit checks:

+------------------------------+----------------------------------------------+
| Check                        | Example                                      |
+==============================+==============================================+
| Required info available?     | "Which order?" before shipping changes       |
+------------------------------+----------------------------------------------+
| Ambiguous request?           | Detect when clarification needed             |
+------------------------------+----------------------------------------------+
| Prerequisites met?           | Check code validity before applying changes  |
+==============================+==============================================+
| Authorization confirmed?     | Verify permissions before destructive action |
+==============================+==============================================+

``` typescript
async function preActionChecks(intent: Intent): Promise<CheckResult> {
  const checks = [
    verifyRequiredInfo(intent),
    detectAmbiguity(intent),
    validatePrerequisites(intent),
    confirmAuthorization(intent),
  ];

  const results = await Promise.all(checks);
  const failed = results.filter(r => !r.passed);

  if (failed.length > 0) {
    return { proceed: false, issues: failed };
  }

  return { proceed: true };
}
```

**Post-Action Verification**

Agents must confirm actions actually succeeded. APIs can return 200 but fail silently. Partial successes can look complete. Business logic in other systems can revert changes.

``` typescript
// BAD: Trusting API response
const response = await api.updateOrder(orderId, changes);
if (response.status === 200) {
  return "Order updated"; // Might not actually be true!
}

// GOOD: Verify actual outcome
const response = await api.updateOrder(orderId, changes);
if (response.status === 200) {
  const order = await api.getOrder(orderId);
  const verified = verifyChangesApplied(order, changes);

  if (!verified) {
    return {
      success: false,
      reason: "Changes not reflected in order state"
    };
  }

  return { success: true };
}
```

**The Reliability Stack**

Layer these defenses to improve overall reliability:

    ┌─────────────────────────────────────────────────────────────┐
    │  Layer 4: Human Escalation                                  │
    │  "Know when to ask for help"                                │
    ├─────────────────────────────────────────────────────────────┤
    │  Layer 3: Post-Action Verification                          │
    │  "Confirm the outcome, not just the response"               │
    ├─────────────────────────────────────────────────────────────┤
    │  Layer 2: Pre-Action Validation                             │
    │  "Check before you act"                                     │
    ├─────────────────────────────────────────────────────────────┤
    │  Layer 1: Task Decomposition                                │
    │  "Small tasks = fewer failure points"                       │
    └─────────────────────────────────────────────────────────────┘

Every 1% improvement in per-action reliability compounds dramatically:

+----------------------+-----------------------+----------------------+
| Current              | Target                | 10-Action Workflow   |
+======================+=======================+======================+
| 95%                  | 99%                   | 60% → 90%            |
+----------------------+-----------------------+----------------------+
| 95%                  | 99.5%                 | 60% → 95%            |
+======================+=======================+======================+
| 95%                  | 99.9%                 | 60% → 99%            |
+======================+=======================+======================+

The RALPH loop (Chapter 10) helps reliability by starting each task with fresh context, avoiding context degradation and goal drift. Smaller tasks mean fewer actions per workflow, which directly improves overall success rates.

### The 12-Factor Agent Principles {#_the_12_factor_agent_principles}

The "12 Factor Agents" framework (developed by HumanLayer) distills production agent patterns into replicable principles. Several factors are directly relevant to harness construction.

**Factor 5: Unify Execution State and Business State**

Agents that scatter state across variables, databases, and external services become impossible to debug and resume. The solution: derive all execution state from a single event stream.

``` typescript
interface AgentThread {
  id: string;
  events: Event[];
  status: "running" | "paused" | "completed" | "failed";
}

// State is derived from events, never stored separately
function deriveState(thread: AgentThread): ExecutionState {
  const stepCompleteEvents = thread.events
    .filter(e => e.type === "step_complete");
  const approvalRequests = thread.events
    .filter(e => e.type === "approval_requested");
  const approvalGrants = thread.events
    .filter(e => e.type === "approval_granted");

  return {
    currentStep: stepCompleteEvents.length,
    pendingApprovals: approvalRequests.filter(req =>
      !approvalGrants.find(grant => grant.requestId === req.id)
    ),
    errors: thread.events.filter(e => e.type === "error"),
    canResume: thread.status !== "completed" &&
      thread.status !== "failed",
  };
}
```

When state derives from events, you get serialization for free. You can replay any point in execution by reducing over the event log. Debugging becomes "show me events 15-20" instead of "which variable held the problem state?"

**Factor 7: Contact Humans with Tool Calls**

Agents that contact humans via plaintext responses lose structure. When the agent just says "I need approval to proceed," there is no audit trail, no routing logic, no timeout handling. The solution: treat human contact as structured tool calls.

``` typescript
const humanTools = [
  {
    name: "request_human_approval",
    parameters: {
      action: {
        type: "string",
        description: "What action needs approval"
      },
      context: {
        type: "string",
        description: "Relevant context for decision"
      },
      urgency: { type: "string", enum: ["low", "medium", "high"] },
      channel: { type: "string", enum: ["slack", "email"] },
    },
  },
  {
    name: "request_human_input",
    parameters: {
      question: { type: "string" },
      options: {
        type: "array",
        items: { type: "string" },
        optional: true
      },
    },
  },
];

async function executeHumanTool(
  toolCall: ToolCall, thread: AgentThread
) {
  // Route to appropriate channel based on urgency
  const channel =
    toolCall.parameters.urgency === "high" ? "slack" : "email";
  await notifyHuman(toolCall, channel);

  // Structured pause with clear awaiting state
  thread.status = "paused";
  thread.events.push({
    type: "awaiting_human",
    toolCall,
    timestamp: Date.now(),
  });

  return { status: "paused", awaiting: "human_response" };
}
```

Structured human contact enables multi-channel routing (urgent requests go to Slack, low-priority to email), timeout handling (auto-escalate after 4 hours), and complete audit trails for compliance.

**Factor 10: Small, Focused Agents**

Monolithic agents that handle "deploy, test, monitor, rollback, notify, and audit" fail reliably. As context grows, LLM performance degrades. The solution: scope agents to 3-20 steps maximum.

``` typescript
// BAD: Monolithic agent
const megaAgent = new Agent({
  capabilities: [
    "deploy", "test", "monitor",
    "rollback", "notify", "audit"
  ],
});

// GOOD: Focused agents composed in a DAG
const deployAgent = new Agent({
  capabilities: ["deploy_staging", "deploy_prod"]
});
const testAgent = new Agent({
  capabilities: ["run_tests", "analyze_results"]
});
const notifyAgent = new Agent({
  capabilities: ["slack", "email", "pagerduty"]
});

// Deterministic orchestration connects them
async function deploymentWorkflow(pr: PullRequest) {
  // Step 1: Deploy to staging (deterministic)
  await deployToStaging(pr);

  // Step 2: Run tests (agent decides which tests)
  const testPlan = await testAgent.planTests(pr);
  const results = await runTests(testPlan);

  // Step 3: Conditional routing (deterministic)
  if (results.passed) {
    await deployAgent.requestProdApproval(pr);
  } else {
    await notifyAgent.alertFailure(results);
  }
}
```

The key insight: agents handle well-scoped decisions within deterministic workflows. The orchestration is code (predictable), while the decisions are LLM (flexible). This matches the harness philosophy: constrain what you can control, let the LLM do what it does best within those constraints.

**Factor 12: Make Your Agent a Stateless Reducer**

Agents with hidden state are impossible to test, replay, or parallelize. The solution: treat agents as pure functions that transform input state into output state.

``` typescript
// Agent as a pure function
type AgentReducer = (state: AgentState, event: Event) => AgentState;

const agentReducer: AgentReducer = (state, event) => {
  switch (event.type) {
    case "user_input":
      return { ...state, pendingInput: event.content };

    case "tool_call":
      return { ...state, lastToolCall: event.toolCall };

    case "tool_result":
      return {
        ...state,
        context: [...state.context, event],
        lastToolCall: null,
      };

    case "error":
      return {
        ...state,
        errors: [...state.errors, event],
        consecutiveErrors: state.consecutiveErrors + 1,
      };

    case "human_response":
      return {
        ...state,
        context: [...state.context, event],
        status: "running",
      };

    default:
      return state;
  }
};

// Replay any state by reducing over events
function replayState(events: Event[]): AgentState {
  return events.reduce(agentReducer, initialState);
}
```

The stateless reducer pattern enables time-travel debugging (replay to any point), parallel execution (same input yields same output), and testing (no hidden state to mock). Combined with the unified state from Factor 5, this creates agents that are fundamentally debuggable.

**Applying the Factors to Your Harness**

The 12-factor principles reinforce the harness architecture:

+-------------------------+----------------------------+----------------------------------------+
| Factor                  | Harness Layer              | Application                            |
+=========================+============================+========================================+
| Factor 5: Unified State | Layer 3 (Checkpoints)      | Event-sourced agent threads            |
+-------------------------+----------------------------+----------------------------------------+
| Factor 7: Human Tools   | Layer 3 (Webhooks)         | Structured approval requests           |
+-------------------------+----------------------------+----------------------------------------+
| Factor 10: Small Agents | Layer 3 (Swarms)           | 5-20 step micro-agents in DAGs         |
+=========================+============================+========================================+
| Factor 12: Stateless    | Layer 4 (Optimization)     | Pure reducer enables automated testing |
+=========================+============================+========================================+

The harness constrains agent behavior. The 12 factors provide the design principles that make those constraints effective.

## Layer 4: Closed-Loop Optimization {#_layer_4:_closed_loop_optimization}

The outermost layer uses telemetry as active feedback control. Instead of passive monitoring, the system measures behavior, detects constraint violations, and automatically fixes problems.

### Telemetry as Control Input {#_telemetry_as_control_input}

The traditional model is reactive: write code, measure performance, debug if problems appear. The closed-loop model is proactive: define constraints, let the system alter code until constraints are satisfied.

::: {#fig-closed-loop-optimization wrapper="1" align="center" width="600"}
![Closed-Loop Optimization: Telemetry-driven automatic fixing until constraints satisfied](ch13-closed-loop-optimization.png){alt="Closed-Loop Optimization"}
:::

    Service under load
            ↓
    Telemetry captured (memory, latency, errors)
            ↓
    Constraints evaluated
            ↓
    Violations detected?
            ↓
    Agent proposes fix → Apply → Re-test
            ↓
    Loop until constraints satisfied

This is control theory applied to software development.

### Constraint Specification {#_constraint_specification}

Define performance constraints as mathematical invariants:

``` yaml
# constraints.yaml
performance:
  memory_max_mb: 300
  p99_latency_ms: 100
  heap_growth_slope: 0  # No leaks

triggers:
  on_violation: spawn_optimizer_agent
  max_iterations: 5
  escalate_to_human: true
```

These constraints are like type signatures for runtime behavior. The system enforces them automatically.

### The Optimization Loop {#_the_optimization_loop}

The agent optimization loop works as follows:

1.  Generate diagnostics from constraint violations

2.  Infer root causes using profiler output and traces

3.  Agent proposes targeted refactoring

4.  Apply patch and re-run tests plus load test

5.  Score against constraints

6.  Loop until pass or escalate to human

Here is a concrete example. The constraint `heap.retained_growth_slope` `>` `0` is violated. The agent analyzes heap snapshots and finds an event list that grows without bound:

``` python
# Before
class EventProcessor:
    def __init__(self):
        self.events = []

    def process(self, event):
        self.events.append(event)
        if len(self.events) >= 100:
            self._flush()
```

The agent identifies the missing cleanup and proposes a fix:

``` python
# After
class EventProcessor:
    def __init__(self):
        self.events = []

    def process(self, event):
        self.events.append(event)
        if len(self.events) >= 100:
            self._flush()
            self.events.clear()  # Fix: clear after flush
```

Re-run verification confirms `heap.retained_growth_slope` `=` `0`. Constraint satisfied.

### CI/CD Integration {#_ci/cd_integration}

Continuous Integration/Continuous Deployment (CI/CD) pipelines make the optimization loop part of your workflow:

``` yaml
# .github/workflows/performance-optimization.yml
name: Closed-Loop Optimization

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nightly

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - name: Run load tests
        run: ./scripts/load-test.sh

      - name: Capture telemetry
        run: ./scripts/capture-metrics.sh > metrics.json

      - name: Evaluate constraints
        run: |
          ./scripts/check-constraints.sh \
            metrics.json constraints.yaml

      - name: Agent optimization loop
        if: failure()
        run: |
          claude --agent optimizer \
            --constraints constraints.yaml \
            --metrics metrics.json \
            --max-iterations 5
```

When constraints are violated, the optimizer agent automatically diagnoses and fixes the problem. You review the PR in the morning instead of debugging all night.

### Agent-Specific CI/CD Patterns {#_agent_specific_ci/cd_patterns}

Traditional CI/CD assumes deterministic tests with fast feedback. AI agents break these assumptions in three ways: non-determinism (the same prompt produces different outputs), cost constraints (running full agent flows is expensive), and behavioral verification (you need to verify the agent accomplished the task, not just that it ran).

**Tiered Verification**

Run different gates based on trigger type:

``` yaml
# .github/workflows/agent-ci.yml
on:
  pull_request:    # Lightweight checks
  schedule:
    - cron: '0 2 * * *'  # Nightly comprehensive

jobs:
  # Always run: fast, cheap, deterministic
  static-analysis:
    steps:
      - run: npx tsc --noEmit
      - run: |
          # Check for prompt anti-patterns
          ! grep -r "delve\|crucial\|leverage" prompts/ || exit 1

  # PR: cached agent tests only
  cached-tests:
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/cache@v4
        with:
          path: .agent-cache/
          key: agent-responses-${{ hashFiles('prompts/**') }}
      - run: bun test --cached-only agents/

  # Nightly: full verification
  full-verification:
    if: github.event_name == 'schedule'
    steps:
      - run: bun test agents/
        env:
          AGENT_COST_LIMIT: '5.00'
```

PRs get cached tests only (free, 30 seconds). Nightly runs refresh the cache with full agent execution (\$5 budget). This reduces CI costs from \$40/day to \$5/day while maintaining coverage.

**Response Caching for Speed**

Cache agent responses to enable fast PR checks:

``` typescript
// lib/agent-cache.ts
import { createHash } from 'crypto';
import { readFile, writeFile, existsSync } from 'fs';

function hashPrompt(prompt: string, systemPrompt?: string): string {
  const content = `${systemPrompt || ''}|||${prompt}`;
  return createHash('sha256')
    .update(content).digest('hex').slice(0, 16);
}

export async function runWithCache(
  prompt: string,
  systemPrompt: string,
  runner: (p: string, s: string) => Promise<string>
): Promise<{ response: string; cached: boolean }> {
  const hash = hashPrompt(prompt, systemPrompt);
  const cachePath = `.agent-cache/${hash}.json`;

  if (existsSync(cachePath)) {
    const cached = JSON.parse(await readFile(cachePath, 'utf-8'));
    return { response: cached.response, cached: true };
  }

  const response = await runner(prompt, systemPrompt);
  await writeFile(cachePath, JSON.stringify({ prompt, response }));
  return { response, cached: false };
}
```

The cache key includes both the prompt and system prompt. When prompts change, the cache invalidates automatically. Cached tests run in seconds instead of minutes.

**Cost Budget Enforcement**

Prevent runaway costs with per-run budgets:

``` typescript
// lib/cost-tracker.ts
class CostTracker {
  private entries: Array<{ name: string; cost: number }> = [];
  private budget: number;

  private pricing: Record<
    string, { input: number; output: number }
  > = {
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  };

  constructor(budget: number) {
    this.budget = budget;
  }

  track(
    name: string, model: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const pricing = this.pricing[model]
      || this.pricing['claude-sonnet-4-5-20250929'];
    const cost =
      (inputTokens * pricing.input
        + outputTokens * pricing.output)
      / 1_000_000;
    this.entries.push({ name, cost });

    const total = this.entries.reduce((sum, e) => sum + e.cost, 0);
    if (total > this.budget) {
      throw new Error(
        `Cost budget exceeded: ` +
        `$${total.toFixed(2)} > $${this.budget.toFixed(2)}`
      );
    }
  }
}

export const costTracker = new CostTracker(
  parseFloat(process.env.AGENT_COST_LIMIT || '10.00')
);
```

When the budget is exceeded, tests stop immediately. PRs get \$2 budgets. Nightly runs get \$50. This prevents a broken loop from burning \$500 overnight.

**Behavioral Regression Tests**

Detect quality degradation in agent outputs:

``` typescript
// tests/agent-regression.test.ts
describe('Code Review Agent Regression', () => {
  const goldenSet = loadGoldenSet('code-review');

  for (const golden of goldenSet) {
    test(`${golden.name}: maintains quality baseline`, async () => {
      const result = await codeReviewAgent.run({
        diff: golden.input.diff,
        context: golden.input.context,
      });

      // Quality metrics (may vary but must meet thresholds)
      const metrics = evaluateReview(result, golden.expectedIssues);

      // Precision: of issues found, how many are real?
      expect(metrics.precision).toBeGreaterThan(0.7);

      // Recall: of known issues, how many were found?
      expect(metrics.recall).toBeGreaterThan(0.6);

      // No hallucinated file paths
      expect(metrics.validPaths).toBe(true);
    });
  }
});
```

Golden sets contain known issues that the agent should find. Precision and recall thresholds catch quality degradation without requiring exact output matching. A prompt change that silently reduces feedback quality by 40% now fails CI.

### Multi-Layer Cost Protection {#_multi_layer_cost_protection}

Autonomous LLM workflows can enter infinite loops, process excessive files, or generate bloated responses. Without hard limits, a single misconfigured job can consume an entire monthly budget in hours. A real-world failure: an agent tasked with "review and fix all failing tests" burned \$87 before manual intervention because tests kept failing due to an environment issue, and the agent kept regenerating fixes.

**The Five-Layer Protection Model**

Cost protection requires defense in depth. No single layer is sufficient; each catches failures the others miss:

ifdef

:   backend-pdf\[\]

    +-----------+-------------------------------------+--------------------------+---------------------+
    | Layer     | Protection                          | Example Limit            | Catches             |
    +===========+=====================================+==========================+=====================+
    |           | GitHub Actions `timeout-minutes`    | 15 minutes               | Infinite loops      |
    +-----------+-------------------------------------+--------------------------+---------------------+
    |           | API `max_tokens` parameter          | 4,096 tokens             | Verbose responses   |
    +-----------+-------------------------------------+--------------------------+---------------------+
    |           | File count, lines per file          | 50 files, 500 lines each | File explosions     |
    +-----------+-------------------------------------+--------------------------+---------------------+
    |           | Daily and monthly caps              | \$10/day, \$100/month    | Sustained overuse   |
    +===========+=====================================+==========================+=====================+
    |           | Use cheaper models for simple tasks | Haiku for grep/rename    | Unnecessary expense |
    +===========+=====================================+==========================+=====================+

endif

:   

<!-- -->

ifndef

:   backend-pdf\[\]

**Layer 1 - Job timeout**

:   GitHub Actions `timeout-minutes`. Limit: 15 minutes. Catches infinite loops.

**Layer 2 - Request tokens**

:   API `max_tokens` parameter. Limit: 4,096 tokens. Catches verbose responses.

**Layer 3 - Input size**

:   File count, lines per file. Limit: 50 files, 500 lines each. Catches file explosions.

**Layer 4 - Budget alerts**

:   Daily and monthly caps. Limit: \$10/day, \$100/month. Catches sustained overuse.

**Layer 5 - Model selection**

:   Use cheaper models for simple tasks. Haiku for grep/rename. Catches unnecessary expense.

endif

:   The outer layers (job timeout) catch catastrophic failures. The inner layers (model selection) optimize normal operations. Together, they make costs predictable.

**Implementing the Protection Stack**

Wrap all AI operations in a budget-aware function:

``` typescript
interface BudgetConfig {
  dailyLimit: number;
  alertThreshold: number;  // 0.8 = alert at 80%
}

const BUDGET: BudgetConfig = { dailyLimit: 10, alertThreshold: 0.8 };

async function safeAIOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const spent = await getTodaySpend();

  if (spent >= BUDGET.dailyLimit) {
    throw new Error(`Daily budget exceeded: $${spent.toFixed(2)}`);
  }

  if (spent >= BUDGET.dailyLimit * BUDGET.alertThreshold) {
    console.warn(
      `Budget alert: $${spent.toFixed(2)} of $${BUDGET.dailyLimit}`
    );
  }

  return operation();
}
```

Every AI call goes through `safeAIOperation`. When the budget is exceeded, operations stop immediately. This prevents a broken loop from burning \$500 overnight.

**Cost Calculation Example**

Predictable costs require predictable inputs:

``` text
Configuration:
- Model: Sonnet ($3/MTok input, $15/MTok output)
- Max input: 50 files × 500 lines × 40 chars = 1M chars ≈ 250K tokens
- Max output: 4,096 tokens
- Frequency: 4 PRs/day

Cost per review:
- Input: 250K tokens × $0.000003 = $0.75
- Output: 4K tokens × $0.000015 = $0.06
- Total: $0.81 per review

Daily cost: 4 PRs × $0.81 = $3.24
Monthly cost: $3.24 × 22 workdays = $71.28
```

With model switching (Haiku for 80% of work, Sonnet for complex files only), the same workflow costs \$20.24/month, a 72% savings. Chapter 15 covers model selection strategies in depth.

## Building the Factory, Not Just the Product {#_building_the_factory,_not_just_the_product}

Most developers use AI to build features. Advanced developers use AI to build infrastructure that builds features. Elite developers build infrastructure that builds infrastructure.

### The Linear vs Exponential Mindset {#_the_linear_vs_exponential_mindset}

Linear productivity trades time for output: - Day 1: Use AI to build Feature A (8 hours saved) - Day 2: Use AI to build Feature B (8 hours saved) - Total: 8N hours saved over N days

Exponential productivity invests time in capacity expansion: - Week 1: Build tool that generates feature scaffolding (16 hours invested, saves 2 hours per feature) - Week 2: Build 3 more tools (24 hours invested, saves 6 hours per day) - Week 4: Build 10 tools (40 hours invested, most work happens automatically) - Month 2: Tools build tools (exponential growth)

The opportunity cost of building features directly is massive. Every hour spent asking Claude to "add feature X" is an hour that could build a tool that generates features like X automatically.

### Four Levels of Automation {#_four_levels_of_automation}

**Level 0: Manual Coding**. You write all code yourself. Productivity baseline is 1x.

**Level 1: AI-Assisted Coding**. You use Claude Code to write features. This is where most developers stop. Productivity is 5-10x.

**Level 2: Building Tools with AI**. You use Claude Code to build tools that generate code. A prompt like "Build an MCP (Model Context Protocol) server that scaffolds CRUD (Create, Read, Update, Delete) endpoints" produces infrastructure that runs in seconds. Productivity is 20-50x.

**Level 3: Meta-Infrastructure**. You build tools that build tools. A system monitors your codebase, identifies repetitive patterns, and auto-generates tools to eliminate them. Productivity is 100-500x.

### Identifying High-Leverage Infrastructure {#_identifying_high_leverage_infrastructure}

Not all infrastructure is equal. Focus on projects that multiply capacity:

**Custom MCP Servers** extend Claude Code with queryable project knowledge. A CMS integration server fetches and updates content. A code generation server scaffolds components, endpoints, and tests. Time savings: 20-minute tasks become 20-second commands.

**Development Bootstrap Tools** initialize new projects with best practices. One-command setup reduces project setup from days to minutes.

**Evaluation Suite Infrastructure** automates quality monitoring. Visual regression testing, performance dashboards, and dependency auditing prevent regressions automatically.

**Claude Code Orchestration Systems** automate Claude Code itself. Nightly job orchestrators run tests and create PRs. Ticket distribution assigns GitHub issues to agents. Work continues 24/7.

Calculate the value before building:

    Value = (Time per task) × (Frequency) × (Automation %)

    Example: API endpoints
    Time: 30 min per endpoint
    Frequency: 10 endpoints/week
    Automation: 90%

    Value = 30 × 10 × 0.9 = 270 min/week saved (4.5 hours)
    Build time: 4 hours
    Payback: 0.9 weeks

If the return on investment (ROI) is positive within a week, build the tool.

## Queryable Project Context with MCP {#_queryable_project_context_with_mcp}

Static CLAUDE.md files have a fundamental limitation: they cannot answer specific queries dynamically. When an agent needs to know "What functions call authenticate()?", static documentation cannot traverse the dependency graph.

MCP (Model Context Protocol) servers provide queryable project knowledge. AI agents request specific context on demand.

### MCP Resources {#_mcp_resources}

Define queryable resources in your project:

- `architecture-graph://auth` returns the dependency graph for the auth module

- `pattern-examples://factory-functions` returns real code examples of factory patterns

- `recent-changes://last-week` returns git history summary

- `test-coverage://modules` returns coverage metrics

Instead of loading all documentation upfront (expensive, mostly unused), agents query only what they need (cheap, 100% relevant).

### Building the MCP Server {#_building_the_mcp_server}

A basic MCP server exposes resources through handlers:

``` typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { analyzeArchitecture } from './analyzers/architecture.js';
import { findPatternExamples } from './analyzers/patterns.js';
import { getGitHistory } from './analyzers/git.js';

const server = new Server({
  name: 'project-context-server',
  version: '1.0.0',
}, {
  capabilities: { resources: {} },
});

server.setRequestHandler(
  ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri.startsWith('architecture-graph://')) {
    const target = uri.replace('architecture-graph://', '');
    const graph = await analyzeArchitecture(target);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(graph, null, 2),
      }],
    };
  }

  // Handle other resource types...
});
```

### Use Cases {#_use_cases}

**Understanding dependencies**: Query `architecture-graph://auth` to find all functions that call `authenticate()`. Static documentation cannot answer this dynamically.

**Finding similar code**: Query `pattern-examples://error-handling` to see how existing services handle errors. Real examples from your codebase, not generic patterns.

**Impact analysis**: Query `recent-changes://last-week` filtered by API layer to understand what changed recently before making modifications.

**Identifying coverage gaps**: Query `test-coverage://all` to find modules below 80% coverage that need more tests.

### Combining Static and Dynamic Context {#_combining_static_and_dynamic_context}

Use both approaches: - **CLAUDE.md**: Timeless principles and patterns that rarely change - **MCP Server**: Current examples, metrics, and state that change frequently

``` markdown
# CLAUDE.md

## Factory Function Pattern
We use factory functions instead of classes.

For real examples from our codebase, query:
  pattern-examples://factory-functions
```

The agent reads principles from CLAUDE.md and queries real examples from MCP. This combination provides both "how things should be" and "how things actually are."

## The Harness Maturity Progression {#_the_harness_maturity_progression}

Building all four layers takes time. Here is a realistic progression:

**Week 1: Layer 1 (Claude Code)**. Write a strong CLAUDE.md. Add pre/post hooks. Build your first feature with constraints. Outcome: 3x faster feature development.

**Weeks 2-3: Layer 2 (Repository Engineering)**. Add OTEL instrumentation. Set up Jaeger. Build comprehensive test suites. Refactor toward DDD. Outcome: Better signal, fewer regressions.

**Month 1: Layer 3 (Meta-Engineering)**. Create Claude Code workflows for common tasks. Add tests for tests and telemetry. Build nightly job orchestration. Outcome: Work happens largely autonomously.

**Months 2-3: Layer 4 (Closed-Loop Optimization)**. Define constraints. Build the optimization loop. Run first automated optimizations. Outcome: Zero-touch performance maintenance.

**Month 4+: The Factory**. Build MCP servers for project context. Create meta-tools (generators of generators). Enable self-improving infrastructure. Outcome: Exponential productivity.

## Common Pitfalls {#_common_pitfalls}

**Building before validating need**. Do not spend weeks on a tool for a task that happens twice a year. Track frequency before building. Only build if the task occurs three or more times per month.

**Over-engineering**. Do not spend 40 hours building a perfect tool for a 10-hour problem. Apply the 80/20 rule: build the 80% solution in 20% of the time, then iterate based on usage.

**Building without using**. Tools sitting unused while teams continue manual processes wastes the investment. Force adoption. Make the tool the only way.

**Not documenting**. Building a tool then forgetting how to use it defeats the purpose. Write the README with examples before building. Claude Code can generate both.

**Single-use tools**. Tools that only work for one specific case have limited value. Add configuration. Turn `generate-user-endpoint` into `generate-endpoint` `--model` `User`.

**Slow optimization loops**. Optimization taking 30 minutes per constraint violation limits iteration speed. Parallelize. Use better analyzers. Cache expensive computations.

**Poor constraint calibration**. Constraints too tight means the optimizer never passes. Constraints too loose means no optimization occurs. Start loose, tighten based on real load test data.

## Exercises {#_exercises}

### Exercise 1: Design Your Harness {#_exercise_1:_design_your_harness}

Pick a system in your codebase that is buggy or slow. Diagnose signal quality across all four layers:

1.  **Layer 1**: Is CLAUDE.md strong? Do hooks run?

2.  **Layer 2**: Does the repo have tests? OTEL? DDD structure?

3.  **Layer 3**: Are there automation scripts? Tests for tests?

4.  **Layer 4**: Are there constraints? Closed-loop optimization?

For each layer, write one specific improvement. Prioritize by leverage: which layer gives 10x improvement for least effort? Implement that improvement and measure before/after.

### Exercise 2: Build an MCP Server {#_exercise_2:_build_an_mcp_server}

Define three resources you want your MCP server to expose. Implement one analyzer (architecture, patterns, git history, or coverage). Build the server and test queries. Measure context reduction: how much static context did you need before MCP versus how much the agent queries now?

### Exercise 3: Implement a Constraint {#_exercise_3:_implement_a_constraint}

Pick a real system and define one performance constraint (memory, latency, or error rate). Build a load test that exercises the system. Implement a constraint checker that reads metrics and evaluates violations. Write an optimizer agent prompt that receives violations and proposes fixes. Wire it into CI/CD and test with three scenarios: two violations that get fixed, one pass, one escalation.

## What Persists {#_what_persists}

You are building the machine that builds products. Even if a specific product fails, what persists is not tied to that product:

+-------------------------------------+----------------------------------------------------------------------------+
| What Persists                       | Description                                                                |
+=====================================+============================================================================+
| The harness                         | Your four-layer infrastructure for constraining and amplifying AI outputs  |
+-------------------------------------+----------------------------------------------------------------------------+
| The agent workflows                 | Your Claude Code scripts, hooks, and orchestration patterns                |
+-------------------------------------+----------------------------------------------------------------------------+
| The observability                   | Your tracing, metrics, and feedback loop infrastructure                    |
+-------------------------------------+----------------------------------------------------------------------------+
| The math                            | Your constraint definitions, optimization loops, and quality gate formulas |
+=====================================+============================================================================+
| The taste                           | Your intuition for what works, what fails, and what compounds              |
+=====================================+============================================================================+

Each subsequent product becomes cheaper, faster, and more stable to build. That is why this path compounds: not because any single idea is guaranteed to win, but because the cost of exploration keeps dropping.

The harness is not a product feature. It is organizational capability. The infrastructure outlasts any individual project.

## Summary {#_summary}

The four-layer harness transforms unreliable AI outputs into production-quality code. Layer 1 configures Claude Code through CLAUDE.md and hooks. Layer 2 engineers the repository for clarity through observability, testing, and structure. Layer 3 automates processes through workflows, meta-testing, and orchestration. Layer 4 closes the feedback loop through constraint-driven optimization.

Beyond the harness, the factory mindset shifts from using AI for features (linear) to using AI for infrastructure that builds features (exponential). MCP servers make project knowledge queryable, providing dynamic context that static documentation cannot match.

The LLM is the least controllable part of the system. Everything else is engineering. Build the harness. Control what you can control. Let the LLM do what it does best within a well-constrained environment.

'''''

:::: note
::: title
Note
:::

**Companion Code**: All 5 code examples for this chapter are available at [examples/ch13/](https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book/tree/main/examples/ch13)
::::

*Related chapters:*

- **[Chapter 4: Writing Your First CLAUDE.md](#_chapter_4_writing_your_first_claude_md){.cross-reference}** for CLAUDE.md fundamentals

- **[Chapter 7: Quality Gates That Compound](#_chapter_7_quality_gates_that_compound){.cross-reference}** for quality gates in depth

- **[Chapter 9: Context Engineering Deep Dive](#_chapter_9_context_engineering_deep_dive){.cross-reference}** for context engineering principles

- **[Chapter 10: The RALPH Loop](#_chapter_10_the_ralph_loop){.cross-reference}** for the RALPH loop in long-running work

- **[Chapter 11: Sub-Agent Architecture](#_chapter_11_sub_agent_architecture){.cross-reference}** for sub-agent architecture patterns

- **[Chapter 16: Building Autonomous Systems](#_chapter_16_building_autonomous_systems){.cross-reference}** for a concrete implementation of these principles
