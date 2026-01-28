/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * This file demonstrates entropy measurement for AI-assisted code generation.
 * By measuring output variance across multiple generations, you can quantify
 * context effectiveness and predict model behavior.
 *
 * Key concepts:
 * - Entropy measures uncertainty in model outputs
 * - High entropy = many possible outputs = unpredictable behavior
 * - Low entropy = few possible outputs = predictable, constrained generation
 * - Mutual information captures how much context determines output
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// ENTROPY TYPES AND INTERFACES
// ============================================================================

/**
 * Represents a single code generation attempt
 */
export interface GenerationResult {
  /** The generated code */
  code: string;
  /** Normalized hash for comparison */
  hash: string;
  /** Token count */
  tokens: number;
}

/**
 * Entropy measurement results
 */
export interface EntropyMeasurement {
  /** Number of unique outputs */
  uniqueOutputs: number;
  /** Total number of generations */
  totalGenerations: number;
  /** Estimated entropy in bits */
  entropyBits: number;
  /** Mutual information assessment */
  mutualInformation: "high" | "medium" | "low";
  /** Context effectiveness rating */
  contextEffectiveness: string;
}

/**
 * Information content for different constraint types
 */
export interface ConstraintInfo {
  /** Type of constraint */
  type: "type_signature" | "test_case" | "comment" | "example";
  /** Information content in bits */
  bitsProvided: number;
  /** Percentage of implementations eliminated */
  eliminationRate: number;
}

// ============================================================================
// INFORMATION THEORY CONSTANTS
// ============================================================================

/**
 * Empirical information content by constraint type (bits per constraint)
 * Based on observation that types provide 11x more information than comments
 */
export const CONSTRAINT_INFO_CONTENT: Record<string, ConstraintInfo> = {
  type_signature: {
    type: "type_signature",
    bitsProvided: 3.3,
    eliminationRate: 0.9, // Eliminates 90% of implementations
  },
  test_case: {
    type: "test_case",
    bitsProvided: 4.3,
    eliminationRate: 0.95, // Eliminates 95% of type-safe implementations
  },
  comment: {
    type: "comment",
    bitsProvided: 0.15,
    eliminationRate: 0.1, // Eliminates only 10% of implementations
  },
  example: {
    type: "example",
    bitsProvided: 5.0,
    eliminationRate: 0.97, // Working examples are highest information
  },
};

/**
 * Target metrics for optimal context engineering
 */
export const TARGET_METRICS = {
  /** Ideal context utilization (60-80% of capacity) */
  utilizationRange: { min: 0.6, max: 0.8 },
  /** Information density target (bits per token) */
  informationDensity: 3.5,
  /** Maximum acceptable unique outputs */
  maxUniqueOutputs: 2,
  /** Claude context window in tokens */
  maxContextTokens: 200000,
};

// ============================================================================
// ENTROPY MEASUREMENT FUNCTIONS
// ============================================================================

/**
 * Generate a simple hash for code comparison
 * Normalizes whitespace and variable names for structural comparison
 */
