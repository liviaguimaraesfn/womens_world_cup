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