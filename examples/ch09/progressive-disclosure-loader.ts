/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * Progressive Disclosure Skill Loader
 *
 * This file demonstrates dynamic skill loading from the filesystem with:
 * - File-based skill registry (loading from skills/ directory)
 * - Lazy loading of Level 3 supplementary resources
 * - Model-aware loading (fast model for discovery, capable model for execution)
 * - Caching layer for frequently-used skill combinations
 * - Metrics tracking (tokens loaded, skill discovery rate, cost savings)
 *
 * Source: progressive-disclosure-context.md KB article
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Skill metadata (Level 1) - minimal info loaded at startup
 */
export interface SkillMetadata {
  /** Unique skill identifier */
  name: string;
  /** Brief description */
  description: string;
  /** Trigger words that activate this skill */
  triggers: string[];
  /** File path to full skill content */
  path: string;
  /** Estimated token cost of metadata */
  metadataTokens: number;
}

/**
 * Loaded skill content (Level 2 + Level 3)
 */
export interface LoadedSkill {
  /** Skill identifier */
  name: string;
  /** Core instructions content */
  coreContent: string;
  /** Token count for core */
  coreTokens: number;
  /** Supplementary resources loaded */
  supplementary: LoadedResource[];
  /** Total tokens loaded */
  totalTokens: number;
  /** Load timestamp */
  loadedAt: number;
}

/**
 * Supplementary resource (Level 3)
 */
export interface LoadedResource {
  /** Resource name/path */
  name: string;
  /** Full content */
  content: string;
  /** Token count */
  tokens: number;
}

/**
 * Skill loader configuration
 */
export interface LoaderConfig {
  /** Base directory for skills */
  skillsDir: string;
  /** Enable caching */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
  /** Maximum cached skills */
  maxCachedSkills: number;
  /** Enable metrics tracking */
  enableMetrics: boolean;
}

/**
 * Loader metrics
 */
export interface LoaderMetrics {
  /** Total skill loads */
  totalLoads: number;
  /** Cache hits */
  cacheHits: number;
  /** Cache misses */
  cacheMisses: number;
  /** Total tokens loaded */
  totalTokensLoaded: number;
  /** Tokens saved by caching */
  tokensSavedByCache: number;
  /** Skill discovery accuracy (correct skill for task) */
  skillDiscoveryHits: number;
  /** Total skill discovery attempts */
  skillDiscoveryAttempts: number;
  /** Average load time in ms */
  averageLoadTimeMs: number;
  /** Load times for averaging */
  loadTimes: number[];
}

/**
 * Model selection for different phases
 */
export type ModelTier = "fast" | "capable" | "powerful";

