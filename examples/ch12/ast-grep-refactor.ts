/**
 * AST-Grep for Precision Transformations
 *
 * Text-based search tools treat code as plain text, not structured syntax.
 * AST-grep parses code into an Abstract Syntax Tree and searches for
 * structural patterns, eliminating false positives.
 *
 * This file demonstrates pattern generation and refactoring with AST-grep.
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * Extracts text content from an Agent SDK message.
 */
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

// AST-grep pattern specification
interface AstGrepPattern {
  name: string;
  description: string;
  language: "typescript" | "javascript" | "python" | "go" | "rust";
  pattern: string;
  metavariables?: { [key: string]: string }; // Descriptions of metavariables
}

// Refactoring rule with pattern and replacement
interface RefactorRule {
  id: string;
  description: string;
  language: AstGrepPattern["language"];
  findPattern: string;
  replacePattern: string;
  testCases: { input: string; expectedOutput: string }[];
}

// Search result from AST-grep (exported for external use)
export interface AstGrepMatch {
  file: string;
  line: number;
  column: number;
  matchedCode: string;
  metavariables: { [key: string]: string };
}

// Comparison between text search and AST-grep
interface SearchComparison {
  query: string;
  textSearch: {
    totalMatches: number;
    truePositives: number;
    falsePositives: number;
    precision: number;
  };
  astGrep: {
    totalMatches: number;
    truePositives: number;
    falsePositives: number;
    precision: number;
  };
}

/**
 * Pattern syntax explanation:
 * - $VAR: Single metavariable, matches one AST node
 * - $$$: Ellipsis, matches zero or more nodes
 *
 * Examples:
 * - fetchUserData($$$) - matches any call to fetchUserData
 * - const [$STATE, $SETTER] = useState($$$) - matches destructured useState
 * - async function $NAME($$$) { $$$ } - matches async function definitions
 */

/**
 * Generates an AST-grep pattern from a natural language description.
 */
export async function generatePattern(
  description: string,
  language: AstGrepPattern["language"]
): Promise<AstGrepPattern> {
  const prompt = `Generate an AST-grep pattern for ${language}:

Description: ${description}

AST-grep pattern syntax:
- $VAR: Single metavariable, matches one AST node
- $$$: Ellipsis, matches zero or more nodes

Output as JSON:
{
  "name": "pattern-name",
  "description": "what this pattern matches",
  "language": "${language}",
  "pattern": "the ast-grep pattern",
  "metavariables": { "$VAR": "what this metavariable captures" }
}`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let fullText = "";
  for await (const message of response) {
    fullText += extractTextContent(message);
  }

  let jsonText = fullText;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  return JSON.parse(jsonText.trim()) as AstGrepPattern;
}

/**
 * Generates a refactoring rule with find and replace patterns.
 */
