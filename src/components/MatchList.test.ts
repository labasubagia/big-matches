import { describe, expect, it } from "vitest";
import type { Match } from "../lib/filterBigMatches";
import { groupByMonth } from "./MatchList";

// utcDate strings are UTC; pin to UTC so month labels are deterministic.
process.env.TZ = "UTC";

function m(utcDate: string): Match {
	return {
		id: Math.floor(Math.random() * 1e9),
		utcDate,
		status: "TIMED",
		competition: { name: "Premier League", code: "PL" },
		homeTeam: { id: 86, name: "Real Madrid", crest: "" },
		awayTeam: { id: 81, name: "Barcelona", crest: "" },
	};
}

describe("groupByMonth", () => {
	it("groups matches by month regardless of input order", () => {
		const groups = groupByMonth([
			m("2026-11-15T20:00:00Z"),
			m("2026-10-29T20:00:00Z"),
			m("2026-11-02T20:00:00Z"),
		]);
		expect(groups.map((g) => g.label)).toEqual([
			"November 2026",
			"October 2026",
		]);
		expect(groups[0].matches).toHaveLength(2);
		expect(groups[1].matches).toHaveLength(1);
	});

	it("annotates the first group when the range start clips an earlier month", () => {
		const groups = groupByMonth(
			[m("2026-04-05T20:00:00Z")],
			new Date(2026, 2, 15), // 15 March 2026
		);
		expect(groups[0].note).toBe("from 15/03/2026");
	});

	it("annotates the last group when the range end clips a later month", () => {
		const groups = groupByMonth(
			[m("2026-12-10T20:00:00Z")],
			undefined,
			new Date(2027, 0, 23), // 23 January 2027
		);
		expect(groups[0].note).toBe("until 23/01/2027");
	});

	it("omits notes when the range spans full months", () => {
		const groups = groupByMonth(
			[m("2026-10-20T20:00:00Z"), m("2026-11-05T20:00:00Z")],
			new Date(2026, 9, 1),
			new Date(2026, 10, 30),
		);
		expect(groups.every((g) => g.note === undefined)).toBe(true);
	});

	it("combines both notes on a single clipped month", () => {
		const groups = groupByMonth(
			[m("2026-10-20T20:00:00Z")],
			new Date(2026, 9, 29),
			new Date(2026, 9, 23),
		);
		expect(groups[0].note).toBe("from 29/10/2026 . until 23/10/2026");
	});
});
