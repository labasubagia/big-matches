import { Check } from "lucide-react";
import type { Team } from "../lib/filterBigMatches";
import { crestUrl } from "../lib/matchTimes";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";

type TeamComboboxContentProps = {
	candidates: Team[];
	selectedTeams: number[];
	toggleTeam: (id: number) => void;
	query: string;
	setQuery: (value: string) => void;
	crests: Map<number, string>;
};

export default function TeamComboboxContent({
	candidates,
	selectedTeams,
	toggleTeam,
	query,
	setQuery,
	crests,
}: TeamComboboxContentProps) {
	return (
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
										{crest ? (
											<AvatarImage src={crestUrl(crest)} alt="" />
										) : null}
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
	);
}
