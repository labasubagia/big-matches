import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";

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

const DAY_MS = 86_400_000;

// The committed mock file stores dates as day-offsets from "now" (__dayOffset)
// so the past/near/far buckets stay valid no matter when the suite runs. A
// __tbd match is forced to midnight (TBD detection relies on that).
function buildFixtures(template) {
	const now = Date.now();
	return {
		...template,
		matches: template.matches.map((m) => {
			if (m.__dayOffset === undefined) return m;
			const { __dayOffset, __tbd, utcDate, ...rest } = m;
			const iso = new Date(now + __dayOffset * DAY_MS).toISOString();
			const fixed = __tbd
				? iso.replace(/T\d{2}:\d{2}:\d{2}Z$/, "T00:00:00Z")
				: iso;
			return { ...rest, utcDate: fixed };
		}),
	};
}

const MOCK_FIXTURES = new URL("./fixtures.mock.json", import.meta.url);
const FIXTURES = new URL("../src/lib/fixtures.json", import.meta.url);

let dev;
let original;
try {
	// Use committed mock fixtures instead of booting the mock API and running the
	// generator: fast and deterministic. The real fixtures file is restored below.
	try {
		original = fs.readFileSync(FIXTURES);
	} catch {
		// src/lib/fixtures.json is gitignored and may be absent (e.g. CI).
	}
	const template = JSON.parse(fs.readFileSync(MOCK_FIXTURES, "utf8"));
	fs.writeFileSync(FIXTURES, JSON.stringify(buildFixtures(template), null, 2));

	dev = spawn(
		"npm",
		["run", "dev", "--", "--port", "3100", "--host", "127.0.0.1"],
		{
			shell: true,
			detached: true,
			stdio: ["ignore", "inherit", "inherit"],
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
	if (original) fs.writeFileSync(FIXTURES, original);
}
