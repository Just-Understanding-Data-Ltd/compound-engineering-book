/**
 * Shared Tokenizer Utility
 *
 * Provides accurate token counting using tiktoken instead of character-based
 * estimates. Uses cl100k_base encoding which provides a reasonable approximation
 * for Claude models.
 *
 * Why tiktoken over character estimates:
 * - Character estimates (e.g., chars * 0.25) are inaccurate
 * - Actual tokenization depends on the specific text content
 * - Code, punctuation, and whitespace tokenize differently than prose
 * - Accurate counts prevent context window overflow
 */

import { getEncoding, type Tiktoken } from "js-tiktoken";

// ============================================================================
// TOKENIZER SINGLETON
// ============================================================================

/**
 * Lazy-loaded tokenizer instance
 * Uses cl100k_base encoding (GPT-4/Claude-compatible approximation)
 */
let encoderInstance: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (!encoderInstance) {
    encoderInstance = getEncoding("cl100k_base");
  }
  return encoderInstance;
}

// ============================================================================
// TOKEN COUNTING FUNCTIONS
// ============================================================================

/**
 * Count tokens in a string using tiktoken
 *
 * @param text - The text to tokenize
 * @returns The exact token count
 *
 * @example
 * ```typescript
 * const count = countTokens("Hello, world!");
 * console.log(count); // 4 (actual token count, not estimate)
 * ```
 */
export function countTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  const encoder = getEncoder();
  return encoder.encode(text).length;
}

/**
 * Count tokens for multiple strings
 *
 * @param texts - Array of strings to tokenize
 * @returns Total token count across all strings
 */
export function countTokensMultiple(texts: string[]): number {
  return texts.reduce((total, text) => total + countTokens(text), 0);
}

/**
 * Estimate tokens (falls back to character-based estimate for speed)
 * Use this for quick estimates where precision isn't critical
 *
 * @param text - The text to estimate
 * @returns Estimated token count (chars / 4)
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  // ~4 characters per token is a reasonable fallback
  return Math.ceil(text.length / 4);
}

/**
 * Check if text fits within a token budget
 *
 * @param text - The text to check
 * @param maxTokens - Maximum allowed tokens
 * @returns Whether the text fits within the budget
 */
export function fitsInBudget(text: string, maxTokens: number): boolean {
  return countTokens(text) <= maxTokens;
}

/**
 * Truncate text to fit within a token budget
 *
 * @param text - The text to potentially truncate
 * @param maxTokens - Maximum allowed tokens
 * @returns Truncated text that fits within the budget
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const encoder = getEncoder();
  const tokens = encoder.encode(text);

  if (tokens.length <= maxTokens) {
    return text;
  }

  // Truncate tokens and decode back to text
  const truncatedTokens = tokens.slice(0, maxTokens);
  return encoder.decode(truncatedTokens);
}

// ============================================================================
// CONTEXT BUDGET TRACKING
// ============================================================================

/**
 * Context budget status
 */
export interface ContextBudget {
  /** Maximum tokens allowed */
  maxTokens: number;
  /** Tokens used so far */
  usedTokens: number;
  /** Remaining tokens */
  remainingTokens: number;
  /** Usage percentage */
  usagePercent: number;
  /** Whether we're in the optimal range (under 75K) */
  isOptimal: boolean;
}

/**
 * Calculate context budget status
 *
 * @param usedTokens - Tokens already used
 * @param maxTokens - Maximum context window (default: 200K)
 * @param optimalMax - Optimal max for accuracy (default: 75K)
 * @returns Budget status object
 */
export function calculateContextBudget(
  usedTokens: number,
  maxTokens: number = 200000,
  optimalMax: number = 75000
): ContextBudget {
  const remainingTokens = Math.max(0, maxTokens - usedTokens);
  const usagePercent = (usedTokens / maxTokens) * 100;

  return {
    maxTokens,
    usedTokens,
    remainingTokens,
    usagePercent,
    isOptimal: usedTokens <= optimalMax,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Token counting thresholds (for compatibility with existing code)
 */
export const TOKEN_THRESHOLDS = {
  /** Maximum recommended context for accuracy */
  optimalMax: 75000,
  /** Context window limit */
  absoluteMax: 200000,
  /** Average characters per token (for estimates only) */
  charsPerToken: 4,
};
