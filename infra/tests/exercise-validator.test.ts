import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { spawn } from 'bun'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { resolve, join } from 'path'

const PROJECT_ROOT = resolve(__dirname, '../..')
const VALIDATOR_PATH = resolve(PROJECT_ROOT, 'infra/scripts/exercise-validator.ts')
const FIXTURES_DIR = resolve(PROJECT_ROOT, 'examples/test-fixtures')
const TEST_CACHE_FILE = resolve(PROJECT_ROOT, '.exercise-cache.json')

// Helper to run the exercise validator
async function runValidator(args: string[]): Promise<{
  exitCode: number
  stdout: string
  stderr: string
}> {
  const proc = spawn({
    cmd: ['bun', 'run', VALIDATOR_PATH, ...args],
    cwd: PROJECT_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const stdoutChunks: Uint8Array[] = []
  const stderrChunks: Uint8Array[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readStream = async (reader: any, chunks: Uint8Array[]) => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  }

  await Promise.all([
    readStream(proc.stdout.getReader(), stdoutChunks),
    readStream(proc.stderr.getReader(), stderrChunks)
  ])

  const exitCode = await proc.exited
  return {
    exitCode,
    stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
    stderr: Buffer.concat(stderrChunks).toString('utf-8')
  }
}

describe('Exercise Validator', () => {
  beforeEach(() => {
    // Clear cache before each test
    if (existsSync(TEST_CACHE_FILE)) {
      unlinkSync(TEST_CACHE_FILE)
    }
  })

  afterAll(() => {
    // Cleanup
    if (existsSync(TEST_CACHE_FILE)) {
      unlinkSync(TEST_CACHE_FILE)
    }
  })

  describe('run command - Basic execution', () => {
    it('should run a simple TypeScript script', async () => {
      const result = await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello from test fixture!')
      expect(result.stdout).toContain('Timestamp:')
    })

    it('should pass arguments to the script', async () => {
      const result = await runValidator(['run', join(FIXTURES_DIR, 'hello.ts'), 'arg1', 'arg2'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('arg1')
      expect(result.stdout).toContain('arg2')
    })

    it('should capture stderr from scripts', async () => {
      const result = await runValidator(['run', join(FIXTURES_DIR, 'with-stderr.ts')])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('This goes to stdout')
      expect(result.stdout + result.stderr).toContain('This goes to stderr')
    })
  })

  describe('run command - Caching behavior', () => {
    it('should create a cache file after first run', async () => {
      await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])

      expect(existsSync(TEST_CACHE_FILE)).toBe(true)

      const cache = JSON.parse(readFileSync(TEST_CACHE_FILE, 'utf-8'))
      expect(cache.version).toBe('2.0')
      expect(Object.keys(cache.entries).length).toBeGreaterThan(0)
    })

    it('should skip execution on second run with same hash', async () => {
      // First run
      const firstRun = await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])
      expect(firstRun.stdout).toContain('Running:')

      // Second run should use cache
      const secondRun = await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])
      expect(secondRun.stdout).toContain('CACHED:')
      expect(secondRun.stdout).toContain('Skipped execution (hash unchanged)')
    })

    it('should re-run with --force flag', async () => {
      // First run
      await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])

      // Force run should not show cached
      const forceRun = await runValidator(['run', '--force', join(FIXTURES_DIR, 'hello.ts')])
      expect(forceRun.stdout).toContain('Running:')
      expect(forceRun.stdout).not.toContain('CACHED:')
    })
  })

  describe('cache command', () => {
    it('should show status for cached script', async () => {
      // First run to cache
      await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])

      // Check status
      const status = await runValidator(['cache', '--status', join(FIXTURES_DIR, 'hello.ts')])
      expect(status.stdout).toContain('Cache Status:')
      expect(status.stdout).toContain('Hash match:')
      expect(status.stdout).toContain('YES (would skip)')
    })

    it('should show no cache entry for uncached script', async () => {
      const status = await runValidator(['cache', '--status', join(FIXTURES_DIR, 'hello.ts')])
      expect(status.stdout).toContain('No cache entry')
    })

    it('should clear the cache', async () => {
      // First run to create cache
      await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])
      expect(existsSync(TEST_CACHE_FILE)).toBe(true)

      // Clear cache
      const clearResult = await runValidator(['cache', '--clear'])
      expect(clearResult.stdout).toContain('Cleared')

      // Cache should still exist but be empty
      const cache = JSON.parse(readFileSync(TEST_CACHE_FILE, 'utf-8'))
      expect(Object.keys(cache.entries).length).toBe(0)
    })

    it('should show cache stats', async () => {
      // First run to create cache
      await runValidator(['run', join(FIXTURES_DIR, 'hello.ts')])

      // Check stats
      const stats = await runValidator(['cache', '--stats'])
      expect(stats.stdout).toContain('Cache Statistics')
      expect(stats.stdout).toContain('Total entries:')
      expect(stats.stdout).toContain('Scripts:')
    })
  })

  describe('run command - Error handling', () => {
    it('should fail for non-existent script', async () => {
      const result = await runValidator(['run', 'non-existent.ts'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Script not found')
    })

    it('should reject non-TypeScript/JavaScript files', async () => {
      const result = await runValidator(['run', 'package.json'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Expected .ts, .tsx, or .js file')
    })
  })

  describe('Help command', () => {
    it('should show help with --help flag', async () => {
      const result = await runValidator(['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Unified Exercise Validator')
      expect(result.stdout).toContain('run')
      expect(result.stdout).toContain('validate')
      expect(result.stdout).toContain('cache')
    })

    it('should show help with no arguments', async () => {
      const result = await runValidator([])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Unified Exercise Validator')
    })
  })

  describe('Backwards compatibility', () => {
    it('should infer run command when given a .ts file directly', async () => {
      const result = await runValidator([join(FIXTURES_DIR, 'hello.ts')])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello from test fixture!')
    })
  })
})
