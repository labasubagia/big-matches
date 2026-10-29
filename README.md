# Big Matches

Single-page site showing only fixtures between teams in a selected list (mutual
pairings). Matches against non-selected teams are excluded.

## Setup

1. `npm install`
2. Get a free key at https://www.football-data.org/ and set `FOOTBALL_DATA_API_KEY`
   (`.env.example` → `.env`).
3. Refresh local data: `npm run data:gen`
4. `npm run dev` → http://localhost:3000

If you run the app before refreshing data, a committed placeholder JSON is used;
empty data shows an error prompting you to run `npm run data:gen`.

## Selecting teams

Use the on-page picker: teams are grouped by competition (Premier League, La
Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League); select the ones you
want to follow. Your selection is saved in the browser and restored on next visit.

## Tests

- Unit: `npm test`
- End-to-end: `npm run test:e2e` (Playwright; no real key needed). Install
  Chromium once: `npx playwright install chromium`.

## Deployment (GitHub Pages)

Push to `main` triggers CI that regenerates data, builds, and publishes to
`https://<user>.github.io/big-matches/` (also refreshed on a schedule).
`FOOTBALL_DATA_API_KEY` goes in the repository secrets (Settings → Secrets and
variables → Actions).

## Architecture

Technical internals — data pipeline, CI cadence, testing setup, routing — live in
[docs/architecture.md](docs/architecture.md).
