#!/usr/bin/env bun
/**
 * Unified Exercise Validator
 *
 * A single tool for:
 * 1. Running individual TypeScript/JavaScript exercises with hash-based caching
 * 2. Parsing markdown files and validating all code blocks
 *
 * Usage:
 *   # Run a single script
 *   bun exercise-validator.ts run <script.ts> [args...]
 *   bun exercise-validator.ts run --force <script.ts>
 *
 *   # Validate markdown code blocks
 *   bun exercise-validator.ts validate <markdown-file-or-glob>
 *   bun exercise-validator.ts validate --all
 *   bun exercise-validator.ts validate --check chapters/ch01.md
 *
 *   # Cache management
 *   bun exercise-validator.ts cache --status <script.ts>
 *   bun exercise-validator.ts cache --clear
 *   bun exercise-validator.ts cache --stats
 */

import { spawn } from 'bun'
import { createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { resolve, basename, dirname, join } from 'path'
import { Glob } from 'bun'

// ============================================================================
// Types
// ============================================================================

interface ScriptCacheEntry {
  type: 'script'
  hash: string
  lastRun: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

interface BlockCacheEntry {
  type: 'block'
  hash: string
  success: boolean
  exitCode: number
  stderr: string
  duration: number
  timestamp: string
}

type CacheEntry = ScriptCacheEntry | BlockCacheEntry

interface Cache {
  version: string
  entries: Record<string, CacheEntry>
}

interface CodeBlock {
  language: string
  code: string
  lineNumber: number
  filename?: string
  skip?: boolean
  skipReason?: string
}

interface ValidationResult {
  file: string
  block: CodeBlock
  hash: string
  success: boolean
  exitCode: number
  stdout: string
  stderr: string
  duration: number
  timedOut: boolean
  skipped: boolean
  skipReason?: string
  cached: boolean
}

// ============================================================================
// Configuration
// ============================================================================

const CACHE_FILE = resolve(process.cwd(), '.exercise-cache.json')
const TEMP_DIR = resolve(process.cwd(), '.exercise-validation-tmp')
const CACHE_VERSION = '2.0'
const MAX_OUTPUT_SIZE = 10 * 1024 // 10KB
const DEFAULT_TIMEOUT_MS = 120000 // 2 minutes

// Languages we can execute
const EXECUTABLE_LANGUAGES = new Set(['bash', 'sh', 'typescript', 'ts', 'javascript', 'js'])

// Skip markers in code blocks
const SKIP_MARKERS = [
  '# skip-validation',
  '// skip-validation',
  '<!-- skip-validation -->',
  'skip-validation',
]

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
  } catch {
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
// Script Execution (for individual files)
// ============================================================================

async function runScript(
  scriptPath: string,
  args: string[],
  options: { silent?: boolean; timeoutMs?: number } = {}
): Promise<ScriptCacheEntry & { timedOut?: boolean }> {
  const content = readFileSync(scriptPath, 'utf-8')
  const hash = computeHash(content)
  const startTime = Date.now()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  // Determine command based on file extension
  let cmd: string[]
  if (scriptPath.endsWith('.sh') || scriptPath.endsWith('.bash')) {
    cmd = ['bash', scriptPath, ...args]
  } else {
    cmd = ['bun', 'run', scriptPath, ...args]
  }

  if (!options.silent) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running: ${basename(scriptPath)}`)
    console.log(`Hash: ${hash}`)
    console.log(`Timeout: ${timeoutMs / 1000}s`)
    console.log(`${'='.repeat(60)}\n`)
  }

  const proc = spawn({
    cmd,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      CI: '1',
    }
  })

  const stdoutChunks: Uint8Array[] = []
  const stderrChunks: Uint8Array[] = []
  let timedOut = false

  // Set up timeout
  const timeout = setTimeout(() => {
    timedOut = true
    proc.kill()
  }, timeoutMs)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readStream = async (reader: any, chunks: Uint8Array[], stream?: NodeJS.WriteStream) => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        if (stream) stream.write(value)
      }
    } catch {
      // Stream closed (timeout or normal exit)
    }
  }

  await Promise.all([
    readStream(proc.stdout.getReader(), stdoutChunks, options.silent ? undefined : process.stdout),
    readStream(proc.stderr.getReader(), stderrChunks, options.silent ? undefined : process.stderr)
  ])

  clearTimeout(timeout)

  const exitCode = await proc.exited
  const duration = Date.now() - startTime

  const stdout = Buffer.concat(stdoutChunks).toString('utf-8')
  const stderr = Buffer.concat(stderrChunks).toString('utf-8')

  if (!options.silent) {
    console.log(`\n${'='.repeat(60)}`)
    if (timedOut) {
      console.log(`TIMED OUT after ${duration}ms`)
    } else {
      console.log(`Completed in ${duration}ms with exit code ${exitCode}`)
    }
    console.log(`${'='.repeat(60)}\n`)
  }

  return {
    type: 'script',
    hash,
    lastRun: new Date().toISOString(),
    exitCode: timedOut ? -1 : exitCode,
    stdout: truncate(stdout, MAX_OUTPUT_SIZE),
    stderr: timedOut ? `Execution timed out after ${timeoutMs}ms` : truncate(stderr, MAX_OUTPUT_SIZE),
    duration,
    timedOut,
  }
}

// ============================================================================
// Markdown Parsing
// ============================================================================

function extractCodeBlocks(markdown: string, _filePath?: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const lines = markdown.split('\n')

  let inBlock = false
  let currentBlock: Partial<CodeBlock> = {}
  let blockContent: string[] = []
  let blockStartLine = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (!inBlock && line.match(/^```(\w+)?/)) {
      inBlock = true
      const match = line.match(/^```(\w+)?(?:\s+(.*))?/)
      currentBlock = {
        language: match?.[1]?.toLowerCase() || 'text',
        filename: match?.[2],
        lineNumber: i + 1,
      }
      blockContent = []
      blockStartLine = i + 1
    } else if (inBlock && line.match(/^```\s*$/)) {
      inBlock = false
      const code = blockContent.join('\n')

      const shouldSkip = SKIP_MARKERS.some(marker => code.includes(marker))

      blocks.push({
        language: currentBlock.language || 'text',
        code,
        lineNumber: blockStartLine,
        filename: currentBlock.filename,
        skip: shouldSkip,
        skipReason: shouldSkip ? 'Contains skip-validation marker' : undefined,
      })

      currentBlock = {}
      blockContent = []
    } else if (inBlock) {
      blockContent.push(line)
    }
  }

  return blocks
}

