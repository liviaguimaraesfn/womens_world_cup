function teamCard(t) {
  const col = el('div', 'col-12 col-md-6 col-xl-4');
  const card = el('div', `card h-100 team-card shadow-sm team-${t.code.toLowerCase()}`);
  const body = el('div', 'card-body d-flex flex-column');

  body.append(el('h3', 'h4 card-title team-title', t.name));

  const badges = el('div', 'mb-2');
  if (t.best_result) badges.append(resultBadge(t.best_result));
  body.append(badges);

  const titles = t.titles > 0 ? `${pluralise(t.titles, 'title')}, ` : '';
  body.append(el('p', 'stat-line mb-2',
    `${t.confederation}. ${titles}${pluralise(t.appearances, 'World Cup')} played.`));
  body.append(el('p', 'card-text', t.summary));

  const link = el('a', 'btn btn-primary mt-auto align-self-start', `View ${t.name}`);
  link.href = `team.html?code=${encodeURIComponent(t.code)}`;
  body.append(link);

  card.append(body);
  col.append(card);
  return col;
}

function renderTournaments(rows) {
  const body = $('tournaments-body');
  if (!body) return;   // the teams page has no tournaments table
  body.replaceChildren();
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.append(cell(r.year), cell(r.host), cell(r.winner), cell(r.runner_up));
    body.append(tr);
  }
}

async function init() {
  try {
    const [teams, tournaments] = await Promise.all([
      getJSON('/api/teams'),
      getJSON('/api/tournaments')
    ]);
    const list = $('teams-list');
    list.replaceChildren(...teams.map(teamCard));
    renderTournaments(tournaments);
  } catch (err) {
    console.error(err);
    $('teams-list').replaceChildren();
    showError('Could not load the archive. Is the server and database running?');
  }
}

init();