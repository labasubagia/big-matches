import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	use: {
		baseURL: "http://127.0.0.1:3100",
		// First navigation after a cold dev-server boot compiles the route
		// on demand; allow extra time.
		navigationTimeout: 60_000,
	},
});
