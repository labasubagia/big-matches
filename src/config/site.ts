// Absolute base URL of the deployed site (canonical links, structured data).
// Trailing slash stripped so callers compose paths (e.g. `${SITE_URL}/teams`).
export const SITE_URL = (
	import.meta.env.VITE_SITE_URL || "https://labasubagia.github.io/big-matches"
).replace(/\/+$/, "");
