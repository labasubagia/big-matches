import type { Match } from "./filterBigMatches";

// Bucket a match for the schedules page: past (happened), near (within 3
// months), or far (beyond 3 months, or kickoff time not set yet).
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
	if (m.status === "FINISHED" || new Date(m.utcDate).getTime() < now) {
		return "past";
	}
	if (isTBD(m) || new Date(m.utcDate).getTime() > now + MONTHS_MS) {
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
const STAGE_LABELS: Record<string, string> = {
	FINAL: "F",
	THIRD_PLACE: "3P",
	SEMI_FINALS: "SF",
	QUARTER_FINALS: "QF",
	LAST_16: "R16",
	LAST_32: "R32",
	LAST_64: "R64",
	ROUND_4: "R4",
	ROUND_3: "R3",
	ROUND_2: "R2",
	ROUND_1: "R1",
	GROUP_STAGE: "GS",
	PRELIMINARY_ROUND: "PR",
	QUALIFICATION: "Q",
	QUALIFICATION_ROUND_1: "Q1",
	QUALIFICATION_ROUND_2: "Q2",
	QUALIFICATION_ROUND_3: "Q3",
	PLAYOFF_ROUND_1: "PO1",
	PLAYOFF_ROUND_2: "PO2",
	PLAYOFFS: "PO",
};

// Short phase label: knockout/cup rounds get an abbreviation
// (SEMI_FINALS → SF), league stages by matchday (matchday 22 → MD22).
export function fmtPhase(m: Match): string | null {
	const stage = STAGE_LABELS[m.stage ?? ""];
	if (stage) return stage;
	if (m.matchday != null) return `MD${m.matchday}`;
	return null;
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

export function fmtDate(m: Match): string {
	const tbd = isTBD(m);
	const date = new Date(m.utcDate).toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	if (tbd) return `${date} (time TBD)`;
	const time = new Date(m.utcDate).toLocaleTimeString(undefined, {
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
