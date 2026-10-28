import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { Team } from "../lib/filterBigMatches";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type TeamComboboxProps = {
	candidates: Team[];
	selectedTeams: number[];
	toggleTeam: (id: number) => void;
	query: string;
	setQuery: (value: string) => void;
};

export function TeamCombobox({
	candidates,
	selectedTeams,
	toggleTeam,
	query,
	setQuery,
}: TeamComboboxProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{selectedTeams.length === 0
						? "All clubs"
						: `${selectedTeams.length} club${selectedTeams.length > 1 ? "s" : ""} selected`}
					<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search clubs…"
						value={query}
						onValueChange={setQuery}
					/>
					<CommandList>
						<CommandEmpty>No clubs found.</CommandEmpty>
						<CommandGroup>
							{candidates.map((team) => {
								const checked = selectedTeams.includes(team.id);
								return (
									<CommandItem
										key={team.id}
										value={String(team.id)}
										onSelect={() => toggleTeam(team.id)}
									>
										<span
											className={cn(
												"mr-2 flex size-4 items-center justify-center rounded-sm border",
												checked
													? "border-primary bg-primary text-primary-foreground"
													: "border-input",
											)}
										>
											{checked && <Check className="size-3" />}
										</span>
										{team.name}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
