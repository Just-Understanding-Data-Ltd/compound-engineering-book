/**
 * Chapter 9: Context Engineering Deep Dive
 *
 * This file demonstrates progressive disclosure patterns for context management.
 * Instead of loading all context upfront, information is organized in layers
 * and loaded on-demand based on task requirements.
 *
 * Key concepts:
 * - Three-level architecture: metadata, core instructions, supplementary resources
 * - On-demand loading reduces average token usage by 70%+
 * - Scalable skill system without context explosion
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ============================================================================
// PROGRESSIVE DISCLOSURE TYPES
// ============================================================================

/**
 * Level 1: Metadata (always loaded, ~50-100 tokens per skill)
 */
export interface SkillMetadata {
  /** Unique skill identifier */
  name: string;
  /** Brief description */
  description: string;
  /** Trigger words that activate this skill */
  triggers: string[];
  /** Token cost of metadata */
  metadataTokens: number;
}

/**
 * Level 2: Core instructions (loaded when skill triggered, ~500-2000 tokens)
 */
export interface SkillCore {
  /** Full skill name */
  name: string;
  /** Capabilities list */
  capabilities: string[];
  /** Usage patterns */
  usagePatterns: { name: string; steps: string[] }[];
  /** Token cost of core */
  coreTokens: number;
}

/**
 * Level 3: Supplementary resources (loaded as needed)
 */
export interface SkillSupplementary {
  /** Reference name */
  name: string;
  /** When to load this resource */
  loadCondition: string;
  /** Full content */
  content: string;
  /** Token cost */
  supplementaryTokens: number;
}

/**
 * Complete skill definition with all levels
 */
export interface Skill {
  metadata: SkillMetadata;
  core: SkillCore;
  supplementary: SkillSupplementary[];
}

/**
 * Context loading result
 */
export interface ContextLoadResult {
  /** Loaded context text */
  context: string;
  /** Total tokens loaded */
  tokensLoaded: number;
  /** Loading levels used */
  levelsLoaded: (1 | 2 | 3)[];
  /** Token savings vs flat loading */
  tokenSavings: number;
}

// ============================================================================
// SKILL REGISTRY
// ============================================================================

/**
 * Example skills demonstrating the three-level architecture
 */
