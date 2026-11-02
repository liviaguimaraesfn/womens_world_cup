import mysql from 'mysql2/promise';
import details from '../config/mysql.js';

const pool = mysql.createPool({
  ...details,
  waitForConnections: true,
  connectionLimit: 10
});

export async function getTeam(code) {
  const [rows] = await pool.query(
    'SELECT id, code, name, confederation FROM teams WHERE code = ?',
    [code]
  );
  return rows[0] || null;
}

export async function getTeamTournaments(code) {
  const [rows] = await pool.query(
    `SELECT tr.year, tr.host, tr.winner, tt.result
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
  let sql = `SELECT p.id, p.known_as, p.full_name, p.birth_year, p.position,
                    tr.year, s.shirt_number, s.club
               FROM squads s
               JOIN players p      ON p.id  = s.player_id
               JOIN teams t        ON t.id  = s.team_id
               JOIN tournaments tr ON tr.id = s.tournament_id
              WHERE t.code = ?`;
  const params = [code];
  if (year) {
    sql += ' AND tr.year = ?';
    params.push(year);
  }
  sql += ` ORDER BY tr.year,
                  FIELD(p.position, 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'),
                  p.known_as`;
  const [rows] = await pool.query(sql, params);
  return rows;
}