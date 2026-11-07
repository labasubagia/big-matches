import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFixtures } from "./loadFixtures";

const VALID = {
	teams: [{ id: 1, name: "Alpha", competition: "League" }],
	matches: [],
};

describe("loadFixtures retry contract", () => {
	const originalFetch = globalThis.fetch;
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("clears the memo on rejection so a later call re-fetches", async () => {
		const fetchMock = vi.fn<typeof fetch>();
		fetchMock
			.mockRejectedValueOnce(new TypeError("network blip"))
			.mockResolvedValueOnce(
				new Response(JSON.stringify(VALID), { status: 200 }),
			);
		globalThis.fetch = fetchMock;

		await expect(loadFixtures()).rejects.toThrow("network blip");
		const fixtures = await loadFixtures();
		expect(fixtures.teams).toHaveLength(1);
		expect(fixtures.matches).toEqual([]);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe("loadFixturesOrThrow empty-data error", () => {
	const originalFetch = globalThis.fetch;
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("throws prompting data:gen when placeholder data is empty", async () => {
		globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(JSON.stringify({ teams: [], matches: [] }), {
				status: 200,
			}),
		);

		// `loadFixtures` memoizes a module-level promise; `vi.resetModules` +
		// dynamic import give a fresh module so the empty-data path is exercised
		// regardless of which test ran first.
		vi.resetModules();
		const { loadFixturesOrThrow } = await import("./loadFixtures");
		await expect(loadFixturesOrThrow()).rejects.toThrow("npm run data:gen");
	});
});
