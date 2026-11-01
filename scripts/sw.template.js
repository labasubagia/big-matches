/* Workbox SW template — bundled by injectManifest into dist/client/sw.js.
   Loads the copied workbox runtime via importScripts (no bundler needed). */
importScripts(
	"./workbox-v7.4.1/workbox-core.prod.js",
	"./workbox-v7.4.1/workbox-routing.prod.js",
	"./workbox-v7.4.1/workbox-strategies.prod.js",
	"./workbox-v7.4.1/workbox-precaching.prod.js",
	"./workbox-v7.4.1/workbox-expiration.prod.js",
);

const { registerRoute } = workbox.routing;
const { CacheFirst } = workbox.strategies;
const { precacheAndRoute, matchPrecache } = workbox.precaching;
const { ExpirationPlugin } = workbox.expiration;

self.skipWaiting();
workbox.core.clientsClaim();

// Precache every route HTML shell (index, teams, faq).
precacheAndRoute(self.__WB_MANIFEST);

// Static assets: cache-first (content-addressed by build hash).
registerRoute(
	/\.(?:js|css|webp|png|json)$/,
	new CacheFirst({
		cacheName: "assets",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 80,
				maxAgeSeconds: 30 * 24 * 60 * 60,
			}),
		],
	}),
);

// Navigation: network-first; on failure fall back to the cached route shell,
// then root. Never serve a cross-route shell while online (that caused
// hydration mismatch #418). Mirrors the original hand-rolled handler.
const NAV_FALLBACK = "/big-matches/index.html";
registerRoute(
	({ request }) => request.mode === "navigate",
	async ({ request }) => {
		const url = new URL(request.url);
		try {
			const response = await fetch(request);
			if (response.ok) {
				const copy = response.clone();
				caches.open("navigation").then((cache) => cache.put(request, copy));
			}
			return response;
		} catch {
			const cache = await caches.open("navigation");
			const routeShell = `${url.href.replace(/\/?$/, "")}/index.html`;
			return (
				(await cache.match(request)) ||
				(await matchPrecache(routeShell)) ||
				(await matchPrecache(NAV_FALLBACK))
			);
		}
	},
);
