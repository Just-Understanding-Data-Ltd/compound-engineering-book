/**
 * Chapter 6: The Verification Ladder - Test Suite
 *
 * Tests for verification analysis and schema generation utilities.
 * These tests focus on the local utility functions that don't require API calls.
 */

import { describe, it, expect } from "vitest";
import {
  VerificationLevel,
  getLevelDescription,
  getLevelTools,
  analyzeRiskLevel,
  riskPatterns,
  generateCoverageReport,
  type VerificationAnalysis,
} from "./verification-analyzer.ts";
import {
  inferZodType,
  generateSchemaFromSample,
  boundaryPatterns,
  formatValidationErrors,
} from "./schema-generator.ts";

// ============================================================================
// VERIFICATION ANALYZER TESTS
// ============================================================================

describe("VerificationLevel enum", () => {
  it("has correct numeric values", () => {
    expect(VerificationLevel.STATIC_TYPES).toBe(1);
    expect(VerificationLevel.RUNTIME_VALIDATION).toBe(2);
    expect(VerificationLevel.UNIT_TESTS).toBe(3);
    expect(VerificationLevel.INTEGRATION_TESTS).toBe(4);
    expect(VerificationLevel.PROPERTY_BASED_TESTS).toBe(5);
    expect(VerificationLevel.FORMAL_VERIFICATION).toBe(6);
  });
});

describe("getLevelDescription", () => {
  it("returns descriptions for all levels", () => {
    expect(getLevelDescription(VerificationLevel.STATIC_TYPES)).toContain(
      "compile-time"
    );
    expect(getLevelDescription(VerificationLevel.RUNTIME_VALIDATION)).toContain(
      "boundaries"
    );
    expect(getLevelDescription(VerificationLevel.UNIT_TESTS)).toContain(
      "isolated"
    );
    expect(getLevelDescription(VerificationLevel.INTEGRATION_TESTS)).toContain(
      "interactions"
    );
    expect(getLevelDescription(VerificationLevel.PROPERTY_BASED_TESTS)).toContain(
      "thousands"
    );
    expect(getLevelDescription(VerificationLevel.FORMAL_VERIFICATION)).toContain(
      "proves"
    );
  });
});

describe("getLevelTools", () => {
  it("returns TypeScript tools for static types", () => {
    const tools = getLevelTools(VerificationLevel.STATIC_TYPES);
    expect(tools).toContain("TypeScript");
    expect(tools).toContain("mypy");
  });

  it("returns Zod for runtime validation", () => {
    const tools = getLevelTools(VerificationLevel.RUNTIME_VALIDATION);
    expect(tools).toContain("Zod");
    expect(tools).toContain("io-ts");
  });

  it("returns Jest/Vitest for unit tests", () => {
    const tools = getLevelTools(VerificationLevel.UNIT_TESTS);
    expect(tools).toContain("Jest");
    expect(tools).toContain("Vitest");
  });

  it("returns Playwright for integration tests", () => {
    const tools = getLevelTools(VerificationLevel.INTEGRATION_TESTS);
    expect(tools).toContain("Playwright");
    expect(tools).toContain("Cypress");
  });

  it("returns fast-check for property testing", () => {
    const tools = getLevelTools(VerificationLevel.PROPERTY_BASED_TESTS);
    expect(tools).toContain("fast-check");
    expect(tools).toContain("Hypothesis");
  });

  it("returns TLA+ for formal verification", () => {
    const tools = getLevelTools(VerificationLevel.FORMAL_VERIFICATION);
    expect(tools).toContain("TLA+");
    expect(tools).toContain("Z3");
  });
});

describe("analyzeRiskLevel", () => {
  it("returns static types for simple code", () => {
    const code = `function add(a: number, b: number): number { return a + b; }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.STATIC_TYPES);
  });

  it("detects financial code patterns", () => {
    const code = `async function processPayment(amount: number) { await stripe.charge(amount); }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.PROPERTY_BASED_TESTS);
  });

  it("detects billing code patterns", () => {
    const code = `function calculateBilling(invoice: Invoice) { return invoice.total; }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.PROPERTY_BASED_TESTS);
  });

  it("detects security code patterns", () => {
    const code = `function authenticate(password: string) { return bcrypt.compare(password, hash); }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.INTEGRATION_TESTS);
  });

  it("detects token handling patterns", () => {
    const code = `function verifyToken(token: string) { return jwt.verify(token, secret); }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.INTEGRATION_TESTS);
  });

  it("detects data persistence patterns", () => {
    // Using sync function to avoid triggering distributed pattern from "async"
    const code = `function saveUser(user: User) { database.users.insert(user); }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.INTEGRATION_TESTS);
  });

  it("detects API endpoint patterns", () => {
    const code = `app.get('/api/users', handler);`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.RUNTIME_VALIDATION);
  });

  it("detects concurrent code patterns", () => {
    const code = `async function processQueue() { await Promise.all(items.map(processAsync)); }`;
    expect(analyzeRiskLevel(code)).toBe(VerificationLevel.PROPERTY_BASED_TESTS);
  });

  it("combines multiple risk factors to highest level", () => {
    const code = `
      async function processPaymentTransaction(token: string) {
        await authenticate(token);
        await processPayment(amount);
        await saveToDatabase(result);
      }
    `;
    // Should be at least PROPERTY_BASED_TESTS due to financial code
    expect(analyzeRiskLevel(code)).toBeGreaterThanOrEqual(
      VerificationLevel.PROPERTY_BASED_TESTS
    );
  });
});

