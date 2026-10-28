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

// Filter teams by case-insensitive name substring or a near-miss typo. Shared
// by the Overview / Schedules club search and the Teams page search. Preserves
// input order and duplicate entries (a team may appear under several
// competitions).
export function filterTeamsByName(teams: Team[], query: string): Team[] {
	const q = query.trim().toLowerCase();
	if (!q) return teams;
	const maxDist = Math.max(1, Math.floor(q.length / 4));
	return teams.filter((t) => {
		const name = t.name.toLowerCase();
		return name.includes(q) || levenshtein(name, q) <= maxDist;
	});
}

// Classic Levenshtein edit distance (two-row DP).
function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	if (m === 0) return n;
	if (n === 0) return m;
	let prev = Array.from({ length: n + 1 }, (_, j) => j);
	for (let i = 1; i <= m; i++) {
		const cur = new Array(n + 1);
		cur[0] = i;
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
		}
		prev = cur;
	}
	return prev[n];
}
