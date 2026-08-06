import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const exportUrl = new URL("../webeditor/arctic-dashboard.html", import.meta.url);

async function readExport() {
  return readFile(exportUrl, "utf8");
}

test("ships a standalone semantic Arctic dashboard for WebEditor", async () => {
  const html = await readExport();

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<style id="arctic-styles">[\s\S]+<\/style>/);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet/i);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /(?:src|href)=["']\.\.?\//i);
  assert.doesNotMatch(html, /<button[^>]+aria-pressed=/i);

  for (const id of ["overview", "intro", "yamal", "usa", "compare", "korea"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  for (const copy of [
    "북극 에너지 패권,",
    "왜 북극인가",
    "서방의 포위망을 뚫는 지정학적 송곳",
    "제재의 선택성, 그리고 북극 삼각 거점",
    "YAMAL vs 미국 북극 개발",
    "한국의 전략적 선택 2027–2033",
  ]) {
    assert.match(html, new RegExp(copy));
  }

  assert.match(html, /@media \(max-width: 760px\)/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /@media print/);
  assert.match(html, /@media print\s*\{[^}]*\.arctic-nav,\s*\.year-tabs/);
  assert.match(html, /2027년[\s\S]{0,160}RUSSIA · YAMAL[\s\S]{0,80}60%[\s\S]{0,80}USA · ALASKA[\s\S]{0,80}40%/);
  assert.match(html, /2033년[\s\S]{0,160}RUSSIA · YAMAL[\s\S]{0,80}48%[\s\S]{0,80}USA · ALASKA[\s\S]{0,80}52%/);
});
