#!/usr/bin/env node
/**
 * Task Validation Script
 * Validates tasks.json structure, recalculates stats, and checks for issues
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

function loadTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    console.error('ERROR: tasks.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function saveTasks(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

function countTasksRecursive(tasks) {
  let pending = 0, inProgress = 0, complete = 0, blocked = 0;

  for (const task of tasks) {
    switch (task.status) {
      case 'pending': pending++; break;
      case 'in_progress': inProgress++; break;
      case 'complete': complete++; break;
      case 'blocked': blocked++; break;
    }

    if (task.subtasks && Array.isArray(task.subtasks)) {
      const sub = countTasksRecursive(task.subtasks);
      pending += sub.pending;
      inProgress += sub.inProgress;
      complete += sub.complete;
      blocked += sub.blocked;
    }
  }

  return { pending, inProgress, complete, blocked };
}

function validateTaskStructure(task, errors, path = '') {
  const taskPath = path ? `${path}.${task.id}` : task.id;

  if (!task.id) errors.push(`${taskPath}: Missing id`);
  if (!task.type) errors.push(`${taskPath}: Missing type`);
  if (!task.title) errors.push(`${taskPath}: Missing title`);
  if (!task.status) errors.push(`${taskPath}: Missing status`);

  const validStatuses = ['pending', 'in_progress', 'complete', 'blocked'];
  if (task.status && !validStatuses.includes(task.status)) {
    errors.push(`${taskPath}: Invalid status "${task.status}"`);
  }

  // Check blocked tasks have blockedBy
  if (task.status === 'blocked' && (!task.blockedBy || task.blockedBy.length === 0)) {
    errors.push(`${taskPath}: Status is blocked but no blockedBy specified`);
  }

  // Validate subtasks
  if (task.subtasks) {
    if (!Array.isArray(task.subtasks)) {
      errors.push(`${taskPath}: subtasks must be an array`);
    } else {
      for (const subtask of task.subtasks) {
        validateTaskStructure(subtask, errors, taskPath);
      }
    }
  }
}

function checkDependencies(tasks, errors) {
  const taskIds = new Set();

  // Collect all task IDs
  function collectIds(taskList) {
    for (const task of taskList) {
      taskIds.add(task.id);
      if (task.subtasks) collectIds(task.subtasks);
    }
  }
  collectIds(tasks);

  // Check blockedBy references exist
  function checkBlockedBy(taskList) {
    for (const task of taskList) {
      if (task.blockedBy) {
        for (const blockerId of task.blockedBy) {
          if (!taskIds.has(blockerId)) {
            errors.push(`${task.id}: blockedBy references non-existent task "${blockerId}"`);
          }
        }
      }
      if (task.subtasks) checkBlockedBy(task.subtasks);
    }
  }
  checkBlockedBy(tasks);
}

function findCircularDependencies(tasks, errors) {
  const graph = new Map();

  function buildGraph(taskList) {
    for (const task of taskList) {
      graph.set(task.id, task.blockedBy || []);
      if (task.subtasks) buildGraph(task.subtasks);
    }
  }
  buildGraph(tasks);

  function hasCycle(taskId, visited, recStack) {
    visited.add(taskId);
    recStack.add(taskId);

    for (const dep of graph.get(taskId) || []) {
      if (!visited.has(dep)) {
        if (hasCycle(dep, visited, recStack)) return true;
      } else if (recStack.has(dep)) {
        return true;
      }
    }

    recStack.delete(taskId);
    return false;
  }

  const visited = new Set();
  for (const taskId of graph.keys()) {
    if (!visited.has(taskId)) {
      if (hasCycle(taskId, visited, new Set())) {
        errors.push(`Circular dependency detected involving task "${taskId}"`);
      }
    }
  }
}

function run(fix = false) {
  console.log('=== Task Validation ===\n');

  const data = loadTasks();
  const errors = [];
  const warnings = [];

  // Validate structure
  console.log('Checking task structure...');
  for (const task of data.tasks || []) {
    validateTaskStructure(task, errors);
  }

  // Check dependencies
  console.log('Checking dependencies...');
  checkDependencies(data.tasks || [], errors);

  // Check for circular dependencies
  console.log('Checking for circular dependencies...');
  findCircularDependencies(data.tasks || [], errors);

  // Recalculate stats
  console.log('Recalculating stats...');
  const counts = countTasksRecursive(data.tasks || []);
  const total = counts.pending + counts.inProgress + counts.complete + counts.blocked;

  const statsMatch =
    data.stats.pending === counts.pending &&
    data.stats.inProgress === counts.inProgress &&
    data.stats.complete === counts.complete &&
    data.stats.blocked === counts.blocked;

  if (!statsMatch) {
    warnings.push(`Stats mismatch - stored vs calculated:`);
    warnings.push(`  pending: ${data.stats.pending} vs ${counts.pending}`);
    warnings.push(`  inProgress: ${data.stats.inProgress} vs ${counts.inProgress}`);
    warnings.push(`  complete: ${data.stats.complete} vs ${counts.complete}`);
    warnings.push(`  blocked: ${data.stats.blocked} vs ${counts.blocked}`);

    if (fix) {
      data.stats = { ...counts, total };
      saveTasks(data);
      console.log('  ✓ Stats fixed');
    }
  }

  // Report results
  console.log('\n=== Results ===\n');

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} errors found:`);
    for (const err of errors) {
      console.log(`   - ${err}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warnings:`);
    for (const warn of warnings) {
      console.log(`   ${warn}`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed');
  }

  console.log(`\n📊 Task counts: ${counts.pending} pending, ${counts.inProgress} in progress, ${counts.complete} complete, ${counts.blocked} blocked (${total} total)`);

  return errors.length === 0;
}

// CLI
const args = process.argv.slice(2);
const fix = args.includes('--fix');

if (args.includes('--help')) {
  console.log('Usage: node validate-tasks.cjs [--fix]');
  console.log('  --fix    Automatically fix stats mismatches');
  process.exit(0);
}

const success = run(fix);
process.exit(success ? 0 : 1);
