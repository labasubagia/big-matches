import { afterEach, describe, expect, it, vi } from "vitest";
import { createTheSportsDBProvider } from "./provider-the-sport-db-com";

const EPL_ID = 4328;
const UCL_ID = 4480;

function mockFetch(routes: (url: string) => unknown | Promise<unknown>) {
	const calls: string[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			calls.push(url);
			const body = await routes(url);
			return new Response(JSON.stringify(body), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}),
	);
	return () => calls;
}

const seasonEvents = (events: Array<Record<string, unknown>>) => ({
	events,
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("thesportsdb provider", () => {
	it("derives full rosters from season events (capped team search bypassed for known ids)", async () => {
		const getCalls = mockFetch((url) => {
			if (url.includes("search_all_teams")) {
				throw new Error("search_all_teams should not be called for a known id");
			}
			return seasonEvents([
				{
					idEvent: "1",
					strTimestamp: "2024-08-16T19:00:00",
					strStatus: "FT",
					intHomeScore: "1",
					intAwayScore: "0",
					idHomeTeam: "133612",
					strHomeTeam: "Manchester United",
					strHomeTeamBadge: "https://example.com/a.png",
					idAwayTeam: "133600",
					strAwayTeam: "Fulham",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
				{
					idEvent: "2",
					strTimestamp: "2024-08-17T14:00:00",
					strStatus: "FT",
					idHomeTeam: "133612",
					strHomeTeam: "Manchester United",
					idAwayTeam: "133604",
					strAwayTeam: "Arsenal",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
			]);
		});
		const provider = createTheSportsDBProvider({});
		const teams = await provider.fetchTeams("PL");

		// 3 unique clubs from 2 matches
		expect(teams).toHaveLength(3);
		const manU = teams.find((t) => t.name === "Manchester United");
		expect(manU?.id).toBe(133612);
		expect(manU?.competition).toBe("English Premier League");
		expect(manU?.crest).toBe("https://example.com/a.png");
		expect(getCalls().some((u) => u.includes("eventsseason"))).toBe(true);
	});

	it("maps status, score, winner, and UTC timestamps", async () => {
		mockFetch((url) => {
			if (url.includes("search_all_teams")) {
				return { teams: [] };
			}
			return seasonEvents([
				{
					idEvent: "10",
					strTimestamp: "2024-08-16T19:00:00",
					strStatus: "FT",
					intHomeScore: "2",
					intAwayScore: "1",
					strRound: "1",
					intRound: "1",
					idHomeTeam: "1",
					strHomeTeam: "Home",
					idAwayTeam: "2",
					strAwayTeam: "Away",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
				{
					idEvent: "11",
					strTimestamp: "2026-12-01",
					strStatus: "Not Started",
					idHomeTeam: "1",
					strHomeTeam: "Home",
					idAwayTeam: "2",
					strAwayTeam: "Away",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
				{
					idEvent: "12",
					strTimestamp: "2026-11-04T20:00:00",
					strStatus: "Not Started",
					idHomeTeam: "3",
					strHomeTeam: "Third",
					idAwayTeam: "4",
					strAwayTeam: "Fourth",
					strLeague: "English Premier League",
				},
			]);
		});
		const provider = createTheSportsDBProvider({});
		const matches = await provider.fetchMatches("PL");
		const finished = matches.find((m) => m.id === 10);
		expect(finished).toBeDefined();
		expect(finished?.status).toBe("FINISHED");
		expect(finished?.score).toEqual({
			fullTime: { home: 2, away: 1 },
			winner: "HOME_TEAM",
		});
		expect(finished?.utcDate).toBe("2024-08-16T19:00:00.000Z");
		expect(finished?.matchday).toBe(1);

		// date-only → TBD midnight placeholder, SCHEDULED
		const tbd = matches.find((m) => m.id === 11);
		expect(tbd).toBeDefined();
		expect(tbd?.status).toBe("SCHEDULED");
		expect(tbd?.utcDate).toMatch(/T00:00:00(\.000)?Z$/);

		// real time without offset → assumed UTC, normalized
		const timed = matches.find((m) => m.id === 12);
		expect(timed).toBeDefined();
		expect(timed?.utcDate).toBe("2026-11-04T20:00:00.000Z");
		expect(timed?.competition).toEqual({
			code: "PL",
			name: "English Premier League",
		});
	});

	it("resolves unknown competition codes with a clear error", async () => {
		mockFetch(() => seasonEvents([]));
		const provider = createTheSportsDBProvider({});
		await expect(provider.fetchTeams("NOPE")).rejects.toThrow(
			'No TheSportsDB league mapped for code "NOPE"',
		);
	});

	it("caches per-competition fetch across fetchTeams/fetchMatches", async () => {
		let searchCalls = 0;
		let eventsCalls = 0;
		mockFetch((url) => {
			if (url.includes("search_all_teams")) {
				searchCalls++;
				return {
					teams: [
						{
							idTeam: "133604",
							strTeam: "Arsenal",
							strLeague: "UEFA Champions League",
							idLeague: String(UCL_ID),
						},
					],
				};
			}
			eventsCalls++;
			return seasonEvents([
				{
					idEvent: "20",
					strTimestamp: "2025-09-17T19:00:00",
					strStatus: "Not Started",
					idHomeTeam: "1",
					strHomeTeam: "Home",
					idAwayTeam: "2",
					strAwayTeam: "Away",
					strLeague: "UEFA Champions League",
				},
			]);
		});
		const provider = createTheSportsDBProvider({});
		await provider.fetchTeams("CL");
		await provider.fetchMatches("CL");
		// CL is a known id → no team-search call; events fetched once, reused
		expect(searchCalls).toBe(0);
		expect(eventsCalls).toBe(1);
	});
	it("uses the search result's league id (not a team id) for season events", async () => {
		let eventsUrl = "";
		mockFetch((url) => {
			if (url.includes("search_all_teams")) {
				return {
					teams: [
						{
							idTeam: "133604",
							strTeam: "Barcelona",
							idLeague: "4335",
							strLeague: "Spanish La Liga",
						},
					],
				};
			}
			eventsUrl = url;
			return seasonEvents([
				{
					idEvent: "30",
					strTimestamp: "2026-08-21T19:00:00",
					strStatus: "FT",
					intHomeScore: "1",
					intAwayScore: "0",
					idHomeTeam: "1",
					strHomeTeam: "Home",
					idAwayTeam: "2",
					strAwayTeam: "Away",
					strLeague: "Spanish La Liga",
				},
			]);
		});
		const provider = createTheSportsDBProvider({});
		const matches = await provider.fetchMatches("PD");
		expect(eventsUrl).toContain("id=4335");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.competition?.code).toBe("PD");
	});
	it("parses a space-separated strTimestamp as a real kickoff, not TBD", async () => {
		mockFetch(() =>
			seasonEvents([
				{
					idEvent: "50",
					strTimestamp: "2026-08-16 19:00:00",
					strStatus: "FT",
					intHomeScore: "2",
					intAwayScore: "1",
					idHomeTeam: "133612",
					strHomeTeam: "Manchester United",
					idAwayTeam: "133600",
					strAwayTeam: "Fulham",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
			]),
		);
		const provider = createTheSportsDBProvider({});
		const matches = await provider.fetchMatches("PL");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.utcDate).toBe("2026-08-16T19:00:00.000Z");
		expect(matches[0]?.status).toBe("FINISHED");
	});

	it("classifies AET finals as FINISHED", async () => {
		mockFetch(() =>
			seasonEvents([
				{
					idEvent: "51",
					strTimestamp: "2026-08-20T19:00:00",
					strStatus: "AET",
					intHomeScore: "3",
					intAwayScore: "2",
					idHomeTeam: "133612",
					strHomeTeam: "Manchester United",
					idAwayTeam: "133600",
					strAwayTeam: "Fulham",
					idLeague: String(EPL_ID),
					strLeague: "English Premier League",
				},
			]),
		);
		const provider = createTheSportsDBProvider({});
		const matches = await provider.fetchMatches("PL");
		expect(matches[0]?.status).toBe("FINISHED");
	});
});
