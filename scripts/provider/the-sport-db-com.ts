import type { DataProvider, Match, Team } from "./index";

const FREE_KEY = "123";
const REQUEST_GAP_MS = 3000;
const RETRY_PAUSE_MS = 30000;

/** Football-data.com-style competition codes → TheSportsDB league names. The
 *  free tier only serves competitions listed under a club's primary league, so
 *  European competitions and some cups resolve via a known id instead (below). */
const CODE_TO_LEAGUE: Record<string, string> = {
	PL: "English Premier League",
	PD: "Spanish La Liga",
	SA: "Italian Serie A",
	BL1: "German Bundesliga",
	FL1: "French Ligue 1",
	CL: "UEFA Champions League",
	EL: "UEFA Europa League",
	FAC: "FA Cup",
	ELC: "EFL Cup",
	CDR: "Copa del Rey",
	CIT: "Coppa Italia",
	DFB: "DFB-Pokal",
	CDF: "Coupe de France",
};

/** League ids verified against the live v4 API. Kept for competitions whose
 *  teams are not indexed under a primary `strLeague` (European competitions,
 *  and cups that elude `?l=` resolution). */
const KNOWN_LEAGUE_IDS: Record<string, number> = {
	"English Premier League": 4328,
	"UEFA Champions League": 4480,
	"UEFA Europa League": 4481,
	"FA Cup": 4482,
	"EFL Cup": 4570,
	"Copa del Rey": 4483,
};

const sleep = (ms: number): Promise<void> => {
	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, ms);
	return promise;
};

