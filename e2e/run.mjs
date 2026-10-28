import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { buildFixtures } from "./build-fixtures.mjs";

function waitFor(port, path, timeoutMs = 60_000) {
	const start = Date.now();
	return new Promise((resolve, reject) => {
		const tryOnce = () => {
			if (Date.now() - start > timeoutMs) {
				reject(
					new Error(`timed out waiting for http://127.0.0.1:${port}${path}`),
				);
				return;
			}
			const req = http.request({ host: "127.0.0.1", port, path }, (res) => {
				res.resume();
				if (res.statusCode >= 200 && res.statusCode < 400) resolve();
				else setTimeout(tryOnce, 300);
			});
			req.on("error", () => setTimeout(tryOnce, 300));
			req.end();
		};
		tryOnce();
	});
}

const MOCK_FIXTURES = new URL("./fixtures.mock.json", import.meta.url);
// Test-scoped mock fixtures; the real src/lib/fixtures.json is never touched.
const MOCK_OUT = new URL("../src/lib/fixtures.mock.json", import.meta.url);

let dev;
try {
	const template = JSON.parse(fs.readFileSync(MOCK_FIXTURES, "utf8"));
	fs.writeFileSync(MOCK_OUT, JSON.stringify(buildFixtures(template), null, 2));

	// VITE_FIXTURES=mock makes the app load fixtures.mock.json (see
	// src/lib/loadFixtures.ts); mode stays "development" so TanStack dev routing works.
	dev = spawn(
		"npm",
		["run", "dev", "--", "--port", "3100", "--host", "127.0.0.1"],
		{
			shell: true,
			detached: true,
			stdio: ["ignore", "inherit", "inherit"],
			env: { ...process.env, VITE_FIXTURES: "mock" },
		},
	);
	await waitFor(3100, "/big-matches/");

	const code = await new Promise((resolve) => {
		const pw = spawn("npx", ["playwright", "test"], { stdio: "inherit" });
		pw.on("exit", resolve);
	});
	process.exitCode = code ?? 1;
} finally {
	if (dev) {
		try {
			process.kill(-dev.pid, "SIGTERM");
		} catch {
			// process group already gone
		}
	}
}