function isExecutable(block: CodeBlock): boolean {
  return EXECUTABLE_LANGUAGES.has(block.language)
}

// ============================================================================
// Code Block Execution
// ============================================================================

async function executeCodeBlock(
  block: CodeBlock,
  filePath: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ValidationResult> {
  const hash = computeHash(block.code + block.language)
  const startTime = Date.now()

  if (block.skip) {
    return {
      file: filePath,
      block,
      hash,
      success: true,
      exitCode: 0,
      stdout: '',
      stderr: '',
      duration: 0,
      timedOut: false,
      skipped: true,
      skipReason: block.skipReason,
      cached: false,
    }
  }

  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true })
  }

  let ext: string
  let cmd: string[]

  switch (block.language) {
    case 'bash':
    case 'sh':
      ext = '.sh'
      cmd = ['bash']
      break
    case 'typescript':
    case 'ts':
      ext = '.ts'
      cmd = ['bun', 'run']
      break
    case 'javascript':
    case 'js':
      ext = '.js'
      cmd = ['bun', 'run']
      break
    default:
      return {
        file: filePath,
        block,
        hash,
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        duration: 0,
        timedOut: false,
        skipped: true,
        skipReason: `Unsupported language: ${block.language}`,
        cached: false,
      }
  }

  const tempFile = join(TEMP_DIR, `block-${hash}${ext}`)
  writeFileSync(tempFile, block.code)

  try {
    const proc = spawn({
      cmd: [...cmd, tempFile],
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        CI: '1',
        NODE_OPTIONS: '--max-old-space-size=256',
      }
    })

    const stdoutChunks: Uint8Array[] = []
    const stderrChunks: Uint8Array[] = []

    const timeout = setTimeout(() => {
      proc.kill()
    }, timeoutMs)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readStream = async (reader: any, chunks: Uint8Array[]) => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
      } catch {
        // Stream closed
      }
    }

    await Promise.all([
      readStream(proc.stdout.getReader(), stdoutChunks),
      readStream(proc.stderr.getReader(), stderrChunks)
    ])

    clearTimeout(timeout)

    const exitCode = await proc.exited
    const duration = Date.now() - startTime
    const timedOut = duration >= timeoutMs

    const stdout = truncate(Buffer.concat(stdoutChunks).toString('utf-8'), MAX_OUTPUT_SIZE)
    const stderr = truncate(Buffer.concat(stderrChunks).toString('utf-8'), MAX_OUTPUT_SIZE)

    return {
      file: filePath,
      block,
      hash,
      success: exitCode === 0 && !stderr && !timedOut,
      exitCode,
      stdout,
      stderr,
      duration,
      timedOut,
      skipped: false,
      cached: false,
    }
  } catch (e) {
    return {
      file: filePath,
      block,
      hash,
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: e instanceof Error ? e.message : String(e),
      duration: Date.now() - startTime,
      timedOut: false,
      skipped: false,
      cached: false,
    }
  }
}

