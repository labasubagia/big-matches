import { describe, expect, it } from "vitest";
import {
	filterBigMatches,
	filterOverviewMatches,
	filterTeamsByName,
	type Match,
	type Team,
} from "./filterBigMatches";

function match(overrides: Partial<Match> = {}): Match {
	return {
		id: 1,
		utcDate: "2026-11-01T20:00:00Z",
		status: "SCHEDULED",
		competition: { name: "La Liga" },
		homeTeam: { id: 86, name: "Real Madrid" },
		awayTeam: { id: 81, name: "Barcelona" },
		...overrides,
	};
}

describe("filterBigMatches", () => {
	it("keeps mutual pairings where both teams are selected", () => {
		const fixtures = [match()];
		const out = filterBigMatches(fixtures);
		expect(out).toHaveLength(1);
		expect(out[0]).toBe(fixtures[0]);
	});

	it("drops matches where either team is not selected", () => {
		const fixtures = [
			match(), // Real Madrid vs Barcelona -> keep
			match({
				id: 2,
				homeTeam: { id: 86, name: "Real Madrid" },
				awayTeam: { id: 63, name: "Cádiz" },
			}),
			match({
				id: 3,
				homeTeam: { id: 64, name: "Liverpool" },
				awayTeam: { id: 68, name: "Norwich City" },
			}),
			match({
				id: 4,
				homeTeam: { id: 61, name: "Chelsea" },
				awayTeam: { id: 65, name: "Manchester City" },
			}),
		];
		const out = filterBigMatches(fixtures);
		expect(out.map((m) => m.id)).toEqual([1, 4]);
	});

	it("returns empty array for empty input", () => {
		expect(filterBigMatches([])).toEqual([]);
	});
});

describe("filterTeamsByName", () => {
	const teams: Team[] = [
		{ id: 86, name: "Real Madrid", competition: "PD" },
		{ id: 81, name: "Barcelona", competition: "PD" },
		{ id: 81, name: "Barcelona", competition: "CL" },
		{ id: 64, name: "Liverpool", competition: "PL" },
	];

	it("returns all teams when query is empty", () => {
		expect(filterTeamsByName(teams, "")).toEqual(teams);
		expect(filterTeamsByName(teams, "   ")).toEqual(teams);
	});

	it("filters case-insensitively by substring", () => {
		expect(filterTeamsByName(teams, "mad").map((t) => t.name)).toEqual([
			"Real Madrid",
		]);
	});
	it("preserves duplicate entries across competitions", () => {
		expect(filterTeamsByName(teams, "barcelona")).toHaveLength(2);
	});
});

describe("filterOverviewMatches", () => {
	const globalIds = new Set([86, 81, 64]);

	it("falls back to mutual pairings when nothing is searched", () => {
		const fixtures = [
			match(), // Real Madrid vs Barcelona — both global -> keep
			match({
				id: 2,
				homeTeam: { id: 86, name: "Real Madrid" },
				awayTeam: { id: 63, name: "Cádiz" },
			}), // opponent not global -> drop
		];
		const out = filterOverviewMatches(fixtures, globalIds, new Set());
		expect(out.map((m) => m.id)).toEqual([1]);
	});

	it("with one search team keeps matches vs any global team", () => {
		const fixtures = [
			match({
				id: 1,
				homeTeam: { id: 63, name: "Cádiz" },
				awayTeam: { id: 86, name: "Real Madrid" },
			}), // searched team vs global -> keep
			match({
				id: 2,
				homeTeam: { id: 63, name: "Cádiz" },
				awayTeam: { id: 68, name: "Norwich City" },
			}), // opponent not global -> drop
			match({ id: 3 }), // no searched team -> drop
		];
		const out = filterOverviewMatches(fixtures, globalIds, new Set([63]));
		expect(out.map((m) => m.id)).toEqual([1]);
	});

	it("with two or more search teams keeps only mutual pairings", () => {
		const fixtures = [
			match({ id: 1 }), // 86 vs 81 — both searched -> keep
			match({
				id: 2,
				homeTeam: { id: 86, name: "Real Madrid" },
				awayTeam: { id: 64, name: "Liverpool" },
			}), // only one searched -> drop
		];
		const out = filterOverviewMatches(fixtures, globalIds, new Set([86, 81]));
		expect(out.map((m) => m.id)).toEqual([1]);
	});
});
