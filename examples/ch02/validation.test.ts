/**
 * Email Validation Tests
 *
 * This test file demonstrates the "Tests as Specification" pattern
 * from Chapter 2, section 4.5.4.
 *
 * The tests were written FIRST, defining the expected behavior,
 * then the implementation (email-validation.ts) was written to pass them.
 *
 * Test categories from PRD:
 * - Valid: user@example.com, john.doe+test@company.co.uk
 * - Invalid: missing @, empty string, spaces
 * - Edge cases: international domains, subdomains
 *
 * Run with: bun test validation.test.ts
 *
 * @module ch02/validation.test
 */

import { describe, it, expect } from 'bun:test';
import {
  validateEmail,
  isValidEmail,
  validateEmails,
  isResultError
} from './email-validation';

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      const result = validateEmail('user@example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.local).toBe('user');
        expect(result.data.domain).toBe('example.com');
        expect(result.data.original).toBe('user@example.com');
      }
    });

    it('should accept email with plus sign (alias)', () => {
      const result = validateEmail('john.doe+test@company.co.uk');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.local).toBe('john.doe+test');
        expect(result.data.domain).toBe('company.co.uk');
      }
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('name@sub.domain.co.uk');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domain).toBe('sub.domain.co.uk');
      }
    });

    it('should accept email with dots in local part', () => {
      const result = validateEmail('first.last@example.org');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.local).toBe('first.last');
      }
    });

    it('should accept email with numbers', () => {
      const result = validateEmail('user123@mail456.com');

      expect(result.success).toBe(true);
    });

    it('should accept email with hyphens in domain', () => {
      const result = validateEmail('user@my-company.com');

      expect(result.success).toBe(true);
    });
  });

  describe('invalid emails - missing @', () => {
    it('should reject email without @ symbol', () => {
      const result = validateEmail('noatexample.com');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('MISSING_AT');
      }
    });

    it('should reject plain text', () => {
      const result = validateEmail('invalid');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('MISSING_AT');
      }
    });
  });

  describe('invalid emails - empty string', () => {
    it('should reject empty string', () => {
      const result = validateEmail('');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('EMPTY');
        expect(result.error.message).toBe('Email address cannot be empty');
      }
    });
  });

  describe('invalid emails - whitespace', () => {
    it('should reject email with spaces', () => {
      const result = validateEmail('has spaces@example.com');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('WHITESPACE');
      }
    });

    it('should reject email with tab', () => {
      const result = validateEmail('has\ttab@example.com');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('WHITESPACE');
      }
    });
  });

  describe('invalid emails - format errors', () => {
    it('should reject email with empty local part', () => {
      const result = validateEmail('@example.com');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('INVALID_FORMAT');
      }
    });

    it('should reject email with empty domain', () => {
      const result = validateEmail('user@');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('INVALID_FORMAT');
      }
    });

    it('should reject email without TLD', () => {
      const result = validateEmail('user@localhost');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('INVALID_FORMAT');
        expect(result.error.message).toContain('TLD');
      }
    });

    it('should reject email with consecutive dots', () => {
      const result = validateEmail('double..dot@example.com');

      expect(result.success).toBe(false);
      if (isResultError(result)) {
        expect(result.error.code).toBe('INVALID_FORMAT');
        expect(result.error.message).toContain('consecutive dots');
      }
    });
  });
});

describe('isValidEmail type guard', () => {
  it('should return true for valid email string', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email string', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });

  it('should return false for non-string values', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail({ email: 'test@example.com' })).toBe(false);
    expect(isValidEmail(['test@example.com'])).toBe(false);
  });
});

describe('validateEmails batch processing', () => {
  it('should separate valid and invalid emails', () => {
    const emails = [
      'valid@example.com',
      'also.valid@test.co.uk',
      'invalid',
      '',
      'another@valid.org'
    ];

    const result = validateEmails(emails);

    expect(result.valid.length).toBe(3);
    expect(result.invalid.length).toBe(2);
  });

  it('should include error details for invalid emails', () => {
    const result = validateEmails(['bad', 'good@example.com']);

    expect(result.invalid.length).toBe(1);
    expect(result.invalid[0]?.email).toBe('bad');
    expect(result.invalid[0]?.error.code).toBe('MISSING_AT');
  });

  it('should handle empty array', () => {
    const result = validateEmails([]);

    expect(result.valid.length).toBe(0);
    expect(result.invalid.length).toBe(0);
  });

  it('should handle all valid emails', () => {
    const result = validateEmails([
      'a@b.co',
      'test@example.com',
      'user+tag@domain.org'
    ]);

    expect(result.valid.length).toBe(3);
    expect(result.invalid.length).toBe(0);
  });

  it('should handle all invalid emails', () => {
    const result = validateEmails(['bad', 'also bad', '']);

    expect(result.valid.length).toBe(0);
    expect(result.invalid.length).toBe(3);
  });
});