export const SKILL_REGISTRY: Record<string, Skill> = {
  pdf: {
    metadata: {
      name: "pdf-manipulation",
      description: "Extract text, fill forms, merge/split PDFs",
      triggers: ["pdf", "form", "document", "extract"],
      metadataTokens: 50,
    },
    core: {
      name: "PDF Manipulation Skill",
      capabilities: [
        "Extract text from PDFs using `pdf-extract` tool",
        "Fill form fields using `pdf-form` tool",
        "Merge multiple PDFs with `pdf-merge`",
        "Split PDFs by page range with `pdf-split`",
      ],
      usagePatterns: [
        {
          name: "Text Extraction",
          steps: [
            "Identify the PDF file path",
            "Call `pdf-extract --input <path> --output <format>`",
            "Process the extracted text",
          ],
        },
        {
          name: "Form Filling",
          steps: [
            "Read the PDF form structure",
            "Prepare field values as JSON",
            "Call `pdf-form --input <pdf> --fields <json>`",
          ],
        },
      ],
      coreTokens: 800,
    },
    supplementary: [
      {
        name: "forms.md",
        loadCondition: "When filling complex forms or handling signatures",
        content: `# Advanced Form Filling

## Signature Fields
Use \`pdf-form --sign\` with certificate path for digital signatures.

## Field Types
- text: Simple string values
- checkbox: true/false
- radio: option value
- dropdown: selected option
- signature: path to signature image or certificate

## Validation
Always validate field names exist before filling.`,
        supplementaryTokens: 300,
      },
      {
        name: "reference.md",
        loadCondition: "For edge cases or troubleshooting",
        content: `# PDF Tool Reference

## Error Codes
- E001: Invalid PDF format
- E002: Password protected
- E003: Corrupted file
- E004: Field not found

## Troubleshooting
1. Check PDF version compatibility
2. Verify file permissions
3. Validate field names match exactly`,
        supplementaryTokens: 200,
      },
    ],
  },
  git: {
    metadata: {
      name: "git-operations",
      description: "Version control operations, branching, merging",
      triggers: ["git", "commit", "branch", "merge", "push", "pull"],
      metadataTokens: 45,
    },
    core: {
      name: "Git Operations Skill",
      capabilities: [
        "Create and manage branches",
        "Commit changes with proper messages",
        "Handle merge conflicts",
        "Interactive rebasing",
      ],
      usagePatterns: [
        {
          name: "Feature Branch",
          steps: [
            "Create branch from main",
            "Make changes and commit",
            "Push and create PR",
          ],
        },
        {
          name: "Conflict Resolution",
          steps: [
            "Identify conflicting files",
            "Resolve conflicts manually",
            "Mark as resolved and commit",
          ],
        },
      ],
      coreTokens: 600,
    },
    supplementary: [
      {
        name: "workflows.md",
        loadCondition: "For complex branching strategies or CI/CD integration",
        content: `# Git Workflows

## GitFlow
- main: production releases
- develop: integration branch
- feature/*: feature development
- release/*: release preparation
- hotfix/*: emergency fixes

## Trunk-Based Development
- All work on main
- Feature flags for incomplete work
- Short-lived branches only`,
        supplementaryTokens: 250,
      },
    ],
  },
  testing: {
    metadata: {
      name: "testing-framework",
      description: "Unit tests, integration tests, mocking, fixtures",
      triggers: ["test", "jest", "vitest", "mock", "fixture", "coverage"],
      metadataTokens: 55,
    },
    core: {
      name: "Testing Framework Skill",
      capabilities: [
        "Write unit tests with proper assertions",
        "Create integration tests for APIs",
        "Set up mocks and fixtures",
        "Generate coverage reports",
      ],
      usagePatterns: [
        {
          name: "Unit Test",
          steps: [
            "Identify function to test",
            "Write test cases (happy path + edge cases)",
            "Add assertions",
            "Run and verify",
          ],
        },
        {
          name: "Integration Test",
          steps: [
            "Set up test database/server",
            "Execute full workflow",
            "Assert end state",
            "Clean up resources",
          ],
        },
      ],
      coreTokens: 700,
    },
    supplementary: [
      {
        name: "fixtures.md",
        loadCondition: "When setting up complex test data",
        content: `# Test Fixtures

## Factory Pattern
Use factories for consistent test data generation.

## Database Fixtures
- Reset state between tests
- Use transactions for isolation
- Seed with minimal required data`,
        supplementaryTokens: 200,
      },
    ],
  },
};

// ============================================================================
// PROGRESSIVE DISCLOSURE ENGINE
// ============================================================================

/**
 * Detect which skills are relevant to the current task
 */
export function detectRelevantSkills(task: string): string[] {
  const taskLower = task.toLowerCase();
  const relevantSkills: string[] = [];

  for (const [skillId, skill] of Object.entries(SKILL_REGISTRY)) {
    const triggerMatched = skill.metadata.triggers.some((trigger) =>
      taskLower.includes(trigger.toLowerCase())
    );
    if (triggerMatched) {
      relevantSkills.push(skillId);
    }
  }

  return relevantSkills;
}

/**
 * Format skill metadata as YAML frontmatter
 */
export function formatMetadata(skill: Skill): string {
  return `---
name: ${skill.metadata.name}
description: ${skill.metadata.description}
triggers:
${skill.metadata.triggers.map((t) => `  - "${t}"`).join("\n")}
---`;
}

/**
 * Format skill core instructions
 */
export function formatCore(skill: Skill): string {
  let content = `# ${skill.core.name}\n\n## Capabilities\n`;
  content += skill.core.capabilities.map((c) => `- ${c}`).join("\n");
  content += "\n\n## Usage Patterns\n";

  for (const pattern of skill.core.usagePatterns) {
    content += `### ${pattern.name}\n`;
    content += pattern.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    content += "\n\n";
  }

  return content;
}

