import type { Match } from "../lib/filterBigMatches";
import {
	competitionLabel,
	fmtDate,
	fmtStatus,
	isTBD,
	matchBucket,
} from "../lib/matchTimes";

const PAST_BG = "#f0f0f0";

const WINNER_COLOR = "#e8620c";

const rowStyle = {
	display: "flex",
	alignItems: "center",
	gap: "0.5rem",
	padding: "0.45rem 0.6rem",
	border: "1px solid #e0e0e0",
	borderRadius: 6,
	marginBottom: "0.4rem",
} as const;

function Crest({ url, name }: { url?: string; name: string }) {
	if (!url) {
		return (
			<span
				style={{
					width: 22,
					height: 22,
					borderRadius: "50%",
					background: "#bbb",
					color: "#fff",
					fontSize: 10,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{name[0]}
			</span>
		);
	}
	return (
		<img
			src={url}
			alt={name}
			width={22}
			height={22}
			style={{ borderRadius: "50%" }}
		/>
	);
}

function MatchRow({ m }: { m: Match }) {
	const past = matchBucket(m) === "past";
	const tbd = isTBD(m);
	const { fullTime, winner } = m.score ?? {};
	const homeScore = fullTime?.home;
	const awayScore = fullTime?.away;
	const homeWon = winner === "HOME_TEAM";
	const awayWon = winner === "AWAY_TEAM";
	const scoreStyle = (won: boolean) =>
		won ? { color: WINNER_COLOR, fontWeight: 600 } : { fontWeight: 600 };
	const style = {
		...rowStyle,
		background: past ? PAST_BG : "#ffffff",
		color: "#111",
	};
	return (
		<li style={style}>
			<Crest url={m.homeTeam.crest} name={m.homeTeam.name} />
			<span>{m.homeTeam.name}</span>
			{homeScore != null && (
				<span style={scoreStyle(homeWon)}>{homeScore}</span>
			)}
			<span style={{ opacity: 0.55 }}>v</span>
			{awayScore != null && (
				<span style={scoreStyle(awayWon)}>{awayScore}</span>
			)}
			<span>{m.awayTeam.name}</span>
			<Crest url={m.awayTeam.crest} name={m.awayTeam.name} />
			<span
				style={{
					marginLeft: "auto",
					display: "flex",
					alignItems: "center",
					gap: "0.5rem",
				}}
			>
				<span
					style={{
						fontSize: "0.85em",
						opacity: tbd ? 1 : 0.85,
						color: tbd ? WINNER_COLOR : undefined,
					}}
				>
					{competitionLabel(m)} · {fmtDate(m)} {fmtStatus(m)}
				</span>
			</span>
		</li>
	);
}

export function MatchList({ matches }: { matches: Match[] }) {
	if (matches.length === 0) return null;
	return (
		<ul style={{ listStyle: "none", padding: 0 }}>
			{matches.map((m) => (
				<MatchRow key={m.id} m={m} />
			))}
		</ul>
	);
}

export function BucketLegend() {
	return (
		<div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
			<span
				style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
			>
				<span
					style={{
						width: 14,
						height: 14,
						border: "1px solid #ccc",
						borderRadius: 3,
						background: PAST_BG,
						display: "inline-block",
					}}
				/>
				Played
			</span>
			<span
				style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
			>
				<span
					style={{
						width: 14,
						height: 14,
						border: "1px solid #ccc",
						borderRadius: 3,
						background: "#ffffff",
						display: "inline-block",
					}}
				/>
				Upcoming
			</span>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: "0.35rem",
					color: WINNER_COLOR,
				}}
			>
				• Time TBD
			</span>
		</div>
	);
}
