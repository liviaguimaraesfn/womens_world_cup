// Accounts: register (Create), view (Read), edit (Update) and delete (Delete).
// Every action calls the Express API, which runs the SQL against MySQL.

const panels = ['login-form', 'register-form', 'account'];

function showPanel(id) {
  for (const p of panels) $(p).classList.toggle('d-none', p !== id);
}

function showMessage(text, kind = 'success') {
  const box = $('account-message');
  box.textContent = text;
  box.className = `alert alert-${kind}`;
}

function clearMessage() {
  $('account-message').className = 'alert d-none';
}

// READ: fill in the account panel from the user returned by the API
function showAccount(user) {
  $('acc-name').textContent = user.display_name;
  $('acc-email').textContent = user.email;
  $('acc-team').textContent = user.favourite_team_name || 'Not chosen';
  $('acc-since').textContent = formatDate(user.created_at);
  $('edit-name').value = user.display_name;
  $('edit-team').value = user.favourite_team_code || '';
  showPanel('account');
}

async function fillTeamSelects() {
  const teams = await getJSON('/api/teams');
  for (const select of document.querySelectorAll('.team-select')) {
    select.replaceChildren(el('option', null, 'No favourite'));
    select.firstChild.value = '';
    for (const t of teams) {
      const option = el('option', null, t.name);
      option.value = t.code;
      select.append(option);
    }
  }
}

$('show-register').addEventListener('click', () => { clearMessage(); showPanel('register-form'); $('reg-name').focus(); });
$('show-login').addEventListener('click', () => { clearMessage(); showPanel('login-form'); $('email').focus(); });

// CREATE
$('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const user = await sendJSON('POST', '/api/users', {
      displayName: $('reg-name').value,
      email: $('reg-email').value,
      password: $('reg-password').value,
      favouriteTeam: $('reg-team').value
    });
    $('register-form').reset();
    showAccount(user);
    showMessage('Account created. You are now logged in.');
  } catch (err) {
    showMessage(err.message, 'danger');
  }
});

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const user = await sendJSON('POST', '/api/login', {
      email: $('email').value,
      password: $('password').value
    });
    $('login-form').reset();
    clearMessage();
    showAccount(user);
  } catch (err) {
    showMessage(err.message, 'danger');
    $('password').value = '';
    $('password').focus();
  }
});

// UPDATE
$('edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const user = await sendJSON('PUT', '/api/me', {
      displayName: $('edit-name').value,
      favouriteTeam: $('edit-team').value
    });
    showAccount(user);
    showMessage('Your details were updated.');
  } catch (err) {
    showMessage(err.message, 'danger');
  }
});

$('logout').addEventListener('click', async () => {
  await sendJSON('POST', '/api/logout').catch(() => {});
  showMessage('You have logged out.', 'secondary');
  showPanel('login-form');
});

// DELETE
$('delete-account').addEventListener('click', async () => {
  if (!confirm('Delete your account permanently? This cannot be undone.')) return;
  try {
    await sendJSON('DELETE', '/api/me');
    showMessage('Your account was deleted.', 'secondary');
    showPanel('login-form');
  } catch (err) {
    showMessage(err.message, 'danger');
  }
});

async function init() {
  if (STATIC_MODE) {
    showMessage('Accounts need the Node.js server and database. Run the app locally with npm start.', 'warning');
    for (const p of panels) $(p).classList.add('d-none');
    return;
  }
  try {
    await fillTeamSelects();
    // Already logged in? The session cookie lets the server tell us who it is.
    const response = await fetch('/api/me');
    if (response.ok) showAccount(await response.json());
  } catch (err) {
    console.error(err);
    showMessage('Could not reach the server. Is the server and database running?', 'danger');
  }
}

init();