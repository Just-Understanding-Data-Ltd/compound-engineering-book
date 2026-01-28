/**
 * Chapter 11: Sub-Agent Architecture - Tests
 *
 * Tests for sub-agent orchestration, tool access control,
 * actor-critic adversarial coding, and context hierarchy.
 */

import { describe, expect, test } from "bun:test";

// Import from sub-agent-orchestration.ts
import {
  runAgent,
  SubAgentOrchestrator,
  type AgentRole,
  type AgentTask,
  type AgentResult,
  type OrchestratorConfig,
} from "./sub-agent-orchestration";

// Import from agent-permissions.ts
import {
  PermissionChecker,
  PermissionAwareAgent,
  ROLE_PERMISSIONS,
  type Tool,
  type RolePermissions,
} from "./agent-permissions";

// Import from actor-critic-loop.ts
import {
  ActorCriticLoop,
  quickCritique,
  CRITIQUE_DIMENSIONS,
  type CritiqueDimension,
  type CritiqueIssue,
  type CritiqueResult,
  type ActorCriticSession,
} from "./actor-critic-loop";

// Import from context-hierarchy.ts
import {
  ContextManager,
  ContextAwareAgent,
  loadAgentContext,
  ROOT_CONTEXT,
  BACKEND_ENGINEER_CONTEXT,
  API_PACKAGE_CONTEXT,
  type ContextLayer,
  type AgentContext,
} from "./context-hierarchy";

// ============================================================================
// SUB-AGENT ORCHESTRATION TESTS
// ============================================================================

describe("Sub-Agent Orchestration", () => {
  describe("AgentRole types", () => {
    test("defines all four core agent roles", () => {
      const roles: AgentRole[] = [
        "backend-engineer",
        "frontend-engineer",
        "qa-engineer",
        "code-reviewer",
      ];

      expect(roles.length).toBe(4);
      roles.forEach((role) => {
        expect(typeof role).toBe("string");
      });
    });
  });

  describe("AgentTask interface", () => {
    test("accepts valid agent task", () => {
      const task: AgentTask = {
        role: "backend-engineer",
        task: "Implement user authentication endpoint",
        context: "Node.js Express API with TypeScript",
        dependencies: ["auth-schema"],
      };

      expect(task.role).toBe("backend-engineer");
      expect(task.task).toContain("authentication");
      expect(task.dependencies).toBeDefined();
    });

    test("allows optional dependencies", () => {
      const task: AgentTask = {
        role: "code-reviewer",
        task: "Review authentication code",
        context: "Security-focused review",
      };

      expect(task.dependencies).toBeUndefined();
    });
  });

  describe("AgentResult interface", () => {
    test("handles success status", () => {
      const result: AgentResult = {
        role: "backend-engineer",
        status: "success",
        output: "Implemented /api/auth endpoint",
        handoffData: { endpoint: "/api/auth", method: "POST" },
      };

      expect(result.status).toBe("success");
      expect(result.issues).toBeUndefined();
    });

    test("handles failure status with issues", () => {
      const result: AgentResult = {
        role: "code-reviewer",
        status: "failure",
        output: "Critical security issues found",
        issues: [
          {
            severity: "critical",
            description: "SQL injection vulnerability",
            location: "auth.ts:45",
          },
        ],
      };

      expect(result.status).toBe("failure");
      expect(result.issues?.length).toBe(1);
      expect(result.issues?.[0]?.severity).toBe("critical");
    });

    test("handles needs-review status", () => {
      const result: AgentResult = {
        role: "qa-engineer",
        status: "needs-review",
        output: "Tests written but coverage below target",
        issues: [
          {
            severity: "medium",
            description: "Coverage at 75%, target is 80%",
          },
        ],
      };

      expect(result.status).toBe("needs-review");
    });
  });

  describe("SubAgentOrchestrator class", () => {
    test("can be instantiated with config", () => {
      // Mock config (actual API calls mocked in integration tests)
      const mockConfig: OrchestratorConfig = {
        model: "claude-sonnet-4-5-20250929",
        maxTokens: 4096,
      };

      const orchestrator = new SubAgentOrchestrator(mockConfig);
      expect(orchestrator).toBeDefined();
    });
  });
});

