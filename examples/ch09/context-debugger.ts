/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * This file demonstrates the systematic context debugging framework.
 * When AI doesn't produce desired output, follow a hierarchical protocol
 * ordered by likelihood of success.
 *
 * Key concepts:
 * - Four layers: Context (60%), Prompting (25%), Model Power (10%), Manual (5%)
 * - Start at Layer 1, escalate only when exhausted
 * - Systematic approach saves 10x debugging time
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// DEBUGGING TYPES AND INTERFACES
// ============================================================================

/**
 * The four layers of the debugging hierarchy
 */
export type DebuggingLayer = "context" | "prompting" | "model_power" | "manual_override";

/**
 * Issue diagnosis result
 */
export interface IssueDiagnosis {
  /** Which layer likely has the problem */
  layer: DebuggingLayer;
  /** Confidence level (0-1) */
  confidence: number;
  /** Problem signature that indicated this layer */
  problemSignature: string;
  /** Checklist items for this layer */
  checklist: string[];
  /** Estimated fix time in minutes */
  estimatedTime: number;
}

/**
 * Layer configuration
 */
export interface LayerConfig {
  layer: DebuggingLayer;
  /** Probability this layer solves the issue */
  probability: number;
  /** Problem signatures that indicate this layer */
  problemSignatures: string[];
  /** Debugging checklist */
  checklist: string[];
  /** Average time to fix (minutes) */
  avgFixTime: number;
}

/**
 * Debugging attempt result
 */
export interface DebugAttempt {
  layer: DebuggingLayer;
  /** What was tried */
  action: string;
  /** Whether it fixed the issue */
  fixed: boolean;
  /** Time spent (minutes) */
  timeSpent: number;
  /** Notes */
  notes: string;
}

/**
 * Complete debugging session
 */
export interface DebugSession {
  /** Original problem description */
  problem: string;
  /** Initial diagnosis */
  diagnosis: IssueDiagnosis;
  /** All attempts made */
  attempts: DebugAttempt[];
  /** Final resolution */
  resolved: boolean;
  /** Total time spent */
  totalTime: number;
  /** Layer that fixed the issue */
  resolutionLayer: DebuggingLayer | null;
}

// ============================================================================
// LAYER CONFIGURATION
// ============================================================================

/**
 * The four debugging layers with their configurations
 */
export const DEBUGGING_LAYERS: LayerConfig[] = [
  {
    layer: "context",
    probability: 0.6,
    problemSignatures: [
      "AI produces plausible but incorrect code",
      "Output doesn't fit the codebase patterns",
      "References to non-existent files or functions",
      "Wrong library versions or APIs used",
      "Missing domain knowledge",
    ],
    checklist: [
      "Include relevant code files showing existing patterns",
      "Provide system architecture and design decisions",
      "Include error messages and stack traces",
      "Show database schemas and API contracts",
      "Provide examples of expected behavior",
    ],
    avgFixTime: 5,
  },
  {
    layer: "prompting",
    probability: 0.25,
    problemSignatures: [
      "AI has context but output doesn't meet requirements",
      "Misunderstanding of success criteria",
      "Missing edge case handling",
      "Format doesn't match expectations",
      "Task interpretation differs from intent",
    ],
    checklist: [
      "Add specific examples of desired output",
      "Include edge cases and constraints",
      "Provide clear success criteria",
      "Break complex tasks into steps",
      "Use structured formats (JSON, markdown)",
    ],
    avgFixTime: 10,
  },
  {
    layer: "model_power",
    probability: 0.1,
    problemSignatures: [
      "Failure on complex architectural decisions",
      "Multi-step reasoning breaks down",
      "Same mistakes despite good context and prompts",
      "Nuanced trade-offs not understood",
      "Complex domain logic incorrect",
    ],
    checklist: [
      "Verify context and prompting are exhausted",
      "Check if task requires advanced reasoning",
      "Consider model escalation (Sonnet to Opus)",
      "Break task into smaller sub-tasks",
      "Use chain-of-thought prompting",
    ],
    avgFixTime: 20,
  },
  {
    layer: "manual_override",
    probability: 0.05,
    problemSignatures: [
      "Deep domain expertise required",
      "Human intuition or creativity needed",
      "Ambiguous or contradictory requirements",
      "Legacy systems with tribal knowledge",
      "Subjective aesthetic decisions",
    ],
    checklist: [
      "Recognize when AI assistance has limits",
      "Document the decision and reasoning",
      "Create clear specifications for AI to implement",
      "Use hybrid approach: human decides, AI implements",
      "Consider if requirements need clarification",
    ],
    avgFixTime: 30,
  },
];

