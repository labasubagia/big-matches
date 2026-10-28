import { expect, test } from "@playwright/test";
import { FAQ_ENTRIES } from "../src/lib/faqContent";

// Match rows render each team name as its own element. Scope row assertions to
// the <li> that contains both names.
function rowMatching(page, names) {
	return page
		.locator("li")
		.filter({ hasText: names[0] })
		.filter({ hasText: names[1] });
}
function isoDate(d: Date): string {
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Opens the filters dropdown, retrying because a click issued before React
// hydrates the page is silently dropped.
async function openFilters(page) {
	const btn = page.getByRole("button", { name: /Filters/ });
	const search = page.getByPlaceholder("Search teams…");
	for (let i = 0; i < 15; i++) {
		await btn.click();
		try {
			await search.waitFor({ state: "visible", timeout: 600 });
			return search;
		} catch {
			// swallowed click; retry
		}
	}
	throw new Error("filters panel did not open");
}

test("overview shows fixtures within the default 30-day range", async ({
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

	// Mutual fixtures inside the default 30-day window appear exactly once (the
	// finished past game with the same pairing is excluded from the overview).
	await expect(
		rowMatching(page, ["Manchester United", "Manchester City"]),
	).toHaveCount(1);

	// Beyond the 30-day window -> hidden on the overview.
	await expect(rowMatching(page, ["Liverpool", "Chelsea"])).toHaveCount(0);

	// Only the in-range Real Madrid vs Barcelona row is present; the TBD
	// fixture (far in the future) is hidden.
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(1);
});

test("search fuzzy-narrows candidates and applies immediately", async ({
	page,
}) => {
	await page.goto("/big-matches/");
	const search = await openFilters(page);
	await search.fill("inter");

	// Fuzzy candidate list shows only matching teams, deduped by club.
	const candidates = page.locator("ul label");
	await expect(candidates).toHaveCount(1);
	await expect(candidates.first()).toContainText("Internazionale");

	// Clicking the label text checks the box.
	await candidates.first().click();
	await expect(
		candidates.first().locator('input[type="checkbox"]'),
	).toBeChecked();

	// A single searched team keeps only its matches vs globally selected teams;
	// Inter's only fixture pairs it with Juventus (not globally selected).
	await expect(
		page.getByText("No fixtures match the current filters."),
	).toBeVisible();
});

test("searching one team keeps only its matches against globally selected teams", async ({
	page,
}) => {
	await page.goto("/big-matches/");
	const search = await openFilters(page);

	await search.fill("manchester united");
	const manUtd = page
		.locator("ul label")
		.filter({ hasText: "Manchester United" });
	await manUtd.click();
	await expect(page.getByText("1 club selected")).toBeVisible();
	await expect(
		rowMatching(page, ["Manchester United", "Manchester City"]),
	).toBeVisible();
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(0);
});

test("selecting two teams restricts results to their mutual fixtures", async ({
	page,
}) => {
	await page.goto("/big-matches/");
	const search = await openFilters(page);

	await search.fill("real");
	await page.locator("ul label").filter({ hasText: "Real Madrid" }).click();
	await search.fill("barcelona");
	await page.locator("ul label").filter({ hasText: "FC Barcelona" }).click();
	await expect(page.getByText("2 clubs selected")).toBeVisible();
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(1);
	await expect(
		rowMatching(page, ["Manchester United", "Manchester City"]),
	).toHaveCount(0);
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
	// Widen the date-range filter so past/near/far matches all appear.
	await openFilters(page);
	const now = new Date();
	await page
		.getByLabel("From")
		.fill(isoDate(new Date(now.getTime() - 10 * 86400000)));
	await page
		.getByLabel("To")
		.fill(isoDate(new Date(now.getTime() + 200 * 86400000)));

	await expect(
		page.getByRole("heading", { name: "All Big Matches" }),
	).toBeVisible();

	// Legend highlights the three buckets.
	await expect(page.getByText("Played")).toBeVisible();
	await expect(page.getByText("Upcoming")).toBeVisible();
	await expect(page.getByText("• Time TBD", { exact: true })).toBeVisible();
	// Fixture date-range heading mirrors the Overview page.
	await expect(
		page.getByText(/Fixtures \d{4}-\d{2}-\d{2} → \d{4}-\d{2}-\d{2}/),
	).toBeVisible();

	// A finished past match shows its inline score between the teams.
	const pastRow = page
		.locator("li")
		.filter({ hasText: "Manchester United" })
		.filter({ hasText: "Manchester City" })
		.first();
	await expect(pastRow).toContainText("1");
	await expect(pastRow).toContainText("0");

	// Far matches (timed and TBD) are included on the schedules page.
	await expect(rowMatching(page, ["Liverpool", "Chelsea"])).toBeVisible();
	// Real Madrid vs Barcelona appears twice: near (Nov) and TBD far (May).
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(2);

	// Past rows are light gray; all other rows are white.
	await expect(pastRow).toHaveCSS("background-color", "rgb(240, 240, 240)");

	const farRow = rowMatching(page, ["Liverpool", "Chelsea"]);
	await expect(farRow).toHaveCSS("background-color", "rgb(255, 255, 255)");
	// TBD matches mark only the time text in orange.
	const tbdRow = rowMatching(page, ["Real Madrid", "Barcelona"]).last();
	await expect(tbdRow.getByText("(time TBD)")).toHaveCSS(
		"color",
		"rgb(232, 98, 12)",
	);
});
test("faq page shows dropdown Q&As and allows multiple open at once", async ({
	page,
}) => {
	await page.goto("/big-matches/faq");
	await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
	// The FAQ is reachable from the top-level nav.
	const navLink = page.getByRole("link", { name: "FAQ" });
	await expect(navLink).toBeVisible();
	await expect(navLink).toHaveAttribute("href", "/big-matches/faq");

	// Each Q&A is a dropdown (native <details>).

	// Each Q&A is a dropdown (native <details>).
	const details = page.locator("details");
	await expect(details).toHaveCount(FAQ_ENTRIES.length);

	// Native <details> are independently toggleable -> multiple open at once.
	const first = details.nth(0);
	const second = details.nth(1);
	await first.locator("summary").click();
	await second.locator("summary").click();
	await expect(first).toContainText("Premier League (PL)"); // free-plan list
	await expect(second).toContainText("top 5");

	// Paywall entries render in their own dropdowns.
	const third = details.nth(2);
	await third.locator("summary").click();
	await expect(third).toContainText("Europa League");
});
