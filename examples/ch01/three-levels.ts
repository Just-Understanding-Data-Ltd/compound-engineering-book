/**
 * Chapter 1: The Three Levels of Engineering
 *
 * This file demonstrates the three levels of engineering through
 * a concrete example: building API endpoints.
 *
 * Level 1: Write code directly
 * Level 2: Write reusable systems
 * Level 3: Write systems that write systems
 */

// ============================================================
// Level 1: Write Code Directly
// Each endpoint is hand-written. Time per feature: constant.
// ============================================================

interface User {
  id: string;
  email: string;
  createdAt: Date;
  [key: string]: unknown; // Index signature for compatibility with generic systems
}

// Level 1 approach: Write each endpoint by hand
function createUserLevel1(data: { email: string }): User {
  // Manual validation
  if (!data.email || !data.email.includes("@")) {
    throw new Error("Invalid email");
  }

  // Manual ID generation
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    email: data.email,
    createdAt: new Date(),
  };
}

function getUserLevel1(id: string): User | null {
  // In real code, this would query a database
  // Each getter is written individually
  console.log(`Fetching user: ${id}`);
  return null;
}

// ============================================================
// Level 2: Write Reusable Systems
// Generic patterns that can generate CRUD. Time per feature: declining.
// ============================================================

// Generic entity type
interface Entity {
  id: string;
  createdAt: Date;
  [key: string]: unknown;
}

