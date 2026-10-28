# Repository Guidelines

## Project Overview
Big Matches is a single-page React app that shows football fixtures *only* between teams in a user-selected list (mutual pairings). Match data comes from the Football-Data.org API; the user picks teams via an on-page picker, and any match where either side isn't selected is filtered out.

## Architecture & Data Flow
- Server-side data fetch (Route Loader) → typed data handed to the page component.
- User team selection lives in the browser (localStorage) and is applied client-side as a pure filter over the fetched matches.
- Teams are defined in a static config; the page groups matches by competition.

## Key Directories
- `src/routes/` — file-based routes. Adding a file here regenerates the routing tree automatically.
- `src/lib/` — core application logic: API access + a pure filtering function (with its test).
- `src/config/` — static team catalog / competition configuration.
- `.github/workflows/` — CI checks.

## Development Commands
Package manager: **npm** (lockfile `package-lock.json`).

| Command | Action |
|---|---|
| `npm install` | install dependencies |
| `npm run dev` | local dev server (no typecheck) |
| `npm run build` | production build, then full TypeScript typecheck |
| `npm run preview` | preview the production build |
| `npm test` | run the test suite once |

Setup: copy `.env.example` to `.env` and set the Football-Data.org API key.

## Code Conventions & Common Patterns
- **TypeScript**: type-only imports and exported types; null-safety is enforced (`strictNullChecks`), not full strict mode.
- **React**: functional components with typed props; styling is inline (no CSS modules).
- **Routing**: TanStack Router file routes + server functions for data loading; consume loader data via the route's typed hook.
- **Naming**: constants in UPPER_CASE; small module-level helpers, camelCase.
- **Error handling**: fail loudly on API errors (throw); tolerate/ignore non-critical failures (e.g. localStorage, a single failed competition); log a dev warning for suspicious data.
- **Patterns**: derive filtered view with memoization; keep pure logic separate from UI and unit-test it.

## Documentation Drift
- Every change MUST be checked for documentation drift: if it affects any documented behavior, command, config, or convention (including this file), update the affected docs in the same change.
- This file is the source of truth for repo conventions; keep it accurate when conventions evolve.

## Important Files
- `src/router.tsx` — app router setup.
- `src/routeTree.gen.ts` — **auto-generated** by the router plugin during dev/build. Do not edit.
- `src/lib/api.ts` — server-side API fetch + caching.
- `src/config/teams.ts` — the team catalog and default selection.
- `vite.config.ts`, `tsconfig.json`, `package.json` — build/tooling configuration.

## Runtime/Tooling Preferences
- **Runtime**: Node ≥ 22.12 (implied by toolchain; no `engines` declared).
- **Package manager**: npm.
- No path aliases configured; Vite handles module resolution.
- **Vitest**: no config file — runs on defaults. No coverage tooling configured.

## Testing & QA
- **Framework**: vitest; tests are colocated next to source (`*.test.ts`).
- Keep pure logic unit-tested with small data factories; assert with `toEqual`/`toBe`.
- **CI**: PR workflow checks that the PR body contains the required template headings.
