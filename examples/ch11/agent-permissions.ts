/**
 * Chapter 11: Agent Permissions and Tool Access Control
 *
 * Demonstrates type-safe permission models for restricting agent capabilities
 * based on their role. Critical for preventing agents from straying into
 * domains where they lack expertise.
 */

import Anthropic from "@anthropic-ai/sdk";

// Available tools in the system
export type Tool =
  | "Read"
  | "Write"
  | "Edit"
  | "Bash"
  | "Grep"
  | "Glob"
  | "WebFetch";

// Agent roles with their capabilities
export type AgentRole =
  | "backend-engineer"
  | "frontend-engineer"
  | "qa-engineer"
  | "code-reviewer"
  | "security-auditor";

// Permission configuration for each role
export interface RolePermissions {
  canWrite: boolean;
  canExecute: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
  tools: Tool[];
  maxFileSize?: number; // bytes
  maxExecutionTime?: number; // seconds
}

// Type-safe permission definitions
export const ROLE_PERMISSIONS: Record<AgentRole, RolePermissions> = {
  "backend-engineer": {
    canWrite: true,
    canExecute: true,
    allowedPaths: [
      "packages/api/**",
      "packages/domain/**",
      "packages/application/**",
      "packages/infrastructure/**",
    ],
    blockedPaths: ["packages/ui/**", "apps/web/**", "*.test.ts", "*.spec.ts"],
    tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
    maxFileSize: 100_000,
    maxExecutionTime: 30,
  },

  "frontend-engineer": {
    canWrite: true,
    canExecute: false, // No shell access
    allowedPaths: [
      "packages/ui/**",
      "apps/web/**",
      "packages/shared/components/**",
    ],
    blockedPaths: [
      "packages/api/**",
      "packages/domain/**",
      "*.test.ts",
      "*.spec.ts",
    ],
    tools: ["Read", "Write", "Edit", "Grep", "Glob"],
    maxFileSize: 50_000,
  },

  "qa-engineer": {
    canWrite: true,
    canExecute: true,
    allowedPaths: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "tests/**",
      "e2e/**",
      "packages/*/src/**", // Read-only for implementation files
    ],
    blockedPaths: [
      ".env*",
      "**/*.secret.*",
      "**/credentials/**",
    ],
    tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
    maxExecutionTime: 120, // Tests may take longer
  },

  "code-reviewer": {
    canWrite: false, // READ-ONLY - critical for preventing "helpful" bugs
    canExecute: false,
    allowedPaths: ["**/*"],
    blockedPaths: [".env*", "**/*.secret.*", "**/credentials/**"],
    tools: ["Read", "Grep", "Glob"], // No Write, Edit, or Bash
  },

  "security-auditor": {
    canWrite: false, // READ-ONLY
    canExecute: true, // Can run security scanners
    allowedPaths: ["**/*"],
    blockedPaths: [], // Full access for security review
    tools: ["Read", "Bash", "Grep", "Glob"],
    maxExecutionTime: 300, // Security scans can be slow
  },
};

/**
 * Check if a path matches a glob pattern
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob to regex
  // Important: escape dots FIRST before converting glob patterns
  const regexPattern = pattern
    .replace(/\./g, "\\.")                // Escape literal dots first
    .replace(/\*\*/g, "<<<GLOBSTAR>>>")   // Protect **
    .replace(/\*/g, "[^/]*")              // Replace single * with non-slash chars
    .replace(/<<<GLOBSTAR>>>/g, ".*")     // Restore ** as .* (match anything)
    .replace(/\?/g, ".");                 // ? matches single char

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Permission checker for agent operations
 */
export class PermissionChecker {
  private role: AgentRole;
  private permissions: RolePermissions;

  constructor(role: AgentRole) {
    this.role = role;
    this.permissions = ROLE_PERMISSIONS[role];
  }

  /**
   * Check if agent can use a specific tool
   */
  canUseTool(tool: Tool): boolean {
    return this.permissions.tools.includes(tool);
  }

