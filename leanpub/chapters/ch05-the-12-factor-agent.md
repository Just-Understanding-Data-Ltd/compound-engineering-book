# Chapter 5: The 12-Factor Agent {#_chapter_5:_the_12_factor_agent} {#ch05-the-12-factor-agent}

[]{.index term="12-factor agent"} []{.index term="reliability"}

You built an agent that schedules emails. It worked flawlessly in testing. Fifty test cases, fifty successes. Then you deployed it to production. After 100 real requests, 47 of them failed. Not because your code was wrong, but because real workflows chain steps together, and each step introduces another chance for failure.

This is the reliability chasm between demo agents and production agents. Building a demo is trivial. Building a reliable agent requires systematic architecture. The 12-Factor Agent framework provides that system, adapting proven principles from distributed systems to the LLM era.

This chapter teaches you the 12 factors with working TypeScript examples. You will understand why demo agents fail at scale, how to architect agents as deterministic software systems, and how to implement human-in-the-loop approvals that make production deployment safe.

## The Reliability Chasm {#_the_reliability_chasm}

Demo agents handle single requests. Production agents handle chains.

Consider the math. If each action in your workflow succeeds 95% of the time, what happens as actions compound?

+--------------------+------------------------+------------------------+
| Actions            | Per-Action Success     | Overall Success        |
+====================+========================+========================+
| 5                  | 95%                    | 77%                    |
+--------------------+------------------------+------------------------+
| 10                 | 95%                    | 60%                    |
+--------------------+------------------------+------------------------+
| 20                 | 95%                    | 36%                    |
+====================+========================+========================+
| 30                 | 95%                    | 21%                    |
+====================+========================+========================+

The formula is simple: `0.95^N`. A 10-step workflow has 60% reliability, worse than a coin flip for business-critical operations. Production workflows commonly require 15-25 steps.

