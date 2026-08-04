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
  const html = await readFile(new URL("index.html", output), "utf8");
  assert.match(html, /lang="ko"/);
  assert.match(html, /STEEL SIGNAL/);
  assert.match(html, /\/SteelSignal\/assets\/[^"']+\.js/);

  const files = await walk(outputPath);
  const contents = (
    await Promise.all(files.filter((file) => /\.(?:html|js|css)$/.test(file)).map((file) => readFile(file, "utf8")))
  ).join("\n");
  assert.match(contents, /raw\.githubusercontent\.com\/suhyeonhong-bit\/ToSuhyeon/);
  assert.doesNotMatch(contents, /FRED_API_KEY|ECOS_API_KEY|OAI-Sites-Authorization/);
});
