import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SELECTED_IDS } from "../config/teams";
import {
	filterBigMatches,
	type Match,
	type Team,
} from "../lib/filterBigMatches";
import fixturesJson from "../lib/fixtures.json";

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => ({
		matches: fixturesJson.matches as Match[],
		teams: fixturesJson.teams as Team[],
	}),
});

const STORAGE_KEY = "big-matches-selected";

function readSavedSelection(validIds: ReadonlySet<number>): number[] {
	if (typeof window === "undefined") return DEFAULT_SELECTED_IDS;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_SELECTED_IDS;
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			const ids = parsed.filter(
				(n): n is number => typeof n === "number" && validIds.has(n),
			);
			if (ids.length > 0) return ids;
		}
	} catch {
		// fall through to default
	}
	return DEFAULT_SELECTED_IDS;
}

function writeSelection(ids: number[]) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// storage unavailable; ignore
	}
}

function fmtDate(m: Match): string {
	const tbd = m.status === "SCHEDULED" && m.utcDate.includes("T00:00:00Z");
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

function fmtStatus(m: Match): string {
	switch (m.status) {
		case "FINISHED":
			return "FT";
		case "LIVE":
		case "IN_PLAY":
			return "Live";
		case "PAUSED":
			return "HT";
		case "SCHEDULED":
			return "";
		default:
			return m.status;
	}
}

function Home() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const [selected, setSelected] = useState<number[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setSelected(readSavedSelection(new Set(teams.map((t) => t.id))));
		setReady(true);
	}, [teams]);

	// Warn if a selected team never appears in any fetched match (bad id).
	useEffect(() => {
		if (!ready) return;
		const seen = new Set<number>();
		for (const m of fixtures) {
			seen.add(m.homeTeam.id);
			seen.add(m.awayTeam.id);
		}
		const missing = selected.filter((id) => !seen.has(id));
		if (missing.length > 0) {
			console.warn(
				`[big-matches] selected teams never appeared in fetched fixtures (check team ids): ${missing.join(", ")}`,
			);
		}
	}, [ready, selected, fixtures]);

	const matches = useMemo(
		() => (ready ? filterBigMatches(fixtures, new Set(selected)) : []),
		[ready, fixtures, selected],
	);

	const competitions = useMemo(
		() => [...new Set(teams.map((t) => t.competition))],
		[teams],
	);

	function toggle(id: number) {
		setSelected((prev) => {
			const next = prev.includes(id)
				? prev.filter((x) => x !== id)
				: [...prev, id];
			writeSelection(next);
			return next;
		});
	}

	const byCompetition = new Map<string, Match[]>();
	for (const m of matches) {
		const list = byCompetition.get(m.competition.name) ?? [];
		list.push(m);
		byCompetition.set(m.competition.name, list);
	}

	return (
		<main
			style={{
				fontFamily: "system-ui, sans-serif",
				maxWidth: 760,
				margin: "0 auto",
				padding: "1rem",
			}}
		>
			<h1>Big Matches</h1>

			<section style={{ marginBottom: "1.5rem" }}>
				<h2 style={{ fontSize: "1rem" }}>Select teams</h2>
				<form
					style={{
						border: "1px solid #ddd",
						borderRadius: 8,
						padding: "0.75rem",
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
						gap: "0.75rem",
					}}
				>
					{competitions.map((competition) => (
						<fieldset
							key={competition}
							style={{ border: "none", padding: 0, margin: 0 }}
						>
							<legend style={{ fontWeight: 600, padding: 0 }}>
								{competition}
							</legend>
							{teams
								.filter((t) => t.competition === competition)
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((t) => (
									<label
										key={t.id}
										style={{
											display: "block",
											padding: "0.1rem 0",
											cursor: "pointer",
										}}
									>
										<input
											type="checkbox"
											checked={selected.includes(t.id)}
											onChange={() => toggle(t.id)}
										/>{" "}
										{t.name}
									</label>
								))}
						</fieldset>
					))}
				</form>
			</section>

			{ready && matches.length === 0 ? (
				<p>No mutual-pairing fixtures for the selected teams right now.</p>
			) : (
				[...byCompetition.entries()].map(([name, list]) => (
					<section key={name} style={{ marginBottom: "1.5rem" }}>
						<h2 style={{ fontSize: "1.1rem" }}>{name}</h2>
						<ul style={{ listStyle: "none", padding: 0 }}>
							{list.map((m) => (
								<li
									key={m.id}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "0.4rem 0",
										borderBottom: "1px solid #eee",
									}}
								>
									<span>
										{m.homeTeam.name} vs {m.awayTeam.name}
									</span>
									<span style={{ color: "#666" }}>
										{fmtDate(m)} {fmtStatus(m)}
									</span>
								</li>
							))}
						</ul>
					</section>
				))
			)}
		</main>
	);
}
