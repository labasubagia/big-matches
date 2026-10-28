import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Team } from "../lib/filterBigMatches";
import { loadFixtures } from "../lib/loadFixtures";
import { teamCrests } from "../lib/matchTimes";
import { useSelection } from "../lib/useSelection";
import { useTeamSearch } from "../lib/useTeamSearch";

export const Route = createFileRoute("/teams")({
	component: Teams,
	loader: () => loadFixtures(),
});

// Canonical competition order and short labels, matching the requested
// sequence (UCL, EPL, La Liga, Serie A, Bundesliga, Ligue 1).
const COMPETITION_ORDER: Array<{ label: string; test: RegExp }> = [
	{ label: "UCL", test: /Champions League|UEFA/i },
	{ label: "EPL", test: /Premier|EPL/i },
	{ label: "La Liga", test: /Primera|La Liga/i },
	{ label: "Serie A", test: /Serie A/i },
	{ label: "Bundesliga", test: /Bundesliga/i },
	{ label: "Ligue 1", test: /Ligue 1/i },
];

function groupIndex(name: string): number {
	const i = COMPETITION_ORDER.findIndex((g) => g.test.test(name));
	return i === -1 ? COMPETITION_ORDER.length : i;
}

function groupLabel(name: string): string {
	const g = COMPETITION_ORDER.find((x) => x.test.test(name));
	return g ? g.label : name;
}

function Teams() {
	const { matches, teams } = Route.useLoaderData();
	const { selected, ready, toggle } = useSelection(teams);
	const { query, setQuery, candidates } = useTeamSearch(teams);
	const crests = useMemo(() => teamCrests(matches), [matches]);

	const groups = useMemo(() => {
		const map = new Map<string, Team[]>();
		for (const t of candidates) {
			const list = map.get(t.competition);
			if (list) list.push(t);
			else map.set(t.competition, [t]);
		}
		return [...map.entries()]
			.map(([name, list]) => ({
				name,
				teams: list.sort((a, b) => a.name.localeCompare(b.name)),
			}))
			.sort(
				(a, b) =>
					groupIndex(a.name) - groupIndex(b.name) ||
					a.name.localeCompare(b.name),
			);
	}, [candidates]);

	return (
		<main
			style={{
				fontFamily: "system-ui, sans-serif",
				maxWidth: 760,
				margin: "0 auto",
				padding: "1rem",
			}}
		>
			<h1>Select Big Teams</h1>
			<p style={{ color: "#666" }}>
				Click a team to add or remove it. Only matches between two selected
				teams are shown.
			</p>
			<p style={{ color: "#666", fontSize: "0.85rem" }}>
				{ready ? `${selected.length} teams selected` : "Loading…"}
			</p>

			<input
				type="search"
				placeholder="Search all clubs…"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				style={{ width: "100%", marginBottom: "1rem", padding: "0.3rem" }}
			/>

			{groups.map((g) => (
				<section key={g.name} style={{ marginBottom: "1.25rem" }}>
					<h2 style={{ fontSize: "1rem" }}>{groupLabel(g.name)}</h2>
					<ul
						style={{
							listStyle: "none",
							padding: 0,
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
							gap: "0.4rem",
						}}
					>
						{g.teams.map((t) => {
							const isSelected = selected.includes(t.id);
							return (
								<li key={t.id}>
									<button
										type="button"
										onClick={() => toggle(t.id)}
										aria-pressed={isSelected}
										style={{
											width: "100%",
											display: "flex",
											alignItems: "center",
											gap: "0.4rem",
											padding: "0.4rem",
											border: `1px solid ${isSelected ? "#e8a44d" : "#ccc"}`,
											borderRadius: 6,
											background: isSelected ? "#ffd9a0" : "#fff",
											cursor: "pointer",
											fontSize: "0.9rem",
											textAlign: "left",
											minHeight: "3rem",
										}}
									>
										{crests.get(t.id) ? (
											<img
												src={crests.get(t.id)}
												alt=""
												width={24}
												height={24}
											/>
										) : (
											<span
												style={{
													width: 24,
													height: 24,
													borderRadius: "50%",
													background: "#bbb",
													color: "#fff",
													fontSize: 11,
													display: "inline-flex",
													alignItems: "center",
													justifyContent: "center",
													flexShrink: 0,
												}}
											>
												{t.name[0]}
											</span>
										)}
										<span>{t.name}</span>
									</button>
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</main>
	);
}
