/**
 * Chapter 6: The Verification Ladder
 *
 * This file demonstrates using the Agent SDK to analyze code
 * and determine appropriate verification levels based on the
 * 6-level verification ladder framework.
 *
 * Key concepts:
 * - Agent-assisted verification analysis
 * - Risk-based test recommendations
 * - Streaming response handling
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// VERIFICATION LADDER TYPES
// ============================================================================

/**
 * The six levels of the verification ladder
 */
export enum VerificationLevel {
  STATIC_TYPES = 1,
  RUNTIME_VALIDATION = 2,
  UNIT_TESTS = 3,
  INTEGRATION_TESTS = 4,
  PROPERTY_BASED_TESTS = 5,
  FORMAL_VERIFICATION = 6,
}

/**
 * Verification recommendation for a code module
 */
export interface VerificationRecommendation {
  moduleName: string;
  currentLevel: VerificationLevel;
  recommendedLevel: VerificationLevel;
  risks: string[];
  rationale: string;
  estimatedEffort: "low" | "medium" | "high";
}

/**
 * Analysis result from the verification agent
 */
export interface VerificationAnalysis {
  sessionId: string;
  modules: VerificationRecommendation[];
  overallRisk: "low" | "medium" | "high" | "critical";
  summary: string;
}

// ============================================================================
// VERIFICATION LEVEL UTILITIES
// ============================================================================

/**
 * Get description for a verification level
 */
export function getLevelDescription(level: VerificationLevel): string {
  const descriptions: Record<VerificationLevel, string> = {
    [VerificationLevel.STATIC_TYPES]:
      "Static types catch compile-time errors but miss runtime behavior",
    [VerificationLevel.RUNTIME_VALIDATION]:
      "Runtime validation catches malformed input at system boundaries",
    [VerificationLevel.UNIT_TESTS]:
      "Unit tests verify isolated function logic and edge cases",
    [VerificationLevel.INTEGRATION_TESTS]:
      "Integration tests verify component interactions end-to-end",
    [VerificationLevel.PROPERTY_BASED_TESTS]:
      "Property tests generate thousands of inputs to find edge cases",
    [VerificationLevel.FORMAL_VERIFICATION]:
      "Formal verification mathematically proves correctness",
  };
  return descriptions[level];
}

/**
 * Get tools commonly used at each verification level
 */
export function getLevelTools(level: VerificationLevel): string[] {
  const tools: Record<VerificationLevel, string[]> = {
    [VerificationLevel.STATIC_TYPES]: ["TypeScript", "mypy", "Flow"],
    [VerificationLevel.RUNTIME_VALIDATION]: ["Zod", "io-ts", "Joi", "Yup"],
    [VerificationLevel.UNIT_TESTS]: ["Jest", "Vitest", "pytest", "Mocha"],
    [VerificationLevel.INTEGRATION_TESTS]: [
      "Playwright",
      "Cypress",
      "Supertest",
    ],
    [VerificationLevel.PROPERTY_BASED_TESTS]: [
      "fast-check",
      "Hypothesis",
      "QuickCheck",
    ],
    [VerificationLevel.FORMAL_VERIFICATION]: ["TLA+", "Z3", "Coq", "Alloy"],
  };
  return tools[level];
}

// ============================================================================
// CODE ANALYSIS PATTERNS
// ============================================================================

/**
 * Patterns that indicate higher verification needs
 */
export const riskPatterns = {
  financial: [
    "payment",
    "transaction",
    "billing",
    "invoice",
    "money",
    "currency",
  ],
  security: [
    "auth",
    "password",
    "token",
    "permission",
    "encrypt",
    "credential",
  ],
  dataIntegrity: ["database", "persist", "save", "update", "delete", "migrate"],
  userFacing: ["api", "endpoint", "route", "handler", "controller", "webhook"],
  distributed: ["queue", "event", "parallel", "concurrent", "lock"],
};

/**
 * Analyze code patterns to suggest minimum verification level
 */
