// Small helpers shared by every page (loaded before the page's own script)
const $ = (id) => document.getElementById(id);

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