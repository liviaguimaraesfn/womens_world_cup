USE wwc;

INSERT INTO tournaments (year, host, winner) VALUES
  (1991, 'China',                 'United States'),
  (1995, 'Sweden',                'Norway'),
  (1999, 'United States',         'United States'),
  (2003, 'United States',         'Germany'),
  (2007, 'China',                 'Germany'),
  (2011, 'Germany',               'Japan'),
  (2015, 'Canada',                'United States'),
  (2019, 'France',                'United States'),
  (2023, 'Australia / New Zealand','Spain');

INSERT INTO teams (code, name, confederation) VALUES ('BRA', 'Brazil', 'CONMEBOL');

INSERT INTO team_tournaments (team_id, tournament_id, result)
SELECT t.id, tr.id, r.result
FROM teams t
JOIN (
  SELECT 1991 AS y, 'Group stage'   AS result UNION ALL
  SELECT 1995, 'Group stage'   UNION ALL
  SELECT 1999, 'Third place'   UNION ALL
  SELECT 2003, 'Quarter-finals' UNION ALL
  SELECT 2007, 'Runners-up'    UNION ALL
  SELECT 2011, 'Quarter-finals' UNION ALL
  SELECT 2015, 'Round of 16'   UNION ALL
  SELECT 2019, 'Round of 16'   UNION ALL
  SELECT 2023, 'Group stage'
) r
JOIN tournaments tr ON tr.year = r.y
WHERE t.code = 'BRA';

-- Starter players (VERIFY details before submitting)
INSERT INTO players (full_name, known_as, birth_year, position) VALUES
  ('Marta Vieira da Silva',          'Marta',    1986, 'Forward'),
  ('Miraildes Maciel Mota',          'Formiga',  1978, 'Midfielder'),
  ('Cristiane Rozeira de Souza Silva','Cristiane',1985, 'Forward'),
  ('Sisleide do Amor Lima',          'Sissi',    1967, 'Midfielder');

-- Squad entries (shirt_number and club filled in later)
INSERT INTO squads (player_id, team_id, tournament_id)
SELECT p.id, t.id, tr.id
FROM players p
JOIN teams t ON t.code = 'BRA'
JOIN tournaments tr ON
     (p.known_as = 'Marta'     AND tr.year IN (2003, 2007, 2011, 2015, 2019, 2023))
  OR (p.known_as = 'Formiga'   AND tr.year IN (1995, 1999, 2003, 2007, 2011, 2015, 2019))
  OR (p.known_as = 'Cristiane' AND tr.year IN (2007, 2011, 2015, 2019))
  OR (p.known_as = 'Sissi'     AND tr.year IN (1995, 1999));

-- ------------------------------------------------------------------
-- Brazil 2023 squad: 23 players announced by Pia Sundhage on 27 June 2023.
-- Marta is already inserted above; the other 22 are added here.
-- birth_year and shirt_number stay NULL until verified (VERIFY before submitting).
-- ------------------------------------------------------------------
INSERT INTO players (full_name, known_as, birth_year, position) VALUES
  ('Camila Rodrigues', 'Camila', NULL, 'Goalkeeper'),
  ('Letícia Izidoro', 'Letícia', NULL, 'Goalkeeper'),
  ('Bárbara', 'Bárbara', NULL, 'Goalkeeper'),
  ('Antônia', 'Antônia', NULL, 'Defender'),
  ('Bruninha', 'Bruninha', NULL, 'Defender'),
  ('Kathellen', 'Kathellen', NULL, 'Defender'),
  ('Mônica', 'Mônica', NULL, 'Defender'),
  ('Lauren', 'Lauren', NULL, 'Defender'),
  ('Tamires', 'Tamires', NULL, 'Defender'),
  ('Rafaelle Souza', 'Rafaelle', NULL, 'Defender'),
  ('Adriana', 'Adriana', NULL, 'Midfielder'),
  ('Ary Borges', 'Ary Borges', NULL, 'Midfielder'),
  ('Ana Vitória', 'Ana Vitória', NULL, 'Midfielder'),
  ('Duda Sampaio', 'Duda Sampaio', NULL, 'Midfielder'),
  ('Luana', 'Luana', NULL, 'Midfielder'),
  ('Kerolin', 'Kerolin', NULL, 'Midfielder'),
  ('Bia Zaneratto', 'Bia Zaneratto', NULL, 'Forward'),
  ('Gabi Nunes', 'Gabi Nunes', NULL, 'Forward'),
  ('Geyse', 'Geyse', NULL, 'Forward'),
  ('Nycole Raysla', 'Nycole Raysla', NULL, 'Forward'),
  ('Debinha', 'Debinha', NULL, 'Forward'),
  ('Andressa Alves', 'Andressa Alves', NULL, 'Forward');

INSERT INTO squads (player_id, team_id, tournament_id, club)
SELECT p.id, t.id, tr.id, c.club
FROM (
  SELECT 'Camila' COLLATE utf8mb4_unicode_ci AS known_as, 'Santos' AS club UNION ALL
  SELECT 'Letícia', 'Corinthians' UNION ALL
  SELECT 'Bárbara', 'Flamengo' UNION ALL
  SELECT 'Antônia', 'Levante' UNION ALL
  SELECT 'Bruninha', 'NJ/NY Gotham FC' UNION ALL
  SELECT 'Kathellen', 'Real Madrid' UNION ALL
  SELECT 'Mônica', 'Madrid CFF' UNION ALL
  SELECT 'Lauren', 'Madrid CFF' UNION ALL
  SELECT 'Tamires', 'Corinthians' UNION ALL
  SELECT 'Rafaelle', 'Arsenal' UNION ALL
  SELECT 'Adriana', 'Orlando Pride' UNION ALL
  SELECT 'Ary Borges', 'Racing Louisville' UNION ALL
  SELECT 'Ana Vitória', 'Benfica' UNION ALL
  SELECT 'Duda Sampaio', 'Corinthians' UNION ALL
  SELECT 'Luana', 'Corinthians' UNION ALL
  SELECT 'Kerolin', 'North Carolina Courage' UNION ALL
  SELECT 'Bia Zaneratto', 'Palmeiras' UNION ALL
  SELECT 'Gabi Nunes', 'Madrid CFF' UNION ALL
  SELECT 'Geyse', 'Barcelona' UNION ALL
  SELECT 'Nycole Raysla', 'Benfica' UNION ALL
  SELECT 'Debinha', 'Kansas City Current' UNION ALL
  SELECT 'Andressa Alves', 'Roma'
) c
JOIN players p      ON p.known_as = c.known_as
JOIN teams t        ON t.code = 'BRA'
JOIN tournaments tr ON tr.year = 2023;

-- Marta already has a 2023 squad row from the insert above; add her club
UPDATE squads s
  JOIN players p      ON p.id = s.player_id
  JOIN tournaments tr ON tr.id = s.tournament_id
   SET s.club = 'Orlando Pride'
 WHERE p.known_as = 'Marta' AND tr.year = 2023;