import type { Match } from "../lib/filterBigMatches";
import {
	competitionLabel,
	fmtDate,
	fmtStatus,
	type MatchBucket,
	matchBucket,
} from "../lib/matchTimes";

const BUCKET_STYLE: Record<MatchBucket, { background: string; color: string }> =
	{
		past: { background: "#9e9e9e", color: "#fff" },
		near: { background: "#ffffff", color: "#111" },
		far: { background: "#d0d0d0", color: "#111" },
	};

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

function Score({ m }: { m: Match }) {
	const { fullTime, winner } = m.score ?? {};
	if (fullTime?.home == null || fullTime.away == null) return null;
	const homeWon = winner === "HOME_TEAM";
	const awayWon = winner === "AWAY_TEAM";
	return (
		<span>
			<span
				style={homeWon ? { color: WINNER_COLOR, fontWeight: 600 } : undefined}
			>
				{fullTime.home}
			</span>
			{" - "}
			<span
				style={awayWon ? { color: WINNER_COLOR, fontWeight: 600 } : undefined}
			>
				{fullTime.away}
			</span>
		</span>
	);
}

function MatchRow({ m }: { m: Match }) {
	const bucket = matchBucket(m);
	const style = { ...rowStyle, ...BUCKET_STYLE[bucket] };
	return (
		<li style={style}>
			<Crest url={m.homeTeam.crest} name={m.homeTeam.name} />
			<span>{m.homeTeam.name}</span>
			<span style={{ opacity: 0.55 }}>v</span>
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
				<Score m={m} />
				<span style={{ fontSize: "0.85em", opacity: 0.85 }}>
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
	const items: Array<[MatchBucket, string]> = [
		["past", "Played"],
		["near", "Next 3 months"],
		["far", "Later or time TBD"],
	];
	return (
		<div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
			{items.map(([bucket, label]) => (
				<span
					key={bucket}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.35rem",
					}}
				>
					<span
						style={{
							width: 14,
							height: 14,
							border: "1px solid #ccc",
							borderRadius: 3,
							background: BUCKET_STYLE[bucket].background,
							display: "inline-block",
						}}
					/>
					{label}
				</span>
			))}
		</div>
	);
}
