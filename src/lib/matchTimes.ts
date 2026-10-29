import type { Match } from "./filterBigMatches";

// Bucket a match: past (happened), near (within 3 months), or far (beyond 3
// months, or kickoff time not set yet).
export type MatchBucket = "past" | "near" | "far";

const MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export function isTBD(m: Match): boolean {
	// Verified against the live v4 API: a fixture whose kickoff time is still
	// undecided is stored with a midnight placeholder (`utcDate` …T00:00:00Z)
	// under status SCHEDULED; once date+time are set it flips to TIMED with a
	// real time. The zero-time marker is the reliable discriminator — status
	// alone is not (a filtered SCHEDULED list can include timed fixtures).
	if (m.status !== "SCHEDULED") return false;
	const d = new Date(m.utcDate);
	return (
		d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0
	);
}

export function matchBucket(m: Match, now: number = Date.now()): MatchBucket {
	const kickoff = new Date(m.utcDate).getTime();
	// Anything not an upcoming fixture: finished, in-play (incl. halftime),
	// or terminal (postponed/cancelled/suspended). A cancelled/postponed match
	// at a past date is a historical entry, not an upcoming one; the row still
	// prints the raw status so it's not mistaken for a played result.
	if (
		m.status === "FINISHED" ||
		m.status === "LIVE" ||
		m.status === "IN_PLAY" ||
		m.status === "PAUSED" ||
		m.status === "POSTPONED" ||
		m.status === "CANCELLED" ||
		m.status === "SUSPENDED"
	) {
		return "past";
	}
	if (isTBD(m) || kickoff > now + MONTHS_MS) {
		return "far";
	}
	return "near";
}

// True when the match kickoff falls within the inclusive range [from, to].
export function withinRange(m: Match, from: number, to: number): boolean {
	const t = new Date(m.utcDate).getTime();
	return t >= from && t <= to;
}

// Epoch ms at local midnight for a `YYYY-MM-DD` date string. Date-only
// strings parse as UTC, so build the datetime form to get local semantics.
export function localMidnightMs(isoDate: string): number {
	return new Date(`${isoDate}T00:00:00`).getTime();
}

const COMPETITION_LABELS: Record<string, string> = {
	PL: "EPL",
	PD: "La Liga",
	SA: "Serie A",
	BL1: "Bundesliga",
	FL1: "Ligue 1",
	CL: "UCL",
};

export function competitionLabel(m: Match): string {
	const code = m.competition.code;
	if (code && COMPETITION_LABELS[code]) return COMPETITION_LABELS[code];
	return m.competition.name;
}
const STAGE_PREFIXES: Record<string, string> = {
	FINAL: "F",
	THIRD_PLACE: "3P",
	SEMI_FINALS: "SF",
	QUARTER_FINALS: "QF",
	LAST_16: "R",
	LAST_32: "R",
	LAST_64: "R",
	ROUND_4: "R",
	ROUND_3: "R",
	ROUND_2: "R",
	ROUND_1: "R",
	GROUP_STAGE: "GS",
	PRELIMINARY_ROUND: "PR",
	QUALIFICATION: "Q",
	QUALIFICATION_ROUND_1: "Q",
	QUALIFICATION_ROUND_2: "Q",
	QUALIFICATION_ROUND_3: "Q",
	PLAYOFF_ROUND_1: "PO",
	PLAYOFF_ROUND_2: "PO",
	PLAYOFFS: "PO",
};

// Trailing number baked into a stage enum, e.g. "LAST_16" → 16,
// "ROUND_3" → 3, "QUALIFICATION_ROUND_2" → 2, "PLAYOFF_ROUND_1" → 1.
function stageNumber(stage: string): number | null {
	const m = stage.match(/(\d+)$/);
	return m ? Number(m[1]) : null;
}

// Short phase label: round stages get an abbreviation + a number. The number
// comes from the match's matchday when set (GROUP_STAGE matchday 3 → GS3),
// otherwise from the stage enum (LAST_16 → R16). League stages fall back to
// MD<matchday> (matchday 22 → MD22).
export function fmtPhase(m: Match): string | null {
	const stage = m.stage ?? "";
	const prefix = STAGE_PREFIXES[stage];
	if (!prefix) {
		if (m.matchday != null) return `MD${m.matchday}`;
		return null;
	}
	const n = m.matchday != null ? m.matchday : stageNumber(stage);
	return n != null ? `${prefix}${n}` : prefix;
}

// Map team id -> crest URL from the first match each team appears in.
export function teamCrests(matches: Match[]): Map<number, string> {
	const crests = new Map<number, string>();
	for (const m of matches) {
		if (!crests.has(m.homeTeam.id) && m.homeTeam.crest) {
			crests.set(m.homeTeam.id, m.homeTeam.crest);
		}
		if (!crests.has(m.awayTeam.id) && m.awayTeam.crest) {
			crests.set(m.awayTeam.id, m.awayTeam.crest);
		}
	}
	return crests;
}

// Fixed DD/MM/YYYY display (en-GB 24h), independent of user locale.
export function fmtShortDate(d: Date): string {
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function fmtDate(m: Match): string {
	const tbd = isTBD(m);
	const d = new Date(m.utcDate);
	const date = fmtShortDate(d);
	if (tbd) return `${date} (time TBD)`;
	const time = d.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${date} ${time}`;
}

export function fmtStatus(m: Match): string {
	switch (m.status) {
		case "FINISHED":
			return "FT";
		case "LIVE":
		case "IN_PLAY":
			return "Live";
		case "PAUSED":
			return "HT";
		case "SCHEDULED":
		case "TIMED":
			return "";
		default:
			return m.status;
	}
}
