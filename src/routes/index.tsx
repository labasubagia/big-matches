import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { SITE_URL } from "../config/site";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Big Matches | Football Fixtures Between Selected Teams" },
			{
				name: "description",
				content:
					"Upcoming football fixtures played only between the teams you select, filterable by date range and club. Data from the Football-Data.org free plan.",
			},
		],
		links: [
			{
				rel: "canonical",
				href: `${SITE_URL}/`,
			},
		],
	}),
	component: lazyRouteComponent(() => import("./-index.component"), "default"),
});
