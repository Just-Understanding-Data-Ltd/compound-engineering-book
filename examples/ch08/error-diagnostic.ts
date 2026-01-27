/**
 * Chapter 8: Error Handling & Debugging
 *
 * This file demonstrates the five-point error diagnostic framework
 * for systematically categorizing and fixing errors in AI-assisted development.
 *
 * Key concepts:
 * - Five error categories: Context, Model, Rules, Testing, Quality Gate
 * - Systematic diagnosis before fixing
 * - Prevention encoding to eliminate error classes
 * - Context debugging with hierarchical layers
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const client = new Anthropic();

// ============================================================================
// ERROR DIAGNOSTIC TYPES AND INTERFACES
// ============================================================================

/**
 * The five categories of LLM-related errors
 */
export type ErrorCategory =
  | "context"
  | "model"
  | "rules"
  | "testing"
  | "quality_gate";

/**
 * Distribution of error types based on empirical observation
 */
export const ERROR_DISTRIBUTION: Record<ErrorCategory, number> = {
  context: 0.6, // 60% of errors
  model: 0.1, // 10% of errors
  rules: 0.15, // 15% of errors
  testing: 0.1, // 10% of errors
  quality_gate: 0.05, // 5% of errors
};

/**
 * Symptoms that indicate a specific error category
 */
export const ERROR_SYMPTOMS: Record<ErrorCategory, string[]> = {
  context: [
    "Code doesn't match existing project patterns",
    "References to non-existent files or functions",
    "Generic implementations without project-specific knowledge",
    "Wrong library versions or APIs used",
  ],
  model: [
    "Failure on complex architectural decisions",
    "Incomplete solutions for multi-step reasoning",
    "Same mistakes repeated despite good context",
    "Hallucinated APIs or methods",
  ],
  rules: [
    "Pattern violations despite having context",
    "Missing edge case handling",
    "Convention violations",
    "Security requirements ignored",
  ],
  testing: [
    "Code passes tests but fails in production",
    "Tests check presence not behavior",
    "Missing edge case coverage",
    "No regression tests",
  ],
  quality_gate: [
    "Code compiles but violates architecture",
    "Linting passes but conventions break",
    "Subtle bugs slip through",
    "No automated check enforces requirement",
  ],
};

/**
 * Represents a diagnosed error with category and analysis
 */
export interface DiagnosedError {
  /** Original error description */
  description: string;
  /** Diagnosed category */
  category: ErrorCategory;
  /** Confidence level (0-1) */
  confidence: number;
  /** Symptoms that matched */
  matchedSymptoms: string[];
  /** Recommended fix approach */
  fixApproach: string;
  /** Prevention strategy */
  preventionStrategy: string;
}

/**
 * Five-point diagnostic step results
 */
export interface DiagnosticSteps {
  /** Step 1: Reproduce the error */
  reproduce: {
    isolated: boolean;
    reproducible: boolean;
    steps: string[];
  };
  /** Step 2: Locate root cause */
  locate: {
    file: string;
    line?: number;
    component: string;
    rootCause: string;
  };
  /** Step 3: Categorize the error */
  categorize: {
    category: ErrorCategory;
    confidence: number;
    symptoms: string[];
  };
  /** Step 4: Apply minimal fix */
  fix: {
    approach: string;
    changes: string[];
    verified: boolean;
  };
  /** Step 5: Prevent future occurrences */
  prevent: {
    strategy: "claude_md" | "hook" | "test" | "lint" | "type_guard";
    implementation: string;
    encodingLocation: string;
  };
}

/**
 * Context debugging layer information
 */
export interface ContextLayer {
  layer: number;
  name: string;
  description: string;
  checkItems: string[];
  probability: number;
  avgFixTime: number; // minutes
}

// ============================================================================
// FIVE-POINT DIAGNOSTIC FRAMEWORK
// ============================================================================

/**
 * The four layers of context debugging, ordered by probability of success
 */
