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

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
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