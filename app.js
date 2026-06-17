const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzYBlML9RJCVicRvyy6lUGOzetEM5_CAeXU1jJh4DiSC_CirhJZGWmUyi0jpZHPti8l/exec';

function ownerClass(owner) {
  return String(owner || '')
    .toLowerCase()
    .trim();
}

let dashboardData = null;

const FLAGS = {
  Mexico: 'mx',
  'South Africa': 'za',
  'South Korea': 'kr',
  Czechia: 'cz',
  Canada: 'ca',
  Bosnia: 'ba',
  Qatar: 'qa',
  Switzerland: 'ch',
  Brazil: 'br',
  Morocco: 'ma',
  Haiti: 'ht',
  Scotland: 'gb-sct',
  'United States': 'us',
  Paraguay: 'py',
  Australia: 'au',
  Turkiye: 'tr',
  Germany: 'de',
  Curacao: 'cw',
  'Ivory Coast': 'ci',
  Ecuador: 'ec',
  Netherlands: 'nl',
  Japan: 'jp',
  Sweden: 'se',
  Tunisia: 'tn',
  Belgium: 'be',
  Egypt: 'eg',
  Iran: 'ir',
  'New Zealand': 'nz',
  Spain: 'es',
  'Cape Verde': 'cv',
  'Saudi Arabia': 'sa',
  Uruguay: 'uy',
  France: 'fr',
  Senegal: 'sn',
  Iraq: 'iq',
  Norway: 'no',
  Argentina: 'ar',
  Algeria: 'dz',
  Austria: 'at',
  Jordan: 'jo',
  Portugal: 'pt',
  Congo: 'cd',
  Uzbekistan: 'uz',
  Colombia: 'co',
  England: 'gb-eng',
  Croatia: 'hr',
  Ghana: 'gh',
  Panama: 'pa'
};

function flag(team) {
  const code = FLAGS[team];
  if (!code) return '';
  return `<img class="flag" src="https://flagcdn.com/24x18/${code}.png" alt="${team} flag">`;
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
  dashboardData = data;

  document.getElementById('updated').textContent =
    'Last updated: ' + new Date(data.updatedAt).toLocaleString();

  renderHighlights(data);
  renderTicker(data.games || []);
  renderLeaderboard(data.leaderboard || []);
  renderOwnerCards(data.leaderboard || [], data.teams || []);
  renderGroupCards(data.teams || []);
  renderMatchCenter(data.games || []);
  renderTeams(data.teams || []);
}

function renderHighlights(data) {
  const teams = data.teams || [];
  const bestTeam = [...teams].sort((a, b) => Number(b['Total Pts'] || 0) - Number(a['Total Pts'] || 0))[0];
  const leader = (data.leaderboard || [])[0];

  const html = `
    <section class="highlight-grid">
      <div class="highlight-card trophy">
        <div class="label">Current Leader</div>
        <div class="big">${leader ? leader.owner : '-'}</div>
        <div>${leader ? leader.total + ' pts' : ''}</div>
      </div>
      <div class="highlight-card">
        <div class="label">Most Valuable Team</div>
        <div class="big">${bestTeam ? flag(bestTeam.Team) + ' ' + bestTeam.Team : '-'}</div>
        <div>${bestTeam ? bestTeam.Owner + ' • ' + bestTeam['Total Pts'] + ' pts' : ''}</div>
      </div>
      <div class="highlight-card">
        <div class="label">Prize Pool</div>
        <div class="big">$400</div>
        <div>Winner takes all</div>
      </div>
    </section>
  `;

  const main = document.querySelector('main');
  if (!document.getElementById('highlights')) {
    const wrap = document.createElement('div');
    wrap.id = 'highlights';
    wrap.className = 'wide';
    main.prepend(wrap);
  }

  document.getElementById('highlights').innerHTML = html;
}

function toDateKey(value) {
  const d = new Date(value);

  return d.toLocaleDateString('en-CA', {
    timeZone: 'America/New_York'
  });
}

