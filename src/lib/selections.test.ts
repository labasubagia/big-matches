import { describe, expect, it, vi } from "vitest";
import type { Team } from "./filterBigMatches";
import { defaultBigTeamIds, readSavedSelection } from "./selections";

const VALID = new Set([86, 81, 64]);
const DEFAULT = [86, 81];

function mockLocalStorage(store: Record<string, string>) {
	const storage = {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: vi.fn(),
	};
	vi.stubGlobal("window", { localStorage: storage });
}

describe("readSavedSelection", () => {
	it("returns saved ids filtered to valid teams", () => {
		mockLocalStorage({ "big-matches-selected": JSON.stringify([86, 999]) });
		expect(readSavedSelection(VALID, DEFAULT)).toEqual([86]);
	});

	it("preserves a deliberately empty selection", () => {
		mockLocalStorage({ "big-matches-selected": "[]" });
		expect(readSavedSelection(VALID, DEFAULT)).toEqual([]);
	});

	it("falls back to default on corrupt JSON", () => {
		mockLocalStorage({ "big-matches-selected": "not json" });
		expect(readSavedSelection(VALID, DEFAULT)).toEqual(DEFAULT);
	});
});

describe("defaultBigTeamIds", () => {
	const TEAMS: Team[] = [
		{ id: 4, name: "Borussia Dortmund", competition: "Bundesliga" },
		{ id: 4, name: "Borussia Dortmund", competition: "UEFA Champions League" },
		{ id: 5, name: "FC Bayern München", competition: "Bundesliga" },
		{ id: 5, name: "FC Bayern München", competition: "UEFA Champions League" },
		{ id: 57, name: "Arsenal FC", competition: "Premier League" },
		{ id: 57, name: "Arsenal FC", competition: "UEFA Champions League" },
		{ id: 61, name: "Chelsea FC", competition: "Premier League" },
		{ id: 64, name: "Liverpool FC", competition: "Premier League" },
		{ id: 64, name: "Liverpool FC", competition: "UEFA Champions League" },
		{ id: 81, name: "FC Barcelona", competition: "Primera Division" },
		{ id: 81, name: "FC Barcelona", competition: "UEFA Champions League" },
		{ id: 100, name: "AS Roma", competition: "Serie A" },
		{ id: 100, name: "AS Roma", competition: "UEFA Champions League" },
		{ id: 498, name: "Sporting CP", competition: "UEFA Champions League" },
		{ id: 524, name: "PSG", competition: "Ligue 1" },
		{ id: 524, name: "PSG", competition: "UEFA Champions League" },
		{ id: 7397, name: "Como 1907", competition: "Serie A" },
		{ id: 7397, name: "Como 1907", competition: "UEFA Champions League" },
	];

	it("selects UCL teams that also sit in a top-five league, sorted", () => {
		expect(defaultBigTeamIds(TEAMS)).toEqual([
			4, 5, 57, 64, 81, 100, 524, 7397,
		]);
	});
});
