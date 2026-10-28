# Big Matches

Simple MVP site that shows only fixtures between teams in a selected list (mutual pairings).
Matches against non-selected teams are excluded.

## Setup

1. `npm install`
2. Get a free key at https://www.football-data.org/ and set it:
   `cp .env.example .env` then populate `FOOTBALL_DATA_API_KEY`.
3. `npm run dev` → http://localhost:3000

## Selecting teams

Edit `src/config/teams.ts`: add `{ id, name }` entries with Football-Data.org team ids.
Competitions scanned are set in `competitionCodes` (UCL, UEL, EPL, La Liga, Serie A, Bundesliga, Ligue 1).

If a selected team id is wrong, a warning prints in the dev server log:
`selected teams never appeared in fetched fixtures (check team ids): …`

## Tests

`npm test` — verifies the mutual-pairing filter.

## Verified team ids

Real Madrid 86, Barcelona 81, Liverpool 64, Inter 108, Atlético Madrid 78,
Chelsea 61, Manchester United 66, Manchester City 65, PSG 524 (crest-verified).
