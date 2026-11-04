import { ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import type { Team } from "../lib/filterBigMatches";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const TeamComboboxContent = React.lazy(() => import("./team-combobox-content"));

type TeamComboboxProps = {
	onReset: () => void;
	candidates: Team[];
	selectedTeams: number[];
	toggleTeam: (id: number) => void;
	query: string;
	setQuery: (value: string) => void;
	crests: Map<number, string>;
};

export function TeamCombobox({
	onReset,
	candidates,
	selectedTeams,
	toggleTeam,
	query,
	setQuery,
	crests,
}: TeamComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const label =
		selectedTeams.length === 0
			? "Filter big clubs"
			: `${selectedTeams.length} club${selectedTeams.length > 1 ? "s" : ""} selected`;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<div className="relative">
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-haspopup="listbox"
						aria-label={label}
						className="w-full justify-between"
					>
						{label}
						{selectedTeams.length === 0 && (
							<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
						)}
					</Button>
				</PopoverTrigger>
				{selectedTeams.length > 0 && (
					<button
						type="button"
						aria-label="Reset club filter"
						onClick={(e) => {
							e.stopPropagation();
							onReset();
						}}
						className="absolute right-4 top-1/2 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<X className="size-4" />
					</button>
				)}
			</div>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
				<React.Suspense
					fallback={
						<div className="p-4 text-sm text-muted-foreground">
							Loading clubs…
						</div>
					}
				>
					<TeamComboboxContent
						candidates={candidates}
						selectedTeams={selectedTeams}
						toggleTeam={toggleTeam}
						query={query}
						setQuery={setQuery}
						crests={crests}
					/>
				</React.Suspense>
			</PopoverContent>
		</Popover>
	);
}
