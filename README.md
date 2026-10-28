# Big Matches

Simple MVP site that shows only fixtures between teams in a selected list (mutual pairings).
Matches against non-selected teams are excluded.

## Setup

1. `npm install`
2. Get a free key at https://www.football-data.org/ and set it:
   `cp .env.example .env` then populate `FOOTBALL_DATA_API_KEY`.
3. `npm run dev` → http://localhost:3000

## Selecting teams

Use the on-page picker: teams are grouped by competition (Premier League, La Liga,
Serie A, Bundesliga, Ligue 1); tick the ones you want to follow. Your selection is
saved in the browser (localStorage, key `big-matches-selected`) and restored on next visit.

To add or prune teams, edit `src/config/teams.ts` (the `teamCatalog` array) using
Football-Data.org team ids. Competitions scanned are set in `competitionCodes`
(UCL, EPL, La Liga, Serie A, Bundesliga, Ligue 1). UEL is excluded: Football-Data.org
serves it only on a paid plan. Matches are fetched once and cached on the server for 5
minutes, so refreshes don't hit the free-tier rate limit (10 req/min).

If a selected team id is wrong, a warning prints in the dev server log:
`selected teams never appeared in fetched fixtures (check team ids): …`

## Tests

`npm test` — verifies the mutual-pairing filter.

## Verified team ids

Real Madrid 86, Barcelona 81, Liverpool 64, Inter 108, Atlético Madrid 78,
Chelsea 61, Manchester United 66, Manchester City 65, PSG 524.
All ids in the on-page picker are verified against the live Football-Data API.
