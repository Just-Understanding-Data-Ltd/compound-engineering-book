/**
 * CSV Reader CLI Tool
 *
 * This example demonstrates the walkthrough from Chapter 2 section 4.3:
 * "Your First Conversation: Hello World"
 *
 * The tool reads a CSV file and prints a summary with optional column filtering.
 * It demonstrates:
 * - Basic argument parsing patterns
 * - Result<T, E> error handling (from ch02 section 4.5)
 * - Clean CLI output formatting
 *
 * Usage:
 *   bun run csv-reader.ts data.csv
 *   bun run csv-reader.ts data.csv --filter=name
 *   bun run csv-reader.ts data.csv --filter=name,email
 *
 * @module ch02/csv-reader
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Result<T, E> pattern demonstrated in chapter
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

interface CSVSummary {
  filePath: string;
  rowCount: number;
  columnNames: string[];
  filteredColumns?: string[];
  sampleRows: string[][];
}

interface CSVError {
  code: 'FILE_NOT_FOUND' | 'PARSE_ERROR' | 'INVALID_ARGS';
  message: string;
}

/**
 * Parse command line arguments
 * Demonstrates: Basic argument parsing pattern from existing tools
 */
function parseArgs(args: string[]): Result<{ filePath: string; filterColumns?: string[] }, CSVError> {
  // Skip first two args (node, script)
  const relevantArgs = args.slice(2);

  const filePath = relevantArgs[0];
  if (!filePath) {
    return {
      success: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Usage: csv-reader.ts <file.csv> [--filter=col1,col2]'
      }
    };
  }

  let filterColumns: string[] | undefined;

  // Parse --filter flag
  const filterArg = relevantArgs.find(arg => arg.startsWith('--filter='));
  if (filterArg) {
    filterColumns = filterArg.replace('--filter=', '').split(',').map(c => c.trim());
  }

  return {
    success: true,
    data: { filePath, filterColumns }
  };
}

/**
 * Read and parse CSV file
 * Demonstrates: File reading with proper error handling
 */
function readCSV(filePath: string): Result<{ headers: string[]; rows: string[][] }, CSVError> {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    return {
      success: false,
      error: {
        code: 'FILE_NOT_FOUND',
        message: `File not found: ${absolutePath}`
      }
    };
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'CSV file is empty'
        }
      };
    }

    const headerLine = lines[0];
    if (!headerLine) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'CSV file has no header row'
        }
      };
    }
    const headers = parseCSVLine(headerLine);
    const rows = lines.slice(1).map(parseCSVLine);

    return {
      success: true,
      data: { headers, rows }
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
    };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Filter columns from CSV data
 */
function filterData(
  headers: string[],
  rows: string[][],
  filterColumns: string[]
): { headers: string[]; rows: string[][] } {
  const indices = filterColumns
    .map(col => headers.indexOf(col))
    .filter(i => i !== -1);

  if (indices.length === 0) {
    return { headers, rows };
  }

  const filteredHeaders = indices.map(i => headers[i] ?? '');
  const filteredRows = rows.map(row => indices.map(i => row[i] ?? ''));

  return { headers: filteredHeaders, rows: filteredRows };
}

/**
 * Generate summary of CSV data
 */
function generateSummary(
  filePath: string,
  headers: string[],
  rows: string[][],
  filteredColumns?: string[]
): CSVSummary {
  return {
    filePath: resolve(filePath),
    rowCount: rows.length,
    columnNames: headers,
    filteredColumns,
    sampleRows: rows.slice(0, 3) // First 3 rows as sample
  };
}

/**
 * Format and print summary
 * Demonstrates: Clean CLI output formatting
 */
function printSummary(summary: CSVSummary): void {
  console.log('\n=== CSV Summary ===\n');
  console.log(`File: ${summary.filePath}`);
  console.log(`Rows: ${summary.rowCount}`);
  console.log(`Columns: ${summary.columnNames.join(', ')}`);

  if (summary.filteredColumns && summary.filteredColumns.length > 0) {
    console.log(`Filtered to: ${summary.filteredColumns.join(', ')}`);
  }

  if (summary.sampleRows.length > 0) {
    console.log('\nSample data (first 3 rows):');
    console.log('-'.repeat(50));

    // Print header
    console.log(summary.columnNames.join(' | '));
    console.log('-'.repeat(50));

    // Print sample rows
    for (const row of summary.sampleRows) {
      console.log(row.join(' | '));
    }
  }

  console.log();
}

/**
 * Main entry point
 * Demonstrates: Complete CLI tool workflow
 */
function main(): void {
  // Parse arguments
  const argsResult = parseArgs(process.argv);
  if (argsResult.success === false) {
    console.error(`Error: ${argsResult.error.message}`);
    process.exit(1);
  }

  const { filePath, filterColumns } = argsResult.data;

  // Read CSV file
  const readResult = readCSV(filePath);
  if (readResult.success === false) {
    console.error(`Error [${readResult.error.code}]: ${readResult.error.message}`);
    process.exit(1);
  }

  let { headers, rows } = readResult.data;

  // Apply column filter if specified
  if (filterColumns && filterColumns.length > 0) {
    const filtered = filterData(headers, rows, filterColumns);
    headers = filtered.headers;
    rows = filtered.rows;
  }

  // Generate and print summary
  const summary = generateSummary(filePath, headers, rows, filterColumns);
  printSummary(summary);
}

// Run main function
main();
