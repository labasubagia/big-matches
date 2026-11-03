import { useMemo } from "react";
import type { Match } from "./filterBigMatches";
import { filterOverviewMatches } from "./filterBigMatches";
import { withinRange } from "./matchTimes";
import type { MatchFilterState } from "./useMatchFilters";

// Overview compute: mutual-pairing filter, date-range clip, and date sort.
// Refactored out of the route, which renders the derived list.
export function useFilteredMatches(
	fixtures: Match[],
	selected: number[],
	ready: boolean,
	filters: MatchFilterState,
): Match[] {
	return useMemo(() => {
		const range = filters.range;
		if (!ready || !range) return [];
		return filterOverviewMatches(
			fixtures,
			new Set(selected),
			new Set(filters.selectedTeams),
		)
			.filter((m) => withinRange(m, range.from, range.to))
			.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
	}, [ready, fixtures, selected, filters.range, filters.selectedTeams]);
}
