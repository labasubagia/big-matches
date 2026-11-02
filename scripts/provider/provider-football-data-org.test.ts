import { afterEach, describe, expect, it, vi } from "vitest";
import { createFootballDataProvider } from "./provider-football-data-org";

const BASE = "https://api.football-data.org/v4";
const KEY = "test-key";

const jsonResponse = (body: unknown, status = 200) =>
	({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
		text: async () => JSON.stringify(body),
	}) as unknown as Response;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("createFootballDataProvider", () => {
	it("throws when no API key is configured", async () => {
		const provider = createFootballDataProvider({ baseUrl: BASE });
		await expect(provider.fetchTeams("PL")).rejects.toThrow(
			"FOOTBALL_DATA_API_KEY not set",
		);
	});

	it("maps /competitions/{code}/teams into Team[]", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({
				competition: { name: "Premier League" },
				teams: [
					{
						id: 57,
						name: "Arsenal FC",
						shortName: "Arsenal",
						crest: "https://x/57.png",
					},
					{ id: 58, name: "Aston Villa FC", shortName: "Aston Villa" },
				],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const provider = createFootballDataProvider({ baseUrl: BASE, key: KEY });
		const teams = await provider.fetchTeams("PL");

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE}/competitions/PL/teams`,
			expect.objectContaining({ headers: { "X-Auth-Token": KEY } }),
		);
		expect(teams).toEqual([
			{
				id: 57,
				name: "Arsenal FC",
				shortName: "Arsenal",
				competition: "Premier League",
				crest: "https://x/57.png",
			},
			{
				id: 58,
				name: "Aston Villa FC",
				shortName: "Aston Villa",
				competition: "Premier League",
			},
		]);
	});

	it("requests matches with the season query", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({
				matches: [
					{
						id: 1,
						utcDate: "2026-11-01T15:00:00Z",
						status: "SCHEDULED",
						homeTeam: { id: 57, name: "Arsenal FC" },
						awayTeam: { id: 58, name: "Aston Villa FC" },
					},
				],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const provider = createFootballDataProvider({ baseUrl: BASE, key: KEY });
		const matches = await provider.fetchMatches("PL");

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining(`${BASE}/competitions/PL/matches?season=`),
			expect.anything(),
		);
		expect(matches).toHaveLength(1);
		expect(matches[0].homeTeam.id).toBe(57);
	});

	it("throws a descriptive error on a non-OK response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(jsonResponse({ message: "nope" }, 404)),
		);
		const provider = createFootballDataProvider({ baseUrl: BASE, key: KEY });
		await expect(provider.fetchTeams("PL")).rejects.toThrow(/404.*nope/);
	});

	it("exposes name, default codes and a season string", () => {
		const provider = createFootballDataProvider({ baseUrl: BASE, key: KEY });
		expect(provider.name).toBe("footballdata");
		expect(provider.defaultCompetitionCodes).toEqual([
			"PL",
			"PD",
			"SA",
			"BL1",
			"FL1",
			"CL",
		]);
		expect(provider.season()).toMatch(/^\d{4}$/);
	});
});
