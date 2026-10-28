import { DEFAULT_SELECTED_IDS } from "../config/teams";

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
// Mutual pairings only; matches against non-selected teams are dropped.
export function filterBigMatches(
	matches: Match[],
	selectedIds: ReadonlySet<number> = new Set(DEFAULT_SELECTED_IDS),
): Match[] {
	return matches.filter(
		(m) => selectedIds.has(m.homeTeam.id) && selectedIds.has(m.awayTeam.id),
	);
}

// Overview search-filter semantics:
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
