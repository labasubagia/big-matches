import type { Match } from "../lib/filterBigMatches";
import {
	competitionLabel,
	fmtDate,
	fmtPhase,
	fmtShortDate,
	fmtStatus,
	isTBD,
	matchBucket,
} from "../lib/matchTimes";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";

function Crest({ url, name }: { url?: string; name: string }) {
	return (
		<Avatar className="size-[22px]">
			{url ? <AvatarImage src={url} alt={name} /> : null}
			<AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
				{name[0]}
			</AvatarFallback>
		</Avatar>
	);
}

function MatchRow({ m }: { m: Match }) {
	const past = matchBucket(m) === "past";
	const tbd = isTBD(m);
	const { fullTime, winner } = m.score ?? {};
	const phase = fmtPhase(m);
	const homeScore = fullTime?.home;
	const awayScore = fullTime?.away;
	const homeWon = winner === "HOME_TEAM";
	const awayWon = winner === "AWAY_TEAM";
	const homeScoreClass = cn("font-semibold", homeWon && "text-winner");
	const awayScoreClass = cn("font-semibold", awayWon && "text-winner");

	return (
		<li>
			<Card
				className={cn(
					"mb-1.5 rounded-md shadow-none",
					past ? "bg-muted" : "bg-card",
				)}
			>
				<CardContent className="flex items-center gap-2 p-2.5">
					<Crest url={m.homeTeam.crest} name={m.homeTeam.name} />
					<span>{m.homeTeam.name}</span>
					{homeScore != null && (
						<span className={homeScoreClass}>{homeScore}</span>
					)}
					<span className="opacity-55">v</span>
					{awayScore != null && (
						<span className={awayScoreClass}>{awayScore}</span>
					)}
					<span>{m.awayTeam.name}</span>
					<Crest url={m.awayTeam.crest} name={m.awayTeam.name} />
					<span className="ml-auto flex items-center gap-2">
						<span
							className={cn(
								"text-[0.85em]",
								tbd ? "text-winner" : "opacity-85",
							)}
						>
							<span>
								{competitionLabel(m)}
								{phase ? ` · ${phase}` : ""} · {fmtDate(m)} {fmtStatus(m)}
							</span>
						</span>
					</span>
				</CardContent>
			</Card>
		</li>
	);
}

function lastDayOfMonth(d: Date): number {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

type MonthGroup = { label: string; note?: string; matches: Match[] };

// Group matches into month buckets in any input order. The first/last group
// gets a "filtered from" / "filtered until" note when the corresponding range
// endpoint clips its month (regardless of whether that clipped month has any
// matches of its own).
export function groupByMonth(
	matches: Match[],
	rangeFrom?: Date,
	rangeTo?: Date,
): MonthGroup[] {
	const byKey = new Map<string, MonthGroup>();
	for (const m of matches) {
		const d = new Date(m.utcDate);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		let g = byKey.get(key);
		if (!g) {
			g = {
				label: d.toLocaleDateString("en-GB", {
					month: "long",
					year: "numeric",
				}),
				matches: [],
			};
			byKey.set(key, g);
		}
		g.matches.push(m);
	}
	const groups = [...byKey.values()];
	const first = groups[0];
	if (first && rangeFrom && rangeFrom.getDate() !== 1) {
		first.note = `filtered from ${fmtShortDate(rangeFrom)}`;
	}
	const last = groups[groups.length - 1];
	if (last && rangeTo && rangeTo.getDate() !== lastDayOfMonth(rangeTo)) {
		const note = `filtered until ${fmtShortDate(rangeTo)}`;
		last.note = last.note ? `${last.note} · ${note}` : note;
	}
	return groups;
}

export function MatchList({
	matches,
	rangeFrom,
	rangeTo,
}: {
	matches: Match[];
	rangeFrom?: Date;
	rangeTo?: Date;
}) {
	if (matches.length === 0) return null;
	const groups = groupByMonth(matches, rangeFrom, rangeTo);
	return (
		<div className="space-y-5">
			{groups.map((g, i) => (
				<section key={g.label}>
					<h2 className="mb-2 text-lg font-semibold tracking-tight">
						{g.label}
						{g.note ? (
							<span className="ml-2 text-sm font-semibold tracking-wide text-muted-foreground">
								{g.note}
							</span>
						) : null}
					</h2>
					<ul className="list-none p-0">
						{g.matches.map((m) => (
							<MatchRow key={m.id} m={m} />
						))}
					</ul>
					{i < groups.length - 1 ? <hr className="my-4 border-border" /> : null}
				</section>
			))}
		</div>
	);
}
