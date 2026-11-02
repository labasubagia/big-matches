import type { DataProvider, Match, Team } from "../get-data";

const sleep = (ms: number): Promise<void> => {
	const { promise, resolve } = Promise.withResolvers<void>();
	setTimeout(resolve, ms);
	return promise;
};

/**
 * Football-Data.org v4 provider. Free tier: 12 competitions (no UEFA Europa
 * League / domestic cups). Transport: X-Auth-Token header, 12s pacing (10
 * req/min), one retry on network error / 429.
 */
export function createFootballDataProvider({
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
