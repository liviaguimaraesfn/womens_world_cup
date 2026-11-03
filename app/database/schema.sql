CREATE DATABASE IF NOT EXISTS wwc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wwc;

DROP TABLE IF EXISTS player_awards, player_clubs, squads, team_tournaments, players, teams, tournaments;

CREATE TABLE tournaments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  year       SMALLINT NOT NULL UNIQUE,
  host       VARCHAR(100) NOT NULL,
  winner     VARCHAR(60)  NOT NULL,
  runner_up  VARCHAR(60)  NOT NULL
);

CREATE TABLE teams (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  code           CHAR(3) NOT NULL UNIQUE,
  name           VARCHAR(60) NOT NULL,
  confederation  VARCHAR(20) NOT NULL,
  coach_2023     VARCHAR(80) NULL,
  summary        TEXT NULL
);

-- How far each team got in each edition
CREATE TABLE team_tournaments (
  team_id        INT NOT NULL,
  tournament_id  INT NOT NULL,
  result         VARCHAR(40) NOT NULL,
  PRIMARY KEY (team_id, tournament_id),
  FOREIGN KEY (team_id)       REFERENCES teams(id)       ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE players (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  known_as    VARCHAR(60)  NOT NULL,
  birth_year  SMALLINT NULL,
  birth_date  DATE NULL,
  position    VARCHAR(20) NULL,
  UNIQUE KEY uq_players_full_name (full_name),
  INDEX idx_players_known_as (known_as)
);

-- A player's presence in a team's squad for one tournament
CREATE TABLE squads (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  player_id      INT NOT NULL,
  team_id        INT NOT NULL,
  tournament_id  INT NOT NULL,
  shirt_number   TINYINT NULL,
  club           VARCHAR(80) NULL,
  caps           SMALLINT NULL,
  goals          SMALLINT NULL,
  is_captain     BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_player_tournament (player_id, tournament_id),
  FOREIGN KEY (player_id)     REFERENCES players(id)     ON DELETE CASCADE,
  FOREIGN KEY (team_id)       REFERENCES teams(id)       ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Awards and trophies won by a player (year can be NULL if unknown)
CREATE TABLE player_awards (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  player_id  INT NOT NULL,
  award      VARCHAR(120) NOT NULL,
  year       SMALLINT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_awards_player (player_id)
);

-- Clubs a player played for before her current one, oldest first (sort_order)
CREATE TABLE player_clubs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  player_id   INT NOT NULL,
  club        VARCHAR(80) NOT NULL,
  years       VARCHAR(20) NULL,
  sort_order  TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_clubs_player (player_id)
);