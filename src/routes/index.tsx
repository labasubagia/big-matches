import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MatchFilters } from "../components/MatchFilters";
import { MatchList } from "../components/MatchList";
import { filterOverviewMatches } from "../lib/filterBigMatches";
import { loadFixtures } from "../lib/loadFixtures";
import { withinRange } from "../lib/matchTimes";
import { useMatchFilters } from "../lib/useMatchFilters";
import { useSelection } from "../lib/useSelection";

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => {
		const fixtures = loadFixtures();
		if (fixtures.teams.length === 0 || fixtures.matches.length === 0) {
			throw new Error(
				"App data missing — run `source .env && npm run data:gen` then restart.",
			);
		}
		return fixtures;
	},
});

function Home() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const { selected, ready } = useSelection(teams);
	const filters = useMatchFilters(teams, selected, fixtures);

	const shownMatches = useMemo(() => {
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
			<h1 className="text-2xl font-semibold tracking-tight">Big Matches</h1>

			<section className="mb-6">
				<p className="mt-1 text-sm text-muted-foreground">
					Select your big teams on the{" "}
					<Link
						to="/teams"
						className="font-medium underline underline-offset-2 hover:text-primary"
					>
						Teams page
					</Link>{" "}
					— then narrow matches by date range and team search.
				</p>
			</section>

			<MatchFilters {...filters} />

			<section>
				<h2 className="mb-3 text-[1.1rem]">
					Fixtures {filters.fromStr} → {filters.toStr}
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
