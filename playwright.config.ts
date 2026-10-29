import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	workers: process.env.CI ? 2 : undefined,
	testTimeout: 60_000,
	use: {
		baseURL: "http://127.0.0.1:3100",
		// Container runs as root; Chromium sandbox must be off (CI only).
		chromiumSandbox: process.env.CI ? false : undefined,
		navigationTimeout: 60_000,
	},
});
