import { describe, expect, it } from "vitest";
import {
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

describe("filterTeamsByName", () => {
	const teams: Team[] = [
		{ id: 86, name: "Real Madrid", competition: "PD" },
		{ id: 81, name: "Barcelona", competition: "PD" },
		{ id: 81, name: "Barcelona", competition: "CL" },
		{ id: 64, name: "Liverpool", competition: "PL" },
		{ id: 57, name: "Arsenal", competition: "PL" },
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

	it("matches near-miss typos", () => {
		expect(filterTeamsByName(teams, "asenal").map((t) => t.name)).toEqual([
			"Arsenal",
		]);
	});

	it("matches diacritic-stripped queries", () => {
		const local = [
			...teams,
			{ id: 5, name: "FC Bayern München", competition: "BL" },
		];
		expect(filterTeamsByName(local, "munchen").map((t) => t.name)).toEqual([
			"FC Bayern München",
		]);
	});

	it("does not match unrelated names", () => {
		expect(filterTeamsByName(teams, "jupiter")).toEqual([]);
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
