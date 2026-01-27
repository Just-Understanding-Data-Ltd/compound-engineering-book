# Chapter 15: Model Strategy & Cost Optimization

> Master the economics of AI-assisted development through intelligent model selection and cost control.

---

## Overview

Using a single model for everything is wasteful. This chapter teaches you to match model capabilities to task complexity for optimal cost-quality balance. You'll learn model switching strategies (Haiku/Sonnet/Opus), multi-layer cost protection, when to use YOLO mode safely, and how to leverage the Skills system for workflow automation. The goal: 40-70% cost reduction while maintaining or improving quality.

---

## Learning Objectives

By the end of this chapter, you will be able to:

1. Implement dynamic model switching based on task complexity
2. Set up multi-layer timeout protection to prevent runaway costs
3. Use YOLO mode (dangerously skip permissions) safely for trusted workflows
4. Create and compose Skills for workflow automation
5. Measure and optimize your AI development spend

---

## Source Articles

### Primary Sources
- `model-switching-strategy.md` - Comprehensive model selection guide
- `ai-cost-protection-timeouts.md` - Multi-layer timeout protection (EXPANDED Jan 27)
- `model-provider-agnostic-approach.md` - Provider independence
- `prompt-caching-strategy.md` - Caching for cost reduction
- Claude Code documentation on Skills system
- Claude Code documentation on YOLO mode

### Supplementary Sources (Added from KB Analysis Jan 27, 2026)
- `batch-api-patterns.md` (TO BE CREATED) - Batch processing for cost reduction
- `token-budgeting-strategies.md` (TO BE CREATED) - Allocating context by information density
- `skills-vs-subagents.md` (TO BE CREATED) - Decision framework for when to use each
- `cost-telemetry-patterns.md` (TO BE CREATED) - Measuring and tracking AI spend

---

## Detailed Outline

### 15.1 The Economics of AI-Assisted Development
- Cost breakdown: input tokens, output tokens, compute time
- The single-model waste problem
- ROI calculation for AI tooling
- When AI assistance pays for itself
- **Example**: Cost analysis of a typical development day

### 15.2 Model Switching Strategy
- The three-tier model hierarchy (Haiku/Sonnet/Opus)
- Task classification framework
  - Tier 1 (Haiku): Simple operations, file I/O, grep, basic edits
  - Tier 2 (Sonnet): Feature implementation, refactoring, testing
  - Tier 3 (Opus): Architecture, complex refactors, high-stakes
- Automated model selection heuristics
- Progressive model escalation
- **Exercise**: Classify your last 20 tasks by tier

### 15.3 Cost Protection with Multi-Layer Timeouts
- Why runaway costs happen
- Layer 1: Job-level timeouts (CI/CD)
- Layer 2: Request-level token caps (max_tokens)
- Layer 3: Input-level sample limits
- Layer 4: Budget alerts and hard caps
- **Example**: GitHub Actions timeout configuration

### 15.4 Prompt Caching Strategy
- How prompt caching works
- Cache-friendly prompt design
- Measuring cache hit rates
- Combining caching with model switching (94-97% savings)
- **Example**: Caching project context across sessions

### 15.5 YOLO Mode: When to Skip Permissions
- What is YOLO mode (--dangerously-skip-permissions)?
- Risk assessment framework
- Safe YOLO patterns:
  - Trusted CI/CD environments
  - Isolated development containers
  - Well-tested automation scripts
- Unsafe YOLO anti-patterns
- **Exercise**: Identify safe YOLO candidates in your workflow

### 15.6 The Skills System
- What are Claude Code Skills?
- Built-in skills overview (/commit, /review, etc.)
- Creating custom skills
- Skill composition patterns
- Skills vs sub-agents (decision framework)
- **Example**: Custom skill for deployment workflow

### 15.7 Provider-Agnostic Strategy
- Why provider independence matters
- Abstraction patterns for multi-provider support
- Fallback strategies when providers fail
- Evaluating new models quickly
- **Example**: Provider abstraction layer

### 15.8 Measuring and Optimizing Spend
- Setting up cost tracking
- Dashboard metrics to monitor
- Monthly optimization review process
- Team cost allocation
- **Exercise**: Build a cost dashboard

---

## Key Examples

### Example 1: Model Selection Function
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

type ModelTier = 'haiku' | 'sonnet' | 'opus'

interface TaskComplexity {
  filesAffected: number
  linesOfCode: number
  requiresArchitecture: boolean
  securityCritical: boolean
  multiStepPlan: boolean
}

function selectModel(task: string, complexity: TaskComplexity): ModelTier {
  // Security/performance always uses Opus
  if (complexity.securityCritical) return 'opus'

  // Architecture decisions use Opus
  if (complexity.requiresArchitecture || complexity.multiStepPlan) return 'opus'

  // Large changes use Opus
  if (complexity.filesAffected > 5 || complexity.linesOfCode > 500) return 'opus'

  // Multi-file work uses Sonnet
  if (complexity.filesAffected > 1 || complexity.linesOfCode > 50) return 'sonnet'

  // Simple patterns use Haiku
  const simplePatterns = [
    /^read /i, /^find /i, /^grep /i, /^list /i,
    /^add (comment|type)/i, /^rename /i
  ]

  if (simplePatterns.some(p => p.test(task))) return 'haiku'

  return 'sonnet' // Default
}

// Usage
const model = selectModel('Read src/api/users.ts', {
  filesAffected: 1,
  linesOfCode: 0,
  requiresArchitecture: false,
  securityCritical: false,
  multiStepPlan: false
})