// ============================================================================
// AGENT PERMISSIONS TESTS
// ============================================================================

describe("Agent Permissions", () => {
  describe("ROLE_PERMISSIONS configuration", () => {
    test("defines permissions for all roles", () => {
      const roles = [
        "backend-engineer",
        "frontend-engineer",
        "qa-engineer",
        "code-reviewer",
        "security-auditor",
      ] as const;

      roles.forEach((role) => {
        const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
        expect(permissions).toBeDefined();
        expect(permissions.canWrite).toBeDefined();
        expect(permissions.tools.length).toBeGreaterThan(0);
      });
    });

    test("code-reviewer is read-only", () => {
      const reviewerPerms = ROLE_PERMISSIONS["code-reviewer"];
      expect(reviewerPerms.canWrite).toBe(false);
      expect(reviewerPerms.canExecute).toBe(false);
      expect(reviewerPerms.tools).not.toContain("Write");
      expect(reviewerPerms.tools).not.toContain("Edit");
    });

    test("backend-engineer has write access", () => {
      const backendPerms = ROLE_PERMISSIONS["backend-engineer"];
      expect(backendPerms.canWrite).toBe(true);
      expect(backendPerms.tools).toContain("Write");
      expect(backendPerms.tools).toContain("Edit");
    });

    test("frontend-engineer cannot execute bash", () => {
      const frontendPerms = ROLE_PERMISSIONS["frontend-engineer"];
      expect(frontendPerms.canExecute).toBe(false);
      expect(frontendPerms.tools).not.toContain("Bash");
    });

    test("qa-engineer has extended execution time", () => {
      const qaPerms = ROLE_PERMISSIONS["qa-engineer"];
      expect(qaPerms.maxExecutionTime).toBe(120);
    });
  });

  describe("PermissionChecker class", () => {
    test("checks tool permissions", () => {
      const checker = new PermissionChecker("backend-engineer");
      expect(checker.canUseTool("Write")).toBe(true);
      expect(checker.canUseTool("Edit")).toBe(true);
      expect(checker.canUseTool("Bash")).toBe(true);
    });

    test("code-reviewer cannot use write tools", () => {
      const checker = new PermissionChecker("code-reviewer");
      expect(checker.canUseTool("Read")).toBe(true);
      expect(checker.canUseTool("Write")).toBe(false);
      expect(checker.canUseTool("Edit")).toBe(false);
      expect(checker.canUseTool("Bash")).toBe(false);
    });

    test("checks path access for backend engineer", () => {
      const checker = new PermissionChecker("backend-engineer");

      // Allowed paths
      const apiAccess = checker.canAccessPath("packages/api/src/routes.ts");
      expect(apiAccess.allowed).toBe(true);

      const domainAccess = checker.canAccessPath("packages/domain/user.ts");
      expect(domainAccess.allowed).toBe(true);
    });

    test("blocks access to frontend for backend engineer", () => {
      const checker = new PermissionChecker("backend-engineer");
      const uiAccess = checker.canAccessPath("packages/ui/Button.tsx");
      expect(uiAccess.allowed).toBe(false);
    });

    test("blocks write for read-only reviewer", () => {
      const checker = new PermissionChecker("code-reviewer");
      const writeCheck = checker.canWriteToPath("packages/api/src/handler.ts");
      expect(writeCheck.allowed).toBe(false);
      expect(writeCheck.reason).toContain("read-only");
    });

    test("validates full operation", () => {
      const checker = new PermissionChecker("backend-engineer");

      // Valid operation
      const validOp = checker.validateOperation({
        tool: "Write",
        path: "packages/api/src/handler.ts",
        isWrite: true,
      });
      expect(validOp.valid).toBe(true);

      // Invalid tool
      const invalidTool = checker.validateOperation({
        tool: "WebFetch",
      });
      expect(invalidTool.valid).toBe(false);
    });

    test("returns available tools list", () => {
      const checker = new PermissionChecker("qa-engineer");
      const tools = checker.getAvailableTools();
      expect(tools).toContain("Read");
      expect(tools).toContain("Write");
      expect(tools).toContain("Bash");
      expect(tools.length).toBe(6);
    });
  });
});

