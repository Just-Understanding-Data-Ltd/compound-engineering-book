/**
 * Approval Gate Workflow
 *
 * Demonstrates Factor 6 (Launch/Pause/Resume with Simple APIs),
 * Factor 7 (Contact Humans with Tool Calls), and
 * Factor 8 (Own Your Control Flow).
 *
 * Key concepts:
 * - Different tool types need different handling
 * - High-risk actions require human approval
 * - Agents can pause and resume with preserved context
 *
 * Related to Chapter 5 sections:
 * - "Factor 6: Launch/Pause/Resume with Simple APIs"
 * - "Factor 7: Contact Humans with Tool Calls"
 * - "Factor 8: Own Your Control Flow"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ============================================================================
// Tool Classification
// ============================================================================

export type ToolClassification = 'immediate' | 'requires_approval' | 'terminal' | 'error';

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

/**
 * Classify a tool call based on risk level
 */
export function classifyTool(toolCall: ToolCall): ToolClassification {
  // High-risk tools that require approval
  const approvalRequired = [
    'deploy_to_production',
    'delete_database',
    'send_bulk_email',
    'modify_billing',
    'create_admin_user',
    'rollback_deployment',
  ];

  // Tools that complete the workflow
  const terminalTools = [
    'complete_task',
    'task_finished',
    'end_workflow',
  ];

  // Data fetching tools that are always safe
  const immediateTools = [
    'get_user',
    'list_items',
    'fetch_data',
    'read_config',
    'get_status',
    'deploy_to_staging',
    'run_tests',
  ];

  if (approvalRequired.includes(toolCall.name)) {
    return 'requires_approval';
  }
  if (terminalTools.includes(toolCall.name)) {
    return 'terminal';
  }
  if (immediateTools.includes(toolCall.name)) {
    return 'immediate';
  }

  // Default to requiring approval for unknown tools
  return 'requires_approval';
}

// ============================================================================
// Approval Request Types
// ============================================================================

export interface ApprovalRequest {
  id: string;
  toolCall: ToolCall;
  context: string;
  urgency: 'low' | 'medium' | 'high';
  requestedAt: number;
}

export interface ApprovalResponse {
  requestId: string;
  approved: boolean;
  approver: string;
  feedback?: string;
  respondedAt: number;
}

// ============================================================================
// Workflow Thread
// ============================================================================

export type WorkflowStatus = 'running' | 'paused' | 'completed' | 'failed';

export interface WorkflowThread {
  id: string;
  status: WorkflowStatus;
  events: Array<{
    type: string;
    data: unknown;
    timestamp: number;
  }>;
  consecutiveErrors: number;
  pendingApproval: ApprovalRequest | null;
  context: string;
}

