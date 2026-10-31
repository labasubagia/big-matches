import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import type { Team } from "../lib/filterBigMatches";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					aria-haspopup="listbox"
					className="w-full justify-between"
				>
					{selectedTeams.length === 0
						? "Filter big clubs"
						: `${selectedTeams.length} club${selectedTeams.length > 1 ? "s" : ""} selected`}
					{selectedTeams.length > 0 ? (
						// biome-ignore lint/a11y/useSemanticElements: real <button> cannot nest inside the trigger <button>; span intercepts clicks without opening the popover.
						<span
							role="button"
							tabIndex={0}
							className="ml-2 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onReset();
							}}
							onPointerDown={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									e.stopPropagation();
									onReset();
								}
							}}
						>
							<X className="size-4" />
						</span>
					) : (
						<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
					)}
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
							{[...candidates]
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((team) => {
									const checked = selectedTeams.includes(team.id);
									const crest = crests.get(team.id);
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
											<Avatar className="size-5">
												{crest ? <AvatarImage src={crest} alt="" /> : null}
												<AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
													{team.name[0]}
												</AvatarFallback>
											</Avatar>
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
