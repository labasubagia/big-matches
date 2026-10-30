import { createFileRoute } from "@tanstack/react-router";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../components/ui/accordion";
import { FAQ_ENTRIES } from "../lib/faqContent";

export const Route = createFileRoute("/faq")({
	component: Faq,
});

function Faq() {
	return (
		<main className="mx-auto w-full max-w-[760px] p-4 font-sans">
			<h1 className="text-2xl font-semibold tracking-tight">FAQ</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				What Big Matches can show depends on the football-data.org free plan.
			</p>
			<Accordion type="multiple" className="mt-6">
				{FAQ_ENTRIES.map((entry) => (
					<AccordionItem key={entry.question} value={entry.question}>
						<AccordionTrigger>{entry.question}</AccordionTrigger>
						<AccordionContent>
							<p>{entry.answer}</p>
							{entry.items && entry.items.length > 0 ? (
								<ul className="mt-1 ml-5 list-disc">
									{entry.items.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							) : null}
							{entry.footer ? <p>{entry.footer}</p> : null}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</main>
	);
}
