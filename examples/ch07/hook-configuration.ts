/**
 * Chapter 7: Quality Gates That Compound
 *
 * This file demonstrates how to configure and manage Claude Code hooks
 * for automated quality gate verification.
 *
 * Hooks run automatically:
 * - pre-commit: Before file modification
 * - post-edit: After editing existing files
 * - post-write: After creating/overwriting files
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// HOOK TYPES AND INTERFACES
// ============================================================================

/**
 * Claude Code hook configuration structure
 */
export interface ClaudeHook {
  /** Command to execute (supports {file} placeholder) */
  command: string;
  /** Human-readable description */
  description: string;
  /** Whether to continue if command fails */
  continueOnError: boolean;
  /** Optional file patterns to match (glob) */
  pattern?: string;
  /** Optional timeout in seconds */
  timeout?: number;
}

/**
 * Hook execution result
 */
export interface HookResult {
  hook: string;
  success: boolean;
  output: string;
  duration: number;
  exitCode: number;
}

/**
 * Represents the .claude/hooks directory structure
 */
export interface HooksDirectory {
  preCommit?: ClaudeHook;
  postEdit?: ClaudeHook;
  postWrite?: ClaudeHook;
}

// ============================================================================
// HOOK TEMPLATES
// ============================================================================

/**
 * Pre-built hook templates for common quality gates
 */
export const HOOK_TEMPLATES = {
  /**
   * ESLint with auto-fix
   */
  eslint: {
    command: "npx eslint {file} --fix",
    description: "Lint and auto-fix code style issues",
    continueOnError: false,
    pattern: "*.{ts,tsx,js,jsx}",
  } as ClaudeHook,

  /**
   * TypeScript type checking (incremental for speed)
   */
  typeCheck: {
    command: "tsc --noEmit --incremental",
    description: "Incremental type checking",
    continueOnError: false,
    pattern: "*.ts",
  } as ClaudeHook,

  /**
   * Run related tests only
   */
  relatedTests: {
    command: "npm test -- --related {file} --passWithNoTests",
    description: "Run tests related to changed file",
    continueOnError: false,
    pattern: "*.{ts,tsx}",
  } as ClaudeHook,

  /**
   * Prettier formatting
   */
  prettier: {
    command: "npx prettier --write {file}",
    description: "Format code with Prettier",
    continueOnError: true,
    pattern: "*.{ts,tsx,js,jsx,json,md}",
  } as ClaudeHook,

  /**
   * Security scan with npm audit
   */
  securityScan: {
    command: "npm audit --audit-level=high",
    description: "Check for security vulnerabilities",
    continueOnError: true,
    timeout: 60,
  } as ClaudeHook,

  /**
   * Full quality chain (lint + types + tests)
   */
  fullChain: {
    command:
      "npx eslint {file} --fix && tsc --noEmit && npm test -- --related {file} --passWithNoTests",
    description: "Full quality gate chain: lint, type check, test",
    continueOnError: false,
    timeout: 120,
  } as ClaudeHook,
};

// ============================================================================
// HOOK CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Creates a hook configuration object
 */
export function createHook(
  command: string,
  description: string,
  options: Partial<ClaudeHook> = {}
): ClaudeHook {
  return {
    command,
    description,
    continueOnError: options.continueOnError ?? false,
    pattern: options.pattern,
    timeout: options.timeout,
  };
}

/**
 * Chains multiple hooks into a single command
 */
export function chainHooks(hooks: ClaudeHook[], operator: "&&" | ";"): ClaudeHook {
  const commands = hooks.map((h) => h.command).join(` ${operator} `);
  const descriptions = hooks.map((h) => h.description).join(" → ");

  return {
    command: commands,
    description: `Chain: ${descriptions}`,
    continueOnError: operator === ";", // Continue on error for ; operator
    timeout: hooks.reduce((sum, h) => sum + (h.timeout || 30), 0),
  };
}

/**
 * Generates the directory structure for hooks
 */
export function generateHooksDirectory(hooks: HooksDirectory): Map<string, string> {
  const files = new Map<string, string>();

  if (hooks.preCommit) {
    files.set(".claude/hooks/pre-commit.json", JSON.stringify(hooks.preCommit, null, 2));
  }

  if (hooks.postEdit) {
    files.set(".claude/hooks/post-edit.json", JSON.stringify(hooks.postEdit, null, 2));
  }

  if (hooks.postWrite) {
    files.set(".claude/hooks/post-write.json", JSON.stringify(hooks.postWrite, null, 2));
  }

  return files;
}

/**
 * Validates hook configuration
 */
