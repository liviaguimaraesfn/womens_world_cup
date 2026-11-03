// Turns a country name into a link to its team page when the museum has that team
function teamLink(name, codesByName) {
  const code = codesByName.get(name);
  if (!code) return name;
  const a = el('a', null, name);
  a.href = `team.html?code=${encodeURIComponent(code)}`;
  return a;
}

function renderTournaments(rows, codesByName) {
  const body = $('tournaments-body');
  body.replaceChildren();
  for (const r of [...rows].sort((a, b) => b.year - a.year)) {
    const tr = document.createElement('tr');
    tr.append(
      cell(el('strong', null, r.year)),
      cell(r.host),
      cell(teamLink(r.winner, codesByName)),
      cell(teamLink(r.runner_up, codesByName))
    );
    body.append(tr);
  }
}

async function init() {
  try {
    const [teams, tournaments] = await Promise.all([
      getJSON('/api/teams'),
      getJSON('/api/tournaments')
    ]);
    renderTournaments(tournaments, new Map(teams.map((t) => [t.name, t.code])));
  } catch (err) {
    console.error(err);
    showError('Could not load the tournaments. Is the server and database running?');
  }
}

init();