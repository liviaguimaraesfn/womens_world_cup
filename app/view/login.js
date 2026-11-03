// Demo log-in. The site has no server on GitHub Pages, so this checks the details
// in the browser. It is for demonstration only: anyone can read this file.
const DEMO_USER = { email: 'livia@gmail.com', password: '123' };
const STORAGE_KEY = 'wwc-user';

function savedUser() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function showLoggedIn(email) {
  $('login-form').classList.add('d-none');
  $('welcome').classList.remove('d-none');
  $('welcome-email').textContent = email;
}

function showLoggedOut() {
  $('welcome').classList.add('d-none');
  $('login-form').classList.remove('d-none');
  $('password').value = '';
  $('email').focus();
}

$('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  const message = $('login-message');

  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    message.classList.add('d-none');
    try { localStorage.setItem(STORAGE_KEY, email); } catch { /* storage blocked: still log in for this visit */ }
    showLoggedIn(email);
  } else {
    message.textContent = 'Wrong email or password. Please try again.';
    message.classList.remove('d-none');
    $('password').value = '';
    $('password').focus();
  }
});

$('logout').addEventListener('click', () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
  showLoggedOut();
});

const user = savedUser();
if (user) showLoggedIn(user);