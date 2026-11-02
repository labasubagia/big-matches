import { describe, expect, it } from "vitest";
import { summarize } from "./lighthouse-summary.ts";

const row = (url: string, scores: number[], link = "") => ({
	url,
	scores,
	link,
});

describe("summarize", () => {
	it("returns single-run rows verbatim, sorted by url", () => {
		const rows = [row("https://x/z", [80, 90]), row("https://x/a", [70, 85])];
		expect(summarize(rows)).toEqual([
			["https://x/a", { scores: [70, 85], link: "" }],
			["https://x/z", { scores: [80, 90], link: "" }],
		]);
	});

	it("keeps the worst score per category across runs", () => {
		const rows = [
			row("https://x/a", [100, 60, 50], "https://r/1"),
			row("https://x/a", [70, 80, 40], "https://r/2"),
		];
		const [[url, { scores, link }]] = summarize(rows);
		expect(url).toBe("https://x/a");
		expect(scores).toEqual([70, 60, 40]);
		expect(link).toBe("https://r/1");
	});

	it("coalesces link to the first non-empty run link", () => {
		const rows = [
			row("https://x/a", [99], ""),
			row("https://x/a", [10], "https://r/2"),
		];
		const [, { link }] = summarize(rows)[0];
		expect(link).toBe("https://r/2");
	});
});
