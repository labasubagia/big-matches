import { chromium } from "@playwright/test";

const b = await chromium.launch();
const p = await b.newPage();
const BASE = "http://localhost:4173/big-matches/";
// Overview
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForSelector("h1:has-text('Big Matches')");
// match rows are Cards
const cards = await p.locator("ul > li > div[class*='rounded']").count();
console.log("overview card rows:", cards);
await p.click("section button:has-text('Filters')");
await p.waitForSelector("button:has-text('Reset')");
await p.click("button[role=combobox]");
await p.waitForSelector("[cmdk-root]");
await p.click("[cmdk-item] >> nth=0");
await p.keyboard.press("Escape");
await p.waitForTimeout(250);
console.log("overview filters: OK");
// Teams
await p.click("nav a:has-text('Teams')");
await p.waitForSelector("h1:has-text('Select Big Teams')");
const av = await p.locator("[data-radix-avatar-root]").count();
console.log("teams avatars:", av);
const first = p.locator("button[aria-pressed]").first();
const before = await first.getAttribute("aria-pressed");
await first.click();
const after = await first.getAttribute("aria-pressed");
console.log("toggle:", before, "->", after);
// FAQ accordion
await p.click("nav a:has-text('FAQ')");
await p.waitForSelector("h1:has-text('FAQ')");
const trig = p.locator("[data-radix-accordion-trigger]").first();
await trig.waitFor();
console.log("accordion trigger:", await trig.textContent());
await trig.click();
await p.waitForTimeout(400);
const open = await p
	.locator("[data-radix-accordion-content][data-state=open]")
	.count();
console.log("accordion open panels:", open);
// Schedules
await p.click("nav a:has-text('Schedules')");
await p.waitForSelector("h1:has-text('All Big Matches')");
const legendBadges = await p.locator("div[class*='rounded-full']").count();
console.log("schedules legend badges:", legendBadges);
await b.close();