export const CONTEXT_LAYERS: ContextLayer[] = [
  {
    layer: 1,
    name: "Context",
    description: "Add missing information, files, examples, architecture",
    checkItems: [
      "Include relevant code files",
      "Provide system architecture",
      "Include error messages and stack traces",
      "Show database schemas",
    ],
    probability: 0.6,
    avgFixTime: 5,
  },
  {
    layer: 2,
    name: "Prompting",
    description: "Refine instructions, add examples, clarify constraints",
    checkItems: [
      "Add specific examples of desired output",
      "Include edge cases and constraints",
      "Break complex tasks into steps",
    ],
    probability: 0.25,
    avgFixTime: 10,
  },
  {
    layer: 3,
    name: "Model Power",
    description: "Escalate to more powerful model for complex reasoning",
    checkItems: [
      "Context and prompting are exhausted",
      "Task requires advanced reasoning",
      "Consistent failures across multiple attempts",
    ],
    probability: 0.1,
    avgFixTime: 20,
  },
  {
    layer: 4,
    name: "Manual Override",
    description: "Recognize when human intuition is needed",
    checkItems: [
      "Deep domain expertise required",
      "Subjective creative decisions",
      "Ambiguous or contradictory requirements",
      "Legacy systems with tribal knowledge",
    ],
    probability: 0.05,
    avgFixTime: 30,
  },
];

/**
 * Calculate expected debugging time using proper layer ordering
 */
export function calculateExpectedDebugTime(): number {
  return CONTEXT_LAYERS.reduce(
    (total, layer) => total + layer.probability * layer.avgFixTime,
    0
  );
}

/**
 * Diagnose an error by matching symptoms to categories
 */
