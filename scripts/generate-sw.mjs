import { resolve } from "node:path";
import { generateSW } from "workbox-build";

const clientDir = resolve("dist/client");

const { count, size, warnings } = await generateSW({
	globDirectory: clientDir,
	globPatterns: ["**/*.html"],
	swDest: resolve(clientDir, "sw.js"),
	skipWaiting: true,
	clientsClaim: true,
	runtimeCaching: [
		// Navigation must be network-first: the prerendered per-route shell is
		// the source of truth while online. Serving a cached cross-route shell
		// (e.g. root HTML for /faq) causes a hydration mismatch (#418). Only
		// fall back to the cache when offline.
		{
			urlPattern: ({ request }) => request.mode === "navigate",
			handler: "NetworkFirst",
			options: {
				cacheName: "navigation",
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 16,
					maxAgeSeconds: 30 * 24 * 60 * 60,
				},
			},
		},
		{
			urlPattern: /\.(?:js|css|webp|png|json)$/,
			handler: "CacheFirst",
			options: {
				cacheName: "assets",
				expiration: {
					maxEntries: 80,
					maxAgeSeconds: 30 * 24 * 60 * 60,
				},
			},
		},
	],
});

if (warnings.length) console.warn("[workbox] warnings:", warnings);
console.log(
	`[workbox] generated sw.js with ${count} precached files (${(size / 1024).toFixed(1)} KiB)`,
);
