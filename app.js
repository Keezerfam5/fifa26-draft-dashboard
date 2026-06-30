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
  console.log('First game object:', data.games?.[0]);

  document.getElementById('updated').textContent =
    'Last updated: ' + new Date(data.updatedAt).toLocaleString();

  // renderHighlights(data);
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
<div class="highlight-card leader-highlight">
  <div class="label">Current Leader</div>
  <div class="big">${leader ? leader.owner : '-'}</div>
  <div class="subtext">${leader ? leader.total + ' pts' : ''}</div>
</div>
      <div class="highlight-card">
        <div class="label">Most Valuable Team</div>
        <div class="big">${bestTeam
  ? `<span class="team-link" onclick="openTeamModal('${bestTeam.Team}')">
       ${flag(bestTeam.Team)} ${bestTeam.Team}
     </span>`
  : '-'}</div>
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
<div
  class="ticker-game"
  onclick="openMatchModal(dashboardData.games[${games.indexOf(g)}])"
>
          <div class="ticker-top">
<span>${tickerPrimaryStatus(g)}${tickerWinnerText(g)}</span>
            <span class="ticker-tv">${g.Clock || g.Status || ''}</span>
          </div>

          <div class="ticker-team">
            <span>${flag(g['Team 1'])} ${g['Team 1']}</span>
            <strong>${safe(g['Score 1'])}</strong>
          </div>

          <div class="ticker-team">
            <span>${flag(g['Team 2'])} ${g['Team 2']}</span>
            <strong>${safe(g['Score 2'])}</strong>
          </div>

<div class="ticker-location">
${venueWithCity(g)}
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
  const odds = g.Odds || g.odds || g['Betting Line'] || g.Line || '';
  const overUnder = g['O/U'] || g.OU || g['Over/Under'] || g.OverUnder || g.Total || '';

  if (!odds && !overUnder) return 'Odds unavailable';

  return `${odds || ''}${odds && overUnder ? ' | ' : ''}${overUnder ? 'O/U ' + overUnder : ''}`;
}

function venueWithCity(g) {
  const venue = g.Location || g.Venue || '';
  if (!venue) return '';

  const cityMap = {
    'Estadio Banorte': 'Mexico City',
    'Mercedes-Benz Stadium': 'Atlanta',
    'SoFi Stadium': 'Los Angeles',
    'BC Place': 'Vancouver',
    'Estadio Akron': 'Guadalajara',
    'Lumen Field': 'Seattle',
    'Gillette Stadium': 'Foxborough',
    'Lincoln Financial Field': 'Philadelphia',
    "Levi's Stadium": 'Santa Clara',
    'NRG Stadium': 'Houston',
    'BMO Field': 'Toronto',
    'GEHA Field at Arrowhead Stadium': 'Kansas City',
    'Estadio BBVA': 'Monterrey',
    'Hard Rock Stadium': 'Miami',
    'AT&T Stadium': 'Dallas'
  };

  return cityMap[venue] ? `${venue} - ${cityMap[venue]}` : venue;
}

function openMatchModal(game) {
  const modal = document.getElementById('matchModal');
  const body = document.getElementById('matchModalBody');

  body.innerHTML = `
    <h2>${game.Stage || ''} Match Detail</h2>

    <div class="modal-scoreline">
      <div>${flag(game['Team 1'])} ${game['Team 1']}</div>
      <div class="modal-score">${safe(game['Score 1']) || '-'} - ${safe(game['Score 2']) || '-'}</div>
      <div class="away">${flag(game['Team 2'])} ${game['Team 2']}</div>
    </div>

    <div class="modal-detail-grid">
      <div class="modal-detail">
        <div class="label">Status</div>
        <div>${game.Status || '-'}</div>
      </div>
      <div class="modal-detail">
        <div class="label">Date / Time</div>
        <div>${formatDate(game.Date)}</div>
      </div>
      <div class="modal-detail">
        <div class="label">Stage</div>
        <div>${game.Stage || '-'}</div>
      </div>
      <div class="modal-detail">
        <div class="label">Group</div>
        <div>${game.Group || game['Group Name'] || game.group || '-'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Odds</div>
        <div>${game.Odds || game.odds || game['Betting Line'] || game.Line || 'Unavailable'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Over / Under</div>
        <div>${game['O/U'] || game.OU || game['Over/Under'] || game.OverUnder || game.Total || 'Unavailable'}</div>
      </div>
            <div class="modal-detail">
        <div class="label">Location</div>
        <div>${game.Location || game.Venue || 'Unavailable'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Weather at Kickoff</div>
        <div>${game.Weather || 'Not connected yet'}</div>
      </div>
      </div>
          <h3 style="margin-top:18px;">Box Score</h3>

    <div class="modal-detail-grid">
      <div class="modal-detail">
        <div class="label">Goalscorers</div>
        <div>${game.Goalscorers || 'Coming soon'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Cards</div>
        <div>${game.Cards || 'Coming soon'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Possession</div>
        <div>${game.Possession || 'Coming soon'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Shots</div>
        <div>${game.Shots || 'Coming soon'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Lineups</div>
        <div>${game.Lineups || 'Coming soon'}</div>
      </div>

      <div class="modal-detail">
        <div class="label">Box Score API</div>
        <div>${game.BoxScore || 'Not connected yet'}</div>
      </div>
    </div>
    </div>
  `;

  modal.classList.add('open');
}

