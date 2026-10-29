import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SELECTED_IDS } from "../config/teams";
import { readSavedSelection } from "./selections";

const VALID = new Set([86, 81, 64]);

function mockLocalStorage(store: Record<string, string>) {
	const storage = {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: vi.fn(),
	};
	vi.stubGlobal("window", { localStorage: storage });
}

describe("readSavedSelection", () => {
	it("returns saved ids filtered to valid teams", () => {
		mockLocalStorage({ "big-matches-selected": JSON.stringify([86, 999]) });
		expect(readSavedSelection(VALID)).toEqual([86]);
	});

	it("preserves a deliberately empty selection", () => {
		mockLocalStorage({ "big-matches-selected": "[]" });
		expect(readSavedSelection(VALID)).toEqual([]);
	});

	it("falls back to default on corrupt JSON", () => {
		mockLocalStorage({ "big-matches-selected": "not json" });
		expect(readSavedSelection(VALID)).toEqual(DEFAULT_SELECTED_IDS);
	});
});