// ============================================================================
// ACTOR-CRITIC LOOP TESTS
// ============================================================================

describe("Actor-Critic Loop", () => {
  describe("CRITIQUE_DIMENSIONS", () => {
    test("defines 8 critique dimensions", () => {
      expect(CRITIQUE_DIMENSIONS.length).toBe(8);
    });

    test("includes security dimension with checklist", () => {
      const security = CRITIQUE_DIMENSIONS.find((d) => d.name === "Security");
      expect(security).toBeDefined();
      expect(security?.items.length).toBeGreaterThan(5);
      expect(security?.items).toContain("Input validation on all user data");
      expect(security?.items).toContain("SQL injection prevention (parameterized queries)");
    });

    test("includes architecture dimension", () => {
      const arch = CRITIQUE_DIMENSIONS.find((d) => d.name === "Architecture");
      expect(arch).toBeDefined();
      expect(arch?.items).toContain("Layer separation (route/handler/service)");
    });

    test("includes performance dimension", () => {
      const perf = CRITIQUE_DIMENSIONS.find((d) => d.name === "Performance");
      expect(perf).toBeDefined();
      expect(perf?.items).toContain("No N+1 queries");
    });

    test("includes testing dimension", () => {
      const testing = CRITIQUE_DIMENSIONS.find((d) => d.name === "Testing");
      expect(testing).toBeDefined();
      expect(testing?.items).toContain("Happy path covered");
    });

    test("includes error handling dimension", () => {
      const errorHandling = CRITIQUE_DIMENSIONS.find(
        (d) => d.name === "Error Handling"
      );
      expect(errorHandling).toBeDefined();
      expect(errorHandling?.items).toContain("No swallowed exceptions");
    });

    test("includes documentation dimension", () => {
      const docs = CRITIQUE_DIMENSIONS.find((d) => d.name === "Documentation");
      expect(docs).toBeDefined();
      expect(docs?.items).toContain("JSDoc/TSDoc on public functions");
    });

    test("includes accessibility dimension", () => {
      const a11y = CRITIQUE_DIMENSIONS.find((d) => d.name === "Accessibility");
      expect(a11y).toBeDefined();
      expect(a11y?.items).toContain("Semantic HTML");
      expect(a11y?.items).toContain("ARIA labels");
    });

    test("includes code quality dimension", () => {
      const quality = CRITIQUE_DIMENSIONS.find((d) => d.name === "Code Quality");
      expect(quality).toBeDefined();
      expect(quality?.items).toContain("No duplication (DRY)");
    });
  });

  describe("CritiqueIssue interface", () => {
    test("handles critical severity issues", () => {
      const issue: CritiqueIssue = {
        dimension: "Security",
        severity: "critical",
        description: "SQL injection vulnerability",
        location: "auth.ts:45",
        suggestion: "Use parameterized queries",
      };

      expect(issue.severity).toBe("critical");
      expect(issue.dimension).toBe("Security");
      expect(issue.location).toBeDefined();
    });

    test("allows optional fields", () => {
      const issue: CritiqueIssue = {
        dimension: "Code Quality",
        severity: "low",
        description: "Magic number in code",
      };

      expect(issue.location).toBeUndefined();
      expect(issue.suggestion).toBeUndefined();
    });
  });

  describe("CritiqueResult interface", () => {
    test("represents approved result", () => {
      const result: CritiqueResult = {
        round: 3,
        issues: [],
        approved: true,
        summary: "Round 3: 0 issues found. APPROVED",
      };

      expect(result.approved).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test("represents needs-revision result", () => {
      const result: CritiqueResult = {
        round: 1,
        issues: [
          {
            dimension: "Security",
            severity: "critical",
            description: "Missing auth check",
          },
        ],
        approved: false,
        summary: "Round 1: 1 issues found. NEEDS_REVISION",
      };

      expect(result.approved).toBe(false);
      expect(result.issues.length).toBe(1);
    });
  });

  describe("ActorCriticSession interface", () => {
    test("tracks full session progress", () => {
      const session: ActorCriticSession = {
        task: "Implement JWT auth",
        rounds: [
          {
            round: 1,
            actorOutput: "Initial code",
            criticResult: {
              round: 1,
              issues: [{ dimension: "Security", severity: "critical", description: "Hardcoded secret" }],
              approved: false,
              summary: "Round 1: 1 issue",
            },
          },
          {
            round: 2,
            actorOutput: "Fixed code",
            criticResult: {
              round: 2,
              issues: [],
              approved: true,
              summary: "Round 2: 0 issues. APPROVED",
            },
          },
        ],
        finalApproved: true,
        totalIssuesFound: 1,
        totalIssuesFixed: 1,
      };

      expect(session.rounds.length).toBe(2);
      expect(session.finalApproved).toBe(true);
      expect(session.totalIssuesFixed).toBe(1);
    });
  });

  describe("ActorCriticLoop class", () => {
    test("can get critique dimensions", () => {
      const dimensions = ActorCriticLoop.getDimensions();
      expect(dimensions.length).toBe(8);
      expect(dimensions[0]?.name).toBe("Security");
    });

    test("can be instantiated with max rounds", () => {
      const loop = new ActorCriticLoop("claude-sonnet-4-5-20250929", 5);
      expect(loop).toBeDefined();
    });
  });
});

// ============================================================================
// CONTEXT HIERARCHY TESTS
// ============================================================================

describe("Context Hierarchy", () => {
  describe("ROOT_CONTEXT", () => {
    test("contains architecture guidelines", () => {
      expect(ROOT_CONTEXT).toContain("Monorepo structure");
      expect(ROOT_CONTEXT).toContain("Layered architecture");
      expect(ROOT_CONTEXT).toContain("hexagonal architecture");
    });

    test("contains TypeScript standards", () => {
      expect(ROOT_CONTEXT).toContain("Strict mode enabled");
      expect(ROOT_CONTEXT).toContain("No any types");
    });

    test("contains error handling guidelines", () => {
      expect(ROOT_CONTEXT).toContain("Result pattern");
    });

    test("contains naming conventions", () => {
      expect(ROOT_CONTEXT).toContain("kebab-case");
      expect(ROOT_CONTEXT).toContain("camelCase");
      expect(ROOT_CONTEXT).toContain("PascalCase");
    });
  });

  describe("BACKEND_ENGINEER_CONTEXT", () => {
    test("defines role-specific workflow", () => {
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Backend Engineer");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Node.js/TypeScript");
    });

    test("specifies workflow steps", () => {
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Understand requirements");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Design the endpoint");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Implement layers");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Hand off to QA");
    });

    test("specifies what role does NOT do", () => {
      expect(BACKEND_ENGINEER_CONTEXT).toContain("DON'T do");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Write frontend code");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Write tests");
      expect(BACKEND_ENGINEER_CONTEXT).toContain("Review your own code");
    });
  });

  describe("API_PACKAGE_CONTEXT", () => {
    test("contains package-specific patterns", () => {
      expect(API_PACKAGE_CONTEXT).toContain("Route Structure");
      expect(API_PACKAGE_CONTEXT).toContain("Authentication");
      expect(API_PACKAGE_CONTEXT).toContain("Validation Schemas");
    });

    test("specifies JWT middleware pattern", () => {
      expect(API_PACKAGE_CONTEXT).toContain("JWT tokens");
      expect(API_PACKAGE_CONTEXT).toContain("authenticate");
    });
  });

  describe("ContextManager class", () => {
    test("adds layers with priority", () => {
      const manager = new ContextManager();
      manager.addLayer("Root", "Root content", 1);
      manager.addLayer("Agent", "Agent content", 2);
      manager.addLayer("Package", "Package content", 3);

      const layers = manager.getLayers();
      expect(layers.length).toBe(3);
      expect(layers[0]?.priority).toBe(1);
      expect(layers[2]?.priority).toBe(3);
    });

    test("sorts layers by priority", () => {
      const manager = new ContextManager();
      manager.addLayer("Package", "Package", 3);
      manager.addLayer("Root", "Root", 1);
      manager.addLayer("Agent", "Agent", 2);

      const layers = manager.getLayers();
      expect(layers[0]?.name).toBe("Root");
      expect(layers[1]?.name).toBe("Agent");
      expect(layers[2]?.name).toBe("Package");
    });

    test("merges context in order", () => {
      const manager = new ContextManager();
      manager.addLayer("Root", "Root patterns", 1);
      manager.addLayer("Agent", "Agent behavior", 2);

      const merged = manager.getMergedContext();
      expect(merged).toContain("Root patterns");
      expect(merged).toContain("Agent behavior");
      // Lower priority appears first
      expect(merged.indexOf("Root")).toBeLessThan(merged.indexOf("Agent"));
    });

    test("getAgentContext creates three-layer hierarchy", () => {
      const manager = new ContextManager();
      const context = manager.getAgentContext(
        "backend-engineer",
        "Agent workflow",
        "Package patterns"
      );

      expect(context.role).toBe("backend-engineer");
      expect(context.layers.length).toBe(3);
      expect(context.mergedContext).toContain("Root");
      expect(context.mergedContext).toContain("Agent workflow");
      expect(context.mergedContext).toContain("Package patterns");
    });

    test("getAgentContext works without package context", () => {
      const manager = new ContextManager();
      const context = manager.getAgentContext(
        "code-reviewer",
        "Review workflow"
      );

      expect(context.layers.length).toBe(2);
    });
  });

  describe("loadAgentContext function", () => {
    test("loads backend engineer context", () => {
      const context = loadAgentContext("backend-engineer");
      expect(context.role).toBe("backend-engineer");
      expect(context.layers.length).toBe(2);
    });

    test("loads context with package override", () => {
      const context = loadAgentContext("backend-engineer", "api");
      expect(context.layers.length).toBe(3);
      expect(context.mergedContext).toContain("API Package");
    });

    test("loads frontend engineer context", () => {
      const context = loadAgentContext("frontend-engineer");
      expect(context.role).toBe("frontend-engineer");
      expect(context.mergedContext).toContain("React/TypeScript");
    });

    test("loads qa engineer context", () => {
      const context = loadAgentContext("qa-engineer");
      expect(context.role).toBe("qa-engineer");
      expect(context.mergedContext).toContain("testing");
    });

    test("loads code reviewer context", () => {
      const context = loadAgentContext("code-reviewer");
      expect(context.role).toBe("code-reviewer");
      expect(context.mergedContext).toContain("READ-ONLY");
    });

    test("loads domain package context", () => {
      const context = loadAgentContext("backend-engineer", "domain");
      expect(context.mergedContext).toContain("Domain Package");
      expect(context.mergedContext).toContain("Entity Patterns");
    });

    test("loads ui package context", () => {
      const context = loadAgentContext("frontend-engineer", "ui");
      expect(context.mergedContext).toContain("UI Package");
      expect(context.mergedContext).toContain("shadcn");
    });
  });

  describe("ContextAwareAgent class", () => {
    test("exposes context info", () => {
      const context = loadAgentContext("backend-engineer", "api");
      const agent = new ContextAwareAgent(context, "claude-sonnet-4-5-20250929");

      const info = agent.getContextInfo();
      expect(info.role).toBe("backend-engineer");
      expect(info.layerCount).toBe(3);
      expect(info.layers.length).toBe(3);
    });

    test("layer priorities are correct", () => {
      const context = loadAgentContext("qa-engineer");
      const agent = new ContextAwareAgent(context, "claude-sonnet-4-5-20250929");

      const info = agent.getContextInfo();
      const priorities = info.layers.map((l) => l.priority);
      expect(priorities).toEqual([1, 2]); // Root, Agent
    });
  });
});

