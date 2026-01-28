#!/bin/bash
# Generate RALPH dashboard from tasks.json

cd "$(dirname "$0")/.." || exit 1

node -e "
const tasks = require('./tasks.json');
const pending = tasks.tasks.filter(t => t.status === 'pending').sort((a,b) => (b.score || 0) - (a.score || 0));
const inProgress = tasks.tasks.filter(t => t.status === 'in_progress');
const complete = tasks.tasks.filter(t => t.status === 'complete').slice(-10).reverse();

const html = \`<!DOCTYPE html>
<html>
<head>
  <title>RALPH Dashboard</title>
  <meta http-equiv='refresh' content='30'>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1rem;
      background: #fafafa;
    }
    h1 { margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .stat {
      flex: 1;
      min-width: 150px;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value { font-size: 2.5rem; font-weight: bold; }
    .stat-label { color: #666; margin-top: 0.25rem; }
    .complete .stat-value { color: #22c55e; }
    .pending .stat-value { color: #eab308; }
    .in-progress .stat-value { color: #3b82f6; }
    .blocked .stat-value { color: #ef4444; }

    .section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 { margin-top: 0; margin-bottom: 1rem; font-size: 1.25rem; }

    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
    th { color: #666; font-weight: 500; font-size: 0.875rem; }
    tr:last-child td { border-bottom: none; }

    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-complete { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }

    .score {
      font-family: monospace;
      background: #f0f0f0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .refresh-note {
      text-align: center;
      color: #999;
      font-size: 0.875rem;
      margin-top: 2rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <h1>📊 RALPH Dashboard</h1>
  <p class='subtitle'>Last updated: \${new Date().toLocaleString()}</p>

  <div class='stats'>
    <div class='stat complete'>
      <div class='stat-value'>\${tasks.stats.complete}</div>
      <div class='stat-label'>Complete</div>
    </div>
    <div class='stat in-progress'>
      <div class='stat-value'>\${tasks.stats.inProgress || 0}</div>
      <div class='stat-label'>In Progress</div>
    </div>
    <div class='stat pending'>
      <div class='stat-value'>\${tasks.stats.pending}</div>
      <div class='stat-label'>Pending</div>
    </div>
    <div class='stat blocked'>
      <div class='stat-value'>\${tasks.stats.blocked || 0}</div>
      <div class='stat-label'>Blocked</div>
    </div>
  </div>

  <div class='section'>
    <h2>Overall Progress</h2>
    <div class='progress-bar'>
      <div class='progress-fill' style='width: \${Math.round(tasks.stats.complete / tasks.stats.total * 100)}%'></div>
    </div>
    <p style='text-align: center; margin-top: 0.5rem; color: #666;'>
      \${Math.round(tasks.stats.complete / tasks.stats.total * 100)}% complete (\${tasks.stats.complete} / \${tasks.stats.total})
    </p>
  </div>

  \${inProgress.length ? \`
  <div class='section'>
    <h2>🔄 Currently In Progress</h2>
    <table>
      <tr><th>ID</th><th>Title</th><th>Type</th></tr>
      \${inProgress.map(t => \`
        <tr>
          <td><code>\${t.id}</code></td>
          <td>\${t.title}</td>
          <td>\${t.type || '-'}</td>
        </tr>
      \`).join('')}
    </table>
  </div>
  \` : ''}

  <div class='section'>
    <h2>📋 Next Up (Top 10 by Score)</h2>
    <table>
      <tr><th>ID</th><th>Title</th><th>Priority</th><th>Score</th></tr>
      \${pending.slice(0, 10).map(t => \`
        <tr>
          <td><code>\${t.id}</code></td>
          <td>\${t.title}</td>
          <td>\${t.priority || 'normal'}</td>
          <td><span class='score'>\${t.score || '-'}</span></td>
        </tr>
      \`).join('')}
    </table>
  </div>

  <div class='section'>
    <h2>✅ Recently Completed</h2>
    <table>
      <tr><th>ID</th><th>Title</th><th>Type</th></tr>
      \${complete.map(t => \`
        <tr>
          <td><code>\${t.id}</code></td>
          <td>\${t.title}</td>
          <td>\${t.type || '-'}</td>
        </tr>
      \`).join('')}
    </table>
  </div>

  <p class='refresh-note'>Auto-refreshes every 30 seconds</p>
</body>
</html>\`;
console.log(html);
" > dashboard.html

echo "Dashboard generated: dashboard.html"