await using session = unstable_v2_createSession({
  model: `claude-${model}-4-5-20250929`
})
```

### Example 2: Multi-Layer Cost Protection
```yaml
# .github/workflows/ai-task.yml
name: AI-Assisted Task

on: workflow_dispatch

jobs:
  ai-task:
    runs-on: ubuntu-latest
    timeout-minutes: 15  # Layer 1: Job timeout

    steps:
      - uses: actions/checkout@v4

      - name: Run AI Task
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MAX_TOKENS: 4096        # Layer 2: Token cap
          MAX_INPUT_FILES: 50     # Layer 3: Input limit
        run: |
          # Layer 4: Budget check
          SPENT=$(curl -s https://api.anthropic.com/usage | jq .spent)
          if [ "$SPENT" -gt 100 ]; then
            echo "Budget exceeded, aborting"
            exit 1
          fi

          node scripts/ai-task.js
```

### Example 3: Progressive Model Escalation
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk'

async function executeWithEscalation(task: string) {
  // Try Haiku first
  await using haikuSession = unstable_v2_createSession({
    model: 'claude-3-5-haiku-20241022'
  })

  const haikuResult = await haikuSession.send(task)

  // Check quality
  if (await validateResult(haikuResult) && await runTests()) {
    console.log('Haiku succeeded, saved cost!')
    return haikuResult
  }

  // Escalate to Sonnet
  console.log('Escalating to Sonnet...')
  await using sonnetSession = unstable_v2_createSession({
    model: 'claude-sonnet-4-5-20250929'
  })

  const sonnetResult = await sonnetSession.send(`
    Previous attempt with simpler model failed.

    Task: ${task}

    Previous output: ${haikuResult}

    Please improve on this.
  `)

  if (await validateResult(sonnetResult) && await runTests()) {
    return sonnetResult
  }

  // Final escalation to Opus
  console.log('Escalating to Opus...')
  await using opusSession = unstable_v2_createSession({
    model: 'claude-opus-4-5-20251101'
  })

  return opusSession.send(task)
}
```

### Example 4: Custom Skill Definition
```typescript
// .claude/skills/deploy.ts
import { defineSkill } from '@anthropic-ai/claude-agent-sdk'

export default defineSkill({
  name: 'deploy',
  description: 'Deploy to staging or production',

  arguments: {
    environment: {
      type: 'string',
      enum: ['staging', 'production'],
      required: true
    },
    skipTests: {
      type: 'boolean',
      default: false
    }
  },

  async execute({ environment, skipTests }, context) {
    // Run tests unless skipped
    if (!skipTests) {
      await context.runCommand('npm test')
    }

    // Build
    await context.runCommand('npm run build')

    // Deploy
    if (environment === 'staging') {
      await context.runCommand('npm run deploy:staging')
    } else {
      // Production requires confirmation
      const confirmed = await context.confirm(
        'Deploy to production? This affects live users.'
      )
      if (confirmed) {
        await context.runCommand('npm run deploy:production')
      }
    }

    return { deployed: true, environment }
  }
})

// Usage: /deploy staging
// Usage: /deploy production --skip-tests
```

### Example 5: Safe YOLO Automation
```bash
#!/bin/bash
# safe-yolo.sh - Automated tasks with permission skip

set -e

# Safety checks before YOLO
check_safety() {
  # Only in CI or isolated container
  if [ -z "$CI" ] && [ -z "$CONTAINER" ]; then
    echo "YOLO mode only allowed in CI or containers"
    exit 1
  fi

  # Only on non-main branches
  BRANCH=$(git branch --show-current)
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "YOLO mode not allowed on main/master"
    exit 1
  fi

  # Check for sensitive files
  if git diff --cached --name-only | grep -E '\.(env|key|pem)$'; then
    echo "Sensitive files staged, aborting"
    exit 1
  fi
}

check_safety

# Safe to run with YOLO
claude --dangerously-skip-permissions -p "
Run the full test suite and fix any failing tests.
Commit each fix with a descriptive message.
"
```

---

## Diagrams Needed

1. **Model Selection Decision Tree**
   - Task complexity → model tier mapping
   - Visual decision flow

2. **Cost Protection Layers**
   - Four layers stacked with fail-safes
   - What each layer catches

3. **Prompt Caching Architecture**
   - Cache key composition
   - Hit/miss flow

4. **Skills vs Sub-Agents**
   - When to use each
   - Comparison table as visual

5. **Cost Optimization Funnel**
   - Model switching + caching + batching
   - Cumulative savings visualization

---

## Exercises

### Exercise 1: Audit Your Model Usage
For one week, track every AI request:
- [ ] Log task description and model used
- [ ] Classify each task by tier
- [ ] Calculate actual vs optimal cost
- [ ] Implement model switching

### Exercise 2: Set Up Cost Protection
Implement multi-layer protection:
- [ ] Add job timeout to CI
- [ ] Set max_tokens on requests
- [ ] Add input size limits
- [ ] Configure budget alerts

### Exercise 3: Create a Custom Skill
Build a skill for your workflow:
- [ ] Identify a repeatable task
- [ ] Define the skill interface
- [ ] Implement the skill logic
- [ ] Test and refine

---

## Cross-References

- **Builds on**: All previous chapters (this optimizes everything)
- **Related**: Chapter 10 (RALPH Loop) - cost management for long-running agents
- **Related**: Chapter 13 (Building the Harness) - cost optimization in production

---

## Word Count Target

3,500 - 4,500 words

---

## Status

**Status**: Draft

**Milestones**:
- [x] PRD complete
- [ ] First draft
- [ ] Code examples written
- [ ] Code examples tested
- [ ] Reviewed
- [ ] Diagrams complete
- [ ] Exercises validated
- [ ] Final
