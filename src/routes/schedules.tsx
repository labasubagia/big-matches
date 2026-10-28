import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BucketLegend, MatchList } from "../components/MatchList";
import {
	filterBigMatches,
	type Match,
	type Team,
} from "../lib/filterBigMatches";
import fixturesJson from "../lib/fixtures.json";
import { useSelection } from "../lib/useSelection";

export const Route = createFileRoute("/schedules")({
	component: Schedules,
	loader: () => ({
		matches: fixturesJson.matches as Match[],
		teams: fixturesJson.teams as Team[],
	}),
});

function Schedules() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const { selected, ready } = useSelection(teams);

	const allMatches = useMemo(() => {
		if (!ready) return [];
		return filterBigMatches(fixtures, new Set(selected)).sort((a, b) =>
			a.utcDate.localeCompare(b.utcDate),
		);
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
			<h1>All Big Matches</h1>
			<BucketLegend />
			{ready && allMatches.length === 0 ? (
				<p>No mutual-pairing fixtures for the selected teams.</p>
			) : (
				<MatchList matches={allMatches} />
			)}
		</main>
	);
}
