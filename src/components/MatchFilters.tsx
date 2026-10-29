import type { MatchFilterState } from "../lib/useMatchFilters";
import { DateRangePicker } from "./date-range-picker";
import { TeamCombobox } from "./team-combobox";
import { Button } from "./ui/button";
export function MatchFilters(f: MatchFilterState) {
	return (
		<section className="mb-6">
			<div className="grid gap-3 rounded-lg border border-border bg-card p-3">
				<h2 className="text-sm font-semibold text-muted-foreground">Filters</h2>
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
					<span
						className="text-sm text-muted-foreground"
						data-testid="selected-count"
					>
						{f.selectedTeams.length === 0
							? "All selected big teams"
							: f.selectedTeams.length === 1
								? "1 club selected"
								: `${f.selectedTeams.length} clubs selected`}
					</span>
				</div>
			</div>
		</section>
	);
}