export interface ModelConfig {
  fast: string; // Haiku for skill selection
  capable: string; // Sonnet for execution
  powerful: string; // Opus for complex tasks
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_CONFIG: LoaderConfig = {
  skillsDir: "./skills",
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxCachedSkills: 20,
  enableMetrics: true,
};

export const DEFAULT_MODELS: ModelConfig = {
  fast: "claude-3-5-haiku-20241022",
  capable: "claude-sonnet-4-5-20250929",
  powerful: "claude-opus-4-5-20250929",
};

// ============================================================================
// SIMULATED FILESYSTEM
// ============================================================================

/**
 * Simulated skill files (in production, these would be actual files)
 */
const SKILL_FILES: Record<string, string> = {
  "skills/pdf/SKILL.md": `---
name: pdf-manipulation
description: Extract text, fill forms, merge/split PDFs, and convert formats
triggers:
  - "pdf"
  - "form"
  - "document"
  - "extract"
---

# PDF Manipulation Skill

## Capabilities
- Extract text from PDFs using \`pdf-extract\` tool
- Fill form fields using \`pdf-form\` tool
- Merge multiple PDFs with \`pdf-merge\`
- Split PDFs by page range with \`pdf-split\`
- Convert PDFs to other formats

## Usage Patterns

### Text Extraction
1. Identify the PDF file path
2. Call \`pdf-extract --input <path> --output <format>\`
3. Process the extracted text

### Form Filling
For detailed form patterns, see \`./forms.md\`.

### Merging
1. List all input PDF paths
2. Call \`pdf-merge --inputs file1.pdf,file2.pdf --output merged.pdf\`
3. Verify merged file`,

  "skills/pdf/forms.md": `# Advanced Form Filling Reference

## Field Types
- **Text fields**: Use \`set-text --field <name> --value <text>\`
- **Checkboxes**: Use \`set-checkbox --field <name> --value true|false\`
- **Radio buttons**: Use \`set-radio --field <name> --option <index>\`
- **Dropdowns**: Use \`set-dropdown --field <name> --value <option>\`
- **Signatures**: Use \`set-signature --field <name> --image <path>\`

## Common Form Patterns

### Tax Forms
Tax forms typically have nested sections. Process section by section.

### Application Forms
Application forms often have conditional fields. Check field visibility before filling.

## Validation
Always validate field names exist before filling. Use \`pdf-form --list-fields <file>\` to enumerate available fields.`,

  "skills/pdf/reference.md": `# PDF Tool Reference

## Error Codes
- E001: Invalid PDF format
- E002: Password protected
- E003: Corrupted file
- E004: Field not found
- E005: Unsupported feature

## Troubleshooting
1. Check PDF version compatibility (v1.4+ recommended)
2. Verify file permissions
3. Validate field names match exactly
4. For encrypted files, provide password with --password flag`,

  "skills/git/SKILL.md": `---
name: git-operations
description: Version control operations including branching, merging, and rebasing
triggers:
  - "git"
  - "commit"
  - "branch"
  - "merge"
  - "push"
  - "pull"
  - "rebase"
---

# Git Operations Skill

## Capabilities
- Create and manage branches
- Commit changes with proper messages
- Handle merge conflicts
- Interactive rebasing
- Cherry-pick commits

## Usage Patterns

### Feature Branch Workflow
1. Create branch from main: \`git checkout -b feature/name\`
2. Make changes and commit: \`git add . && git commit -m "message"\`
3. Push and create PR: \`git push -u origin feature/name\`

### Conflict Resolution
1. Identify conflicting files: \`git status\`
2. Open each file and resolve markers
3. Mark as resolved: \`git add <file>\`
4. Complete merge: \`git commit\`

For advanced workflows, see \`./workflows.md\`.`,

  "skills/git/workflows.md": `# Git Workflow Patterns

## GitFlow
- main: production releases only
- develop: integration branch for features
- feature/*: individual feature development
- release/*: release preparation and testing
- hotfix/*: emergency production fixes

## Trunk-Based Development
- All work happens on main
- Feature flags control incomplete work
- Short-lived branches only (< 1 day)
- Continuous integration required

## Commit Message Conventions
- feat: new feature
- fix: bug fix
- docs: documentation only
- refactor: code refactoring
- test: adding tests
- chore: maintenance tasks`,

  "skills/testing/SKILL.md": `---
name: testing-framework
description: Unit tests, integration tests, mocking, fixtures, and coverage
triggers:
  - "test"
  - "jest"
  - "vitest"
  - "mock"
  - "fixture"
  - "coverage"
  - "assertion"
---

# Testing Framework Skill

## Capabilities
- Write unit tests with proper assertions
- Create integration tests for APIs and databases
- Set up mocks and fixtures
- Generate coverage reports
- Configure test runners

## Usage Patterns

### Unit Test
1. Identify function to test
2. Write test cases covering happy path and edge cases
3. Add clear assertions
4. Run and verify results

### Integration Test
1. Set up test database/server
2. Execute full workflow
3. Assert on end state
4. Clean up resources

For test data patterns, see \`./fixtures.md\`.`,

  "skills/testing/fixtures.md": `# Test Fixtures Reference

## Factory Pattern
Use factories for consistent test data generation:
\`\`\`typescript
const userFactory = () => ({
  id: randomUUID(),
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date()
});
\`\`\`

## Database Fixtures
- Reset state between tests with truncation or transactions
- Use transactions for isolation (rollback after each test)
- Seed with minimal required data only
- Avoid fixture files when factories suffice

## Snapshot Testing
- Use snapshots for complex output validation
- Update snapshots intentionally, not automatically
- Review snapshot changes carefully in PRs`,
};

/**
 * Simulated file reader
 */
function readSkillFile(path: string): string | null {
  return SKILL_FILES[path] ?? null;
}

/**
 * List files in simulated directory
 */
function listSkillFiles(dir: string): string[] {
  return Object.keys(SKILL_FILES).filter((p) => p.startsWith(dir));
}

// ============================================================================
// SKILL REGISTRY
// ============================================================================

/**
 * Parse YAML frontmatter from skill file
 */
export function parseSkillMetadata(content: string, path: string): SkillMetadata | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1]) return null;

  const frontmatter = frontmatterMatch[1];

  // Simple YAML parsing for our known structure
  const nameMatch = frontmatter.match(/name:\s*(.+)/);
  const descMatch = frontmatter.match(/description:\s*(.+)/);
  const triggersMatch = frontmatter.match(/triggers:\n((?:\s+-\s*".+"\n?)+)/);

  if (!nameMatch?.[1] || !descMatch?.[1] || !triggersMatch?.[1]) return null;

  const triggers: string[] = triggersMatch[1]
    .split("\n")
    .filter((line) => line.includes("-"))
    .map((line) => {
      const match = line.match(/"(.+)"/);
      return match?.[1] ?? "";
    })
    .filter((s): s is string => s !== "");

  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].trim(),
    triggers,
    path,
    metadataTokens: estimateTokens(frontmatter),
  };
}

