import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Generates the static data file the app reads at build time. Run in CI (see
// .github/workflows/deploy.yml). Teams refresh weekly, matches daily; both are
// written to a single JSON file. Matches are the full season for each
// competition (the aggregate /matches endpoint only returns upcoming fixtures).
// Calls are paced 12s apart and retry once on 429: ~2 requests/competition (1
// teams + 1 matches) stays within the free-tier 10 req/min budget.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "lib", "fixtures.json");

const CODES = process.env.COMPETITION_CODES?.split(",")
	.map((s) => s.trim())
	.filter(Boolean) ?? ["PL", "PD", "SA", "BL1", "FL1", "CL"];
const TEAMS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sleep = (ms: number): Promise<void> => {
	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, ms);
	return promise;
};

/** A team as the app consumes it (see src/lib/filterBigMatches.ts). */
interface Team {
	id: number;
	name: string;
	shortName?: string;
	competition: string;
	crest?: string;
}

/** A match as the app consumes it (see src/lib/filterBigMatches.ts). */
interface Match {
	id: number;
	utcDate: string;
	status: string;
	matchday?: number | null;
	stage?: string | null;
	competition?: { code?: string; name?: string };
	homeTeam: { id: number; name: string; shortName?: string; crest?: string };
	awayTeam: { id: number; name: string; shortName?: string; crest?: string };
	score?: {
		winner?: string | null;
		fullTime?: { home?: number | null; away?: number | null };
	};
}

/**
 * A data provider adapts an external football API to the app's fixtures.json
 * schema. Each provider owns its transport: auth, rate limiting, and error
 * handling.
 */
interface DataProvider {
	name: string;
	fetchTeams(code: string): Promise<Team[]>;
	fetchMatches(code: string): Promise<Match[]>;
	season(): string;
}

/**
 * Football-Data.org v4 provider. Free tier: 12 competitions (no UEFA Europa
 * League / domestic cups). Transport: X-Auth-Token header, 12s pacing (10
 * req/min), one retry on network error / 429.
 */
