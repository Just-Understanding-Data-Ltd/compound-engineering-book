/**
 * Chapter 13: MCP Server for Queryable Project Context
 *
 * Demonstrates building custom MCP servers that expose architecture graphs,
 * pattern examples, test coverage, and git history as queryable resources.
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
// MCP Resource Types
// ============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export type ResourceType =
  | "architecture-graph"
  | "pattern-examples"
  | "recent-changes"
  | "test-coverage"
  | "performance-metrics"
  | "code-search";

// ============================================================================
// Architecture Graph Analyzer
// ============================================================================

export interface ModuleNode {
  name: string;
  path: string;
  type: "module" | "class" | "function" | "interface";
  exports: string[];
  dependencies: string[];
}

export interface ArchitectureGraph {
  nodes: ModuleNode[];
  edges: { from: string; to: string; type: "import" | "call" | "extends" }[];
}

export function analyzeArchitecture(
  files: { path: string; content: string }[],
  targetModule?: string
): ArchitectureGraph {
  const nodes: ModuleNode[] = [];
  const edges: ArchitectureGraph["edges"] = [];

  for (const file of files) {
    // Skip if targeting specific module and this isn't it
    if (targetModule && !file.path.includes(targetModule)) {
      continue;
    }

    const exports: string[] = [];
    const dependencies: string[] = [];

    // Extract exports (handles 'export function', 'export async function', etc.)
    const exportMatches = file.content.matchAll(
      /export\s+(?:async\s+)?(function|class|const|interface|type)\s+(\w+)/g
    );
    for (const match of exportMatches) {
      if (match[2]) exports.push(match[2]);
    }

    // Extract imports
    const importMatches = file.content.matchAll(
      /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
    );
    for (const match of importMatches) {
      const importPath = match[1];
      if (importPath) {
        dependencies.push(importPath);
        edges.push({
          from: file.path,
          to: importPath,
          type: "import",
        });
      }
    }

    // Detect class extensions
    const extendsMatches = file.content.matchAll(
      /class\s+(\w+)\s+extends\s+(\w+)/g
    );
    for (const match of extendsMatches) {
      const fromClass = match[1];
      const toClass = match[2];
      if (fromClass && toClass) {
        edges.push({
          from: fromClass,
          to: toClass,
          type: "extends",
        });
      }
    }

    nodes.push({
      name: file.path.split("/").pop()?.replace(".ts", "") || file.path,
      path: file.path,
      type: "module",
      exports,
      dependencies,
    });
  }

  return { nodes, edges };
}

// ============================================================================
// Pattern Examples Finder
// ============================================================================

export interface PatternExample {
  pattern: string;
  file: string;
  lineNumber: number;
  code: string;
  description: string;
}

export function findPatternExamples(
  files: { path: string; content: string }[],
  pattern: string
): PatternExample[] {
  const examples: PatternExample[] = [];

  const patternMatchers: Record<string, RegExp> = {
    "factory-functions": /(?:export\s+)?(?:async\s+)?function\s+create\w+\s*\([^)]*\)/g,
    "result-types":
      /type\s+\w*Result\w*\s*=\s*{?\s*success:\s*(?:true|false|boolean)/g,
    "error-handling": /try\s*\{/g, // Match try block start (single line)
    "async-await": /async\s+function\s+\w+|async\s+\([^)]*\)\s*=>/g,
    "hooks": /use[A-Z]\w+\s*\(/g,
    "middleware": /(?:app|router)\.(use|get|post|put|delete)\s*\(/g,
  };

  const matcher = patternMatchers[pattern];
  if (!matcher) {
    return [];
  }

  for (const file of files) {
    const lines = file.content.split("\n");
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      if (matcher.test(line)) {
        // Get surrounding context (3 lines before, 5 lines after)
        const start = Math.max(0, lineNumber - 4);
        const end = Math.min(lines.length, lineNumber + 5);
        const code = lines.slice(start, end).join("\n");

        examples.push({
          pattern,
          file: file.path,
          lineNumber,
          code,
          description: `${pattern} pattern found at ${file.path}:${lineNumber}`,
        });
      }
    }
  }

  return examples;
}

// ============================================================================
// Git History Analyzer
// ============================================================================

export interface GitCommit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  filesChanged: string[];
}

export interface GitHistoryReport {
  period: string;
  commits: GitCommit[];
  summary: {
    totalCommits: number;
    uniqueAuthors: number;
    filesChanged: number;
    topAuthors: { author: string; commits: number }[];
    mostChangedFiles: { file: string; changes: number }[];
  };
}

export function analyzeGitHistory(
  commits: GitCommit[],
  period: string
): GitHistoryReport {
  const authorCounts = new Map<string, number>();
  const fileCounts = new Map<string, number>();
  const uniqueFiles = new Set<string>();

  for (const commit of commits) {
    // Count by author
    const current = authorCounts.get(commit.author) || 0;
    authorCounts.set(commit.author, current + 1);

    // Count file changes
    for (const file of commit.filesChanged) {
      uniqueFiles.add(file);
      const fileCount = fileCounts.get(file) || 0;
      fileCounts.set(file, fileCount + 1);
    }
  }

  // Sort authors by commit count
  const topAuthors = Array.from(authorCounts.entries())
    .map(([author, count]) => ({ author, commits: count }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 5);

  // Sort files by change count
  const mostChangedFiles = Array.from(fileCounts.entries())
    .map(([file, count]) => ({ file, changes: count }))
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10);

  return {
    period,
    commits,
    summary: {
      totalCommits: commits.length,
      uniqueAuthors: authorCounts.size,
      filesChanged: uniqueFiles.size,
      topAuthors,
      mostChangedFiles,
    },
  };
}

// ============================================================================
// Test Coverage Analyzer
// ============================================================================

export interface CoverageReport {
  module: string;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  uncoveredLines: number[];
  suggestions: string[];
}

export function analyzeCoverage(
  coverageData: {
    file: string;
    statements: { total: number; covered: number };
    branches: { total: number; covered: number };
    functions: { total: number; covered: number };
    lines: { total: number; covered: number };
    uncoveredLines: number[];
  }[],
  targetModule?: string
): CoverageReport[] {
  const reports: CoverageReport[] = [];

  for (const data of coverageData) {
    if (targetModule && !data.file.includes(targetModule)) {
      continue;
    }

    const coverage = {
      statements: (data.statements.covered / data.statements.total) * 100,
      branches: (data.branches.covered / data.branches.total) * 100,
      functions: (data.functions.covered / data.functions.total) * 100,
      lines: (data.lines.covered / data.lines.total) * 100,
    };

    const suggestions: string[] = [];
    if (coverage.branches < 80) {
      suggestions.push(
        "Add tests for conditional branches and edge cases"
      );
    }
    if (coverage.functions < 80) {
      suggestions.push(
        "Some functions are not called in tests"
      );
    }
    if (data.uncoveredLines.length > 10) {
      suggestions.push(
        `Lines ${data.uncoveredLines.slice(0, 5).join(", ")}... need coverage`
      );
    }

    reports.push({
      module: data.file,
      coverage,
      uncoveredLines: data.uncoveredLines,
      suggestions,
    });
  }

  return reports;
}

// ============================================================================
// MCP Server Implementation (Simulated)
// ============================================================================

export class ProjectContextServer {
  private files: { path: string; content: string }[] = [];
  private commits: GitCommit[] = [];
  private coverageData: Parameters<typeof analyzeCoverage>[0] = [];

  constructor(
    files: { path: string; content: string }[],
    commits: GitCommit[] = [],
    coverageData: Parameters<typeof analyzeCoverage>[0] = []
  ) {
    this.files = files;
    this.commits = commits;
    this.coverageData = coverageData;
  }

  listResources(): MCPResource[] {
    return [
      {
        uri: "architecture-graph://project",
        name: "Project Architecture Graph",
        description: "Full project dependency graph",
        mimeType: "application/json",
      },
      {
        uri: "pattern-examples://factory-functions",
        name: "Factory Function Examples",
        description: "Real code examples of factory patterns",
        mimeType: "application/json",
      },
      {
        uri: "pattern-examples://error-handling",
        name: "Error Handling Examples",
        description: "Real code examples of error handling",
        mimeType: "application/json",
      },
      {
        uri: "recent-changes://last-week",
        name: "Recent Changes (Last Week)",
        description: "Git history for the past week",
        mimeType: "application/json",
      },
      {
        uri: "test-coverage://all",
        name: "Test Coverage Report",
        description: "Full test coverage report",
        mimeType: "application/json",
      },
    ];
  }

  readResource(uri: string): MCPResourceContent {
    const parts = uri.split("://");
    const type = parts[0];
    const target = parts[1] || "";

    switch (type) {
      case "architecture-graph": {
        const graph = analyzeArchitecture(
          this.files,
          target === "project" ? undefined : target
        );
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(graph, null, 2),
        };
      }

      case "pattern-examples": {
        const examples = findPatternExamples(this.files, target);
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(examples, null, 2),
        };
      }

      case "recent-changes": {
        const report = analyzeGitHistory(this.commits, target);
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(report, null, 2),
        };
      }

      case "test-coverage": {
        const coverage = analyzeCoverage(
          this.coverageData,
          target === "all" ? undefined : target
        );
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(coverage, null, 2),
        };
      }

      default:
        return {
          uri,
          mimeType: "text/plain",
          text: `Unknown resource type: ${type}`,
        };
    }
  }
}

// ============================================================================
// AI-Assisted Context Queries
// ============================================================================

export async function queryProjectContext(
  server: ProjectContextServer,
  userQuery: string
): Promise<string> {
  // List available resources
  const resources = server.listResources();
  const resourceList = resources
    .map((r) => `- ${r.uri}: ${r.description}`)
    .join("\n");

  // First, determine which resources to query
  const planPrompt = `Given this query about a project: "${userQuery}"

Available resources:
${resourceList}

Which resources would help answer this query? List the URIs, one per line.`;

  const planResponse = query({
    prompt: planPrompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let planText = "";
  for await (const message of planResponse) {
    planText += extractTextContent(message);
  }

  const selectedUris = planText
    .split("\n")
    .filter((line: string) => line.includes("://"))
    .map((line: string) => line.trim());

  // Fetch the selected resources
  const contextData: string[] = [];
  for (const uri of selectedUris.slice(0, 3)) {
    try {
      const resource = server.readResource(uri);
      contextData.push(`## ${uri}\n\`\`\`json\n${resource.text}\n\`\`\``);
    } catch {
      // Skip unavailable resources
    }
  }

  // Generate answer using context
  const answerPrompt = `Answer this query about the project: "${userQuery}"

Project Context:
${contextData.join("\n\n")}

Provide a clear, specific answer based on the actual project data.`;

  const answerResponse = query({
    prompt: answerPrompt,
    options: {
      model: "claude-sonnet-4-5-20250929",
      allowedTools: [],
    },
  });

  let result = "";
  for await (const message of answerResponse) {
    result += extractTextContent(message);
  }
  return result;
}

// ============================================================================
// Example Data
// ============================================================================

export const exampleFiles: { path: string; content: string }[] = [
  {
    path: "src/auth/authenticate.ts",
    content: `
import { hashPassword, verifyPassword } from '../utils/crypto';
import { UserRepository } from '../infrastructure/user-repository';
import { Result } from '../types/result';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function createAuthenticator(repo: UserRepository) {
  return {
    async authenticate(email: string, password: string): Promise<AuthResult> {
      try {
        const user = await repo.findByEmail(email);
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return { success: false, error: 'Invalid password' };
        }
        return { success: true, user };
      } catch (error) {
        return { success: false, error: 'Authentication failed' };
      }
    }
  };
}
`,
  },
  {
    path: "src/payments/processor.ts",
    content: `
import { StripeClient } from '../infrastructure/stripe';
import { PaymentRepository } from '../infrastructure/payment-repository';

export function createPaymentProcessor(stripe: StripeClient, repo: PaymentRepository) {
  return {
    async processPayment(amount: number, token: string) {
      try {
        const charge = await stripe.charge(amount, token);
        await repo.save({ chargeId: charge.id, amount, status: 'completed' });
        return { success: true, chargeId: charge.id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
}
`,
  },
  {
    path: "src/infrastructure/user-repository.ts",
    content: `
import { Database } from '../database';

export class UserRepository {
  constructor(private db: Database) {}

  async findByEmail(email: string) {
    return this.db.query('SELECT * FROM users WHERE email = ?', [email]);
  }

  async save(user: User) {
    return this.db.query('INSERT INTO users VALUES (?, ?, ?)',
      [user.id, user.email, user.passwordHash]);
  }
}
`,
  },
];

export const exampleCommits: GitCommit[] = [
  {
    hash: "abc123",
    author: "Alice",
    date: new Date("2026-01-27"),
    message: "Add payment processing module",
    filesChanged: ["src/payments/processor.ts", "src/infrastructure/stripe.ts"],
  },
  {
    hash: "def456",
    author: "Bob",
    date: new Date("2026-01-26"),
    message: "Refactor authentication to use Result type",
    filesChanged: ["src/auth/authenticate.ts", "src/types/result.ts"],
  },
  {
    hash: "ghi789",
    author: "Alice",
    date: new Date("2026-01-25"),
    message: "Add user repository",
    filesChanged: ["src/infrastructure/user-repository.ts"],
  },
];

export const exampleCoverage: Parameters<typeof analyzeCoverage>[0] = [
  {
    file: "src/auth/authenticate.ts",
    statements: { total: 20, covered: 18 },
    branches: { total: 6, covered: 5 },
    functions: { total: 2, covered: 2 },
    lines: { total: 25, covered: 22 },
    uncoveredLines: [15, 18, 23],
  },
  {
    file: "src/payments/processor.ts",
    statements: { total: 15, covered: 10 },
    branches: { total: 4, covered: 2 },
    functions: { total: 1, covered: 1 },
    lines: { total: 18, covered: 12 },
    uncoveredLines: [8, 9, 10, 14, 15, 16],
  },
];

// ============================================================================
// Demo
// ============================================================================

async function demo() {
  console.log("=== Chapter 13: MCP Project Context Demo ===\n");

  const server = new ProjectContextServer(
    exampleFiles,
    exampleCommits,
    exampleCoverage
  );

  // List resources
  console.log("--- Available Resources ---\n");
  const resources = server.listResources();
  resources.forEach((r) => {
    console.log(`${r.uri}`);
    console.log(`  ${r.description}\n`);
  });

  // Query architecture
  console.log("--- Architecture Graph ---\n");
  const archResource = server.readResource("architecture-graph://project");
  console.log(archResource.text);

  // Query patterns
  console.log("\n--- Factory Function Patterns ---\n");
  const patternResource = server.readResource(
    "pattern-examples://factory-functions"
  );
  console.log(patternResource.text);

  // Query coverage
  console.log("\n--- Test Coverage ---\n");
  const coverageResource = server.readResource("test-coverage://all");
  console.log(coverageResource.text);

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
