import { describe, expect, it } from "vitest";
import { FAQ_ENTRIES, FREE_COMPETITIONS } from "./faqContent";

describe("FREE_COMPETITIONS", () => {
	it("lists exactly the 12 free-plan competitions", () => {
		expect(FREE_COMPETITIONS).toHaveLength(12);
		const codes = FREE_COMPETITIONS.map((c) => c.code);
		for (const expected of [
			"PL",
			"PD",
			"SA",
			"BL1",
			"FL1",
			"CL",
			"PPL",
			"DED",
			"ELC",
			"BSA",
			"WC",
			"EC",
		]) {
			expect(codes).toContain(expected);
		}
	});
});

describe("FAQ_ENTRIES", () => {
	const allText = () =>
		FAQ_ENTRIES.map((e) => `${e.question} ${e.answer}`).join(" ");

	it("every entry has a question and answer", () => {
		for (const entry of FAQ_ENTRIES) {
			expect(entry.question).toBeTruthy();
			expect(entry.answer).toBeTruthy();
		}
	});

	it("documents the Europa League paywall", () => {
		const text = allText();
		expect(text).toMatch(/Europa League/);
		expect(text).toMatch(/403/);
		expect(text).toMatch(/paid/i);
	});

	it("documents the league-cup paywall", () => {
		const text = allText().toLowerCase();
		expect(text).toMatch(/league cup/);
		expect(text).toMatch(/paid/);
	});

	it("adds the localStorage and non-live data entries", () => {
		const questions = FAQ_ENTRIES.map((e) => e.question);
		expect(questions).toContain("Is my team selection saved across devices?");
		expect(questions).toContain("Is the match data live?");
	});

	it("bullet items render as a non-empty list per entry", () => {
		const bulleted = FAQ_ENTRIES.filter((e) => e.items);
		expect(bulleted).toHaveLength(3);
		for (const entry of bulleted) {
			expect(entry.items?.length ?? 0).toBeGreaterThan(0);
		}
	});

	it("the free-plan entry lists all 12 competitions", () => {
		const freePlan = FAQ_ENTRIES.find((e) => e.question.includes("included"));
		expect(freePlan).toBeDefined();
		if (freePlan) {
			expect(freePlan.items).toHaveLength(12);
			const text = (freePlan.items ?? []).join(" ");
			for (const c of FREE_COMPETITIONS) {
				expect(text).toContain(c.code);
			}
		}
	});
	it("documents the top-5-only big-team rule", () => {
		const questions = FAQ_ENTRIES.map((e) => e.question);
		expect(questions).toContain(
			"Why do I only see UCL and top 5 league teams?",
		);
	});
});