export function hashCode(code: string): string {
  // Normalize: remove extra whitespace, lowercase, remove comments
  const normalized = code
    .replace(/\/\/.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toLowerCase();

  // Simple hash for comparison
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Calculate entropy from unique output count
 * H = log2(unique_outputs)
 */
export function calculateEntropy(uniqueOutputs: number): number {
  if (uniqueOutputs <= 1) return 0;
  return Math.log2(uniqueOutputs);
}

/**
 * Assess mutual information based on output variance
 * High MI = context strongly determines output
 */
export function assessMutualInformation(
  uniqueOutputs: number,
  totalGenerations: number
): "high" | "medium" | "low" {
  const varianceRatio = uniqueOutputs / totalGenerations;

  if (varianceRatio <= 0.2) return "high"; // 1-2 unique outputs in 10 generations
  if (varianceRatio <= 0.5) return "medium"; // 3-5 unique outputs
  return "low"; // 6+ unique outputs
}

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
 * Generate code multiple times and measure entropy
 */
export async function measureEntropy(
  prompt: string,
  context: string,
  iterations: number = 10
): Promise<EntropyMeasurement> {
  const results: GenerationResult[] = [];
  const uniqueHashes = new Set<string>();

  const fullPrompt = context
    ? `${context}\n\n${prompt}`
    : prompt;

  for (let i = 0; i < iterations; i++) {
    const response = query({
      prompt: fullPrompt,
      options: {
        cwd: process.cwd(),
        allowedTools: [], // No tools needed for generation
      },
    });

    let code = "";
    let tokenCount = 0;

    for await (const message of response) {
      if (message.type === "assistant") {
        code += extractTextContent(message);
      }
      // Estimate tokens from text length (Agent SDK doesn't expose usage directly)
      tokenCount = Math.ceil(code.length * 0.25);
    }

    const hash = hashCode(code);

    results.push({
      code,
      hash,
      tokens: tokenCount,
    });

    uniqueHashes.add(hash);
  }

  const uniqueOutputs = uniqueHashes.size;
  const entropyBits = calculateEntropy(uniqueOutputs);
  const mutualInformation = assessMutualInformation(uniqueOutputs, iterations);

  let contextEffectiveness: string;
  if (mutualInformation === "high") {
    contextEffectiveness = "Excellent - context strongly constrains output";
  } else if (mutualInformation === "medium") {
    contextEffectiveness = "Fair - add more constraints (types, tests, examples)";
  } else {
    contextEffectiveness = "Poor - context needs significant improvement";
  }

  return {
    uniqueOutputs,
    totalGenerations: iterations,
    entropyBits,
    mutualInformation,
    contextEffectiveness,
  };
}

// ============================================================================
// CONSTRAINT ANALYSIS
// ============================================================================

/**
 * Calculate total information content from constraints
 */
export function calculateTotalInformation(
  constraints: Array<{ type: keyof typeof CONSTRAINT_INFO_CONTENT; count: number }>
): { totalBits: number; estimatedElimination: number } {
  let totalBits = 0;
  let remainingImplementations = 1.0;

  for (const constraint of constraints) {
    const info = CONSTRAINT_INFO_CONTENT[constraint.type];
    if (info) {
      totalBits += info.bitsProvided * constraint.count;
      // Elimination compounds multiplicatively
      remainingImplementations *= Math.pow(1 - info.eliminationRate, constraint.count);
    }
  }

  return {
    totalBits,
    estimatedElimination: 1 - remainingImplementations,
  };
}

/**
 * Analyze context quality based on constraint composition
 */
export function analyzeContextQuality(
  typeSignatures: number,
  testCases: number,
  comments: number,
  examples: number
): {
  totalBits: number;
  recommendedAdditions: string[];
  qualityScore: number;
} {
  const constraints = [
    { type: "type_signature" as const, count: typeSignatures },
    { type: "test_case" as const, count: testCases },
    { type: "comment" as const, count: comments },
    { type: "example" as const, count: examples },
  ];

  const { totalBits, estimatedElimination } = calculateTotalInformation(constraints);

  const recommendations: string[] = [];

  // Recommend based on what's missing
  if (typeSignatures === 0) {
    recommendations.push("Add type signatures (3.3 bits each, eliminates 90% of invalid implementations)");
  }
  if (testCases === 0) {
    recommendations.push("Add test cases (4.3 bits each, eliminates 95% of incorrect implementations)");
  }
  if (examples === 0 && totalBits < 10) {
    recommendations.push("Add working examples (5.0 bits each, highest information content)");
  }
  if (comments > typeSignatures + testCases) {
    recommendations.push("Replace comments with types or tests (comments provide only 0.15 bits each)");
  }

  // Quality score: 0-100 based on information content and elimination rate
  const qualityScore = Math.min(100, Math.round(estimatedElimination * 100));

  return {
    totalBits,
    recommendedAdditions: recommendations,
    qualityScore,
  };
}

// ============================================================================
// CHANNEL CAPACITY ANALYSIS
// ============================================================================

/**
 * Calculate context utilization and channel efficiency
 */
export function analyzeChannelUtilization(
  contextTokens: number,
  informationBits: number
): {
  utilization: number;
  bitsPerToken: number;
  recommendation: string;
} {
  const utilization = contextTokens / TARGET_METRICS.maxContextTokens;
  const bitsPerToken = contextTokens > 0 ? informationBits / contextTokens : 0;

  let recommendation: string;
  if (utilization > TARGET_METRICS.utilizationRange.max) {
    recommendation = "Context too large - consider progressive disclosure or summarization";
  } else if (utilization < TARGET_METRICS.utilizationRange.min) {
    recommendation = "Context has room - add more high-information content (types, tests)";
  } else if (bitsPerToken < TARGET_METRICS.informationDensity) {
    recommendation = "Low information density - replace verbose content with types and examples";
  } else {
    recommendation = "Context is well-optimized";
  }

  return {
    utilization,
    bitsPerToken,
    recommendation,
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate entropy measurement concepts
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Entropy Measurement for Context Engineering ===\n");

  // Example 1: Analyze context quality
  console.log("1. Context Quality Analysis");
  const quality = analyzeContextQuality(
    3, // type signatures
    2, // test cases
    5, // comments
    1  // examples
  );
  console.log(`   Total information: ${quality.totalBits.toFixed(1)} bits`);
  console.log(`   Quality score: ${quality.qualityScore}%`);
  console.log("   Recommendations:");
  for (const rec of quality.recommendedAdditions) {
    console.log(`   - ${rec}`);
  }

  // Example 2: Compare constraint information content
  console.log("\n2. Information Content by Constraint Type");
  console.log("   Types provide 11x more information than comments:");
  for (const [name, info] of Object.entries(CONSTRAINT_INFO_CONTENT)) {
    console.log(`   - ${name}: ${info.bitsProvided} bits (${(info.eliminationRate * 100).toFixed(0)}% elimination)`);
  }

  // Example 3: Channel utilization analysis
  console.log("\n3. Channel Utilization Analysis");
  const channel = analyzeChannelUtilization(50000, 175); // 50K tokens, 175 bits
  console.log(`   Utilization: ${(channel.utilization * 100).toFixed(1)}%`);
  console.log(`   Information density: ${channel.bitsPerToken.toFixed(3)} bits/token`);
  console.log(`   Recommendation: ${channel.recommendation}`);

  // Example 4: Live entropy measurement (requires API key)
  console.log("\n4. Live Entropy Measurement (3 iterations for demo)");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Low-context prompt (high entropy expected)
      console.log("   Testing vague prompt (expected: high entropy)...");
      const lowContext = await measureEntropy(
        "Write a function to process data",
        "", // No context
        3
      );
      console.log(`   - Unique outputs: ${lowContext.uniqueOutputs}/3`);
      console.log(`   - Entropy: ${lowContext.entropyBits.toFixed(2)} bits`);
      console.log(`   - Mutual information: ${lowContext.mutualInformation}`);

      // High-context prompt (low entropy expected)
      console.log("\n   Testing constrained prompt (expected: low entropy)...");
      const highContext = await measureEntropy(
        "Write a function to process data",
        `Type signature:
function processData(data: Array<{ id: number; value: string }>): { processed: number; errors: string[] }

Test case:
const result = processData([{ id: 1, value: "test" }]);
expect(result.processed).toBe(1);
expect(result.errors).toEqual([]);`,
        3
      );
      console.log(`   - Unique outputs: ${highContext.uniqueOutputs}/3`);
      console.log(`   - Entropy: ${highContext.entropyBits.toFixed(2)} bits`);
      console.log(`   - Mutual information: ${highContext.mutualInformation}`);

      console.log("\n   Entropy reduction: " +
        `${((lowContext.entropyBits - highContext.entropyBits) / lowContext.entropyBits * 100).toFixed(0)}%`);
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
