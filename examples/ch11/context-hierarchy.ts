/**
 * Chapter 11: Three-Layer Context Hierarchy
 *
 * Demonstrates the context loading pattern for sub-agents:
 * - Layer 1: Root CLAUDE.md (shared patterns)
 * - Layer 2: Agent behavioral flows (agent-specific md files)
 * - Layer 3: Package-specific context (per-package CLAUDE.md)
 *
 * Uses the Claude Agent SDK for building production context-aware agents.
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract text content from an SDK assistant message
 */
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const content = message.message.content;
  if (typeof content === "string") return content;

  // Extract text from content blocks
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

// Context layer types
export interface ContextLayer {
  name: string;
  content: string;
  priority: number; // Higher priority overrides lower
}

export interface AgentContext {
  role: string;
  layers: ContextLayer[];
  mergedContext: string;
}

// Example context content (in production, loaded from files)
export const ROOT_CONTEXT = `
# Project Coding Standards

## Architecture
- Monorepo structure with packages
- Layered architecture: Domain -> Application -> Infrastructure
- Dependencies flow inward (hexagonal architecture)

## TypeScript Standards
- Strict mode enabled
- No any types (use unknown + type guards)
- Explicit function return types

## Error Handling
- Use Result pattern, never throw in business logic
- Return { success: boolean, data?: T, error?: string }

## Naming Conventions
- Files: kebab-case (user-service.ts)
- Functions: camelCase (createUser)
- Classes: PascalCase (UserService)

## Testing Standards
- Integration tests over unit tests
- AAA pattern (Arrange, Act, Assert)
- Target >80% coverage
`;

export const BACKEND_ENGINEER_CONTEXT = `
# Backend Engineer Behavioral Flow

You are a Backend Engineer specializing in Node.js/TypeScript APIs.

## Your Workflow

When implementing an API endpoint:

1. **Understand requirements**
   - Read task description
   - Identify inputs, outputs, business rules
   - Check existing endpoint patterns

2. **Design the endpoint**
   - Choose HTTP method (GET/POST/PUT/DELETE)
   - Design URL following REST conventions
   - Define request/response schemas using Zod

3. **Implement layers**
   - Route layer: Express routing, validation middleware
   - Handler layer: Request/response transformation
   - Service layer: Business logic, error handling

4. **Hand off to QA Engineer**
   - Provide endpoint URL, schema, edge cases to test

## What you DON'T do:
- Write frontend code (Frontend Engineer's job)
- Write tests (QA Engineer's job)
- Review your own code (Code Reviewer's job)

## Tools Available
- Read, Write, Edit, Bash, Grep, Glob

## Success Criteria
- Endpoint follows REST conventions
- Uses Zod for validation
- Error handling with Result pattern
- No any types
`;

export const API_PACKAGE_CONTEXT = `
# API Package Context

## Route Structure
All routes follow this pattern:
router.post('/[resource]', validateSchema(schemas.create), handlers.create);

## Authentication
Use JWT tokens with our custom middleware:
router.get('/protected', authenticate, handler);

## Validation Schemas
All schemas in schemas/ directory using Zod:
- Request schemas: *-request.ts
- Response schemas: *-response.ts

## Database Access
Use repositories from @company/domain package:
import { UserRepository } from '@company/domain';

## Error Responses
Standard error format:
{
  success: false,
  error: string,
  code?: string
}
`;

/**
 * Context manager for loading and merging context layers
 */
export class ContextManager {
  private layers: ContextLayer[] = [];