  /**
   * Check if agent can access a file path
   */
  canAccessPath(path: string): { allowed: boolean; reason?: string } {
    // Check blocked paths first
    for (const pattern of this.permissions.blockedPaths) {
      if (matchesPattern(path, pattern)) {
        return {
          allowed: false,
          reason: `Path ${path} is blocked for ${this.role}`,
        };
      }
    }

    // Check allowed paths
    for (const pattern of this.permissions.allowedPaths) {
      if (matchesPattern(path, pattern)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `Path ${path} is not in allowed paths for ${this.role}`,
    };
  }

  /**
   * Check if agent can write to a file
   */
  canWriteToPath(path: string): { allowed: boolean; reason?: string } {
    if (!this.permissions.canWrite) {
      return {
        allowed: false,
        reason: `${this.role} has read-only access`,
      };
    }

    return this.canAccessPath(path);
  }

  /**
   * Check if agent can execute commands
   */
  canExecute(): { allowed: boolean; reason?: string } {
    if (!this.permissions.canExecute) {
      return {
        allowed: false,
        reason: `${this.role} cannot execute commands`,
      };
    }
    return { allowed: true };
  }

  /**
   * Get list of available tools for this role
   */
  getAvailableTools(): Tool[] {
    return [...this.permissions.tools];
  }

  /**
   * Validate a full operation
   */
  validateOperation(operation: {
    tool: Tool;
    path?: string;
    isWrite?: boolean;
  }): { valid: boolean; reason?: string } {
    // Check tool permission
    if (!this.canUseTool(operation.tool)) {
      return {
        valid: false,
        reason: `${this.role} cannot use tool: ${operation.tool}`,
      };
    }

    // Check path permission if applicable
    if (operation.path) {
      if (operation.isWrite) {
        const writeCheck = this.canWriteToPath(operation.path);
        if (!writeCheck.allowed) {
          return { valid: false, reason: writeCheck.reason };
        }
      } else {
        const accessCheck = this.canAccessPath(operation.path);
        if (!accessCheck.allowed) {
          return { valid: false, reason: accessCheck.reason };
        }
      }
    }

    // Check execution permission for Bash
    if (operation.tool === "Bash") {
      const execCheck = this.canExecute();
      if (!execCheck.allowed) {
        return { valid: false, reason: execCheck.reason };
      }
    }

    return { valid: true };
  }
}

/**
 * Permission-aware agent wrapper
 */
export class PermissionAwareAgent {
  private client: Anthropic;
  private role: AgentRole;
  private checker: PermissionChecker;
  private model: string;

  constructor(client: Anthropic, role: AgentRole, model: string) {
    this.client = client;
    this.role = role;
    this.checker = new PermissionChecker(role);
    this.model = model;
  }

  /**
   * Execute a task with permission enforcement
   */
  async executeTask(task: string): Promise<{
    success: boolean;
    output: string;
    blockedOperations: string[];
  }> {
    const availableTools = this.checker.getAvailableTools();
    const blockedOperations: string[] = [];

    // Build system prompt with permission context
    const systemPrompt = `
You are a ${this.role} with the following permissions:
- Can write: ${ROLE_PERMISSIONS[this.role].canWrite}
- Can execute: ${ROLE_PERMISSIONS[this.role].canExecute}
- Available tools: ${availableTools.join(", ")}
- Allowed paths: ${ROLE_PERMISSIONS[this.role].allowedPaths.join(", ")}
- Blocked paths: ${ROLE_PERMISSIONS[this.role].blockedPaths.join(", ")}

IMPORTANT: Do not attempt operations outside your permissions.
If you need something outside your scope, report it as a handoff requirement.
    `;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: task }],
    });

    const firstBlock = response.content[0];
    const output = firstBlock && firstBlock.type === "text" ? firstBlock.text : "";

    return {
      success: true,
      output,
      blockedOperations,
    };
  }

  /**
   * Get role information
   */
  getRoleInfo(): {
    role: AgentRole;
    permissions: RolePermissions;
    tools: Tool[];
  } {
    return {
      role: this.role,
      permissions: ROLE_PERMISSIONS[this.role],
      tools: this.checker.getAvailableTools(),
    };
  }
}

// Demo: Show permission checking in action
async function demo() {
  console.log("Permission Checker Demo\n");

  // Test different roles
  const roles: AgentRole[] = [
    "backend-engineer",
    "frontend-engineer",
    "qa-engineer",
    "code-reviewer",
  ];

  for (const role of roles) {
    const checker = new PermissionChecker(role);
    console.log(`\n=== ${role} ===`);
    console.log(`Available tools: ${checker.getAvailableTools().join(", ")}`);

    // Test some operations
    const tests = [
      { tool: "Write" as Tool, path: "packages/api/src/handler.ts", isWrite: true },
      { tool: "Edit" as Tool, path: "packages/ui/src/Button.tsx", isWrite: true },
      { tool: "Read" as Tool, path: "packages/domain/src/user.ts" },
      { tool: "Bash" as Tool },
    ];

    for (const test of tests) {
      const result = checker.validateOperation(test);
      console.log(
        `  ${test.tool} ${test.path || "(command)"}: ${
          result.valid ? "ALLOWED" : `DENIED - ${result.reason}`
        }`
      );
    }
  }
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