export function diagnoseErrorCategory(
  symptoms: string[]
): { category: ErrorCategory; confidence: number; matched: string[] }[] {
  const results: {
    category: ErrorCategory;
    confidence: number;
    matched: string[];
  }[] = [];

  for (const [category, categorySymptoms] of Object.entries(ERROR_SYMPTOMS)) {
    const matched = symptoms.filter((s) =>
      categorySymptoms.some(
        (cs) =>
          cs.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(cs.toLowerCase())
      )
    );

    if (matched.length > 0) {
      const confidence = matched.length / categorySymptoms.length;
      results.push({
        category: category as ErrorCategory,
        confidence: Math.min(confidence * 1.5, 1), // Boost confidence for matches
        matched,
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get the recommended fix approach for an error category
 */
export function getFixApproach(category: ErrorCategory): string {
  const approaches: Record<ErrorCategory, string> = {
    context:
      "Add missing context: Include relevant files, examples, and architecture documentation",
    model:
      "Escalate model: Use Claude Opus for complex reasoning or break task into smaller steps",
    rules:
      "Update CLAUDE.md: Add specific rules and examples for the missing behavior",
    testing:
      "Add tests: Create tests that verify behavior, not just presence",
    quality_gate:
      "Add automation: Create lint rules, type guards, or CI checks",
  };
  return approaches[category];
}

/**
 * Get the prevention strategy for an error category
 */
export function getPreventionStrategy(category: ErrorCategory): {
  strategy: string;
  location: string;
  example: string;
} {
  const strategies: Record<
    ErrorCategory,
    { strategy: string; location: string; example: string }
  > = {
    context: {
      strategy: "Document architecture patterns",
      location: "CLAUDE.md or project docs",
      example:
        "Add section: '## Architecture\\nWe use Next.js with tRPC API layer'",
    },
    model: {
      strategy: "Break complex tasks into steps",
      location: "Task decomposition in CLAUDE.md",
      example:
        "Add: 'For auth features, implement in 3 steps: 1) Basic login, 2) Session handling, 3) OAuth'",
    },
    rules: {
      strategy: "Add explicit rules with examples",
      location: "CLAUDE.md rules section",
      example:
        "Add: '## Security\\nALWAYS hash passwords with bcrypt: `await bcrypt.hash(password, 12)`'",
    },
    testing: {
      strategy: "Create behavior-verifying tests",
      location: "Test files and test patterns in CLAUDE.md",
      example: "Add test template showing expected behavior verification pattern",
    },
    quality_gate: {
      strategy: "Add automated checks",
      location: "Pre-commit hooks or CI pipeline",
      example: "Add ESLint rule or ast-grep pattern to catch the issue",
    },
  };
  return strategies[category];
}

// ============================================================================
// SDK-POWERED ERROR DIAGNOSIS
// ============================================================================

/**
 * Use Claude to perform automated error diagnosis
 */
export async function diagnoseErrorWithClaude(
  errorDescription: string,
  codeContext: string,
  errorMessage: string
): Promise<DiagnosedError> {
  const diagnosticPrompt = `You are diagnosing a software error in an AI-assisted development context.

ERROR DESCRIPTION:
${errorDescription}

CODE CONTEXT:
${codeContext}

ERROR MESSAGE:
${errorMessage}

The five error categories are:
1. CONTEXT (60% of errors): AI lacks information to make correct decisions
2. MODEL (10% of errors): Current model lacks capability for task complexity
3. RULES (15% of errors): CLAUDE.md doesn't specify required behavior
4. TESTING (10% of errors): Tests don't catch the error type
5. QUALITY_GATE (5% of errors): No automated check enforces requirement

Analyze this error and respond in JSON format:
{
  "category": "context|model|rules|testing|quality_gate",
  "confidence": 0.0-1.0,
  "symptoms": ["symptom1", "symptom2"],
  "fixApproach": "brief description of fix",
  "preventionStrategy": "how to prevent this class of errors"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: diagnosticPrompt }],
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";

  // Parse JSON from response (handle potential markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse diagnostic response");
  }

  const diagnosis = JSON.parse(jsonMatch[0]);

  return {
    description: errorDescription,
    category: diagnosis.category as ErrorCategory,
    confidence: diagnosis.confidence,
    matchedSymptoms: diagnosis.symptoms,
    fixApproach: diagnosis.fixApproach,
    preventionStrategy: diagnosis.preventionStrategy,
  };
}

/**
 * Apply the full five-point diagnostic framework with Claude assistance
 */
export async function applyFivePointDiagnostic(
  testPath: string,
  errorMessage: string,
  testCode: string
): Promise<DiagnosticSteps> {
  const diagnosticPrompt = `Apply the five-point error diagnostic framework to this failing test:

Test: ${testPath}
Error: ${errorMessage}

Test Code:
${testCode}

Steps to follow:
1. REPRODUCE: Describe how to isolate and reproduce this failure
2. LOCATE: Identify the file, line, and root cause
3. CATEGORIZE: Is this a context, model, rules, testing, or quality_gate error?
4. FIX: Propose the minimal fix
5. PREVENT: Suggest a lint rule, type guard, test improvement, or CLAUDE.md rule

Respond in JSON format:
{
  "reproduce": {
    "isolated": boolean,
    "reproducible": boolean,
    "steps": ["step1", "step2"]
  },
  "locate": {
    "file": "path/to/file",
    "line": number or null,
    "component": "component name",
    "rootCause": "description"
  },
  "categorize": {
    "category": "context|model|rules|testing|quality_gate",
    "confidence": 0.0-1.0,
    "symptoms": ["symptom1"]
  },
  "fix": {
    "approach": "description",
    "changes": ["change1", "change2"],
    "verified": false
  },
  "prevent": {
    "strategy": "claude_md|hook|test|lint|type_guard",
    "implementation": "code or description",
    "encodingLocation": "where to add this"
  }
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{ role: "user", content: diagnosticPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse five-point diagnostic response");
  }

  return JSON.parse(jsonMatch[0]) as DiagnosticSteps;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format diagnostic results as a readable report
 */
export function formatDiagnosticReport(diagnosis: DiagnosedError): string {
  const prevention = getPreventionStrategy(diagnosis.category);

  return `
## Error Diagnostic Report

**Description**: ${diagnosis.description}
**Category**: ${diagnosis.category.toUpperCase()} (${(diagnosis.confidence * 100).toFixed(0)}% confidence)

### Matched Symptoms
${diagnosis.matchedSymptoms.map((s) => `- ${s}`).join("\n")}

### Recommended Fix
${diagnosis.fixApproach}

### Prevention Strategy
**Strategy**: ${prevention.strategy}
**Location**: ${prevention.location}
**Example**: ${prevention.example}

### Prevention Implementation
${diagnosis.preventionStrategy}
`.trim();
}

/**
 * Calculate the probability-weighted time for debugging
 */
export function analyzeDebuggingEfficiency(
  actualLayerUsed: number,
  actualTime: number
): { efficiency: string; recommendation: string } {
  const expectedTime = calculateExpectedDebugTime();
  const expectedLayer = CONTEXT_LAYERS.find(
    (l) =>
      CONTEXT_LAYERS.slice(0, CONTEXT_LAYERS.indexOf(l) + 1).reduce(
        (sum, layer) => sum + layer.probability,
        0
      ) >= 0.5
  );

  const efficiency =
    actualTime <= expectedTime
      ? "Good - debugging was efficient"
      : `Slow - took ${actualTime - expectedTime} minutes longer than expected`;

  let recommendation = "";
  if (actualLayerUsed > 1 && actualLayerUsed !== expectedLayer?.layer) {
    recommendation =
      "Consider starting at Layer 1 (Context) next time - it solves 60% of issues";
  } else if (actualTime > expectedTime * 1.5) {
    recommendation =
      "Document this error in ERRORS.md to speed up future diagnosis";
  }

  return { efficiency, recommendation };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate the error diagnostic framework
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 8: Five-Point Error Diagnostic Framework ===\n");

  // Example 1: Calculate expected debugging time
  console.log("1. Expected Debugging Time Analysis");
  const expectedTime = calculateExpectedDebugTime();
  console.log(`   Expected time with proper layer ordering: ${expectedTime} minutes`);
  console.log("   Layer breakdown:");
  for (const layer of CONTEXT_LAYERS) {
    console.log(
      `   - Layer ${layer.layer} (${layer.name}): ${layer.probability * 100}% probability, ${layer.avgFixTime} min avg`
    );
  }

  // Example 2: Diagnose error symptoms
  console.log("\n2. Symptom-Based Diagnosis");
  const symptoms = [
    "Code doesn't match existing patterns",
    "References to non-existent functions",
  ];
  const diagnoses = diagnoseErrorCategory(symptoms);
  console.log(`   Symptoms: ${symptoms.join(", ")}`);
  console.log("   Diagnosis results:");
  for (const d of diagnoses.slice(0, 2)) {
    console.log(
      `   - ${d.category}: ${(d.confidence * 100).toFixed(0)}% confidence`
    );
  }

  // Example 3: Get fix approach
  console.log("\n3. Fix Approaches by Category");
  for (const category of Object.keys(ERROR_DISTRIBUTION) as ErrorCategory[]) {
    const approach = getFixApproach(category);
    console.log(`   ${category}: ${approach.substring(0, 60)}...`);
  }

  // Example 4: SDK-powered diagnosis (requires API key)
  console.log("\n4. SDK-Powered Error Diagnosis");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const diagnosis = await diagnoseErrorWithClaude(
        "AI generated code stores passwords in plain text",
        "async function createUser(email, password) { await db.users.create({ email, password }) }",
        "Security review failed: plain text password storage detected"
      );
      console.log(`   Category: ${diagnosis.category}`);
      console.log(`   Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);
      console.log(`   Fix: ${diagnosis.fixApproach}`);
    } catch (error) {
      console.log("   (API call skipped - demonstration only)");
    }
  } else {
    console.log("   (API key not set - skipping live demonstration)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