  /**
   * Add a context layer
   */
  addLayer(name: string, content: string, priority: number): void {
    this.layers.push({ name, content, priority });
    // Keep sorted by priority (lowest first, so highest priority is last and overrides)
    this.layers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get merged context with all layers
   */
  getMergedContext(): string {
    const sections: string[] = [];

    for (const layer of this.layers) {
      sections.push(`# === ${layer.name} (Priority: ${layer.priority}) ===\n`);
      sections.push(layer.content);
      sections.push("\n");
    }

    return sections.join("\n");
  }

  /**
   * Get context for a specific agent role
   */
  getAgentContext(
    role: string,
    agentBehavior: string,
    packageContext?: string
  ): AgentContext {
    const contextManager = new ContextManager();

    // Layer 1: Root context (lowest priority)
    contextManager.addLayer("Root CLAUDE.md", ROOT_CONTEXT, 1);

    // Layer 2: Agent behavioral flow (medium priority)
    contextManager.addLayer(`${role} Behavioral Flow`, agentBehavior, 2);

    // Layer 3: Package-specific context (highest priority, overrides others)
    if (packageContext) {
      contextManager.addLayer("Package Context", packageContext, 3);
    }

    return {
      role,
      layers: contextManager.layers,
      mergedContext: contextManager.getMergedContext(),
    };
  }

  /**
   * Get all layers
   */
  getLayers(): ContextLayer[] {
    return [...this.layers];
  }
}

/**
 * Load context for different agent types
 */
export function loadAgentContext(
  role: "backend-engineer" | "frontend-engineer" | "qa-engineer" | "code-reviewer",
  packageName?: string
): AgentContext {
  const manager = new ContextManager();

  // Map role to behavioral context
  const behaviorMap: Record<string, string> = {
    "backend-engineer": BACKEND_ENGINEER_CONTEXT,
    "frontend-engineer": `
# Frontend Engineer Behavioral Flow

You are a Frontend Engineer specializing in React/TypeScript.

## Your Workflow
1. Check existing component patterns
2. Review design system tokens
3. Implement with TypeScript types
4. Add error handling and loading states
5. Hand off to QA Engineer
    `,
    "qa-engineer": `
# QA Engineer Behavioral Flow

You are a QA Engineer specializing in TypeScript testing.

## Your Workflow
1. Understand feature from handoff data
2. Write happy path tests
3. Add edge case tests
4. Test error scenarios
5. Report coverage metrics
    `,
    "code-reviewer": `
# Code Reviewer Behavioral Flow

You are a Code Reviewer with READ-ONLY access.

## Review Dimensions
1. Security (OWASP Top 10)
2. Architecture (layer separation)
3. Performance (N+1 queries, caching)
4. Testing (coverage, edge cases)
5. Error Handling
6. Documentation
7. Accessibility
8. Code Quality

## Output Format
Report findings with severity and location.
    `,
  };

  // Package-specific context
  const packageContextMap: Record<string, string> = {
    api: API_PACKAGE_CONTEXT,
    ui: `
# UI Package Context

## Component Structure
All components use shadcn/ui patterns.
Use Tailwind for styling.

## State Management
Use React Query for server state.
Use Zustand for client state.
    `,
    domain: `
# Domain Package Context

## Entity Patterns
All entities extend BaseEntity with id, createdAt, updatedAt.
Use factory functions for creation.

## Repository Pattern
Each entity has a corresponding repository interface.
    `,
  };

  return manager.getAgentContext(
    role,
    behaviorMap[role] || "",
    packageName ? packageContextMap[packageName] : undefined
  );
}

/**
 * Agent with context hierarchy support using Agent SDK
 */
export class ContextAwareAgent {
  private context: AgentContext;
  private model: string;

  constructor(context: AgentContext, model: string) {
    this.context = context;
    this.model = model;
  }

  async execute(task: string): Promise<string> {
    // Use Agent SDK query() with streaming
    const response = query({
      prompt: task,
      options: {
        model: this.model,
        systemPrompt: this.context.mergedContext,
        maxTurns: 1,
        allowedTools: [],
      },
    });

    // Collect streaming response
    let output = "";
    for await (const message of response) {
      output += extractTextContent(message);
    }

    return output;
  }

  getContextInfo(): {
    role: string;
    layerCount: number;
    layers: Array<{ name: string; priority: number }>;
  } {
    return {
      role: this.context.role,
      layerCount: this.context.layers.length,
      layers: this.context.layers.map((l) => ({
        name: l.name,
        priority: l.priority,
      })),
    };
  }
}

// Demo: Show context hierarchy in action
async function demo() {
  console.log("Context Hierarchy Demo\n");

  // Load context for backend engineer working on API package
  const context = loadAgentContext("backend-engineer", "api");

  console.log(`Role: ${context.role}`);
  console.log(`Layers loaded: ${context.layers.length}`);
  context.layers.forEach((layer) => {
    console.log(`  - ${layer.name} (priority: ${layer.priority})`);
  });

  console.log("\n--- Merged Context Preview (first 500 chars) ---");
  console.log(context.mergedContext.substring(0, 500) + "...");

  // Show how different packages get different context
  console.log("\n\n--- Package Context Comparison ---");
  const apiContext = loadAgentContext("backend-engineer", "api");
  const domainContext = loadAgentContext("backend-engineer", "domain");

  console.log(`API package layers: ${apiContext.layers.length}`);
  console.log(`Domain package layers: ${domainContext.layers.length}`);
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
