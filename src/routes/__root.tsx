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
		<nav className="border-b border-border font-sans md:mx-auto md:w-full md:max-w-[760px]">
			<div className="flex w-full items-center gap-2 px-4 py-3">
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
			<Footer />
		</RootDocument>
	);
}

const githubUrl =
	import.meta.env.VITE_GITHUB_URL ||
	"https://github.com/labasubagia/big-matches";

function Footer() {
	return (
		<footer className="mt-auto border-t border-border py-4 font-sans md:mx-auto md:w-full md:max-w-[760px]">
			<div className="flex w-full items-center gap-4 px-4 text-sm text-muted-foreground">
				<span>© {new Date().getFullYear()} Big Matches</span>
				<a
					href={githubUrl}
					className="underline hover:text-foreground"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</div>
		</footer>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-screen flex-col">
				{children}
				<Scripts />
			</body>
		</html>
	);
}