function openTeamModal(teamName) {
  const modal = document.getElementById('teamModal');
  const body = document.getElementById('teamModalBody');

  const teamKey = normalizeTeamName(teamName);
  const team = (dashboardData.teams || []).find(t => normalizeTeamName(t.Team) === teamKey);
  const games = dashboardData.games || [];
  const records = buildTeamRecords(games);
  const rec = records[teamKey] || { w: 0, l: 0, d: 0 };

  const teamGames = games
    .filter(g =>
      normalizeTeamName(g['Team 1']) === teamKey ||
      normalizeTeamName(g['Team 2']) === teamKey
    )
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const completed = teamGames.filter(isCompleted);
  const upcoming = teamGames.filter(g => !isCompleted(g));

  const stats = summarizeTeamStats(teamName, completed);

  body.innerHTML = `
    <h2>${flag(team?.Team || teamName)} ${team?.Team || teamName}</h2>

    <div class="modal-detail-grid">
      <div class="modal-detail"><div class="label">Owner</div><div>${team?.Owner || '-'}</div></div>
      <div class="modal-detail"><div class="label">Group</div><div>${team?.Group || '-'}</div></div>
      <div class="modal-detail"><div class="label">Record</div><div>${rec.w}-${rec.l}-${rec.d}</div></div>
      <div class="modal-detail"><div class="label">Group Points</div><div>${team?.['Group Pts'] || 0}</div></div>
      <div class="modal-detail"><div class="label">Knockout Points</div><div>${team?.['Knockout Pts'] || 0}</div></div>
      <div class="modal-detail"><div class="label">Total Points</div><div>${team?.['Total Pts'] || 0}</div></div>
    </div>

    <h3>Team Stats</h3>
    <div class="modal-detail-grid">
      <div class="modal-detail"><div class="label">Goals For</div><div>${stats.gf}</div></div>
      <div class="modal-detail"><div class="label">Goals Against</div><div>${stats.ga}</div></div>
      <div class="modal-detail"><div class="label">Goal Difference</div><div>${stats.gd}</div></div>
      <div class="modal-detail"><div class="label">Matches Played</div><div>${completed.length}</div></div>
    </div>

    <h3>Completed Matches</h3>
    ${completed.length ? completed.map(teamGameRow).join('') : '<p class="muted">No completed matches yet.</p>'}

    <h3>Upcoming Matches</h3>
    ${upcoming.length ? upcoming.map(teamGameRow).join('') : '<p class="muted">No upcoming matches found.</p>'}

    <h3>Roster / Lineups</h3>
    ${extractTeamLineups(teamName, completed) || '<p class="muted">Roster data not available yet.</p>'}
  `;

  modal.classList.add('open');
}

