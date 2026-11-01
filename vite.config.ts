import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/big-matches/",
	build: {
		// Emit ?url assets as real files, never inline data: URLs. The fixtures
		// fallback is tiny; inlined it would be fetched as a data: URL, which the
		// app's CSP (connect-src 'self') blocks, crashing the page.
		assetsInlineLimit: 0,
	},
	server: {
		port: 3000,
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		tanstackStart({
			prerender: {
				enabled: true,
				failOnError: true,
			},
		}),
		viteReact(),
		tailwindcss(),
	],
});
