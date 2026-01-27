/**
 * Email Validation Module
 *
 * This example demonstrates concepts from Chapter 2:
 * - Pattern 4: Tests as Specification (section 4.5)
 * - Result<T, E> error handling pattern
 * - TypeScript type guards
 *
 * The validation rules were designed to match the test cases
 * written first (test-driven development pattern).
 *
 * @module ch02/email-validation
 */

// Result<T, E> pattern - consistent error handling across the codebase
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

interface ValidationError {
  code: 'EMPTY' | 'MISSING_AT' | 'INVALID_FORMAT' | 'WHITESPACE';
  message: string;
  input: string;
}

interface ValidEmail {
  local: string;      // Part before @
  domain: string;     // Part after @
  original: string;   // Original input
}

/**
 * Validate email address format
 *
 * Test cases (from PRD section 4.5.4):
 * - Valid: user@example.com, john.doe+test@company.co.uk
 * - Invalid: missing @, empty string, spaces
 * - Edge cases: international domains, subdomains
 *
 * @param email - The email address to validate
 * @returns Result with parsed email or validation error
 */
export function validateEmail(email: string): Result<ValidEmail, ValidationError> {
  // Handle empty input
  if (!email || email.length === 0) {
    return {
      success: false,
      error: {
        code: 'EMPTY',
        message: 'Email address cannot be empty',
        input: email
      }
    };
  }

  // Check for whitespace
  if (/\s/.test(email)) {
    return {
      success: false,
      error: {
        code: 'WHITESPACE',
        message: 'Email address cannot contain whitespace',
        input: email
      }
    };
  }

  // Check for @ symbol
  if (!email.includes('@')) {
    return {
      success: false,
      error: {
        code: 'MISSING_AT',
        message: 'Email address must contain @ symbol',
        input: email
      }
    };
  }

  // Split into local and domain parts
  const atIndex = email.lastIndexOf('@');
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // Validate local part
  if (local.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Email local part (before @) cannot be empty',
        input: email
      }
    };
  }

  // Validate domain part
  if (domain.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Email domain (after @) cannot be empty',
        input: email
      }
    };
  }

  // Domain must have at least one dot and valid TLD
  if (!domain.includes('.')) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Email domain must have a valid TLD (e.g., .com, .org)',
        input: email
      }
    };
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Email address cannot contain consecutive dots',
        input: email
      }
    };
  }

  // Valid email
  return {
    success: true,
    data: {
      local,
      domain,
      original: email
    }
  };
}

/**
 * Type guard: Check if value is a valid email string
 *
 * Demonstrates TypeScript type guard pattern for runtime validation
 *
 * @param val - Unknown value to check
 * @returns True if val is a valid email string
 */
export function isValidEmail(val: unknown): val is string {
  if (typeof val !== 'string') {
    return false;
  }
  const result = validateEmail(val);
  return result.success;
}

/**
 * Batch validate multiple emails
 *
 * Demonstrates: Processing collections with Result pattern
 *
 * @param emails - Array of email addresses
 * @returns Object with valid and invalid emails separated
 */
export function validateEmails(emails: string[]): {
  valid: ValidEmail[];
  invalid: { email: string; error: ValidationError }[];
} {
  const valid: ValidEmail[] = [];
  const invalid: { email: string; error: ValidationError }[] = [];

  for (const email of emails) {
    const result = validateEmail(email);
    if (result.success === true) {
      valid.push(result.data);
    } else {
      invalid.push({ email, error: result.error });
    }
  }

  return { valid, invalid };
}

/**
 * Demo function showing example usage
 * Run with: bun run email-validation.ts
 */
function demo(): void {
  const testEmails = [
    'user@example.com',
    'john.doe+test@company.co.uk',
    'name@sub.domain.co.uk',
    'invalid',
    '',
    'has spaces@example.com',
    '@nodomain.com',
    'noat.example.com',
    'double..dot@example.com'
  ];

  console.log('Email Validation Results:\n');
  console.log('='.repeat(60));

  for (const email of testEmails) {
    const result = validateEmail(email);
    const display = email || '(empty)';

    if (result.success === true) {
      console.log(`  [VALID] ${display}`);
      console.log(`          Local: ${result.data.local}, Domain: ${result.data.domain}`);
    } else {
      console.log(`[INVALID] ${display}`);
      console.log(`          ${result.error.code}: ${result.error.message}`);
    }
    console.log();
  }

  // Batch validation example
  console.log('='.repeat(60));
  console.log('Batch Validation Summary:\n');

  const batchResult = validateEmails(testEmails);
  console.log(`Valid emails: ${batchResult.valid.length}`);
  console.log(`Invalid emails: ${batchResult.invalid.length}`);
}

// Run demo when executed directly
demo();
