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
			const d = new Date(now + __dayOffset * DAY_MS);
			if (__tbd) d.setUTCHours(0, 0, 0, 0);
			return { ...rest, utcDate: d.toISOString() };
		}),
	};
}
