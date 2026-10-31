import { expect, test } from "@playwright/test";
import { format } from "date-fns";
import { FAQ_ENTRIES } from "../src/lib/faqContent";

// Match rows render each team name as its own element. Scope row assertions to
// the <li> that contains both names.
function rowMatching(page, names) {
	return page
		.locator("li")
		.filter({ hasText: names[0] })
		.filter({ hasText: names[1] });
}

// Opens the club combobox and returns its search input.
async function openCombobox(page) {
	const trigger = page.getByRole("combobox");
	for (let i = 0; i < 5; i++) {
		await trigger.click();
		const search = page.getByPlaceholder("Search clubs…");
		try {
			await search.waitFor({ state: "visible", timeout: 600 });
			return search;
		} catch {
			// swallowed click; retry
		}
	}
	throw new Error("combobox did not open");
}
async function ensureCombobox(page) {
	const search = page.getByPlaceholder("Search clubs…");
	if (await search.isVisible().catch(() => false)) return search;
	return openCombobox(page);
}

function monthLabel(d: Date): string {
	return format(d, "MMMM yyyy");
}
async function captionLabel(page): Promise<string> {
	return (
		await page.locator(".rdp-month_caption").first().textContent()
	).trim();
}
async function expectTeamsReady(page) {
	await expect(page.getByText(/teams selected/)).toBeVisible();
}
async function openDateRange(page) {
	for (let i = 0; i < 5; i++) {
		await page.getByLabel("Date range").click();
		const cal = page.locator(".rdp-root");
		try {
			await cal.waitFor({ state: "visible", timeout: 600 });
			return;
		} catch {
			// swallowed click; retry
		}
	}
	throw new Error("date range did not open");
}

async function gotoMonth(page, target: Date) {
	const MONTHS = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const tIdx = target.getFullYear() * 12 + target.getMonth();
	for (let i = 0; i < 36; i++) {
		const cur = await captionLabel(page);
		const m = cur.match(/(\w+) (\d{4})/);
		if (!m) throw new Error(`unexpected month caption: ${cur}`);
		const cIdx = +m[2] * 12 + MONTHS.indexOf(m[1]);
		if (cIdx === tIdx) return;
		if (cIdx < tIdx) await page.locator(".rdp-button_next").click();
		else await page.locator(".rdp-button_previous").click();
	}
	throw new Error(`month not reached: ${monthLabel(target)}`);
}
async function clickDay(page, d: Date) {
	await page
		.locator(".rdp-month .rdp-day_button")
		.filter({ hasText: new RegExp(`^${d.getDate()}$`) })
		.first()
		.click();
}
async function pickRange(page, from: Date, to: Date) {
	await openDateRange(page);
	await gotoMonth(page, from);
	await clickDay(page, from);
	await gotoMonth(page, to);
	await clickDay(page, to);
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
	const search = await openCombobox(page);
	await search.fill("inter");

	// Fuzzy candidate list shows only matching teams, deduped by club.
	const candidates = page.getByRole("option");
	await expect(candidates).toHaveCount(1);
	await expect(candidates.first()).toContainText("Internazionale");

	// Clicking the option checks its box.
	await candidates.first().click();
	await expect(candidates.first().locator("svg")).toBeVisible();

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
	const search = await openCombobox(page);

	await search.fill("manchester united");
	const manUtd = page
		.getByRole("option")
		.filter({ hasText: "Manchester United" });
	await manUtd.click();
	await expect(page.getByTestId("selected-count")).toHaveText(
		"1 club selected",
	);
	await expect(
		rowMatching(page, ["Manchester United", "Manchester City"]),
	).toBeVisible();
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(0);
});

