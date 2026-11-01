#!/usr/bin/env node
// Used only by .github/workflows/deploy.yml (lighthouse job, "Post Lighthouse summary" step).
// Usage: node scripts/lighthouse-summary.mjs <desktopDir> <mobileDir>
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [desktopDir, mobileDir] = process.argv.slice(2);
if (!desktopDir || !mobileDir) {
	console.error("usage: lighthouse-summary.mjs <desktopDir> <mobileDir>");
	process.exit(2);
}

const CATS = ["performance", "accessibility", "best-practices", "seo"];

function collect(dir) {
	if (!existsSync(dir)) return [];
	const rows = [];
	for (const f of readdirSync(dir)) {
		let lhr;
		try {
			lhr = JSON.parse(readFileSync(join(dir, f), "utf8"));
		} catch {
			continue; // skip malformed report
		}
		const cats = lhr.categories || {};
		rows.push({
			url: lhr.finalUrl || lhr.requestedUrl || "?",
			scores: CATS.map((c) => Math.round((cats[c]?.score ?? 0) * 100)),
		});
	}
	return rows;
}

// worst score per url (across runs)
function summarize(rows) {
	const m = new Map();
	for (const r of rows) {
		const prev = m.get(r.url);
		m.set(
			r.url,
			prev ? prev.map((s, i) => Math.min(s, r.scores[i])) : r.scores,
		);
	}
	return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const desktop = summarize(collect(desktopDir));
const mobile = summarize(collect(mobileDir));

const head =
	"| Route | Preset | Performance | Accessibility | Best-Practices | SEO |\n" +
	"| --- | --- | ---: | ---: | ---: | ---: |";
const lines = [];
for (const [url, scores] of desktop)
	lines.push(`| ${url} | desktop | ${scores.join(" | ")} |`);
for (const [url, scores] of mobile)
	lines.push(`| ${url} | mobile | ${scores.join(" | ")} |`);
const table = [head, ...lines].join("\n");

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
	const { appendFileSync } = await import("node:fs");
	appendFileSync(summaryPath, `\n## Lighthouse results\n\n${table}\n`);
} else {
	console.log(table);
}