export function validateHook(hook: ClaudeHook): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!hook.command || hook.command.trim() === "") {
    errors.push("Hook command is required");
  }

  if (!hook.description || hook.description.trim() === "") {
    errors.push("Hook description is required");
  }

  if (hook.timeout !== undefined && (hook.timeout < 1 || hook.timeout > 600)) {
    errors.push("Timeout must be between 1 and 600 seconds");
  }

  // Check for dangerous commands
  const dangerousPatterns = ["rm -rf", "sudo", "chmod 777", ":(){ :|:& };:"];
  for (const pattern of dangerousPatterns) {
    if (hook.command.includes(pattern)) {
      errors.push(`Potentially dangerous command pattern detected: ${pattern}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// HOOK EXECUTION SIMULATION
// ============================================================================

/**
 * Simulates hook execution for testing
 */
export function simulateHookExecution(
  hook: ClaudeHook,
  filePath: string
): HookResult {
  const startTime = Date.now();

  // Replace {file} placeholder with actual path
  const command = hook.command.replace(/\{file\}/g, filePath);

  // Simulate execution (in real scenario, would use child_process)
  const simulation = simulateCommand(command, filePath);

  return {
    hook: hook.description,
    success: simulation.exitCode === 0,
    output: simulation.output,
    duration: Date.now() - startTime,
    exitCode: simulation.exitCode,
  };
}

/**
 * Simulates a command execution for demonstration
 */
function simulateCommand(
  command: string,
  filePath: string
): { output: string; exitCode: number } {
  // Simulate different scenarios based on command
  if (command.includes("eslint")) {
    if (filePath.includes("bad")) {
      return {
        output: `${filePath}\n  1:1  error  Unexpected console statement  no-console\n\n✖ 1 problem (1 error)`,
        exitCode: 1,
      };
    }
    return { output: "✓ No linting errors", exitCode: 0 };
  }

  if (command.includes("tsc")) {
    if (filePath.includes("type-error")) {
      return {
        output: `${filePath}:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.`,
        exitCode: 1,
      };
    }
    return { output: "✓ No type errors", exitCode: 0 };
  }

  if (command.includes("npm test")) {
    if (filePath.includes("failing")) {
      return {
        output: `FAIL  ${filePath}\n  ✕ should handle edge case (5ms)\n\nExpected: 200\nReceived: 401`,
        exitCode: 1,
      };
    }
    return { output: "PASS  All tests passed", exitCode: 0 };
  }

  return { output: `Executed: ${command}`, exitCode: 0 };
}

/**
 * Runs a full hook chain simulation
 */
export function simulateHookChain(
  hooks: ClaudeHook[],
  filePath: string
): {
  allPassed: boolean;
  results: HookResult[];
  failedAt?: string;
} {
  const results: HookResult[] = [];
  let allPassed = true;
  let failedAt: string | undefined;

  for (const hook of hooks) {
    const result = simulateHookExecution(hook, filePath);
    results.push(result);

    if (!result.success && !hook.continueOnError) {
      allPassed = false;
      failedAt = hook.description;
      break;
    }
  }

  return { allPassed, results, failedAt };
}

// ============================================================================
// AGENT SDK INTEGRATION
// ============================================================================

/**
 * Extract text content from an assistant message
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

/**
 * Uses Claude Agent SDK to suggest optimal hook configuration for a project
 */
export async function suggestHookConfiguration(
  projectDescription: string,
  existingTools: string[]
): Promise<HooksDirectory> {
  const toolsList = existingTools.join(", ");

  const prompt = `Suggest optimal Claude Code hook configurations for this project.

PROJECT: ${projectDescription}

EXISTING TOOLS: ${toolsList}

Provide hook configurations for:
1. post-write.json - Runs after creating/overwriting files
2. post-edit.json - Runs after editing files

Format as JSON:
{
  "postWrite": {
    "command": "...",
    "description": "...",
    "continueOnError": false
  },
  "postEdit": {
    "command": "...",
    "description": "...",
    "continueOnError": false
  }
}

Use {file} placeholder for the affected file path.
Consider performance (hooks should be fast, <5s ideally).`;

  const response = query({
    prompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for analysis
    },
  });

  let fullText = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      fullText += extractTextContent(message);
    }
  }

  if (!fullText) {
    throw new Error("No text response from Claude");
  }

  try {
    // Extract JSON from response
    let jsonText = fullText;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim();
    }
    return JSON.parse(jsonText);
  } catch {
    // Return sensible defaults
    return {
      postWrite: HOOK_TEMPLATES.eslint,
      postEdit: HOOK_TEMPLATES.typeCheck,
    };
  }
}

/**
 * Uses Claude Agent SDK to diagnose hook failures
 */
export async function diagnoseHookFailure(
  hook: ClaudeHook,
  errorOutput: string,
  fileContent: string
): Promise<{
  diagnosis: string;
  suggestedFix: string;
  autoFixable: boolean;
}> {
  const prompt = `Diagnose this Claude Code hook failure and suggest fixes.

HOOK: ${hook.description}
COMMAND: ${hook.command}

ERROR OUTPUT:
${errorOutput}

FILE CONTENT:
\`\`\`
${fileContent.substring(0, 500)}${fileContent.length > 500 ? "..." : ""}
\`\`\`

Provide:
1. Diagnosis of what went wrong
2. Specific fix for the code
3. Whether this can be auto-fixed

Format as JSON:
{
  "diagnosis": "...",
  "suggestedFix": "...",
  "autoFixable": true/false
}`;

  const response = query({
    prompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for analysis
    },
  });

  let fullText = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      fullText += extractTextContent(message);
    }
  }

  if (!fullText) {
    throw new Error("No text response from Claude");
  }

  try {
    let jsonText = fullText;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim();
    }
    return JSON.parse(jsonText);
  } catch {
    return {
      diagnosis: fullText,
      suggestedFix: "Review error output and fix manually",
      autoFixable: false,
    };
  }
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

