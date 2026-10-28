import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

const navLinkStyle: React.CSSProperties = {
	color: "inherit",
	textDecoration: "none",
	padding: "0.25rem 0.6rem",
	borderRadius: 6,
};

function Nav() {
	return (
		<nav
			style={{
				display: "flex",
				gap: "0.5rem",
				padding: "0.75rem 1rem",
				borderBottom: "1px solid #e0e0e0",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<Link
				to="/"
				style={navLinkStyle}
				activeOptions={{ exact: true }}
				activeProps={{ style: { ...navLinkStyle, background: "#eee" } }}
			>
				Overview
			</Link>
			<Link
				to="/teams"
				style={navLinkStyle}
				activeProps={{ style: { ...navLinkStyle, background: "#eee" } }}
			>
				Teams
			</Link>
			<Link
				to="/schedules"
				style={navLinkStyle}
				activeProps={{ style: { ...navLinkStyle, background: "#eee" } }}
			>
				Schedules
			</Link>
		</nav>
	);
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Big Matches" },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
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
