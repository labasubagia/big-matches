import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
		<main className="mx-auto max-w-[760px] p-4 font-sans">
			<h1 className="text-2xl font-semibold tracking-tight">
				Select Big Teams
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Click a team to add or remove it. Only matches between two selected
				teams are shown.
			</p>
			<div className="my-4 grid gap-1.5">
				<p className="text-sm font-semibold text-muted-foreground">
					{ready ? `${selected.length} teams selected` : "Loading…"}
				</p>
				<Input
					type="text"
					placeholder="Search all clubs…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="w-full"
				/>
			</div>

			{groups.map((g, i) => (
				<section key={g.name} className="mb-5">
					<h2 className="mb-2 text-lg font-semibold tracking-tight">
						{groupLabel(g.name)}
					</h2>
					<ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-1.5 p-0">
						{g.teams.map((t) => {
							const isSelected = selected.includes(t.id);
							return (
								<li key={t.id}>
									<Button
										variant="ghost"
										onClick={() => toggle(t.id)}
										aria-pressed={isSelected}
										className={`w-full justify-start gap-2 px-2 text-left text-[0.9rem] min-h-12 ${
											isSelected
												? "border-2 border-orange-500 bg-background hover:enabled:bg-background"
												: "border border-input bg-background hover:border-orange-500 hover:enabled:bg-background"
										}`}
									>
										{(() => {
											const crest = crests.get(t.id);
											return (
												<Avatar className="size-6">
													{crest ? <AvatarImage src={crest} alt="" /> : null}
													<AvatarFallback className="bg-muted text-[11px] text-muted-foreground">
														{t.name[0]}
													</AvatarFallback>
												</Avatar>
											);
										})()}
										<span>{t.name}</span>
									</Button>
								</li>
							);
						})}
					</ul>
					{i < groups.length - 1 ? <hr className="my-4 border-border" /> : null}
				</section>
			))}
		</main>
	);
}
