import type { Team } from "./index";

/** Shape of the previous run's persisted state (subset of fixtures.json). */
export interface PrevState {
	provider?: string;
	teams?: Team[];
}

/**
 * Decide the final roster after a refresh attempt. If the refresh yielded any
 * teams they win outright; otherwise fall back to the previous roster. Returns
 * `warned: true` when that fallback reuses a roster from a *different*
 * provider than the one serving matches — the exact failure mode that once
 * shipped thesportsdb team ids alongside football-data match ids.
 */
export function resolveTeams(
	all: Team[],
	prev: PrevState | null,
	providerName: string,
): { teams: Team[]; warned: boolean } {
	if (all.length) return { teams: all, warned: false };
	const warned = Boolean(prev?.provider && prev.provider !== providerName);
	return { teams: prev?.teams ?? [], warned };
}
