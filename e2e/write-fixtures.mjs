import { readFileSync, writeFileSync } from "node:fs";
import { buildFixtures } from "./build-fixtures.mjs";

const template = JSON.parse(
	readFileSync(new URL("./fixtures.mock.json", import.meta.url), "utf8"),
);
writeFileSync(
	new URL("../src/lib/fixtures.json", import.meta.url),
	JSON.stringify(buildFixtures(template), null, 2),
);