// ============================================================================
// DEBUGGING FUNCTIONS
// ============================================================================

/**
 * Calculate expected debugging time using the hierarchy
 */
export function calculateExpectedTime(): number {
  return DEBUGGING_LAYERS.reduce(
    (total, layer) => total + layer.probability * layer.avgFixTime,
    0
  );
}

/**
 * Calculate time wasted by not following the hierarchy
 * (e.g., starting at Layer 3 when Layer 1 would work)
 */
export function calculateWastedTime(
  actualLayerUsed: DebuggingLayer,
  couldHaveUsed: DebuggingLayer
): number {
  const layers = DEBUGGING_LAYERS.map((l) => l.layer);
  const actualIndex = layers.indexOf(actualLayerUsed);
  const couldHaveIndex = layers.indexOf(couldHaveUsed);

  if (actualIndex <= couldHaveIndex) return 0;

  // Calculate time spent on unnecessary layers
  let wastedTime = 0;
  for (let i = couldHaveIndex; i < actualIndex; i++) {
    const layerAtIndex = DEBUGGING_LAYERS[i];
    if (layerAtIndex) {
      wastedTime += layerAtIndex.avgFixTime;
    }
  }
  return wastedTime;
}

/**
 * Diagnose which layer likely contains the issue
 */
export function diagnoseIssue(problemDescription: string): IssueDiagnosis {
  const descLower = problemDescription.toLowerCase();

  // Score each layer based on problem signature matches
  const scores: Array<{ layer: LayerConfig; score: number; matched: string[] }> = [];

  for (const layer of DEBUGGING_LAYERS) {
    const matched = layer.problemSignatures.filter((sig) =>
      descLower.includes(sig.toLowerCase()) ||
      sig.toLowerCase().split(" ").some((word) => descLower.includes(word))
    );

    scores.push({
      layer,
      score: matched.length / layer.problemSignatures.length,
      matched,
    });
  }

  // Sort by score, then by probability (prefer earlier layers on tie)
  scores.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.1) {
      return b.layer.probability - a.layer.probability;
    }
    return b.score - a.score;
  });

  const best = scores[0];

  // Fallback if no scores (shouldn't happen with DEBUGGING_LAYERS populated)
  if (!best) {
    return {
      layer: "context",
      confidence: 0.3,
      problemSignature: "Unable to diagnose",
      checklist: DEBUGGING_LAYERS[0]?.checklist ?? [],
      estimatedTime: 5,
    };
  }

  return {
    layer: best.layer.layer,
    confidence: Math.max(0.3, best.score), // Minimum 30% confidence
    problemSignature: best.matched[0] || "No specific signature matched",
    checklist: best.layer.checklist,
    estimatedTime: best.layer.avgFixTime,
  };
}

/**
 * Get the next layer to try if current layer fails
 */
export function getNextLayer(currentLayer: DebuggingLayer): DebuggingLayer | null {
  const layers = DEBUGGING_LAYERS.map((l) => l.layer);
  const currentIndex = layers.indexOf(currentLayer);

  if (currentIndex === -1 || currentIndex >= layers.length - 1) {
    return null;
  }

  return layers[currentIndex + 1] ?? null;
}

/**
 * Get layer configuration
 */
