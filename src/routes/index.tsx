import { createFileRoute, Link } from "@tanstack/react-router";
import { MatchFilters } from "../components/MatchFilters";
import { MatchList } from "../components/MatchList";
import { loadFixturesOrThrow } from "../lib/loadFixtures";
import { useFilteredMatches } from "../lib/useFilteredMatches";
import { useMatchFilters } from "../lib/useMatchFilters";
import { useSelection } from "../lib/useSelection";

export const Route = createFileRoute("/")({
	component: Home,
	loader: loadFixturesOrThrow,
});

function isoToDate(iso: string): Date | undefined {
	return /^\d{4}-\d{2}-\d{2}$/.test(iso)
		? new Date(`${iso}T00:00:00`)
		: undefined;
}
function Home() {
	const { matches: fixtures, teams } = Route.useLoaderData();
	const { selected, ready } = useSelection(teams);
	const filters = useMatchFilters(teams, selected, fixtures);

	const shownMatches = useFilteredMatches(fixtures, selected, ready, filters);

	return (
		<main className="mx-auto w-full max-w-[760px] p-4 font-sans">
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
				{ready && shownMatches.length === 0 ? (
					<p>No fixtures match the current filters.</p>
				) : (
					<MatchList
						matches={shownMatches}
						rangeFrom={isoToDate(filters.fromStr)}
						rangeTo={isoToDate(filters.toStr)}
					/>
				)}
			</section>
		</main>
	);
}
