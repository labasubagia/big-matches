import MiniSearch from "minisearch";
export type Match = {
	id: number;
	utcDate: string;
	status: string;
	matchday?: number | null;
	stage?: string | null;
	competition: { name: string; code?: string };
	homeTeam: { id: number; name: string; shortName?: string; crest?: string };
	awayTeam: { id: number; name: string; shortName?: string; crest?: string };
	score?: {
		winner?: string | null;
		fullTime?: { home?: number | null; away?: number | null };
	};
};

export type Team = {
	id: number;
	name: string;
	shortName?: string;
	competition: string;
};

// Keep only fixtures where BOTH teams are in the selected list.
// - no search teams: fall back to mutual pairings among the global selection
// - one search team: every match of that team vs any globally selected team
// - two or more: only matches between the search-selected teams
export function filterOverviewMatches(
	matches: Match[],
	globalIds: ReadonlySet<number>,
	searchIds: ReadonlySet<number>,
): Match[] {
	if (searchIds.size === 1) {
		const [id] = searchIds;
		return matches.filter((m) =>
			m.homeTeam.id === id
				? globalIds.has(m.awayTeam.id)
				: m.awayTeam.id === id
					? globalIds.has(m.homeTeam.id)
					: false,
		);
	}
	if (searchIds.size > 1) {
		return matches.filter(
			(m) => searchIds.has(m.homeTeam.id) && searchIds.has(m.awayTeam.id),
		);
	}
	return matches.filter(
		(m) => globalIds.has(m.homeTeam.id) && globalIds.has(m.awayTeam.id),
	);
}

const fold = (s: string): string =>
	s
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

// Fuzzy team-name search via MiniSearch, with an exact-substring fallback.
// Shares the production matcher across the Overview club search and the Teams
// page search. Preserves input order and duplicate entries for empty queries
// (a team may appear under several competitions); non-empty queries return
// relevance-ranked matches.
const indexCache = new Map<string, MiniSearch>();
const MAX_CACHE_ENTRIES = 32;
const weakKeyCache = new WeakMap<Team[], string>();

export function filterTeamsByName(teams: Team[], query: string): Team[] {
	const q = fold(query.trim());
	if (!q) return teams;
	const terms = q.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	if (terms.length === 0) return [];
	const indexed = teams.map((t, i) => ({
		id: i,
		t,
		c: t.competition,
		n: fold(t.name),
		s: t.shortName ? fold(t.shortName) : "",
	}));
	let cacheKey = weakKeyCache.get(teams);
	if (!cacheKey) {
		cacheKey = indexed
			.map((e) => `${e.t.id}\u0000${e.c}\u0000${e.n}\u0000${e.s}`)
			.join("\u0001");
		weakKeyCache.set(teams, cacheKey);
	}
	let index = indexCache.get(cacheKey);
	if (index) {
		indexCache.delete(cacheKey);
		indexCache.set(cacheKey, index);
	} else {
		index = new MiniSearch({
			fields: ["n", "s"],
			storeFields: ["t"],
			searchOptions: { combineWith: "AND", prefix: true },
		});
		index.addAll(indexed);
		indexCache.set(cacheKey, index);
		if (indexCache.size > MAX_CACHE_ENTRIES) {
			const oldestKey = indexCache.keys().next().value;
			if (oldestKey !== undefined) indexCache.delete(oldestKey);
		}
	}
	const seen = new Set<number>();
	const out: Team[] = [];
	for (let i = 0; i < teams.length; i++) {
		const n = indexed[i].n;
		const s = indexed[i].s;
		if (terms.every((term) => n.includes(term) || s.includes(term))) {
			seen.add(i);
			out.push(teams[i]);
		}
	}
	const fuzzy = (term: string): number =>
		term.length >= 7 ? 2 : term.length >= 3 ? 1 : 0;
	for (const r of index.search(terms.join(" "), {
		fuzzy,
		combineWith: "AND",
	})) {
		if (!seen.has(r.id)) {
			seen.add(r.id);
			out.push(teams[r.id]);
		}
	}
	return out;
}
