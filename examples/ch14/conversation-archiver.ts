/**
 * Chapter 14: Conversation Archiver
 *
 * Demonstrates treating prompts and specs as first-class assets.
 * Uses Claude to extract key insights from conversations and
 * maintain a searchable knowledge base.
 *
 * Key concept: Code is derivative. Specs + prompts are the source.
 */

import Anthropic from "@anthropic-ai/sdk";

// Conversation structure
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  feature: string;
  messages: ConversationMessage[];
  startTime: Date;
  endTime: Date;
}

// Extracted insights
interface ExtractedInsights {
  decisions: Array<{
    decision: string;
    rationale: string;
    alternatives: string[];
  }>;
  problems: Array<{
    problem: string;
    solution: string;
    learnings: string;
  }>;
  patterns: Array<{
    name: string;
    description: string;
    applicability: string;
  }>;
  claudeMdAdditions: string[];
  regenerationPrompt: string;
}

// Archive entry
interface ArchiveEntry {
  id: string;
  feature: string;
  timestamp: string;
  wordCount: number;
  messageCount: number;
  insights: ExtractedInsights;
  originalPath?: string;
}

// Preservation strategies
export const PRESERVATION_STRATEGIES = {
  localArchive: {
    name: "Local Archive",
    description: "Simple folder in .claude/conversation-archive/",
    pros: ["Simple", "In repo", "Version controlled"],
    cons: ["Large files", "May contain secrets"],
    implementation: `mkdir -p .claude/conversation-archive`,
  },
  gitCommits: {
    name: "Git-Based Commits",
    description: "Snapshot conversations alongside code changes",
    pros: ["Tied to commits", "Full history per feature"],
    cons: ["Bloats repo", "Needs .gitignore tuning"],
    implementation: `git add .claude/conversations/ && git commit -m "chore: archive conversation"`,
  },
  extraction: {
    name: "Automated Extraction",
    description: "Mine conversations for patterns, document in knowledge base",
    pros: ["Curated", "Searchable", "No raw noise"],
    cons: ["Requires extraction step"],
    implementation: "Use Claude to extract decisions, problems, patterns",
  },
  cloudSync: {
    name: "Cloud Sync",
    description: "Rsync/Dropbox to cloud storage",
    pros: ["Automatic backup", "Cross-machine access"],
    cons: ["Cloud dependency", "Privacy concerns"],
    implementation: `rsync -av ~/.claude/conversations/ s3://bucket/conversations/`,
  },
};

// Extract insights from a conversation using Claude
export async function extractInsights(
  client: Anthropic,
  conversation: Conversation
): Promise<ExtractedInsights> {
  // Format conversation for analysis
  const formattedConversation = conversation.messages
    .map(
      (m) =>
        `[${m.role.toUpperCase()}]: ${m.content.substring(0, 500)}${m.content.length > 500 ? "..." : ""}`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Review this conversation about "${conversation.feature}" and extract key insights:

${formattedConversation}

Extract and format as JSON:
{
  "decisions": [{"decision": "what was decided", "rationale": "why", "alternatives": ["rejected option 1", "rejected option 2"]}],
  "problems": [{"problem": "what went wrong", "solution": "how it was fixed", "learnings": "what to remember"}],
  "patterns": [{"name": "pattern name", "description": "how it works", "applicability": "when to use it"}],
  "claudeMdAdditions": ["instruction 1 to add to CLAUDE.md", "instruction 2"],
  "regenerationPrompt": "A prompt that could regenerate the code from this conversation"
}

Respond only with valid JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    return {
      decisions: [],
      problems: [],
      patterns: [],
      claudeMdAdditions: [],
      regenerationPrompt: "",
    };
  }

  try {
    // Extract JSON from the response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return empty insights if parsing fails
  }

  return {
    decisions: [],
    problems: [],
    patterns: [],
    claudeMdAdditions: [],
    regenerationPrompt: "",
  };
}

// Create an archive entry
export function createArchiveEntry(
  conversation: Conversation,
  insights: ExtractedInsights
): ArchiveEntry {
  const totalWords = conversation.messages.reduce(
    (sum, m) => sum + m.content.split(/\s+/).length,
    0
  );

  return {
    id: conversation.id,
    feature: conversation.feature,
    timestamp: conversation.endTime.toISOString(),
    wordCount: totalWords,
    messageCount: conversation.messages.length,
    insights,
  };
}

