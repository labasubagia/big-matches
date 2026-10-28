import { copyFileSync, existsSync } from "node:fs";

const dst = new URL("../src/lib/fixtures.json", import.meta.url);
const src = new URL("../src/lib/fixtures.example.json", import.meta.url);

if (!existsSync(dst)) {
	copyFileSync(src, dst);
}