/**
 * Demonstrates hook template usage
 */
export function demoHookTemplates(): void {
  console.log("=== Hook Templates Demo ===\n");

  console.log("Available Hook Templates:");
  for (const [name, hook] of Object.entries(HOOK_TEMPLATES)) {
    console.log(`\n${name}:`);
    console.log(`  Command: ${hook.command}`);
    console.log(`  Description: ${hook.description}`);
    console.log(`  Continue on error: ${hook.continueOnError}`);
    if (hook.pattern) console.log(`  Pattern: ${hook.pattern}`);
    if (hook.timeout) console.log(`  Timeout: ${hook.timeout}s`);
  }
}

/**
 * Demonstrates hook chaining
 */
export function demoHookChaining(): void {
  console.log("\n=== Hook Chaining Demo ===\n");

  // Chain lint + types + tests with && (stop on first failure)
  const strictChain = chainHooks(
    [HOOK_TEMPLATES.eslint, HOOK_TEMPLATES.typeCheck, HOOK_TEMPLATES.relatedTests],
    "&&"
  );

  console.log("Strict Chain (stops on first failure):");
  console.log(`  Command: ${strictChain.command}`);
  console.log(`  Description: ${strictChain.description}`);

  // Chain with ; (continue even if some fail)
  const relaxedChain = chainHooks(
    [HOOK_TEMPLATES.prettier, HOOK_TEMPLATES.eslint],
    ";"
  );

  console.log("\nRelaxed Chain (continues after failures):");
  console.log(`  Command: ${relaxedChain.command}`);
  console.log(`  Description: ${relaxedChain.description}`);
}

/**
 * Demonstrates hook execution simulation
 */
export function demoHookSimulation(): void {
  console.log("\n=== Hook Execution Simulation ===\n");

  const hooks = [
    HOOK_TEMPLATES.eslint,
    HOOK_TEMPLATES.typeCheck,
    HOOK_TEMPLATES.relatedTests,
  ];

  // Test with a good file
  console.log("Testing with good-file.ts:");
  const goodResult = simulateHookChain(hooks, "good-file.ts");
  console.log(`  All passed: ${goodResult.allPassed}`);
  for (const r of goodResult.results) {
    console.log(`  ${r.hook}: ${r.success ? "PASS" : "FAIL"}`);
  }

  // Test with a file that has linting errors
  console.log("\nTesting with bad-file.ts (has linting errors):");
  const badResult = simulateHookChain(hooks, "bad-file.ts");
  console.log(`  All passed: ${badResult.allPassed}`);
  console.log(`  Failed at: ${badResult.failedAt || "N/A"}`);
  for (const r of badResult.results) {
    console.log(`  ${r.hook}: ${r.success ? "PASS" : "FAIL"}`);
    if (!r.success) console.log(`    Output: ${r.output}`);
  }
}

/**
 * Demonstrates hook directory generation
 */
export function demoHookDirectoryGeneration(): void {
  console.log("\n=== Hook Directory Generation ===\n");

  const hooks: HooksDirectory = {
    postEdit: HOOK_TEMPLATES.typeCheck,
    postWrite: HOOK_TEMPLATES.fullChain,
  };

  const files = generateHooksDirectory(hooks);

  console.log("Generated hook files:");
  for (const [filepath, content] of files) {
    console.log(`\n${filepath}:`);
    console.log(content);
  }
}

/**
 * Demonstrates Claude integration for hook suggestions
 */
export async function demoClaudeHookSuggestions(): Promise<void> {
  console.log("\n=== Claude Hook Suggestions Demo ===\n");

  const projectDescription = "TypeScript React application with Jest tests";
  const existingTools = ["TypeScript", "ESLint", "Prettier", "Jest", "React"];

  console.log(`Project: ${projectDescription}`);
  console.log(`Tools: ${existingTools.join(", ")}`);

  try {
    console.log("\nAsking Claude for optimal hook configuration...");
    const config = await suggestHookConfiguration(projectDescription, existingTools);
    console.log("\nSuggested Configuration:");
    console.log(JSON.stringify(config, null, 2));
  } catch {
    console.log("(Demo requires API key - showing expected workflow)");
  }
}

/**
 * Main demo function
 */
export async function demo(): Promise<void> {
  console.log("Chapter 7: Hook Configuration");
  console.log("=============================\n");

  // Non-API demos
  demoHookTemplates();
  demoHookChaining();
  demoHookSimulation();
  demoHookDirectoryGeneration();

  // API-dependent demo
  if (process.env.ANTHROPIC_API_KEY) {
    await demoClaudeHookSuggestions();
  } else {
    console.log("\n(Set ANTHROPIC_API_KEY to run Claude integration demos)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}
