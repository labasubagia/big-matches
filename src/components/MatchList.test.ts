import { describe, expect, it } from "vitest";
import type { Match } from "../lib/filterBigMatches";
import { groupByMonth } from "./MatchList";

// utcDate strings are UTC; pin to UTC so month labels are deterministic.
process.env.TZ = "UTC";

function m(utcDate: string, overrides: Partial<Match> = {}): Match {
	return {
		id: Math.floor(Math.random() * 1e9),
		utcDate,
		status: "TIMED",
		competition: { name: "Premier League", code: "PL" },
		homeTeam: { id: 86, name: "Real Madrid", crest: "" },
		awayTeam: { id: 81, name: "Barcelona", crest: "" },
		...overrides,
	};
}
const tbd = (date: string) => m(date, { status: "SCHEDULED" });

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
	it("does not put the until note on a trailing TBD-only group", () => {
		const groups = groupByMonth(
			[m("2026-11-10T20:00:00Z"), tbd("2027-12-31T00:00:00Z")],
			undefined,
			new Date(2027, 0, 23), // 23 January 2027
		);
		expect(groups.map((g) => g.label)).toEqual([
			"November 2026",
			"December 2027",
		]);
		expect(groups[0].note).toBe("until 23/01/2027");
		expect(groups[1].note).toBeUndefined();
	});

	it("keeps the note on a group mixing an in-range match and a TBD row", () => {
		const groups = groupByMonth(
			[tbd("2027-12-31T00:00:00Z"), m("2027-12-10T20:00:00Z")],
			undefined,
			new Date(2027, 11, 23), // 23 December 2027
		);
		expect(groups).toHaveLength(1);
		expect(groups[0].note).toBe("until 23/12/2027");
	});

	it("suppresses both notes when every visible match is TBD", () => {
		const groups = groupByMonth(
			[tbd("2027-12-31T00:00:00Z")],
			new Date(2027, 0, 15),
			new Date(2027, 0, 23),
		);
		expect(groups).toHaveLength(1);
		expect(groups[0].note).toBeUndefined();
	});
});