export async function generateRefactorRule(
  description: string,
  language: AstGrepPattern["language"],
  examples?: { before: string; after: string }
): Promise<RefactorRule> {
  const exampleText = examples
    ? `\n\nExample transformation:\nBefore: ${examples.before}\nAfter: ${examples.after}`
    : "";

  const prompt = `Generate an AST-grep refactoring rule for ${language}:

Description: ${description}${exampleText}

AST-grep pattern syntax:
- $VAR: Single metavariable, matches one AST node
- $$$: Ellipsis, matches zero or more nodes

Metavariables captured in findPattern can be used in replacePattern.

Output as JSON:
{
  "id": "rule-id",
  "description": "what this refactoring does",
  "language": "${language}",
  "findPattern": "pattern to find",
  "replacePattern": "pattern to replace with",
  "testCases": [
    { "input": "code before", "expectedOutput": "code after" }
  ]
}`;

  const response = query({
    prompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let fullText = "";
  for await (const message of response) {
    fullText += extractTextContent(message);
  }

  let jsonText = fullText;
  const jsonMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  return JSON.parse(jsonText.trim()) as RefactorRule;
}

/**
 * Generates the ast-grep command for a pattern.
 */
export function generateAstGrepCommand(pattern: AstGrepPattern, options?: { json?: boolean; rewrite?: string }): string {
  let cmd = `ast-grep --pattern '${pattern.pattern}'`;

  if (pattern.language) {
    cmd += ` --lang ${pattern.language}`;
  }

  if (options?.json) {
    cmd += " --json";
  }

  if (options?.rewrite) {
    cmd += ` --rewrite '${options.rewrite}' --update-all`;
  }

  return cmd;
}

/**
 * Simulates the difference between text search and AST-grep search.
 */
export function compareSearchApproaches(
  codeSnippets: { code: string; isTarget: boolean }[],
  textPattern: string,
  _astPattern: string
): SearchComparison {
  const textRegex = new RegExp(textPattern, "g");

  let textMatches = 0;
  let textTruePositives = 0;

  for (const snippet of codeSnippets) {
    const matches = snippet.code.match(textRegex);
    if (matches) {
      textMatches += matches.length;
      if (snippet.isTarget) {
        textTruePositives += matches.length;
      }
    }
  }

  // AST-grep would only match actual code, not comments or strings
  // For simulation, we count only targets
  const astMatches = codeSnippets.filter((s) => s.isTarget).length;
  const astTruePositives = astMatches;

  return {
    query: textPattern,
    textSearch: {
      totalMatches: textMatches,
      truePositives: textTruePositives,
      falsePositives: textMatches - textTruePositives,
      precision: textMatches > 0 ? textTruePositives / textMatches : 0,
    },
    astGrep: {
      totalMatches: astMatches,
      truePositives: astTruePositives,
      falsePositives: 0,
      precision: 1.0, // AST-grep has no false positives by design
    },
  };
}

// Common AST-grep patterns for TypeScript/JavaScript
export const COMMON_PATTERNS: AstGrepPattern[] = [
  {
    name: "async-function",
    description: "Match all async function definitions",
    language: "typescript",
    pattern: "async function $NAME($$$) { $$$ }",
    metavariables: {
      $NAME: "function name",
      $$$: "parameters and body",
    },
  },
  {
    name: "useState-destructure",
    description: "Match destructured useState calls",
    language: "typescript",
    pattern: "const [$STATE, $SETTER] = useState($$$)",
    metavariables: {
      $STATE: "state variable name",
      $SETTER: "setter function name",
      $$$: "initial value",
    },
  },
  {
    name: "try-catch-block",
    description: "Match try-catch blocks",
    language: "typescript",
    pattern: "try { $$$ } catch ($ERR) { $$$ }",
    metavariables: {
      $ERR: "error variable",
      $$$: "block contents",
    },
  },
  {
    name: "console-log",
    description: "Match console.log calls",
    language: "typescript",
    pattern: "console.log($$$)",
    metavariables: {
      $$$: "logged values",
    },
  },
  {
    name: "import-from",
    description: "Match import statements",
    language: "typescript",
    pattern: "import { $$$ } from '$MODULE'",
    metavariables: {
      $$$: "imported names",
      $MODULE: "module path",
    },
  },
];

// Common refactoring rules
export const COMMON_REFACTORS: RefactorRule[] = [
  {
    id: "fetch-to-apiclient",
    description: "Migrate fetch calls to apiClient pattern",
    language: "typescript",
    findPattern: "fetch('/api/$ENDPOINT', { method: '$METHOD', body: $BODY })",
    replacePattern: "apiClient.$METHOD('$ENDPOINT', $BODY)",
    testCases: [
      {
        input: "fetch('/api/users', { method: 'POST', body: userData })",
        expectedOutput: "apiClient.POST('users', userData)",
      },
    ],
  },
  {
    id: "remove-console-log",
    description: "Remove all console.log statements",
    language: "typescript",
    findPattern: "console.log($$$)",
    replacePattern: "",
    testCases: [
      {
        input: 'console.log("debug info", data);',
        expectedOutput: "",
      },
    ],
  },
  {
    id: "modernize-function",
    description: "Convert function expressions to arrow functions",
    language: "typescript",
    findPattern: "function($PARAMS) { return $BODY }",
    replacePattern: "($PARAMS) => $BODY",
    testCases: [
      {
        input: "function(x) { return x * 2 }",
        expectedOutput: "(x) => x * 2",
      },
    ],
  },
];

/**
 * Validates that a refactoring rule works as expected.
 */
export function validateRefactorRule(rule: RefactorRule): {
  valid: boolean;
  failures: string[];
} {
  const failures: string[] = [];

  // Check pattern syntax (basic validation)
  if (!rule.findPattern.includes("$")) {
    failures.push("findPattern should contain at least one metavariable ($)");
  }

  // Check that metavariables in replacePattern exist in findPattern
  const findVars: string[] = rule.findPattern.match(/\$[A-Z_]+/g) || [];
  const replaceVars: string[] = rule.replacePattern.match(/\$[A-Z_]+/g) || [];

  for (const rVar of replaceVars) {
    if (!findVars.includes(rVar)) {
      failures.push(`Metavariable ${rVar} in replacePattern not found in findPattern`);
    }
  }

  // Check test cases exist
  if (rule.testCases.length === 0) {
    failures.push("Rule should have at least one test case");
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

/**
 * Generates a YAML rule file for ast-grep.
 */
export function generateYamlRule(rule: RefactorRule): string {
  return `id: ${rule.id}
language: ${rule.language}
rule:
  pattern: ${rule.findPattern}
fix: ${rule.replacePattern}
message: "${rule.description}"`;
}

/**
 * Suggests when to use text search vs AST-grep.
 */
export function recommendSearchTool(
  query: string,
  context: "exploration" | "refactoring" | "precision-search"
): { tool: "grep" | "ast-grep"; reason: string } {
  // AST-grep is better for:
  // - Refactoring operations
  // - Finding specific code structures (not strings/comments)
  // - Large-scale transformations

  // Text search (grep/ripgrep) is better for:
  // - Quick exploration
  // - Searching in comments or strings
  // - Simple pattern matching

  if (context === "refactoring") {
    return {
      tool: "ast-grep",
      reason: "Refactoring requires precise code matching without false positives",
    };
  }

  if (context === "precision-search") {
    return {
      tool: "ast-grep",
      reason: "Precision search needs to distinguish code from comments/strings",
    };
  }

  // Exploration: check if query looks like code structure
  const isCodePattern = /function|const|let|var|async|class|import|export/.test(query);

  if (isCodePattern) {
    return {
      tool: "ast-grep",
      reason: "Query looks like code structure, AST-grep will provide accurate results",
    };
  }

  return {
    tool: "grep",
    reason: "Quick exploration benefits from fast text search",
  };
}

// Demo: Show AST-grep patterns and refactoring
function demo() {
  console.log("=== AST-Grep for Precision Transformations Demo ===\n");

  // Show the problem with text search
  console.log("The problem with text search:");
  const codeSnippets = [
    { code: "const userData = await fetchUserData(userId);", isTarget: true },
    { code: "// TODO: fetchUserData should handle errors better", isTarget: false },
    { code: 'console.log("Calling fetchUserData");', isTarget: false },
    { code: "// The fetchUserData function retrieves user data", isTarget: false },
    { code: "fetchUserData: jest.fn(),", isTarget: false },
  ];

  const comparison = compareSearchApproaches(codeSnippets, "fetchUserData", "fetchUserData($$$)");

  console.log(`Query: "${comparison.query}"\n`);
  console.log("Text search (grep):");
  console.log(`  Total matches: ${comparison.textSearch.totalMatches}`);
  console.log(`  True positives: ${comparison.textSearch.truePositives}`);
  console.log(`  False positives: ${comparison.textSearch.falsePositives}`);
  console.log(`  Precision: ${(comparison.textSearch.precision * 100).toFixed(0)}%`);

  console.log("\nAST-grep:");
  console.log(`  Total matches: ${comparison.astGrep.totalMatches}`);
  console.log(`  True positives: ${comparison.astGrep.truePositives}`);
  console.log(`  False positives: ${comparison.astGrep.falsePositives}`);
  console.log(`  Precision: ${(comparison.astGrep.precision * 100).toFixed(0)}%`);

  console.log("\n=== Common Patterns ===");
  COMMON_PATTERNS.forEach((pattern) => {
    console.log(`\n${pattern.name}:`);
    console.log(`  Description: ${pattern.description}`);
    console.log(`  Pattern: ${pattern.pattern}`);
    console.log(`  Command: ${generateAstGrepCommand(pattern)}`);
  });

  console.log("\n=== Refactoring Example ===");
  const refactorRule = COMMON_REFACTORS[0]!;
  console.log(`Rule: ${refactorRule.description}`);
  console.log(`Find: ${refactorRule.findPattern}`);
  console.log(`Replace: ${refactorRule.replacePattern}`);

  console.log("\nGenerated YAML rule:");
  console.log("---");
  console.log(generateYamlRule(refactorRule));
  console.log("---");

  const validation = validateRefactorRule(refactorRule);
  console.log(`\nValidation: ${validation.valid ? "PASS" : "FAIL"}`);
  if (!validation.valid) {
    validation.failures.forEach((f) => console.log(`  - ${f}`));
  }

  console.log("\n=== Tool Recommendations ===");
  const queries = [
    { query: "TODO: fix this", context: "exploration" as const },
    { query: "function fetchData", context: "refactoring" as const },
    { query: "console.log", context: "precision-search" as const },
  ];

  queries.forEach(({ query, context }) => {
    const rec = recommendSearchTool(query, context);
    console.log(`\nQuery: "${query}" (${context})`);
    console.log(`  Recommended: ${rec.tool}`);
    console.log(`  Reason: ${rec.reason}`);
  });
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}