export function createWorkflow(initialContext: string): WorkflowThread {
  return {
    id: `workflow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    status: 'running',
    events: [],
    consecutiveErrors: 0,
    pendingApproval: null,
    context: initialContext,
  };
}

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Simulate tool execution (in production, these would call real APIs)
 */
async function executeTool(toolCall: ToolCall): Promise<{
  success: boolean;
  result: unknown;
  error?: string;
}> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock implementations
  switch (toolCall.name) {
    case 'get_status':
      return { success: true, result: { status: 'healthy', uptime: '99.9%' } };

    case 'deploy_to_staging':
      return { success: true, result: { deploymentId: 'stg_123', url: 'https://staging.example.com' } };

    case 'run_tests':
      return { success: true, result: { passed: 47, failed: 0, skipped: 2 } };

    case 'deploy_to_production':
      return { success: true, result: { deploymentId: 'prod_456', url: 'https://example.com' } };

    case 'send_bulk_email':
      const count = toolCall.parameters.recipientCount as number || 0;
      return { success: true, result: { sent: count, queued: 0, failed: 0 } };

    case 'complete_task':
      return { success: true, result: { message: 'Task completed successfully' } };

    default:
      return { success: true, result: { message: `Executed ${toolCall.name}` } };
  }
}

// ============================================================================
// Human Approval Integration
// ============================================================================

/**
 * Create an approval request for a high-risk action
 */
function createApprovalRequest(
  toolCall: ToolCall,
  context: string
): ApprovalRequest {
  const urgencyMap: Record<string, 'low' | 'medium' | 'high'> = {
    'deploy_to_production': 'high',
    'delete_database': 'high',
    'send_bulk_email': 'medium',
    'modify_billing': 'high',
    'create_admin_user': 'medium',
    'rollback_deployment': 'high',
  };

  return {
    id: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    toolCall,
    context,
    urgency: urgencyMap[toolCall.name] || 'medium',
    requestedAt: Date.now(),
  };
}

/**
 * Simulate sending approval request to human (Slack, email, etc.)
 */
async function notifyHumanForApproval(request: ApprovalRequest): Promise<void> {
  console.log('\n📋 APPROVAL REQUEST');
  console.log('==================');
  console.log(`ID: ${request.id}`);
  console.log(`Tool: ${request.toolCall.name}`);
  console.log(`Parameters: ${JSON.stringify(request.toolCall.parameters, null, 2)}`);
  console.log(`Context: ${request.context}`);
  console.log(`Urgency: ${request.urgency.toUpperCase()}`);
  console.log('==================\n');
}

// ============================================================================
// Agent Control Flow
// ============================================================================

type ContentBlock = Anthropic.Messages.ContentBlock;
type ToolUseBlock = Anthropic.Messages.ToolUseBlock;

const AVAILABLE_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'get_status',
    description: 'Get the current system status',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'deploy_to_staging',
    description: 'Deploy the application to staging environment',
    input_schema: {
      type: 'object' as const,
      properties: {
        branch: { type: 'string', description: 'Git branch to deploy' },
      },
    },
  },
  {
    name: 'run_tests',
    description: 'Run the test suite',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'deploy_to_production',
    description: 'Deploy to production. Requires human approval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        version: { type: 'string', description: 'Version to deploy' },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Mark the current task as complete',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: 'Summary of what was accomplished' },
      },
    },
  },
];

/**
 * Get next action from Claude
 */
async function getNextAction(
  workflow: WorkflowThread,
  userRequest: string
): Promise<ToolCall | null> {
  const systemPrompt = `You are a deployment assistant. Your current task is to help with: ${userRequest}

Current workflow context:
${workflow.context}

Recent events:
${workflow.events.slice(-5).map(e => `- ${e.type}: ${JSON.stringify(e.data)}`).join('\n')}

Choose the next action to take. If the task is complete, use the complete_task tool.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    tools: AVAILABLE_TOOLS,
    messages: [
      { role: 'user', content: userRequest },
    ],
  });

  // Find tool use in response
  const toolUse = response.content.find(
    (block: ContentBlock) => block.type === 'tool_use'
  ) as ToolUseBlock | undefined;

  if (toolUse) {
    return {
      name: toolUse.name,
      parameters: toolUse.input as Record<string, unknown>,
    };
  }

  return null;
}

/**
 * Main agent loop with approval gates
 * This demonstrates Factor 8: Own Your Control Flow
 */
export async function agentLoop(
  workflow: WorkflowThread,
  userRequest: string,
  approvalCallback?: (request: ApprovalRequest) => Promise<ApprovalResponse>
): Promise<WorkflowThread> {
  const maxIterations = 10; // Safety limit
  let iterations = 0;

  while (workflow.status === 'running' && iterations < maxIterations) {
    iterations++;
    console.log(`\n--- Iteration ${iterations} ---`);

    // Get next action from Claude
    const toolCall = await getNextAction(workflow, userRequest);

    if (!toolCall) {
      console.log('No tool call returned, ending workflow');
      workflow.status = 'completed';
      break;
    }

    console.log(`Tool requested: ${toolCall.name}`);

    // Classify the tool
    const classification = classifyTool(toolCall);
    console.log(`Classification: ${classification}`);

    // Handle based on classification
    switch (classification) {
      case 'immediate':
        // Execute immediately and continue
        console.log(`Executing ${toolCall.name}...`);
        const immediateResult = await executeTool(toolCall);
        workflow.events.push({
          type: 'tool_result',
          data: { toolCall, result: immediateResult },
          timestamp: Date.now(),
        });

        if (!immediateResult.success) {
          workflow.consecutiveErrors++;
          if (workflow.consecutiveErrors >= 3) {
            console.log('Too many errors, pausing for human intervention');
            workflow.status = 'paused';
          }
        } else {
          workflow.consecutiveErrors = 0;
        }
        break;

      case 'requires_approval':
        // Create approval request and pause
        const approvalRequest = createApprovalRequest(toolCall, workflow.context);
        workflow.pendingApproval = approvalRequest;
        workflow.status = 'paused';

        await notifyHumanForApproval(approvalRequest);

        // If callback provided, get approval (for automated testing)
        if (approvalCallback) {
          const approvalResponse = await approvalCallback(approvalRequest);

          if (approvalResponse.approved) {
            console.log(`✅ Approved by ${approvalResponse.approver}`);
            workflow.pendingApproval = null;
            workflow.status = 'running';

            // Execute the approved tool
            const approvedResult = await executeTool(toolCall);
            workflow.events.push({
              type: 'approved_execution',
              data: { toolCall, approval: approvalResponse, result: approvedResult },
              timestamp: Date.now(),
            });
          } else {
            console.log(`❌ Denied: ${approvalResponse.feedback}`);
            workflow.events.push({
              type: 'approval_denied',
              data: { request: approvalRequest, response: approvalResponse },
              timestamp: Date.now(),
            });
            // Stay paused for human to provide alternative direction
          }
        }
        break;

      case 'terminal':
        // Workflow complete
        console.log('Terminal tool called, completing workflow');
        const terminalResult = await executeTool(toolCall);
        workflow.events.push({
          type: 'workflow_complete',
          data: { toolCall, result: terminalResult },
          timestamp: Date.now(),
        });
        workflow.status = 'completed';
        break;

      case 'error':
        // Handle error
        workflow.consecutiveErrors++;
        workflow.events.push({
          type: 'error',
          data: { toolCall, message: 'Tool classified as error' },
          timestamp: Date.now(),
        });

        if (workflow.consecutiveErrors >= 3) {
          console.log('Escalating to human after 3 consecutive errors');
          workflow.status = 'paused';
        }
        break;
    }
  }

  if (iterations >= maxIterations) {
    console.log('Max iterations reached');
    workflow.status = 'paused';
  }

  return workflow;
}

