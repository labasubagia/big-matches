import type { Match, Team } from "./filterBigMatches";
import realFixturesUrl from "./fixtures.json?url";
import mockFixturesUrl from "./fixtures.mock.json?url";

export interface Fixtures {
	matches: Match[];
	teams: Team[];
}

function processFixtures(data: {
	matches?: Match[];
	teams?: Team[];
}): Fixtures {
	const matches = data.matches as Match[];
	const shortNames = new Map<number, string>();
	for (const m of matches) {
		if (m.homeTeam.shortName)
			shortNames.set(m.homeTeam.id, m.homeTeam.shortName);
		if (m.awayTeam.shortName)
			shortNames.set(m.awayTeam.id, m.awayTeam.shortName);
	}
	const rawTeams = data.teams as Team[];
	const teams: Team[] = rawTeams.map((t) => ({
		...t,
		shortName: t.shortName ?? shortNames.get(t.id),
	}));
	return { matches, teams };
}

let fixturesPromise: Promise<Fixtures> | null = null;

async function loadFixturesUncached(): Promise<Fixtures> {
	const url =
		import.meta.env.VITE_FIXTURES === "mock"
			? mockFixturesUrl
			: realFixturesUrl;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to load fixtures (HTTP ${res.status})`);
	}
	return processFixtures(await res.json());
}

// Client-side static data load, memoized so Overview/Teams navigations reuse a
// single fetch+parse of the multi-megabyte JSON asset. On failure the memo is
// cleared so a later call can retry.
export function loadFixtures(): Promise<Fixtures> {
	fixturesPromise ??= loadFixturesUncached().catch((error) => {
		fixturesPromise = null;
		throw error;
	});
	return fixturesPromise;
}

export async function loadFixturesOrThrow(): Promise<Fixtures> {
	const fixtures = await loadFixtures();
	if (fixtures.teams.length === 0 || fixtures.matches.length === 0) {
		throw new Error(
			"App data missing — run `source .env && npm run data:gen` then restart.",
		);
	}
	return fixtures;
}
