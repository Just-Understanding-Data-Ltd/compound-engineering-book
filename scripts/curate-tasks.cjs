const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));

// Score calculation function
function calculateScore(task, allTasks) {
  // Priority scores
  const priorityScores = {
    critical: 1000,
    high: 750,
    medium: 500,
    normal: 250,
    low: 100
  };

  // Type scores
  const typeScores = {
    chapter: 100,
    fix: 80,
    'kb-article': 60,
    diagram: 40,
    infra: 30,
    appendix: 20,
    prd: 50,
    infrastructure: 30
  };

  let score = priorityScores[task.priority] || 250;
  score += typeScores[task.type] || 0;

  // Blocking bonus: +25 per task this blocks
  const blocksCount = allTasks.filter(t =>
    t.blockedBy && t.blockedBy.includes(task.id)
  ).length;
  score += blocksCount * 25;

  return score;
}

// Update scores for all pending tasks
const pendingTasks = data.tasks.filter(t => t.status === 'pending');
const allTasks = data.tasks;

console.log('Recalculating scores for pending tasks:\n');
pendingTasks.forEach(task => {
  const oldScore = task.score;
  const newScore = calculateScore(task, allTasks);
  task.score = newScore;
  console.log(`${task.id}: ${oldScore} -> ${newScore} (${task.priority}/${task.type})`);
});

// Fix stats
const actualPending = data.tasks.filter(t => t.status === 'pending').length;
const actualBlocked = data.tasks.filter(t => t.status === 'blocked').length;
const actualInProgress = data.tasks.filter(t => t.status === 'in_progress').length;

console.log('\nUpdating stats:');
console.log(`  pending: ${data.stats.pending} -> ${actualPending}`);
console.log(`  blocked: ${data.stats.blocked} -> ${actualBlocked}`);
console.log(`  inProgress: ${data.stats.inProgress} -> ${actualInProgress}`);
console.log(`  complete: ${data.stats.complete} (unchanged - includes compacted)`);

data.stats.pending = actualPending;
data.stats.blocked = actualBlocked;
data.stats.inProgress = actualInProgress;

// Update lastUpdated
data.lastUpdated = new Date().toISOString();

// Update curator notes
const today = new Date().toISOString().split('T')[0];
data.curatorNotes = `Curation cycle ${today}: Recalculated ${pendingTasks.length} pending task scores using documented formula (priority + type + blocking bonus). Stats corrected. Complete count includes compacted tasks.`;

// Write back
fs.writeFileSync('tasks.json', JSON.stringify(data, null, 2));
console.log('\ntasks.json updated');
