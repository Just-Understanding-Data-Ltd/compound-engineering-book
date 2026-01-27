/**
 * Playwright Script Loop - Browser Automation Patterns
 *
 * Using Playwright MCP tool calls creates slow feedback loops.
 * Each tool call requires API round-trips. A direct script runs
 * 10x faster (10-20 seconds vs 2-3 minutes).
 *
 * This file demonstrates generating Playwright scripts as code
 * artifacts for fast iteration loops.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Validation result from running a Playwright test
interface ValidationResult {
  testName: string;
  passed: boolean;
  duration: number; // milliseconds
  failures: string[];
  screenshotPath?: string;
}

// Playwright test specification
interface PlaywrightSpec {
  name: string;
  description: string;
  url: string;
  steps: PlaywrightStep[];
}

interface PlaywrightStep {
  action: "navigate" | "click" | "fill" | "waitFor" | "assert" | "screenshot";
  selector?: string;
  value?: string;
  description: string;
}

// Comparison metrics between MCP and script approaches
interface ApproachComparison {
  mcpApproach: {
    estimatedTime: number; // seconds
    apiCalls: number;
    issuesFoundAt: "one-at-a-time" | "all-at-once";
  };
  scriptApproach: {
    estimatedTime: number;
    apiCalls: number;
    issuesFoundAt: "one-at-a-time" | "all-at-once";
  };
  speedup: number;
}

/**
 * Generates a Playwright test script from a specification.
 * Returns TypeScript code that can be run directly.
 */
export function generatePlaywrightScript(spec: PlaywrightSpec): string {
  const lines: string[] = [
    `import { test, expect } from '@playwright/test';`,
    ``,
    `/**`,
    ` * ${spec.description}`,
    ` */`,
    `test('${spec.name}', async ({ page }) => {`,
  ];

  for (const step of spec.steps) {
    const indent = "  ";

    switch (step.action) {
      case "navigate":
        lines.push(`${indent}// ${step.description}`);
        lines.push(`${indent}await page.goto('${step.value}');`);
        break;

      case "click":
        lines.push(`${indent}// ${step.description}`);
        lines.push(`${indent}await page.click('${step.selector}');`);
        break;

      case "fill":
        lines.push(`${indent}// ${step.description}`);
        lines.push(`${indent}await page.fill('${step.selector}', '${step.value}');`);
        break;

      case "waitFor":
        lines.push(`${indent}// ${step.description}`);
        if (step.selector) {
          lines.push(`${indent}await page.waitForSelector('${step.selector}');`);
        } else {
          lines.push(`${indent}await page.waitForURL('${step.value}');`);
        }
        break;

      case "assert":
        lines.push(`${indent}// ${step.description}`);
        if (step.selector) {
          lines.push(`${indent}await expect(page.locator('${step.selector}')).toBeVisible();`);
        } else {
          lines.push(`${indent}expect(page.url()).toContain('${step.value}');`);
        }
        break;

      case "screenshot":
        lines.push(`${indent}// ${step.description}`);
        lines.push(`${indent}await page.screenshot({ path: '${step.value}' });`);
        break;
    }

    lines.push("");
  }

  lines.push("});");

  return lines.join("\n");
}

/**
 * Generates a Playwright test from a natural language description
 * using Claude to interpret the requirements.
 */