/**
 * Simple token estimation (roughly 4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build skill registry from filesystem
 */
export function buildSkillRegistry(skillsDir: string): SkillMetadata[] {
  const registry: SkillMetadata[] = [];
  const skillFiles = listSkillFiles(skillsDir);

  for (const filePath of skillFiles) {
    if (filePath.endsWith("SKILL.md")) {
      const content = readSkillFile(filePath);
      if (content) {
        const metadata = parseSkillMetadata(content, filePath);
        if (metadata) {
          registry.push(metadata);
        }
      }
    }
  }

  return registry;
}

// ============================================================================
// PROGRESSIVE DISCLOSURE LOADER
// ============================================================================

/**
 * Progressive Disclosure Skill Loader
 *
 * Implements the three-level loading architecture:
 * - Level 1: Metadata always loaded (~50-100 tokens per skill)
 * - Level 2: Core instructions loaded when skill triggered
 * - Level 3: Supplementary resources loaded on-demand
 */
export class SkillLoader {
  private config: LoaderConfig;
  protected models: ModelConfig;
  private registry: SkillMetadata[];
  private cache: Map<string, LoadedSkill>;
  private metrics: LoaderMetrics;

  constructor(config: Partial<LoaderConfig> = {}, models: Partial<ModelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.models = { ...DEFAULT_MODELS, ...models };
    this.registry = buildSkillRegistry(this.config.skillsDir);
    this.cache = new Map();
    this.metrics = this.initMetrics();
  }

  /**
   * Get the model configuration
   */
  getModels(): ModelConfig {
    return { ...this.models };
  }

  private initMetrics(): LoaderMetrics {
    return {
      totalLoads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensLoaded: 0,
      tokensSavedByCache: 0,
      skillDiscoveryHits: 0,
      skillDiscoveryAttempts: 0,
      averageLoadTimeMs: 0,
      loadTimes: [],
    };
  }

  /**
   * Get all skill metadata (Level 1)
   */
  getMetadataContext(): { context: string; tokens: number } {
    const parts = ["# Available Skills\n"];
    let totalTokens = 0;

    for (const skill of this.registry) {
      parts.push(`## ${skill.name}`);
      parts.push(`Description: ${skill.description}`);
      parts.push(`Triggers: ${skill.triggers.join(", ")}`);
      parts.push("");
      totalTokens += skill.metadataTokens;
    }

    return {
      context: parts.join("\n"),
      tokens: totalTokens,
    };
  }

