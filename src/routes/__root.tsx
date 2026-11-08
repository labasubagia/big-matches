import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTheme } from "../lib/useTheme";
import "../styles.css";
import { SITE_URL } from "../config/site";

const navLinkClass =
	"rounded-md px-2.5 py-1 text-inherit [text-decoration-line:none]";
const activeNavLinkClass = `${navLinkClass} bg-muted`;

function Nav() {
	const { theme, toggle } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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
				<button
					type="button"
					aria-label={
						mounted
							? theme === "dark"
								? "Switch to light mode"
								: "Switch to dark mode"
							: "Toggle color theme"
					}
					className="ml-auto cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-foreground"
					onClick={toggle}
				>
					{mounted ? (
						theme === "dark" ? (
							<Sun className="size-4" />
						) : (
							<Moon className="size-4" />
						)
					) : (
						<span className="size-4" />
					)}
				</button>
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
			{ name: "referrer", content: "no-referrer" },
			{
				httpEquiv: "Content-Security-Policy",
				content:
					"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'",
			},
		],
		links: [
			{ rel: "manifest", href: "/big-matches/manifest.webmanifest" },
			{ rel: "icon", href: "/big-matches/icon-192.png" },
			{ rel: "apple-touch-icon", href: "/big-matches/icon-192.png" },
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: "Big Matches",
					url: `${SITE_URL}/`,
					description:
						"Football fixtures between selected teams, filtered by date range and club, from the Football-Data.org free plan.",
				}),
			},
			{
				children:
					'try{var t=localStorage.getItem("big-matches-theme");' +
					'if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";' +
					'document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}',
			},
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

const githubUrl = import.meta.env.VITE_GITHUB_URL;

function Footer() {
	return (
		<footer className="mt-auto border-t border-border py-4 font-sans md:mx-auto md:w-full md:max-w-[760px]">
			<div className="flex w-full items-center gap-4 px-4 text-sm text-muted-foreground">
				<span>© {new Date().getFullYear()} Big Matches</span>
				{githubUrl && (
					<a
						href={githubUrl}
						className="underline hover:text-foreground"
						target="_blank"
						rel="noreferrer"
					>
						GitHub
					</a>
				)}
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