export function analyzeRiskLevel(code: string): VerificationLevel {
  const lowerCode = code.toLowerCase();
  let maxRisk = VerificationLevel.STATIC_TYPES;

  // Check for financial patterns - needs property-based testing
  if (riskPatterns.financial.some((p) => lowerCode.includes(p))) {
    maxRisk = Math.max(maxRisk, VerificationLevel.PROPERTY_BASED_TESTS);
  }

  // Check for security patterns - needs integration tests
  if (riskPatterns.security.some((p) => lowerCode.includes(p))) {
    maxRisk = Math.max(maxRisk, VerificationLevel.INTEGRATION_TESTS);
  }

  // Check for data integrity - needs integration tests
  // Only check if not already at property-based level
  if (
    maxRisk < VerificationLevel.PROPERTY_BASED_TESTS &&
    riskPatterns.dataIntegrity.some((p) => lowerCode.includes(p))
  ) {
    maxRisk = Math.max(maxRisk, VerificationLevel.INTEGRATION_TESTS);
  }

  // Check for user-facing - needs runtime validation
  if (riskPatterns.userFacing.some((p) => lowerCode.includes(p))) {
    maxRisk = Math.max(maxRisk, VerificationLevel.RUNTIME_VALIDATION);
  }

  // Check for distributed patterns - may need property-based testing
  if (riskPatterns.distributed.some((p) => lowerCode.includes(p))) {
    maxRisk = Math.max(maxRisk, VerificationLevel.PROPERTY_BASED_TESTS);
  }

  return maxRisk;
}

// ============================================================================
// AGENT-ASSISTED VERIFICATION ANALYSIS
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
 * Analyze a code module using the Agent SDK
 */
export async function analyzeCodeWithAgent(
  code: string,
  moduleName: string
): Promise<{ sessionId: string; analysis: string }> {
  const systemPrompt = `You are a verification expert who analyzes code against the 6-level verification ladder:

Level 1: Static Types (TypeScript, mypy)
Level 2: Runtime Validation (Zod, io-ts)
Level 3: Unit Tests (Jest, Vitest)
Level 4: Integration Tests (Playwright, Supertest)
Level 5: Property-Based Testing (fast-check, Hypothesis)
Level 6: Formal Verification (TLA+, Z3)

For each code module, identify:
1. Current verification level (based on existing tests/types)
2. Recommended verification level (based on risk)
3. Specific risks that require higher verification
4. Concrete recommendations for improvement

Be concise and actionable. Focus on the highest-impact improvements.`;

  const prompt = `Analyze this code module and recommend verification levels:

Module: ${moduleName}

\`\`\`typescript
${code}
\`\`\`

Provide:
1. Current verification level (1-6)
2. Recommended verification level (1-6)
3. Top 3 risks that justify the recommendation
4. Specific next steps to reach the recommended level`;

  const response = query({
    prompt: `${systemPrompt}\n\n${prompt}`,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for analysis
    },
  });

  let sessionId = "";
  let analysis = "";

  for await (const message of response) {
    if (message.type === "system" && "session_id" in message) {
      sessionId = message.session_id;
    }
    if (message.type === "assistant") {
      analysis += extractTextContent(message);
    }
  }

  return { sessionId, analysis };
}

/**
 * Analyze multiple modules and aggregate results
 */
export async function analyzeModules(
  modules: { name: string; code: string }[]
): Promise<VerificationAnalysis> {
  const recommendations: VerificationRecommendation[] = [];
  let sessionId = "";

  for (const module of modules) {
    const riskLevel = analyzeRiskLevel(module.code);

    // For demo purposes, use local analysis
    // In production, you would call analyzeCodeWithAgent here
    const analysisText = `Local analysis for ${module.name}`;

    recommendations.push({
      moduleName: module.name,
      currentLevel: VerificationLevel.STATIC_TYPES, // Default assumption
      recommendedLevel: riskLevel,
      risks: extractRisks(module.code),
      rationale: analysisText.slice(0, 500),
      estimatedEffort: riskLevel >= 5 ? "high" : riskLevel >= 3 ? "medium" : "low",
    });
  }

  // Calculate overall risk
  const maxLevel = Math.max(...recommendations.map((r) => r.recommendedLevel));
  const overallRisk =
    maxLevel >= 6
      ? "critical"
      : maxLevel >= 4
        ? "high"
        : maxLevel >= 2
          ? "medium"
          : "low";

  return {
    sessionId: sessionId || "local-analysis",
    modules: recommendations,
    overallRisk,
    summary:
      `Analyzed ${modules.length} modules. Overall risk: ${overallRisk}. ` +
      `${recommendations.filter((r) => r.recommendedLevel > r.currentLevel).length} modules need verification upgrades.`,
  };
}

