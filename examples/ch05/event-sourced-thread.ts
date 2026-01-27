/**
 * Event-Sourced Agent Thread
 *
 * Demonstrates Factor 5 (Unify Execution State and Business State)
 * and Factor 12 (Make Your Agent a Stateless Reducer).
 *
 * Key concepts:
 * - All state is derived from a stream of events
 * - State can be replayed from any point in history
 * - Events provide full audit trail and debugging capability
 *
 * Related to Chapter 5 sections:
 * - "Factor 5: Unify Execution State and Business State"
 * - "Factor 12: Make Your Agent a Stateless Reducer"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ============================================================================
// Event Types - The complete vocabulary of things that can happen
// ============================================================================

export type Event =
  | { type: 'user_input'; content: string; timestamp: number }
  | { type: 'tool_call'; toolName: string; parameters: Record<string, unknown>; timestamp: number }
  | { type: 'tool_result'; toolName: string; result: unknown; success: boolean; timestamp: number }
  | { type: 'llm_response'; content: string; timestamp: number }
  | { type: 'error'; message: string; code?: string; timestamp: number }
  | { type: 'approval_requested'; action: string; context: string; id: string; timestamp: number }
  | { type: 'approval_granted'; requestId: string; approver: string; timestamp: number }
  | { type: 'approval_denied'; requestId: string; reason: string; timestamp: number }
  | { type: 'human_feedback'; content: string; timestamp: number }
  | { type: 'status_change'; from: AgentStatus; to: AgentStatus; timestamp: number };

export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

// ============================================================================
// Agent State - Derived entirely from events
// ============================================================================

export interface AgentState {
  status: AgentStatus;
  currentStep: number;
  totalSteps: number;
  consecutiveErrors: number;
  pendingApprovals: Array<{ id: string; action: string; context: string }>;
  completedActions: string[];
  lastError: string | null;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Initial state - used when no events exist
export const initialState: AgentState = {
  status: 'idle',
  currentStep: 0,
  totalSteps: 0,
  consecutiveErrors: 0,
  pendingApprovals: [],
  completedActions: [],
  lastError: null,
  conversationHistory: [],
};

// ============================================================================
// Agent Thread - Container for events and derived state
// ============================================================================

export interface AgentThread {
  id: string;
  createdAt: number;
  events: Event[];
}

export function createThread(): AgentThread {
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    events: [],
  };
}

// ============================================================================
// State Reducer - Pure function transforming state based on events
// ============================================================================

export type AgentReducer = (state: AgentState, event: Event) => AgentState;

export const agentReducer: AgentReducer = (state, event) => {
  switch (event.type) {
    case 'user_input':
      return {
        ...state,
        conversationHistory: [
          ...state.conversationHistory,
          { role: 'user' as const, content: event.content },
        ],
      };

    case 'llm_response':
      return {
        ...state,
        conversationHistory: [
          ...state.conversationHistory,
          { role: 'assistant' as const, content: event.content },
        ],
        consecutiveErrors: 0, // Reset error counter on successful response
      };

    case 'tool_call':
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };

    case 'tool_result':
      if (event.success) {
        return {
          ...state,
          completedActions: [...state.completedActions, event.toolName],
          consecutiveErrors: 0,
        };
      }
      return {
        ...state,
        consecutiveErrors: state.consecutiveErrors + 1,
        lastError: `Tool ${event.toolName} failed`,
      };

    case 'error':
      return {
        ...state,
        consecutiveErrors: state.consecutiveErrors + 1,
        lastError: event.message,
      };

    case 'approval_requested':
      return {
        ...state,
        pendingApprovals: [
          ...state.pendingApprovals,
          { id: event.id, action: event.action, context: event.context },
        ],
        status: 'paused',
      };

    case 'approval_granted':
      return {
        ...state,
        pendingApprovals: state.pendingApprovals.filter(a => a.id !== event.requestId),
        status: state.pendingApprovals.length === 1 ? 'running' : state.status,
      };

    case 'approval_denied':
      return {
        ...state,
        pendingApprovals: state.pendingApprovals.filter(a => a.id !== event.requestId),
        status: 'paused',
      };

    case 'human_feedback':
      return {
        ...state,
        conversationHistory: [
          ...state.conversationHistory,
          { role: 'user' as const, content: `[Human feedback]: ${event.content}` },
        ],
      };

    case 'status_change':
      return {
        ...state,
        status: event.to,
      };

    default:
      return state;
  }
};

// ============================================================================
// State Derivation Functions
// ============================================================================

/**
 * Replay state from a list of events
 * This is the core of event sourcing - state is always derivable from events
 */
export function replayState(events: Event[]): AgentState {
  return events.reduce(agentReducer, initialState);
}

/**
 * Derive state from an agent thread
 */
export function deriveState(thread: AgentThread): AgentState {
  return replayState(thread.events);
}

/**
 * Get state at a specific point in time (time travel debugging)
 */
export function getStateAtTime(thread: AgentThread, timestamp: number): AgentState {
  const eventsUpToTime = thread.events.filter(e => e.timestamp <= timestamp);
  return replayState(eventsUpToTime);
}

