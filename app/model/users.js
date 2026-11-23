import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';

const scrypt = promisify(crypto.scrypt);

// Stored as "salt:hash" (both hex). Uses Node's built-in crypto, so no extra package.
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function passwordMatches(password, stored) {
  const [salt, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(expected, actual);
}

// Never send password_hash to the browser
const PUBLIC_COLUMNS = `u.id, u.email, u.display_name, u.favourite_team_code,
                        t.name AS favourite_team_name, u.created_at`;

// CREATE
export async function createUser({ email, password, displayName, favouriteTeam }) {
  const passwordHash = await hashPassword(password);
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, favourite_team_code)
     VALUES (?, ?, ?, ?)`,
    [email, passwordHash, displayName, favouriteTeam || null]
  );
  return getUser(result.insertId);
}

// READ
export async function getUser(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
       FROM users u
       LEFT JOIN teams t ON t.code = u.favourite_team_code
      WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Used by log-in: returns the user only if email and password are right
export async function checkLogin(email, password) {
  const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
  if (rows.length === 0) return null;
  const ok = await passwordMatches(password, rows[0].password_hash);
  return ok ? getUser(rows[0].id) : null;
}

// UPDATE
export async function updateUser(id, { displayName, favouriteTeam }) {
  await pool.query(
    'UPDATE users SET display_name = ?, favourite_team_code = ? WHERE id = ?',
    [displayName, favouriteTeam || null, id]
  );
  return getUser(id);
}

// DELETE
export async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows === 1;
}