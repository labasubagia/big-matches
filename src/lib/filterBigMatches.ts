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
