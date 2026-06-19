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
            <span>${isCompleted(g) ? 'FT' : formatShortTime(g.Date)}</span>
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
  ${g.Location || g.Venue || ''}
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
  <div>${owner?.titlePct || owner?.titlePercent || 0}%</div>
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

function calculateTitleProbabilities(rows) {
  const totals = rows.map(r => ({
    owner: r.owner,
    current: Number(r.total || 0),
    max: Number(r.maxPossible || 0)
  }));

  const minMax = Math.min(...totals.map(r => r.max));
  const weights = totals.map(r => {
    const currentBonus = r.current * 0.35;
    const ceilingBonus = Math.max(0, r.max - minMax + 1);
    return {
      owner: r.owner,
      weight: Math.max(1, currentBonus + ceilingBonus)
    };
  });

  const totalWeight = weights.reduce((sum, r) => sum + r.weight, 0);

  return weights.reduce((acc, r) => {
    acc[r.owner] = totalWeight ? Math.round((r.weight / totalWeight) * 100) : 0;
    return acc;
  }, {});
}

function renderLeaderboard(rows) {
  const medals = ['🥇', '🥈', '🥉'];
  const titleOdds = calculateTitleProbabilities(rows);

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
            <td><strong>${titleOdds[r.owner] || 0}%</strong></td>
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
  <span class="analytics-pill">Analytics</span>
</div>
            <div class="points">${r.total} pts</div>
            <ul>
              ${ownerTeams.map(t => `
                <li>
                  <span class="team-link" onclick="openTeamModal('${t.Team}')">
  ${flag(t.Team)} ${t.Team}
</span>
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

  const r32 = knockoutGames.filter(g => g.Stage === 'Round of 32');
  const r16 = knockoutGames.filter(g => g.Stage === 'Round of 16');
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

function bracketGame(g, context = {}) {
  return `
    <div class="bracket-game">
      <div class="bracket-date">${formatDate(g.Date)}</div>
      <div class="bracket-team">
<span>${teamLabelWithOwner(g['Team 1'], context)}</span>
        <strong>${safe(g['Score 1'])}</strong>
      </div>
      <div class="bracket-team">
        <span>${teamLabelWithOwner(g['Team 2'], context)}</span>
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

function teamLabelWithOwner(team, context = {}) {
  const resolved = resolveBracketTeam(team, context);

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

function resolveBracketTeam(name, context) {
  const raw = String(name || '').trim();
  const lower = raw.toLowerCase();

  const knockoutMatch = lower.match(/round of 32 (\d+) winner/);
  if (knockoutMatch) {
    return context.r32Winners?.[Number(knockoutMatch[1]) - 1] || raw;
  }

  const r16Match = lower.match(/round of 16 (\d+) winner/);
  if (r16Match) {
    return context.r16Winners?.[Number(r16Match[1]) - 1] || raw;
  }

  const qfMatch = lower.match(/quarterfinal (\d+) winner/);
  if (qfMatch) {
    return context.qfWinners?.[Number(qfMatch[1]) - 1] || raw;
  }

  const sfWinnerMatch = lower.match(/semifinal (\d+) winner/);
  if (sfWinnerMatch) {
    return context.sfWinners?.[Number(sfWinnerMatch[1]) - 1] || raw;
  }

  const sfLoserMatch = lower.match(/semifinal (\d+) loser/);
  if (sfLoserMatch) {
    return context.sfLosers?.[Number(sfLoserMatch[1]) - 1] || raw;
  }

  return raw;
}

function getWinner(g) {
  if (!isCompleted(g)) return '';

  const s1 = Number(g['Score 1']);
  const s2 = Number(g['Score 2']);

  if (isNaN(s1) || isNaN(s2)) return '';
  if (s1 > s2) return g['Team 1'];
  if (s2 > s1) return g['Team 2'];

  return '';
}

function getLoser(g) {
  if (!isCompleted(g)) return '';

  const s1 = Number(g['Score 1']);
  const s2 = Number(g['Score 2']);

  if (isNaN(s1) || isNaN(s2)) return '';
  if (s1 > s2) return g['Team 2'];
  if (s2 > s1) return g['Team 1'];

  return '';
}

function calculateAdvancementProjection(team, groupTeams, games, records) {
  const teamName = team.Team;
  const currentPts = Number(team['Group Pts'] || 0);
const rec = records[normalizeTeamName(teamName)] || { w: 0, l: 0, d: 0 };

  const played = rec.w + rec.l + rec.d;
  const remaining = Math.max(0, 3 - played);

  let projectedPts = currentPts + remaining * 1.5;

  const groupMax = groupTeams.map(t => {
    const r = records[normalizeTeamName(t.Team)] || { w: 0, l: 0, d: 0 };
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
