// FAQ content about the football-data.org free plan and how Big Matches uses
// its data. Pure data, separated from the UI so it can be unit-tested without a
// DOM.

export interface FaqEntry {
	question: string;
	answer: string;
	// Optional bullets rendered as a list under the answer.
	items?: readonly string[];
	// Optional closing note rendered after the list (when present).
	footer?: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
	{
		question: "Is Big Matches free?",
		answer:
			"Yes — Big Matches is completely free to use. Because it is free, the competitions and matches it can show are limited: the site relies on the free tier of its data provider.",
	},
	{
		question:
			"Why do I only see the Champions League and top-five league teams?",
		answer:
			"Only the top five European leagues — Premier League, La Liga, Serie A, Bundesliga, and Ligue 1 — plus the UEFA Champions League are included. A club from another league, such as the Eredivisie, Primeira Liga, or Süper Lig, appears only when it has qualified for the Champions League.",
	},
	{
		question: "Why don't I see UEFA Europa League matches?",
		answer:
			"The Europa League is only available through a paid subscription to our data provider's service. Since Big Matches uses the free plan, matches from these competitions cannot be shown.",
	},
	{
		question: "Why are domestic league cups missing?",
		answer:
			"Cup competitions such as the English Football League Cup and other domestic league cups are only available through a paid subscription to our data provider's service. Because Big Matches uses the free plan, these are not included.",
	},
	{
		question: "Is my team selection saved across devices?",
		answer: "No — your team selection is stored only in this browser.",
		items: [
			"Each device or browser keeps its own selection.",
			"New devices start with the default teams.",
			"There is no account sign-in or cloud sync.",
		],
	},
	{
		question: "Is the match data live?",
		answer:
			"No — match and team information is a snapshot that is refreshed automatically from our data provider.",
		items: [
			"Fixtures refresh daily.",
			"Team rosters refresh weekly.",
			"Scores reflect the latest build, not real-time.",
		],
	},
	{
		question: "Can I get reminders or notifications for matches?",
		answer:
			"Not yet — Big Matches does not send reminders or notifications. This may change in the future.",
	},
];
