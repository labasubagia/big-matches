import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFixtures } from "./build-fixtures.ts";

const NOW = Date.parse("2026-10-28T00:00:00Z");
const DAY_MS = 86_400_000;

afterEach(() => {
	vi.restoreAllMocks();
});

const team = (id: number, competition: string) => ({
	id,
	name: `Team ${id}`,
	competition,
});

describe("buildFixtures", () => {
	it("sets defaultSelectedIds to the sorted UCL ∩ top-5 intersection", () => {
		const r = buildFixtures({
			teams: [
				team(61, "Premier League"),
				team(61, "UEFA Champions League"),
				team(108, "Serie A"),
				team(108, "UEFA Champions League"),
				team(86, "UEFA Champions League"),
				team(57, "Premier League"),
				team(5, "Bundesliga"),
			],
			matches: [],
		});
		expect(r.defaultSelectedIds).toEqual([61, 108]);
	});

	it("passes matches without a day offset through unchanged", () => {
		const m = { id: 101, status: "FINISHED" };
		const r = buildFixtures({ teams: [], matches: [m] });
		expect(r.matches).toEqual([m]);
	});

	it("rewrites utcDate from the day offset", () => {
		vi.spyOn(Date, "now").mockReturnValue(NOW);
		const [match] = buildFixtures({
			teams: [],
			matches: [{ id: 102, __dayOffset: 3, utcDate: "ignored" }],
		}).matches;
		expect(match.utcDate).toBe(new Date(NOW + 3 * DAY_MS).toISOString());
		expect(match).not.toHaveProperty("__dayOffset");
	});

	it("forces TBD matches to midnight UTC", () => {
		vi.spyOn(Date, "now").mockReturnValue(NOW);
		const [match] = buildFixtures({
			teams: [],
			matches: [{ id: 103, __dayOffset: 0, __tbd: true, utcDate: "ignored" }],
		}).matches;
		expect(match.utcDate).toBe("2026-10-28T00:00:00.000Z");
	});
});
