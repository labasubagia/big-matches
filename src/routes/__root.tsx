import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import "../styles.css";

const navLinkClass =
	"rounded-md px-2.5 py-1 text-inherit [text-decoration-line:none]";
const activeNavLinkClass = `${navLinkClass} bg-muted`;

function Nav() {
	return (
		<nav className="border-b border-border font-sans">
			<div className="mx-auto flex w-full max-w-[760px] gap-2 px-4 py-3">
				<Link
					to="/"
					className={navLinkClass}
					activeOptions={{ exact: true }}
					activeProps={{ className: activeNavLinkClass }}
				>
					Schedules
				</Link>
				<Link
					to="/teams"
					className={navLinkClass}
					activeProps={{ className: activeNavLinkClass }}
				>
					Teams
				</Link>
				<Link
					to="/faq"
					className={navLinkClass}
					activeProps={{ className: activeNavLinkClass }}
				>
					FAQ
				</Link>
			</div>
		</nav>
	);
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#0f172a" },
			{ title: "Big Matches" },
		],
		links: [
			{ rel: "manifest", href: "/big-matches/manifest.webmanifest" },
			{ rel: "apple-touch-icon", href: "/big-matches/icon-192.png" },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	useEffect(() => {
		if (!import.meta.env.PROD) return;
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
	}, []);

	return (
		<RootDocument>
			<Nav />
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