/**
 * Format supplementary resource
 */
export function formatSupplementary(supplementary: SkillSupplementary): string {
  return `---
Resource: ${supplementary.name}
Load when: ${supplementary.loadCondition}
---

${supplementary.content}`;
}

/**
 * Load context progressively based on task requirements
 *
 * Level 1: Always load metadata for all skills (~50-100 tokens each)
 * Level 2: Load core for triggered skills (~500-2000 tokens)
 * Level 3: Load supplementary only when explicitly needed
 */
export function loadProgressiveContext(
  task: string,
  loadSupplementary: string[] = []
): ContextLoadResult {
  const parts: string[] = [];
  let tokensLoaded = 0;
  const levelsLoaded: (1 | 2 | 3)[] = [1]; // Always load Level 1

  // Level 1: Load metadata for ALL skills
  parts.push("# Available Skills\n");
  for (const skill of Object.values(SKILL_REGISTRY)) {
    parts.push(formatMetadata(skill));
    parts.push("");
    tokensLoaded += skill.metadata.metadataTokens;
  }

  // Level 2: Load core for triggered skills
  const relevantSkills = detectRelevantSkills(task);
  if (relevantSkills.length > 0) {
    levelsLoaded.push(2);
    parts.push("\n# Active Skills\n");

    for (const skillId of relevantSkills) {
      const skill = SKILL_REGISTRY[skillId];
      if (skill) {
        parts.push(formatCore(skill));
        tokensLoaded += skill.core.coreTokens;
      }
    }
  }

  // Level 3: Load supplementary if explicitly requested
  if (loadSupplementary.length > 0) {
    levelsLoaded.push(3);
    parts.push("\n# Supplementary Resources\n");

    for (const skillId of relevantSkills) {
      const skill = SKILL_REGISTRY[skillId];
      if (skill) {
        for (const supp of skill.supplementary) {
          if (loadSupplementary.some((s) => supp.name.includes(s))) {
            parts.push(formatSupplementary(supp));
            parts.push("");
            tokensLoaded += supp.supplementaryTokens;
          }
        }
      }
    }
  }

  // Calculate savings vs flat loading
  const flatTokens = Object.values(SKILL_REGISTRY).reduce(
    (sum, skill) =>
      sum +
      skill.metadata.metadataTokens +
      skill.core.coreTokens +
      skill.supplementary.reduce((s, sup) => s + sup.supplementaryTokens, 0),
    0
  );

  return {
    context: parts.join("\n"),
    tokensLoaded,
    levelsLoaded,
    tokenSavings: flatTokens - tokensLoaded,
  };
}

/**
 * Calculate token efficiency metrics
 */
export function calculateEfficiency(results: ContextLoadResult[]): {
  averageTokens: number;
  maxTokens: number;
  minTokens: number;
  averageSavingsPercent: number;
} {
  const tokens = results.map((r) => r.tokensLoaded);
  const savings = results.map((r) => r.tokenSavings / (r.tokensLoaded + r.tokenSavings));

  return {
    averageTokens: tokens.reduce((a, b) => a + b, 0) / tokens.length,
    maxTokens: Math.max(...tokens),
    minTokens: Math.min(...tokens),
    averageSavingsPercent: (savings.reduce((a, b) => a + b, 0) / savings.length) * 100,
  };
}

// ============================================================================
// SDK INTEGRATION
// ============================================================================

/**
 * Execute a task with progressive context loading
 */
