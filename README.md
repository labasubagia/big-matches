# Big Matches

Single-page site showing only fixtures between teams in a selected list (mutual pairings).
Matches against non-selected teams are excluded.

## How data works

The app is fully static. A generation script (`scripts/generate-data.mjs`) fetches teams
and matches from Football-Data.org and writes them to `src/lib/fixtures.json`. The frontend
imports that JSON at build time — there is **no runtime API access** and no key in the
browser or build.

CI regenerates the data (`.github/workflows/deploy.yml`):

- Teams: refreshed **weekly** (rosters change per season).
- Matches: refreshed **daily** (fixture date/reschedule changes).
- Both land in the same JSON file; total upstream calls per run ≤ 7 (1 aggregate matches
  fetch + 6 per-competition team fetches), under the free tier's 10 req/min limit.

Competitions scanned: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA
Champions League. UEL is excluded: Football-Data.org serves it only on a paid plan.

## Setup

1. `npm install`
2. Get a free key at https://www.football-data.org/ and set `FOOTBALL_DATA_API_KEY`
   (`.env.example` → `.env`).
3. Refresh local data: `npm run data:gen`
4. `npm run dev` → http://localhost:3000

Until you run `npm run data:gen`, `src/lib/fixtures.example.json` (committed) is copied
over `src/lib/fixtures.json` when it is missing — `npm run dev`/`npm run build` do this
automatically, so the app starts with empty data instead of failing.

## Selecting teams

Use the on-page picker: teams are grouped by the competition they play in (Premier
League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League); tick the ones
you want to follow. Your selection is saved in the browser (localStorage, key
`big-matches-selected`) and restored on next visit.

If a selected team id never appears in the data, a warning prints in the log:
`selected teams never appeared in fetched fixtures (check team ids): …`

## Tests

- Unit: `npm test` (vitest, colocated `*.test.ts`).
- End-to-end: `npm run test:e2e` (Playwright). The runner starts a mock
  (`e2e/mock-api.mjs`), generates fixtures from it via `npm run data:gen`, then runs
  the dev server against the generated data. No real key needed. Chromium must be
  installed once: `npx playwright install chromium`.

## Deployment (GitHub Pages)

Push to `main` triggers `.github/workflows/deploy.yml`: generate data → build (TanStack
Start prerenders the route with the data embedded) → publish to
`https://<user>.github.io/big-matches/`. A daily scheduled run refreshes match data;
rosters refresh weekly (same workflow, `schedule` trigger).

The Football-Data key is required only by the generator in CI — add
`FOOTBALL_DATA_API_KEY` to the repository secrets (Settings → Secrets and variables →
Actions).

The route lives under `/big-matches/` (`base` in `vite.config.ts` and router
`basepath`), matching the repo name.

## Verified team ids

Real Madrid 86, Barcelona 81, Liverpool 64, Inter 108, Atlético Madrid 78,
Chelsea 61, Manchester United 66, Manchester City 65, PSG 524.
All ids in the on-page picker are verified against the live Football-Data API.
