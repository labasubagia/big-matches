import { DEFAULT_SELECTED_IDS } from "../config/teams";

export type Match = {
	id: number;
	utcDate: string;
	status: string;
	competition: { name: string };
	homeTeam: { id: number; name: string };
	awayTeam: { id: number; name: string };
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