/**
 * Get state after N events (useful for step-through debugging)
 */
export function getStateAfterNEvents(thread: AgentThread, n: number): AgentState {
  const eventsUpToN = thread.events.slice(0, n);
  return replayState(eventsUpToN);
}

// ============================================================================
// Event Helpers
// ============================================================================

export function addEvent(thread: AgentThread, event: Omit<Event, 'timestamp'>): Event {
  const fullEvent = { ...event, timestamp: Date.now() } as Event;
  thread.events.push(fullEvent);
  return fullEvent;
}

export function getRecentErrors(thread: AgentThread, count: number = 3): Event[] {
  return thread.events
    .filter(e => e.type === 'error')
    .slice(-count);
}

export function getPendingApprovals(thread: AgentThread): Event[] {
  const requested = thread.events.filter(e => e.type === 'approval_requested');
  const granted = new Set(
    thread.events
      .filter(e => e.type === 'approval_granted' || e.type === 'approval_denied')
      .map(e => (e as { requestId: string }).requestId)
  );
  return requested.filter(e => !granted.has((e as { id: string }).id));
}

// ============================================================================
// Integration with Anthropic SDK
// ============================================================================

type ContentBlock = Anthropic.Messages.ContentBlock;

/**
 * Process a user message through Claude, recording events
 */
export async function processMessage(
  thread: AgentThread,
  userMessage: string
): Promise<{ response: string; state: AgentState }> {
  // Record user input
  addEvent(thread, { type: 'user_input', content: userMessage });

  // Build conversation for Claude from event history
  const state = deriveState(thread);
  const messages = state.conversationHistory.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `You are a helpful assistant. The current workflow state is:
- Step: ${state.currentStep}
- Status: ${state.status}
- Pending approvals: ${state.pendingApprovals.length}
- Recent errors: ${state.consecutiveErrors}`,
      messages,
    });

    const textContent = response.content.find((block: ContentBlock) => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    // Record LLM response
    addEvent(thread, { type: 'llm_response', content: responseText });

    return {
      response: responseText,
      state: deriveState(thread),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addEvent(thread, { type: 'error', message: errorMessage });
    return {
      response: '',
      state: deriveState(thread),
    };
  }
}

// ============================================================================
// Demo: Event Sourcing in Action
// ============================================================================

export async function runEventSourcingDemo(): Promise<{
  thread: AgentThread;
  stateHistory: AgentState[];
}> {
  console.log('Event Sourcing Demo');
  console.log('==================\n');

  const thread = createThread();
  const stateHistory: AgentState[] = [];

  // Simulate a workflow with various events
  console.log('1. Starting workflow...');
  addEvent(thread, { type: 'status_change', from: 'idle', to: 'running' });
  stateHistory.push(deriveState(thread));
  console.log('   Status:', deriveState(thread).status);

  console.log('\n2. Processing user input...');
  const result1 = await processMessage(thread, 'Help me deploy the application to production');
  stateHistory.push(result1.state);
  console.log('   Response:', result1.response.slice(0, 100) + '...');
  console.log('   Conversation turns:', result1.state.conversationHistory.length);

  console.log('\n3. Simulating approval request...');
  const approvalId = `approval_${Date.now()}`;
  addEvent(thread, {
    type: 'approval_requested',
    action: 'deploy_production',
    context: 'Deploying auth-service v2.1.0',
    id: approvalId,
  });
  stateHistory.push(deriveState(thread));
  console.log('   Status:', deriveState(thread).status);
  console.log('   Pending approvals:', deriveState(thread).pendingApprovals.length);

  console.log('\n4. Granting approval...');
  addEvent(thread, {
    type: 'approval_granted',
    requestId: approvalId,
    approver: 'admin@example.com',
  });
  stateHistory.push(deriveState(thread));
  console.log('   Status:', deriveState(thread).status);
  console.log('   Pending approvals:', deriveState(thread).pendingApprovals.length);

  console.log('\n5. Simulating tool execution...');
  addEvent(thread, {
    type: 'tool_call',
    toolName: 'deploy_to_production',
    parameters: { service: 'auth-service', version: '2.1.0' },
  });
  addEvent(thread, {
    type: 'tool_result',
    toolName: 'deploy_to_production',
    result: { deploymentId: 'dep_12345', status: 'success' },
    success: true,
  });
  stateHistory.push(deriveState(thread));
  console.log('   Completed actions:', deriveState(thread).completedActions);

  console.log('\n6. Time travel debugging demo...');
  console.log('   State after 3 events:', getStateAfterNEvents(thread, 3));
  console.log('   Total events:', thread.events.length);
  console.log('   Final state:', deriveState(thread));

  console.log('\n7. Replay verification...');
  const replayedState = replayState(thread.events);
  const derivedState = deriveState(thread);
  const statesMatch = JSON.stringify(replayedState) === JSON.stringify(derivedState);
  console.log('   Replay matches derived state:', statesMatch);

  return { thread, stateHistory };
}

// Run if executed directly
if (import.meta.main) {
  runEventSourcingDemo().catch(console.error);
}
