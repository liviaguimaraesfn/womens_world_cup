const DEFAULT_YEAR = '2023';

let searchTimer = null;
let latestRequest = 0;   // ignores slow responses that arrive after a newer search

function teamCell(p) {
  const wrap = el('span', `team-${p.team_code.toLowerCase()}`);
  wrap.append(el('span', 'team-dot'));
  const link = el('a', null, p.team_name);
  link.href = `team.html?code=${encodeURIComponent(p.team_code)}`;
  wrap.append(link);
  return wrap;
}

function playerCell(p) {
  const wrap = el('span');
  wrap.append(el('strong', null, p.known_as));
  if (p.is_captain) wrap.append(el('span', 'captain-tag', 'Captain'));
  if (p.full_name !== p.known_as) wrap.append(el('div', 'player-meta', p.full_name));
  return wrap;
}

function renderPlayers(players) {
  const body = $('players-body');
  body.replaceChildren();
  for (const p of players) {
    const tr = document.createElement('tr');
    tr.append(
      cell(p.shirt_number ?? '-'),
      cell(playerCell(p)),
      cell(teamCell(p)),
      cell(p.year),
      cell(p.position),
      cell(formatDate(p.birth_date) || p.birth_year || ''),
      cell(p.club || ''),
      cell(p.caps ?? ''),
      cell(p.goals ?? '')
    );
    body.append(tr);
  }
}

async function search() {
  const params = new URLSearchParams();
  const filters = {
    q: $('q').value.trim(),
    team: $('team-filter').value,
    position: $('position-filter').value,
    year: $('year-filter').value
  };
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const requestId = ++latestRequest;
  try {
    const players = await getJSON(`/api/players?${params}`);
    if (requestId !== latestRequest) return;
    renderPlayers(players);
    $('result-count').textContent = players.length === 0
      ? 'No players match these filters. Try removing one.'
      : `Showing ${pluralise(players.length, 'player')}.`;
  } catch (err) {
    console.error(err);
    showError('Could not load players. Is the server and database running?');
  }
}

async function init() {
  try {
    const [teams, tournaments] = await Promise.all([
      getJSON('/api/teams'),
      getJSON('/api/tournaments')
    ]);
    for (const t of teams) {
      const option = el('option', null, t.name);
      option.value = t.code;
      $('team-filter').append(option);
    }
    for (const tr of tournaments) {
      const option = el('option', null, tr.year);
      option.value = tr.year;
      $('year-filter').append(option);
    }
    $('year-filter').value = DEFAULT_YEAR;

    // Allow links like players.html?team=JPN
    const team = new URLSearchParams(location.search).get('team');
    if (team) $('team-filter').value = team.toUpperCase();
  } catch (err) {
    console.error(err);
    showError('Could not load the filters. Is the server and database running?');
  }
  await search();
}

$('q').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(search, 250);   // wait until the user pauses typing
});
for (const id of ['team-filter', 'position-filter', 'year-filter']) {
  $(id).addEventListener('change', search);
}
init();