describe("riskPatterns", () => {
  it("has financial patterns", () => {
    expect(riskPatterns.financial).toContain("payment");
    expect(riskPatterns.financial).toContain("transaction");
  });

  it("has security patterns", () => {
    expect(riskPatterns.security).toContain("auth");
    expect(riskPatterns.security).toContain("password");
  });

  it("has data integrity patterns", () => {
    expect(riskPatterns.dataIntegrity).toContain("database");
    expect(riskPatterns.dataIntegrity).toContain("persist");
  });

  it("has user-facing patterns", () => {
    expect(riskPatterns.userFacing).toContain("api");
    expect(riskPatterns.userFacing).toContain("endpoint");
  });

  it("has distributed patterns", () => {
    expect(riskPatterns.distributed).toContain("queue");
    expect(riskPatterns.distributed).toContain("concurrent");
  });
});

describe("generateCoverageReport", () => {
  it("generates markdown report", () => {
    const analysis: VerificationAnalysis = {
      sessionId: "test-session-123",
      modules: [
        {
          moduleName: "auth",
          currentLevel: VerificationLevel.STATIC_TYPES,
          recommendedLevel: VerificationLevel.INTEGRATION_TESTS,
          risks: ["Security-sensitive code"],
          rationale: "Authentication needs integration testing",
          estimatedEffort: "medium",
        },
      ],
      overallRisk: "high",
      summary: "1 module needs verification upgrade",
    };

    const report = generateCoverageReport(analysis);

    expect(report).toContain("# Verification Coverage Report");
    expect(report).toContain("test-session-123");
    expect(report).toContain("HIGH");
    expect(report).toContain("auth");
    expect(report).toContain("Security-sensitive code");
  });

  it("includes tool recommendations", () => {
    const analysis: VerificationAnalysis = {
      sessionId: "test",
      modules: [
        {
          moduleName: "payment",
          currentLevel: VerificationLevel.UNIT_TESTS,
          recommendedLevel: VerificationLevel.PROPERTY_BASED_TESTS,
          risks: ["Financial calculations"],
          rationale: "Needs exhaustive testing",
          estimatedEffort: "high",
        },
      ],
      overallRisk: "critical",
      summary: "Critical risk",
    };

    const report = generateCoverageReport(analysis);

    expect(report).toContain("fast-check");
    expect(report).toContain("Hypothesis");
  });
});

// ============================================================================
// SCHEMA GENERATOR TESTS
// ============================================================================