// ============================================================================
// Markdown Validation
// ============================================================================

async function validateMarkdownFile(
  filePath: string,
  cache: Cache,
  options: { checkOnly?: boolean; verbose?: boolean } = {}
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return results
  }

  const content = readFileSync(filePath, 'utf-8')
  const blocks = extractCodeBlocks(content, filePath)
  const executableBlocks = blocks.filter(isExecutable)

  if (options.verbose) {
    console.log(`\n${basename(filePath)}: ${executableBlocks.length} executable blocks`)
  }

  for (const block of executableBlocks) {
    const hash = computeHash(block.code + block.language)
    const cacheKey = `block:${filePath}:${block.lineNumber}:${hash}`

    const cached = cache.entries[cacheKey] as BlockCacheEntry | undefined
    if (cached && cached.hash === hash) {
      if (options.verbose) {
        const status = cached.success ? '✓' : '✗'
        console.log(`  ${status} Line ${block.lineNumber} [${block.language}] (cached)`)
      }

      results.push({
        file: filePath,
        block,
        hash,
        success: cached.success,
        exitCode: cached.exitCode,
        stdout: '',
        stderr: cached.stderr,
        duration: cached.duration,
        timedOut: false,
        skipped: false,
        cached: true,
      })
      continue
    }

    if (options.checkOnly) {
      console.log(`  ? Line ${block.lineNumber} [${block.language}] (not cached)`)
      continue
    }

    if (options.verbose) {
      process.stdout.write(`  ⋯ Line ${block.lineNumber} [${block.language}]`)
    }

    const result = await executeCodeBlock(block, filePath)
    results.push(result)

    if (!result.skipped) {
      cache.entries[cacheKey] = {
        type: 'block',
        hash: result.hash,
        success: result.success,
        exitCode: result.exitCode,
        stderr: result.stderr,
        duration: result.duration,
        timestamp: new Date().toISOString(),
      }
    }

    if (options.verbose) {
      if (result.skipped) {
        console.log(` ⊘ (skipped: ${result.skipReason})`)
      } else if (result.success) {
        console.log(` ✓ (${result.duration}ms)`)
      } else if (result.timedOut) {
        console.log(` ⏱ (timeout)`)
      } else {
        console.log(` ✗ (exit ${result.exitCode})`)
        if (result.stderr) {
          console.log(`    stderr: ${result.stderr.slice(0, 200)}`)
        }
      }
    }
  }

  return results
}

// ============================================================================
// CLI Commands
// ============================================================================

