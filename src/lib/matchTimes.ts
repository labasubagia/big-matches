import type { Match } from "./filterBigMatches";

// Bucket a match for the schedules page: past (happened), near (within 3
// months), or far (beyond 3 months, or kickoff time not set yet).
export type MatchBucket = "past" | "near" | "far";

const MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export function isTBD(m: Match): boolean {
	return m.status === "SCHEDULED" && m.utcDate.includes("T00:00:00Z");
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

// True for future matches within the next `months` months (excludes past).
export function futureWithinMonths(
	m: Match,
	now: number = Date.now(),
	months = 3,
): boolean {
	const t = new Date(m.utcDate).getTime();
	return t >= now && t <= now + months * 30 * 24 * 60 * 60 * 1000;
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
