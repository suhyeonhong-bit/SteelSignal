import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps the approved WebEditor hero synchronized with the React dashboard", async () => {
  const [component, css, webeditor] = await Promise.all([
    read("../app/components/ArcticResearchDashboard.tsx"),
    read("../app/arctic.css"),
    read("../webeditor/arctic-dashboard.html"),
  ]);
  const copies = [
    "YAMAL LNG의 지정학적 위력은 어디에서 비롯되는가?",
    "미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가",
    "— 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.",
  ];

  for (const copy of copies) {
    assert.match(component, new RegExp(copy.replace(/[?]/g, "\\?")));
    assert.match(webeditor, new RegExp(copy.replace(/[?]/g, "\\?")));
  }

  assert.equal((component.match(/className="hero-deck-line"/g) || []).length, 3);
  assert.equal((webeditor.match(/class="hero-deck-line"/g) || []).length, 3);
  assert.equal((component.match(/<\/span>\{" "\}/g) || []).length, 2);
  assert.equal((webeditor.match(/<\/span> <span class="hero-deck-line">/g) || []).length, 2);

  for (const source of [css, webeditor]) {
    assert.match(source, /--arctic-red:\s*#ef4444/);
    assert.match(source, /\.arctic-hero\s*\{[^}]*background:\s*var\(--arctic-cool\)/s);
    assert.match(source, /\.arctic-hero h1 em\s*\{[^}]*var\(--arctic-red\)/s);
    assert.match(source, /\.arctic-nav nav a\s*\{[^}]*color:\s*#000/s);
    assert.match(source, /\.hero-deck-line\s*\{[^}]*display:\s*block/s);
    for (const offset of [
      /clamp\(0px,\s*1vw,\s*16px\)/,
      /clamp\(0px,\s*3\.2vw,\s*60px\)/,
      /clamp\(0px,\s*5\.5vw,\s*105px\)/,
      /clamp\(0px,\s*1\.9vw,\s*35px\)/,
    ]) assert.match(source, offset);
    assert.match(source, /@media \(max-width:\s*760px\)[\s\S]*\.hero-deck-line\s*\{[^}]*display:\s*inline/s);
    assert.match(source, /@media \(max-width:\s*760px\)[\s\S]*\.arctic-hero h1\s*\{[^}]*font-size:\s*clamp\(3rem,\s*13\.5vw,\s*5rem\)/s);
    assert.match(source, /\.arctic-hero \.arctic-kicker,\s*\.arctic-hero h1,\s*\.hero-deck,\s*\.hero-sources\s*\{[^}]*margin-left:\s*0/s);
    assert.doesNotMatch(source, /\.hero-deck-line:not\(:last-child\)::after/);
  }

  assert.doesNotMatch(webeditor, /data-editor-slide|webeditor-canvas-size|webeditor-html-sizing/);
});
