import { describe, expect, it } from "vitest";
import { resolveTeams } from "./resolve-teams.ts";

const team = (id: number, name: string) => ({
	id,
	name,
	competition: "test",
});

describe("resolveTeams", () => {
	it("uses fresh teams when the refresh yielded any", () => {
		const fresh = [team(1, "A")];
		const r = resolveTeams(fresh, null, "footballdata");
		expect(r.teams).toEqual(fresh);
		expect(r.warned).toBe(false);
	});

	it("falls back to the previous roster silently within the same provider", () => {
		const prev = { provider: "footballdata", teams: [team(57, "Arsenal")] };
		const r = resolveTeams([], prev, "footballdata");
		expect(r.warned).toBe(false);
		expect(r.teams).toEqual(prev.teams);
	});

	it("flags a cross-provider fallback (regression: thesportsdb teams + football-data matches)", () => {
		const prev = {
			provider: "thesportsdb",
			teams: [
				{ id: 133604, name: "Arsenal", competition: "English Premier League" },
			],
		};
		const r = resolveTeams([], prev, "footballdata");
		expect(r.warned).toBe(true);
		expect(r.teams).toEqual(prev.teams);
	});

	it("yields empty with no warning when there was no previous roster", () => {
		const r = resolveTeams([], null, "footballdata");
		expect(r.teams).toEqual([]);
		expect(r.warned).toBe(false);
	});

	it("flags a fallback when competition codes changed (regression: old-code roster + new-code matches)", () => {
		const prev = {
			provider: "footballdata",
			codes: ["PL"],
			teams: [team(57, "Arsenal")],
		};
		const r = resolveTeams([], prev, "footballdata", ["PD"]);
		expect(r.warned).toBe(true);
		expect(r.teams).toEqual(prev.teams);
	});
});