  /**
   * Detect which skills are relevant to the task
   */
  detectRelevantSkills(task: string): string[] {
    const taskLower = task.toLowerCase();
    const relevant: string[] = [];

    for (const skill of this.registry) {
      const triggered = skill.triggers.some((t) => taskLower.includes(t.toLowerCase()));
      if (triggered) {
        relevant.push(skill.name);
      }
    }

    if (this.config.enableMetrics) {
      this.metrics.skillDiscoveryAttempts++;
      if (relevant.length > 0) {
        this.metrics.skillDiscoveryHits++;
      }
    }

    return relevant;
  }

  /**
   * Load a skill's core content (Level 2)
   */
  loadSkillCore(skillName: string): LoadedSkill | null {
    const startTime = Date.now();

    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(skillName);
      if (cached && Date.now() - cached.loadedAt < this.config.cacheTTL) {
        if (this.config.enableMetrics) {
          this.metrics.cacheHits++;
          this.metrics.tokensSavedByCache += cached.totalTokens;
        }
        return cached;
      }
    }

    // Find skill metadata
    const metadata = this.registry.find((s) => s.name === skillName);
    if (!metadata) return null;

    // Load core content
    const content = readSkillFile(metadata.path);
    if (!content) return null;

    // Strip frontmatter to get core instructions
    const coreContent = content.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    const coreTokens = estimateTokens(coreContent);

    const loaded: LoadedSkill = {
      name: skillName,
      coreContent,
      coreTokens,
      supplementary: [],
      totalTokens: coreTokens,
      loadedAt: Date.now(),
    };

