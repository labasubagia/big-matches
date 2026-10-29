import type { Match } from "../lib/filterBigMatches";
import {
	competitionLabel,
	fmtDate,
	fmtPhase,
	fmtStatus,
	isTBD,
	matchBucket,
} from "../lib/matchTimes";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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

export function MatchList({ matches }: { matches: Match[] }) {
	if (matches.length === 0) return null;
	return (
		<ul className="list-none p-0">
			{matches.map((m) => (
				<MatchRow key={m.id} m={m} />
			))}
		</ul>
	);
}

export function BucketLegend() {
	return (
		<div className="mb-4 flex gap-3">
			<Badge variant="secondary">Played</Badge>
			<Badge variant="outline">Upcoming</Badge>
			<Badge variant="winner">• Time TBD</Badge>
		</div>
	);
}
