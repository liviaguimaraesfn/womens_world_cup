import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import session from 'express-session';
import * as db from '../model/db.js';
import * as users from '../model/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Static files: Bootstrap from node_modules, the pages from app/view
app.use('/bootstrap', express.static(path.join(__dirname, '../../node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, '../view')));

// Reads JSON bodies sent by fetch() from the front-end
app.use(express.json({ limit: '10kb' }));

// Log-in sessions: the browser only gets a random session id cookie.
// Set SESSION_SECRET in production; without it a new secret is made on each start.
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 2 }
}));

// Wraps async handlers so a database error becomes a 500 instead of a crash
const route = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const isYear = (v) => /^\d{4}$/.test(v);
const isCode = (v) => /^[A-Za-z]{3}$/.test(v);

app.get('/api/tournaments', route(async (req, res) => {
  res.json(await db.getTournaments());
}));

app.get('/api/teams', route(async (req, res) => {
  res.json(await db.getTeams());
}));

app.get('/api/teams/:code', route(async (req, res) => {
  if (!isCode(req.params.code)) return res.status(400).json({ error: 'Invalid team code' });
  const team = await db.getTeam(req.params.code.toUpperCase());
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
}));

app.get('/api/teams/:code/tournaments', route(async (req, res) => {
  if (!isCode(req.params.code)) return res.status(400).json({ error: 'Invalid team code' });
  res.json(await db.getTeamTournaments(req.params.code.toUpperCase()));
}));

app.get('/api/teams/:code/players', route(async (req, res) => {
  const { year } = req.query;
  if (!isCode(req.params.code)) return res.status(400).json({ error: 'Invalid team code' });
  if (year && !isYear(year)) return res.status(400).json({ error: 'Invalid year' });
  res.json(await db.getTeamPlayers(req.params.code.toUpperCase(), year));
}));

app.get('/api/players', route(async (req, res) => {
  const { year, team, position, q } = req.query;
  if (year && !isYear(year)) return res.status(400).json({ error: 'Invalid year' });
  if (team && !isCode(team)) return res.status(400).json({ error: 'Invalid team code' });
  if ([year, team, position, q].some((v) => v !== undefined && typeof v !== 'string')) {
    return res.status(400).json({ error: 'Invalid query' });
  }
  res.json(await db.searchPlayers({
    year,
    team: team ? team.toUpperCase() : undefined,
    position,
    q: q ? q.slice(0, 60) : undefined
  }));
}));

// ---------- User accounts (Create / Read / Update / Delete) ----------

const isEmail = (v) => typeof v === 'string' && v.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isName = (v) => typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 60;
const isPassword = (v) => typeof v === 'string' && v.length >= 8 && v.length <= 100;
const isTeamOrEmpty = (v) => v === undefined || v === null || v === '' || isCode(v);

// Blocks account routes for visitors who are not logged in
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in first' });
  next();
};

// CREATE: register a new account (and log in straight away)
app.post('/api/users', route(async (req, res) => {
  const { email, password, displayName, favouriteTeam } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  if (!isPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!isName(displayName)) return res.status(400).json({ error: 'Please enter a name (up to 60 characters)' });
  if (!isTeamOrEmpty(favouriteTeam)) return res.status(400).json({ error: 'Invalid team' });
  try {
    const user = await users.createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim(),
      favouriteTeam: favouriteTeam ? favouriteTeam.toUpperCase() : null
    });
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      req.session.userId = user.id;
      res.status(201).json(user);
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists' });
    throw err;
  }
}));

app.post('/api/login', route(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = await users.checkLogin(email.trim().toLowerCase(), password);
  if (!user) return res.status(401).json({ error: 'Wrong email or password' });
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    req.session.userId = user.id;
    res.json(user);
  });
}));

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

// READ: the logged-in user's own account
app.get('/api/me', requireLogin, route(async (req, res) => {
  const user = await users.getUser(req.session.userId);
  if (!user) return res.status(404).json({ error: 'Account not found' });
  res.json(user);
}));

// UPDATE: change name and favourite team
app.put('/api/me', requireLogin, route(async (req, res) => {
  const { displayName, favouriteTeam } = req.body || {};
  if (!isName(displayName)) return res.status(400).json({ error: 'Please enter a name (up to 60 characters)' });
  if (!isTeamOrEmpty(favouriteTeam)) return res.status(400).json({ error: 'Invalid team' });
  const user = await users.updateUser(req.session.userId, {
    displayName: displayName.trim(),
    favouriteTeam: favouriteTeam ? favouriteTeam.toUpperCase() : null
  });
  res.json(user);
}));

// DELETE: remove the account and end the session
app.delete('/api/me', requireLogin, route(async (req, res) => {
  await users.deleteUser(req.session.userId);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`Women's World Cup Museum running at http://localhost:${PORT}`));