function openOwnerModal(ownerName) {
  const modal = document.getElementById('ownerModal');
  const body = document.getElementById('ownerModalBody');

  const owner = (dashboardData.leaderboard || []).find(o => o.owner === ownerName);
const ownerTitlePct = owner?.titlePct || 0;
  const teams = (dashboardData.teams || [])
    .filter(t => t.Owner === ownerName)
    .sort((a, b) => Number(b['Total Pts'] || 0) - Number(a['Total Pts'] || 0));

  const bestTeam = teams[0];
  const totalTeams = teams.length;
  const advancingTeams = teams.filter(t => {
    const groupRows = (dashboardData.teams || []).filter(x => x.Group === t.Group);
    const games = dashboardData.games || [];
    const records = buildTeamRecords(games);

    const ranked = groupRows.map(team => {
      const goalStats = getTeamGoalStats(team.Team, games);
      return {
        ...team,
        groupPts: Number(team['Group Pts'] || 0),
        gd: goalStats.gd,
        gf: goalStats.gf
      };
    }).sort((a, b) =>
      b.groupPts - a.groupPts ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      String(a.Team).localeCompare(String(b.Team))
    );

    return ranked.slice(0, 2).some(x => normalizeTeamName(x.Team) === normalizeTeamName(t.Team));
  });

  const atRiskTeams = teams.filter(t => !advancingTeams.some(a => normalizeTeamName(a.Team) === normalizeTeamName(t.Team)));

  body.innerHTML = `
    <h2>${ownerName} Analytics</h2>

    <div class="modal-detail-grid">
      <div class="modal-detail"><div class="label">Current Points</div><div>${owner?.total || 0}</div></div>
      <div class="modal-detail"><div class="label">Remaining Possible</div><div>${owner?.remainingPossible || 0}</div></div>
      <div class="modal-detail"><div class="label">Max Possible</div><div>${owner?.maxPossible || 0}</div></div>
<div class="modal-detail">
  <div class="label">Title %</div>
  <div>${ownerTitlePct}%</div>
</div>
      <div class="modal-detail"><div class="label">Projected Advancing</div><div>${advancingTeams.length}</div></div>
      <div class="modal-detail"><div class="label">At Risk</div><div>${atRiskTeams.length}</div></div>
    </div>

    <h3>Best Draft Pick</h3>
    ${bestTeam ? `
      <div class="match-card" onclick="openTeamModal('${bestTeam.Team}')">
        <strong>${flag(bestTeam.Team)} ${bestTeam.Team}</strong>
        <div class="muted">${bestTeam['Total Pts'] || 0} pts • Group ${bestTeam.Group}</div>
      </div>
    ` : '<p class="muted">No teams found.</p>'}

    <h3>Projected Advancing Teams</h3>
    ${advancingTeams.length ? advancingTeams.map(t => `
      <div class="match-card" onclick="openTeamModal('${t.Team}')">
        <strong>${flag(t.Team)} ${t.Team}</strong>
       ${(() => {
  const gs = getTeamGoalStats(t.Team, dashboardData?.games || []);
  const pd = gs.gd > 0 ? '+' + gs.gd : gs.gd;

  return `<div class="muted">${t['Group Pts'] || 0} group pts • PD ${pd} • ${t['Total Pts'] || 0} total pts</div>`;
})()}
      </div>
    `).join('') : '<p class="muted">No teams currently projected to advance.</p>'}

    <h3>At-Risk Teams</h3>
    ${atRiskTeams.length ? atRiskTeams.map(t => `
      <div class="match-card" onclick="openTeamModal('${t.Team}')">
        <strong>${flag(t.Team)} ${t.Team}</strong>
        ${(() => {
  const gs = getTeamGoalStats(t.Team, dashboardData?.games || []);
  const pd = gs.gd > 0 ? '+' + gs.gd : gs.gd;

  return `<div class="muted">${t['Group Pts'] || 0} group pts • PD ${pd} • ${t['Total Pts'] || 0} total pts</div>`;
})()}
      </div>
    `).join('') : '<p class="muted">No at-risk teams right now.</p>'}

<h3>Simulation Breakdown</h3>
<div class="sim-table-wrap">
  <table class="sim-table">
    <thead>
      <tr>
        <th>Team</th>
        <th>Adv</th>
        <th>R16</th>
        <th>QF</th>
        <th>SF</th>
        <th>Final</th>
        <th>Win</th>
        <th>Proj</th>
      </tr>
    </thead>
    <tbody>
      ${teams.map(t => `
        <tr>
          <td>${flag(t.Team)} ${t.Team}</td>
          <td>${t.SimAdv || 0}%</td>
          <td>${t.SimR16 || 0}%</td>
          <td>${t.SimQF || 0}%</td>
          <td>${t.SimSF || 0}%</td>
          <td>${t.SimFinal || 0}%</td>
          <td>${t.SimWinner || 0}%</td>
          <td><strong>${t.SimExpectedPts || t['Total Pts'] || 0}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

    <h3>All Teams</h3>
    ${teams.map(t => `
      <div class="match-card" onclick="openTeamModal('${t.Team}')">
        <strong>${flag(t.Team)} ${t.Team}</strong>
        ${(() => {
  const gs = getTeamGoalStats(t.Team, dashboardData?.games || []);
  const pd = gs.gd > 0 ? '+' + gs.gd : gs.gd;

  return `<div class="muted">${t['Group Pts'] || 0} group pts • PD ${pd} • ${t['Total Pts'] || 0} total pts</div>`;
})()}
      </div>
    `).join('')}
  `;

  modal.classList.add('open');
}

function summarizeTeamStats(teamName, games) {
  const key = normalizeTeamName(teamName);
  let gf = 0;
  let ga = 0;

  games.forEach(g => {
    const t1 = normalizeTeamName(g['Team 1']);
    const t2 = normalizeTeamName(g['Team 2']);
    const s1 = Number(g['Score 1']);
    const s2 = Number(g['Score 2']);

    if (isNaN(s1) || isNaN(s2)) return;

    if (t1 === key) {
      gf += s1;
      ga += s2;
    }

    if (t2 === key) {
      gf += s2;
      ga += s1;
    }
  });

  return { gf, ga, gd: gf - ga };
}

function getTeamGoalStats(teamName, games) {
  const key = normalizeTeamName(teamName);
  let gf = 0;
  let ga = 0;

  games.forEach(g => {
    if (!isCompleted(g)) return;
    if (String(g.Stage || '').toLowerCase() !== 'group') return;

    const t1 = normalizeTeamName(g['Team 1']);
    const t2 = normalizeTeamName(g['Team 2']);
    const s1 = Number(g['Score 1']);
    const s2 = Number(g['Score 2']);

    if (isNaN(s1) || isNaN(s2)) return;

    if (t1 === key) {
      gf += s1;
      ga += s2;
    }

    if (t2 === key) {
      gf += s2;
      ga += s1;
    }
  });

  return {
    gf,
    ga,
    gd: gf - ga
  };
}

function teamGameRow(g) {
  return `
    <div class="match-card" onclick="openMatchModal(${JSON.stringify(g).replace(/"/g,'&quot;')})">
      <div class="match-date">${formatDate(g.Date)}</div>
      <div class="match-teams">
        <span>${teamWithFlag(g['Team 1'])}</span>
        <strong>${safe(g['Score 1'])} - ${safe(g['Score 2'])}</strong>
        <span>${teamWithFlag(g['Team 2'])}</span>
      </div>
      <div class="match-status">${g.Status || ''}</div>
    </div>
  `;
}

function extractTeamLineups(teamName, games) {
  const key = normalizeTeamName(teamName);

  return games
    .map(g => g.Lineups || '')
    .filter(Boolean)
    .filter(lineup => normalizeTeamName(lineup).includes(key))
    .join('<hr>');
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

function tickerPrimaryStatus(g) {
  if (isCompleted(g)) return 'FT';

  const status = String(g.Status || '').trim();
  const clock = String(g.Clock || '').trim();

  const hasStarted =
    clock ||
    status.toLowerCase().includes('half') ||
    status.toLowerCase().includes('progress') ||
    status.toLowerCase().includes('halftime');

  if (hasStarted && !status.toLowerCase().includes('scheduled')) {
    return status || 'Live';
  }

  return `${status || 'Scheduled'} • ${formatShortTime(g.Date)}`;
}

function tickerWinnerText(g) {
  if (!isCompleted(g)) return '';

  const winner = getWinner(g);
  if (!winner) return '';

  return ` • ${winner} adv.`;
}

function calculateTitleProbabilities(rows) {
  const teams = dashboardData?.teams || [];
  const games = dashboardData?.games || [];
  const records = buildTeamRecords(games);

  const SIMS = 1000;
  const wins = {};

  rows.forEach(r => wins[r.owner] = 0);

  const teamInputs = teams
    .filter(team => team.Owner)
    .map(team => {
      const groupTeams = teams.filter(t => t.Group === team.Group);
      const advPct = calculateAdvancementProjection(team, groupTeams, games, records) / 100;
      const strength = teamStrengthScore(team, games);

      const teamKey = normalizeTeamName(team.Team);
      const completedGroupGames = games.filter(g =>
        isCompleted(g) &&
        String(g.Stage || '').toLowerCase() === 'group' &&
        (
          normalizeTeamName(g['Team 1']) === teamKey ||
          normalizeTeamName(g['Team 2']) === teamKey
        )
      ).length;

      return {
        owner: team.Owner,
        advPct,
        strength,
        remainingGroupGames: Math.max(0, 3 - completedGroupGames)
      };
    });

  for (let i = 0; i < SIMS; i++) {
    const ownerTotals = {};

    rows.forEach(r => {
      ownerTotals[r.owner] = Number(r.total || 0);
    });

    teamInputs.forEach(team => {
      ownerTotals[team.owner] += simulateRemainingGroupPointsFast(
        team.remainingGroupGames,
        team.strength
      );

      if (Math.random() < team.advPct) {
        ownerTotals[team.owner] += simulateKnockoutPoints(team, team.strength);
      }
    });

    const winner = Object.entries(ownerTotals)
      .sort((a, b) => b[1] - a[1])[0][0];

    wins[winner]++;
  }

  return rows.reduce((acc, r) => {
    acc[r.owner] = Math.round((wins[r.owner] / SIMS) * 100);
    return acc;
  }, {});
}

function simulateRemainingGroupPointsFast(remaining, strength) {
  let points = 0;

  for (let i = 0; i < remaining; i++) {
    const roll = Math.random();
    const winChance = Math.min(0.7, Math.max(0.2, 0.38 + strength * 0.04));
    const drawChance = 0.25;

    if (roll < winChance) points += 3;
    else if (roll < winChance + drawChance) points += 1;
  }

  return points;
}

function simulateRemainingGroupPoints(team, games, strength) {
  const teamKey = normalizeTeamName(team.Team);

  const completedGroupGames = games.filter(g =>
    isCompleted(g) &&
    String(g.Stage || '').toLowerCase() === 'group' &&
    (
      normalizeTeamName(g['Team 1']) === teamKey ||
      normalizeTeamName(g['Team 2']) === teamKey
    )
  ).length;

  const remaining = Math.max(0, 3 - completedGroupGames);

  let points = 0;

  for (let i = 0; i < remaining; i++) {
    const roll = Math.random();

    const winChance = Math.min(0.7, Math.max(0.2, 0.38 + strength * 0.04));
    const drawChance = 0.25;

    if (roll < winChance) points += 3;
    else if (roll < winChance + drawChance) points += 1;
  }

  return points;
}

function simulateKnockoutPoints(team, strength) {
  let points = 0;

  const r16Chance = Math.min(0.9, Math.max(0.25, 0.45 + strength * 0.05));
  const qfChance = Math.min(0.8, Math.max(0.15, 0.32 + strength * 0.045));
  const sfChance = Math.min(0.7, Math.max(0.08, 0.22 + strength * 0.04));
  const finalChance = Math.min(0.55, Math.max(0.04, 0.14 + strength * 0.035));
  const winChance = Math.min(0.4, Math.max(0.02, 0.08 + strength * 0.03));

  if (Math.random() < r16Chance) points += 5;
  if (Math.random() < qfChance) points += 10;
  if (Math.random() < sfChance) points += 15;

  if (Math.random() < finalChance) {
    if (Math.random() < winChance) points += 30;
    else points += 20;
  }

  return points;
}

function teamStrengthScore(team, games) {
  const stats = getTeamGoalStats(team.Team, games);
  const groupPts = Number(team['Group Pts'] || 0);
  const totalPts = Number(team['Total Pts'] || 0);

  return (
    groupPts * 0.8 +
    stats.gd * 0.7 +
    stats.gf * 0.3 +
    totalPts * 0.15 +
    baselineTeamStrength(team.Team)
  );
}

function baselineTeamStrength(teamName) {
  const strengths = {
    France: 6,
    Brazil: 6,
    Argentina: 6,
    England: 5.5,
    Spain: 5.5,
    Portugal: 5.5,
    Germany: 5.5,
    Netherlands: 5,
    Belgium: 4.5,
    Uruguay: 4.5,
    Colombia: 4,
    Croatia: 4,
    Mexico: 3.5,
    'United States': 3.5,
    Morocco: 3.5,
    Switzerland: 3.5,
    Japan: 3.5,
    Austria: 3,
    Sweden: 3,
    Ecuador: 3,
    Senegal: 3,
    Norway: 3
  };

  return strengths[teamName] || 1.5;
}

function estimateTeamRemainingValue(team, games, advPct) {
  const teamKey = normalizeTeamName(team.Team);

  const completedGroupGames = games.filter(g =>
    isCompleted(g) &&
    String(g.Stage || '').toLowerCase() === 'group' &&
    (
      normalizeTeamName(g['Team 1']) === teamKey ||
      normalizeTeamName(g['Team 2']) === teamKey
    )
  ).length;

  const remainingGroupGames = Math.max(0, 3 - completedGroupGames);
  const expectedGroupPts = remainingGroupGames * 1.35;

  const knockoutPts = Number(team['Knockout Pts'] || 0);
  const maxKnockoutRemaining = Math.max(0, 60 - knockoutPts);

  return expectedGroupPts + (maxKnockoutRemaining * advPct);
}

function renderLeaderboard(rows) {
  const medals = ['🥇', '🥈', '🥉'];
const titleOdds = {};

  document.getElementById('leaderboard').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Owner</th>
          <th>Current</th>
          <th>Remaining</th>
          <th>Max</th>
          <th>Title %</th>
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
<td><strong>${r.titlePct || 0}%</strong></td>
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
<div class="owner-card-header" onclick="openOwnerModal('${r.owner}')">
  <h3>${r.owner}</h3>
  <div class="owner-header-actions">
    <span class="owner-title-pct">${r.titlePct || 0}%</span>
    <span class="analytics-pill">Analytics</span>
  </div>
</div>
    <div class="points">${r.total} pts</div>

<div class="owner-team-header">
  <span>Team</span>
  <span>Cur</span>
<span>Proj</span>
<span>Likely</span>
</div>

<ul>
  ${ownerTeams.map(t => `
   <li class="owner-team-row">
  <span class="team-link" onclick="openTeamModal('${t.Team}')">
    ${flag(t.Team)} ${t.Team}
  </span>
  <strong>${t['Total Pts'] || 0}</strong>
  <strong>${Math.round(Number(t.SimExpectedPts || t['Total Pts'] || 0))}</strong>
  ${likelyRound(t)}
