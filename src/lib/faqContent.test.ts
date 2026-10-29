import { describe, expect, it } from "vitest";
import { FAQ_ENTRIES } from "./faqContent";

describe("FAQ_ENTRIES", () => {
	const allText = () =>
		FAQ_ENTRIES.map((e) => `${e.question} ${e.answer}`).join(" ");

	it("every entry has a question and answer", () => {
		for (const entry of FAQ_ENTRIES) {
			expect(entry.question).toBeTruthy();
			expect(entry.answer).toBeTruthy();
		}
	});

	it("documents the Europa League paywall in plain language", () => {
		const text = allText();
		expect(text).toMatch(/Europa League/);
		expect(text).toMatch(/paid/i);
		expect(text).not.toMatch(/403|UEL|HTTP/);
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
		expect(bulleted).toHaveLength(2);
		for (const entry of bulleted) {
			expect(entry.items?.length ?? 0).toBeGreaterThan(0);
		}
	});

	it("documents the top-5-only big-team rule", () => {
		const questions = FAQ_ENTRIES.map((e) => e.question);
		expect(questions).toContain(
			"Why do I only see the Champions League and top-five league teams?",
		);
	});
	it("documents the absence of reminders/notifications", () => {
		const questions = FAQ_ENTRIES.map((e) => e.question);
		expect(questions).toContain(
			"Can I get reminders or notifications for matches?",
		);
	});
});
