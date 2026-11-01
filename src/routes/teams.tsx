import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { SITE_URL } from "../config/site";

export const Route = createFileRoute("/teams")({
	head: () => ({
		meta: [
			{ title: "Select Teams | Big Matches" },
			{
				name: "description",
				content:
					"Choose your big teams from UCL, EPL, La Liga, Serie A, Bundesliga and Ligue 1 to build mutual fixture pairings.",
			},
		],
		links: [
			{
				rel: "canonical",
				href: `${SITE_URL}/teams`,
			},
		],
	}),
	component: lazyRouteComponent(() => import("./-teams.component"), "default"),
});
