import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/big-matches/",
	build: {},
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