// Generate markdown for the knowledge base
export function generateKnowledgeBaseEntry(entry: ArchiveEntry): string {
  const date = new Date(entry.timestamp).toISOString().split("T")[0];

  let markdown = `# Session: ${entry.feature}

**Date:** ${date}
**Messages:** ${entry.messageCount}
**Words:** ${entry.wordCount}

## Key Decisions

`;

  for (const decision of entry.insights.decisions) {
    markdown += `### ${decision.decision}

**Rationale:** ${decision.rationale}

**Alternatives considered:**
${decision.alternatives.map((a) => `- ${a}`).join("\n")}

`;
  }

  markdown += `## Problems & Solutions

`;

  for (const problem of entry.insights.problems) {
    markdown += `### ${problem.problem}

**Solution:** ${problem.solution}

**Learnings:** ${problem.learnings}

`;
  }

  markdown += `## Patterns Discovered

`;

  for (const pattern of entry.insights.patterns) {
    markdown += `### ${pattern.name}

${pattern.description}

**When to use:** ${pattern.applicability}

`;
  }

  if (entry.insights.claudeMdAdditions.length > 0) {
    markdown += `## CLAUDE.md Additions

The following should be added to your CLAUDE.md:

\`\`\`markdown
${entry.insights.claudeMdAdditions.join("\n")}
\`\`\`

`;
  }

  markdown += `## Regeneration Prompt

If you need to regenerate this code, use:

\`\`\`
${entry.insights.regenerationPrompt}
\`\`\`
`;

  return markdown;
}

// Generate a feature spec template
export function generateSpecTemplate(featureName: string): string {
  return `# Feature: ${featureName}

## Overview
[Brief description of what this feature does]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Edge Cases
- [ ] Edge case 1: [description and expected behavior]
- [ ] Edge case 2: [description and expected behavior]

## Success Criteria
- [ ] Criterion 1: [measurable outcome]
- [ ] Criterion 2: [measurable outcome]

## Constraints

### Performance
- Max latency: [target]
- Memory budget: [target]

### Security
- Authentication: [requirements]
- Authorization: [requirements]

### Correctness
- Data integrity: [requirements]
- Error handling: [requirements]

## Dependencies
- [Service/library 1]
- [Service/library 2]

## API Design
\`\`\`typescript
// Proposed interface
interface ${featureName.replace(/\s+/g, "")}Config {
  // Configuration options
}

function ${featureName.replace(/\s+/g, "").toLowerCase()}(config: ${featureName.replace(/\s+/g, "")}Config): void {
  // Implementation
}
\`\`\`

## Test Plan
1. Unit tests for [component]
2. Integration tests for [flow]
3. E2E tests for [scenario]

## Notes
[Any additional context or decisions]
`;
}

// Analyze conversation for preservation value
export function analyzePreservationValue(conversation: Conversation): {
  value: "high" | "medium" | "low";
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Check message count
  if (conversation.messages.length > 20) {
    score += 2;
    reasons.push("Long conversation (20+ messages) suggests complex work");
  } else if (conversation.messages.length > 10) {
    score += 1;
    reasons.push("Medium-length conversation with substantial content");
  }

  // Check for key indicators in content
  const allContent = conversation.messages.map((m) => m.content).join(" ");

  if (
    /decision|chose|decided|went with|picked/i.test(allContent)
  ) {
    score += 2;
    reasons.push("Contains architectural or design decisions");
  }

  if (/problem|issue|bug|error|fix/i.test(allContent)) {
    score += 1;
    reasons.push("Documents problem-solving process");
  }

  if (/pattern|approach|strategy|architecture/i.test(allContent)) {
    score += 2;
    reasons.push("Discusses reusable patterns");
  }

  if (/tradeoff|alternative|option|consider/i.test(allContent)) {
    score += 1;
    reasons.push("Explores tradeoffs and alternatives");
  }

  // Duration check
  const durationMs =
    conversation.endTime.getTime() - conversation.startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours > 1) {
    score += 2;
    reasons.push(`Long session (${durationHours.toFixed(1)} hours)`);
  }

  // Determine value level
  let value: "high" | "medium" | "low";
  if (score >= 5) {
    value = "high";
  } else if (score >= 3) {
    value = "medium";
  } else {
    value = "low";
  }

  return { value, reasons };
}