// ============================================================================
// INTEGRATION TESTS (Type-level)
// ============================================================================

describe("Integration Types", () => {
  test("agent permissions align with orchestration roles", () => {
    const orchestrationRoles: AgentRole[] = [
      "backend-engineer",
      "frontend-engineer",
      "qa-engineer",
      "code-reviewer",
    ];

    orchestrationRoles.forEach((role) => {
      expect(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]).toBeDefined();
    });
  });

  test("context hierarchy supports all agent roles", () => {
    const roles: Array<"backend-engineer" | "frontend-engineer" | "qa-engineer" | "code-reviewer"> = [
      "backend-engineer",
      "frontend-engineer",
      "qa-engineer",
      "code-reviewer",
    ];

    roles.forEach((role) => {
      const context = loadAgentContext(role);
      expect(context.role).toBe(role);
      expect(context.mergedContext.length).toBeGreaterThan(100);
    });
  });

  test("critique dimensions cover all quality aspects", () => {
    const dimensionNames = CRITIQUE_DIMENSIONS.map((d) => d.name);
    expect(dimensionNames).toContain("Security");
    expect(dimensionNames).toContain("Architecture");
    expect(dimensionNames).toContain("Performance");
    expect(dimensionNames).toContain("Testing");
    expect(dimensionNames).toContain("Error Handling");
    expect(dimensionNames).toContain("Documentation");
    expect(dimensionNames).toContain("Accessibility");
    expect(dimensionNames).toContain("Code Quality");
  });

  test("tool permissions match Claude Code tools", () => {
    const claudeTools: Tool[] = ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "WebFetch"];

    Object.values(ROLE_PERMISSIONS).forEach((perms) => {
      perms.tools.forEach((tool) => {
        expect(claudeTools).toContain(tool);
      });
    });
  });
});