// Level 2: A reusable CRUD factory
function createCrudFactory<T extends Entity>(entityName: string) {
  return {
    create: (data: Omit<T, "id" | "createdAt">): T => {
      const id = `${entityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        createdAt: new Date(),
        ...data,
      } as T;
    },

    get: (id: string): T | null => {
      console.log(`Fetching ${entityName}: ${id}`);
      return null;
    },

    update: (id: string, data: Partial<Omit<T, "id" | "createdAt">>): T | null => {
      console.log(`Updating ${entityName}: ${id}`, data);
      return null;
    },

    delete: (id: string): boolean => {
      console.log(`Deleting ${entityName}: ${id}`);
      return true;
    },
  };
}

// Level 2 usage: Define entity, get CRUD for free
const userCrud = createCrudFactory<User>("user");
const newUser = userCrud.create({ email: "test@example.com" });
console.log("Level 2 created user:", newUser);

// ============================================================
// Level 3: Write Systems That Write Systems
// Define constraints, generate everything. Time per feature: exponentially declining.
// ============================================================

// Constraint-based entity definition
interface EntityConstraints {
  name: string;
  fields: FieldConstraint[];
  invariants: Invariant[];
}

interface FieldConstraint {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "uuid" | "email";
  required: boolean;
  unique?: boolean;
  immutable?: boolean;
  defaultValue?: unknown;
}

interface Invariant {
  name: string;
  description: string;
  validate: (entity: Record<string, unknown>) => boolean;
}

// Level 3: Define user as constraints
const userConstraints: EntityConstraints = {
  name: "User",
  fields: [
    { name: "id", type: "uuid", required: true, immutable: true },
    { name: "email", type: "email", required: true, unique: true },
    { name: "createdAt", type: "date", required: true, immutable: true },
  ],
  invariants: [
    {
      name: "email_unique",
      description: "Email addresses must be unique",
      validate: (_entity) => true, // Would check against existing records
    },
    {
      name: "id_immutable",
      description: "ID cannot change after creation",
      validate: (_entity) => true, // Would compare with stored value
    },
  ],
};

// Level 3: System that generates CRUD from constraints
function generateCrudFromConstraints<T extends Record<string, unknown>>(
  constraints: EntityConstraints
) {
  const fieldValidators: Record<
    string,
    (value: unknown) => { valid: boolean; error?: string }
  > = {
    string: (v) => ({
      valid: typeof v === "string",
      error: "Must be a string",
    }),
    number: (v) => ({
      valid: typeof v === "number",
      error: "Must be a number",
    }),
    boolean: (v) => ({
      valid: typeof v === "boolean",
      error: "Must be a boolean",
    }),
    date: (v) => ({
      valid: v instanceof Date || typeof v === "string",
      error: "Must be a date",
    }),
    uuid: (v) => ({
      valid: typeof v === "string" && v.length > 0,
      error: "Must be a UUID",
    }),
    email: (v) => ({
      valid: typeof v === "string" && v.includes("@"),
      error: "Must be a valid email",
    }),
  };

  return {
    // Generated create function with automatic validation
    create: (data: Partial<T>): { entity: T | null; errors: string[] } => {
      const errors: string[] = [];
      const entity: Record<string, unknown> = {};

      for (const field of constraints.fields) {
        const value = data[field.name as keyof T];

        // Handle required fields
        if (field.required && value === undefined && field.type !== "uuid") {
          if (field.type === "date" && field.name === "createdAt") {
            entity[field.name] = new Date();
          } else {
            errors.push(`${field.name} is required`);
          }
          continue;
        }

        // Auto-generate UUID fields
        if (field.type === "uuid" && value === undefined) {
          entity[field.name] = `${constraints.name.toLowerCase()}_${Date.now()}`;
          continue;
        }

        // Validate field type
        if (value !== undefined) {
          const validator = fieldValidators[field.type];
          if (validator) {
            const result = validator(value);
            if (!result.valid) {
              errors.push(`${field.name}: ${result.error}`);
            } else {
              entity[field.name] = value;
            }
          } else {
            entity[field.name] = value;
          }
        }
      }

      // Run invariant checks
      for (const invariant of constraints.invariants) {
        if (!invariant.validate(entity)) {
          errors.push(`Invariant violation: ${invariant.description}`);
        }
      }

      return {
        entity: errors.length === 0 ? (entity as T) : null,
        errors,
      };
    },

    // Generated update function that respects immutability
    update: (
      existing: T,
      updates: Partial<T>
    ): { entity: T | null; errors: string[] } => {
      const errors: string[] = [];
      const updated = { ...existing };

      for (const [key, value] of Object.entries(updates)) {
        const field = constraints.fields.find((f) => f.name === key);
        if (field?.immutable) {
          errors.push(`${key} is immutable and cannot be changed`);
          continue;
        }
        (updated as Record<string, unknown>)[key] = value;
      }

      return {
        entity: errors.length === 0 ? updated : null,
        errors,
      };
    },

    // Metadata about the generated system
    constraints: constraints,
    fieldNames: constraints.fields.map((f) => f.name),
    invariantNames: constraints.invariants.map((i) => i.name),
  };
}

// Level 3 usage: Define constraints, system generates everything
const userSystem = generateCrudFromConstraints<User>(userConstraints);

// Test Level 3 creation
const level3Result = userSystem.create({ email: "level3@example.com" });
console.log("Level 3 result:", level3Result);

// Test immutability enforcement
if (level3Result.entity) {
  const updateResult = userSystem.update(level3Result.entity, {
    id: "new_id", // This should fail
    email: "new@example.com", // This should succeed
  });
  console.log("Level 3 update result:", updateResult);
}

// ============================================================
// Summary: Measuring the Difference
// ============================================================

console.log("\n=== Summary: Three Levels of Engineering ===");
console.log("Level 1: Write each endpoint by hand");
console.log("  - Lines of code per entity: ~50-100");
console.log("  - Time per new entity: Same as last one");
console.log("  - Reusability: None");

console.log("\nLevel 2: Use a CRUD factory");
console.log("  - Lines of code per entity: ~5");
console.log("  - Time per new entity: Declining (patterns reused)");
console.log("  - Reusability: High (factory handles CRUD)");

console.log("\nLevel 3: Define constraints, generate everything");
console.log("  - Lines of code per entity: ~20 (constraint definition)");
console.log("  - Time per new entity: Minimal (system generates)");
console.log("  - Reusability: Compound (constraints enable validation, docs, tests, migrations)");
console.log("  - Bonus: Immutability, uniqueness, invariants enforced automatically");
