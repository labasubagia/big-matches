import { describe, expect, it } from "vitest";
import type { Team } from "../lib/filterBigMatches";
import fixtures from "../lib/fixtures.json";
import { DEFAULT_SELECTED_IDS } from "./teams";

const teams = fixtures.teams as Team[];

// Mirrors scripts/generate-data.mjs: default selection = teams in a top-five
// league roster that also appear in the UEFA Champions League roster.
const TOP5_LEAGUE_NAMES: Record<string, true> = {
	"Premier League": true,
	"Primera Division": true,
	"Serie A": true,
	Bundesliga: true,
	"Ligue 1": true,
};

function intersection(): number[] {
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

describe("DEFAULT_SELECTED_IDS", () => {
	it("equals the top-5-league ∩ UCL roster from committed fixtures", () => {
		expect(DEFAULT_SELECTED_IDS).toEqual(intersection());
	});

	it("is non-empty, unique, and sorted ascending", () => {
		expect(DEFAULT_SELECTED_IDS.length).toBeGreaterThan(0);
		expect(new Set(DEFAULT_SELECTED_IDS).size).toBe(
			DEFAULT_SELECTED_IDS.length,
		);
		expect(DEFAULT_SELECTED_IDS).toEqual(
			[...DEFAULT_SELECTED_IDS].sort((a, b) => a - b),
		);
	});
});
