/**
 * Chapter 6: The Verification Ladder
 *
 * This file demonstrates using the Agent SDK to generate
 * Zod schemas for Level 2 runtime validation, a critical
 * step in the verification ladder for data boundaries.
 *
 * Key concepts:
 * - Agent-generated validation schemas
 * - API boundary protection
 * - Type inference from schemas
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// SCHEMA GENERATION TYPES
// ============================================================================

/**
 * Configuration for schema generation
 */
export interface SchemaGenerationConfig {
  /** Sample data to infer schema from */
  sampleData: unknown;
  /** Additional constraints to apply */
  constraints?: string[];
  /** Whether to generate strict schemas (no extra keys) */
  strict?: boolean;
  /** Add custom error messages */
  customMessages?: boolean;
}

/**
 * Result of schema generation
 */
export interface GeneratedSchema {
  /** The Zod schema code */
  schemaCode: string;
  /** TypeScript type inferred from schema */
  typeDefinition: string;
  /** Validation examples */
  examples: {
    valid: unknown[];
    invalid: unknown[];
  };
  /** Edge cases to consider */
  edgeCases: string[];
}

// ============================================================================
// SCHEMA INFERENCE UTILITIES
// ============================================================================

/**
 * Infer basic Zod type from a JavaScript value
 */
export function inferZodType(value: unknown): string {
  if (value === null) return "z.null()";
  if (value === undefined) return "z.undefined()";

  const type = typeof value;

  switch (type) {
    case "string":
      // Check for common string formats
      if (isEmail(value as string)) return "z.string().email()";
      if (isUUID(value as string)) return "z.string().uuid()";
      if (isURL(value as string)) return "z.string().url()";
      if (isISO8601(value as string)) return "z.string().datetime()";
      return "z.string()";

    case "number":
      if (Number.isInteger(value)) return "z.number().int()";
      return "z.number()";

    case "boolean":
      return "z.boolean()";

    case "object":
      if (Array.isArray(value)) {
        if (value.length === 0) return "z.array(z.unknown())";
        const elementTypes = new Set(value.map((v) => inferZodType(v)));
        if (elementTypes.size === 1) {
          return `z.array(${[...elementTypes][0]})`;
        }
        return `z.array(z.union([${[...elementTypes].join(", ")}]))`;
      }
      return "z.object({})"; // Will be expanded
    default:
      return "z.unknown()";
  }
}

/**
 * Check if string is valid email format
 */
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Check if string is valid UUID format
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str
  );
}

/**
 * Check if string is valid URL format
 */
function isURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is ISO 8601 datetime
 */
function isISO8601(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
}

/**
 * Generate Zod schema from sample object
 */
export function generateSchemaFromSample(
  sample: Record<string, unknown>,
  strict = false
): string {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(sample)) {
    const zodType = inferZodType(value);

    // Recursively handle nested objects
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nestedSchema = generateSchemaFromSample(
        value as Record<string, unknown>,
        strict
      );
      fields.push(`  ${key}: ${nestedSchema}`);
    } else {
      fields.push(`  ${key}: ${zodType}`);
    }
  }

  const schema = `z.object({\n${fields.join(",\n")}\n})`;
  return strict ? `${schema}.strict()` : schema;
}

// ============================================================================
// AGENT-ASSISTED SCHEMA GENERATION
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
 * Generate a Zod schema using the Agent SDK for complex cases
 */
export async function generateSchemaWithAgent(
  config: SchemaGenerationConfig
): Promise<GeneratedSchema> {
  const sampleJson = JSON.stringify(config.sampleData, null, 2);
  const constraintsText = config.constraints?.join("\n- ") ?? "None specified";

  const prompt = `Generate a Zod schema for this data:

\`\`\`json
${sampleJson}
\`\`\`

Additional constraints:
- ${constraintsText}

Requirements:
1. Use appropriate Zod validators (.email(), .min(), .max(), etc.)
2. Add .optional() for fields that could be missing
3. ${config.strict ? "Use .strict() to disallow extra fields" : "Allow extra fields"}
4. ${config.customMessages ? "Add custom error messages" : "Use default error messages"}

Respond with:
1. The complete Zod schema code
2. The inferred TypeScript type
3. Three valid example values
4. Three invalid example values that should fail validation
5. Edge cases to consider for testing`;

  const response = query({
    prompt,
    options: {
      cwd: process.cwd(),
      allowedTools: [], // No tools needed for schema generation
    },
  });

  let fullResponse = "";

  for await (const message of response) {
    if (message.type === "assistant") {
      fullResponse += extractTextContent(message);
    }
  }

  // Parse response (simplified - real implementation would use structured output)
  return parseSchemaResponse(fullResponse, sampleJson);
}

/**
 * Parse agent response into structured schema result
 */
