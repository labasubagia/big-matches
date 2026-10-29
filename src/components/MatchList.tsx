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

function sameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

type MonthGroup = { label: string; note?: string; matches: Match[] };

// Group assumed-sorted matches by calendar month. The first/last group gets a
// "filtered from" / "filtered until" note when the range clips that month.
function groupByMonth(
	matches: Match[],
	rangeFrom?: Date,
	rangeTo?: Date,
): MonthGroup[] {
	const groups: MonthGroup[] = [];
	let lastKey = "";
	for (const m of matches) {
		const d = new Date(m.utcDate);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (key !== lastKey) {
			lastKey = key;
			let note: string | undefined;
			if (rangeFrom && sameMonth(d, rangeFrom) && rangeFrom.getDate() !== 1) {
				note = `filtered from ${fmtShortDate(rangeFrom)}`;
			}
			if (
				rangeTo &&
				sameMonth(d, rangeTo) &&
				rangeTo.getDate() !== lastDayOfMonth(rangeTo)
			) {
				note = note
					? `${note} · filtered until ${fmtShortDate(rangeTo)}`
					: `filtered until ${fmtShortDate(rangeTo)}`;
			}
			groups.push({
				label: d.toLocaleDateString("en-GB", {
					month: "long",
					year: "numeric",
				}),
				note,
				matches: [m],
			});
		} else {
			groups[groups.length - 1].matches.push(m);
		}
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
			{groups.map((g) => (
				<section key={g.label}>
					<h3 className="mb-2 text-sm font-semibold text-muted-foreground">
						{g.label}
						{g.note ? ` · ${g.note}` : ""}
					</h3>
					<ul className="list-none p-0">
						{g.matches.map((m) => (
							<MatchRow key={m.id} m={m} />
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
