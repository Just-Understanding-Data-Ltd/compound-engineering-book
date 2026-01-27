#!/usr/bin/env node
const fs = require('fs');
const features = JSON.parse(fs.readFileSync('features.json', 'utf8'));

const tasks = [];
let id = 1;

function nextId() {
  return `task-${String(id++).padStart(3, '0')}`;
}

// Convert chapter milestones to tasks with subtasks
for (const [chKey, ch] of Object.entries(features.chapters)) {
  const chapterTaskId = nextId();
  const subtasks = [];

  for (const [milestone, done] of Object.entries(ch.milestones)) {
    if (!done) {
      subtasks.push({
        id: nextId(),
        parentId: chapterTaskId,
        type: "milestone",
        title: milestone.replace(/_/g, ' '),
        status: "pending"
      });
    }
  }

  if (subtasks.length > 0) {
    tasks.push({
      id: chapterTaskId,
      type: "chapter",
      chapter: chKey,
      title: `${chKey}: ${ch.title}`,
      description: `Complete remaining milestones for ${ch.title}`,
      status: "pending",
      priority: "high",
      subtasks: subtasks
    });
  }
}

// Convert KB articles
for (const kb of features.tasks.kbArticlesToCreate || []) {
  tasks.push({
    id: nextId(),
    type: "kb-article",
    title: kb.title,
    description: kb.description,
    status: kb.status,
    priority: "normal"
  });
}

// Convert appendices with subtasks for each section
const appendixParentId = nextId();
const appendixSubtasks = [];
for (const app of features.tasks.appendices || []) {
  appendixSubtasks.push({
    id: nextId(),
    parentId: appendixParentId,
    type: "appendix",
    title: app.title,
    status: app.status
  });
}
if (appendixSubtasks.length > 0) {
  tasks.push({
    id: appendixParentId,
    type: "appendices",
    title: "Write all appendices",
    description: "Complete appendices A-D",
    status: "pending",
    priority: "low",
    subtasks: appendixSubtasks
  });
}

// Convert cross-ref fixes as subtasks
const xrefParentId = nextId();
const xrefSubtasks = [];
for (const xref of features.tasks.crossRefFixes || []) {
  xrefSubtasks.push({
    id: nextId(),
    parentId: xrefParentId,
    type: "fix",
    title: xref.issue,
    file: xref.file,
    line: xref.line,
    status: xref.status
  });
}
if (xrefSubtasks.length > 0) {
  tasks.push({
    id: xrefParentId,
    type: "fixes",
    title: "Fix cross-references",
    description: "Update chapter cross-references for new numbering",
    status: "pending",
    priority: "medium",
    subtasks: xrefSubtasks
  });
}

// Convert general review tasks
const reviewParentId = nextId();
const reviewSubtasks = [];
for (const rev of features.tasks.generalReview || []) {
  reviewSubtasks.push({
    id: nextId(),
    parentId: reviewParentId,
    type: "review",
    title: rev.task,
    status: rev.status
  });
}
if (reviewSubtasks.length > 0) {
  tasks.push({
    id: reviewParentId,
    type: "review",
    title: "Final review cycle",
    description: "Complete all review tasks before publishing",
    status: "pending",
    priority: "low",
    subtasks: reviewSubtasks
  });
}

// Convert diagram tasks - group by chapter
for (const [chKey, diagrams] of Object.entries(features.diagramTasks?.highPriority || {})) {
  const diagParentId = nextId();
  const diagSubtasks = diagrams.map(diag => ({
    id: nextId(),
    parentId: diagParentId,
    type: "diagram",
    title: diag,
    status: "pending"
  }));

  tasks.push({
    id: diagParentId,
    type: "diagrams",
    chapter: chKey,
    title: `${chKey}: High-priority diagrams`,
    description: `Create ${diagrams.length} diagrams for ${chKey}`,
    status: "pending",
    priority: "high",
    subtasks: diagSubtasks
  });
}

for (const [chKey, diagrams] of Object.entries(features.diagramTasks?.mediumPriority || {})) {
  const diagParentId = nextId();
  const diagSubtasks = diagrams.map(diag => ({
    id: nextId(),
    parentId: diagParentId,
    type: "diagram",
    title: diag,
    status: "pending"
  }));

  tasks.push({
    id: diagParentId,
    type: "diagrams",
    chapter: chKey,
    title: `${chKey}: Medium-priority diagrams`,
    description: `Create ${diagrams.length} diagrams for ${chKey}`,
    status: "pending",
    priority: "medium",
    subtasks: diagSubtasks
  });
}

// Count stats
function countTasks(taskList) {
  let pending = 0, complete = 0;
  for (const t of taskList) {
    if (t.status === "pending") pending++;
    if (t.status === "complete") complete++;
    if (t.subtasks) {
      const sub = countTasks(t.subtasks);
      pending += sub.pending;
      complete += sub.complete;
    }
  }
  return { pending, complete };
}

const counts = countTasks(tasks);

// Keep PRDs section from original features.json
const prds = features.prds || {};

const output = {
  lastUpdated: new Date().toISOString(),
  version: "2.0",
  description: "Hierarchical task list with subtasks. PRDs preserved for reference.",

  prds: prds,

  queryExamples: {
    allPending: "jq '[.tasks[] | select(.status == \"pending\")] | length' tasks.json",
    nextTask: "jq '.tasks[] | select(.status == \"pending\") | .title' tasks.json | head -1",
    byType: "jq '[.tasks[] | select(.type == \"chapter\")] | length' tasks.json",
    subtasks: "jq '.tasks[] | select(.subtasks) | {title, count: (.subtasks | length)}' tasks.json"
  },

  tasks: tasks,

  completed: {
    summary: "Compacted completed tasks - full details in git history",
    count: 0,
    items: []
  },

  stats: {
    pending: counts.pending,
    inProgress: 0,
    complete: counts.complete,
    blocked: 0,
    total: counts.pending + counts.complete
  }
};

fs.writeFileSync('tasks.json', JSON.stringify(output, null, 2));
console.log(`Generated ${tasks.length} top-level tasks`);
console.log(`Total items: ${counts.pending + counts.complete} (${counts.pending} pending, ${counts.complete} complete)`);
