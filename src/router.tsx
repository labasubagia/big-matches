import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function NotFound() {
	return (
		<p style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
			Page not found
		</p>
	);
}

export function getRouter() {
	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultNotFoundComponent: NotFound,
	});
	return router;
}
