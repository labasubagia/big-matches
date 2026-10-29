import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { Match, Team } from "./filterBigMatches";
import { filterTeamsByName } from "./filterBigMatches";
import { localMidnightMs, teamCrests } from "./matchTimes";

const DAY_MS = 24 * 60 * 60 * 1000;

function isoLocal(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type MatchFilterState = {
	fromStr: string;
	setFromStr: Dispatch<SetStateAction<string>>;
	toStr: string;
	setToStr: Dispatch<SetStateAction<string>>;
	query: string;
	setQuery: Dispatch<SetStateAction<string>>;
	selectedTeams: number[];
	candidates: Team[];
	crests: Map<number, string>;
	toggleTeam: (id: number) => void;
	reset: () => void;
	range: { from: number; to: number } | null;
};

// Shared filter state for the Overview page. Filters apply live: date range
// (default 30 days) plus a club search restricted to the selected big teams.
export function useMatchFilters(
	teams: Team[],
	selected: number[],
	matches: Match[],
): MatchFilterState {
	const [fromStr, setFromStr] = useState(() => isoLocal(new Date()));
	const [toStr, setToStr] = useState(() =>
		isoLocal(new Date(Date.now() + 30 * DAY_MS)),
	);
	const [query, setQuery] = useState("");
	const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

	const crests = useMemo(() => teamCrests(matches), [matches]);

	const candidates = useMemo(() => {
		const selectedSet = new Set(selected);
		const seen = new Set<number>();
		return filterTeamsByName(teams, query).filter((t) => {
			if (!selectedSet.has(t.id)) return false;
			if (seen.has(t.id)) return false;
			seen.add(t.id);
			return true;
		});
	}, [query, teams, selected]);

	const toggleTeam = (id: number) =>
		setSelectedTeams((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);

	const reset = () => {
		setFromStr(isoLocal(new Date()));
		setToStr(isoLocal(new Date(Date.now() + 30 * DAY_MS)));
		setQuery("");
		setSelectedTeams([]);
	};

	const range = useMemo(() => {
		const from = localMidnightMs(fromStr);
		const to = localMidnightMs(toStr) + DAY_MS - 1;
		if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
		return { from, to };
	}, [fromStr, toStr]);

	return {
		fromStr,
		setFromStr,
		toStr,
		setToStr,
		query,
		setQuery,
		selectedTeams,
		candidates,
		crests,
		toggleTeam,
		reset,
		range,
	};
}