export function getLayerConfig(layer: DebuggingLayer): LayerConfig {
  const config = DEBUGGING_LAYERS.find((l) => l.layer === layer);
  if (!config) {
    throw new Error(`Unknown layer: ${layer}`);
  }
  return config;
}

// ============================================================================
// DEBUGGING SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new debugging session
 */
export function createDebugSession(problem: string): DebugSession {
  const diagnosis = diagnoseIssue(problem);

  return {
    problem,
    diagnosis,
    attempts: [],
    resolved: false,
    totalTime: 0,
    resolutionLayer: null,
  };
}

/**
 * Record a debugging attempt
 */
export function recordAttempt(
  session: DebugSession,
  layer: DebuggingLayer,
  action: string,
  fixed: boolean,
  timeSpent: number,
  notes: string = ""
): DebugSession {
  const attempt: DebugAttempt = {
    layer,
    action,
    fixed,
    timeSpent,
    notes,
  };

  return {
    ...session,
    attempts: [...session.attempts, attempt],
    resolved: fixed,
    totalTime: session.totalTime + timeSpent,
    resolutionLayer: fixed ? layer : session.resolutionLayer,
  };
}

/**
 * Analyze debugging session efficiency
 */
export function analyzeSession(session: DebugSession): {
  efficiency: string;
  timeSaved: number;
  recommendation: string;
} {
  const expectedTime = calculateExpectedTime();

  if (!session.resolved) {
    return {
      efficiency: "Unresolved - consider escalating to human review",
      timeSaved: 0,
      recommendation: "Document the issue for future reference",
    };
  }

  const timeSaved = (session.attempts.length * 15) - session.totalTime;
  const efficiency =
    session.totalTime <= expectedTime
      ? "Excellent - followed hierarchy effectively"
      : session.totalTime <= expectedTime * 1.5
        ? "Good - minor inefficiencies"
        : "Needs improvement - consider starting at Layer 1 next time";

  // Check if they started at the right layer
  let recommendation = "";
  if (session.resolutionLayer === "context" && session.attempts[0]?.layer !== "context") {
    recommendation = "This was a context issue - start at Layer 1 next time";
  } else if (session.resolutionLayer === "prompting" && session.attempts.length > 2) {
    recommendation = "Consider improving initial prompts to reduce iterations";
  } else {
    recommendation = "Good debugging process - document for future reference";
  }

  return {
    efficiency,
    timeSaved: Math.max(0, timeSaved),
    recommendation,
  };
}

// ============================================================================
// SDK INTEGRATION
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
 * Use Claude to diagnose an issue
 */
export async function diagnoseWithClaude(
  problemDescription: string,
  codeContext: string
): Promise<IssueDiagnosis> {
  const diagPrompt = `You are diagnosing why AI-generated code doesn't meet expectations.

PROBLEM:
${problemDescription}

CODE CONTEXT:
${codeContext}

The four debugging layers are:
1. CONTEXT (60% of issues): AI lacks information (missing files, architecture, examples)
2. PROMPTING (25% of issues): Instructions unclear (missing examples, success criteria)
3. MODEL_POWER (10% of issues): Task too complex for current model
4. MANUAL_OVERRIDE (5% of issues): Requires human expertise

Which layer is most likely the issue? Respond in JSON:
{
  "layer": "context|prompting|model_power|manual_override",
  "confidence": 0.0-1.0,
  "problemSignature": "brief description of the problem type",
  "checklist": ["item1", "item2", "item3"],
  "estimatedTime": number (minutes)
}`;

  const response = query({
    prompt: diagPrompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for analysis
    },
  });

  let responseText = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      responseText += extractTextContent(message);
    }
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback to local diagnosis
    return diagnoseIssue(problemDescription);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    layer: parsed.layer as DebuggingLayer,
    confidence: parsed.confidence,
    problemSignature: parsed.problemSignature,
    checklist: parsed.checklist,
    estimatedTime: parsed.estimatedTime,
  };
}

/**
 * Generate fix suggestions for a layer
 */