function showHelp(): void {
  console.log(`
Unified Exercise Validator
==========================

Run individual scripts or validate markdown code blocks with hash-based caching.

Commands:

  run <script.ts> [args...]     Run a TypeScript/JavaScript file
    --force                     Force re-run ignoring cache

  validate <file-or-pattern>    Validate code blocks in markdown files
    --all                       Validate all chapters/*.md
    --check                     Check cache status only, don't execute
    -v, --verbose               Show detailed output

  cache                         Cache management
    --status <script.ts>        Show cache status for a script
    --clear                     Clear entire cache
    --stats                     Show cache statistics

  --help                        Show this help

Examples:

  # Run a single exercise
  bun exercise-validator.ts run examples/ch04/agent.ts

  # Force re-run
  bun exercise-validator.ts run --force examples/ch04/agent.ts

  # Validate a chapter
  bun exercise-validator.ts validate chapters/ch04.md -v

  # Validate all chapters
  bun exercise-validator.ts validate --all -v

  # Check what would run (no execution)
  bun exercise-validator.ts validate --check chapters/ch04.md

  # View cache stats
  bun exercise-validator.ts cache --stats
`)
}

function showCacheStatus(scriptPath: string): void {
  const cache = loadCache()
  const absPath = resolve(scriptPath)
  const cacheKey = `script:${absPath}`
  const entry = cache.entries[cacheKey] as ScriptCacheEntry | undefined

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

function showCacheStats(): void {
  const cache = loadCache()
  const entries = Object.entries(cache.entries)
  const scripts = entries.filter(([, e]) => e.type === 'script')
  const blocks = entries.filter(([, e]) => e.type === 'block')
  const successBlocks = blocks.filter(([, e]) => (e as BlockCacheEntry).success)
  const failedBlocks = blocks.filter(([, e]) => !(e as BlockCacheEntry).success)

  const totalDuration = entries.reduce((sum, [, e]) => sum + (e.duration || 0), 0)

  console.log(`
Cache Statistics
================
Version: ${cache.version}
Total entries: ${entries.length}

Scripts: ${scripts.length}
Code blocks: ${blocks.length}
  Successful: ${successBlocks.length}
  Failed: ${failedBlocks.length}

Total execution time: ${(totalDuration / 1000).toFixed(1)}s
`)
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

// ============================================================================
// Main
// ============================================================================

async function handleRun(args: string[]): Promise<void> {
  const force = args.includes('--force')
  const filteredArgs = args.filter(a => a !== '--force')

  if (filteredArgs.length === 0) {
    console.error('Error: No script path provided')
    process.exit(1)
  }

  const scriptPath = filteredArgs[0]!
  const scriptArgs = filteredArgs.slice(1)
  const absPath = resolve(scriptPath)

  if (!existsSync(absPath)) {
    console.error(`Error: Script not found: ${scriptPath}`)
    process.exit(1)
  }

  const validExtensions = ['.ts', '.tsx', '.js', '.sh', '.bash']
  const hasValidExtension = validExtensions.some(ext => absPath.endsWith(ext))
  if (!hasValidExtension) {
    console.error(`Error: Expected .ts, .tsx, .js, .sh, or .bash file, got: ${scriptPath}`)
    process.exit(1)
  }

  const cache = loadCache()
  const content = readFileSync(absPath, 'utf-8')
  const currentHash = computeHash(content)
  const cacheKey = `script:${absPath}`
  const cachedEntry = cache.entries[cacheKey] as ScriptCacheEntry | undefined

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

  try {
    const result = await runScript(absPath, scriptArgs)
    // Store without timedOut field in cache (it's derived from exitCode -1)
    const { timedOut: _, ...cacheResult } = result
    cache.entries[cacheKey] = cacheResult
    saveCache(cache)

    if (result.timedOut) {
      console.log(`\nScript timed out. Use --force to re-run.`)
      process.exit(1)
    }

    console.log(`Result cached. Use 'cache --status ${scriptPath}' to check.`)
    process.exit(result.exitCode)
  } catch (e) {
    console.error('Execution failed:', e)
    process.exit(1)
  }
}

async function handleValidate(args: string[]): Promise<void> {
  const verbose = args.includes('--verbose') || args.includes('-v')
  const checkOnly = args.includes('--check')
  const all = args.includes('--all')

  const cache = loadCache()
  let files: string[] = []

  if (all) {
    const chaptersDir = resolve(process.cwd(), 'chapters')
    if (existsSync(chaptersDir)) {
      const glob = new Glob('**/*.md')
      for await (const file of glob.scan(chaptersDir)) {
        files.push(join(chaptersDir, file))
      }
    }
  } else {
    const patterns = args.filter(a => !a.startsWith('-'))
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const glob = new Glob(pattern)
        for await (const file of glob.scan(process.cwd())) {
          files.push(resolve(process.cwd(), file))
        }
      } else {
        files.push(resolve(process.cwd(), pattern))
      }
    }
  }

  if (files.length === 0) {
    console.error('No files found to validate')
    process.exit(1)
  }

  console.log(`Validating ${files.length} file(s)...`)

  let allResults: ValidationResult[] = []
  let totalBlocks = 0
  let successCount = 0
  let failCount = 0
  let skipCount = 0

  for (const file of files) {
    const results = await validateMarkdownFile(file, cache, { checkOnly, verbose })
    allResults = allResults.concat(results)

    for (const r of results) {
      totalBlocks++
      if (r.skipped) skipCount++
      else if (r.success) successCount++
      else failCount++
    }
  }

  saveCache(cache)

  // Calculate score (0-100)
  // Score = passed / (passed + failed) * 100
  // Skipped blocks don't count toward the score
  const testedBlocks = successCount + failCount
  const score = testedBlocks === 0 ? 100 : Math.round((successCount / testedBlocks) * 100)
  const isPerfect = failCount === 0

  console.log(`
Summary
=======
Files validated: ${files.length}
Code blocks: ${totalBlocks}
  ✓ Passed: ${successCount}
  ✗ Failed: ${failCount}
  ⊘ Skipped: ${skipCount}

${'='.repeat(40)}
VALIDATION SCORE: ${score}/100 ${isPerfect ? '✓ PERFECT' : '✗ NEEDS WORK'}
${'='.repeat(40)}
`)

  const failures = allResults.filter(r => !r.success && !r.skipped)
  if (failures.length > 0) {
    console.log('Failures:')
    for (const f of failures) {
      console.log(`  ${f.file}:${f.block.lineNumber} [${f.block.language}]`)
      if (f.timedOut) {
        console.log(`    Timed out after ${f.duration}ms`)
      } else if (f.stderr) {
        console.log(`    ${f.stderr.slice(0, 200)}`)
      }
    }
  }

  // Exit with score-based code for RALPH
  // Exit 0 only if perfect (100/100)
  process.exit(isPerfect ? 0 : 1)
}

function handleCache(args: string[]): void {
  if (args.includes('--clear')) {
    clearCache()
    process.exit(0)
  }

  if (args.includes('--stats')) {
    showCacheStats()
    process.exit(0)
  }

  if (args.includes('--status')) {
    const idx = args.indexOf('--status')
    const scriptPath = args[idx + 1]
    if (!scriptPath) {
      console.error('Error: --status requires a script path')
      process.exit(1)
    }
    showCacheStatus(scriptPath)
    process.exit(0)
  }

  console.error('Error: Unknown cache command. Use --clear, --stats, or --status <path>')
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  const command = args[0]!
  const subArgs = args.slice(1)

  switch (command) {
    case 'run':
      await handleRun(subArgs)
      break
    case 'validate':
      await handleValidate(subArgs)
      break
    case 'cache':
      handleCache(subArgs)
      break
    default:
      // Backwards compatibility: if first arg is a file path, assume 'run'
      if (command.endsWith('.ts') || command.endsWith('.tsx') || command.endsWith('.js')) {
        await handleRun(args)
      } else if (command.endsWith('.md') || command.includes('*')) {
        await handleValidate(args)
      } else {
        console.error(`Unknown command: ${command}`)
        showHelp()
        process.exit(1)
      }
  }
}

main()
