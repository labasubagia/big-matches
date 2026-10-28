import type { MatchFilterState } from "../lib/useMatchFilters";
import { DateRangePicker } from "./date-range-picker";
import { TeamCombobox } from "./team-combobox";
import { Button } from "./ui/button";

export function MatchFilters(f: MatchFilterState) {
	return (
		<section className="relative mb-6">
			<Button
				variant="outline"
				onClick={() => f.setOpen((o) => !o)}
				aria-expanded={f.open}
			>
				Filters
				{f.selectedTeams.length > 0 ? ` (${f.selectedTeams.length})` : ""}
			</Button>

			{f.open && (
				<div className="mt-1.5 grid gap-3 rounded-lg border border-neutral-300 bg-white p-3 shadow-md">
					<DateRangePicker
						fromStr={f.fromStr}
						toStr={f.toStr}
						onFromChange={f.setFromStr}
						onToChange={f.setToStr}
					/>
					<TeamCombobox
						candidates={f.candidates}
						selectedTeams={f.selectedTeams}
						toggleTeam={f.toggleTeam}
						query={f.query}
						setQuery={f.setQuery}
					/>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={f.reset}>
							Reset
						</Button>
						<span className="text-[0.85rem] text-muted-foreground">
							{f.selectedTeams.length === 0
								? "All selected big teams"
								: f.selectedTeams.length === 1
									? "1 club selected"
									: `${f.selectedTeams.length} clubs selected`}
						</span>
					</div>
				</div>
			)}
		</section>
	);
}