    // Update cache
    if (this.config.enableCache) {
      this.maintainCacheSize();
      this.cache.set(skillName, loaded);
      if (this.config.enableMetrics) {
        this.metrics.cacheMisses++;
      }
    }

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalLoads++;
      this.metrics.totalTokensLoaded += coreTokens;
      const loadTime = Date.now() - startTime;
      this.metrics.loadTimes.push(loadTime);
      this.metrics.averageLoadTimeMs =
        this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length;
    }

    return loaded;
  }

  /**
   * Load supplementary resource (Level 3)
   */
  loadSupplementary(skillName: string, resourceName: string): LoadedResource | null {
    const metadata = this.registry.find((s) => s.name === skillName);
    if (!metadata) return null;

    // Derive directory from skill path
    const skillDir = metadata.path.replace("/SKILL.md", "");
    const resourcePath = `${skillDir}/${resourceName}`;

    const content = readSkillFile(resourcePath);
    if (!content) return null;

    const resource: LoadedResource = {
      name: resourceName,
      content,
      tokens: estimateTokens(content),
    };

    // Update cached skill if exists
    const cached = this.cache.get(skillName);
    if (cached) {
      cached.supplementary.push(resource);
      cached.totalTokens += resource.tokens;
    }

    if (this.config.enableMetrics) {
      this.metrics.totalTokensLoaded += resource.tokens;
    }

    return resource;
  }

  /**
   * Maintain cache size by removing oldest entries
   */
  private maintainCacheSize(): void {
    if (this.cache.size >= this.config.maxCachedSkills) {
      // Find and remove oldest entry
      let oldest: string | null = null;
      let oldestTime = Infinity;

      for (const [name, skill] of this.cache) {
        if (skill.loadedAt < oldestTime) {
          oldestTime = skill.loadedAt;
          oldest = name;
        }
      }

      if (oldest) {
        this.cache.delete(oldest);
      }
    }
  }

  /**
   * Load progressive context for a task
   *
   * Returns context with:
   * - Level 1: All skill metadata
   * - Level 2: Core instructions for triggered skills
   * - Level 3: Supplementary resources if specified
   */
  loadContextForTask(
    task: string,
    supplementary: Record<string, string[]> = {}
  ): {
    context: string;
    tokensLoaded: number;
    levelsLoaded: number[];
    skillsLoaded: string[];
    tokenSavings: number;
  } {
    const parts: string[] = [];
    let tokensLoaded = 0;
    const levelsLoaded: number[] = [1];
    const skillsLoaded: string[] = [];

    // Level 1: Always load metadata
    const metadata = this.getMetadataContext();
    parts.push(metadata.context);
    tokensLoaded += metadata.tokens;

    // Level 2: Load core for triggered skills
    const relevantSkills = this.detectRelevantSkills(task);

    if (relevantSkills.length > 0) {
      levelsLoaded.push(2);
      parts.push("\n# Active Skills\n");

      for (const skillName of relevantSkills) {
        const loaded = this.loadSkillCore(skillName);
        if (loaded) {
          parts.push(loaded.coreContent);
          parts.push("");
          tokensLoaded += loaded.coreTokens;
          skillsLoaded.push(skillName);
        }
      }
    }

    // Level 3: Load supplementary if requested
    const suppRequested = Object.keys(supplementary);
    if (suppRequested.length > 0) {
      levelsLoaded.push(3);
      parts.push("\n# Supplementary Resources\n");

      for (const skillName of suppRequested) {
        const resources = supplementary[skillName] ?? [];
        for (const resourceName of resources) {
          const resource = this.loadSupplementary(skillName, resourceName);
          if (resource) {
            parts.push(`## ${resource.name}\n`);
            parts.push(resource.content);
            parts.push("");
            tokensLoaded += resource.tokens;
          }
        }
      }
    }

    // Calculate savings vs flat loading
    const flatTokens = this.calculateFlatLoadTokens();
    const tokenSavings = flatTokens - tokensLoaded;

    return {
      context: parts.join("\n"),
      tokensLoaded,
      levelsLoaded,
      skillsLoaded,
      tokenSavings,
    };
  }

  /**
   * Calculate tokens if all content loaded flat
   */
  private calculateFlatLoadTokens(): number {
    let total = 0;

    for (const skill of this.registry) {
      total += skill.metadataTokens;

      const content = readSkillFile(skill.path);
      if (content) {
        total += estimateTokens(content);
      }

      // Add supplementary files
      const skillDir = skill.path.replace("/SKILL.md", "");
      const allFiles = listSkillFiles(skillDir);

      for (const file of allFiles) {
        if (!file.endsWith("SKILL.md")) {
          const suppContent = readSkillFile(file);
          if (suppContent) {
            total += estimateTokens(suppContent);
          }
        }
      }
    }

    return total;
  }

  /**
   * Get current metrics
   */
  getMetrics(): LoaderMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initMetrics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; skills: string[]; hitRate: number } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return {
      size: this.cache.size,
      skills: Array.from(this.cache.keys()),
      hitRate: total > 0 ? this.metrics.cacheHits / total : 0,
    };
  }
}

// ============================================================================
// MODEL-AWARE LOADER
// ============================================================================

/**
 * Extract text content from SDK message
 */
function extractTextContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const content = message.message.content;
  if (typeof content === "string") return content;

  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && "text" in block) {
      textParts.push(block.text);
    }
  }
  return textParts.join("");
}

/**
 * Model-aware skill execution
 *
 * Uses fast model for skill discovery, capable model for execution
 */
export class ModelAwareLoader extends SkillLoader {
  private modelConfig: ModelConfig;

  constructor(config: Partial<LoaderConfig> = {}, models: Partial<ModelConfig> = {}) {
    super(config, models);
    this.modelConfig = { ...DEFAULT_MODELS, ...models };
  }