function createFootballDataProvider({
	baseUrl,
	key,
}: {
	baseUrl: string;
	key?: string;
}): DataProvider {
	let lastRequestMs = 0;
	const REQUEST_GAP_MS = 12000;

	async function throttle() {
		const wait = lastRequestMs
			? Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestMs))
			: 0;
		if (wait > 0) await sleep(wait);
		lastRequestMs = Date.now();
	}

	async function fetchJson(p: string, isRetry = false): Promise<unknown> {
		if (!key) {
			throw new Error("FOOTBALL_DATA_API_KEY not set");
		}
		await throttle();
		let res: Response;
		try {
			res = await fetch(`${baseUrl}${p}`, {
				headers: { "X-Auth-Token": key },
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

	function currentSeason() {
		const d = new Date();
		return String(
			d.getUTCMonth() + 1 >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1,
		);
	}

	async function fetchTeams(code: string): Promise<Team[]> {
		const data = (await fetchJson(`/competitions/${code}/teams`)) as {
			competition?: { name?: string };
			teams?: Team[];
		};
		const name = data.competition?.name ?? code;
		return (data.teams ?? []).map((t) => ({
			id: t.id,
			name: t.name,
			shortName: t.shortName,
			competition: name,
			crest: t.crest,
		}));
	}

	async function fetchMatches(code: string): Promise<Match[]> {
		const data = (await fetchJson(
			`/competitions/${code}/matches?season=${currentSeason()}`,
		)) as { matches?: Match[] };
		return data.matches ?? [];
	}

	return {
		name: "footballdata",
		fetchTeams,
		fetchMatches,
		season: currentSeason,
	};
}

/** Registered providers; pick one via DATA_PROVIDER env (default football-data). */
const PROVIDERS: Record<string, DataProvider> = {
	footballdata: createFootballDataProvider({
		baseUrl:
			process.env.FOOTBALL_DATA_API_BASE ?? "https://api.football-data.org/v4",
		key: process.env.FOOTBALL_DATA_API_KEY,
	}),
};

async function getProvider(): Promise<DataProvider> {
	const name = process.env.DATA_PROVIDER ?? "footballdata";
	const provider = PROVIDERS[name];
	if (!provider) {
		throw new Error(
			`Unknown DATA_PROVIDER "${name}" (available: ${Object.keys(PROVIDERS).join(", ")})`,
		);
	}
	return provider;
}

// Download team crests from each provider's remote CDN into public/crests/ so
// the app never depends on a third-party origin at runtime: page loads stay
// same-origin and fast. Images are resized and converted to WebP (mobile
// friendly). A failed download drops that crest (the UI falls back to the team
// initial) and logs a dev warning.
async function downloadCrests(urls: string[]): Promise<Map<string, string>> {
	const dir = path.join(ROOT, "public", "crests");
	mkdirSync(dir, { recursive: true });
	const map = new Map<string, string>();
	const CONCURRENCY = 6;
	let failed = 0;
	let skipped = 0;
	let i = 0;
	const worker = async () => {
		while (i < urls.length) {
			const url = urls[i++];
			if (!url?.startsWith("https://") || map.has(url)) {
				skipped++;
				continue;
			}
			let name: string;
			try {
				name = path.basename(new URL(url).pathname);
			} catch {
				skipped++;
				continue;
			}
			try {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buf = Buffer.from(await res.arrayBuffer());
				const webp = `${name.replace(/\.png$/, "")}.webp`;
				await sharp(buf)
					.resize({
						width: 48,
						height: 48,
						fit: "inside",
						withoutEnlargement: true,
					})
					.webp()
					.toFile(path.join(dir, webp));
				map.set(url, `crests/${webp}`);
			} catch (e) {
				failed++;
				console.warn(
					`crest download failed for ${url}: ${e instanceof Error ? e.message : e}; dropping crest`,
				);
			}
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
	);
	console.log(
		`crests: downloaded ${map.size}, skipped ${skipped}, failed ${failed} (of ${urls.length})`,
	);
	return map;
}

let prev: { generatedAt?: string; teams?: Team[] } | null = null;
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

const provider = await getProvider();
let teams: Team[];
if (staleTeams) {
	const all: Team[] = [];
	for (const code of CODES) {
		try {
			all.push(...(await provider.fetchTeams(code)));
		} catch (e) {
			console.error(
				`skip teams for ${code}: ${e instanceof Error ? e.message : e}`,
			);
		}
	}
	// Keep the previous roster if this refresh yielded nothing, so a transient
	// failure never clobbers good data with an empty list.
	teams = all.length ? all : (prev?.teams ?? []);
} else if (prev) {
	teams = prev.teams ?? [];
} else {
	teams = [];
}
console.log(`teams: ${staleTeams ? "refreshed" : "reused"} (${teams.length})`);

const matches: Match[] = [];
for (const code of CODES) {
	try {
		matches.push(...(await provider.fetchMatches(code)));
	} catch (e) {
		console.error(
			`skip matches for ${code}: ${e instanceof Error ? e.message : e}`,
		);
	}
}
console.log(`matches: ${matches.length} (season ${provider.season()})`);

if (teams.length === 0 && matches.length === 0) {
	console.error("generated empty dataset; refusing to publish a blank site");
	process.exit(1);
}

// Pull crests from the remote CDN into public/crests/ and point all references
// at the local copies so the page loads entirely same-origin.
const crestUrls = new Set<string>();
for (const t of teams) if (t.crest) crestUrls.add(t.crest);
for (const m of matches) {
	if (m.homeTeam?.crest) crestUrls.add(m.homeTeam.crest);
	if (m.awayTeam?.crest) crestUrls.add(m.awayTeam.crest);
}
const crestMap = await downloadCrests([...crestUrls]);
const localCrest = (url?: string): string | undefined =>
	url && /^https?:\/\//.test(url) ? crestMap.get(url) : url;
for (const t of teams) if (t.crest) t.crest = localCrest(t.crest);
for (const m of matches) {
	if (m.homeTeam?.crest) m.homeTeam.crest = localCrest(m.homeTeam.crest);
	if (m.awayTeam?.crest) m.awayTeam.crest = localCrest(m.awayTeam.crest);
}
// Keep only fields the app consumes. The full-season match objects carry a lot
// of unused payload (odds, referees, area, season, lastUpdated); trimming it
// here shrinks the JSON ~54%, cutting the client-side parse cost that shows up
// as main-thread blocking (Lighthouse TBT) on load.
const trimmedMatches = matches.map((m) => ({
	id: m.id,
	utcDate: m.utcDate,
	status: m.status,
	matchday: m.matchday,
	stage: m.stage,
	competition: {
		code: m.competition?.code,
		name: m.competition?.name,
	},
	homeTeam: {
		id: m.homeTeam.id,
		name: m.homeTeam.name,
		shortName: m.homeTeam.shortName,
		crest: m.homeTeam.crest,
	},
	awayTeam: {
		id: m.awayTeam.id,
		name: m.awayTeam.name,
		shortName: m.awayTeam.shortName,
		crest: m.awayTeam.crest,
	},
	score: m.score && {
		fullTime: m.score.fullTime && {
			home: m.score.fullTime.home,
			away: m.score.fullTime.away,
		},
		winner: m.score.winner,
	},
}));
const out = {
	generatedAt: new Date(now).toISOString(),
	teams,
	matches: trimmedMatches,
};
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(
	`wrote ${OUT}: ${teams.length} teams, ${matches.length} matches (${(
		(Date.now() - now) / 1000
	).toFixed(1)}s)`,
);
