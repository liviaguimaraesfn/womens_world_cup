import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as model from '../model/db.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.static(join(__dirname, '..', 'view')));
app.use('/bootstrap', express.static(
  join(__dirname, '..', '..', 'node_modules', 'bootstrap', 'dist')
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'WWC Archive' });
});

// Validate the team code (3 letters) before it touches the database
function validCode(req, res, next) {
  if (!/^[A-Za-z]{3}$/.test(req.params.code)) {
    return res.status(400).json({ error: 'Team code must be 3 letters' });
  }
  req.params.code = req.params.code.toUpperCase();
  next();
}

// Returns a valid year, null when absent, or false when invalid
function parseYear(value) {
  if (value === undefined || value === '') return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 1991 && year <= 2100 ? year : false;
}

// Wraps async handlers so errors become a clean 500 instead of a crash
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

// GET /api/tournaments
app.get('/api/tournaments', wrap(async (req, res) => {
  res.json(await model.getTournaments());
}));

// GET /api/teams
app.get('/api/teams', wrap(async (req, res) => {
  res.json(await model.getTeams());
}));

// GET /api/teams/BRA
app.get('/api/teams/:code', validCode, wrap(async (req, res) => {
  const team = await model.getTeam(req.params.code);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
}));

// GET /api/teams/BRA/tournaments
app.get('/api/teams/:code/tournaments', validCode, wrap(async (req, res) => {
  res.json(await model.getTeamTournaments(req.params.code));
}));

// GET /api/teams/BRA/players  or  /api/teams/BRA/players?year=2023
app.get('/api/teams/:code/players', validCode, wrap(async (req, res) => {
  const year = parseYear(req.query.year);
  if (year === false) return res.status(400).json({ error: 'Invalid year' });
  res.json(await model.getTeamPlayers(req.params.code, year));
}));

// GET /api/players?year=2023&team=BRA&position=Forward&q=mar
app.get('/api/players', wrap(async (req, res) => {
  const { team, position, q } = req.query;
  const year = parseYear(req.query.year);
  if (year === false) return res.status(400).json({ error: 'Invalid year' });
  if (team && !/^[A-Za-z]{3}$/.test(team)) {
    return res.status(400).json({ error: 'Team code must be 3 letters' });
  }
  if (position && !POSITIONS.includes(position)) {
    return res.status(400).json({ error: 'Invalid position' });
  }
  if (q !== undefined && (typeof q !== 'string' || q.length > 60)) {
    return res.status(400).json({ error: 'Search text is too long' });
  }
  res.json(await model.searchPlayers({
    year,
    team: team ? team.toUpperCase() : null,
    position: position || null,
    q: q ? q.trim() : null
  }));
}));

// Unknown API routes return JSON, anything else a plain 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).send('404 Not Found'));

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other server or run: PORT=3001 npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});