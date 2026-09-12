// One-off verification script: screenshots the demo stage (each filmstrip
// thumbnail) and the plain conversation view, dumping PNG + HTML snapshots
// for visual review. Not part of the app build.
//
// aida-voice has no @playwright/test of its own, so it is loaded by absolute
// path from the aida worktree's node_modules (Node's ESM resolution walks up
// from the importing *file*, so a plain `import "@playwright/test"` here
// would not find it even if this script's cwd were changed):
//   node scripts/dump-demo.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "/Users/juanegido/Code/Atida/data/ai/aida/.claude/worktrees/aida-acronym-atida-6714f1/node_modules/@playwright/test/index.js",
);

const OUT_DIR = "/Users/juanegido/lumai-space/aida-voice-hackathon/ref/";
const BASE_URL = "http://localhost:3200";
const STAGE_NAMES = ["stage-kpi", "stage-bar", "stage-funnel", "stage-stores"];

async function dumpCurrentPage(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  const html = await page.evaluate(() => document.body.innerHTML);
  await writeFile(path.join(OUT_DIR, `${name}.html`), html, "utf8");
  console.log(`saved ${name}.png / ${name}.html`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: "networkidle" });
  await page.waitForSelector(".stage-hero", { timeout: 15000 });

  const cards = await page.locator(".filmstrip-card").all();
  console.log(`found ${cards.length} filmstrip cards`);

  for (let i = 0; i < cards.length; i++) {
    await cards[i].click();
    await page.waitForTimeout(500); // let the hero-enter animation settle
    const name = STAGE_NAMES[i] ?? `stage-${i}`;
    await dumpCurrentPage(page, name);
  }

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await dumpCurrentPage(page, "conversation");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
