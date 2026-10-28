import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { FAQ_ENTRIES } from "../lib/faqContent";

export const Route = createFileRoute("/faq")({
	component: Faq,
});

const detailsStyle: CSSProperties = {
	borderTop: "1px solid #e0e0e0",
	padding: "0.75rem 0",
};

const summaryStyle: CSSProperties = {
	cursor: "pointer",
	fontWeight: 600,
};

function Faq() {
	return (
		<main
			style={{
				fontFamily: "system-ui, sans-serif",
				maxWidth: 760,
				margin: "0 auto",
				padding: "1rem",
			}}
		>
			<h1>FAQ</h1>
			<p style={{ color: "#666" }}>
				What Big Matches can show depends on the football-data.org free plan.
			</p>
			{FAQ_ENTRIES.map((entry) => (
				<details key={entry.question} style={detailsStyle}>
					<summary style={summaryStyle}>{entry.question}</summary>
					<p>{entry.answer}</p>
					{entry.items && entry.items.length > 0 ? (
						<ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
							{entry.items.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					) : null}
					{entry.footer ? <p>{entry.footer}</p> : null}
				</details>
			))}
		</main>
	);
}
