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
renderKnockoutBracket(data.games || []);
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
            ${formatOdds(g)}
          </div>
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


function renderLeaderboard(rows) {
  const medals = ['🥇', '🥈', '🥉'];

  document.getElementById('leaderboard').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Owner</th>
          <th>Current</th>
          <th>Remaining</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr class="leader-row ${ownerClass(r.owner)}">
            <td>${medals[i] || i + 1}</td>
            <td><strong>${r.owner}</strong></td>
            <td><strong>${r.total || 0}</strong></td>
            <td>${r.remainingPossible || 0}</td>
            <td><strong>${r.maxPossible || 0}</strong></td>
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
  const games = dashboardData?.games || [];
  const records = buildTeamRecords(games);

  const html = Object.keys(groups).sort().map(group => {
    const teams = groups[group]
      .map(t => {
        const projection = calculateAdvancementProjection(t, groups[group], games, records);

        return {
          ...t,
          total: Number(t['Total Pts'] || 0),
          groupPts: Number(t['Group Pts'] || 0),
          projection
        };
      })
      .sort((a, b) =>
        b.projection - a.projection ||
        b.groupPts - a.groupPts ||
        b.total - a.total ||
        String(a.Team).localeCompare(String(b.Team))
      );

    return `
      <div class="group-card">
        <h3>Group ${group}</h3>
        <table>
          <thead>
            <tr>
              <th>Place</th>
              <th>Team</th>
              <th>Owner</th>
              <th>Pts</th>
              <th>Adv %</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((t, i) => `
              <tr class="${ownerClass(t.Owner)} ${i < 2 ? 'projected-row' : ''}">
                <td><strong>${i + 1}</strong></td>
                <td>${flag(t.Team)} ${t.Team}</td>
                <td>${t.Owner}</td>
                <td><strong>${t.groupPts}</strong></td>
                <td>
                  <span class="${t.projection >= 50 ? 'advance' : 'not-advancing'}">
                    ${t.projection}%
                  </span>
                </td>
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
    section.innerHTML = '<h2>Group Standings & Advancement Projection</h2><div id="groups"></div>';

    const teamsSection = document.getElementById('teams').closest('section');
    teamsSection.parentNode.insertBefore(section, teamsSection);
  }

  document.getElementById('groups').innerHTML = `<div class="group-grid">${html}</div>`;
}

function renderKnockoutBracket(games) {
  const knockoutGames = games
    .filter(g => String(g.Stage || '').toLowerCase() !== 'group')
    .filter(g => g['Team 1'] && g['Team 2'])
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const r32 = knockoutGames.filter(g => g.Stage === 'Round of 32');
  const r16 = knockoutGames.filter(g => g.Stage === 'Round of 16');
  const qf = knockoutGames.filter(g => g.Stage === 'Quarterfinal');
  const sf = knockoutGames.filter(g => g.Stage === 'Semifinal');
  const third = knockoutGames.filter(g => g.Stage === 'Third Place');
  const final = knockoutGames.filter(g => g.Stage === 'Final');

  const html = `
    <div class="worldcup-bracket-scroll">
      <div class="worldcup-bracket">

        <div class="bracket-wing left-wing">
          ${bracketColumn('Round of 32', r32.slice(0, 8))}
          ${bracketColumn('Round of 16', r16.slice(0, 4))}
          ${bracketColumn('Quarterfinals', qf.slice(0, 2))}
          ${bracketColumn('Semifinal', sf.slice(0, 1))}
        </div>

        <div class="bracket-championship">
          <div class="trophy">🏆</div>
          <h3>Final</h3>
          ${final.length ? final.map(g => bracketGame(g)).join('') : '<div class="champ-card">Final TBD</div>'}

          <h3>3rd Place</h3>
          ${third.length ? third.map(g => bracketGame(g)).join('') : '<div class="champ-card">3rd Place TBD</div>'}
        </div>

        <div class="bracket-wing right-wing">
          ${bracketColumn('Semifinal', sf.slice(1, 2))}
          ${bracketColumn('Quarterfinals', qf.slice(2, 4))}
          ${bracketColumn('Round of 16', r16.slice(4, 8))}
          ${bracketColumn('Round of 32', r32.slice(8, 16))}
        </div>

      </div>
    </div>
  `;

  if (!document.getElementById('bracket-section')) {
    const section = document.createElement('section');
    section.id = 'bracket-section';
    section.className = 'card wide';
    section.innerHTML = '<h2>Knockout Bracket</h2><div id="bracket"></div>';

    const ownersSection = document.getElementById('owners').closest('section');
    ownersSection.insertAdjacentElement('afterend', section);
  }

  document.getElementById('bracket').innerHTML = html;
}

function bracketColumn(title, games) {
  return `
    <div class="bracket-column">
      <h3>${title}</h3>
      <div class="bracket-column-games">
        ${games.length ? games.map(g => bracketGame(g)).join('') : '<div class="bracket-placeholder">TBD</div>'}
      </div>
    </div>
  `;
}

function bracketGame(g) {
  return `
    <div class="bracket-game">
      <div class="bracket-date">${formatDate(g.Date)}</div>
      <div class="bracket-team">
        <span>${teamLabel(g['Team 1'])}</span>
        <strong>${safe(g['Score 1'])}</strong>
      </div>
      <div class="bracket-team">
        <span>${teamLabel(g['Team 2'])}</span>
        <strong>${safe(g['Score 2'])}</strong>
      </div>
      <div class="bracket-status">${g.Status || ''}</div>
    </div>
  `;
}

function teamLabel(team) {
  if (!team) return '';

  const lower = String(team).toLowerCase();

  if (lower.includes('winner') || lower.includes('loser')) {
    return `<span class="placeholder-team">${team}</span>`;
  }

  return `${flag(team)} ${team}`;
}

function calculateAdvancementProjection(team, groupTeams, games, records) {
  const teamName = team.Team;
  const currentPts = Number(team['Group Pts'] || 0);
const rec = records[normalizeTeamName(teamName)] || { w: 0, l: 0, d: 0 };

  const played = rec.w + rec.l + rec.d;
  const remaining = Math.max(0, 3 - played);

  let projectedPts = currentPts + remaining * 1.5;

  const groupMax = groupTeams.map(t => {
    const r = records[t.Team] || { w: 0, l: 0, d: 0 };
    const p = r.w + r.l + r.d;
    const rem = Math.max(0, 3 - p);
    return Number(t['Group Pts'] || 0) + rem * 1.5;
  });

  const sorted = [...groupMax].sort((a, b) => b - a);
  const secondPlaceTarget = sorted[1] || 0;

  let percentage = 50 + ((projectedPts - secondPlaceTarget) * 18);

  if (currentPts > secondPlaceTarget) percentage += 10;
  if (remaining === 0 && projectedPts >= secondPlaceTarget) percentage = 95;
  if (remaining === 0 && projectedPts < secondPlaceTarget) percentage = 5;

  return Math.max(1, Math.min(99, Math.round(percentage)));
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

const rec = records[normalizeTeamName(r.Team)] || { w: 0, l: 0, d: 0 };

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

    const t1Display = g['Team 1'];
    const t2Display = g['Team 2'];
    const t1 = normalizeTeamName(t1Display);
    const t2 = normalizeTeamName(t2Display);

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

function normalizeTeamName(value) {
  let v = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const aliases = {
    'usa': 'united states',
    'u s a': 'united states',
    'united states': 'united states',
    'united states of america': 'united states',

    'turkey': 'turkiye',
    'turkiye': 'turkiye',

    'bosnia': 'bosnia',
    'bosnia herzegovina': 'bosnia',
    'bosnia and herzegovina': 'bosnia',

    'curacao': 'curacao',

    'cote d ivoire': 'ivory coast',
    'ivory coast': 'ivory coast',

    'dr congo': 'congo',
    'congo dr': 'congo',
    'democratic republic of congo': 'congo',
    'democratic republic of the congo': 'congo'
  };

  return aliases[v] || v;
}

document.getElementById('refreshBtn').addEventListener('click', () => loadData(true));

loadData(false);

// auto refresh every 5 minutes
setInterval(() => {
  loadData(false);
}, 300000);