// ============================================================================
// Workflow Lifecycle APIs (Factor 6)
// ============================================================================

/**
 * Launch a new workflow
 */
export async function launch(
  userRequest: string,
  approvalCallback?: (request: ApprovalRequest) => Promise<ApprovalResponse>
): Promise<WorkflowThread> {
  const workflow = createWorkflow(`Task: ${userRequest}`);
  console.log(`\n🚀 Launching workflow ${workflow.id}`);
  return agentLoop(workflow, userRequest, approvalCallback);
}

/**
 * Pause an active workflow
 */
export function pause(workflow: WorkflowThread): void {
  if (workflow.status === 'running') {
    workflow.status = 'paused';
    workflow.events.push({
      type: 'paused',
      data: { reason: 'Manual pause' },
      timestamp: Date.now(),
    });
    console.log(`⏸️  Workflow ${workflow.id} paused`);
  }
}

/**
 * Resume a paused workflow
 */
export async function resume(
  workflow: WorkflowThread,
  feedback?: string,
  approvalCallback?: (request: ApprovalRequest) => Promise<ApprovalResponse>
): Promise<WorkflowThread> {
  if (workflow.status !== 'paused') {
    console.log('Cannot resume: workflow is not paused');
    return workflow;
  }

  console.log(`▶️  Resuming workflow ${workflow.id}`);

  if (feedback) {
    workflow.events.push({
      type: 'human_feedback',
      data: { feedback },
      timestamp: Date.now(),
    });
    workflow.context += `\n\nHuman feedback: ${feedback}`;
  }

  // If there was a pending approval, handle it
  if (workflow.pendingApproval && approvalCallback) {
    const response = await approvalCallback(workflow.pendingApproval);
    if (response.approved) {
      const result = await executeTool(workflow.pendingApproval.toolCall);
      workflow.events.push({
        type: 'resumed_execution',
        data: { toolCall: workflow.pendingApproval.toolCall, result },
        timestamp: Date.now(),
      });
      workflow.pendingApproval = null;
    }
  }

  workflow.status = 'running';
  return agentLoop(workflow, workflow.context, approvalCallback);
}

// ============================================================================
// Demo: Approval Gate Workflow
// ============================================================================

export async function runApprovalGateDemo(): Promise<{
  workflow: WorkflowThread;
  approved: boolean;
}> {
  console.log('Approval Gate Workflow Demo');
  console.log('===========================\n');

  // Auto-approve callback for demo
  const autoApprove = async (request: ApprovalRequest): Promise<ApprovalResponse> => {
    // Simulate human review delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      requestId: request.id,
      approved: true,
      approver: 'demo-user@example.com',
      feedback: 'Approved for demo',
      respondedAt: Date.now(),
    };
  };

  // Launch workflow with a request that requires approval
  const workflow = await launch(
    'Deploy the auth service to staging, run tests, then deploy to production',
    autoApprove
  );

  console.log('\n📊 Workflow Summary');
  console.log('===================');
  console.log(`ID: ${workflow.id}`);
  console.log(`Status: ${workflow.status}`);
  console.log(`Total events: ${workflow.events.length}`);
  console.log(`Consecutive errors: ${workflow.consecutiveErrors}`);

  const approvalEvents = workflow.events.filter(e =>
    e.type === 'approved_execution' || e.type === 'approval_denied'
  );
  console.log(`Approval events: ${approvalEvents.length}`);

  return {
    workflow,
    approved: approvalEvents.some(e => e.type === 'approved_execution'),
  };
}

// Run if executed directly
if (import.meta.main) {
  runApprovalGateDemo().catch(console.error);
}