export async function generatePlaywrightFromDescription(
  description: string,
  baseUrl: string
): Promise<{ spec: PlaywrightSpec; script: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate a Playwright test specification for the following validation:

${description}

Base URL: ${baseUrl}

Output as JSON:
{
  "name": "test-name-kebab-case",
  "description": "what this test validates",
  "url": "${baseUrl}",
  "steps": [
    {
      "action": "navigate|click|fill|waitFor|assert|screenshot",
      "selector": "CSS selector or data-testid attribute",
      "value": "URL, text value, or file path for screenshots",
      "description": "human-readable step description"
    }
  ]
}

Use data-testid attributes when possible for reliable selectors.`,
      },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Expected text response");
  }

  let jsonText = (content as { type: "text"; text: string }).text;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  const spec = JSON.parse(jsonText.trim()) as PlaywrightSpec;
  const script = generatePlaywrightScript(spec);

  return { spec, script };
}

/**
 * Compares MCP tool calls vs direct script approach.
 */
export function compareApproaches(stepCount: number): ApproachComparison {
  // MCP: ~15-20 seconds per tool call
  const mcpTimePerCall = 17; // average
  const mcpTotalTime = stepCount * mcpTimePerCall;

  // Script: base load time + ~1-2 seconds per step
  const scriptBaseTime = 5; // browser launch
  const scriptTimePerStep = 1.5;
  const scriptTotalTime = scriptBaseTime + stepCount * scriptTimePerStep;

  return {
    mcpApproach: {
      estimatedTime: mcpTotalTime,
      apiCalls: stepCount,
      issuesFoundAt: "one-at-a-time",
    },
    scriptApproach: {
      estimatedTime: scriptTotalTime,
      apiCalls: 0,
      issuesFoundAt: "all-at-once",
    },
    speedup: mcpTotalTime / scriptTotalTime,
  };
}

/**
 * Generates iteration feedback after a failed test run.
 * Used to guide the fix-and-retry loop.
 */
export function analyzeTestFailures(results: ValidationResult[]): {
  summary: string;
  fixes: string[];
  priority: "low" | "medium" | "high";
} {
  const failures = results.filter((r) => !r.passed);

  if (failures.length === 0) {
    return {
      summary: `All ${results.length} tests passed`,
      fixes: [],
      priority: "low",
    };
  }

  const fixes: string[] = [];
  const allFailures = failures.flatMap((f) => f.failures);

  // Common failure patterns and their fixes
  const patterns: { pattern: RegExp; fix: string }[] = [
    {
      pattern: /element not found|selector.*not found/i,
      fix: "Add data-testid attributes to target elements",
    },
    {
      pattern: /timeout.*waiting/i,
      fix: "Increase timeout or add explicit waitFor steps",
    },
    {
      pattern: /expected.*url.*got/i,
      fix: "Check redirect logic or update expected URL pattern",
    },
    {
      pattern: /not visible/i,
      fix: "Element may be hidden, check CSS or wait for animation",
    },
    {
      pattern: /expected.*text.*received/i,
      fix: "Update assertion to match actual text content",
    },
  ];

  for (const failure of allFailures) {
    for (const { pattern, fix } of patterns) {
      if (pattern.test(failure) && !fixes.includes(fix)) {
        fixes.push(fix);
      }
    }
  }

  // If no patterns matched, add generic fix
  if (fixes.length === 0 && allFailures.length > 0) {
    fixes.push("Review test assertions against actual page state");
  }

  return {
    summary: `${failures.length}/${results.length} tests failed`,
    fixes,
    priority: failures.length > results.length / 2 ? "high" : "medium",
  };
}

/**
 * Creates a Playwright config optimized for AI-assisted development.
 */
export function generatePlaywrightConfig(): string {
  return `import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Fast feedback for development
  timeout: 30_000,
  retries: 0,

  // Useful for debugging
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // Run tests in parallel for speed
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,

  // Reporter for clear output
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // Project configurations
  projects: [
    {
      name: 'validation',
      testDir: './tests/validation',
      use: { baseURL: process.env.BASE_URL || 'http://localhost:3000' },
    },
  ],
});`;
}

// Example specifications for demonstration
export const EXAMPLE_SPECS: PlaywrightSpec[] = [
  {
    name: "login-flow",
    description: "Validates the user login flow works correctly",
    url: "/login",
    steps: [
      { action: "navigate", value: "/login", description: "Navigate to login page" },
      { action: "fill", selector: '[data-testid="email"]', value: "test@example.com", description: "Enter email" },
      { action: "fill", selector: '[data-testid="password"]', value: "password123", description: "Enter password" },
      { action: "click", selector: '[data-testid="submit"]', description: "Click submit button" },
      { action: "waitFor", value: "/dashboard", description: "Wait for redirect to dashboard" },
      { action: "assert", selector: '[data-testid="welcome-message"]', description: "Verify welcome message appears" },
    ],
  },
  {
    name: "form-validation",
    description: "Validates form error messages display correctly",
    url: "/signup",
    steps: [
      { action: "navigate", value: "/signup", description: "Navigate to signup page" },
      { action: "fill", selector: '[data-testid="email"]', value: "invalid-email", description: "Enter invalid email" },
      { action: "click", selector: '[data-testid="submit"]', description: "Try to submit" },
      { action: "assert", selector: '[data-testid="error-message"]', description: "Verify error message shows" },
    ],
  },
];

// Demo: Generate Playwright scripts
function demo() {
  console.log("=== Playwright Script Loop Demo ===\n");

  // Compare approaches
  console.log("Speed Comparison (10-step validation):");
  const comparison = compareApproaches(10);
  console.log(`  MCP approach: ${comparison.mcpApproach.estimatedTime}s (${comparison.mcpApproach.apiCalls} API calls)`);
  console.log(`  Script approach: ${comparison.scriptApproach.estimatedTime}s (${comparison.scriptApproach.apiCalls} API calls)`);
  console.log(`  Speedup: ${comparison.speedup.toFixed(1)}x faster`);
  console.log(`  MCP finds issues: ${comparison.mcpApproach.issuesFoundAt}`);
  console.log(`  Script finds issues: ${comparison.scriptApproach.issuesFoundAt}`);

  console.log("\n=== Generated Login Flow Test ===\n");
  const loginSpec = EXAMPLE_SPECS[0]!;
  const script = generatePlaywrightScript(loginSpec);
  console.log(script);

  console.log("\n=== Iteration Loop Example ===");
  console.log(`
# Iteration 1: Generate and run
$ npx playwright test tests/validation/login-flow.spec.ts

❌ 3 failed: Email input not found, Password input not found, Submit button not found

# Iteration 2: Add data-testid attributes, run again
$ npx playwright test tests/validation/login-flow.spec.ts

❌ 1 failed: Expected redirect to /dashboard, got /login

# Iteration 3: Fix redirect logic, run again
$ npx playwright test tests/validation/login-flow.spec.ts

✓ All tests passed
`);

  // Analyze mock failures
  console.log("=== Failure Analysis ===");
  const mockResults: ValidationResult[] = [
    { testName: "login-flow", passed: false, duration: 5000, failures: ["Email input not found", "Timeout waiting for dashboard"] },
    { testName: "form-validation", passed: true, duration: 3000, failures: [] },
  ];

  const analysis = analyzeTestFailures(mockResults);
  console.log(`Summary: ${analysis.summary}`);
  console.log(`Priority: ${analysis.priority}`);
  console.log(`Suggested fixes:`);
  analysis.fixes.forEach((fix) => console.log(`  - ${fix}`));
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}
