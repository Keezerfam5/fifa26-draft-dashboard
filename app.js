const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

function ownerClass(owner) {
  return String(owner || '').toLowerCase();
}

async function loadData(refresh = false) {
  if (!APPS_SCRIPT_URL.includes('script.google.com')) {
    document.getElementById('leaderboard').innerHTML =
      '<p class="error">Paste your Google Apps Script Web App URL into app.js first.</p>';
    return;
  }

  const url = APPS_SCRIPT_URL + (refresh ? '?action=refresh' : '?action=state');
  const response = await fetch(url);
  const data = await response.json();

  document.getElementById('updated').textContent =
    'Last updated: ' + new Date(data.updatedAt).toLocaleString();

  renderLeaderboard(data.leaderboard || []);
  renderOwnerCards(data.leaderboard || []);
  renderTeams(data.teams || []);
  renderGames(data.games || []);
}

function renderLeaderboard(rows) {
  document.getElementById('leaderboard').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Owner</th>
          <th>Total Points</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr class="leader-row ${ownerClass(r.owner)}">
            <td>${i + 1}</td>
            <td>${r.owner}</td>
            <td>${r.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderOwnerCards(rows) {
  document.getElementById('owners').innerHTML = `
    <div class="owner-grid">
      ${rows.map(r => `
        <div class="owner-card ${ownerClass(r.owner)}">
          <h3>${r.owner}</h3>
          <div class="points">${r.total} pts</div>
          <ul>
            ${(r.teams || []).map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTeams(rows) {
  document.getElementById('teams').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Team</th>
          <th>Owner</th>
          <th>Group</th>
          <th>Group Pts</th>
          <th>Knockout Pts</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr class="${ownerClass(r.Owner)}">
            <td>${r.Team}</td>
            <td>${r.Owner}</td>
            <td>${r.Group}</td>
            <td>${r['Group Pts'] || 0}</td>
            <td>${r['Knockout Pts'] || 0}</td>
            <td><strong>${r['Total Pts'] || 0}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderGames(rows) {
  document.getElementById('games').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Stage</th>
          <th>Group</th>
          <th>Match</th>
          <th>Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${formatDate(r.Date)}</td>
            <td>${r.Stage || ''}</td>
            <td>${r.Group || ''}</td>
            <td>${r['Team 1']} vs ${r['Team 2']}</td>
            <td>${safe(r['Score 1'])} - ${safe(r['Score 2'])}</td>
            <td>${r.Status || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date) ? value : date.toLocaleString();
}

function safe(value) {
  return value === undefined || value === null || value === '' ? '' : value;
}

document.getElementById('refreshBtn').addEventListener('click', () => loadData(true));
loadData(false);
