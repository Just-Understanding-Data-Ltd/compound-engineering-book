/**
 * Tests for Chapter 4 Code Examples
 *
 * Tests the CLAUDE.md validation and hierarchical loading utilities.
 * These tests run without API calls using local validation functions.
 */

import { describe, test, expect } from 'bun:test';
import {
  validateLocally,
  generateReport,
  type ValidationResult,
} from './claude-md-validator';
import {
  collectClaudeMdFiles,
  loadHierarchicalContext,
  calculateRelevance,
  compareLoadingStrategies,
} from './hierarchical-loader';

// ============================================================================
// CLAUDE.md Validator Tests
// ============================================================================

describe('CLAUDE.md Validator', () => {
  describe('validateLocally', () => {
    test('validates minimal valid CLAUDE.md', () => {
      const content = `# Project

## Why
This project solves X problem.

## What
- TypeScript
- Node.js

## How
Run \`bun test\` to test.
`;
      const result = validateLocally(content, 'root');

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    test('flags missing WHY section', () => {
      const content = `# Project

## What
- TypeScript

## How
Run tests.
`;
      const result = validateLocally(content, 'root');

      const whyError = result.issues.find(
        i => i.category === 'framework' && i.message.includes('WHY')
      );
      expect(whyError).toBeDefined();
      expect(whyError?.severity).toBe('error');
    });

    test('flags missing WHAT section', () => {
      const content = `# Project

## Why
Solves problem X.

## How
Run tests.
`;
      const result = validateLocally(content, 'root');

      const whatError = result.issues.find(
        i => i.category === 'framework' && i.message.includes('WHAT')
      );
      expect(whatError).toBeDefined();
      expect(whatError?.severity).toBe('error');
    });

    test('flags style rules that should use tooling', () => {
      const content = `# Project

## Why
Solves problem X.

## What
TypeScript project.

## Conventions
- Use 2 spaces for indentation
- Always use single quotes
- Use camelCase for variables
`;
      const result = validateLocally(content, 'root');

      const styleWarnings = result.issues.filter(i => i.category === 'style-rule');
      expect(styleWarnings.length).toBeGreaterThan(0);
      expect(styleWarnings[0]!.severity).toBe('warning');
    });

    test('flags files exceeding line limit', () => {
      // Generate a long file
      const longContent = Array(350).fill('- Some instruction').join('\n');
      const result = validateLocally(longContent, 'root');

      const lengthError = result.issues.find(i => i.category === 'length');
      expect(lengthError).toBeDefined();
      expect(lengthError?.severity).toBe('error');
    });

    test('warns about large inline code blocks', () => {
      const content = `# Project

## Why
Purpose here.

## What
Stack here.

## Example

\`\`\`typescript
${Array(25).fill('const x = 1;').join('\n')}
\`\`\`
`;
      const result = validateLocally(content, 'root');

      const codeWarning = result.issues.find(i => i.category === 'inline-code');
      expect(codeWarning).toBeDefined();
      expect(codeWarning?.severity).toBe('warning');
    });

    test('uses different thresholds for domain level', () => {
      // 150 lines is OK for domain but not optimal for root
      const content = Array(150).fill('- Instruction').join('\n');

      const rootResult = validateLocally(content, 'root');
      const domainResult = validateLocally(content, 'domain');

      // Root should have warning for 150 lines (exceeds 100 optimal)
      expect(rootResult.issues.some(i => i.category === 'length')).toBe(true);

      // Domain should be OK (under 200 optimal)
      expect(domainResult.issues.filter(i => i.category === 'length' && i.severity === 'warning')).toHaveLength(0);
    });

    test('calculates score correctly', () => {
      // Valid file
      const validContent = `# Project

## Why
Purpose.

## What
Stack.

## How
Commands.
`;
      const validResult = validateLocally(validContent, 'root');
      expect(validResult.score).toBe(100);

      // File with 2 errors (missing WHY and WHAT)
      const invalidContent = `# Project

## Commands
Run tests.
`;
      const invalidResult = validateLocally(invalidContent, 'root');
      // 2 errors = -40 points
      expect(invalidResult.score).toBeLessThanOrEqual(60);
    });
  });

  describe('generateReport', () => {
    test('generates valid markdown report', () => {
      const result: ValidationResult = {
        isValid: false,
        lineCount: 150,
        score: 60,
        issues: [
          { severity: 'error', category: 'framework', message: 'Missing WHY section' },
          { severity: 'warning', category: 'style-rule', message: 'Style rule detected', line: 10 },
        ],
        suggestions: ['Add WHY section', 'Use linter for style'],
      };

      const report = generateReport(result);

      expect(report).toContain('# CLAUDE.md Validation Report');
      expect(report).toContain('NEEDS ATTENTION');
      expect(report).toContain('Score**: 60/100');
      expect(report).toContain('Line Count**: 150');
      expect(report).toContain('### Errors');
      expect(report).toContain('Missing WHY section');
      expect(report).toContain('### Warnings');
      expect(report).toContain('(line 10)');
      expect(report).toContain('## Suggestions');
    });

    test('generates VALID status for valid file', () => {
      const result: ValidationResult = {
        isValid: true,
        lineCount: 50,
        score: 100,
        issues: [],
        suggestions: [],
      };

      const report = generateReport(result);
      expect(report).toContain('VALID');
    });
  });
});

// ============================================================================
// Hierarchical Loader Tests
// ============================================================================

describe('Hierarchical CLAUDE.md Loader', () => {
  describe('collectClaudeMdFiles', () => {
    test('collects CLAUDE.md files from target to root', () => {
      const targetFile = '/project/packages/api/src/routes/users.ts';
      const rootDir = '/project';

      const files = collectClaudeMdFiles(targetFile, rootDir);

      // Should collect paths from root to target directory
      expect(files[0]).toBe('/project/CLAUDE.md');
      expect(files).toContain('/project/packages/CLAUDE.md');
      expect(files).toContain('/project/packages/api/CLAUDE.md');
      expect(files).toContain('/project/packages/api/src/CLAUDE.md');
      expect(files).toContain('/project/packages/api/src/routes/CLAUDE.md');
    });

    test('handles file at root level', () => {
      const targetFile = '/project/index.ts';
      const rootDir = '/project';

      const files = collectClaudeMdFiles(targetFile, rootDir);

      expect(files).toContain('/project/CLAUDE.md');
    });
  });

  describe('loadHierarchicalContext', () => {
    test('loads and combines CLAUDE.md files', () => {
      const fileContents = new Map<string, string>([
        ['/project/CLAUDE.md', '# Root\nGlobal rules.'],
        ['/project/packages/CLAUDE.md', '# Packages\nPackage rules.'],
        ['/project/packages/api/CLAUDE.md', '# API\nAPI rules.'],
      ]);

      const context = loadHierarchicalContext(
        '/project/packages/api/src/handler.ts',
        '/project',
        fileContents
      );

      expect(context.files).toHaveLength(3);
      expect(context.files[0]!.level).toBe('root');
      expect(context.files[1]!.level).toBe('domain');
      expect(context.files[2]!.level).toBe('domain');
      expect(context.combinedContent).toContain('Global rules');
      expect(context.combinedContent).toContain('API rules');
    });

    test('handles missing CLAUDE.md files gracefully', () => {
      const fileContents = new Map<string, string>([
        ['/project/CLAUDE.md', '# Root only'],
      ]);

      const context = loadHierarchicalContext(
        '/project/packages/api/src/handler.ts',
        '/project',
        fileContents
      );

      // Should only load root since others don't exist
      expect(context.files).toHaveLength(1);
      expect(context.files[0]!.path).toBe('/project/CLAUDE.md');
    });

    test('calculates total lines correctly', () => {
      const fileContents = new Map<string, string>([
        ['/project/CLAUDE.md', 'Line 1\nLine 2\nLine 3'], // 3 lines
        ['/project/packages/CLAUDE.md', 'Line 1\nLine 2'], // 2 lines
      ]);

      const context = loadHierarchicalContext(
        '/project/packages/file.ts',
        '/project',
        fileContents
      );

      expect(context.totalLines).toBe(5);
    });
  });

  describe('calculateRelevance', () => {
    test('calculates relevance metrics', () => {
      const context = {
        targetFile: '/project/src/file.ts',
        files: [
          { level: 'root' as const, path: '/project/CLAUDE.md', content: 'x', lineCount: 40 },
          { level: 'domain' as const, path: '/project/src/CLAUDE.md', content: 'y', lineCount: 160 },
        ],
        totalLines: 200,
        combinedContent: 'combined',
      };

      const metrics = calculateRelevance(context, 180);

      expect(metrics.totalLines).toBe(200);
      expect(metrics.relevantLines).toBe(180);
      expect(metrics.relevancePercentage).toBe(90);
      expect(metrics.loadedFiles).toBe(2);
    });

    test('estimates 90% relevance when not provided', () => {
      const context = {
        targetFile: '/project/src/file.ts',
        files: [
          { level: 'root' as const, path: '/project/CLAUDE.md', content: 'x', lineCount: 100 },
        ],
        totalLines: 100,
        combinedContent: 'combined',
      };

      const metrics = calculateRelevance(context);

      expect(metrics.relevancePercentage).toBe(90);
    });
  });

  describe('compareLoadingStrategies', () => {
    test('compares monolithic vs hierarchical', () => {
      const context = {
        targetFile: '/project/src/file.ts',
        files: [
          { level: 'root' as const, path: '/project/CLAUDE.md', content: 'x', lineCount: 50 },
          { level: 'domain' as const, path: '/project/src/CLAUDE.md', content: 'y', lineCount: 200 },
        ],
        totalLines: 250,
        combinedContent: 'combined',
      };

      const comparison = compareLoadingStrategies(
        8500,  // Monolithic lines
        800,   // Relevant lines in monolithic
        context
      );

      // Monolithic: 800/8500 = 9.4%
      expect(comparison.monolithic.relevancePercentage).toBe(9);

      // Hierarchical: 225/250 = 90%
      expect(comparison.hierarchical.relevancePercentage).toBe(90);

      // Context reduction: (8500-250)/8500 = 97%
      expect(comparison.contextReduction).toBe(97);

      // Relevance improvement: 90 - 9 = 81%
      expect(comparison.relevanceImprovement).toBe(81);
    });
  });
});

// ============================================================================
// Integration Test: Full Validation Flow
// ============================================================================

describe('Integration: Full Validation Flow', () => {
  test('validates a complete good CLAUDE.md', () => {
    const goodClaudeMd = `# E-Commerce Platform

## Why

Multi-vendor marketplace connecting local artisans with global customers.
Enables small businesses to reach international markets.

## What

**Stack**:
- Next.js 14 with App Router
- TypeScript in strict mode
- tRPC for type-safe APIs
- Prisma with PostgreSQL

**Structure**:
- \`/packages/web\` - Next.js frontend
- \`/packages/api\` - tRPC backend
- \`/packages/database\` - Prisma schema and migrations

## How

**Development**:
\`\`\`bash
bun install
bun dev
\`\`\`

**Before Committing**:
\`\`\`bash
bun test
bun build
\`\`\`

## Conventions

- Factory functions for services, never classes
- Return Result<T, E> types, never throw
- See \`packages/api/CLAUDE.md\` for API patterns
`;

    const result = validateLocally(goodClaudeMd, 'root');

    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.lineCount).toBeLessThan(100);
  });

  test('flags problematic CLAUDE.md comprehensively', () => {
    const badClaudeMd = `# Project

Use 2 spaces for indentation.
Use camelCase for variables.
Always use single quotes.
Trailing commas required.

${Array(400).fill('- Random instruction').join('\n')}
`;

    const result = validateLocally(badClaudeMd, 'root');

    expect(result.isValid).toBe(false);
    expect(result.score).toBeLessThan(50);

    // Should have length error
    expect(result.issues.some(i => i.category === 'length')).toBe(true);

    // Should have style warnings
    expect(result.issues.some(i => i.category === 'style-rule')).toBe(true);

    // Should have framework errors (missing sections)
    expect(result.issues.some(i => i.category === 'framework')).toBe(true);
  });
});
