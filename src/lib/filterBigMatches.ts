import Fuse from "fuse.js";
export type Match = {
	id: number;
	utcDate: string;
	status: string;
	competition: { name: string; code?: string };
	homeTeam: { id: number; name: string; crest?: string };
	awayTeam: { id: number; name: string; crest?: string };
	score?: {
		winner?: string | null;
		fullTime?: { home?: number | null; away?: number | null };
	};
};

export type Team = {
	id: number;
	name: string;
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

// Fuzzy team-name search via Fuse.js. Shares the production matcher across the
// Overview / Schedules club search and the Teams page search. Preserves input
// order and duplicate entries for empty queries (a team may appear under
// several competitions); non-empty queries return relevance-ranked matches.
export function filterTeamsByName(teams: Team[], query: string): Team[] {
	const q = fold(query.trim());
	if (!q) return teams;
	const indexed = teams.map((t) => ({ t, n: fold(t.name) }));
	const fuse = new Fuse(indexed, {
		keys: ["n"],
		threshold: 0.3,
		ignoreLocation: true,
	});
	return fuse.search(q).map((r) => r.item.t);
}