export async function executeWithProgressiveContext(
  task: string,
  loadSupplementary: string[] = []
): Promise<{ response: string; contextStats: ContextLoadResult }> {
  const contextResult = loadProgressiveContext(task, loadSupplementary);

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: contextResult.context,
    messages: [{ role: "user", content: task }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent ? textContent.text : "";

  return {
    response: responseText,
    contextStats: contextResult,
  };
}

// ============================================================================
// DEMO FUNCTION
// ============================================================================

/**
 * Demonstrate progressive disclosure patterns
 */
export async function demo(): Promise<void> {
  console.log("=== Chapter 9: Progressive Disclosure Patterns ===\n");

  // Example 1: Metadata-only loading (no task triggers)
  console.log("1. Metadata-Only Loading (generic task)");
  const metadataOnly = loadProgressiveContext("How do I get started?");
  console.log(`   Task: "How do I get started?"`);
  console.log(`   Tokens loaded: ${metadataOnly.tokensLoaded}`);
  console.log(`   Levels: ${metadataOnly.levelsLoaded.join(", ")}`);
  console.log(`   Savings: ${metadataOnly.tokenSavings} tokens (vs flat loading)`);

  // Example 2: Core instructions loaded (skill triggered)
  console.log("\n2. Core Instructions Loading (skill triggered)");
  const coreLoaded = loadProgressiveContext("Extract text from this PDF document");
  console.log(`   Task: "Extract text from this PDF document"`);
  console.log(`   Tokens loaded: ${coreLoaded.tokensLoaded}`);
  console.log(`   Levels: ${coreLoaded.levelsLoaded.join(", ")}`);
  console.log(`   Savings: ${coreLoaded.tokenSavings} tokens (${Math.round(
    (coreLoaded.tokenSavings / (coreLoaded.tokensLoaded + coreLoaded.tokenSavings)) * 100
  )}%)`);

  // Example 3: Full loading with supplementary
  console.log("\n3. Full Loading with Supplementary Resources");
  const fullLoaded = loadProgressiveContext(
    "Fill this PDF form with digital signature",
    ["forms.md"]
  );
  console.log(`   Task: "Fill this PDF form with digital signature"`);
  console.log(`   Supplementary: forms.md`);
  console.log(`   Tokens loaded: ${fullLoaded.tokensLoaded}`);
  console.log(`   Levels: ${fullLoaded.levelsLoaded.join(", ")}`);
  console.log(`   Savings: ${fullLoaded.tokenSavings} tokens (${Math.round(
    (fullLoaded.tokenSavings / (fullLoaded.tokensLoaded + fullLoaded.tokenSavings)) * 100
  )}%)`);

  // Example 4: Multiple skills triggered
  console.log("\n4. Multiple Skills Triggered");
  const multiSkill = loadProgressiveContext("Commit the PDF extraction code and add tests");
  console.log(`   Task: "Commit the PDF extraction code and add tests"`);
  console.log(`   Skills detected: ${detectRelevantSkills("Commit the PDF extraction code and add tests").join(", ")}`);
  console.log(`   Tokens loaded: ${multiSkill.tokensLoaded}`);
  console.log(`   Levels: ${multiSkill.levelsLoaded.join(", ")}`);

  // Example 5: Efficiency comparison
  console.log("\n5. Efficiency Summary");
  const scenarios = [
    loadProgressiveContext("Hello"),
    loadProgressiveContext("Extract PDF"),
    loadProgressiveContext("Run tests"),
    loadProgressiveContext("Git commit"),
    loadProgressiveContext("Extract PDF, commit, run tests"),
  ];
  const efficiency = calculateEfficiency(scenarios);
  console.log(`   Average tokens: ${efficiency.averageTokens.toFixed(0)}`);
  console.log(`   Min tokens: ${efficiency.minTokens}`);
  console.log(`   Max tokens: ${efficiency.maxTokens}`);
  console.log(`   Average savings: ${efficiency.averageSavingsPercent.toFixed(1)}%`);

  // Example 6: Live execution (requires API key)
  console.log("\n6. Live Execution with Progressive Context");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await executeWithProgressiveContext(
        "How do I extract text from a PDF file?"
      );
      console.log(`   Response preview: ${result.response.substring(0, 150)}...`);
      console.log(`   Context tokens used: ${result.contextStats.tokensLoaded}`);
    } catch (error) {
      console.log("   (API call failed - check API key)");
    }
  } else {
    console.log("   (API key not set - skipping live demonstration)");
  }

  console.log("\n=== Demo Complete ===");
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}