::: {#fig-reliability-chasm wrapper="1" align="center" width="600"}
![The Reliability Chasm: How 95% per-action success compounds to failure](ch05-reliability-chasm.png){alt="Reliability Chasm"}
:::

This exponential failure explains why up to 95% of agent proof-of-concepts never reach production. Demo stakes are low, demo context is constrained, and demo verification happens manually. Humans catch errors in demos. Agents must catch their own errors in production.

### The Four-Turn Framework {#_the_four_turn_framework}

Basic agents run a simple loop: Input, LLM, Action. Production agents need four turns:

1.  **Understand**: Verify context and requirements

2.  **Decide**: Choose the appropriate response

3.  **Execute**: Perform the task

4.  **Verify**: Confirm success

Most demo agents skip turns 1 and 4. They assume context is clear and trust API responses. This is exactly where 80% of production failures occur.

### The Reliability Stack {#_the_reliability_stack}

To close the chasm, you build reliability in layers:

- **Layer 1: Task decomposition**. Break 30-step workflows into focused agents handling 5-10 steps each.

- **Layer 2: Pre-action validation**. Check prerequisites before acting.

- **Layer 3: Post-action verification**. Confirm outcomes, not just responses.

- **Layer 4: Human escalation**. Know when to stop and ask for help.

The 12 factors implement these layers systematically.

## The 12 Factors {#_the_12_factors}

The factors organize into three phases: Foundation (factors 1-5), Reliability (factors 6-9), and Scale (factors 10-12).

### Foundation: Factors 1-5 {#_foundation:_factors_1_5}

These factors establish the architectural baseline for debuggable, controllable agents.

#### Factor 1: Natural Language to Tool Calls {#_factor_1:_natural_language_to_tool_calls}

The LLM decides *what* to do. Your code controls *how* it executes.

Instead of letting the LLM generate arbitrary code, constrain it to outputting structured JSON (JavaScript Object Notation) tool calls. Your deterministic code handles the actual execution.

:::: tip
::: title
Tip
:::

**Beginner**: If you are new to tool usage, start with `examples/ch05/tool-usage-basics.ts`. It provides a progressive introduction to defining tools, handling tool calls, and executing tool results. The file covers single-turn tool calls, multi-tool routing, looping patterns, and error handling with clear explanations at each step.
::::

``` typescript
// User says: "Create a payment link for $750"
// LLM outputs structured tool call:
const toolCall = {
  tool: "create_payment_link",
  parameters: {
    amount: 750,
    currency: "USD"
  }
};

// Your code handles execution deterministically
async function executeToolCall(toolCall: ToolCall) {
  switch (toolCall.tool) {
    case "create_payment_link":
      return await stripe.paymentLinks.create({
        line_items: [{
          price_data: {
            currency: toolCall.parameters.currency,
            unit_amount: toolCall.parameters.amount * 100,
          },
          quantity: 1,
        }],
      });
  }
}
```

This separation enables validation, testing, and auditing. You can replay tool calls, verify parameters, and understand exactly what the agent did.

#### Factor 2: Own Your Prompts {#_factor_2:_own_your_prompts}

Resist black-box framework abstractions. Treat prompts as first-class, version-controlled code.

``` typescript
const DEPLOYMENT_PROMPT = `
You are a deployment assistant. You have access to
the following tools:
- deploy_to_staging: Deploy the current branch to staging
- run_tests: Execute the test suite
- deploy_to_production: Deploy to production (requires approval)

Current context:
- Branch: {{branch}}
- Last commit: {{commit}}
- Test status: {{testStatus}}

Respond with the next action to take.
`;

function buildPrompt(context: DeploymentContext): string {
  return DEPLOYMENT_PROMPT
    .replace("{{branch}}", context.branch)
    .replace("{{commit}}", context.lastCommit)
    .replace("{{testStatus}}", context.testStatus);
}
```

When prompts hide inside frameworks, debugging becomes impossible. Owned prompts enable A/B testing, versioning, and domain specialization. As you observe failures, you iterate on prompts directly.

#### Factor 3: Own Your Context Window {#_factor_3:_own_your_context_window}

Context engineering matters more than model selection. Design custom formats optimized for your domain.

``` typescript
function buildContext(events: Event[]): string {
  return `
<system_state>
  <current_step>3 of 5</current_step>
  <status>awaiting_approval</status>
</system_state>

<event_history>
${events.map(e =>
  `  <event type="${e.type}" ts="${e.timestamp}">${e.summary}</event>`
).join('\n')}
</event_history>

<available_actions>
  - approve_deployment
  - reject_deployment
  - request_more_info
</available_actions>
`;
}
```

Long, unstructured contexts degrade LLM performance. Structured formats improve token efficiency. Domain-specific formats let the LLM reason better about your specific problem.

#### Factor 4: Tools Are Just Structured Outputs {#_factor_4:_tools_are_just_structured_outputs}

Tools are JSON outputs, not magic framework objects. This separation allows flexibility in how you implement the actual functionality.

``` typescript
const tools = [
  {
    name: "send_notification",
    description: "Send a notification to the user",
    parameters: {
      channel: { type: "string", enum: ["slack", "email", "sms"] },
      message: { type: "string" }
    }
  }
];

function executeTool(toolCall: ToolCall) {
  const channel = toolCall.parameters.channel;
  switch (channel) {
    case "slack":
      return slackClient.postMessage(toolCall.parameters.message);
    case "email":
      return emailService.send(toolCall.parameters.message);
    case "sms":
      return twilioClient.sendSms(toolCall.parameters.message);
  }
}
```

The same tool definition can execute different backends. Test environments can use mocks. Production can use real services. Feature flags can route to new implementations.

#### Factor 5: Unify Execution State and Business State {#_factor_5:_unify_execution_state_and_business_state}

Derive state from event history, not separate storage. A single event stream provides serialization, debugging transparency, and easy resumption.

``` typescript
interface AgentThread {
  id: string;
  events: Event[];
  status: "running" | "paused" | "completed" | "failed";
}

function deriveState(thread: AgentThread): ExecutionState {
  const completedSteps = thread.events.filter(
    e => e.type === "step_complete"
  ).length;

  const pendingApprovals = thread.events.filter(e =>
    e.type === "approval_requested" &&
    !thread.events.find(
      a => a.type === "approval_granted" && a.requestId === e.id
    )
  );

  return { currentStep: completedSteps, pendingApprovals };
}

// Replay any state from events
function replayState(events: Event[]): ExecutionState {
  return events.reduce(agentReducer, initialState);
}
```

When state derives from events, you get time-travel debugging for free. You can reconstruct the agent's state at any point in execution and understand exactly what happened.

### Reliability: Factors 6-9 {#_reliability:_factors_6_9}

These factors add human control, verification loops, and error recovery.

#### Factor 6: Launch/Pause/Resume with Simple APIs {#_factor_6:_launch/pause/resume_with_simple_apis}

Agents need explicit state transitions, especially between tool selection and execution where humans intervene.

``` typescript
class Agent {
  async launch(input: string): Promise<AgentThread> {
    const thread = await this.createThread();
    return this.run(thread, input);
  }

  async pause(threadId: string): Promise<void> {
    await this.db.updateThread(threadId, { status: "paused" });
  }

  async resume(
    threadId: string, feedback?: string
  ): Promise<AgentThread> {
    const thread = await this.db.getThread(threadId);
    if (feedback) {
      thread.events.push({
        type: "human_feedback", content: feedback
      });
    }
    return this.run(thread);
  }
}

// Webhook for external triggers
app.post("/webhook/resume/:threadId", async (req, res) => {
  const { feedback } = req.body;
  await agent.resume(req.params.threadId, feedback);
  res.json({ status: "resumed" });
});
```

Pause points allow time for human reflection. Resume with feedback integrates human judgment into the workflow.

#### Factor 7: Contact Humans with Tool Calls {#_factor_7:_contact_humans_with_tool_calls}

Human interaction follows the same structured pattern as other tools. This enables multi-channel communication and auditable workflows.

``` typescript
const humanTools = [
  {
    name: "request_human_approval",
    description: "Request approval from a human before proceeding",
    parameters: {
      action: {
        type: "string",
        description: "What action needs approval"
      },
      context: {
        type: "string",
        description: "Relevant context for decision"
      },
      urgency: {
        type: "string", enum: ["low", "medium", "high"]
      },
      channel: { type: "string", enum: ["slack", "email"] }
    }
  }
];

async function executeHumanTool(
  toolCall: ToolCall, thread: AgentThread
) {
  await notifyHuman(toolCall);
  thread.status = "paused";
  thread.events.push({
    type: "awaiting_human",
    toolCall,
    timestamp: Date.now()
  });
  return { status: "paused", awaiting: "human_response" };
}
```

#### Factor 8: Own Your Control Flow {#_factor_8:_own_your_control_flow}

Different tool types need different handling. Build custom loops that classify tools and branch logic accordingly.

``` typescript
async function agentLoop(thread: AgentThread): Promise<AgentThread> {
  while (thread.status === "running") {
    const toolCall = await llm.getNextAction(thread);

    switch (classifyTool(toolCall)) {
      case "immediate":
        // Data fetching: execute and continue
        const result = await executeTool(toolCall);
        thread.events.push({ type: "tool_result", toolCall, result });
        break;

      case "requires_approval":
        // Human decision: pause the loop
        await requestApproval(toolCall);
        thread.status = "paused";
        return thread;

      case "terminal":
        // Completion: end the loop
        thread.status = "completed";
        return thread;

      case "error":
        // Error: retry or escalate
        if (thread.consecutiveErrors >= 3) {
          await escalateToHuman(thread);
          thread.status = "paused";
          return thread;
        }
        thread.consecutiveErrors++;
        break;
    }
  }
  return thread;
}
```

Generic loops fail. Specialized loops with explicit handling for approval, termination, and error cases succeed.

#### Factor 9: Compact Errors into Context Window {#_factor_9:_compact_errors_into_context_window}

Feed error messages back for self-healing, with thresholds to prevent spin-outs.

``` typescript
async function handleError(
  error: Error, thread: AgentThread
): Promise<void> {
  thread.events.push({
    type: "error",
    message: error.message,
    // Truncate for context efficiency
    stack: error.stack?.slice(0, 500),
    timestamp: Date.now()
  });

  thread.consecutiveErrors++;

  if (thread.consecutiveErrors >= 3) {
    await requestHumanHelp(thread, {
      reason: "consecutive_errors",
      errors: thread.events.filter(e => e.type === "error").slice(-3)
    });
    thread.status = "paused";
  }
}
```

The agent learns from recent errors and tries different approaches. The threshold triggers escalation rather than infinite retries.

### Scale: Factors 10-12 {#_scale:_factors_10_12}

These factors enable multi-agent systems and distributed execution.

#### Factor 10: Small, Focused Agents {#_factor_10:_small,_focused_agents}

Scope agents to 3-20 steps maximum. As context grows, LLM performance degrades.

``` typescript
// Bad: Monolithic agent
const megaAgent = new Agent({
  capabilities: [
    "deploy", "test", "monitor",
    "rollback", "notify", "audit"
  ]
});

// Good: Focused agents composed in a Directed Acyclic Graph (DAG)
const deployAgent = new Agent({
  capabilities: ["deploy_staging", "deploy_prod"]
});
const testAgent = new Agent({
  capabilities: ["run_tests", "analyze_results"]
});
const notifyAgent = new Agent({
  capabilities: ["slack", "email", "pagerduty"]
});

// Deterministic orchestration
async function deploymentWorkflow(pr: PullRequest) {
  await deployToStaging(pr);

  const testPlan = await testAgent.planTests(pr);
  const results = await runTests(testPlan);

  if (results.passed) {
    await deployAgent.requestProdApproval(pr);
  } else {
    await notifyAgent.alertFailure(results);
  }
}
```

The historical progression makes this clear: programs became DAGs, DAGs got orchestrators, orchestrators embedded Machine Learning (ML), and now agents serve as micro-optimized decision points within deterministic workflows.

#### Factor 11: Trigger from Anywhere {#_factor_11:_trigger_from_anywhere}

Enable agents to launch from events, crons, webhooks, and user actions.

``` typescript
// Webhook trigger
app.post("/webhook/github", async (req, res) => {
  if (req.body.action === "closed" && req.body.pull_request.merged) {
    await deployAgent.launch({ pr: req.body.pull_request });
  }
});

// Cron trigger
cron.schedule("0 9 * * *", async () => {
  await reportAgent.launch({ type: "daily_summary" });
});

// Slack trigger
slack.command("/deploy", async ({ command, ack }) => {
  await ack();
  await deployAgent.launch({
    branch: command.text,
    requestedBy: command.user_id
  });
});
```

Production agents run in response to many different events, not just manual invocation.

#### Factor 12: Make Your Agent a Stateless Reducer {#_factor_12:_make_your_agent_a_stateless_reducer}

Treat agents as pure functions transforming state. This enables determinism, replay, and distribution.

``` typescript
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
        lastToolCall: null
      };
    case "error":
      return {
        ...state,
        errors: [...state.errors, event],
        consecutiveErrors: state.consecutiveErrors + 1
      };
    default:
      return state;
  }
};

// Replay any state from events
function replayState(events: Event[]): AgentState {
  return events.reduce(agentReducer, initialState);
}
```

Same events always produce same output. You can test agents, debug failures, and distribute computation across processes.

## Implementation Strategy {#_implementation_strategy}

Do not implement all 12 factors at once. Build incrementally based on what delivers value fastest.

### Phase 1: Foundation (Week 1) {#_phase_1:_foundation_(week_1)}

Start with factors 1, 2, 3, and 5. Goal: a debuggable agent you can reason about.

- Factor 1 gives you JSON tool calls for validation

- Factor 2 gives you owned prompts for iteration

- Factor 3 gives you structured context for signal

- Factor 5 gives you event-driven state for replays

Deliverable: An agent that handles 3-5 step workflows with full debugging visibility.

### Phase 2: Reliability (Week 2) {#_phase_2:_reliability_(week_2)}

Add factors 6, 7, 8, and 9. Goal: production-safe with human oversight.

- Factor 6 gives you pause/resume for intervention

- Factor 7 gives you human tools for approval

- Factor 8 gives you branching for risk-based routing

- Factor 9 gives you error handling with escalation

Deliverable: An agent ready for low-risk production use with human gates.

### Phase 3: Scale (Week 3+) {#_phase_3:_scale_(week_3+)}

Add factors 10, 11, and 12. Goal: multi-trigger distributed execution.

- Factor 10 reduces scope to 3-20 steps

- Factor 11 enables event-driven triggers

- Factor 12 enables stateless distribution

Deliverable: A scalable system handling multiple workflows from multiple entry points.

### Quick Wins {#_quick_wins}

These investments show the highest Return on Investment (ROI) earliest:

1.  **Factor 1 + Tool validation**: 10% effort, 40% reliability improvement

2.  **Factor 8 + Approval routing**: 20% effort, 50% reliability improvement

3.  **Factor 10 + Scope reduction**: 15% effort, 35% performance improvement

## Exercises {#_exercises}

**Prerequisite**: Before starting these exercises, review `examples/ch05/tool-usage-basics.ts` for a beginner-friendly introduction to tool definitions, tool calling patterns, and handling tool results. It covers the fundamentals you will build upon in these exercises.

### Exercise 1: Build an Event-Sourced Agent Thread {#_exercise_1:_build_an_event_sourced_agent_thread}

Create an agent thread that derives all state from events.

1.  Define an `Event` union type with at least these variants: `user_input`, `tool_call`, `tool_result`, `error`, `human_response`

2.  Implement a `deriveState` function that computes current step, pending approvals, and consecutive errors from events

3.  Implement a `replayState` function that reduces over events to reconstruct state

4.  Write tests that add events and verify state changes correctly

Success criteria: - State is never stored separately from events - Calling `replayState` with the same events always produces identical state - You can "time travel" by replaying a subset of events

### Exercise 2: Implement an Approval Gate {#_exercise_2:_implement_an_approval_gate}

Build a workflow that pauses for human approval before a high-stakes action.

1.  Create a tool classification function that identifies tools as `immediate`, `requires_approval`, or `terminal`

2.  Implement the agent loop that pauses when approval is needed

3.  Create a resume endpoint that accepts human feedback

4.  Store the approval in the event stream

Success criteria: - Agent automatically pauses before high-stakes tools - Human approval is recorded as an event - Resumed agent has full context from before the pause

### Exercise 3: Decompose a Monolithic Workflow {#_exercise_3:_decompose_a_monolithic_workflow}

Take a 25-step email campaign workflow and break it into focused agents.

Original workflow steps: 1. Fetch subscriber list 2. Filter by segment 3. Load template 4. Personalize for each recipient 5. Validate email addresses 6. Check against suppression list 7. Queue emails 8. Send in batches 9. Track delivery 10. Handle bounces ... and 15 more steps

Your task: 1. Group steps into logical agents (suggest 3-4 agents) 2. Define clear interfaces between agents 3. Design the deterministic orchestration that coordinates them 4. Calculate reliability improvement using the 0.95\^N formula

Success criteria: - No agent exceeds 10 steps - Each agent has a single clear responsibility - Overall reliability improves from 0.95\^25 (28%) to better than 80%

## Summary {#_summary}

The reliability chasm explains why 95% of agent PoCs fail in production. Per-action reliability compounds exponentially across multi-step workflows.

The 12 factors provide a systematic approach to closing this chasm. Foundation factors (1-5) establish debuggable architecture. Reliability factors (6-9) add human control and error recovery. Scale factors (10-12) enable distributed multi-agent systems.

Implement incrementally: foundation first, then reliability, then scale. The quick wins come from tool validation, approval routing, and scope reduction.

Production agents are not smarter than demo agents. They are more carefully architected. The difference between a demo that impresses and a system that delivers value lies in these 12 principles applied consistently.

'''''

:::: note
::: title
Note
:::

**Companion Code**: All 5 code examples for this chapter are available at [examples/ch05/](https://github.com/Just-Understanding-Data-Ltd/compound-engineering-book/tree/main/examples/ch05)
::::

*Related chapters:* - **[Chapter 4: Writing Your First CLAUDE.md](#_chapter_4_writing_your_first_claude_md){.cross-reference}** for context engineering fundamentals that support Factor 3 - **[Chapter 6: The Verification Ladder](#_chapter_6_the_verification_ladder){.cross-reference}** for building on the verification concepts in Factors 6-9 - **[Chapter 10: The RALPH Loop](#_chapter_10_the_ralph_loop){.cross-reference}** for long-running agent patterns that apply the 12 factors - **[Chapter 11: Sub-Agent Architecture](#_chapter_11_sub_agent_architecture){.cross-reference}** for expanding on Factor 10's focused agent approach
