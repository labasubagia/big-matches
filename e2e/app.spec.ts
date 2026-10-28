import { expect, test } from "@playwright/test";

test("renders mutual-pairing fixtures for the default selection", async ({
	page,
}) => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", { name: "Big Matches" }),
	).toBeVisible();

	// Both teams are in the default selection -> shown.
	await expect(
		page.getByText("Manchester United vs Manchester City"),
	).toBeVisible();
	await expect(page.getByText("Real Madrid vs Barcelona")).toBeVisible();

	// Chelsea vs Arsenal: neither is in the default selection -> filtered out.
	await expect(page.getByText("Chelsea vs Arsenal")).not.toBeVisible();
});

test("toggling a team shows and hides its mutual fixtures", async ({
	page,
}) => {
	await page.goto("/");

	// Wait for the default selection to be applied before toggling; otherwise the
	// initial readSavedSelection() effect can overwrite our check.
	await expect(
		page.getByRole("checkbox", { name: "Real Madrid" }),
	).toBeChecked();

	const arsenal = page.getByRole("checkbox", { name: "Arsenal" });
	await expect(arsenal).not.toBeChecked();

	await arsenal.check();
	await expect(page.getByText("Chelsea vs Arsenal")).toBeVisible();

	await arsenal.uncheck();
	await expect(page.getByText("Chelsea vs Arsenal")).not.toBeVisible();
});
