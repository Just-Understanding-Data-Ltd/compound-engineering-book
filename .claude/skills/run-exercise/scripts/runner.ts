#!/usr/bin/env bun
/**
 * Exercise Runner with Hash-Based Caching
 *
 * Only runs TypeScript exercises if their content has changed.
 * Prevents costly duplicate runs during book development.
 *
 * Usage:
 *   bun runner.ts <script.ts> [args...]
 *   bun runner.ts --force <script.ts> [args...]
 *   bun runner.ts --clear-cache
 *   bun runner.ts --status <script.ts>
 */

import { spawn } from 'bun'
import { createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import { resolve, basename } from 'path'

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  hash: string
  lastRun: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

interface Cache {
  version: string
  entries: Record<string, CacheEntry>
}

// ============================================================================
// Configuration
// ============================================================================

const CACHE_FILE = resolve(process.cwd(), '.exercise-cache.json')
const MAX_OUTPUT_SIZE = 10 * 1024 // 10KB max per output stream
const CACHE_VERSION = '1.0'

// ============================================================================
// Cache Management
// ============================================================================

function loadCache(): Cache {
  if (!existsSync(CACHE_FILE)) {
    return { version: CACHE_VERSION, entries: {} }
  }

  try {
    const data = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    if (data.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, starting fresh')
      return { version: CACHE_VERSION, entries: {} }
    }
    return data
  } catch (e) {
    console.log('Cache corrupted, starting fresh')
    return { version: CACHE_VERSION, entries: {} }
  }
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + `\n... [truncated, ${text.length - maxLen} bytes omitted]`
}

// ============================================================================
// Script Execution
// ============================================================================

async function runScript(scriptPath: string, args: string[]): Promise<CacheEntry> {
  const content = readFileSync(scriptPath, 'utf-8')
  const hash = computeHash(content)
  const startTime = Date.now()

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${basename(scriptPath)}`)
  console.log(`Hash: ${hash}`)
  console.log(`${'='.repeat(60)}\n`)

  const proc = spawn({
    cmd: ['bun', 'run', scriptPath, ...args],
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    }
  })

  // Collect output
  const stdoutChunks: Uint8Array[] = []
  const stderrChunks: Uint8Array[] = []

  // Stream stdout
  const stdoutReader = proc.stdout.getReader()
  const stderrReader = proc.stderr.getReader()

  const readStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    chunks: Uint8Array[],
    stream: NodeJS.WriteStream
  ) => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      stream.write(value)
    }
  }

  await Promise.all([
    readStream(stdoutReader, stdoutChunks, process.stdout),
    readStream(stderrReader, stderrChunks, process.stderr)
  ])

  const exitCode = await proc.exited
  const duration = Date.now() - startTime

  const stdout = Buffer.concat(stdoutChunks).toString('utf-8')
  const stderr = Buffer.concat(stderrChunks).toString('utf-8')

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Completed in ${duration}ms with exit code ${exitCode}`)
  console.log(`${'='.repeat(60)}\n`)

  return {
    hash,
    lastRun: new Date().toISOString(),
    exitCode,
    stdout: truncate(stdout, MAX_OUTPUT_SIZE),
    stderr: truncate(stderr, MAX_OUTPUT_SIZE),
    duration
  }
}

// ============================================================================
// Commands
// ============================================================================

