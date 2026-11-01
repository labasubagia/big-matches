import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Generates the static data file the app reads at build time. Run in CI (see
// .github/workflows/deploy.yml). Teams refresh weekly, matches daily; both are
// written to a single JSON file. Matches are the full season for each
// competition (the aggregate /matches endpoint only returns upcoming fixtures).
// Calls are paced 12s apart and retry once on 429: max ~5 requests/run stays
// within the free-tier 10 req/min budget.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "lib", "fixtures.json");

const API_URL =
	process.env.FOOTBALL_DATA_API_BASE ?? "https://api.football-data.org/v4";
const KEY = process.env.FOOTBALL_DATA_API_KEY;
const CODES = ["PL", "PD", "SA", "BL1", "FL1", "CL"];
const TEAMS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let lastRequestMs = 0;
const REQUEST_GAP_MS = 12000;
async function throttle() {
	const wait = lastRequestMs
		? Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestMs))
		: 0;
	if (wait > 0) await sleep(wait);
	lastRequestMs = Date.now();
}

async function fetchJson(p, isRetry = false) {
	if (!KEY) {
		throw new Error("FOOTBALL_DATA_API_KEY not set");
	}
	await throttle();
	let res;
	try {
		res = await fetch(`${API_URL}${p}`, {
			headers: { "X-Auth-Token": KEY },
		});
	} catch (err) {
		if (isRetry) throw err;
		console.warn(`network error (${p}); retrying in 10s`);
		await sleep(10000);
		return fetchJson(p, true);
	}
	if (res.status === 429) {
		if (isRetry) {
			throw new Error(`Football-Data API 429 for ${p} (still rate limited)`);
		}
		console.warn(`rate limited (${p}); retrying in 10s`);
		await sleep(10000);
		return fetchJson(p, true);
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(
			`Football-Data API ${res.status} for ${p}: ${detail.slice(0, 300)}`,
		);
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
		shortName: t.shortName,
		competition: name,
		crest: t.crest,
	}));
}

function currentSeason() {
	const d = new Date();
	const year = d.getUTCFullYear();
	const month = d.getUTCMonth() + 1;
	return String(month >= 8 ? year : year - 1);
}

async function fetchMatches() {
	const season = currentSeason();
	const all = [];
	for (const code of CODES) {
		try {
			const data = await fetchJson(
				`/competitions/${code}/matches?season=${season}`,
			);
			all.push(...(data.matches ?? []));
		} catch (e) {
			console.error(`skip matches for ${code}: ${e.message}`);
		}
	}
	return all;
}

// Download team crests from Football-Data's public CDN into public/crests/ so
// the app never depends on a third-party origin at runtime: page loads stay
// same-origin and fast. A failed download keeps the remote URL (renders fine,
// just slower) and logs a dev warning.
async function downloadCrests(urls) {
	const dir = path.join(ROOT, "public", "crests");
	mkdirSync(dir, { recursive: true });
	const map = new Map();
	for (const url of urls) {
		if (!url?.startsWith("https://") || map.has(url)) continue;
		let name;
		try {
			name = path.basename(new URL(url).pathname);
		} catch {
			continue;
		}
		const dest = path.join(dir, name);
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
			map.set(url, `crests/${name}`);
		} catch (e) {
			console.warn(
				`crest download failed for ${url}: ${e.message}; keeping remote`,
			);
		}
	}
	return map;
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
		} catch (e) {
			console.error(`skip teams for ${code}: ${e.message}`);
		}
	}
	// Keep the previous roster if this refresh yielded nothing, so a transient
	// failure never clobbers good data with an empty list.
	teams = all.length ? all : (prev?.teams ?? []);
} else {
	teams = prev.teams;
}

const matches = await fetchMatches();

if (teams.length === 0 && matches.length === 0) {
	console.error("generated empty dataset; refusing to publish a blank site");
	process.exit(1);
}

// Pull crests from the remote CDN into public/crests/ and point all references
// at the local copies so the page loads entirely same-origin.
const crestUrls = new Set();
for (const t of teams) if (t.crest) crestUrls.add(t.crest);
for (const m of matches) {
	if (m.homeTeam?.crest) crestUrls.add(m.homeTeam.crest);
	if (m.awayTeam?.crest) crestUrls.add(m.awayTeam.crest);
}
const crestMap = await downloadCrests([...crestUrls]);
const localCrest = (url) => crestMap.get(url) ?? url;
for (const t of teams) if (t.crest) t.crest = localCrest(t.crest);
for (const m of matches) {
	if (m.homeTeam?.crest) m.homeTeam.crest = localCrest(m.homeTeam.crest);
	if (m.awayTeam?.crest) m.awayTeam.crest = localCrest(m.awayTeam.crest);
}

const out = { generatedAt: new Date(now).toISOString(), teams, matches };
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${OUT}: ${teams.length} teams, ${matches.length} matches`);
