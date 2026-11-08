import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "big-matches-theme";

function initialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	let stored: string | null = null;
	try {
		stored = window.localStorage.getItem(STORAGE_KEY);
	} catch {
		// Ignore storage errors; fall back to system preference.
	}
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function setStoredTheme(t: Theme) {
	try {
		window.localStorage.setItem(STORAGE_KEY, t);
	} catch {
		// Ignore storage failures; the theme still applies for this session.
	}
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(initialTheme);

	const applyToDom = useCallback((t: Theme) => {
		document.documentElement.classList.toggle("dark", t === "dark");
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute("content", t === "dark" ? "#0f172a" : "#ffffff");
	}, []);

	useEffect(() => {
		applyToDom(theme);
	}, [applyToDom, theme]);

	const toggle = useCallback(() => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyToDom(next);
		setStoredTheme(next);
	}, [theme, applyToDom]);

	return { theme, toggle };
}