function parseSchemaResponse(
  response: string,
  sampleJson: string
): GeneratedSchema {
  // Extract code blocks from response
  const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const codeContent = match[1];
    if (codeContent) {
      codeBlocks.push(codeContent.trim());
    }
  }

  // First code block should be the schema, fall back to local generation
  const firstCodeBlock = codeBlocks.length > 0 ? codeBlocks[0] : undefined;
  const schemaCode =
    firstCodeBlock ?? generateSchemaFromSample(JSON.parse(sampleJson));

  // Generate type from schema name
  const typeDefinition = `type ValidatedData = z.infer<typeof schema>;`;

  return {
    schemaCode,
    typeDefinition,
    examples: {
      valid: [JSON.parse(sampleJson)],
      invalid: [null, {}, { invalid: true }],
    },
    edgeCases: extractEdgeCases(response),
  };
}

/**
 * Extract edge cases from agent response
 */
function extractEdgeCases(response: string): string[] {
  const edgeCases: string[] = [];

  // Look for common edge case patterns
  if (response.toLowerCase().includes("empty string")) {
    edgeCases.push("Empty strings for required string fields");
  }
  if (response.toLowerCase().includes("negative")) {
    edgeCases.push("Negative numbers for positive-only fields");
  }
  if (response.toLowerCase().includes("unicode")) {
    edgeCases.push("Unicode characters in string fields");
  }
  if (response.toLowerCase().includes("null")) {
    edgeCases.push("Null values for non-nullable fields");
  }
  if (response.toLowerCase().includes("boundary")) {
    edgeCases.push("Boundary values (min/max limits)");
  }

  if (edgeCases.length === 0) {
    edgeCases.push(
      "Empty objects",
      "Missing required fields",
      "Extra unexpected fields",
      "Wrong types for fields"
    );
  }

  return edgeCases;
}

// ============================================================================
// SCHEMA VALIDATION HELPERS
// ============================================================================

/**
 * Wrap a handler with schema validation
 */
export function withValidation<T, R>(
  schema: { parse: (data: unknown) => T },
  handler: (validData: T) => R
): (rawData: unknown) => R | { error: string; issues: unknown[] } {
  return (rawData: unknown) => {
    try {
      const validData = schema.parse(rawData);
      return handler(validData);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return {
          error: "Validation failed",
          issues: (error as { issues: unknown[] }).issues,
        };
      }
      throw error;
    }
  };
}

/**
 * Generate a validation error reporter
 */
export function formatValidationErrors(
  errors: { path: (string | number)[]; message: string }[]
): string {
  return errors
    .map((err) => {
      const path = err.path.length > 0 ? err.path.join(".") : "root";
      return `  - ${path}: ${err.message}`;
    })
    .join("\n");
}

// ============================================================================
// BOUNDARY PROTECTION PATTERNS
// ============================================================================

/**
 * Common API boundary schema patterns
 */
export const boundaryPatterns = {
  // User input from forms
  userInput: `z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
})`,

  // Pagination parameters
  pagination: `z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})`,

  // Webhook payload
  webhook: `z.object({
  event: z.string(),
  timestamp: z.string().datetime(),
  payload: z.record(z.unknown()),
  signature: z.string().optional(),
})`,

  // File upload metadata
  fileUpload: `z.object({
  filename: z.string().max(255),
  mimeType: z.string().regex(/^[\\w-]+\\/[\\w-+.]+$/),
  size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
})`,
};

// ============================================================================
// DEMO
// ============================================================================

if (import.meta.main) {
  console.log("Schema Generator Demo");
  console.log("=====================\n");

  // Example 1: Infer schema from sample data
  const sampleUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    name: "Jane Doe",
    age: 28,
    active: true,
    createdAt: "2024-01-15T10:30:00Z",
    roles: ["user", "admin"],
    metadata: {
      lastLogin: "2024-01-20T14:22:00Z",
      preferences: {
        theme: "dark",
        notifications: true,
      },
    },
  };

  console.log("Sample data:");
  console.log(JSON.stringify(sampleUser, null, 2));
  console.log("\nGenerated Zod schema (local inference):");

  const schema = generateSchemaFromSample(sampleUser, true);
  console.log(schema);

  console.log("\n--- Field type inference ---");
  console.log(`id: ${inferZodType(sampleUser.id)}`);
  console.log(`email: ${inferZodType(sampleUser.email)}`);
  console.log(`age: ${inferZodType(sampleUser.age)}`);
  console.log(`active: ${inferZodType(sampleUser.active)}`);
  console.log(`createdAt: ${inferZodType(sampleUser.createdAt)}`);
  console.log(`roles: ${inferZodType(sampleUser.roles)}`);

  console.log("\n--- Common boundary patterns ---");
  console.log("\nUser input validation:");
  console.log(boundaryPatterns.userInput);

  console.log("\nPagination parameters:");
  console.log(boundaryPatterns.pagination);

  console.log("\n✓ Demo complete");
  console.log(
    "\nTo generate schemas with agent assistance, call generateSchemaWithAgent() with ANTHROPIC_API_KEY set."
  );
}