</li>
  `).join('')}
</ul>       
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function likelyRound(t) {
  const current = Number(t['Total Pts'] || 0);
  const ko = Number(t['Knockout Pts'] || 0);
  const projected = Number(t.SimExpectedPts || current);

  const r16 = Math.max(Number(t.SimR16 || 0), ko >= 5 ? 100 : 0);
  const qf = Math.max(Number(t.SimQF || 0), ko >= 10 ? 100 : 0);
  const sf = Math.max(Number(t.SimSF || 0), ko >= 15 ? 100 : 0);
  const final = Number(t.SimFinal || 0);
  const winner = Number(t.SimWinner || 0);

  if (projected <= current && ko === 0 && r16 === 0 && qf === 0 && sf === 0 && final === 0 && winner === 0) {
    return `<span class="round-badge out">OUT</span>`;
  }

  if (winner >= 10) return `<span class="round-badge champ">🏆 ${winner}%</span>`;
  if (final >= 20) return `<span class="round-badge final">F ${final}%</span>`;
  if (sf >= 25) return `<span class="round-badge sf">SF ${sf}%</span>`;
  if (qf >= 25) return `<span class="round-badge qf">QF ${qf}%</span>`;
  if (r16 > 0) return `<span class="round-badge r16">R16 ${r16}%</span>`;

  return `<span class="round-badge out">OUT</span>`;
}

function renderGroupCards(rows) {
  const groups = groupBy(rows, 'Group');
  const games = dashboardData?.games || [];
  const records = buildTeamRecords(games);

  const html = Object.keys(groups).sort().map(group => {
    const teams = groups[group]
      .map(t => {
        const projection = calculateAdvancementProjection(t, groups[group], games, records);

const goalStats = getTeamGoalStats(t.Team, games);

return {
  ...t,
  total: Number(t['Total Pts'] || 0),
  groupPts: Number(t['Group Pts'] || 0),
  gf: goalStats.gf,
  ga: goalStats.ga,
  gd: goalStats.gd,
  projection
};
      })
      .sort((a, b) =>
b.groupPts - a.groupPts ||
b.gd - a.gd ||
b.gf - a.gf ||
b.projection - a.projection ||
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
<th>PD</th>
<th>Adv %</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((t, i) => `
              <tr class="${ownerClass(t.Owner)} ${i < 2 ? 'projected-row' : ''}">
                <td><strong>${i + 1}</strong></td>
               <td>
  <span class="team-link" onclick="openTeamModal('${t.Team}')">
    ${flag(t.Team)} ${t.Team}
  </span>