/** European season string (Aug–Jul), e.g. 2026-11 → "2026-2027". */
function currentSeason(): string {
	const d = new Date();
	const y = d.getUTCFullYear();
	return d.getUTCMonth() + 1 >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const mapStatus = (raw: unknown): string => {
	const v = String(raw ?? "")
		.trim()
		.toLowerCase();
	if (!v) return "SCHEDULED";
	if (v === "ft" || v.includes("finish")) return "FINISHED";
	if (
		v === "ns" ||
		v.includes("not start") ||
		v.includes("no time") ||
		v.includes("fixture")
	)
		return "SCHEDULED";
	if (
		v.includes("progress") ||
		v.includes("live") ||
		v.includes("halftime") ||
		["1h", "2h", "ht", "et", "pen"].includes(v)
	)
		return "LIVE";
	if (v.includes("postpon")) return "POSTPONED";
	if (v.includes("cancel") || v.includes("abandon")) return "CANCELLED";
	if (v.includes("suspend")) return "SUSPENDED";
	return "SCHEDULED";
};

/** Normalize a TheSportsDB `strTimestamp` into the app's UTC ISO form. A
 *  missing / date-only / midnight value yields the midnight placeholder the UI
 *  renders as TBD. */
const normalizeUtcDate = (raw: unknown): string => {
	const tbd = () => `${currentSeason().slice(0, 4)}-01-01T00:00:00Z`;
	if (typeof raw !== "string" || !raw.trim()) return tbd();
	const trimmed = raw.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
	const hasOffset = /(Z|[+-]\d{2}:\d{2})$/.test(trimmed);
	const d = new Date(hasOffset ? trimmed : `${trimmed}Z`);
	if (Number.isNaN(d.getTime())) return tbd();
	return d.toISOString();
};

const parseScore = (
	home: unknown,
	away: unknown,
): { home: number; away: number } | null => {
	if (home == null || away == null) return null;
	const h = Number(home);
	const a = Number(away);
	if (!Number.isFinite(h) || !Number.isFinite(a)) return null;
	return { home: h, away: a };
};

interface RawTeam {
	idTeam?: unknown;
	strTeam?: unknown;
	strTeamShort?: unknown;
	strBadge?: unknown;
	idLeague?: unknown;
	strLeague?: unknown;
}

interface RawEvent {
	idEvent?: unknown;
	strTimestamp?: unknown;
	strStatus?: unknown;
	intRound?: unknown;
	strRound?: unknown;
	intHomeScore?: unknown;
	intAwayScore?: unknown;
	idHomeTeam?: unknown;
	strHomeTeam?: unknown;
	strHomeTeamShort?: unknown;
	strHomeTeamBadge?: unknown;
	idAwayTeam?: unknown;
	strAwayTeam?: unknown;
	strAwayTeamShort?: unknown;
	strAwayTeamBadge?: unknown;
	idLeague?: unknown;
	strLeague?: unknown;
}

const teamFromSearch = (t: RawTeam, competition: string): Team | null => {
	const id = Number(t.idTeam);
	if (!Number.isFinite(id)) return null;
	return {
		id,
		name: String(t.strTeam ?? ""),
		shortName: typeof t.strTeamShort === "string" ? t.strTeamShort : undefined,
		competition,
		crest: typeof t.strBadge === "string" ? t.strBadge : undefined,
	};
};

const eventToMatch = (e: RawEvent, code: string): Match | null => {
	const id = Number(e.idEvent);
	const homeId = Number(e.idHomeTeam);
	const awayId = Number(e.idAwayTeam);
	if (
		!Number.isFinite(id) ||
		!Number.isFinite(homeId) ||
		!Number.isFinite(awayId)
	)
		return null;
	const score = parseScore(e.intHomeScore, e.intAwayScore);
	const leagueName = typeof e.strLeague === "string" ? e.strLeague : code;
	return {
		id,
		utcDate: normalizeUtcDate(e.strTimestamp),
		status: mapStatus(e.strStatus),
		matchday: Number.isFinite(Number(e.intRound))
			? Number(e.intRound)
			: undefined,
		stage: undefined,
		competition: { code, name: leagueName },
		homeTeam: {
			id: homeId,
			name: String(e.strHomeTeam ?? ""),
			shortName:
				typeof e.strHomeTeamShort === "string" ? e.strHomeTeamShort : undefined,
			crest:
				typeof e.strHomeTeamBadge === "string" ? e.strHomeTeamBadge : undefined,
		},
		awayTeam: {
			id: awayId,
			name: String(e.strAwayTeam ?? ""),
			shortName:
				typeof e.strAwayTeamShort === "string" ? e.strAwayTeamShort : undefined,
			crest:
				typeof e.strAwayTeamBadge === "string" ? e.strAwayTeamBadge : undefined,
		},
		score: score ? { fullTime: score, winner: winnerFor(score) } : undefined,
	};
};

const winnerFor = (score: { home: number; away: number }): string =>
	score.home > score.away
		? "HOME_TEAM"
		: score.home < score.away
			? "AWAY_TEAM"
			: "DRAW";

/**
 * TheSportsDB v1 provider. Free key "123", 30 req/min ceiling. Team rosters
 * are assembled from the season's matches (the free "List Teams" endpoint caps
 * at 10 rows) so every competing club is present; short names/crests are
 * enriched from that capped search where available.
 */
export function createTheSportsDBProvider({
	key,
}: {
	key?: string;
}): DataProvider {
	const apiKey = key ?? FREE_KEY;
	let lastRequestMs = 0;
	const competitionCache = new Map<
		string,
		{ search: Team[]; events: Match[] }
	>();

	async function throttle() {
		const wait = lastRequestMs
			? Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestMs))
			: 0;
		if (wait > 0) await sleep(wait);
		lastRequestMs = Date.now();
	}

	async function fetchJson(
		endpoint: string,
		isRetry = false,
	): Promise<unknown> {
		await throttle();
		const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/${endpoint}`;
		let res: Response;
		try {
			res = await fetch(url);
		} catch (err) {
			if (isRetry) throw err;
			console.warn(`TheSportsDB network error (${endpoint}); retrying in 30s`);
			await sleep(RETRY_PAUSE_MS);
			return fetchJson(endpoint, true);
		}
		if (res.status === 429 || !res.ok) {
			const text = await res.text().catch(() => "");
			if (/^error code/i.test(text.trim())) {
				if (isRetry) {
					throw new Error(`TheSportsDB rate-limited (${text.trim()})`);
				}
				console.warn(`TheSportsDB rate-limited; retrying in 30s`);
				await sleep(RETRY_PAUSE_MS);
				return fetchJson(endpoint, true);
			}
			throw new Error(
				`TheSportsDB ${res.status} for ${endpoint}: ${text.slice(0, 200)}`,
			);
		}
		return res.json();
	}

	async function loadCompetition(code: string): Promise<{
		search: Team[];
		events: Match[];
	}> {
		const cached = competitionCache.get(code);
		if (cached) return cached;
		const league = CODE_TO_LEAGUE[code];
		if (!league) {
			throw new Error(`No TheSportsDB league mapped for code "${code}"`);
		}
		const knownId = KNOWN_LEAGUE_IDS[league];

		let search: Team[] = [];
		let leagueId: number | undefined;
		if (knownId) {
			leagueId = knownId;
		} else {
			const data = (await fetchJson(
				`search_all_teams.php?l=${encodeURIComponent(league)}`,
			)) as { teams?: RawTeam[] };
			const parsedTeams = (data.teams ?? []).map((t) =>
				teamFromSearch(t, league),
			);
			search = parsedTeams.filter((t): t is Team => t !== null);
			leagueId = Number(data.teams?.find((t) => t.idLeague != null)?.idLeague);
			if (!Number.isFinite(leagueId)) {
				throw new Error(`Cannot resolve TheSportsDB league id for "${league}"`);
			}
		}

		const eventsData = (await fetchJson(
			`eventsseason.php?id=${leagueId}&s=${currentSeason()}`,
		)) as { events?: RawEvent[] };
		const parsedEvents = (eventsData.events ?? []).map((e) =>
			eventToMatch(e, code),
		);
		const events = parsedEvents.filter((m): m is Match => m !== null);
		const result = { search, events };
		competitionCache.set(code, result);
		return result;
	}

	function mergedRoster(search: Team[], events: Match[]): Team[] {
		const map = new Map<number, Team>();
		for (const t of search) map.set(t.id, t);
		for (const m of events) {
			for (const side of ["homeTeam", "awayTeam"] as const) {
				const tm = m[side];
				const existing = map.get(tm.id);
				if (!existing) {
					map.set(tm.id, {
						id: tm.id,
						name: tm.name,
						shortName: tm.shortName,
						competition: m.competition?.name ?? "",
						crest: tm.crest,
					});
				} else if (!existing.shortName && tm.shortName) {
					map.set(tm.id, { ...existing, shortName: tm.shortName });
				}
			}
		}
		return [...map.values()];
	}

	return {
		name: "thesportsdb",
		async fetchTeams(code: string): Promise<Team[]> {
			const { search, events } = await loadCompetition(code);
			return mergedRoster(search, events);
		},
		async fetchMatches(code: string): Promise<Match[]> {
			const { events } = await loadCompetition(code);
			return events;
		},
		season: currentSeason,
	};
}
