import { DEFAULT_SELECTED_IDS } from "../config/teams";

export const STORAGE_KEY = "big-matches-selected";

export function readSavedSelection(validIds: ReadonlySet<number>): number[] {
	if (typeof window === "undefined") return DEFAULT_SELECTED_IDS;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_SELECTED_IDS;
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(n): n is number => typeof n === "number" && validIds.has(n),
			);
		}
	} catch {
		// fall through to default
	}
	return DEFAULT_SELECTED_IDS;
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
