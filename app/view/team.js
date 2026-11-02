const code = (new URLSearchParams(location.search).get('code') || 'BRA').toUpperCase();

const DEFAULT_YEAR = 2023;

const $ = (id) => document.getElementById(id);

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function showError(message) {
  const box = $('error');
  box.textContent = message;
  box.classList.remove('d-none');
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function renderHistory(rows) {
  const body = $('history-body');
  body.replaceChildren();
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.append(cell(r.year), cell(r.host), cell(r.result), cell(r.winner));
    body.append(tr);
  }
}

function fillYearFilter(rows) {
  const select = $('year-filter');
  for (const r of rows) {
    const option = document.createElement('option');
    option.value = r.year;
    option.textContent = r.year;
    select.append(option);
  }
}

function playerCard(p) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';

  const card = document.createElement('div');
  card.className = 'card h-100 feature-card';
  const body = document.createElement('div');
  body.className = 'card-body';

  const title = document.createElement('h3');
  title.className = 'h5 card-title';
  title.textContent = p.known_as;

  const full = document.createElement('p');
  full.className = 'card-text text-muted mb-1';
  full.textContent = p.full_name;

  const details = document.createElement('p');
  details.className = 'card-text mb-0';
  const parts = [p.year, p.position, p.birth_year ? `born ${p.birth_year}` : null,
                 p.shirt_number ? `#${p.shirt_number}` : null, p.club];
  details.textContent = parts.filter(Boolean).join(' · ');

  body.append(title, full, details);
  card.append(body);
  col.append(card);
  return col;
}

async function loadPlayers() {
  const year = $('year-filter').value;
  const query = year ? `?year=${encodeURIComponent(year)}` : '';
  const list = $('players-list');
  try {
    const players = await getJSON(`/api/teams/${encodeURIComponent(code)}/players${query}`);
    list.replaceChildren();
    if (players.length === 0) {
      const none = document.createElement('p');
      none.textContent = 'No players found for this selection yet.';
      list.append(none);
      return;
    }
    $('players-title').textContent = year
      ? `Players at ${year} (${players.length})`
      : `Players (${players.length})`;
    players.forEach((p) => list.append(playerCard(p)));
  } catch (err) {
    console.error(err);
    showError('Could not load players.');
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
    $('team-name').textContent = team.name;
    $('team-sub').textContent = `${team.confederation} · ${history.length} World Cups played`;
    renderHistory(history);
    fillYearFilter(history);
    // Show the most recent squad first; the user can switch back to "All tournaments"
    if (history.some((r) => r.year === DEFAULT_YEAR)) {
      $('year-filter').value = String(DEFAULT_YEAR);
    }
    await loadPlayers();
  } catch (err) {
    console.error(err);
    $('team-name').textContent = 'Team not found';
    showError('Could not load this team. Is the server and database running?');
  }
}

$('year-filter').addEventListener('change', loadPlayers);
init();