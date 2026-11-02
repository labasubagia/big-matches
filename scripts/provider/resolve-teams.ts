import type { Team } from "./index";

/** Shape of the previous run's persisted state (subset of fixtures.json). */
export interface PrevState {
	provider?: string;
	codes?: string[];
	teams?: Team[];
}

/**
 * Decide the final roster after a refresh attempt. If the refresh yielded any
 * teams they win outright; otherwise fall back to the previous roster. Returns
 * `warned: true` when that fallback reuses a roster that does not match the
 * current generation — either from a *different* provider, or from a previous
 * competition-code set — the exact failure modes that once shipped thesportsdb
 * team ids alongside football-data match ids.
 */
export function resolveTeams(
	all: Team[],
	prev: PrevState | null,
	providerName: string,
	codes?: string[],
): { teams: Team[]; warned: boolean } {
	if (all.length) return { teams: all, warned: false };
	const providerChanged = Boolean(
		prev?.provider && prev.provider !== providerName,
	);
	const prevCodes = Array.isArray(prev?.codes)
		? (prev.codes as string[])
		: null;
	const codesChanged = Boolean(
		codes && prevCodes && prevCodes.join(",") !== codes.join(","),
	);
	return { teams: prev?.teams ?? [], warned: providerChanged || codesChanged };
}