// Demo function
async function demo() {
  console.log("=== Conversation Archiver Demo ===\n");

  // Sample conversation
  const sampleConversation: Conversation = {
    id: "conv-20260128-auth",
    feature: "Authentication System",
    startTime: new Date("2026-01-28T10:00:00"),
    endTime: new Date("2026-01-28T12:30:00"),
    messages: [
      {
        role: "user",
        content:
          "I need to implement JWT authentication for our API. Should I use refresh tokens?",
        timestamp: new Date("2026-01-28T10:00:00"),
      },
      {
        role: "assistant",
        content:
          "Yes, refresh tokens provide better security. I recommend using short-lived access tokens (15 min) with longer-lived refresh tokens (7 days). This limits the window of compromise.",
        timestamp: new Date("2026-01-28T10:01:00"),
      },
      {
        role: "user",
        content:
          "What about storing the refresh token? localStorage seems convenient but I heard it's insecure.",
        timestamp: new Date("2026-01-28T10:05:00"),
      },
      {
        role: "assistant",
        content:
          "You're right to be cautious. localStorage is vulnerable to XSS attacks. Instead, use httpOnly cookies for refresh tokens. They can't be accessed by JavaScript, which prevents token theft via XSS.",
        timestamp: new Date("2026-01-28T10:06:00"),
      },
    ],
  };

  // Analyze preservation value
  console.log("--- Preservation Value Analysis ---");
  const valueAnalysis = analyzePreservationValue(sampleConversation);
  console.log(`Value: ${valueAnalysis.value}`);
  console.log("Reasons:");
  for (const reason of valueAnalysis.reasons) {
    console.log(`  - ${reason}`);
  }
  console.log();

  // Show preservation strategies
  console.log("--- Preservation Strategies ---");
  for (const [_key, strategy] of Object.entries(PRESERVATION_STRATEGIES)) {
    console.log(`\n${strategy.name}:`);
    console.log(`  ${strategy.description}`);
    console.log(`  Pros: ${strategy.pros.join(", ")}`);
    console.log(`  Cons: ${strategy.cons.join(", ")}`);
  }
  console.log();

  // Generate spec template
  console.log("--- Feature Spec Template ---");
  console.log(generateSpecTemplate("User Authentication"));

  // Show sample extraction output
  console.log("\n--- Sample Extracted Insights ---");
  const sampleInsights: ExtractedInsights = {
    decisions: [
      {
        decision: "Use short-lived access tokens (15 min) with refresh tokens",
        rationale:
          "Limits compromise window while maintaining good UX with refresh mechanism",
        alternatives: [
          "Long-lived access tokens (simpler but less secure)",
          "Session-based auth (more server state)",
        ],
      },
      {
        decision: "Store refresh tokens in httpOnly cookies",
        rationale: "Prevents XSS attacks from stealing tokens",
        alternatives: [
          "localStorage (convenient but XSS vulnerable)",
          "sessionStorage (same XSS concern)",
        ],
      },
    ],
    problems: [
      {
        problem: "Token storage security",
        solution: "Use httpOnly cookies instead of localStorage",
        learnings: "Always consider XSS vectors when storing sensitive data",
      },
    ],
    patterns: [
      {
        name: "Access/Refresh Token Pattern",
        description:
          "Short-lived access tokens for API calls, long-lived refresh tokens for renewal",
        applicability:
          "Any API that needs to balance security with user experience",
      },
    ],
    claudeMdAdditions: [
      "Use httpOnly cookies for storing authentication tokens",
      "Access token TTL: 15 minutes; Refresh token TTL: 7 days",
    ],
    regenerationPrompt:
      "Implement JWT authentication with short-lived access tokens (15 min) and refresh tokens (7 days). Store refresh tokens in httpOnly cookies. Include token rotation on refresh.",
  };

  const archiveEntry = createArchiveEntry(sampleConversation, sampleInsights);
  console.log(`Archive ID: ${archiveEntry.id}`);
  console.log(`Feature: ${archiveEntry.feature}`);
  console.log(`Messages: ${archiveEntry.messageCount}`);
  console.log(`Words: ${archiveEntry.wordCount}`);

  console.log("\n--- Generated Knowledge Base Entry ---");
  console.log(generateKnowledgeBaseEntry(archiveEntry));
}

// Run demo if executed directly
if (import.meta.main) {
  demo().catch(console.error);
}

export type {
  Conversation,
  ConversationMessage,
  ExtractedInsights,
  ArchiveEntry,
};