</td>
                <td>${t.Owner}</td>
<td><strong>${t.groupPts}</strong></td>
<td>${t.gd > 0 ? '+' + t.gd : t.gd}</td>
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

 const r32 = knockoutGames
  .filter(g => g.Stage === 'Round of 32')
  .sort((a, b) => round32BracketIndex(a) - round32BracketIndex(b));
const rawR16 = knockoutGames.filter(g => g.Stage === 'Round of 16');

const r16 = buildFixedRoundOf16Games(r32, rawR16);
  const qf = knockoutGames.filter(g => g.Stage === 'Quarterfinal');
  const sf = knockoutGames.filter(g => g.Stage === 'Semifinal');
  const third = knockoutGames.filter(g => g.Stage === 'Third Place');
  const final = knockoutGames.filter(g => g.Stage === 'Final');
const context = {
  r32Winners: r32.map(getWinner),
  r16Winners: r16.map(getWinner),
  qfWinners: qf.map(getWinner),
  sfWinners: sf.map(getWinner),
  sfLosers: sf.map(getLoser)
};
  const html = `
    <div class="worldcup-bracket-scroll">
      <div class="worldcup-bracket">

        <div class="bracket-wing left-wing">
${bracketColumn('Round of 32', r32.slice(0, 8), context)}
          ${bracketColumn('Round of 16', r16.slice(0, 4),context)}
          ${bracketColumn('Quarterfinals', qf.slice(0, 2),context)}
          ${bracketColumn('Semifinal', sf.slice(0, 1),context)}
        </div>

        <div class="bracket-championship">
<div class="bracket-trophy">
<img src="https://banner2.cleanpng.com/lnd/20241221/ih/b6374593827ace8ba25d0770708f34.webp" alt="World Cup Trophy">
</div>
          <h3>Final</h3>
${final.length ? final.map(g => bracketGame(g, context)).join('') : '<div class="champ-card">Final TBD</div>'}

          <h3>3rd Place</h3>
${third.length ? third.map(g => bracketGame(g, context)).join('') : '<div class="champ-card">3rd Place TBD</div>'}
        </div>

        <div class="bracket-wing right-wing">
${bracketColumn('Semifinal', sf.slice(1, 2), context)}
${bracketColumn('Quarterfinals', qf.slice(2, 4), context)}
${bracketColumn('Round of 16', r16.slice(4, 8), context)}
${bracketColumn('Round of 32', r32.slice(8, 16), context)}
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

function buildFixedRoundOf16Games(r32, rawR16) {
  const r16Dates = rawR16.map(g => g.Date).sort((a, b) => new Date(a) - new Date(b));

  const pairings = [
    [0, 1],   // Canada/South Africa vs Netherlands/Morocco
    [2, 3],   // Paraguay/Germany vs France/Sweden
    [4, 5],   // Brazil/Japan vs Ivory Coast/Norway
    [6, 7],   // Mexico/Ecuador vs England/Congo

    [8, 9],   // Portugal/Croatia vs Spain/Austria
    [10, 11], // United States/Bosnia vs Belgium/Senegal
    [12, 13], // Argentina/Cape Verde vs Australia/Egypt
    [14, 15]  // Switzerland/Algeria vs Colombia/Ghana
  ];

  return pairings.map((pair, i) => {
    const leftGame = r32[pair[0]];
    const rightGame = r32[pair[1]];
    const existing = rawR16[i] || {};

    return {
      ...existing,
      Stage: 'Round of 16',
      Date: existing.Date || r16Dates[i] || '',
      Status: existing.Status || 'Scheduled',
      'Score 1': existing['Score 1'] || 0,
      'Score 2': existing['Score 2'] || 0,
      'Team 1': resolvedOrPlaceholder(leftGame),
      'Team 2': resolvedOrPlaceholder(rightGame)
    };
  });
}

function resolvedOrPlaceholder(game) {
  if (!game) return 'TBD';

  if (isCompleted(game)) {
    return getWinner(game) || readableMatchPlaceholder(game, 'winner');
  }

  return readableMatchPlaceholder(game, 'winner');
}

function bracketGame(g, context = {}) {
  return `
    <div class="bracket-game">
      <div class="bracket-date">${formatDate(g.Date)}</div>
      <div class="bracket-team">
        <span>${teamLabelWithOwner(g['Team 1'], context, g.Stage)}</span>
        <strong>${safe(g['Score 1'])}</strong>
      </div>
      <div class="bracket-team">
        <span>${teamLabelWithOwner(g['Team 2'], context, g.Stage)}</span>
        <strong>${safe(g['Score 2'])}</strong>
      </div>
      <div class="bracket-status">${g.Status || ''}</div>
    </div>
  `;
}

function bracketColumn(title, games, context = {}) {
  return `
    <div class="bracket-column">
      <h3>${title}</h3>
      <div class="bracket-column-games">
        ${games.length ? games.map(g => bracketGame(g, context)).join('') : '<div class="bracket-placeholder">TBD</div>'}
      </div>
    </div>
  `;
}

function teamLabel(team, context = {}) {
  if (!team) return '';

  const resolved = resolveBracketTeam(team, context);
  const lower = String(resolved).toLowerCase();

  if (
    lower.includes('winner') ||
    lower.includes('loser') ||
    lower.includes('runner') ||
    lower.includes('group')
  ) {
    return `<span class="placeholder-team">${resolved}</span>`;
  }

  return `${flag(resolved)} ${resolved}`;
}

function teamLabelWithOwner(team, context = {}, stage = '') {
  const raw = String(team || '').trim();
  const rawLower = raw.toLowerCase();

  const rawIsPlaceholder =
    rawLower.includes('winner') ||
    rawLower.includes('loser') ||
    rawLower.includes('runner') ||
    rawLower.includes('round') ||
    rawLower.includes('tbd');

  const resolved = rawIsPlaceholder
    ? resolveBracketTeam(raw, context)
    : raw;

  if (!resolved) return '';

  const teamRow = (dashboardData?.teams || []).find(
    t => normalizeTeamName(t.Team) === normalizeTeamName(resolved)
  );

const owner = teamRow?.Owner || '';
const ownerCss = ownerClass(owner);

  const lower = String(resolved).toLowerCase();

  if (
    lower.includes('winner') ||
    lower.includes('loser') ||
    lower.includes('runner')
  ) {
    return `<span class="placeholder-team">${resolved}</span>`;
  }

  return `
    <div class="bracket-team-info">
      <div>
  <span class="team-link" onclick="openTeamModal('${resolved}')">
    ${flag(resolved)} ${resolved}
  </span>
