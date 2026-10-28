const DAY_MS = 86_400_000;

// The committed mock file stores dates as day-offsets from "now" (__dayOffset)
// so the past/near/far buckets stay valid no matter when the suite runs. A
// __tbd match is forced to midnight (TBD detection relies on that).
export function buildFixtures(template) {
	const now = Date.now();
	return {
		...template,
		matches: template.matches.map((m) => {
			if (m.__dayOffset === undefined) return m;
			const { __dayOffset, __tbd, utcDate, ...rest } = m;
			const iso = new Date(now + __dayOffset * DAY_MS).toISOString();
			const fixed = __tbd
				? iso.replace(/T\d{2}:\d{2}:\d{2}Z$/, "T00:00:00Z")
				: iso;
			return { ...rest, utcDate: fixed };
		}),
	};
}