  /**
   * Discover relevant skills using fast model
   */
  async discoverSkillsWithModel(task: string): Promise<string[]> {
    const metadata = this.getMetadataContext();

    const prompt = `Given these available skills:

${metadata.context}

Which skills are most relevant for this task?
Task: "${task}"

Respond with a JSON array of skill names, e.g., ["pdf-manipulation", "git-operations"]
Only include skills that are directly relevant to the task.`;

    const response = query({
      prompt,
      options: {
        model: this.modelConfig.fast,
        cwd: process.cwd(),
        allowedTools: [],
      },
    });

    let result = "";
    for await (const message of response) {
      if (message.type === "assistant") {
        result += extractTextContent(message);
      }
    }

    // Parse JSON response
    const match = result.match(/\[.*\]/s);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Fallback to trigger-based detection
        return this.detectRelevantSkills(task);
      }
    }

    return this.detectRelevantSkills(task);
  }

  /**
   * Execute task with appropriate model
   */
  async executeWithModel(
    task: string,
    modelTier: ModelTier = "capable"
  ): Promise<{
    response: string;
    model: string;
    tokensUsed: number;
  }> {
    const model = this.modelConfig[modelTier];
    const contextResult = this.loadContextForTask(task);

    const prompt = `${contextResult.context}

Task: ${task}

Complete the task using the relevant skills above.`;

    const response = query({
      prompt,
      options: {
        model,
        cwd: process.cwd(),
        allowedTools: [],
      },
    });

    let result = "";
    for await (const message of response) {
      if (message.type === "assistant") {
        result += extractTextContent(message);
      }
    }

    return {
      response: result,
      model,
      tokensUsed: contextResult.tokensLoaded,
    };
  }
}

// ============================================================================
// SKILL COMBO CACHING
// ============================================================================

/**
 * Frequently-used skill combinations
 */
export const SKILL_COMBOS: Record<string, string[]> = {
  "code-review": ["git-operations", "testing-framework"],
  "pdf-workflow": ["pdf-manipulation"],
  "test-suite": ["testing-framework"],
  development: ["git-operations", "testing-framework"],
};

/**
 * Cached skill combo loader
 */
export class CachedComboLoader extends SkillLoader {
  private comboCache: Map<string, string>;

  constructor(config: Partial<LoaderConfig> = {}) {
    super(config);
    this.comboCache = new Map();
  }

  /**
   * Load a predefined skill combination
   */
  loadSkillCombo(comboName: string): {
    context: string;
    tokensLoaded: number;
    cached: boolean;
  } {
    // Check combo cache
    const cachedContext = this.comboCache.get(comboName);
    if (cachedContext) {
      return {
        context: cachedContext,
        tokensLoaded: estimateTokens(cachedContext),
        cached: true,
      };
    }

    // Load skills for combo
    const skillNames = SKILL_COMBOS[comboName];
    if (!skillNames) {
      return {
        context: "",
        tokensLoaded: 0,
        cached: false,
      };
    }

    const parts: string[] = [];
    let tokensLoaded = 0;

    for (const skillName of skillNames) {
      const loaded = this.loadSkillCore(skillName);
      if (loaded) {
        parts.push(loaded.coreContent);
        parts.push("");
        tokensLoaded += loaded.coreTokens;
      }
    }

    const context = parts.join("\n");

    // Cache the combo
    this.comboCache.set(comboName, context);

    return {
      context,
      tokensLoaded,
      cached: false,
    };
  }

  /**
   * Clear combo cache
   */
  clearComboCache(): void {
    this.comboCache.clear();
  }
}

// ============================================================================
// METRICS REPORTER
// ============================================================================

/**
 * Generate metrics report
 */
