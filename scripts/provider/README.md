# Data providers

`scripts/provider/` holds the swappable data providers behind the `DataProvider`
interface (`index.ts`). Pick one with `DATA_PROVIDER` env (`footballdata`
default). Each provider owns its transport (auth, rate limiting, retries).

| Provider | File | Env | Free tier |
|---|---|---|---|
| Football-Data.org | `football-data-org.ts` | `FOOTBALL_DATA_API_KEY` | 12 competitions, 10 req/min |
| TheSportsDB | `the-sport-db-com.ts` | `THESPORTSDB_API_KEY` (free key `123`) | 30 req/min, tight per-endpoint caps |

---

## Football-Data.org (`footballdata`)

The default provider. Reliable, well-structured data for 12 free competitions
(PL, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Eredivisie,
Primeira Liga, Championship, Brazilian Serie A, World Cup, European Championship).

### Limitations / problems
- **Paid-gated competitions.** UEFA Europa League and domestic cups (FA Cup,
  EFL Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France) require a
  paid tier — this is the main reason the TheSportsDB provider exists.
- **Rate limit: 10 requests/min** (free tier). The provider paces requests and
  retries on `429`; too many competitions in one run can hit the ceiling.
- **Requires an API key.** `FOOTBALL_DATA_API_KEY` must be set or the run skips
  every competition (empty output + exit 1).
- Rosters come from `/competitions/{code}/teams` (free tier) and are cached
  stale-while-revalidate (7-day TTL) in `fixtures.json`; the roster is refreshed
  when the provider changes.

---

## TheSportsDB (`thesportsdb`)

Free key `123` (no signup). Gives access to competitions Football-Data.org gates
behind its paid plan (UEFA Europa League + domestic cups).

### Limitations / problems (all verified against the live free API + official docs)
- **`eventsseason` caps at 15 events per league-season** (documented free limit).
  The roster is derived from the distinct clubs in those 15 events, so it only
  reflects clubs that had a fixture in that window.
  - **UCL is effectively unusable**: the 15 events returned for the UCL season
    are early qualifying-round ties (Víkingur Reykjavík, Lincoln Red Imps, …),
    not the league-phase clubs. Use Football-Data.org for Champions League.
  - League rosters come out slightly short (e.g. La Liga 19/20, Bundesliga
    18/20) because one or two clubs have no fixture inside the 15-event window.
- **`search_all_teams` caps at 10 rows** and only indexes clubs under their
  *primary* league. European competitions (CL/EL) return **0 rows** via `?l=`,
  so they resolve through known league ids instead. The 10-row cap means
  short-names/crests are only enriched for those 10 clubs; every other club's
  badge comes from the events.
- **Season format must be `YYYY-YYYY`.** `s=2025` (single year) returns
  `{"events":null}`.
- **Rate limit: 30 requests/min**, enforced as HTTP `429`/error `1015`, sticky
  for ~60–120s. The provider paces requests (3s gap) and retries once after 30s.
- **Timestamp handling.** `strTimestamp` has no timezone offset in treated as UTC
  (a `Z`). Date-only/missing kickoff times map to a midnight placeholder so the
  app's "TBD" (undecided time) style triggers.
- **Status strings are ad hoc** (`FT`, `Not Started`, …) — mapped by keyword scan
  onto the app's status enum; unknown/in-progress values fall back to predictable
  buckets.
- Crests are downloaded from TheSportsDB's R2 CDN at generation time (self-hosted
  into `public/crests/`). A single transient download failure drops just that
  crest (UI falls back to the club initial); a run typically has 0–1 failures.

### When to use it
Use `thesportsdb` for the competitions Football-Data.org gates behind its paid
plan (UEFA Europa League `EL`, FA Cup `FAC`, EFL Cup `ELC`, Copa del Rey `CDR`,
Coppa Italia `CIT`, DFB-Pokal `DFB`, Coupe de France `CDF`). Keep the big
domestic leagues and Champions League on `footballdata` for accuracy.

```
DATA_PROVIDER=thesportsdb \
COMPETITION_CODES=EL,FAC,ELC,CDR,CIT,DFB,CDF \
npm run data:gen
```

---

## Both providers
- Crests are re-downloaded every run (there is no session-resident cache across
  runs, only the `Map` dedupe within a single run).
- The orchestrator refuses to write an empty dataset (exit `1`) and keeps the
  previous roster on a transient team-fetch failure.
