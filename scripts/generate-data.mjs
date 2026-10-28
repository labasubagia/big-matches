import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Generates the static data file the app reads at build time. Run in CI (see
// .github/workflows/deploy.yml). Teams refresh weekly, matches daily; both are
// written to a single JSON file. Total upstream calls per run: 1 aggregate
// matches fetch + up to 6 per-competition team fetches = far under the free-tier
// 10 req/min budget.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "lib", "fixtures.json");

const API_URL =
	process.env.FOOTBALL_DATA_API_BASE ?? "https://api.football-data.org/v4";
const KEY = process.env.FOOTBALL_DATA_API_KEY;
const CODES = ["PL", "PD", "SA", "BL1", "FL1", "CL"];
const TEAMS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchJson(p) {
	if (!KEY) {
		throw new Error("FOOTBALL_DATA_API_KEY not set");
	}
	const res = await fetch(`${API_URL}${p}`, {
		headers: { "X-Auth-Token": KEY },
	});
	if (!res.ok) {
		throw new Error(`Football-Data API ${res.status} for ${p}`);
	}
	return res.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTeams(code) {
	const data = await fetchJson(`/competitions/${code}/teams`);
	const name = data.competition?.name ?? code;
	return (data.teams ?? []).map((t) => ({
		id: t.id,
		name: t.name,
		competition: name,
	}));
}

async function fetchMatches() {
	try {
		const data = await fetchJson(`/matches?competitions=${CODES.join(",")}`);
		return data.matches ?? [];
	} catch {
		// Fallback: per-competition fetch if the aggregate call fails.
		const all = [];
		for (const code of CODES) {
			try {
				const data = await fetchJson(`/competitions/${code}/matches`);
				all.push(...(data.matches ?? []));
			} catch {
				// skip competitions that fail; the rest still render
			}
			await sleep(150);
		}
		return all;
	}
}

let prev = null;
if (existsSync(OUT)) {
	try {
		prev = JSON.parse(readFileSync(OUT, "utf8"));
	} catch {
		prev = null;
	}
}

const now = Date.now();
const staleTeams =
	!prev ||
	!Array.isArray(prev.teams) ||
	!prev.generatedAt ||
	now - new Date(prev.generatedAt).getTime() >= TEAMS_TTL_MS;

let teams;
if (staleTeams) {
	const all = [];
	for (const code of CODES) {
		try {
			all.push(...(await fetchTeams(code)));
		} catch {
			console.warn(`skip teams for ${code} (leaving previous data intact?)`);
		}
		await sleep(1500);
	}
	teams = all;
} else {
	teams = prev.teams;
}

const matches = await fetchMatches();

const out = { generatedAt: new Date(now).toISOString(), teams, matches };
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${OUT}: ${teams.length} teams, ${matches.length} matches`);