export function generateMetricsReport(loader: SkillLoader): string {
  const metrics = loader.getMetrics();
  const cacheStats = loader.getCacheStats();

  return `
# Progressive Disclosure Loader Metrics

## Loading Statistics
- Total skill loads: ${metrics.totalLoads}
- Total tokens loaded: ${metrics.totalTokensLoaded}
- Average load time: ${metrics.averageLoadTimeMs.toFixed(2)}ms

## Cache Performance
- Cache size: ${cacheStats.size} skills
- Cache hits: ${metrics.cacheHits}
- Cache misses: ${metrics.cacheMisses}
- Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%
- Tokens saved by cache: ${metrics.tokensSavedByCache}

## Skill Discovery
- Discovery attempts: ${metrics.skillDiscoveryAttempts}
- Successful discoveries: ${metrics.skillDiscoveryHits}
- Discovery rate: ${metrics.skillDiscoveryAttempts > 0 ? ((metrics.skillDiscoveryHits / metrics.skillDiscoveryAttempts) * 100).toFixed(1) : 0}%

## Cached Skills
${cacheStats.skills.map((s) => `- ${s}`).join("\n") || "- (none)"}
`;
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate progressive disclosure skill loader
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Progressive Disclosure Skill Loader ===\n");

  // Initialize loader
  const loader = new SkillLoader({
    skillsDir: "skills",
    enableCache: true,
    enableMetrics: true,
  });

  // Example 1: Metadata-only context
  console.log("1. Metadata-Only Context (Level 1)");
  const metadata = loader.getMetadataContext();
  console.log(`   Skills registered: ${metadata.context.split("##").length - 1}`);
  console.log(`   Tokens: ${metadata.tokens}`);

  // Example 2: Task with skill triggering
  console.log("\n2. Task Triggering Skill Load (Level 2)");
  const task1 = "Extract text from report.pdf";
  const result1 = loader.loadContextForTask(task1);
  console.log(`   Task: "${task1}"`);
  console.log(`   Skills loaded: ${result1.skillsLoaded.join(", ")}`);
  console.log(`   Levels: ${result1.levelsLoaded.join(", ")}`);
  console.log(`   Tokens: ${result1.tokensLoaded}`);
  console.log(`   Savings: ${result1.tokenSavings} tokens`);

  // Example 3: Task with supplementary loading
  console.log("\n3. Task with Supplementary Resources (Level 3)");
  const task2 = "Fill this PDF form with a signature";
  const result2 = loader.loadContextForTask(task2, {
    "pdf-manipulation": ["forms.md"],
  });
  console.log(`   Task: "${task2}"`);
  console.log(`   Levels: ${result2.levelsLoaded.join(", ")}`);
  console.log(`   Tokens: ${result2.tokensLoaded}`);
  console.log(`   Savings: ${result2.tokenSavings} tokens (${Math.round(
    (result2.tokenSavings / (result2.tokensLoaded + result2.tokenSavings)) * 100
  )}%)`);

  // Example 4: Multi-skill task
  console.log("\n4. Multi-Skill Task");
  const task3 = "Commit the PDF extraction code and add tests";
  const result3 = loader.loadContextForTask(task3);
  console.log(`   Task: "${task3}"`);
  console.log(`   Skills: ${result3.skillsLoaded.join(", ")}`);
  console.log(`   Tokens: ${result3.tokensLoaded}`);

  // Example 5: Cache demonstration
  console.log("\n5. Cache Performance");
  // Load same skill again
  loader.loadContextForTask("Another PDF task");
  loader.loadContextForTask("Git commit changes");
  const cacheStats = loader.getCacheStats();
  console.log(`   Cache size: ${cacheStats.size}`);
  console.log(`   Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

  // Example 6: Skill combo loading
  console.log("\n6. Skill Combo Loading");
  const comboLoader = new CachedComboLoader();
  const codeReview = comboLoader.loadSkillCombo("code-review");
  console.log(`   Combo: "code-review"`);
  console.log(`   Skills: git-operations, testing-framework`);
  console.log(`   Tokens: ${codeReview.tokensLoaded}`);
  console.log(`   Cached: ${codeReview.cached}`);

  // Load same combo again
  const codeReview2 = comboLoader.loadSkillCombo("code-review");
  console.log(`   Second load cached: ${codeReview2.cached}`);

  // Example 7: Full metrics report
  console.log("\n7. Metrics Report");
  console.log(generateMetricsReport(loader));

  console.log("=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
