import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

function isoLocal(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DateRangePickerProps = {
	fromStr: string;
	toStr: string;
	onFromChange: (value: string) => void;
	onToChange: (value: string) => void;
};

function toDate(iso: string): Date | undefined {
	return /^\d{4}-\d{2}-\d{2}$/.test(iso)
		? new Date(`${iso}T00:00:00`)
		: undefined;
}

export function DateRangePicker({
	fromStr,
	toStr,
	onFromChange,
	onToChange,
}: DateRangePickerProps) {
	const [open, setOpen] = React.useState(false);
	const from = toDate(fromStr);
	const to = toDate(toStr);
	const selected = from || to ? { from, to } : undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"justify-start text-left font-normal",
						!selected && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="size-4" />
					{selected?.from
						? selected.to
							? `${format(selected.from, "LLL dd, y")} – ${format(selected.to, "LLL dd, y")}`
							: format(selected.from, "LLL dd, y")
						: "Pick a date range"}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					selected={selected}
					defaultMonth={from}
					onSelect={(range) => {
						if (!range) return;
						if (range.from) onFromChange(isoLocal(range.from));
						if (range.to) onToChange(isoLocal(range.to));
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
