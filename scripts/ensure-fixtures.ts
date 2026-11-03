import { copyFileSync, existsSync } from "node:fs";

const example = new URL("../data/fixtures.example.json", import.meta.url);
for (const name of ["fixtures.json", "fixtures.mock.json"]) {
	const dst = new URL(`../public/${name}`, import.meta.url);
	if (!existsSync(dst)) copyFileSync(example, dst);
}
