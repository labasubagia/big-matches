import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { injectManifest } from "workbox-build";

const clientDir = resolve("dist/client");
const runtimeDir = resolve(clientDir, "workbox-v7.4.1");
const runtimeLibs = [
	"workbox-core.prod.js",
	"workbox-routing.prod.js",
	"workbox-strategies.prod.js",
	"workbox-precaching.prod.js",
	"workbox-expiration.prod.js",
];

// Copy the workbox runtime libs that the importScripts template loads.
mkdirSync(runtimeDir, { recursive: true });
for (const lib of runtimeLibs) {
	copyFileSync(
		resolve(
			`node_modules/workbox-${lib.replace(/^workbox-(.+)\.prod\.js$/, "$1")}/build`,
			lib,
		),
		resolve(runtimeDir, lib),
	);
}

const { count, size, warnings } = await injectManifest({
	globDirectory: clientDir,
	globPatterns: ["**/*.{html,js,css,json}"],
	maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
	swSrc: resolve("scripts/sw.template.js"),
	swDest: resolve(clientDir, "sw.js"),
});

if (warnings.length) console.warn("[workbox] warnings:", warnings);
console.log(
	`[workbox] injected service worker with ${count} precached files (${(size / 1024).toFixed(1)} KiB)`,
);