test("selecting two teams restricts results to their mutual fixtures", async ({
	page,
}) => {
	await page.goto("/big-matches/");
	let search = await openCombobox(page);

	await search.fill("real");
	await page.getByRole("option").filter({ hasText: "Real Madrid" }).click();
	search = await ensureCombobox(page);
	await search.fill("barcelona");
	await page.getByRole("option").filter({ hasText: "FC Barcelona" }).click();
	await expect(page.getByTestId("selected-count")).toHaveText(
		"2 clubs selected",
	);
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

test("clicking a team selects it with an orange border and white background", async ({
	page,
}) => {
	await page.goto("/big-matches/teams");
	await expectTeamsReady(page);

	const arsenal = page.getByRole("button", { name: /Arsenal/ }).first();

	await arsenal.click();
	await expect(arsenal).toHaveAttribute("aria-pressed", "true");
	await expect(arsenal).toHaveCSS("background-color", "rgb(255, 255, 255)");
	await expect(arsenal).toHaveCSS("border-top-width", "2px");
	await expect(arsenal).toHaveCSS("border-color", "oklch(0.705 0.213 47.604)");

	// Clicking again deselects.
	await arsenal.click();
	await expect(arsenal).toHaveAttribute("aria-pressed", "false");
});

test("selection persists across pages", async ({ page }) => {
	await page.goto("/big-matches/teams");
	await expectTeamsReady(page);

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

test("overview shows all matches including the past with bucket background colors", async ({
	page,
}) => {
	await page.goto("/big-matches/");
	// Widen the date-range filter so past/near/far matches all appear.
	const now = new Date();
	const from = new Date(now.getTime() - 10 * 86400000);
	const to = new Date(now.getTime() + 200 * 86400000);
	await pickRange(page, from, to);

	await expect(
		page.getByRole("heading", { name: "Big Matches" }),
	).toBeVisible();

	// Matches are grouped under month headings.
	await expect(
		page
			.locator("h2")
			.filter({ hasText: /\w+ \d{4}/ })
			.first(),
	).toBeVisible();

	// A finished past match shows its inline score between the teams.
	const pastRow = page
		.locator("li")
		.filter({ hasText: "Manchester United" })
		.filter({ hasText: "Manchester City" })
		.first();
	await expect(pastRow).toContainText("1");
	await expect(pastRow).toContainText("0");

	// Far matches (timed and TBD) are included on the page.
	await expect(rowMatching(page, ["Liverpool", "Chelsea"])).toBeVisible();
	// Real Madrid vs Barcelona appears twice: near (Nov) and TBD far (May).
	await expect(rowMatching(page, ["Real Madrid", "Barcelona"])).toHaveCount(2);

	// Past rows are light gray; all other rows are white.
	await expect(pastRow.locator("div").first()).toHaveCSS(
		"background-color",
		"rgb(240, 240, 240)",
	);

	const farRow = rowMatching(page, ["Liverpool", "Chelsea"]);
	await expect(farRow.locator("div").first()).toHaveCSS(
		"background-color",
		"rgb(255, 255, 255)",
	);
	// TBD matches mark only the time text in orange.
	const tbdRow = rowMatching(page, ["Real Madrid", "Barcelona"]).last();
	await expect(tbdRow.getByText("(time TBD)")).toHaveCSS(
		"color",
		"rgb(249, 115, 22)",
	);
});

test("faq page shows accordion Q&As with multiple-open behavior", async ({
	page,
}) => {
	await page.goto("/big-matches/faq");
	await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
	// The FAQ is reachable from the top-level nav.
	const navLink = page.getByRole("link", { name: "FAQ" });
	await expect(navLink).toBeVisible();
	await expect(navLink).toHaveAttribute("href", "/big-matches/faq");

	// Each Q&A is an accordion item.
	const items = page.locator("div:has(> h3)");
	await expect(items).toHaveCount(FAQ_ENTRIES.length);

	const toggle = async (i: number) => {
		const item = items.nth(i);
		const trig = item.locator("button");
		for (let k = 0; k < 5; k++) {
			await trig.click();
			if ((await item.getAttribute("data-state")) === "open") return;
			await page.waitForTimeout(200);
		}
		throw new Error("accordion item did not open");
	};

	await toggle(0);
	await expect(items.nth(0)).toHaveAttribute("data-state", "open");

	// Multiple-open accordion: opening another keeps the previous open.
	await toggle(1);
	await expect(items.nth(0)).toHaveAttribute("data-state", "open");
	await expect(items.nth(1)).toHaveAttribute("data-state", "open");
});
test("teams page reset button clears all selection", async ({ page }) => {
	await page.goto("/big-matches/teams");
	await expectTeamsReady(page);

	const resetBtn = page.getByRole("button", { name: "Reset" });
	await expect(resetBtn).toBeEnabled();

	await resetBtn.click();
	await expect(page.getByText(/0 teams selected/)).toBeVisible();
	await expect(resetBtn).toBeDisabled();
});

test("combobox X resets club filter", async ({ page }) => {
	await page.goto("/big-matches/");
	const search = await openCombobox(page);
	await search.fill("manchester united");
	await page
		.getByRole("option")
		.filter({ hasText: "Manchester United" })
		.click();
	await expect(page.getByTestId("selected-count")).toHaveText(
		"1 club selected",
	);

	const xBtn = page.getByRole("button", { name: "Reset club filter" });
	await xBtn.click();
	await expect(page.getByTestId("selected-count")).toHaveText(
		"All selected big teams",
	);
	await expect(page.getByRole("combobox")).toContainText("Filter big clubs");
});
