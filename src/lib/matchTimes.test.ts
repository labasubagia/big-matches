import { describe, expect, it } from "vitest";
import type { Match } from "./filterBigMatches";
import {
	competitionLabel,
	isTBD,
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

	it("classifies a passed date as past even if not finished", () => {
		expect(matchBucket(match({ utcDate: "2026-08-01T20:00:00Z" }), NOW)).toBe(
			"past",
		);
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
	it("flags scheduled matches with midnight kickoff", () => {
		expect(
			isTBD(match({ status: "SCHEDULED", utcDate: "2026-12-01T00:00:00Z" })),
		).toBe(true);
		expect(
			isTBD(
				match({ status: "SCHEDULED", utcDate: "2026-12-01T00:00:00.000Z" }),
			),
		).toBe(true);
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
