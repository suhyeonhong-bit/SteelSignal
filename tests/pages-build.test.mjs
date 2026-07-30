import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const output = new URL("../pages-dist/", import.meta.url);
const outputPath = fileURLToPath(output);
const canonical = "https://suhyeonhong-bit.github.io/SteelSignal/";
const csvUrl =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}

test("builds the Korean product shell for the SteelSignal project path", async () => {
  const html = await readFile(new URL("index.html", output), "utf8");
  assert.match(html, /<html[^>]*lang="ko"/i);
  assert.match(html, /<title>STEEL SIGNAL \| 금리와 철강 가격의 흐름<\/title>/);
  assert.match(html, new RegExp(`<link[^>]+href="${canonical}"[^>]+rel="canonical"|<link[^>]+rel="canonical"[^>]+href="${canonical}"`));
  assert.match(html, /https:\/\/suhyeonhong-bit\.github\.io\/SteelSignal\/og\.png/);
  assert.match(html, /(?:src|href)="\/SteelSignal\/[^"]+"/);
  assert.doesNotMatch(html, /steel-signal\.example|chatgpt\.site/i);
});

test("ships the social card and exact public CSV runtime URL", async () => {
  const og = await stat(path.join(outputPath, "og.png"));
  assert.ok(og.size > 0);

  const files = await walk(outputPath);
  const textFiles = files.filter((file) => /\.(?:html|js|css)$/.test(file));
  const contents = (
    await Promise.all(textFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.match(contents, new RegExp(csvUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(
    contents,
    /FRED_API_KEY|ECOS_API_KEY|art_v1_|OAI-Sites-Authorization|codex-preview|Your site is taking shape/i,
  );
});

test("does not place local configuration or source-control data in the artifact", async () => {
  const files = (await walk(outputPath)).map((file) =>
    path.relative(outputPath, file),
  );
  assert.equal(files.some((file) => /(^|\/)\.env(?:\.|$)/.test(file)), false);
  assert.equal(files.some((file) => /(^|\/)\.git(?:\/|$)/.test(file)), false);
  assert.equal(files.some((file) => /(^|\/)node_modules(?:\/|$)/.test(file)), false);
});
