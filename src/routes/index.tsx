import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MatchList } from "../components/MatchList";
import {
	filterOverviewMatches,
	type Match,
	type Team,
} from "../lib/filterBigMatches";
import fixturesJson from "../lib/fixtures.json";
import { withinRange } from "../lib/matchTimes";
import { useSelection } from "../lib/useSelection";

const DAY_MS = 24 * 60 * 60 * 1000;

function isoLocal(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => {
		if (fixturesJson.teams.length === 0 || fixturesJson.matches.length === 0) {
			throw new Error(
				"App data missing — run `source .env && npm run data:gen` then restart.",
			);
		}
		return {
			matches: fixturesJson.matches as Match[],
			teams: fixturesJson.teams as Team[],
		};
	},
});

function Home() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const { selected, ready } = useSelection(teams);

	// Date range and selected-club filters; both apply live.
	const [open, setOpen] = useState(false);
	const [fromStr, setFromStr] = useState(() => isoLocal(new Date()));
	const [toStr, setToStr] = useState(() =>
		isoLocal(new Date(Date.now() + 30 * DAY_MS)),
	);
	const [query, setQuery] = useState("");
	const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

	const shownMatches = useMemo(() => {
		if (!ready) return [];
		const from = Date.parse(fromStr);
		const to = Date.parse(toStr) + DAY_MS - 1;
		if (Number.isNaN(from) || Number.isNaN(to) || to < from) return [];
		return filterOverviewMatches(
			fixtures,
			new Set(selected),
			new Set(selectedTeams),
		)
			.filter((m) => withinRange(m, from, to))
			.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
	}, [ready, fixtures, selected, selectedTeams, fromStr, toStr]);

	// Fuzzy team search over the selected big teams, deduped by id (a club
	// appears in the teams list once per competition).
	const candidates = useMemo(() => {
		const q = query.trim().toLowerCase();
		const seen = new Set<number>();
		const selectedSet = new Set(selected);
		const pool = q
			? teams.filter(
					(t) => selectedSet.has(t.id) && t.name.toLowerCase().includes(q),
				)
			: teams.filter((t) => selectedSet.has(t.id));
		return pool.filter((t) => {
			if (seen.has(t.id)) return false;
			seen.add(t.id);
			return true;
		});
	}, [query, teams, selected]);

	const toggleTeam = (id: number) =>
		setSelectedTeams((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);

	const reset = () => {
		setFromStr(isoLocal(new Date()));
		setToStr(isoLocal(new Date(Date.now() + 30 * DAY_MS)));
		setQuery("");
		setSelectedTeams([]);
	};

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
				<p style={{ color: "#666" }}>
					Select your big teams on the <Link to="/teams">Teams page</Link> —
					then narrow matches by date range and team search.
				</p>
			</section>

			<section style={{ position: "relative", marginBottom: "1.5rem" }}>
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
					style={{ cursor: "pointer" }}
				>
					Filters{selectedTeams.length > 0 ? ` (${selectedTeams.length})` : ""}
				</button>

				{open && (
					<div
						style={{
							marginTop: "0.4rem",
							padding: "0.75rem",
							border: "1px solid #ccc",
							borderRadius: 8,
							background: "#fff",
							boxShadow: "0 2px 8px rgba(0,0,0,.15)",
						}}
					>
						<div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
							<label style={{ fontSize: "0.9rem" }}>
								From{" "}
								<input
									type="date"
									value={fromStr}
									onChange={(e) => setFromStr(e.target.value)}
								/>
							</label>
							<label style={{ fontSize: "0.9rem" }}>
								To{" "}
								<input
									type="date"
									value={toStr}
									onChange={(e) => setToStr(e.target.value)}
								/>
							</label>
						</div>

						<input
							type="search"
							placeholder="Search teams…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							style={{ marginTop: "0.6rem", width: "100%" }}
						/>
						<ul
							style={{
								listStyle: "none",
								padding: 0,
								margin: "0.4rem 0",
								maxHeight: 200,
								overflowY: "auto",
								border: "1px solid #eee",
								borderRadius: 6,
							}}
						>
							{candidates.map((t) => {
								const checked = selectedTeams.includes(t.id);
								return (
									<li key={t.id}>
										<label
											style={{
												display: "flex",
												gap: "0.4rem",
												padding: "0.2rem 0.5rem",
											}}
										>
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleTeam(t.id)}
											/>
											{t.name}
										</label>
									</li>
								);
							})}
						</ul>

						<div
							style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
						>
							<button
								type="button"
								onClick={reset}
								style={{ cursor: "pointer" }}
							>
								Reset
							</button>
							<span style={{ fontSize: "0.85rem", color: "#666" }}>
								{selectedTeams.length === 0
									? "All selected big teams"
									: selectedTeams.length === 1
										? "1 club selected"
										: `${selectedTeams.length} clubs selected`}
							</span>
						</div>
					</div>
				)}
			</section>

			<section>
				<h2 style={{ fontSize: "1.1rem" }}>
					Fixtures {fromStr} → {toStr}
				</h2>
				{ready && shownMatches.length === 0 ? (
					<p>No fixtures match the current filters.</p>
				) : (
					<MatchList matches={shownMatches} />
				)}
			</section>
		</main>
	);
}