function showStatus(scriptPath: string): void {
  const cache = loadCache()
  const absPath = resolve(scriptPath)
  const entry = cache.entries[absPath]

  if (!entry) {
    console.log(`No cache entry for: ${scriptPath}`)
    return
  }

  if (!existsSync(absPath)) {
    console.log(`Script not found: ${scriptPath}`)
    return
  }

  const content = readFileSync(absPath, 'utf-8')
  const currentHash = computeHash(content)
  const hashMatch = currentHash === entry.hash

  console.log(`\nCache Status: ${basename(scriptPath)}`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Current hash:  ${currentHash}`)
  console.log(`Cached hash:   ${entry.hash}`)
  console.log(`Hash match:    ${hashMatch ? 'YES (would skip)' : 'NO (would run)'}`)
  console.log(`Last run:      ${entry.lastRun}`)
  console.log(`Exit code:     ${entry.exitCode}`)
  console.log(`Duration:      ${entry.duration}ms`)
  console.log(`${'='.repeat(50)}\n`)
}

function clearCache(): void {
  if (existsSync(CACHE_FILE)) {
    const cache = loadCache()
    const count = Object.keys(cache.entries).length
    writeFileSync(CACHE_FILE, JSON.stringify({ version: CACHE_VERSION, entries: {} }, null, 2))
    console.log(`Cleared ${count} cache entries`)
  } else {
    console.log('No cache file found')
  }
}

function showHelp(): void {
  console.log(`
Exercise Runner - Hash-Based TypeScript Caching

Usage:
  bun runner.ts <script.ts> [args...]     Run script (cached if unchanged)
  bun runner.ts --force <script.ts>       Force re-run ignoring cache
  bun runner.ts --status <script.ts>      Show cache status for script
  bun runner.ts --clear-cache             Clear all cached results
  bun runner.ts --help                    Show this help

Examples:
  bun runner.ts examples/ch04/email-agent.ts
  bun runner.ts --force examples/ch04/email-agent.ts
  bun runner.ts --status examples/ch04/email-agent.ts
`)
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    showHelp()
    process.exit(0)
  }

  if (args.includes('--clear-cache')) {
    clearCache()
    process.exit(0)
  }

  if (args.includes('--status')) {
    const idx = args.indexOf('--status')
    const scriptPath = args[idx + 1]
    if (!scriptPath) {
      console.error('Error: --status requires a script path')
      process.exit(1)
    }
    showStatus(scriptPath)
    process.exit(0)
  }

  // Parse force flag
  const force = args.includes('--force')
  const filteredArgs = args.filter(a => a !== '--force')

  if (filteredArgs.length === 0) {
    console.error('Error: No script path provided')
    showHelp()
    process.exit(1)
  }

  const scriptPath = filteredArgs[0]
  const scriptArgs = filteredArgs.slice(1)
  const absPath = resolve(scriptPath)

  // Validate script exists
  if (!existsSync(absPath)) {
    console.error(`Error: Script not found: ${scriptPath}`)
    process.exit(1)
  }

  // Validate it's a TypeScript file
  if (!absPath.endsWith('.ts') && !absPath.endsWith('.tsx')) {
    console.error(`Error: Expected .ts or .tsx file, got: ${scriptPath}`)
    process.exit(1)
  }

  // Load cache and compute current hash
  const cache = loadCache()
  const content = readFileSync(absPath, 'utf-8')
  const currentHash = computeHash(content)
  const cachedEntry = cache.entries[absPath]

  // Check if we can use cached result
  if (!force && cachedEntry && cachedEntry.hash === currentHash) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`CACHED: ${basename(scriptPath)}`)
    console.log(`Hash: ${currentHash} (unchanged)`)
    console.log(`Last run: ${cachedEntry.lastRun}`)
    console.log(`Duration: ${cachedEntry.duration}ms`)
    console.log(`${'='.repeat(60)}\n`)

    if (cachedEntry.stdout) {
      console.log('--- Cached stdout ---')
      console.log(cachedEntry.stdout)
    }

    if (cachedEntry.stderr) {
      console.log('--- Cached stderr ---')
      console.error(cachedEntry.stderr)
    }

    console.log(`\nSkipped execution (hash unchanged). Use --force to re-run.`)
    process.exit(cachedEntry.exitCode)
  }

  // Run the script
  try {
    const result = await runScript(absPath, scriptArgs)

    // Update cache
    cache.entries[absPath] = result
    saveCache(cache)

    console.log(`Result cached. Use --status ${scriptPath} to check.`)
    process.exit(result.exitCode)
  } catch (e) {
    console.error('Execution failed:', e)
    process.exit(1)
  }
}

main()
