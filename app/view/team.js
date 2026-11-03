const code = (new URLSearchParams(location.search).get('code') || 'BRA').toUpperCase();

const DEFAULT_YEAR = 2023;
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

let allPlayers = [];   // players for the selected year, before the position filter

function renderFacts(team) {
  const facts = [
    [String(team.appearances), 'World Cups played'],
    [String(team.titles), team.titles === 1 ? 'World Cup title' : 'World Cup titles'],
    [team.best_result || 'None', 'Best result'],
    [team.coach_2023 || 'Not recorded', 'Head coach in 2023']
  ];
  $('facts').replaceChildren(...facts.map(([value, label]) => {
    const col = el('div', 'col-6 col-lg-3');
    const box = el('div', 'fact');
    box.append(el('div', 'fact-value', value), el('div', 'fact-label', label));
    col.append(box);
    return col;
  }));
}

function renderHistory(rows) {
  const body = $('history-body');
  body.replaceChildren();
  for (const r of rows) {
    const tr = document.createElement('tr');
    if (r.result === 'Champions') tr.className = 'row-champions';
    tr.append(cell(r.year), cell(r.host), cell(resultBadge(r.result)),
              cell(r.winner), cell(r.runner_up));
    body.append(tr);
  }
}

function fillYearFilter(rows) {
  const select = $('year-filter');
  for (const r of rows) {
    const option = el('option', null, r.year);
    option.value = r.year;
    select.append(option);
  }
}

function playerCard(p) {
  const col = el('div', 'col-12 col-md-6 col-lg-4');
  const card = el('div', 'card player-card');

  card.append(el('div', 'shirt', p.shirt_number ?? '-'));

  const body = el('div', 'card-body');
  const title = el('h4', 'h6 mb-1', p.known_as);
  if (p.is_captain) title.append(el('span', 'captain-tag', 'Captain'));
  body.append(title);

  if (p.full_name !== p.known_as) body.append(el('div', 'player-meta', p.full_name));

  const born = formatDate(p.birth_date) || (p.birth_year ? String(p.birth_year) : null);
  const lines = [
    [p.position, born ? `Born ${born}` : null],
    [p.club],
    [p.caps !== null ? `${p.caps} caps` : null, p.goals !== null ? `${p.goals} goals` : null]
  ];
  for (const parts of lines) {
    const text = parts.filter(Boolean).join(', ');
    if (text) body.append(el('div', 'player-meta', text));
  }

  card.append(body);
  col.append(card);
  return col;
}

// Groups players under headings; each group is a row of cards
function renderGroups(groups) {
  const list = $('players-list');
  list.replaceChildren();
  for (const [heading, players] of groups) {
    list.append(el('h3', 'h5 position-heading', `${heading} (${players.length})`));
    const row = el('div', 'row g-3');
    players.forEach((p) => row.append(playerCard(p)));
    list.append(row);
  }
}

function groupBy(players, keyFn) {
  const map = new Map();
  for (const p of players) {
    const key = keyFn(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

function showPlayers() {
  const year = $('year-filter').value;
  const position = $('position-filter').value;
  const players = position ? allPlayers.filter((p) => p.position === position) : allPlayers;

  const label = [year ? `at ${year}` : null, position ? position.toLowerCase() + 's' : null]
    .filter(Boolean).join(', ');
  $('players-title').textContent = `Players${label ? ' ' + label : ''} (${players.length})`;

  if (players.length === 0) {
    const none = el('p', 'text-muted', year
      ? 'No players recorded for this selection yet.'
      : 'No players match these filters.');
    $('players-list').replaceChildren(none);
    return;
  }

  if (year) {
    // One tournament: group by position in the usual order
    const byPosition = groupBy(players, (p) => p.position || 'Unknown');
    renderGroups(POSITIONS.filter((pos) => byPosition.has(pos)).map((pos) => [pos, byPosition.get(pos)]));
  } else {
    // All tournaments: group by year, newest first
    const byYear = groupBy(players, (p) => p.year);
    renderGroups([...byYear.keys()].sort((a, b) => b - a).map((y) => [String(y), byYear.get(y)]));
  }
}

async function loadPlayers() {
  const year = $('year-filter').value;
  const query = year ? `?year=${encodeURIComponent(year)}` : '';
  try {
    allPlayers = await getJSON(`/api/teams/${encodeURIComponent(code)}/players${query}`);
    showPlayers();
  } catch (err) {
    console.error(err);
    showError('Could not load players.');
  }
}

async function renderOtherTeams() {
  try {
    const teams = await getJSON('/api/teams');
    $('other-teams').replaceChildren(...teams.filter((t) => t.code !== code).map((t) => {
      const a = el('a', 'btn btn-outline-secondary btn-sm', t.name);
      a.href = `team.html?code=${encodeURIComponent(t.code)}`;
      return a;
    }));
  } catch (err) {
    console.error(err);   // the rest of the page still works without this list
  }
}

async function init() {
  try {
    const base = `/api/teams/${encodeURIComponent(code)}`;
    const [team, history] = await Promise.all([
      getJSON(base),
      getJSON(`${base}/tournaments`)
    ]);
    document.title = `${team.name} - Women's World Cup Archive`;
    document.body.classList.add(`team-${team.code.toLowerCase()}`);
    $('team-name').textContent = team.name;
    $('team-sub').textContent = `${team.confederation}, ${pluralise(history.length, 'World Cup')} played`;
    $('team-summary').textContent = team.summary || '';
    renderFacts(team);
    renderHistory(history);
    fillYearFilter(history);
    // Show the most recent squad first; the user can switch back to "All tournaments"
    if (history.some((r) => r.year === DEFAULT_YEAR)) {
      $('year-filter').value = String(DEFAULT_YEAR);
    }
    renderOtherTeams();
    await loadPlayers();
  } catch (err) {
    console.error(err);
    $('team-name').textContent = 'Team not found';
    showError('Could not load this team. Is the server and database running?');
  }
}

$('year-filter').addEventListener('change', loadPlayers);
$('position-filter').addEventListener('change', showPlayers);
init();