export async function suggestFixes(
  layer: DebuggingLayer,
  problemDescription: string
): Promise<string[]> {
  const layerConfig = getLayerConfig(layer);

  const fixPrompt = `Given this problem:
${problemDescription}

And that it's a ${layer.toUpperCase()} issue, suggest 3 specific fixes based on this checklist:
${layerConfig.checklist.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Respond with 3 actionable suggestions, one per line.`;

  const response = query({
    prompt: fixPrompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for suggestions
    },
  });

  let responseText = "";
  for await (const message of response) {
    if (message.type === "assistant") {
      responseText += extractTextContent(message);
    }
  }

  return responseText
    .split("\n")
    .filter((line: string) => line.trim().length > 0)
    .slice(0, 3);
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate the context debugging framework
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Systematic Context Debugging Framework ===\n");

  // Example 1: Expected debugging time
  console.log("1. Expected Debugging Time (Following Hierarchy)");
  const expectedTime = calculateExpectedTime();
  console.log(`   Expected time: ${expectedTime.toFixed(1)} minutes`);
  console.log("   Layer breakdown:");
  for (const layer of DEBUGGING_LAYERS) {
    console.log(`   - ${layer.layer}: ${layer.probability * 100}% × ${layer.avgFixTime}min = ${(layer.probability * layer.avgFixTime).toFixed(1)}min`);
  }

  // Example 2: Diagnose different problems
  console.log("\n2. Issue Diagnosis Examples");

  const problems = [
    "AI generates generic code that doesn't match our project patterns",
    "Output format is wrong despite having the context",
    "Complex architectural decision keeps failing",
    "Need human judgment for UX design",
  ];

  for (const problem of problems) {
    const diagnosis = diagnoseIssue(problem);
    console.log(`   Problem: "${problem.substring(0, 50)}..."`);
    console.log(`   → Layer: ${diagnosis.layer} (${(diagnosis.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`   → Est. time: ${diagnosis.estimatedTime} minutes\n`);
  }

  // Example 3: Time wasted calculation
  console.log("3. Time Wasted by Skipping Layers");
  console.log("   Scenario: Context issue, but started at Model Power");
  const wasted = calculateWastedTime("model_power", "context");
  console.log(`   Time wasted: ${wasted} minutes`);
  console.log("   Lesson: Always start at Layer 1 (Context)\n");

  // Example 4: Debugging session simulation
  console.log("4. Debugging Session Simulation");
  let session = createDebugSession("AI generates wrong API endpoints");
  console.log(`   Problem: ${session.problem}`);
  console.log(`   Initial diagnosis: ${session.diagnosis.layer}`);

  // Simulate attempts
  session = recordAttempt(session, "context", "Added existing API routes as examples", true, 5, "Fixed by showing patterns");
  console.log(`   Attempt 1: Added context → ${session.resolved ? "FIXED" : "Not fixed"}`);

  const analysis = analyzeSession(session);
  console.log(`   Efficiency: ${analysis.efficiency}`);
  console.log(`   Recommendation: ${analysis.recommendation}`);

  // Example 5: Checklist for each layer
  console.log("\n5. Debugging Checklists");
  for (const layer of DEBUGGING_LAYERS) {
    console.log(`   ${layer.layer.toUpperCase()} (${layer.probability * 100}% of issues):`);
    for (const item of layer.checklist.slice(0, 2)) {
      console.log(`   - ${item}`);
    }
    console.log("");
  }

  // Example 6: Live diagnosis (requires API key)
  console.log("6. Live Issue Diagnosis");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const diagnosis = await diagnoseWithClaude(
        "AI generates code that uses deprecated React patterns",
        "Using React 18 with functional components"
      );
      console.log(`   Diagnosis: ${diagnosis.layer}`);
      console.log(`   Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);
      console.log(`   Signature: ${diagnosis.problemSignature}`);
    } catch (error) {
      console.log("   (API call failed - check API key)");
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
