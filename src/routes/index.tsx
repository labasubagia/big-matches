import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MatchList } from "../components/MatchList";
import {
	filterBigMatches,
	type Match,
	type Team,
} from "../lib/filterBigMatches";
import fixturesJson from "../lib/fixtures.json";
import { futureWithinMonths } from "../lib/matchTimes";
import { useSelection } from "../lib/useSelection";

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

	const upcomingMatches = useMemo(() => {
		if (!ready) return [];
		return filterBigMatches(fixtures, new Set(selected))
			.filter((m) => futureWithinMonths(m))
			.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
	}, [ready, fixtures, selected]);

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
					only matches between two selected teams are shown.
				</p>
			</section>

			<section>
				<h2 style={{ fontSize: "1.1rem" }}>Next 3 months</h2>
				{ready && upcomingMatches.length === 0 ? (
					<p>No upcoming mutual-pairing fixtures in the next 3 months.</p>
				) : (
					<MatchList matches={upcomingMatches} />
				)}
			</section>
		</main>
	);
}
