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
