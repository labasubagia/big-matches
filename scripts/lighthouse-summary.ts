#!/usr/bin/env node
// Used only by .github/workflows/deploy.yml (lighthouse job, "Post Lighthouse summary" step).
// Usage: node scripts/lighthouse-summary.ts <desktopDir> <mobileDir>
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CATS = ["performance", "accessibility", "best-practices", "seo"];

export type Row = { url: string; scores: number[]; link: string };

type Lhr = {
	categories?: Record<string, { score?: number }>;
	finalUrl?: string;
	requestedUrl?: string;
};

// maps finalUrl -> temporary public storage report link (written by lhci upload)
function loadLinks(dir: string): Record<string, string> | null {
	const p = join(dir, "links.json");
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, "utf8"));
	} catch {
		return null;
	}
}

function collect(dir: string): Row[] {
	if (!existsSync(dir))
		throw new Error(`Lighthouse reports dir not found: ${dir}`);
	if (
		!readdirSync(dir).some((f) => f.startsWith("lhr-") && f.endsWith(".json"))
	) {
		throw new Error(`No lhr-*.json report files found in ${dir}`);
	}
	const links = loadLinks(dir);
	const rows: Row[] = [];
	for (const f of readdirSync(dir)) {
		if (!f.startsWith("lhr-") || !f.endsWith(".json")) continue;
		let lhr: Lhr;
		try {
			lhr = JSON.parse(readFileSync(join(dir, f), "utf8"));
		} catch {
			continue; // skip malformed report
		}
		const cats = lhr.categories || {};
		const url = lhr.finalUrl || lhr.requestedUrl;
		if (!url) continue; // report without a resolvable url: nothing to tabulate
		rows.push({
			url,
			scores: CATS.map((c) => Math.round((cats[c]?.score ?? 0) * 100)),
			link: links?.[url] ?? "",
		});
	}
	return rows;
}

// worst score per url (across runs)
export function summarize(
	rows: Row[],
): Array<[string, { scores: number[]; link: string }]> {
	const m = new Map<string, { scores: number[]; link: string }>();
	for (const r of rows) {
		const prev = m.get(r.url);
		m.set(r.url, {
			scores: prev
				? prev.scores.map((s, i) => Math.min(s, r.scores[i]))
				: r.scores,
			link: prev?.link || r.link,
		});
	}
	return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function main() {
	const [desktopDir, mobileDir] = process.argv.slice(2);
	if (!desktopDir || !mobileDir) {
		console.error("usage: lighthouse-summary.ts <desktopDir> <mobileDir>");
		process.exit(2);
	}

	const desktop = summarize(collect(desktopDir));
	const mobile = summarize(collect(mobileDir));

	const head =
		"| Route | Preset | Performance | Accessibility | Best-Practices | SEO | Report |\n" +
		"| --- | --- | ---: | ---: | ---: | ---: | --- |";
	const lines = [];
	for (const [url, { scores, link }] of desktop)
		lines.push(
			`| ${url} | desktop | ${scores.join(" | ")} | ${link ? `[open](${link})` : "—"} |`,
		);
	for (const [url, { scores, link }] of mobile)
		lines.push(
			`| ${url} | mobile | ${scores.join(" | ")} | ${link ? `[open](${link})` : "—"} |`,
		);
	const table = [head, ...lines].join("\n");

	const summaryPath = process.env.GITHUB_STEP_SUMMARY;
	if (summaryPath) {
		appendFileSync(summaryPath, `\n## Lighthouse results\n\n${table}\n`);
	} else {
		console.log(table);
	}
}

const isMain =
	process.argv[1] !== undefined &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) void main();
