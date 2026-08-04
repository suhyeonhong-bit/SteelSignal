import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const output = new URL("../pages-dist/", import.meta.url);
const outputPath = fileURLToPath(output);

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

test("builds the GitHub Pages artifact", async () => {
  const arcticHtml = await readFile(new URL("index.html", output), "utf8");
  const steelHtml = await readFile(new URL("steel/index.html", output), "utf8");
  assert.match(arcticHtml, /lang="ko"/);
  assert.match(arcticHtml, /북극 에너지 패권/);
  assert.match(arcticHtml, /rel="canonical" href="https:\/\/steel-signal\.vercel\.app\/"/);
  assert.match(arcticHtml, /property="og:image" content="https:\/\/steel-signal\.vercel\.app\/arctic-og\.png"/);
  assert.match(arcticHtml, /\/SteelSignal\/assets\/[^"']+\.js/);
  assert.match(steelHtml, /STEEL SIGNAL/);
  assert.match(steelHtml, /rel="canonical" href="https:\/\/steel-signal\.vercel\.app\/steel\/"/);
  assert.match(steelHtml, /property="og:image" content="https:\/\/steel-signal\.vercel\.app\/og\.png"/);
  assert.match(steelHtml, /\/SteelSignal\/assets\/[^"']+\.js/);

  const files = await walk(outputPath);
  const contents = (
    await Promise.all(files.filter((file) => /\.(?:html|js|css)$/.test(file)).map((file) => readFile(file, "utf8")))
  ).join("\n");
  assert.match(contents, /raw\.githubusercontent\.com\/suhyeonhong-bit\/ToSuhyeon/);
  assert.match(contents, /arctic_dashboard\.json/);
  assert.match(contents, /북극 에너지 패권/);
  assert.match(contents, /금리와 철강 가격의 흐름을 한눈에/);
  assert.doesNotMatch(contents, /FRED_API_KEY|ECOS_API_KEY|OAI-Sites-Authorization/);
});
