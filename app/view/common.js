// Small helpers shared by every page (loaded before the page's own script)
const $ = (id) => document.getElementById(id);

const SITE_NAME = "Women's World Cup Database Museum";

const MENU = [
  ['home', 'Home', 'index.html'],
  ['teams', 'Teams', 'teams.html'],
  ['tournaments', 'Tournaments', 'tournaments.html'],
  ['players', 'Players', 'players.html'],
  ['about', 'About', 'about.html'],
  ['login', 'Log-in', 'login.html']
];

// On GitHub Pages there is no Node/MySQL server, so /api/... requests are answered
// in the browser from data/wwc.json (an export of schema.sql + seed.sql).
// On localhost the real Express API is used as before.
const STATIC_MODE = location.hostname.endsWith('github.io') || location.protocol === 'file:';

async function getJSON(url) {
  if (STATIC_MODE && url.startsWith('/api/')) return staticApi(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

let staticData = null;
function loadStaticData() {
  if (!staticData) {
    staticData = fetch('data/wwc.json').then((r) => {
      if (!r.ok) throw new Error(`Request failed: ${r.status}`);
      return r.json();
    });
  }
  return staticData;
}

const RESULT_ORDER = ['Champions', 'Runners-up', 'Third place', 'Fourth place',
  'Quarter-finals', 'Round of 16', 'Group stage'];
const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

// Same results and ordering as app/model/db.js
async function staticApi(url) {
  const d = await loadStaticData();
  const { pathname, searchParams } = new URL(url, location.origin);
  const parts = pathname.split('/').filter(Boolean);   // ['api', 'teams', 'BRA', 'players']
  const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
  const teamsById = byId(d.teams);
  const tournamentsById = byId(d.tournaments);
  const playersById = byId(d.players);
  const fold = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const posRank = (p) => { const i = POSITION_ORDER.indexOf(p); return i === -1 ? 0 : i + 1; };
  const nullsFirst = (a, b) => (a ?? -Infinity) - (b ?? -Infinity);

  const teams = () => d.teams.map((t) => {
    const rows = d.team_tournaments.filter((tt) => tt.team_id === t.id);
    const ranks = rows.map((r) => RESULT_ORDER.indexOf(r.result)).filter((i) => i >= 0);
    return {
      code: t.code, name: t.name, confederation: t.confederation,
      coach_2023: t.coach_2023, summary: t.summary,
      appearances: rows.length,
      titles: rows.filter((r) => r.result === 'Champions').length,
      best_result: ranks.length ? RESULT_ORDER[Math.min(...ranks)] : null
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const players = () => d.squads.map((s) => {
    const p = playersById.get(s.player_id);
    const t = teamsById.get(s.team_id);
    const tr = tournamentsById.get(s.tournament_id);
    return {
      id: p.id, known_as: p.known_as, full_name: p.full_name,
      birth_year: p.birth_year, birth_date: p.birth_date, position: p.position,
      team_code: t.code, team_name: t.name, year: tr.year,
      shirt_number: s.shirt_number, club: s.club, caps: s.caps, goals: s.goals,
      is_captain: Boolean(s.is_captain),
      awards: d.player_awards.filter((a) => a.player_id === p.id)
        .sort((a, b) => nullsFirst(a.year, b.year) || a.id - b.id)
        .map((a) => a.award + (a.year ? ` (${a.year})` : '')),
      past_clubs: d.player_clubs.filter((c) => c.player_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        .map((c) => c.club + (c.years ? ` (${c.years})` : ''))
    };
  });
  const byPlayerOrder = (a, b) => posRank(a.position) - posRank(b.position)
    || nullsFirst(a.shirt_number, b.shirt_number) || a.known_as.localeCompare(b.known_as);

  if (parts[1] === 'tournaments' && parts.length === 2) {
    return d.tournaments.map(({ year, host, winner, runner_up }) => ({ year, host, winner, runner_up }))
      .sort((a, b) => a.year - b.year);
  }
  if (parts[1] === 'teams') {
    if (parts.length === 2) return teams();
    const code = parts[2].toUpperCase();
    if (parts.length === 3) {
      const team = teams().find((t) => t.code === code);
      if (!team) throw new Error('Request failed: 404');
      return team;
    }
    if (parts[3] === 'tournaments') {
      const team = d.teams.find((t) => t.code === code);
      return d.team_tournaments.filter((tt) => team && tt.team_id === team.id).map((tt) => {
        const tr = tournamentsById.get(tt.tournament_id);
        return { year: tr.year, host: tr.host, winner: tr.winner, runner_up: tr.runner_up, result: tt.result };
      }).sort((a, b) => a.year - b.year);
    }
    if (parts[3] === 'players') {
      const year = searchParams.get('year');
      return players().filter((p) => p.team_code === code && (!year || p.year === Number(year)))
        .sort((a, b) => a.year - b.year || byPlayerOrder(a, b));
    }
  }
  if (parts[1] === 'players') {
    const year = searchParams.get('year');
    const team = (searchParams.get('team') || '').toUpperCase();
    const position = searchParams.get('position');
    const q = fold((searchParams.get('q') || '').slice(0, 60));
    return players().filter((p) => (!year || p.year === Number(year))
        && (!team || p.team_code === team)
        && (!position || p.position === position)
        && (!q || [p.known_as, p.full_name, p.club].some((v) => fold(v).includes(q))))
      .sort((a, b) => b.year - a.year || a.team_name.localeCompare(b.team_name) || byPlayerOrder(a, b));
  }
  throw new Error('Request failed: 404');
}

// Builds an element; text is always set with textContent, never innerHTML
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

// Builds the navbar and footer once, so every page shares the same menu.
// Each page has <div id="site-nav"></div> and <div id="site-footer"></div>.
function renderLayout(active) {
  const nav = el('nav', 'navbar navbar-dark site-nav sticky-top');
  const wrap = el('div', 'container-fluid page-wrap');

  const brand = el('a', 'navbar-brand fw-bold', SITE_NAME);
  brand.href = 'index.html';

  const toggler = el('button', 'navbar-toggler');
  toggler.type = 'button';
  toggler.dataset.bsToggle = 'collapse';
  toggler.dataset.bsTarget = '#mainNav';
  toggler.setAttribute('aria-controls', 'mainNav');
  toggler.setAttribute('aria-expanded', 'false');
  toggler.setAttribute('aria-label', 'Toggle navigation');
  toggler.append(el('span', 'navbar-toggler-icon'));

  const collapse = el('div', 'collapse navbar-collapse');
  collapse.id = 'mainNav';
  const list = el('ul', 'navbar-nav');
  for (const [key, label, href] of MENU) {
    const li = el('li', 'nav-item');
    const a = el('a', 'nav-link' + (key === 'login' ? ' nav-login' : ''), label);
    a.href = href;
    if (key === active) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
    li.append(a);
    list.append(li);
  }
  collapse.append(list);
  wrap.append(brand, toggler, collapse);
  nav.append(wrap);
  $('site-nav').replaceWith(nav);

  const footer = el('footer', 'site-footer text-center text-white py-3');
  footer.append(el('small', 'd-block', `\u00A9 2026 ${SITE_NAME} \u00B7 TU Dublin Web Development Project`));
  const credit = el('small', 'd-block');
  credit.append('Photos: Pal\u00E1cio do Planalto (CC BY 2.0); Amerpear (CC BY-SA 4.0), via Wikimedia Commons. See ');
  const link = el('a', null, 'image credits');
  link.href = 'images/credits.txt';
  credit.append(link, '.');
  footer.append(credit);
  $('site-footer').replaceWith(footer);
}

function showError(message) {
  const box = $('error');
  box.textContent = message;
  box.classList.remove('d-none');
}

function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resultBadge(result) {
  return el('span', `result-badge res-${slug(result)}`, result);
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
}

function cell(content) {
  const td = document.createElement('td');
  if (content instanceof Node) td.append(content);
  else td.textContent = content ?? '';
  return td;
}

function pluralise(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// Runs as soon as common.js loads (scripts sit at the end of <body>)
renderLayout(document.body.dataset.page);