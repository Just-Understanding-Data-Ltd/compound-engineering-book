/**
 * Chapter 13: Harness Configuration Patterns
 *
 * Demonstrates the foundational layer of the four-layer harness model:
 * configuring Claude Code through CLAUDE.md structures, hooks, and constraints.
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// Helper to extract text content from Agent SDK streaming responses
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";
  const content = message.message.content;
  if (typeof content === "string") return content;
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

// ============================================================================
// CLAUDE.md Configuration Types
// ============================================================================

export interface ClaudeMdConfig {
  projectContext: ProjectContext;
  architecturalConstraints: ArchitecturalConstraint[];
  invariants: string[];
  scopeRules: ScopeRule[];
  qualityGates: QualityGate[];
}

interface ProjectContext {
  name: string;
  description: string;
  techStack: string[];
  keyPatterns: Pattern[];
}

interface Pattern {
  name: string;
  description: string;
  example: string;
}

interface ArchitecturalConstraint {
  layer: "domain" | "application" | "infrastructure" | "presentation";
  rules: string[];
}

interface ScopeRule {
  path: string;
  permission: "read" | "write" | "none";
  requiresApproval?: boolean;
}

interface QualityGate {
  name: string;
  command: string;
  required: boolean;
  description: string;
}

// ============================================================================
// CLAUDE.md Builder
// ============================================================================

export function buildClaudeMd(config: ClaudeMdConfig): string {
  const sections: string[] = [];

  // Project header
  sections.push(`# ${config.projectContext.name}`);
  sections.push("");
  sections.push(config.projectContext.description);
  sections.push("");

  // Tech stack
  sections.push("## Tech Stack");
  config.projectContext.techStack.forEach((tech) => {
    sections.push(`- ${tech}`);
  });
  sections.push("");

  // Key patterns
  if (config.projectContext.keyPatterns.length > 0) {
    sections.push("## Key Patterns");
    config.projectContext.keyPatterns.forEach((pattern) => {
      sections.push(`### ${pattern.name}`);
      sections.push(pattern.description);
      sections.push("```typescript");
      sections.push(pattern.example);
      sections.push("```");
      sections.push("");
    });
  }

  // Invariants
  sections.push("## Invariants");
  sections.push(
    "These rules must never be violated. Any code that breaks these invariants must be rejected."
  );
  sections.push("");
  config.invariants.forEach((inv) => {
    sections.push(`- ${inv}`);
  });
  sections.push("");

  // Architectural constraints
  sections.push("## Architecture");
  config.architecturalConstraints.forEach((constraint) => {
    sections.push(`### ${constraint.layer} Layer`);
    constraint.rules.forEach((rule) => {
      sections.push(`- ${rule}`);
    });
    sections.push("");
  });

  // Scope rules
  sections.push("## Scope");
  config.scopeRules.forEach((rule) => {
    const approval = rule.requiresApproval ? " (requires approval)" : "";
    sections.push(`- \`${rule.path}\`: ${rule.permission}${approval}`);
  });
  sections.push("");

  // Quality gates
  sections.push("## Quality Gates");
  sections.push(
    "All quality gates must pass before changes can be committed."
  );
  sections.push("");
  config.qualityGates.forEach((gate) => {
    const required = gate.required ? "[REQUIRED]" : "[RECOMMENDED]";
    sections.push(`### ${gate.name} ${required}`);
    sections.push(gate.description);
    sections.push("```bash");
    sections.push(gate.command);
    sections.push("```");
    sections.push("");
  });

  return sections.join("\n");
}

// ============================================================================
// Hook Configuration
// ============================================================================

export interface HookConfig {
  name: string;
  trigger: "pre-commit" | "post-edit" | "pre-push" | "post-checkout";
  commands: HookCommand[];
  failFast: boolean;
}

interface HookCommand {
  name: string;
  command: string;
  timeout?: number;
  continueOnError?: boolean;
}

export function generateHookScript(config: HookConfig): string {
  const lines: string[] = [
    "#!/bin/bash",
    `# Claude Code hook: ${config.trigger}`,
    `# ${config.name}`,
    "",
    'set -e',
    "",
  ];

  if (!config.failFast) {
    lines.push('EXIT_CODE=0');
    lines.push('');
  }

  config.commands.forEach((cmd) => {
    lines.push(`echo "Running: ${cmd.name}"`);

    if (cmd.timeout) {
      lines.push(`timeout ${cmd.timeout}s ${cmd.command}`);
    } else {
      lines.push(cmd.command);
    }

    if (!config.failFast && cmd.continueOnError) {
      lines.push('if [ $? -ne 0 ]; then EXIT_CODE=1; fi');
    } else if (config.failFast) {
      lines.push('if [ $? -ne 0 ]; then echo "Failed: ${cmd.name}"; exit 1; fi');
    }

    lines.push('');
  });

  if (!config.failFast) {
    lines.push('exit $EXIT_CODE');
  } else {
    lines.push('echo "All checks passed"');
  }

  return lines.join("\n");
}

// ============================================================================
// Example Configurations
// ============================================================================

export const exampleAuthServiceConfig: ClaudeMdConfig = {
  projectContext: {
    name: "Authentication Service",
    description:
      "A secure authentication service handling user registration, login, and session management.",
    techStack: [
      "TypeScript",
      "Node.js 20",
      "Express.js",
      "PostgreSQL",
      "Redis",
      "bcrypt",
    ],
    keyPatterns: [
      {
        name: "Result Type Pattern",
        description:
          "All service functions return a Result type for explicit error handling.",
        example: `type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

function authenticate(credentials: Credentials): Promise<AuthResult<User>>`,
      },
    ],
  },
  architecturalConstraints: [
    {
      layer: "domain",
      rules: [
        "Contains only pure business logic",
        "No external dependencies",
        "All validation in value objects",
      ],
    },
    {
      layer: "application",
      rules: [
        "Orchestrates domain logic",
        "Handles transactions",
        "No direct database access",
      ],
    },
    {
      layer: "infrastructure",
      rules: [
        "Implements repository interfaces",
        "Handles external API calls",
        "Contains database queries",
      ],
    },
    {
      layer: "presentation",
      rules: [
        "HTTP handlers only",
        "Request validation",
        "Response formatting",
      ],
    },
  ],
  invariants: [
    "Never store plaintext passwords",
    "Never log tokens or credentials",
    "All auth endpoints require HTTPS in production",
    "Rate limiting: 5 attempts per minute per IP",
    "Sessions stored in Redis, not memory",
    "Passwords use bcrypt with cost factor 12",
  ],
  scopeRules: [
    { path: "src/features/", permission: "write" },
    { path: "src/core/", permission: "read" },
    { path: "src/core/auth.ts", permission: "write", requiresApproval: true },
    { path: "migrations/", permission: "none" },
    { path: ".env*", permission: "none" },
  ],
  qualityGates: [
    {
      name: "Type Check",
      command: "npm run typecheck",
      required: true,
      description: "TypeScript compilation must succeed with no errors.",
    },
    {
      name: "Lint",
      command: "npm run lint",
      required: true,
      description: "ESLint must pass with no errors or warnings.",
    },
    {
      name: "Unit Tests",
      command: "npm test -- --coverage",
      required: true,
      description: "All unit tests must pass with minimum 80% coverage.",
    },
    {
      name: "Security Audit",
      command: "npm audit --audit-level=moderate",
      required: false,
      description: "No moderate or higher vulnerabilities allowed.",
    },
  ],
};

export const examplePreCommitHook: HookConfig = {
  name: "Pre-commit validation",
  trigger: "pre-commit",
  failFast: true,
  commands: [
    { name: "Type check", command: "npm run typecheck" },
    { name: "Lint", command: "npm run lint" },
    { name: "Format check", command: "npm run format:check" },
    { name: "Unit tests", command: "npm test", timeout: 120 },
  ],
};

export const examplePostEditHook: HookConfig = {
  name: "Post-edit verification",
  trigger: "post-edit",
  failFast: false,
  commands: [
    { name: "Related tests", command: "npm test -- --changed", continueOnError: true },
    { name: "Type check", command: "npm run typecheck" },
  ],
};

// ============================================================================
// AI-Assisted Configuration Generation
// ============================================================================

export async function generateClaudeMdWithAI(
  projectDescription: string,
  existingFiles: string[]
): Promise<string> {
  const fileContext = existingFiles.slice(0, 20).join("\n- ");

  const prompt = `Generate a CLAUDE.md configuration for this project:

Project Description: ${projectDescription}

Key Files:
- ${fileContext}

Generate a CLAUDE.md with:
1. Project context and tech stack
2. At least 5 invariants specific to this project type
3. Architectural constraints using DDD layers
4. Scope rules for safe modification
5. Quality gates with actual commands

Output only the markdown content, no explanation.`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let result = "";
  for await (const message of response) {
    result += extractTextContent(message);
  }
  return result;
}

// ============================================================================
// Demo: Generate Configuration
// ============================================================================

async function demo() {
  console.log("=== Chapter 13: Harness Configuration Demo ===\n");

  // Generate CLAUDE.md from config
  console.log("--- Generated CLAUDE.md ---\n");
  const claudeMd = buildClaudeMd(exampleAuthServiceConfig);
  console.log(claudeMd);

  // Generate hook script
  console.log("\n--- Generated Pre-Commit Hook ---\n");
  const hookScript = generateHookScript(examplePreCommitHook);
  console.log(hookScript);

  // Generate post-edit hook
  console.log("\n--- Generated Post-Edit Hook ---\n");
  const postEditScript = generateHookScript(examplePostEditHook);
  console.log(postEditScript);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