</div>
<div class="bracket-owner ${ownerCss}">
  ${owner}
</div>
    </div>
  `;
}

function isValidKnockoutDisplayTeam(team, stage, context = {}) {
  const lowerStage = String(stage || '').toLowerCase();
  const key = normalizeTeamName(team);

  const isPlaceholder =
    key.includes('winner') ||
    key.includes('loser') ||
    key.includes('round') ||
    key.includes('tbd');

  if (!key || isPlaceholder) return true;
  if (lowerStage === 'round of 32') return true;

  if (lowerStage === 'round of 16') {
    return (context.r32Winners || []).some(t => normalizeTeamName(t) === key);
  }

  if (lowerStage === 'quarterfinal') {
    return (context.r16Winners || []).some(t => normalizeTeamName(t) === key);
  }

  if (lowerStage === 'semifinal') {
    return (context.qfWinners || []).some(t => normalizeTeamName(t) === key);
  }

  if (lowerStage === 'final') {
    return (context.sfWinners || []).some(t => normalizeTeamName(t) === key);
  }

  if (lowerStage === 'third place') {
    return (context.sfLosers || []).some(t => normalizeTeamName(t) === key);
  }

  return true;
}

function resolveBracketTeam(name, context = {}) {
  const raw = String(name || '').trim();
  const lower = raw.toLowerCase();

  const match = lower.match(/(round of 32|round of 16|quarterfinal|semifinal)\s+(\d+)\s+(winner|loser)/i);
  if (!match) return raw;

  const roundName = match[1].toLowerCase();
  const matchNumber = Number(match[2]);
  const resultType = match[3].toLowerCase();

  const roundGames = getBracketRoundGames(roundName);
  const sourceGame = roundGames[matchNumber - 1];

  if (!sourceGame) return raw;

  if (isCompleted(sourceGame)) {
    const resolved = resultType === 'loser'
      ? getLoser(sourceGame)
      : getWinner(sourceGame);

    return resolved || readableMatchPlaceholder(sourceGame, resultType);
  }

  return readableMatchPlaceholder(sourceGame, resultType);
}

function getBracketRoundGames(roundName) {
  const stageMap = {
    'round of 32': 'Round of 32',
    'round of 16': 'Round of 16',
    'quarterfinal': 'Quarterfinal',
    'semifinal': 'Semifinal'
  };

  const stage = stageMap[roundName];
  if (!stage) return [];

 const roundGames = (dashboardData?.games || [])
  .filter(g => g.Stage === stage)
  .filter(g => g['Team 1'] && g['Team 2']);

if (stage === 'Round of 32') {
  return roundGames.sort((a, b) => round32BracketIndex(a) - round32BracketIndex(b));
}

return roundGames.sort((a, b) => new Date(a.Date) - new Date(b.Date));
}

function round32BracketIndex(g) {
  const pairs = [
    ['Canada', 'South Africa'],
    ['Netherlands', 'Morocco'],
    ['Paraguay', 'Germany'],
    ['France', 'Sweden'],

    ['Brazil', 'Japan'],
    ['Ivory Coast', 'Norway'],
    ['Mexico', 'Ecuador'],
    ['England', 'Congo'],

    ['Portugal', 'Croatia'],
    ['Spain', 'Austria'],
    ['United States', 'Bosnia'],
    ['Belgium', 'Senegal'],

    ['Argentina', 'Cape Verde'],
    ['Australia', 'Egypt'],
    ['Switzerland', 'Algeria'],
    ['Colombia', 'Ghana']
  ];

  const t1 = normalizeTeamName(g['Team 1']);
  const t2 = normalizeTeamName(g['Team 2']);

  const idx = pairs.findIndex(pair => {
    const a = normalizeTeamName(pair[0]);
    const b = normalizeTeamName(pair[1]);

    return (
      (t1 === a && t2 === b) ||
      (t1 === b && t2 === a)
    );
  });

  return idx === -1 ? 999 : idx;
}

function readableMatchPlaceholder(game, resultType = 'winner') {
  const label = resultType === 'loser' ? 'Loser' : 'Winner';

  const team1 = resolveBracketTeam(game['Team 1']);
  const team2 = resolveBracketTeam(game['Team 2']);

  return `${label}: ${stripPlaceholderPrefix(team1)} / ${stripPlaceholderPrefix(team2)}`;
}

function stripPlaceholderPrefix(value) {
  return String(value || '')
    .replace(/^Winner:\s*/i, '')
    .replace(/^Loser:\s*/i, '')
    .trim();
}

function readableWinnerPlaceholder(raw, context = {}) {
  const matchNum = String(raw).match(/round of 32 (\d+) winner/i)?.[1];
  if (!matchNum) return raw;

  const r32Games = (dashboardData?.games || [])
    .filter(g => g.Stage === 'Round of 32')
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const game = r32Games[Number(matchNum) - 1];
  if (!game) return raw;

  return `Winner: ${game['Team 1']} / ${game['Team 2']}`;
}

function getWinner(g) {
  if (!isCompleted(g)) return '';

  const t1 = g['Team 1'];
  const t2 = g['Team 2'];
  const s1 = Number(g['Score 1']);
  const s2 = Number(g['Score 2']);
  const status = String(g.Status || '').toLowerCase();

  if (isNaN(s1) || isNaN(s2)) return '';
  if (s1 > s2) return t1;
  if (s2 > s1) return t2;

  const key = [normalizeTeamName(t1), normalizeTeamName(t2)].sort().join('|');

  const penaltyWinners = {
    'germany|paraguay': 'Paraguay',
    'morocco|netherlands': 'Morocco'
  };

  if (
    status.includes('pen') ||
    status.includes('penalties') ||
    status.includes('shootout') ||
    penaltyWinners[key]
  ) {
    return penaltyWinners[key] || '';
  }

  return '';
}

function getLoser(g) {
  if (!isCompleted(g)) return '';

  const winner = getWinner(g);
  if (!winner) return '';

  const t1 = g['Team 1'];
  const t2 = g['Team 2'];

  return normalizeTeamName(winner) === normalizeTeamName(t1) ? t2 : t1;
}

function calculateAdvancementProjection(team, groupTeams, games, records) {
  const teamName = team.Team;
  const teamKey = normalizeTeamName(teamName);

  const currentPts = Number(team['Group Pts'] || 0);
  const goalStats = getTeamGoalStats(teamName, games);
  const rec = records[teamKey] || { w: 0, l: 0, d: 0 };

  const played = rec.w + rec.l + rec.d;
  const remaining = Math.max(0, 3 - played);

  const groupRankings = rankGroupTeams(groupTeams, games, records);
  const currentRank = groupRankings.findIndex(t => normalizeTeamName(t.Team) === teamKey) + 1;

  const strengthAdjustment = remainingScheduleAdjustment(teamName, groupTeams, games);
  const headToHeadAdjustment = headToHeadAdjustmentForTeam(teamName, groupTeams, games);

  let percentage = 50;

  percentage += currentPts * 12;
  percentage += goalStats.gd * 5;
  percentage += goalStats.gf * 2;
  percentage += strengthAdjustment;
  percentage += headToHeadAdjustment;

  if (currentRank === 1) percentage += 18;
  if (currentRank === 2) percentage += 8;
  if (currentRank === 3) percentage -= 8;
  if (currentRank === 4) percentage -= 18;

  if (remaining === 0) {
    percentage = currentRank <= 2 ? 97 : 3;
  }

  return Math.max(1, Math.min(99, Math.round(percentage)));
}

function rankGroupTeams(groupTeams, games, records) {
  return groupTeams.map(t => {
    const goalStats = getTeamGoalStats(t.Team, games);
    const rec = records[normalizeTeamName(t.Team)] || { w: 0, l: 0, d: 0 };

    return {
      ...t,
      groupPts: Number(t['Group Pts'] || 0),
      gd: goalStats.gd,
      gf: goalStats.gf,
      played: rec.w + rec.l + rec.d
    };
  }).sort((a, b) =>
    b.groupPts - a.groupPts ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    String(a.Team).localeCompare(String(b.Team))
  );
}

function remainingScheduleAdjustment(teamName, groupTeams, games) {
  const teamKey = normalizeTeamName(teamName);

  const remainingGames = games.filter(g => {
    if (isCompleted(g)) return false;
    if (String(g.Stage || '').toLowerCase() !== 'group') return false;

    return (
      normalizeTeamName(g['Team 1']) === teamKey ||
      normalizeTeamName(g['Team 2']) === teamKey
    );
  });

  if (!remainingGames.length) return 0;

  let adjustment = 0;

  remainingGames.forEach(g => {
    const opponent =
      normalizeTeamName(g['Team 1']) === teamKey ? g['Team 2'] : g['Team 1'];

    const opponentRow = groupTeams.find(t =>
      normalizeTeamName(t.Team) === normalizeTeamName(opponent)
    );

    if (!opponentRow) return;

    const oppPts = Number(opponentRow['Group Pts'] || 0);
    const oppStats = getTeamGoalStats(opponentRow.Team, games);

    const opponentStrength = oppPts + (oppStats.gd * 0.5);

    if (opponentStrength >= 6) adjustment -= 6;
    else if (opponentStrength >= 4) adjustment -= 3;
    else if (opponentStrength <= 1) adjustment += 4;
  });

  return adjustment;
}

function headToHeadAdjustmentForTeam(teamName, groupTeams, games) {
  const teamKey = normalizeTeamName(teamName);
  let adjustment = 0;

  groupTeams.forEach(other => {
    const otherKey = normalizeTeamName(other.Team);
    if (otherKey === teamKey) return;

    const h2h = games.find(g => {
      if (!isCompleted(g)) return false;
      if (String(g.Stage || '').toLowerCase() !== 'group') return false;

      const t1 = normalizeTeamName(g['Team 1']);
      const t2 = normalizeTeamName(g['Team 2']);

      return (
        (t1 === teamKey && t2 === otherKey) ||
        (t1 === otherKey && t2 === teamKey)
      );
    });

    if (!h2h) return;

    const s1 = Number(h2h['Score 1']);
    const s2 = Number(h2h['Score 2']);

    if (isNaN(s1) || isNaN(s2)) return;

    const teamWasT1 = normalizeTeamName(h2h['Team 1']) === teamKey;

    if (s1 === s2) return;

    const teamWon = teamWasT1 ? s1 > s2 : s2 > s1;

    adjustment += teamWon ? 4 : -4;
  });

  return adjustment;
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
<div
  class="match-card"
  onclick="openMatchModal(${JSON.stringify(r).replace(/"/g,'&quot;')})"
>
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
          <th>Own</th>
          <th>Grp</th>
<th>Record<br><span class="subhead">W-L-D</span></th>
<th>PD<br><span class="subhead">GD</span></th>
<th>Group<br><span class="subhead">Pts</span></th>
<th>KO<br><span class="subhead">Pts</span></th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(r => {
          const newGroup = r.Group !== previousGroup;
          previousGroup = r.Group;

const rec = records[normalizeTeamName(r.Team)] || { w: 0, l: 0, d: 0 };
          const goalStats = getTeamGoalStats(r.Team, dashboardData?.games || []);

          return `
            <tr class="${ownerClass(r.Owner)} ${newGroup ? 'group-divider' : ''}">
              <td>
  <span class="team-link" onclick="openTeamModal('${r.Team}')">
    ${flag(r.Team)} ${r.Team}
  </span>
</td>
              <td>${r.Owner}</td>
              <td><strong>${r.Group}</strong></td>
              <td>${rec.w}-${rec.l}-${rec.d}</td>
              <td>${goalStats.gd > 0 ? '+' + goalStats.gd : goalStats.gd}</td>
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

document.addEventListener('click', e => {

  if (e.target.classList.contains('match-modal-close')) {
    document.getElementById('matchModal')?.classList.remove('open');
    document.getElementById('teamModal')?.classList.remove('open');
    document.getElementById('ownerModal')?.classList.remove('open');
  }

  if (e.target.id === 'matchModal') {
    document.getElementById('matchModal')?.classList.remove('open');
  }

  if (e.target.id === 'teamModal') {
    document.getElementById('teamModal')?.classList.remove('open');
  }

  if (e.target.id === 'ownerModal') {
    document.getElementById('ownerModal')?.classList.remove('open');
  }

});

loadData(false);

// auto refresh every 5 minutes
setInterval(() => {
  loadData(false);
}, 300000);
