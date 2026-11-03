import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from '../model/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Static files: Bootstrap from node_modules, the pages from app/view
app.use('/bootstrap', express.static(path.join(__dirname, '../../node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, '../view')));

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

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`Women's World Cup Museum running at http://localhost:${PORT}`));