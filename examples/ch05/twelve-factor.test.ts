/**
 * Tests for Chapter 5: The 12-Factor Agent
 *
 * Tests the event sourcing, approval gates, and multi-step agent patterns.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createThread,
  agentReducer,
  replayState,
  deriveState,
  getStateAfterNEvents,
  initialState,
  type Event,
  type AgentThread,
  type AgentState,
} from './event-sourced-thread';
import {
  classifyTool,
  createWorkflow,
  type ToolClassification,
} from './approval-gate-workflow';
import {
  calculateReliability,
  reliabilityTable,
  subscriberAgent,
  templateAgent,
} from './multi-step-agent';

// ============================================================================
// Event Sourcing Tests
// ============================================================================

describe('Event-Sourced Agent Thread', () => {
  describe('createThread', () => {
    it('creates a thread with unique ID', () => {
      const thread1 = createThread();
      const thread2 = createThread();

      expect(thread1.id).toBeDefined();
      expect(thread2.id).toBeDefined();
      expect(thread1.id).not.toBe(thread2.id);
    });

    it('initializes with empty events array', () => {
      const thread = createThread();
      expect(thread.events).toEqual([]);
    });

    it('sets creation timestamp', () => {
      const before = Date.now();
      const thread = createThread();
      const after = Date.now();

      expect(thread.createdAt).toBeGreaterThanOrEqual(before);
      expect(thread.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('agentReducer', () => {
    it('handles user_input event', () => {
      const event: Event = {
        type: 'user_input',
        content: 'Hello',
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.conversationHistory).toHaveLength(1);
      expect(state.conversationHistory[0]).toEqual({
        role: 'user',
        content: 'Hello',
      });
    });

    it('handles llm_response event', () => {
      const event: Event = {
        type: 'llm_response',
        content: 'Hi there!',
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.conversationHistory).toHaveLength(1);
      expect(state.conversationHistory[0]).toEqual({
        role: 'assistant',
        content: 'Hi there!',
      });
      expect(state.consecutiveErrors).toBe(0);
    });

    it('handles tool_call event', () => {
      const event: Event = {
        type: 'tool_call',
        toolName: 'deploy',
        parameters: { env: 'staging' },
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.currentStep).toBe(1);
    });

    it('handles successful tool_result event', () => {
      const event: Event = {
        type: 'tool_result',
        toolName: 'deploy',
        result: { success: true },
        success: true,
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.completedActions).toContain('deploy');
      expect(state.consecutiveErrors).toBe(0);
    });

    it('handles failed tool_result event', () => {
      const event: Event = {
        type: 'tool_result',
        toolName: 'deploy',
        result: { error: 'timeout' },
        success: false,
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.consecutiveErrors).toBe(1);
      expect(state.lastError).toBe('Tool deploy failed');
    });

    it('handles error event and increments consecutive errors', () => {
      const event: Event = {
        type: 'error',
        message: 'Connection failed',
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.consecutiveErrors).toBe(1);
      expect(state.lastError).toBe('Connection failed');
    });

    it('handles approval_requested event', () => {
      const event: Event = {
        type: 'approval_requested',
        action: 'deploy_prod',
        context: 'Deploying v2.0',
        id: 'approval_123',
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.pendingApprovals).toHaveLength(1);
      expect(state.pendingApprovals[0]).toEqual({
        id: 'approval_123',
        action: 'deploy_prod',
        context: 'Deploying v2.0',
      });
      expect(state.status).toBe('paused');
    });

    it('handles approval_granted event', () => {
      // First request approval
      const requestEvent: Event = {
        type: 'approval_requested',
        action: 'deploy_prod',
        context: 'test',
        id: 'approval_123',
        timestamp: Date.now(),
      };
      const stateWithApproval = agentReducer(initialState, requestEvent);

      // Then grant it
      const grantEvent: Event = {
        type: 'approval_granted',
        requestId: 'approval_123',
        approver: 'admin',
        timestamp: Date.now(),
      };
      const state = agentReducer(stateWithApproval, grantEvent);

      expect(state.pendingApprovals).toHaveLength(0);
      expect(state.status).toBe('running');
    });

    it('handles status_change event', () => {
      const event: Event = {
        type: 'status_change',
        from: 'idle',
        to: 'running',
        timestamp: Date.now(),
      };

      const state = agentReducer(initialState, event);

      expect(state.status).toBe('running');
    });
  });

  describe('replayState', () => {
    it('replays empty events to initial state', () => {
      const state = replayState([]);
      expect(state).toEqual(initialState);
    });

    it('replays sequence of events correctly', () => {
      const events: Event[] = [
        { type: 'status_change', from: 'idle', to: 'running', timestamp: 1 },
        { type: 'user_input', content: 'Deploy app', timestamp: 2 },
        { type: 'llm_response', content: 'Starting deployment', timestamp: 3 },
        { type: 'tool_call', toolName: 'deploy', parameters: {}, timestamp: 4 },
        { type: 'tool_result', toolName: 'deploy', result: {}, success: true, timestamp: 5 },
      ];

      const state = replayState(events);

      expect(state.status).toBe('running');
      expect(state.conversationHistory).toHaveLength(2);
      expect(state.currentStep).toBe(1);
      expect(state.completedActions).toContain('deploy');
    });

    it('produces same state regardless of when called', () => {
      const events: Event[] = [
        { type: 'user_input', content: 'Test', timestamp: 1 },
        { type: 'llm_response', content: 'Response', timestamp: 2 },
      ];

      const state1 = replayState(events);
      const state2 = replayState(events);

      expect(JSON.stringify(state1)).toBe(JSON.stringify(state2));
    });
  });

  describe('getStateAfterNEvents', () => {
    let thread: AgentThread;

    beforeEach(() => {
      thread = createThread();
      thread.events = [
        { type: 'status_change', from: 'idle', to: 'running', timestamp: 1 },
        { type: 'user_input', content: 'Hello', timestamp: 2 },
        { type: 'llm_response', content: 'Hi', timestamp: 3 },
        { type: 'error', message: 'Oops', timestamp: 4 },
      ];
    });

    it('returns initial state for 0 events', () => {
      const state = getStateAfterNEvents(thread, 0);
      expect(state).toEqual(initialState);
    });

    it('returns state after partial events', () => {
      const state = getStateAfterNEvents(thread, 2);
      expect(state.status).toBe('running');
      expect(state.conversationHistory).toHaveLength(1);
    });

    it('returns full state for all events', () => {
      const state = getStateAfterNEvents(thread, 4);
      expect(state.consecutiveErrors).toBe(1);
      expect(state.lastError).toBe('Oops');
    });
  });
});

// ============================================================================
// Approval Gate Tests
// ============================================================================

describe('Approval Gate Workflow', () => {
  describe('classifyTool', () => {
    it('classifies high-risk tools as requiring approval', () => {
      const highRiskTools = [
        'deploy_to_production',
        'delete_database',
        'send_bulk_email',
        'modify_billing',
      ];

      for (const toolName of highRiskTools) {
        const result = classifyTool({ name: toolName, parameters: {} });
        expect(result).toBe('requires_approval' as ToolClassification);
      }
    });

    it('classifies data fetching tools as immediate', () => {
      const immediateTools = ['get_user', 'list_items', 'fetch_data', 'get_status'];

      for (const toolName of immediateTools) {
        const result = classifyTool({ name: toolName, parameters: {} });
        expect(result).toBe('immediate' as ToolClassification);
      }
    });

    it('classifies terminal tools correctly', () => {
      const terminalTools = ['complete_task', 'task_finished', 'end_workflow'];

      for (const toolName of terminalTools) {
        const result = classifyTool({ name: toolName, parameters: {} });
        expect(result).toBe('terminal' as ToolClassification);
      }
    });

    it('defaults unknown tools to requiring approval', () => {
      const result = classifyTool({ name: 'unknown_dangerous_tool', parameters: {} });
      expect(result).toBe('requires_approval');
    });
  });

  describe('createWorkflow', () => {
    it('creates workflow with unique ID', () => {
      const workflow1 = createWorkflow('test 1');
      const workflow2 = createWorkflow('test 2');

      expect(workflow1.id).not.toBe(workflow2.id);
    });

    it('initializes with running status', () => {
      const workflow = createWorkflow('test');
      expect(workflow.status).toBe('running');
    });

    it('initializes with empty events', () => {
      const workflow = createWorkflow('test');
      expect(workflow.events).toEqual([]);
    });

    it('stores initial context', () => {
      const workflow = createWorkflow('Deploy to production');
      expect(workflow.context).toBe('Deploy to production');
    });
  });
});

// ============================================================================
// Multi-Step Agent Tests
// ============================================================================

describe('Multi-Step Agent', () => {
  describe('calculateReliability', () => {
    it('returns 1 for single step', () => {
      const reliability = calculateReliability(1, 1.0);
      expect(reliability).toBe(1);
    });

    it('calculates correct reliability for 10 steps at 95%', () => {
      const reliability = calculateReliability(10, 0.95);
      expect(reliability).toBeCloseTo(0.5987, 3);
    });

    it('calculates correct reliability for 5 steps at 99%', () => {
      const reliability = calculateReliability(5, 0.99);
      expect(reliability).toBeCloseTo(0.9510, 3);
    });

    it('shows exponential decay', () => {
      const r5 = calculateReliability(5, 0.95);
      const r10 = calculateReliability(10, 0.95);
      const r20 = calculateReliability(20, 0.95);

      expect(r10).toBeLessThan(r5);
      expect(r20).toBeLessThan(r10);
      expect(r20).toBeLessThan(r5 * r5); // Much worse than linear
    });
  });

  describe('reliabilityTable', () => {
    it('returns table with expected step counts', () => {
      const table = reliabilityTable();

      expect(table.length).toBeGreaterThan(5);
      expect(table[0].steps).toBe(1);
      expect(table.map(r => r.steps)).toContain(10);
      expect(table.map(r => r.steps)).toContain(30);
    });

    it('shows 99% per-step is always better than 95%', () => {
      const table = reliabilityTable();

      for (const row of table) {
        expect(row.reliability99).toBeGreaterThanOrEqual(row.reliability95);
      }
    });
  });

  describe('subscriberAgent', () => {
    it('has name property', () => {
      expect(subscriberAgent.name).toBe('SubscriberAgent');
    });

    it('has maxSteps limit', () => {
      expect(subscriberAgent.maxSteps).toBeLessThanOrEqual(10);
    });
  });

  describe('templateAgent', () => {
    it('has name property', () => {
      expect(templateAgent.name).toBe('TemplateAgent');
    });

    it('has maxSteps limit', () => {
      expect(templateAgent.maxSteps).toBeLessThanOrEqual(10);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Event Sourcing + Approval Flow', () => {
  it('builds approval workflow from events', () => {
    const events: Event[] = [
      { type: 'status_change', from: 'idle', to: 'running', timestamp: 1 },
      { type: 'user_input', content: 'Deploy to production', timestamp: 2 },
      { type: 'tool_call', toolName: 'check_status', parameters: {}, timestamp: 3 },
      { type: 'tool_result', toolName: 'check_status', result: { ok: true }, success: true, timestamp: 4 },
      {
        type: 'approval_requested',
        action: 'deploy_prod',
        context: 'All checks passed',
        id: 'apr_001',
        timestamp: 5,
      },
    ];

    const state = replayState(events);

    expect(state.status).toBe('paused');
    expect(state.pendingApprovals).toHaveLength(1);
    expect(state.completedActions).toContain('check_status');
  });

  it('resumes after approval', () => {
    const events: Event[] = [
      {
        type: 'approval_requested',
        action: 'deploy_prod',
        context: 'test',
        id: 'apr_001',
        timestamp: 1,
      },
      {
        type: 'approval_granted',
        requestId: 'apr_001',
        approver: 'admin',
        timestamp: 2,
      },
      { type: 'status_change', from: 'paused', to: 'running', timestamp: 3 },
      { type: 'tool_call', toolName: 'deploy_prod', parameters: {}, timestamp: 4 },
      {
        type: 'tool_result',
        toolName: 'deploy_prod',
        result: { deployId: 'd123' },
        success: true,
        timestamp: 5,
      },
    ];

    const state = replayState(events);

    expect(state.status).toBe('running');
    expect(state.pendingApprovals).toHaveLength(0);
    expect(state.completedActions).toContain('deploy_prod');
  });

  it('handles error escalation', () => {
    const events: Event[] = [
      { type: 'error', message: 'Error 1', timestamp: 1 },
      { type: 'error', message: 'Error 2', timestamp: 2 },
      { type: 'error', message: 'Error 3', timestamp: 3 },
    ];

    const state = replayState(events);

    expect(state.consecutiveErrors).toBe(3);
    expect(state.lastError).toBe('Error 3');
  });
});
