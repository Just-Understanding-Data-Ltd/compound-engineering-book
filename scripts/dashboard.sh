#!/bin/bash
# Generate RALPH dashboard from tasks.json + git + system state

cd "$(dirname "$0")/.." || exit 1

# Get git commits
RECENT_COMMITS=$(git log --oneline -8 2>/dev/null | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

# Get Ralph status
RALPH_PID=$(pgrep -f "ralph.sh" | head -1)
if [ -n "$RALPH_PID" ]; then
  RALPH_STATUS="running"
  RALPH_START=$(ps -o lstart= -p "$RALPH_PID" 2>/dev/null | xargs)
else
  RALPH_STATUS="stopped"
  RALPH_START=""
fi

# Get current iteration
ITERATION=$(cat .ralph-state 2>/dev/null || echo "0")

# Get chapter file info
CHAPTERS_MD=$(ls -1 chapters/ch*.md 2>/dev/null | wc -l | tr -d ' ')
CHAPTERS_ADOC=$(ls -1 asciidoc/ch*.adoc 2>/dev/null | wc -l | tr -d ' ')

node -e "
const fs = require('fs');
const tasks = require('./tasks.json');

// Task calculations
const allTasks = tasks.tasks || [];
const pending = allTasks.filter(t => t.status === 'pending').sort((a,b) => (b.score || 0) - (a.score || 0));
const inProgress = allTasks.filter(t => t.status === 'in_progress');
const complete = allTasks.filter(t => t.status === 'complete');
const blocked = allTasks.filter(t => t.status === 'blocked');
const recentComplete = complete.slice(-10).reverse();

// Chapter progress
const chapterTasks = allTasks.filter(t => t.type === 'chapter');
const chapterComplete = chapterTasks.filter(t => t.status === 'complete').length;

// AsciiDoc conversion progress
const asciidocTasks = allTasks.filter(t => t.title && t.title.includes('AsciiDoc'));
const asciidocComplete = asciidocTasks.filter(t => t.status === 'complete').length;

// Task types breakdown
const byType = {};
allTasks.forEach(t => {
  const type = t.type || 'other';
  if (!byType[type]) byType[type] = { total: 0, complete: 0 };
  byType[type].total++;
  if (t.status === 'complete') byType[type].complete++;
});

// Velocity (tasks completed in last hour based on timestamps)
const oneHourAgo = Date.now() - 3600000;
const recentlyCompleted = complete.filter(t => t.completedAt && new Date(t.completedAt) > oneHourAgo).length;

const ralphStatus = '${RALPH_STATUS}';
const ralphStart = '${RALPH_START}';
const iteration = ${ITERATION};
const recentCommits = \`${RECENT_COMMITS}\`.split('\\\\n').filter(Boolean);
const chaptersMarkdown = ${CHAPTERS_MD};
const chaptersAsciidoc = ${CHAPTERS_ADOC};

const html = \`<!DOCTYPE html>
<html>
<head>
  <title>RALPH Dashboard</title>
  <meta http-equiv='refresh' content='15'>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      color: #e2e8f0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #334155;
    }
    .header h1 { font-size: 1.75rem; font-weight: 600; }
    .header h1 span { color: #22c55e; }
    .timestamp { color: #94a3b8; font-size: 0.875rem; }

    .ralph-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: \${ralphStatus === 'running' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      border: 1px solid \${ralphStatus === 'running' ? '#22c55e' : '#ef4444'};
      border-radius: 8px;
    }
    .ralph-status .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: \${ralphStatus === 'running' ? '#22c55e' : '#ef4444'};
      animation: \${ralphStatus === 'running' ? 'pulse 2s infinite' : 'none'};
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .grid-wide { grid-template-columns: 1fr 1fr; }

    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.25rem;
      backdrop-filter: blur(10px);
    }
    .card h2 {
      font-size: 0.875rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .stat {
      text-align: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.5);
      border-radius: 8px;
    }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
    .stat.complete .stat-value { color: #22c55e; }
    .stat.pending .stat-value { color: #eab308; }
    .stat.in-progress .stat-value { color: #3b82f6; }
    .stat.blocked .stat-value { color: #ef4444; }

    .progress-container { margin-top: 1rem; }
    .progress-bar {
      width: 100%;
      height: 12px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border-radius: 6px;
      transition: width 0.5s ease;
    }
    .progress-text {
      text-align: center;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; color: #64748b; font-weight: 500; padding: 0.5rem; border-bottom: 1px solid #334155; }
    td { padding: 0.625rem 0.5rem; border-bottom: 1px solid #1e293b; }
    tr:hover { background: rgba(51, 65, 85, 0.3); }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-score { background: #3b82f6; color: white; font-family: monospace; }
    .badge-type { background: #334155; color: #94a3b8; }
    .badge-priority-critical { background: #ef4444; color: white; }
    .badge-priority-high { background: #f97316; color: white; }
    .badge-priority-medium { background: #eab308; color: #1e293b; }

    .commit-list { list-style: none; }
    .commit-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #1e293b;
      font-family: monospace;
      font-size: 0.8rem;
      display: flex;
      gap: 0.75rem;
    }
    .commit-list li:last-child { border-bottom: none; }
    .commit-hash { color: #22c55e; }
    .commit-msg { color: #e2e8f0; }

    .mini-stat {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #1e293b;
    }
    .mini-stat:last-child { border-bottom: none; }
    .mini-stat-label { color: #94a3b8; }
    .mini-stat-value { font-weight: 600; }

    .type-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .type-bar-label { width: 80px; font-size: 0.75rem; color: #94a3b8; }
    .type-bar-track { flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .type-bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
    .type-bar-count { font-size: 0.75rem; color: #64748b; width: 50px; text-align: right; }

    .footer {
      text-align: center;
      color: #64748b;
      font-size: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div class='header'>
    <h1>📊 <span>RALPH</span> Dashboard</h1>
    <div class='ralph-status'>
      <div class='dot'></div>
      <span>\${ralphStatus === 'running' ? 'Running' : 'Stopped'} \${ralphStatus === 'running' ? '• Iteration ' + iteration : ''}</span>
    </div>
  </div>
  <p class='timestamp'>Last updated: \${new Date().toLocaleString()} • Auto-refreshes every 15s</p>

  <div class='card' style='margin: 1.5rem 0;'>
    <div class='stats-grid'>
      <div class='stat complete'>
        <div class='stat-value'>\${tasks.stats?.complete || complete.length}</div>
        <div class='stat-label'>Complete</div>
      </div>
      <div class='stat in-progress'>
        <div class='stat-value'>\${inProgress.length}</div>
        <div class='stat-label'>In Progress</div>
      </div>
      <div class='stat pending'>
        <div class='stat-value'>\${pending.length}</div>
        <div class='stat-label'>Pending</div>
      </div>
      <div class='stat blocked'>
        <div class='stat-value'>\${blocked.length}</div>
        <div class='stat-label'>Blocked</div>
      </div>
    </div>
    <div class='progress-container'>
      <div class='progress-bar'>
        <div class='progress-fill' style='width: \${Math.round(complete.length / allTasks.length * 100)}%'></div>
      </div>
      <div class='progress-text'>\${Math.round(complete.length / allTasks.length * 100)}% complete • \${complete.length} / \${allTasks.length} tasks</div>
    </div>
  </div>

  <div class='grid grid-wide'>
    <div class='card'>
      <h2>📋 Next Up (by score)</h2>
      <table>
        <tr><th>Task</th><th>Title</th><th>Score</th></tr>
        \${pending.slice(0, 8).map(t => \`
          <tr>
            <td><code style='color: #94a3b8;'>\${t.id}</code></td>
            <td>\${t.title?.substring(0, 50)}\${t.title?.length > 50 ? '...' : ''}</td>
            <td><span class='badge badge-score'>\${t.score || '-'}</span></td>
          </tr>
        \`).join('')}
      </table>
    </div>

    <div class='card'>
      <h2>✅ Recently Completed</h2>
      <table>
        <tr><th>Task</th><th>Title</th><th>Type</th></tr>
        \${recentComplete.map(t => \`
          <tr>
            <td><code style='color: #22c55e;'>\${t.id}</code></td>
            <td>\${t.title?.substring(0, 45)}\${t.title?.length > 45 ? '...' : ''}</td>
            <td><span class='badge badge-type'>\${t.type || '-'}</span></td>
          </tr>
        \`).join('')}
      </table>
    </div>
  </div>

  <div class='grid' style='grid-template-columns: 1fr 1fr 1fr; margin-top: 1rem;'>
    <div class='card'>
      <h2>🔀 Recent Commits</h2>
      <ul class='commit-list'>
        \${recentCommits.slice(0, 6).map(c => {
          const parts = c.split(' ');
          const hash = parts[0];
          const msg = parts.slice(1).join(' ');
          return \`<li><span class='commit-hash'>\${hash}</span><span class='commit-msg'>\${msg.substring(0, 40)}\${msg.length > 40 ? '...' : ''}</span></li>\`;
        }).join('')}
      </ul>
    </div>

    <div class='card'>
      <h2>📈 Progress by Type</h2>
      \${Object.entries(byType).sort((a,b) => b[1].total - a[1].total).slice(0, 6).map(([type, data]) => \`
        <div class='type-bar'>
          <div class='type-bar-label'>\${type}</div>
          <div class='type-bar-track'>
            <div class='type-bar-fill' style='width: \${Math.round(data.complete / data.total * 100)}%'></div>
          </div>
          <div class='type-bar-count'>\${data.complete}/\${data.total}</div>
        </div>
      \`).join('')}
    </div>

    <div class='card'>
      <h2>📊 Session Stats</h2>
      <div class='mini-stat'>
        <span class='mini-stat-label'>Velocity (last hr)</span>
        <span class='mini-stat-value'>\${recentlyCompleted} tasks/hr</span>
      </div>
      <div class='mini-stat'>
        <span class='mini-stat-label'>Current Iteration</span>
        <span class='mini-stat-value'>\${iteration}</span>
      </div>
      <div class='mini-stat'>
        <span class='mini-stat-label'>Chapters (MD)</span>
        <span class='mini-stat-value'>\${chaptersMarkdown}</span>
      </div>
      <div class='mini-stat'>
        <span class='mini-stat-label'>Chapters (AsciiDoc)</span>
        <span class='mini-stat-value'>\${chaptersAsciidoc}</span>
      </div>
      <div class='mini-stat'>
        <span class='mini-stat-label'>AsciiDoc Tasks</span>
        <span class='mini-stat-value'>\${asciidocComplete}/\${asciidocTasks.length}</span>
      </div>
    </div>
  </div>

  <div class='footer'>
    The Meta-Engineer: 10x Was the Floor • RALPH Autonomous Loop • \${allTasks.length} total tasks tracked
  </div>
</body>
</html>\`;
console.log(html);
" > dashboard.html

echo "Dashboard generated: dashboard.html"
open dashboard.html
