import { spawn } from "node:child_process";
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

const children = [];
function start(name, env, port, path) {
	const child = spawn(name, {
		shell: true,
		detached: true,
		env: { ...process.env, ...env },
		stdio: ["ignore", "inherit", "inherit"],
	});
	children.push(child);
	return waitFor(port, path);
}

try {
	await start("node e2e/mock-api.mjs", {}, 3333, "/health");
	await start(
		"npm run dev -- --port 3100",
		{
			FOOTBALL_DATA_API_KEY: "test-key",
			FOOTBALL_DATA_API_BASE: "http://127.0.0.1:3333",
		},
		3100,
		"/big-matches/",
	);

	const code = await new Promise((resolve) => {
		const pw = spawn("npx", ["playwright", "test"], { stdio: "inherit" });
		pw.on("exit", resolve);
	});
	process.exitCode = code ?? 1;
} finally {
	for (const child of children) {
		try {
			process.kill(-child.pid, "SIGTERM");
		} catch {
			// process group already gone
		}
	}
}
