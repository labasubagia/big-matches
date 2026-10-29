import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function NotFound() {
	return <p className="p-8 font-sans">Page not found</p>;
}

export function getRouter() {
	const router = createRouter({
		routeTree,
		basepath: "/big-matches/",
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultNotFoundComponent: NotFound,
	});
	return router;
}
