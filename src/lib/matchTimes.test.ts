import { describe, expect, it } from "vitest";
import type { Match } from "./filterBigMatches";
import {
	competitionLabel,
	fmtPhase,
	isTBD,
	localMidnightMs,
	matchBucket,
	teamCrests,
	withinRange,
} from "./matchTimes";

const NOW = Date.parse("2026-10-28T00:00:00Z");

function match(overrides: Partial<Match> = {}): Match {
	return {
		id: 1,
		utcDate: "2026-11-15T20:00:00Z",
		status: "TIMED",
		competition: { name: "Premier League", code: "PL" },
		homeTeam: { id: 86, name: "Real Madrid", crest: "crest-86" },
		awayTeam: { id: 81, name: "Barcelona", crest: "crest-81" },
		...overrides,
	};
}

describe("matchBucket", () => {
	it("classifies finished matches as past", () => {
		expect(matchBucket(match({ status: "FINISHED" }), NOW)).toBe("past");
	});

	it("classifies an unfinished passed-date match as near, not past", () => {
		expect(matchBucket(match({ utcDate: "2026-08-01T20:00:00Z" }), NOW)).toBe(
			"near",
		);
	});

	it("classifies live matches as past", () => {
		expect(matchBucket(match({ status: "LIVE" }), NOW)).toBe("past");
		expect(matchBucket(match({ status: "IN_PLAY" }), NOW)).toBe("past");
	});

	it("classifies terminal dead-status matches as past", () => {
		expect(matchBucket(match({ status: "POSTPONED" }), NOW)).toBe("past");
		expect(matchBucket(match({ status: "CANCELLED" }), NOW)).toBe("past");
		expect(matchBucket(match({ status: "SUSPENDED" }), NOW)).toBe("past");
	});

	it("classifies a match within 3 months as near", () => {
		expect(matchBucket(match(), NOW)).toBe("near");
	});

	it("classifies a match beyond 3 months as far", () => {
		expect(matchBucket(match({ utcDate: "2027-04-15T20:00:00Z" }), NOW)).toBe(
			"far",
		);
	});

	it("classifies a TBD scheduled match as far", () => {
		expect(
			matchBucket(
				match({ status: "SCHEDULED", utcDate: "2026-12-01T00:00:00Z" }),
				NOW,
			),
		).toBe("far");
	});
});

describe("withinRange", () => {
	it("keeps matches inside the range", () => {
		expect(withinRange(match(), NOW, NOW + 90 * 24 * 3600 * 1000)).toBe(true);
	});

	it("drops matches before the range", () => {
		expect(
			withinRange(
				match({ utcDate: "2026-09-01T20:00:00Z" }),
				NOW,
				NOW + 90 * 24 * 3600 * 1000,
			),
		).toBe(false);
	});

	it("drops matches after the range", () => {
		expect(
			withinRange(
				match({ utcDate: "2027-06-01T20:00:00Z" }),
				NOW,
				NOW + 90 * 24 * 3600 * 1000,
			),
		).toBe(false);
	});
});
describe("localMidnightMs", () => {
	it("returns local midnight in the configured timezone", () => {
		const prevTZ = process.env.TZ;
		process.env.TZ = "America/Los_Angeles";
		try {
			// PDT = UTC−7: local midnight lands on 07:00Z
			expect(localMidnightMs("2026-10-28")).toBe(
				Date.parse("2026-10-28T07:00:00Z"),
			);
		} finally {
			process.env.TZ = prevTZ;
		}
	});
});

describe("competitionLabel", () => {
	it("maps known codes to short labels", () => {
		expect(competitionLabel(match())).toBe("EPL");
		expect(
			competitionLabel(
				match({ competition: { name: "UEFA Champions League", code: "CL" } }),
			),
		).toBe("UCL");
	});

	it("falls back to the competition name for unknown codes", () => {
		expect(
			competitionLabel(match({ competition: { name: "FA Cup", code: "FAC" } })),
		).toBe("FA Cup");
	});
});

describe("isTBD", () => {
	it("flags only SCHEDULED matches with a midnight placeholder time", () => {
		expect(
			isTBD(match({ status: "SCHEDULED", utcDate: "2026-12-01T00:00:00Z" })),
		).toBe(true);
		expect(
			isTBD(
				match({ status: "SCHEDULED", utcDate: "2026-12-01T00:00:00.000Z" }),
			),
		).toBe(true);
		// A SCHEDULED match that already carries a real kickoff time is NOT
		// TBD — verified live: timed fixtures appear as TIMED in the API, but
		// a filtered SCHEDULED list can still return them, so status alone is
		// an insufficient signal.
		expect(
			isTBD(match({ status: "SCHEDULED", utcDate: "2026-12-01T19:30:00Z" })),
		).toBe(false);
		expect(isTBD(match())).toBe(false);
	});
});

describe("teamCrests", () => {
	it("collects one crest per team from the first occurrence", () => {
		const a = match();
		const b = match({
			id: 2,
			homeTeam: { id: 64, name: "Liverpool", crest: "crest-64" },
			awayTeam: { id: 86, name: "Real Madrid", crest: "crest-86" },
		});
		const map = teamCrests([a, b]);
		expect(map.get(86)).toBe("crest-86");
		expect(map.get(64)).toBe("crest-64");
		expect(map.has(999)).toBe(false);
	});
});

describe("fmtPhase", () => {
	it("labels league match by matchday", () => {
		expect(fmtPhase(match({ stage: "REGULAR_SEASON", matchday: 22 }))).toBe(
			"MD22",
		);
	});

	it("abbreviates fixed stages", () => {
		expect(fmtPhase(match({ stage: "SEMI_FINALS" }))).toBe("SF");
		expect(fmtPhase(match({ stage: "FINAL" }))).toBe("F");
		expect(fmtPhase(match({ stage: "QUARTER_FINALS" }))).toBe("QF");
		expect(fmtPhase(match({ stage: "THIRD_PLACE" }))).toBe("3P");
		expect(fmtPhase(match({ stage: "GROUP_STAGE" }))).toBe("GS");
	});

	it("derives round number from stage enum", () => {
		expect(fmtPhase(match({ stage: "LAST_16" }))).toBe("R16");
		expect(fmtPhase(match({ stage: "ROUND_3" }))).toBe("R3");
		expect(fmtPhase(match({ stage: "QUALIFICATION_ROUND_2" }))).toBe("Q2");
		expect(fmtPhase(match({ stage: "PLAYOFF_ROUND_1" }))).toBe("PO1");
		expect(fmtPhase(match({ stage: "PLAYOFF_ROUND_2" }))).toBe("PO2");
	});

	it("abbreviates playoffs without a round number", () => {
		expect(fmtPhase(match({ stage: "PLAYOFFS" }))).toBe("PO");
		expect(fmtPhase(match({ stage: "PLAYOFFS", matchday: 2 }))).toBe("PO2");
	});

	it("appends matchday when set on round stages", () => {
		expect(fmtPhase(match({ stage: "GROUP_STAGE", matchday: 3 }))).toBe("GS3");
	});

	it("labels matchday 0", () => {
		expect(fmtPhase(match({ stage: "REGULAR_SEASON", matchday: 0 }))).toBe(
			"MD0",
		);
	});
});
