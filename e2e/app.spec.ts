import { expect, test } from "@playwright/test";

// Match rows render each team name as its own element. Scope row assertions to
// the <li> that contains both names.
function rowMatching(page, names) {
	return page
		.locator("li")
		.filter({ hasText: names[0] })
		.filter({ hasText: names[1] });
}

test("overview shows next-3-month future matches and links to the teams page", async ({
	page,
}) => {
	await page.goto("/big-matches/");

	await expect(
		page.getByRole("heading", { name: "Big Matches" }),
	).toBeVisible();

	// The overview links to the teams page for selection (no pickers here).
	const teamsLink = page.getByRole("link", { name: "Teams page" });
	await expect(teamsLink).toBeVisible();
	await expect(teamsLink).toHaveAttribute("href", "/big-matches/teams");

	// Near-future mutual fixture appears exactly once (the finished past game
	// with the same pairing is excluded from the overview).
	await expect(
		rowMatching(page, ["Manchester United", "Manchester City"]),
	).toHaveCount(1);

	// Beyond 3 months -> hidden on the overview.
	await expect(rowMatching(page, ["Liverpool", "Chelsea"])).toHaveCount(0);

	// Only the near-future Real Madrid vs Barcelona row is present; the TBD
	// fixture (May 2027) is hidden.
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(1);
});

test("teams page groups teams by competition in canonical order", async ({
	page,
}) => {
	await page.goto("/big-matches/teams");

	await expect(
		page.getByRole("heading", { name: "Select Big Teams" }),
	).toBeVisible();

	const headings = await page
		.getByRole("heading", { level: 2 })
		.allTextContents();
	const expectedOrder = ["EPL", "La Liga", "Serie A", "Bundesliga", "Ligue 1"];
	const positions = expectedOrder.map((label) => headings.indexOf(label));
	for (const p of positions) {
		expect(p).toBeGreaterThanOrEqual(0);
	}
	for (let i = 1; i < positions.length; i++) {
		expect(positions[i]).toBeGreaterThan(positions[i - 1]);
	}
});

test("clicking a team selects it with a light orange highlight", async ({
	page,
}) => {
	await page.goto("/big-matches/teams");

	const arsenal = page.getByRole("button", { name: /Arsenal/ }).first();

	await arsenal.click();
	await expect(arsenal).toHaveAttribute("aria-pressed", "true");
	await expect(arsenal).toHaveCSS("background-color", "rgb(255, 217, 160)");

	// Clicking again deselects.
	await arsenal.click();
	await expect(arsenal).toHaveAttribute("aria-pressed", "false");
});

test("selection persists across pages", async ({ page }) => {
	await page.goto("/big-matches/teams");

	const arsenal = page.getByRole("button", { name: /Arsenal/ }).first();
	await expect(arsenal).toBeVisible();
	await arsenal.click();

	// The newly selected team now appears in overview matches (Chelsea vs Arsenal).
	await page.goto("/big-matches/");
	await expect(rowMatching(page, ["Chelsea", "Arsenal"])).toBeVisible();

	// Selection survives navigation back to the teams page.
	await page.goto("/big-matches/teams");
	await expect(
		page.getByRole("button", { name: /Arsenal/ }).first(),
	).toHaveAttribute("aria-pressed", "true");
});

test("schedules shows all matches including the past with bucket background colors", async ({
	page,
}) => {
	await page.goto("/big-matches/schedules");

	await expect(
		page.getByRole("heading", { name: "All Big Matches" }),
	).toBeVisible();

	// Legend highlights the three buckets.
	await expect(page.getByText("Played")).toBeVisible();
	await expect(page.getByText("Next 3 months")).toBeVisible();
	await expect(page.getByText("Later or time TBD")).toBeVisible();

	// A finished past match shows its score.
	await expect(page.getByText("1 - 0")).toBeVisible();

	// Far matches (timed and TBD) are included on the schedules page.
	await expect(rowMatching(page, ["Liverpool", "Chelsea"])).toBeVisible();
	// Real Madrid vs Barcelona appears twice: near (Nov) and TBD far (May).
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(2);

	// Past row is dark gray; far row is light gray.
	const pastRow = page.locator("li").filter({ hasText: "1 - 0" }).first();
	await expect(pastRow).toHaveCSS("background-color", "rgb(158, 158, 158)");

	const farRow = rowMatching(page, ["Liverpool", "Chelsea"]);
	await expect(farRow).toHaveCSS("background-color", "rgb(208, 208, 208)");
});
