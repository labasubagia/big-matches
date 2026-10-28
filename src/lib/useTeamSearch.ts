import { useMemo, useState } from "react";
import type { Team } from "./filterBigMatches";
import { filterTeamsByName } from "./filterBigMatches";

// Text-only club search for the Teams page. Filters ALL clubs (not just the
// selected big teams) so the user can pick any club. Reused for the query
// state and the filtered candidate list.
export function useTeamSearch(teams: Team[]) {
	const [query, setQuery] = useState("");
	const candidates = useMemo(
		() => filterTeamsByName(teams, query),
		[teams, query],
	);
	return { query, setQuery, candidates };
}
