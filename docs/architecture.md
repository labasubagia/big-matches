# Architecture

Internal design notes. For usage, see [../README.md](../README.md).

## Data pipeline

Fully static. `scripts/generate-data.mjs` fetches teams and matches from
Football-Data.org v4 and writes both to `src/lib/fixtures.json`. The frontend
imports that JSON at build time — there is no runtime API access and no key in
the browser or build.

API base is `https://api.football-data.org/v4` unless `FOOTBALL_DATA_API_BASE`
is set. Team codes: PL, PD, SA, BL1, FL1, CL. UEL is excluded — Football-Data.org
serves it only on a paid plan.

Matches are the full season per competition (the aggregate `/matches` endpoint
only returns upcoming fixtures). Requests are paced 12s apart and retried once on
429: ~5 requests per run stays within the free-tier 10 req/min budget.

## CI cadence (.github/workflows/deploy.yml)

- Teams: refreshed weekly, cached in `fixtures.json` via `generatedAt`
  (7-day TTL); runs skip refetching teams while fresh.
- Matches: fetched on every run (daily schedule, plus on push to `main`).
- Both land in the same JSON file.

## Placeholder fallback

`src/lib/fixtures.example.json` is committed. `scripts/ensure-fixtures.mjs` copies
it over `src/lib/fixtures.json` when that file is missing, so dev/build never fail
on an absent file. With empty data the app shows an error prompting
`npm run data:gen`.

## Team selection state

Stored under localStorage key `big-matches-selected`.

## FAQ page

Content lives in `src/lib/faqContent.ts` (a `FaqEntry[]`); `src/routes/faq.tsx`
renders each entry as a shadcn `<Accordion>` (`type="single"` `collapsible` —
one item open at a time). Enumeration answers use the `items` field → `<ul>`;
a `footer` renders after the list.

Ordering is grouped by theme, not append-only:

1. Coverage first — "Which competitions are included?", top-5/UCL rule, then
   paywalls (UEL, league cups). These answer most "why can't I see X" questions.
2. App behavior — localStorage (no cross-device sync), static/non-live data.
3. Roadmap/unsure last — e.g. reminders/notifications, not yet shipped.

New entries go inside their theme group, not appended to the end.

## Testing

- Unit: vitest, colocated `*.test.ts`, run via `npm test`
  (`--exclude "e2e/**"`).
- E2E: `npm run test:e2e` → `e2e/run.mjs`:
  - builds mock fixtures from `e2e/fixtures.mock.json` via `build-fixtures.mjs`
    into `src/lib/fixtures.mock.json` (never touches the real file);
  - sets `VITE_FIXTURES=mock` so `src/lib/loadFixtures.ts` loads the mock file;
  - starts the dev server on :3100 and runs Playwright against `/big-matches/`.

## Deployment & routing

Push to `main` triggers `deploy.yml`: generate data → build (TanStack Start
prerenders the route with the data embedded) → publish to GitHub Pages. A daily
scheduled run refreshes matches; rosters weekly (same workflow, `schedule`).

The route lives under `/big-matches/` (`base` in `vite.config.ts` and router
`basepath`), matching the repo name.

The Football-Data key is required only by the generator, in CI:
`FOOTBALL_DATA_API_KEY` as a repository secret.

