#!/usr/bin/env node
/**
 * Update Queue - Recalculates task scores and updates queue after each completion
 * Run after every task completion to keep the queue dynamic
 */

const fs = require('fs');

const TASKS_FILE = 'tasks.json';

// Scoring weights
const PRIORITY_SCORES = {
  critical: 1000,
  high: 750,
  medium: 500,
  normal: 250,
  low: 100
};

const TYPE_SCORES = {
  blocker: 200,
  chapter: 100,
  fix: 80,
  'kb-article': 60,
  diagram: 40,
  appendix: 20,
  review: 10
};

// Milestone order within a chapter (earlier = higher score)
const MILESTONE_ORDER = {
  'code written': 50,
  'code tested': 45,
  'reviewed': 40,
  'diagrams complete': 35,
  'final': 30
};

function loadTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function saveTasks(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function getChapterNumber(task) {
  if (task.chapter) {
    const match = task.chapter.match(/ch(\d+)/);
    return match ? parseInt(match[1]) : 99;
  }
  return 99;
}

function calculateScore(task, allTasks) {
  let score = 0;

  // Priority score
  score += PRIORITY_SCORES[task.priority] || PRIORITY_SCORES.normal;

  // Type score
  score += TYPE_SCORES[task.type] || 0;

  // Chapter sequence bonus (earlier chapters = higher score)
  const chapterNum = getChapterNumber(task);
  score += (20 - chapterNum) * 5; // ch01 gets +95, ch15 gets +25

  // Milestone order within chapter
  if (task.title && MILESTONE_ORDER[task.title]) {
    score += MILESTONE_ORDER[task.title];
  }

  // Review flagged bonus
  if (task.reviewFlagged) {
    score += 200;
  }

  // Blocking bonus: if this task blocks many others, prioritize it
  const blocksCount = allTasks.filter(t =>
    t.blockedBy && t.blockedBy.includes(task.id)
  ).length;
  score += blocksCount * 25;

  // Age bonus: prevent starvation (tasks waiting too long)
  if (task.createdAt) {
    const ageHours = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) score += 50;
    if (ageHours > 48) score += 50;
  }

  return Math.round(score);
}

function updateBlockedStatus(tasks) {
  const completedIds = new Set(
    tasks.filter(t => t.status === 'complete').map(t => t.id)
  );

  for (const task of tasks) {
    if (task.blockedBy && task.blockedBy.length > 0) {
      // Remove completed tasks from blockedBy
      task.blockedBy = task.blockedBy.filter(id => !completedIds.has(id));

      // If no longer blocked, update status
      if (task.blockedBy.length === 0 && task.status === 'blocked') {
        task.status = 'pending';
        console.log(`  Unblocked: ${task.id} (${task.title})`);
      }
    }

    // Also check subtasks
    if (task.subtasks) {
      updateBlockedStatus(task.subtasks);
    }
  }
}

function scoreAllTasks(tasks, allTasks) {
  for (const task of tasks) {
    if (task.status !== 'complete') {
      task.score = calculateScore(task, allTasks);
    }
    if (task.subtasks) {
      scoreAllTasks(task.subtasks, allTasks);
    }
  }
}

function flattenTasks(tasks) {
  let flat = [];
  for (const task of tasks) {
    flat.push(task);
    if (task.subtasks) {
      flat = flat.concat(flattenTasks(task.subtasks));
    }
  }
  return flat;
}

function countStats(tasks) {
  let pending = 0, inProgress = 0, complete = 0, blocked = 0;

  for (const task of tasks) {
    switch (task.status) {
      case 'pending': pending++; break;
      case 'in_progress': inProgress++; break;
      case 'complete': complete++; break;
      case 'blocked': blocked++; break;
    }
    if (task.subtasks) {
      const sub = countStats(task.subtasks);
      pending += sub.pending;
      inProgress += sub.inProgress;
      complete += sub.complete;
      blocked += sub.blocked;
    }
  }

  return { pending, inProgress, complete, blocked, total: pending + inProgress + complete + blocked };
}

function getNextTask(tasks) {
  const flat = flattenTasks(tasks);
  const pending = flat
    .filter(t => t.status === 'pending' && (!t.blockedBy || t.blockedBy.length === 0))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return pending[0] || null;
}

function run() {
  console.log('=== Updating Task Queue ===\n');

  const data = loadTasks();
  const allTasks = flattenTasks(data.tasks);

  // Update blocked statuses
  console.log('Updating blocked statuses...');
  updateBlockedStatus(data.tasks);

  // Recalculate scores
  console.log('Recalculating scores...');
  scoreAllTasks(data.tasks, allTasks);

  // Sort top-level tasks by score (highest first)
  data.tasks.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Update stats
  data.stats = countStats(data.tasks);

  // Save
  saveTasks(data);

  // Report
  console.log('\n=== Queue Updated ===\n');
  console.log(`Stats: ${data.stats.pending} pending, ${data.stats.complete} complete, ${data.stats.blocked} blocked`);

  const next = getNextTask(data.tasks);
  if (next) {
    console.log(`\nNext task: ${next.id} (score: ${next.score})`);
    console.log(`  Type: ${next.type}`);
    console.log(`  Title: ${next.title}`);
  } else {
    console.log('\nNo pending tasks!');
  }
}

run();
