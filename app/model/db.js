import mysql from 'mysql2/promise';
import details from '../config/mysql.js';

const pool = mysql.createPool({
  ...details,
  waitForConnections: true,
  connectionLimit: 10
});

// Best to worst, used to pick each team's best finish
const RESULT_ORDER = [
  'Champions', 'Runners-up', 'Third place', 'Fourth place',
  'Quarter-finals', 'Round of 16', 'Group stage'
];

const POSITION_ORDER = `FIELD(p.position, 'Goalkeeper', 'Defender', 'Midfielder', 'Forward')`;

const PLAYER_COLUMNS = `p.id, p.known_as, p.full_name, p.birth_year, p.birth_date, p.position,
                        t.code AS team_code, t.name AS team_name,
                        tr.year, s.shirt_number, s.club, s.caps, s.goals, s.is_captain,
                        (SELECT GROUP_CONCAT(
                                  CONCAT(a.award, IF(a.year IS NULL, '', CONCAT(' (', a.year, ')')))
                                  ORDER BY a.year, a.id SEPARATOR '||')
                           FROM player_awards a WHERE a.player_id = p.id) AS awards,
                        (SELECT GROUP_CONCAT(
                                  CONCAT(c.club, IF(c.years IS NULL, '', CONCAT(' (', c.years, ')')))
                                  ORDER BY c.sort_order, c.id SEPARATOR '||')
                           FROM player_clubs c WHERE c.player_id = p.id) AS past_clubs`;

const PLAYER_JOINS = `FROM squads s
                      JOIN players p      ON p.id  = s.player_id
                      JOIN teams t        ON t.id  = s.team_id
                      JOIN tournaments tr ON tr.id = s.tournament_id`;

// MySQL returns BOOLEAN as 0/1 and DATE as a JS Date; make both friendly for JSON.
// Awards and past clubs come back as one '||'-joined string; turn them into arrays.
function cleanPlayer(row) {
  return {
    ...row,
    is_captain: Boolean(row.is_captain),
    awards: row.awards ? row.awards.split('||') : [],
    past_clubs: row.past_clubs ? row.past_clubs.split('||') : [],
    birth_date: row.birth_date ? row.birth_date.toISOString().slice(0, 10) : null
  };
}

export async function getTournaments() {
  const [rows] = await pool.query(
    'SELECT year, host, winner, runner_up FROM tournaments ORDER BY year'
  );
  return rows;
}

export async function getTeams() {
  const [rows] = await pool.query(
    `SELECT t.code, t.name, t.confederation, t.coach_2023, t.summary,
            COUNT(tt.tournament_id) AS appearances,
            COALESCE(SUM(tt.result = 'Champions'), 0) AS titles,
            MIN(FIELD(tt.result, ${RESULT_ORDER.map(() => '?').join(', ')})) AS best_rank
       FROM teams t
       LEFT JOIN team_tournaments tt ON tt.team_id = t.id
      GROUP BY t.id
      ORDER BY t.name`,
    RESULT_ORDER
  );
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    confederation: r.confederation,
    coach_2023: r.coach_2023,
    summary: r.summary,
    appearances: Number(r.appearances),
    titles: Number(r.titles),
    best_result: RESULT_ORDER[r.best_rank - 1] || null
  }));
}

export async function getTeam(code) {
  const teams = await getTeams();
  return teams.find((t) => t.code === code) || null;
}

export async function getTeamTournaments(code) {
  const [rows] = await pool.query(
    `SELECT tr.year, tr.host, tr.winner, tr.runner_up, tt.result
       FROM team_tournaments tt
       JOIN teams t        ON t.id  = tt.team_id
       JOIN tournaments tr ON tr.id = tt.tournament_id
      WHERE t.code = ?
      ORDER BY tr.year`,
    [code]
  );
  return rows;
}

export async function getTeamPlayers(code, year) {
  let sql = `SELECT ${PLAYER_COLUMNS} ${PLAYER_JOINS} WHERE t.code = ?`;
  const params = [code];
  if (year) {
    sql += ' AND tr.year = ?';
    params.push(year);
  }
  sql += ` ORDER BY tr.year, ${POSITION_ORDER}, s.shirt_number, p.known_as`;
  const [rows] = await pool.query(sql, params);
  return rows.map(cleanPlayer);
}

// Search players across teams. All filters are optional.
export async function searchPlayers({ year, team, position, q }) {
  let sql = `SELECT ${PLAYER_COLUMNS} ${PLAYER_JOINS} WHERE 1 = 1`;
  const params = [];
  if (year) { sql += ' AND tr.year = ?'; params.push(year); }
  if (team) { sql += ' AND t.code = ?'; params.push(team); }
  if (position) { sql += ' AND p.position = ?'; params.push(position); }
  if (q) {
    // Escape LIKE wildcards so a search for "%" is treated as plain text
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    sql += ' AND (p.known_as LIKE ? OR p.full_name LIKE ? OR s.club LIKE ?)';
    params.push(like, like, like);
  }
  sql += ` ORDER BY tr.year DESC, t.name, ${POSITION_ORDER}, s.shirt_number, p.known_as`;
  const [rows] = await pool.query(sql, params);
  return rows.map(cleanPlayer);
}