describe("inferZodType", () => {
  it("infers z.null() for null", () => {
    expect(inferZodType(null)).toBe("z.null()");
  });

  it("infers z.undefined() for undefined", () => {
    expect(inferZodType(undefined)).toBe("z.undefined()");
  });

  it("infers z.string() for plain strings", () => {
    expect(inferZodType("hello")).toBe("z.string()");
  });

  it("infers z.string().email() for email strings", () => {
    expect(inferZodType("user@example.com")).toBe("z.string().email()");
  });

  it("infers z.string().uuid() for UUID strings", () => {
    expect(inferZodType("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "z.string().uuid()"
    );
  });

  it("infers z.string().url() for URL strings", () => {
    expect(inferZodType("https://example.com")).toBe("z.string().url()");
  });

  it("infers z.string().datetime() for ISO8601 strings", () => {
    expect(inferZodType("2024-01-15T10:30:00Z")).toBe("z.string().datetime()");
  });

  it("infers z.number().int() for integers", () => {
    expect(inferZodType(42)).toBe("z.number().int()");
  });

  it("infers z.number() for floats", () => {
    expect(inferZodType(3.14)).toBe("z.number()");
  });

  it("infers z.boolean() for booleans", () => {
    expect(inferZodType(true)).toBe("z.boolean()");
    expect(inferZodType(false)).toBe("z.boolean()");
  });

  it("infers z.array() for arrays with same type", () => {
    expect(inferZodType([1, 2, 3])).toBe("z.array(z.number().int())");
    expect(inferZodType(["a", "b"])).toBe("z.array(z.string())");
  });

  it("infers z.array() with union for mixed arrays", () => {
    const result = inferZodType([1, "two"]);
    expect(result).toContain("z.array");
    expect(result).toContain("z.union");
  });

  it("infers z.array(z.unknown()) for empty arrays", () => {
    expect(inferZodType([])).toBe("z.array(z.unknown())");
  });

  it("infers z.object({}) for objects", () => {
    expect(inferZodType({})).toBe("z.object({})");
    expect(inferZodType({ a: 1 })).toBe("z.object({})");
  });
});

describe("generateSchemaFromSample", () => {
  it("generates schema for simple object", () => {
    const sample = { name: "John", age: 30 };
    const schema = generateSchemaFromSample(sample);

    expect(schema).toContain("z.object");
    expect(schema).toContain("name: z.string()");
    expect(schema).toContain("age: z.number().int()");
  });

  it("adds .strict() when requested", () => {
    const sample = { id: 1 };
    const schema = generateSchemaFromSample(sample, true);

    expect(schema).toContain(".strict()");
  });

  it("handles email and UUID fields", () => {
    const sample = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
    };
    const schema = generateSchemaFromSample(sample);

    expect(schema).toContain("z.string().uuid()");
    expect(schema).toContain("z.string().email()");
  });

  it("handles nested objects", () => {
    const sample = {
      user: {
        name: "Jane",
        active: true,
      },
    };
    const schema = generateSchemaFromSample(sample);

    expect(schema).toContain("user: z.object");
    expect(schema).toContain("name: z.string()");
    expect(schema).toContain("active: z.boolean()");
  });

  it("handles arrays", () => {
    const sample = {
      tags: ["a", "b", "c"],
    };
    const schema = generateSchemaFromSample(sample);

    expect(schema).toContain("z.array(z.string())");
  });
});

describe("boundaryPatterns", () => {
  it("has userInput pattern with validation", () => {
    expect(boundaryPatterns.userInput).toContain("email");
    expect(boundaryPatterns.userInput).toContain("password");
    expect(boundaryPatterns.userInput).toContain(".min(");
    expect(boundaryPatterns.userInput).toContain(".max(");
  });

  it("has pagination pattern with defaults", () => {
    expect(boundaryPatterns.pagination).toContain("page");
    expect(boundaryPatterns.pagination).toContain("limit");
    expect(boundaryPatterns.pagination).toContain(".default(");
  });

  it("has webhook pattern", () => {
    expect(boundaryPatterns.webhook).toContain("event");
    expect(boundaryPatterns.webhook).toContain("timestamp");
    expect(boundaryPatterns.webhook).toContain("payload");
  });

  it("has fileUpload pattern with size limit", () => {
    expect(boundaryPatterns.fileUpload).toContain("filename");
    expect(boundaryPatterns.fileUpload).toContain("mimeType");
    expect(boundaryPatterns.fileUpload).toContain("size");
    expect(boundaryPatterns.fileUpload).toContain("10 * 1024 * 1024");
  });
});

describe("formatValidationErrors", () => {
  it("formats single error", () => {
    const errors = [{ path: ["email"], message: "Invalid email" }];
    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain("email");
    expect(formatted).toContain("Invalid email");
  });

  it("formats multiple errors", () => {
    const errors = [
      { path: ["email"], message: "Invalid email" },
      { path: ["age"], message: "Must be positive" },
    ];
    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain("email");
    expect(formatted).toContain("age");
  });

  it("formats nested paths", () => {
    const errors = [{ path: ["user", "address", "zip"], message: "Required" }];
    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain("user.address.zip");
  });

  it("handles root-level errors", () => {
    const errors = [{ path: [], message: "Invalid object" }];
    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain("root");
  });

  it("handles array index paths", () => {
    const errors = [{ path: ["items", 0, "name"], message: "Required" }];
    const formatted = formatValidationErrors(errors);

    expect(formatted).toContain("items.0.name");
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("End-to-end verification analysis", () => {
  it("analyzes payment processing module correctly", () => {
    const paymentCode = `
      async function processPayment(amount: number, currency: string) {
        const transaction = await stripe.charges.create({ amount, currency });
        await db.transactions.insert(transaction);
        return transaction;
      }
    `;

    const level = analyzeRiskLevel(paymentCode);
    const tools = getLevelTools(level);

    expect(level).toBe(VerificationLevel.PROPERTY_BASED_TESTS);
    expect(tools).toContain("fast-check");
  });

  it("generates schema for API response", () => {
    const apiResponse = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "success",
      data: {
        user: {
          email: "user@example.com",
          createdAt: "2024-01-15T10:30:00Z",
        },
      },
    };

    const schema = generateSchemaFromSample(apiResponse, true);

    expect(schema).toContain("z.string().uuid()");
    expect(schema).toContain("z.string().email()");
    expect(schema).toContain("z.string().datetime()");
    expect(schema).toContain(".strict()");
  });
});
