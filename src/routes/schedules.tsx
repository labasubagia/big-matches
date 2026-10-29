import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MatchFilters } from "../components/MatchFilters";
import { BucketLegend, MatchList } from "../components/MatchList";
import { filterOverviewMatches } from "../lib/filterBigMatches";
import { loadFixtures } from "../lib/loadFixtures";
import { withinRange } from "../lib/matchTimes";
import { useMatchFilters } from "../lib/useMatchFilters";
import { useSelection } from "../lib/useSelection";

export const Route = createFileRoute("/schedules")({
	component: Schedules,
	loader: () => loadFixtures(),
});

function Schedules() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const { selected, ready } = useSelection(teams);
	const filters = useMatchFilters(teams, selected);

	const allMatches = useMemo(() => {
		const range = filters.range;
		if (!ready || !range) return [];
		return filterOverviewMatches(
			fixtures,
			new Set(selected),
			new Set(filters.selectedTeams),
		)
			.filter((m) => withinRange(m, range.from, range.to))
			.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
	}, [ready, fixtures, selected, filters.range, filters.selectedTeams]);

	return (
		<main className="mx-auto max-w-[760px] p-4 font-sans">
			<h1 className="mb-3 text-2xl font-semibold tracking-tight">
				All Big Matches
			</h1>
			<BucketLegend />
			<MatchFilters {...filters} />
			<h2 className="mb-3 text-[1.1rem]">
				Fixtures {filters.fromStr} → {filters.toStr}
			</h2>
			{ready && allMatches.length === 0 ? (
				<p>No fixtures match the current filters.</p>
			) : (
				<MatchList matches={allMatches} />
			)}
		</main>
	);
}