// ============================================================================
// PATTERN VALIDATION TESTS
// ============================================================================

describe("Pattern Validation", () => {
  describe("Sub-agent handoff pattern", () => {
    test("result includes handoff data structure", () => {
      const result: AgentResult = {
        role: "backend-engineer",
        status: "success",
        output: "Implemented endpoint",
        handoffData: {
          endpoint: "/api/payments",
          method: "POST",
          schema: { amount: "number", currency: "string" },
          edgeCases: ["negative amount", "invalid currency"],
        },
      };

      expect(result.handoffData?.endpoint).toBe("/api/payments");
      expect(result.handoffData?.edgeCases).toHaveLength(2);
    });
  });

  describe("Actor-critic convergence pattern", () => {
    test("issues decrease over rounds (simulation)", () => {
      const rounds = [
        { issues: 5, approved: false },
        { issues: 2, approved: false },
        { issues: 0, approved: true },
      ];

      for (let i = 1; i < rounds.length; i++) {
        expect(rounds[i]!.issues).toBeLessThanOrEqual(rounds[i - 1]!.issues);
      }
      expect(rounds[rounds.length - 1]?.approved).toBe(true);
    });
  });

  describe("Context priority pattern", () => {
    test("higher priority overrides lower in merge order", () => {
      const manager = new ContextManager();
      manager.addLayer("Global", "Global: use semicolons", 1);
      manager.addLayer("Team", "Team: no semicolons", 2);
      manager.addLayer("Project", "Project: tabs not spaces", 3);

      const merged = manager.getMergedContext();

      // Project (highest priority) appears last, so its rules take precedence
      const projectIndex = merged.indexOf("Project");
      const teamIndex = merged.indexOf("Team");
      const globalIndex = merged.indexOf("Global");

      expect(globalIndex).toBeLessThan(teamIndex);
      expect(teamIndex).toBeLessThan(projectIndex);
    });
  });

  describe("Permission escalation prevention", () => {
    test("read-only role cannot gain write access", () => {
      const checker = new PermissionChecker("code-reviewer");

      // Try all write-related operations
      expect(checker.canUseTool("Write")).toBe(false);
      expect(checker.canUseTool("Edit")).toBe(false);
      expect(checker.canWriteToPath("any/path.ts").allowed).toBe(false);
      expect(checker.canExecute().allowed).toBe(false);
    });

    test("frontend engineer cannot access backend paths", () => {
      const checker = new PermissionChecker("frontend-engineer");

      expect(checker.canAccessPath("packages/api/routes.ts").allowed).toBe(false);
      expect(checker.canAccessPath("packages/domain/user.ts").allowed).toBe(false);
    });
  });
});
