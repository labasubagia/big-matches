import type { Team } from "./filterBigMatches";

export const STORAGE_KEY = "big-matches-selected";

// Leagues whose teams qualify for the "big teams" default selection.
const TOP5_LEAGUE_NAMES: Record<string, true> = {
	"Premier League": true,
	"Primera Division": true,
	"Serie A": true,
	Bundesliga: true,
	"Ligue 1": true,
};

// Default selection = teams playing in the UCL that also sit in a top-five
// league roster. Derived from the same rosters the UI renders, so it stays
// consistent whether those come from real generated fixtures or the e2e mock.
export function defaultBigTeamIds(teams: readonly Team[]): number[] {
	const ucl = new Set(
		teams
			.filter((t) => t.competition === "UEFA Champions League")
			.map((t) => t.id),
	);
	const top5 = new Set(
		teams
			.filter((t) => TOP5_LEAGUE_NAMES[t.competition] === true)
			.map((t) => t.id),
	);
	return [...ucl].filter((id) => top5.has(id)).sort((a, b) => a - b);
}

export function readSavedSelection(
	validIds: ReadonlySet<number>,
	defaultIds: number[],
): number[] {
	if (typeof window === "undefined") return defaultIds;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultIds;
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(n): n is number => typeof n === "number" && validIds.has(n),
			);
		}
	} catch {
		// fall through to default
	}
	return defaultIds;
}

export function writeSelection(ids: number[]) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// storage unavailable; ignore
	}
}

export function toggleId(ids: number[], id: number): number[] {
	return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