/**
 * Extract risk factors from code
 */
function extractRisks(code: string): string[] {
  const risks: string[] = [];
  const lowerCode = code.toLowerCase();

  if (riskPatterns.financial.some((p) => lowerCode.includes(p))) {
    risks.push("Financial calculations require exhaustive testing");
  }
  if (riskPatterns.security.some((p) => lowerCode.includes(p))) {
    risks.push("Security-sensitive code needs integration verification");
  }
  if (riskPatterns.dataIntegrity.some((p) => lowerCode.includes(p))) {
    risks.push("Data persistence needs consistency verification");
  }
  if (riskPatterns.distributed.some((p) => lowerCode.includes(p))) {
    risks.push("Concurrent operations need race condition testing");
  }

  if (risks.length === 0) {
    risks.push("Standard verification with types and unit tests");
  }

  return risks;
}

// ============================================================================
// VERIFICATION COVERAGE REPORT
// ============================================================================

/**
 * Generate a coverage report for a codebase
 */
export function generateCoverageReport(analysis: VerificationAnalysis): string {
  const lines: string[] = [
    "# Verification Coverage Report",
    "",
    `**Session ID:** ${analysis.sessionId}`,
    `**Overall Risk:** ${analysis.overallRisk.toUpperCase()}`,
    "",
    "## Module Analysis",
    "",
  ];

  for (const module of analysis.modules) {
    lines.push(`### ${module.moduleName}`);
    lines.push("");
    lines.push(
      `- Current Level: ${module.currentLevel} (${getLevelDescription(module.currentLevel)})`
    );
    lines.push(
      `- Recommended Level: ${module.recommendedLevel} (${getLevelDescription(module.recommendedLevel)})`
    );
    lines.push(`- Effort: ${module.estimatedEffort}`);
    lines.push("");
    lines.push("**Risks:**");
    for (const risk of module.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push("");
    lines.push("**Recommended Tools:**");
    for (const tool of getLevelTools(module.recommendedLevel)) {
      lines.push(`- ${tool}`);
    }
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push(analysis.summary);

  return lines.join("\n");
}

// ============================================================================
// DEMO
// ============================================================================

if (import.meta.main) {
  console.log("Verification Analyzer Demo");
  console.log("==========================\n");

  // Example: Analyze a payment processing module
  const paymentCode = `
export async function processPayment(
  amount: number,
  currency: string,
  cardToken: string
): Promise<PaymentResult> {
  // Validate input
  if (amount <= 0) throw new Error("Invalid amount");

  // Process with payment provider
  const result = await stripe.charges.create({
    amount: Math.round(amount * 100),
    currency,
    source: cardToken,
  });

  // Persist transaction
  await db.transactions.insert({
    id: result.id,
    amount,
    currency,
    status: result.status,
    createdAt: new Date(),
  });

  return { success: true, transactionId: result.id };
}
`;

  // Quick analysis without agent (for demo)
  const riskLevel = analyzeRiskLevel(paymentCode);
  console.log(`Risk Level Analysis for Payment Module:`);
  console.log(
    `  Recommended Level: ${riskLevel} (${getLevelDescription(riskLevel)})`
  );
  console.log(`  Recommended Tools: ${getLevelTools(riskLevel).join(", ")}`);
  console.log(`  Risks: ${extractRisks(paymentCode).join("; ")}`);

  console.log("\n✓ Demo complete");
  console.log(
    "\nTo run with agent analysis, call analyzeCodeWithAgent() with ANTHROPIC_API_KEY set."
  );
}
