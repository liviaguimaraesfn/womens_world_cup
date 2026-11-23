-- Adds the users table to an existing wwc database without touching the other tables.
-- Run once: mysql -u root -p < app/database/users.sql
USE wwc;

CREATE TABLE IF NOT EXISTS users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  email               VARCHAR(120) NOT NULL UNIQUE,
  password_hash       VARCHAR(200) NOT NULL,
  display_name        VARCHAR(60)  NOT NULL,
  favourite_team_code CHAR(3) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (favourite_team_code) REFERENCES teams(code) ON DELETE SET NULL
);