function formatTickerDateLabel(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function renderTicker(games) {
  const dates = [...new Set(
    games
      .filter(g => g.Date)
      .map(g => toDateKey(g.Date))
  )].sort();

  const todayKey = toDateKey(new Date());
  const selectedKey = window.selectedTickerDate || (dates.includes(todayKey) ? todayKey : dates[0]);

  window.selectedTickerDate = selectedKey;

  const tickerGames = games
    .filter(g => g['Team 1'] && g['Team 2'])
    .filter(g => toDateKey(g.Date) === selectedKey)
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const html = `
    <div class="ticker-header">
      <strong>Matches</strong>
      <select id="tickerDateSelect">
        ${dates.map(d => `
          <option value="${d}" ${d === selectedKey ? 'selected' : ''}>
            ${formatTickerDateLabel(d)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="ticker-strip">
      ${tickerGames.length ? tickerGames.map(g => `
        <div class="ticker-game">
          <div class="ticker-top">
            <span>${isCompleted(g) ? 'FT' : formatShortTime(g.Date)}</span>
            <span class="ticker-tv">${g.Status || ''}</span>
          </div>

          <div class="ticker-team">
            <span>${flag(g['Team 1'])} ${g['Team 1']}</span>
            <strong>${safe(g['Score 1'])}</strong>
          </div>

          <div class="ticker-team">
            <span>${flag(g['Team 2'])} ${g['Team 2']}</span>
            <strong>${safe(g['Score 2'])}</strong>
          </div>

        <div class="ticker-odds">
  TEST
</div>
      `).join('') : `<div class="ticker-empty">No matches for this date.</div>`}
    </div>
  `;

  if (!document.getElementById('ticker')) {
    const ticker = document.createElement('div');
    ticker.id = 'ticker';
    document.querySelector('.hero').insertAdjacentElement('afterend', ticker);
  }

  document.getElementById('ticker').innerHTML = html;

  document.getElementById('tickerDateSelect').addEventListener('change', e => {
    window.selectedTickerDate = e.target.value;
    renderTicker(games);
  });
}
function formatOdds(g) {
  const odds = g.Odds || '';
  const overUnder = g['O/U'] || '';

  if (!odds) return '';

  return `${odds}${overUnder ? ' | O/U ' + overUnder : ''}`;
}

function formatShortTime(value) {
  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' ET';
}
function formatShortTime(value) {
  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' ET';
}

function renderLeaderboard(rows) {
  const medals = ['🥇', '🥈', '🥉'];

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
            <td>${medals[i] || i + 1}</td>
            <td><strong>${r.owner}</strong></td>
            <td><strong>${r.total}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderOwnerCards(rows, teams) {
  document.getElementById('owners').innerHTML = `
    <div class="owner-grid">
      ${rows.map(r => {
        const ownerTeams = teams
          .filter(t => t.Owner === r.owner)
          .sort((a, b) => Number(b['Total Pts'] || 0) - Number(a['Total Pts'] || 0));

        return `
          <div class="owner-card ${ownerClass(r.owner)}">
            <h3>${r.owner}</h3>
            <div class="points">${r.total} pts</div>
            <ul>
              ${ownerTeams.map(t => `
                <li>
                  <span>${flag(t.Team)} ${t.Team}</span>
                  <strong>${t['Total Pts'] || 0}</strong>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderGroupCards(rows) {
  const groups = groupBy(rows, 'Group');

  const html = Object.keys(groups).sort().map(group => {
    const teams = groups[group]
      .map(t => ({ ...t, total: Number(t['Total Pts'] || 0), groupPts: Number(t['Group Pts'] || 0) }))
      .sort((a, b) => b.groupPts - a.groupPts || b.total - a.total);

    return `
      <div class="group-card">
        <h3>Group ${group}</h3>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Owner</th>
              <th>Group</th>
              <th>Total</th>
              <th>Projection</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((t, i) => `
              <tr class="${ownerClass(t.Owner)}">
                <td>${flag(t.Team)} ${t.Team}</td>
                <td>${t.Owner}</td>
                <td>${t.groupPts}</td>
                <td><strong>${t.total}</strong></td>
                <td>${i < 2 ? '<span class="advance">Projected Advancing</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  if (!document.getElementById('groups')) {
    const section = document.createElement('section');
    section.id = 'groups-section';
    section.className = 'card wide';
    section.innerHTML = '<h2>Group Standings & Projected Advancement</h2><div id="groups"></div>';

    const teamsSection = document.getElementById('teams').closest('section');
    teamsSection.parentNode.insertBefore(section, teamsSection);
  }

  document.getElementById('groups').innerHTML = `<div class="group-grid">${html}</div>`;
}

function renderMatchCenter(rows) {
  const now = new Date();

  const cleaned = rows
    .filter(r => r['Team 1'] && r['Team 2'])
    .map(r => ({ ...r, dateObj: new Date(r.Date), statusText: String(r.Status || '').toLowerCase() }));

  const completed = cleaned
    .filter(r => isCompleted(r))
    .sort((a, b) => b.dateObj - a.dateObj)
    .slice(0, 10);

  const live = cleaned
    .filter(r => !isCompleted(r) && r.dateObj <= now && hasScore(r))
    .sort((a, b) => a.dateObj - b.dateObj);

  const upcoming = cleaned
    .filter(r => !isCompleted(r) && r.dateObj > now)
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 10);

  document.getElementById('games').innerHTML = `
    <div class="match-center">
      ${matchSection('🔴 Live / In Progress', live)}
      ${matchSection('✅ Recent Completed', completed)}
      ${matchSection('📅 Upcoming', upcoming)}
    </div>
  `;
}

function matchSection(title, matches) {
  return `
    <div class="match-section">
      <h3>${title}</h3>
      ${matches.length ? matches.map(matchCard).join('') : '<p class="muted">No matches in this section.</p>'}
    </div>
  `;
}

function matchCard(r) {
  return `
    <div class="match-card">
      <div class="match-date">${formatDate(r.Date)}</div>
      <div class="match-teams">
        <span>${teamWithFlag(r['Team 1'])}</span>
        <strong>${safe(r['Score 1'])} - ${safe(r['Score 2'])}</strong>
        <span>${teamWithFlag(r['Team 2'])}</span>
      </div>
      <div class="match-status">${r.Status || ''}</div>
    </div>
  `;
}

function renderTeams(rows) {
  const records = buildTeamRecords(dashboardData?.games || []);

  const sorted = [...rows].sort((a, b) =>
    String(a.Group).localeCompare(String(b.Group)) ||
    Number(b['Group Pts'] || 0) - Number(a['Group Pts'] || 0)
  );

  let previousGroup = '';

  document.getElementById('teams').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Team</th>
          <th>Owner</th>
          <th>Group</th>
          <th>Record</th>
          <th>Group Pts</th>
          <th>Knockout Pts</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(r => {
          const newGroup = r.Group !== previousGroup;
          previousGroup = r.Group;

          const rec = records[r.Team] || { w: 0, l: 0, d: 0 };

          return `
            <tr class="${ownerClass(r.Owner)} ${newGroup ? 'group-divider' : ''}">
              <td>${flag(r.Team)} ${r.Team}</td>
              <td>${r.Owner}</td>
              <td><strong>${r.Group}</strong></td>
              <td>${rec.w}-${rec.l}-${rec.d}</td>
              <td>${r['Group Pts'] || 0}</td>
              <td>${r['Knockout Pts'] || 0}</td>
              <td><strong>${r['Total Pts'] || 0}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function buildTeamRecords(games) {
  const records = {};

  games.forEach(g => {
    if (!isCompleted(g)) return;

    const t1 = g['Team 1'];
    const t2 = g['Team 2'];
    const s1 = Number(g['Score 1']);
    const s2 = Number(g['Score 2']);

    if (!t1 || !t2 || isNaN(s1) || isNaN(s2)) return;

    records[t1] = records[t1] || { w: 0, l: 0, d: 0 };
    records[t2] = records[t2] || { w: 0, l: 0, d: 0 };

    if (s1 > s2) {
      records[t1].w++;
      records[t2].l++;
    } else if (s2 > s1) {
      records[t2].w++;
      records[t1].l++;
    } else {
      records[t1].d++;
      records[t2].d++;
    }
  });

  return records;
}

function isCompleted(r) {
  const s = String(r.Status || '').toLowerCase();
  return s.includes('full time') || s.includes('final') || s.includes('complete') || s.includes('finished');
}

function hasScore(r) {
  return safe(r['Score 1']) !== '' && safe(r['Score 2']) !== '';
}

function teamWithFlag(team) {
  return `${flag(team)} <span>${team}</span>`;
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'Other';
    acc[value] = acc[value] || [];
    acc[value].push(row);
    return acc;
  }, {});
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

// auto refresh every 5 minutes
setInterval(() => {
  loadData(false);
}, 300000);
