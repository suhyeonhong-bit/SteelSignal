# WebEditor Arctic Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one WebEditor-editable Arctic research dashboard HTML file that preserves the current research presentation, works offline from an embedded snapshot, and refreshes EIA·OFAC·EU·NSIDC values from the public ToSuhyeon JSON when run in a browser.

**Architecture:** `webeditor/arctic-dashboard.html` is the only user-facing artifact and contains semantic HTML, CSS, fallback JSON, and vanilla JavaScript. Static fallback DOM makes the page selectable in WebEditor even when scripts are suppressed; runtime code validates the complete remote payload before updating stable `data-bind` and `data-region` targets. The current React/Vinext and `/steel/` applications remain unchanged.

**Tech Stack:** HTML5, CSS3, vanilla ES2022 JavaScript, inline SVG, Node.js 22 built-in test runner.

## Global Constraints

- The upload artifact is exactly `webeditor/arctic-dashboard.html`; it must not require local CSS, JavaScript, image, or font files.
- Preserve the current editorial white design, all research sections, researcher-authored labels, and Korean copy from `app/components/ArcticResearchDashboard.tsx`.
- Fetch only `https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/arctic_dashboard.json` with `cache: "no-store"` and a 10-second timeout.
- Apply remote values only after validating the entire schema; otherwise keep the embedded snapshot and show `업데이트 지연 · 내장 스냅샷`.
- Never include `EIA_API_KEY`, `.env` values, GitHub secrets, official API request construction, external JavaScript, external CSS, or chart CDNs.
- Insert remote strings with `textContent` and construct repeated nodes with `createElement`; never inject remote JSON through `innerHTML`.
- Keep 2025·2027·2033 hegemony values researcher-authored and label them `연구자 추정 · 자동 갱신 아님`.
- Preserve keyboard focus, `aria-pressed`, chart labels, horizontal comparison-table access, responsive breakpoints, `prefers-reduced-motion`, and print styles.
- Do not modify the existing React/Vinext dashboard, `/steel/`, Vercel configuration, or ToSuhyeon collector.
- Preserve the user-owned untracked `.superpowers/` directory and never stage it.

---

### Task 1: Standalone semantic dashboard and static contract

**Files:**
- Create: `tests/webeditor-export.test.mjs`
- Create: `webeditor/arctic-dashboard.html`
- Modify: `package.json:8-18`

**Interfaces:**
- Consumes: Research copy and information order from `app/components/ArcticResearchDashboard.tsx:23-159`; visual tokens and responsive rules from `app/arctic.css:1-207`.
- Produces: `readExport(): Promise<string>` in the test file; semantic landmarks with IDs `overview`, `intro`, `yamal`, `usa`, `compare`, `korea`; an inline `<style id="arctic-styles">`; `npm run test:webeditor`.

- [ ] **Step 1: Write the failing standalone-artifact test**

Create `tests/webeditor-export.test.mjs` with this initial content:

```js
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
});
```

- [ ] **Step 2: Run the test and verify the missing artifact is reported**

Run:

```bash
node --test tests/webeditor-export.test.mjs
```

Expected: FAIL with `ENOENT` for `webeditor/arctic-dashboard.html`.

- [ ] **Step 3: Create the semantic fallback document and inline styles**

Create `webeditor/arctic-dashboard.html` with this exact document contract:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>북극 에너지 패권, 이미 결정됐는가? | WebEditor Edition</title>
  <meta name="description" content="YAMAL LNG와 미국 북극 전략을 공식 데이터와 연구자 분석으로 추적하는 WebEditor 편집용 단일 HTML 대시보드.">
  <style id="arctic-styles">
    :root {
      --arctic-paper: #f7f8fa;
      --arctic-white: #ffffff;
      --arctic-navy: #0b1d2b;
      --arctic-muted: #627180;
      --arctic-rule: #dfe4e8;
      --arctic-cool: #f0f4f7;
      --arctic-copper: #b66a42;
      --arctic-copper-dark: #8d4e2f;
      --arctic-blue: #1f678f;
      --arctic-blue-soft: #eaf3f8;
      --font-display: Pretendard, "Noto Sans KR", Arial, sans-serif;
      --font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--arctic-paper); color: var(--arctic-navy); font-family: var(--font-display); line-height: 1.6; }
    a { color: inherit; }
    button, input, select { font: inherit; }
    :focus-visible { outline: 3px solid #f2aa76; outline-offset: 3px; }
    .arctic-page main, .arctic-footer { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
    .arctic-nav { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 28px; min-height: 58px; padding: 8px 24px; border-bottom: 1px solid var(--arctic-rule); background: rgba(255,255,255,.94); backdrop-filter: blur(12px); }
    .arctic-nav nav { display: flex; gap: 4px; overflow-x: auto; white-space: nowrap; }
    .arctic-nav a { padding: 7px 9px; text-decoration: none; font-size: 12px; }
    .arctic-brand { font-family: var(--font-mono); font-weight: 700; letter-spacing: .08em; }
    .arctic-hero { padding: 92px 0 54px; }
    .arctic-hero h1 { max-width: 930px; margin: 10px 0 24px; font-size: clamp(3rem, 8vw, 7rem); letter-spacing: -.075em; line-height: .94; }
    .arctic-hero em { color: var(--arctic-copper-dark); font-style: normal; }
    .arctic-kicker, .card-tag, .auto-badge { color: var(--arctic-copper-dark); font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .12em; }
    .hero-deck { max-width: 760px; color: var(--arctic-muted); font-size: 16px; }
    .hero-sources { color: var(--arctic-muted); font-family: var(--font-mono); font-size: 9px; }
    .arctic-section { padding-top: 108px; }
    .arctic-section-head { max-width: 930px; margin-bottom: 34px; }
    .arctic-section-head h2 { margin: 0; font-size: clamp(2rem, 4.2vw, 3.6rem); letter-spacing: -.06em; line-height: 1.05; }
    .arctic-conclusion { margin-top: 22px; padding: 15px 18px; border-left: 3px solid var(--arctic-copper); background: #fbf4ef; color: #654f44; }
    .metric-row, .country-grid, .energy-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .research-grid, .chart-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
    .research-card, .data-card, .research-metric, .country-grid article, .sanctions-watch { padding: 24px; border: 1px solid var(--arctic-rule); border-radius: 7px; background: var(--arctic-white); }
    .comparison-scroll { overflow-x: auto; }
    .comparison-table { min-width: 780px; width: 100%; border-collapse: collapse; }
    .comparison-table th, .comparison-table td { padding: 18px 15px; border-bottom: 1px solid var(--arctic-rule); text-align: left; vertical-align: top; }
    .timeline { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 0; list-style: none; }
    .arctic-footer { margin-top: 112px; padding: 30px 0 45px; border-top: 1px solid var(--arctic-rule); color: var(--arctic-muted); font-size: 10px; }
    @media (max-width: 760px) {
      .arctic-page main, .arctic-footer { width: min(100% - 28px, 650px); }
      .arctic-nav { align-items: flex-start; flex-direction: column; gap: 6px; padding: 12px 14px; }
      .arctic-nav nav { width: 100%; }
      .metric-row, .country-grid, .energy-grid, .research-grid, .chart-grid, .timeline { grid-template-columns: 1fr; }
      .arctic-hero { padding-top: 62px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
    @media print {
      .arctic-nav, .year-tabs { display: none !important; }
      body { background: #fff; }
      .arctic-section { break-inside: avoid; padding-top: 48px; }
    }
  </style>
</head>
<body>
  <!-- WebEditor: keep every data-bind and data-region attribute to preserve automatic updates. -->
  <div class="arctic-page">
    <header class="arctic-nav">
      <a class="arctic-brand" href="#overview">ARCTIC / YAMAL</a>
      <nav aria-label="연구 섹션">
        <a href="#overview">개요</a><a href="#intro">01 · 왜 북극인가</a><a href="#yamal">02 · YAMAL</a>
        <a href="#usa">03 · 미국</a><a href="#compare">04 · 비교</a><a href="#korea">05 · 한국</a>
        <a href="https://steel-signal.vercel.app/steel/">STEEL SIGNAL ↗</a>
      </nav>
    </header>
    <main>
      <section class="arctic-hero" id="overview">
        <p class="arctic-kicker">2022150047 · 홍수현 · RESEARCH DASHBOARD</p>
        <h1>북극 에너지 패권,<br>이미 <em>결정</em>됐는가?</h1>
        <p class="hero-deck">YAMAL LNG의 지정학적 위력은 어디서 비롯되며, 미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가 — 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.</p>
        <p class="hero-sources">SOURCE · USGS 2008 / Arctic Council / EIA / OFAC / EU / NSIDC / CHNL / DOE</p>
      </section>
      <section class="source-strip" aria-label="자동 데이터 갱신 상태"></section>
      <section class="hegemony-card" aria-labelledby="hegemony-title"></section>
      <section class="arctic-section" id="intro"><header class="arctic-section-head"><p class="arctic-kicker">01 · INTRODUCTION</p><h2>왜 북극인가</h2></header></section>
      <section class="arctic-section" id="yamal"><header class="arctic-section-head"><p class="arctic-kicker">02 · YAMAL LNG PROJECT</p><h2>서방의 포위망을 뚫는 지정학적 송곳</h2></header></section>
      <section class="arctic-section" id="usa"><header class="arctic-section-head"><p class="arctic-kicker">03 · US ARCTIC STRATEGY</p><h2>제재의 선택성, 그리고 북극 삼각 거점</h2></header></section>
      <section class="arctic-section" id="compare"><header class="arctic-section-head"><p class="arctic-kicker">04 · 4A FRAMEWORK</p><h2>YAMAL vs 미국 북극 개발</h2></header></section>
      <section class="arctic-section" id="korea"><header class="arctic-section-head"><p class="arctic-kicker">05 · KOREA'S POSITION</p><h2>한국의 전략적 선택 2027–2033</h2></header></section>
    </main>
    <footer class="arctic-footer"><strong>2022150047 홍수현</strong><p>공개 통계와 연구 해석을 구분해 읽어주세요. 투자·법률 자문이 아닙니다.</p></footer>
  </div>
</body>
</html>
```

Replace the six research-section shells in the code block with the exact Korean text, figures, table rows, badges, and source disclaimers from `app/components/ArcticResearchDashboard.tsx:147-156`. Convert React components to semantic HTML using this fixed mapping: `SectionHead` becomes a section header plus `.arctic-conclusion`, `Metric` becomes `.research-metric`, `ManualBars` becomes `.manual-bars`, `EnergyCard` becomes `.data-card`, `SanctionsWatch` becomes `.sanctions-watch`, and the JSX comparison array becomes `.comparison-table`. Copy rules `app/arctic.css:35-170` into `#arctic-styles`, replacing both Next.js font variables with `--font-display` and `--font-mono`. Confirm the final fallback DOM contains every `h3` and `h4` emitted by `ArcticResearchDashboard` and renders every paragraph with JavaScript disabled.

- [ ] **Step 4: Add the focused package script**

Modify the `scripts` block in `package.json` so it contains:

```json
"test:unit": "node --test tests/arctic-data.test.mjs",
"test:webeditor": "node --test tests/webeditor-export.test.mjs",
"test:pages": "npm run build:pages && node --test tests/pages-build.test.mjs tests/pages-workflow.test.mjs",
"test": "npm run test:unit && npm run test:webeditor && npm run build && node --test tests/rendered-html.test.mjs"
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
npm run test:webeditor
```

Expected: 1 test passes, 0 fails.

- [ ] **Step 6: Commit the static artifact**

```bash
git add package.json tests/webeditor-export.test.mjs webeditor/arctic-dashboard.html
git commit -m "feat: add standalone WebEditor Arctic dashboard"
```

---

### Task 2: Validated live-data runtime and offline snapshot

**Files:**
- Modify: `tests/webeditor-export.test.mjs`
- Modify: `webeditor/arctic-dashboard.html`

**Interfaces:**
- Consumes: Public schema documented in `app/lib/arctic-data.mjs`; snapshot values in `app/data/arctic-fallback.ts`.
- Produces: embedded `#arctic-fallback` JSON; inline `#arctic-runtime` JavaScript; functions `validatePayload(value): object`, `setMode(mode): void`, `renderDashboard(data): void`, `renderLinePlot(target, points, label): void`, `loadLatest(): Promise<void>`; stable `data-bind` and `data-region` targets.

- [ ] **Step 1: Add failing tests for the snapshot, safe runtime, and bindings**

Append these helpers and test to `tests/webeditor-export.test.mjs`:

```js
function extractScript(html, id) {
  const match = html.match(new RegExp(`<script id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(match, `missing script #${id}`);
  return match[1].trim();
}

test("embeds a validated fallback and safely refreshes the public data contract", async () => {
  const html = await readExport();
  const fallback = JSON.parse(extractScript(html, "arctic-fallback"));
  const runtime = extractScript(html, "arctic-runtime");

  assert.equal(fallback.schemaVersion, 1);
  assert.deepEqual(Object.keys(fallback.sources).sort(), ["eia", "eu", "nsidc", "ofac"]);
  assert.equal(fallback.energy.usLngExports.length, 12);
  assert.equal(fallback.sanctions.watchlist.length, 4);
  assert.deepEqual(fallback.seaIce.latest, fallback.seaIce.daily.at(-1));

  assert.match(runtime, /https:\/\/raw\.githubusercontent\.com\/suhyeonhong-bit\/ToSuhyeon\/main\/data\/processed\/arctic_dashboard\.json/);
  assert.match(runtime, /cache:\s*["']no-store["']/);
  assert.match(runtime, /new AbortController\(\)/);
  assert.match(runtime, /10_000/);
  assert.match(runtime, /function validatePayload\(/);
  assert.match(runtime, /function renderDashboard\(/);
  assert.match(runtime, /textContent/);
  assert.match(runtime, /createElement/);
  assert.doesNotMatch(runtime, /\.innerHTML\s*=/);
  assert.doesNotMatch(html, /EIA_API_KEY|NEXT_PUBLIC_|VITE_/);
  assert.doesNotThrow(() => new Function(runtime));

  for (const binding of [
    "mode.label",
    "generatedAt",
    "energy.usLngExports.latest.value",
    "energy.usDryGasProduction.latest.value",
    "energy.henryHub.latest.value",
    "seaIce.latest.extent",
  ]) {
    assert.match(html, new RegExp(`data-bind=["']${binding}["']`));
  }
  for (const region of ["sources", "energy.usLngExports", "energy.usDryGasProduction", "energy.henryHub", "sanctions.watchlist", "seaIce.chart"]) {
    assert.match(html, new RegExp(`data-region=["']${region.replaceAll(".", "\\.")}["']`));
  }
  for (const state of ["내장 스냅샷", "최신 데이터 확인 중", "실시간 공개 JSON", "업데이트 지연 · 내장 스냅샷"]) {
    assert.match(html, new RegExp(state));
  }
});
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
npm run test:webeditor
```

Expected: the first test passes and the second fails with `missing script #arctic-fallback`.

- [ ] **Step 3: Embed the normalized fallback and stable DOM targets**

Generate the normalized snapshot from the checked-in TypeScript source with this exact read-only command:

```bash
node --input-type=module -e 'import { ARCTIC_FALLBACK } from "./app/data/arctic-fallback.ts"; console.log(JSON.stringify(ARCTIC_FALLBACK))'
```

Insert the command's single complete JSON line immediately before `#arctic-runtime` using this wrapper:

```html
<script id="arctic-fallback" type="application/json">{"schemaVersion":1,"generatedAt":"2026-08-04T05:27:21Z","sources":{"eia":{"status":"fresh","hasData":true,"lastAttemptAt":"2026-08-04T05:26:16Z","lastSuccessAt":"2026-08-04T05:26:16Z","dataThrough":"2027","url":"https://www.eia.gov/outlooks/steo/","contentHash":"sha256:e68d93bf8d021966489276809f8063947db5a1a89b29adf43d7425b33c6c2eb1","edition":"2026-08"},"ofac":{"status":"fresh","hasData":true,"lastAttemptAt":"2026-08-04T05:27:21Z","lastSuccessAt":"2026-08-04T05:27:21Z","dataThrough":"2026-08-04","url":"https://ofac.treasury.gov/sanctions-list-service","contentHash":"sha256:42ac662c72d2a5337a9d0d8fb2d213bec86c35e20d01b5447d2bcc22fa71c4ae"},"eu":{"status":"fresh","hasData":true,"lastAttemptAt":"2026-08-04T05:27:21Z","lastSuccessAt":"2026-08-04T05:27:21Z","dataThrough":"2026-07-31","url":"https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions?locale=en","contentHash":"sha256:094fa61d2766d3dc9c0752dd3aedc09cd1401a068e11e3f4a0901a272da968d1"},"nsidc":{"status":"fresh","hasData":true,"lastAttemptAt":"2026-08-04T05:27:21Z","lastSuccessAt":"2026-08-04T05:27:21Z","dataThrough":"2026-08-02","url":"https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv","contentHash":"sha256:ad8f8a7a9e4384a0107a13933b551228eacf0f55c1aa653e12d4b2d230dcdcef"}},"energy":{"usLngExports":[{"period":"2016","value":0.51049440164,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2017","value":1.938471011,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2018","value":2.9674461699,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2019","value":4.9850602137,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2020","value":6.5299534399,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2021","value":9.7556656767,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2022","value":10.590803704,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2023","value":11.898703219,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2024","value":11.932158265,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2025","value":15.093106573,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2026","value":17.411451378,"unit":"billion cubic feet per day","kind":"forecast","source":"EIA STEO"},{"period":"2027","value":18.614648909,"unit":"billion cubic feet per day","kind":"forecast","source":"EIA STEO"}],"usDryGasProduction":[{"period":"2016","value":72.656038251,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2017","value":74.90569589,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2018","value":84.313065753,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2019","value":92.874016438,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2020","value":92.380114754,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2021","value":94.600742466,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2022","value":99.328594521,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2023","value":103.15734795,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2024","value":103.07356557,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2025","value":107.65447397,"unit":"billion cubic feet per day","kind":"actual","source":"EIA STEO"},{"period":"2026","value":111.24731507,"unit":"billion cubic feet per day","kind":"forecast","source":"EIA STEO"},{"period":"2027","value":115.30405808,"unit":"billion cubic feet per day","kind":"forecast","source":"EIA STEO"}],"henryHub":[{"period":"2016","value":2.5149166667,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2017","value":2.9865,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2018","value":3.1664166667,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2019","value":2.5650833333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2020","value":2.0333333333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2021","value":3.9083333333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2022","value":6.4183333333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2023","value":2.5358333333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2024","value":2.1933333333,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2025","value":3.5266666667,"unit":"dollars per million Btu","kind":"actual","source":"EIA STEO"},{"period":"2026","value":3.6699643333,"unit":"dollars per million Btu","kind":"forecast","source":"EIA STEO"},{"period":"2027","value":3.4903939167,"unit":"dollars per million Btu","kind":"forecast","source":"EIA STEO"}]},"sanctions":{"watchlist":[{"id":"novatek","label":"NOVATEK","ofac":{"listed":false,"matches":[]},"eu":{"listed":false,"matches":[]}},{"id":"yamal-lng","label":"Yamal LNG","ofac":{"listed":false,"matches":[]},"eu":{"listed":false,"matches":[]}},{"id":"leonid-mikhelson","label":"Leonid Mikhelson","ofac":{"listed":false,"matches":[]},"eu":{"listed":false,"matches":[]}},{"id":"gennady-timchenko","label":"Gennady Timchenko","ofac":{"listed":true,"matches":[{"officialName":"TIMCHENKO, Gennady Nikolayevich","list":"SDN","programs":["RUSSIA-EO14024","UKRAINE-EO13661"],"officialId":"16666"}]},"eu":{"listed":true,"matches":[{"officialName":"Gennady Nikolayevich TIMCHENKO","list":"EU Consolidated Financial Sanctions List","programs":["UKR"],"officialId":"EU.7536.45"}]}}]},"seaIce":{"latest":{"date":"2026-08-02","extent":6.479,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},"daily":[{"date":"2026-07-22","extent":7.111,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-23","extent":7.029,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-24","extent":6.972,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-25","extent":6.832,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-26","extent":6.787,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-27","extent":6.683,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-28","extent":6.565,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-29","extent":6.544,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-30","extent":6.507,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-07-31","extent":6.526,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-08-01","extent":6.495,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"},{"date":"2026-08-02","extent":6.479,"unit":"10^6 sq km","missing":0,"source":"NSIDC Sea Ice Index v4"}]}}</script>
```

Add the following stable targets to the corresponding fallback cards:

```html
<strong data-bind="mode.label">내장 스냅샷</strong>
<time data-bind="generatedAt" datetime="2026-08-04T05:27:21Z">2026. 08. 04.</time>
<ul data-region="sources"></ul>
<article class="data-card" data-region="energy.usLngExports"><strong data-bind="energy.usLngExports.latest.value">18.61</strong></article>
<article class="data-card" data-region="energy.usDryGasProduction"><strong data-bind="energy.usDryGasProduction.latest.value">115.30</strong></article>
<article class="data-card" data-region="energy.henryHub"><strong data-bind="energy.henryHub.latest.value">3.49</strong></article>
<div class="watch-grid" data-region="sanctions.watchlist"></div>
<strong data-bind="seaIce.latest.extent">6.479</strong>
<div class="line-plot" data-region="seaIce.chart"></div>
```

- [ ] **Step 4: Implement validation, rendering, and network fallback**

Add one classic script with `id="arctic-runtime"`. Its outer contract must be:

```html
<script id="arctic-runtime">
(() => {
  "use strict";
  const DATA_URL = "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/arctic_dashboard.json";
  const SOURCE_KEYS = ["eia", "ofac", "eu", "nsidc"];
  const ENERGY_KEYS = ["usLngExports", "usDryGasProduction", "henryHub"];
  const MODES = {
    snapshot: "내장 스냅샷",
    checking: "최신 데이터 확인 중",
    live: "실시간 공개 JSON",
    fallback: "업데이트 지연 · 내장 스냅샷",
  };
  const fallback = JSON.parse(document.getElementById("arctic-fallback").textContent);

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function requireCondition(condition) {
    if (!condition) throw new Error("invalid-arctic-data");
  }

  function validatePayload(value) {
    requireCondition(isRecord(value) && value.schemaVersion === 1);
    requireCondition(typeof value.generatedAt === "string" && Number.isFinite(Date.parse(value.generatedAt)));
    requireCondition(isRecord(value.sources) && SOURCE_KEYS.every((key) => isRecord(value.sources[key])));
    requireCondition(isRecord(value.energy) && ENERGY_KEYS.every((key) => Array.isArray(value.energy[key])));
    for (const key of ENERGY_KEYS) {
      let previous = "";
      for (const point of value.energy[key]) {
        requireCondition(isRecord(point) && /^\d{4}$/.test(point.period) && point.period > previous);
        requireCondition(Number.isFinite(point.value) && typeof point.unit === "string");
        requireCondition(point.kind === "actual" || point.kind === "forecast");
        previous = point.period;
      }
    }
    requireCondition(isRecord(value.sanctions) && Array.isArray(value.sanctions.watchlist));
    requireCondition(isRecord(value.seaIce) && Array.isArray(value.seaIce.daily));
    if (value.seaIce.daily.length === 0) requireCondition(value.seaIce.latest === null);
    if (value.seaIce.daily.length > 0) {
      requireCondition(JSON.stringify(value.seaIce.latest) === JSON.stringify(value.seaIce.daily.at(-1)));
    }
    return structuredClone(value);
  }

  function setText(binding, value) {
    const target = document.querySelector(`[data-bind="${binding}"]`);
    if (target) target.textContent = String(value);
  }

  function setMode(mode) {
    document.documentElement.dataset.dataMode = mode;
    setText("mode.label", MODES[mode]);
  }

  function renderLinePlot(target, points, label) {
    if (!target || points.length < 2) return;
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 400 175");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
    const values = points.map((point) => point.value ?? point.extent);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coordinates = points.map((point, index) => {
      const value = point.value ?? point.extent;
      return `${20 + (index / (points.length - 1)) * 360},${155 - ((value - min) / span) * 120}`;
    }).join(" ");
    const line = document.createElementNS(namespace, "polyline");
    line.setAttribute("points", coordinates);
    line.setAttribute("fill", "none");
    line.setAttribute("class", "plot-actual");
    svg.append(line);
    target.replaceChildren(svg);
  }

  function renderDashboard(data) {
    setText("generatedAt", new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(data.generatedAt)));
    for (const key of ENERGY_KEYS) {
      const points = data.energy[key];
      if (points.length) setText(`energy.${key}.latest.value`, points.at(-1).value.toFixed(2));
      renderLinePlot(document.querySelector(`[data-region="energy.${key}"] .line-plot`), points, `${key} 실적과 전망 추이`);
    }
    if (data.seaIce.latest) setText("seaIce.latest.extent", data.seaIce.latest.extent.toFixed(3));
    renderLinePlot(document.querySelector('[data-region="seaIce.chart"]'), data.seaIce.daily.slice(-120), "NSIDC 북극 해빙 면적 최근 추이");
    renderSources(data.sources);
    renderSanctions(data.sanctions.watchlist);
  }

  function renderSources(sources) {
    const region = document.querySelector('[data-region="sources"]');
    if (!region) return;
    const fragment = document.createDocumentFragment();
    for (const key of SOURCE_KEYS) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = sources[key].url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = key.toUpperCase();
      const status = document.createElement("span");
      status.textContent = `${sources[key].status === "fresh" ? "최신" : "업데이트 지연"} · ${sources[key].dataThrough ?? "—"}`;
      item.append(link, status);
      fragment.append(item);
    }
    region.replaceChildren(fragment);
  }

  function renderSanctions(watchlist) {
    const region = document.querySelector('[data-region="sanctions.watchlist"]');
    if (!region) return;
    const fragment = document.createDocumentFragment();
    for (const item of watchlist) {
      const card = document.createElement("article");
      const heading = document.createElement("h4");
      heading.textContent = item.label;
      card.append(heading);
      for (const key of ["ofac", "eu"]) {
        const row = document.createElement("p");
        row.textContent = `${key.toUpperCase()} · ${item[key].listed ? "직접 등재 확인" : "직접 등재 확인 안 됨"}`;
        card.append(row);
      }
      fragment.append(card);
    }
    region.replaceChildren(fragment);
  }

  async function loadLatest() {
    setMode("checking");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(DATA_URL, { cache: "no-store", signal: controller.signal });
      requireCondition(response.ok);
      const data = validatePayload(await response.json());
      renderDashboard(data);
      setMode("live");
    } catch {
      renderDashboard(validatePayload(fallback));
      setMode("fallback");
      console.warn("Arctic dashboard update delayed; embedded snapshot retained.");
    } finally {
      clearTimeout(timeout);
    }
  }

  renderDashboard(validatePayload(fallback));
  loadLatest();
})();
</script>
```

Complete `validatePayload` with these exact acceptance rules from `app/lib/arctic-data.mjs:14-113`: the top-level keys must equal `schemaVersion,generatedAt,sources,energy,sanctions,seaIce`; all timestamps must match `YYYY-MM-DDTHH:mm:ssZ`; every source must have only `status,hasData,lastAttemptAt,lastSuccessAt,dataThrough,url,contentHash` while EIA additionally has `edition`; URLs must start with `https://`; populated sources require a `sha256:` plus 64 lowercase hexadecimal characters; every energy point must have only `period,value,unit,kind,source`, be strictly ordered by year, keep one unit per series, and use source `EIA STEO`; the watchlist must contain exactly `novatek,yamal-lng,leonid-mikhelson,gennady-timchenko` in that order and validate both OFAC and EU match records; every sea-ice point must use `10^6 sq km`, source `NSIDC Sea Ice Index v4`, a finite extent and missing value, and strictly increasing dates; `seaIce.latest` must equal the last daily point. Return a structured clone only after every rule passes. Keep the runtime self-contained and do not import the application module.

- [ ] **Step 5: Run the focused tests and verify both pass**

Run:

```bash
npm run test:webeditor
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 6: Commit the live-data runtime**

```bash
git add tests/webeditor-export.test.mjs webeditor/arctic-dashboard.html
git commit -m "feat: refresh WebEditor Arctic data safely"
```

---

### Task 3: Research interaction, chart semantics, and editing resilience

**Files:**
- Modify: `tests/webeditor-export.test.mjs`
- Modify: `webeditor/arctic-dashboard.html`

**Interfaces:**
- Consumes: Static hegemony values from `app/components/ArcticResearchDashboard.tsx:28-32`; DOM and runtime contracts from Tasks 1–2.
- Produces: three `.year-tab` buttons with `data-year`; `selectHegemonyYear(year): void`; `data-bind` targets for the gauge percentages and note; accessible line-chart classes for actual and forecast segments; a top-of-file editing-safety comment.

- [ ] **Step 1: Add a failing interaction and resilience test**

Append this test to `tests/webeditor-export.test.mjs`:

```js
test("keeps researcher scenarios interactive and WebEditor-safe", async () => {
  const html = await readExport();
  const runtime = extractScript(html, "arctic-runtime");

  for (const year of [2025, 2027, 2033]) {
    assert.match(html, new RegExp(`data-year=["']${year}["']`));
  }
  assert.match(html, /aria-pressed="true"/);
  assert.match(runtime, /function selectHegemonyYear\(/);
  assert.match(runtime, /addEventListener\(["']click["']/);
  assert.match(runtime, /setAttribute\(["']aria-pressed["']/);
  assert.match(html, /data-bind="hegemony\.russia"/);
  assert.match(html, /data-bind="hegemony\.usa"/);
  assert.match(html, /data-bind="hegemony\.note"/);
  assert.match(html, /연구자 추정 · 자동 갱신 아님/);
  assert.match(html, /WebEditor:[^\n]+data-bind[^\n]+data-region/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="EIA 실적과 전망 범례"/);
  assert.match(html, /tabindex="0"[^>]+aria-label="4A 비교표 가로 스크롤"/);
});
```

- [ ] **Step 2: Run the test and verify the missing interaction fails**

Run:

```bash
npm run test:webeditor
```

Expected: 2 tests pass and the third fails because `data-year="2025"` or `selectHegemonyYear` is missing.

- [ ] **Step 3: Implement the hegemony control and editing-safety contract**

Use this markup inside `.hegemony-card`:

```html
<div class="hegemony-top">
  <div><p class="arctic-kicker">RESEARCH SCENARIO</p><h2 id="hegemony-title">Arctic LNG 패권 지수</h2></div>
  <div class="year-tabs" aria-label="패권 지수 연구 연도">
    <button class="year-tab" type="button" data-year="2025" aria-pressed="true">2025</button>
    <button class="year-tab" type="button" data-year="2027" aria-pressed="false">2027</button>
    <button class="year-tab" type="button" data-year="2033" aria-pressed="false">2033</button>
  </div>
</div>
<div class="gauge-labels"><span>RUSSIA · YAMAL <b data-bind="hegemony.russia">78%</b></span><span><b data-bind="hegemony.usa">22%</b> USA · ALASKA</span></div>
<div class="gauge-track" aria-hidden="true"><span class="gauge-russia" style="width:78%"></span><span class="gauge-usa" style="width:22%"></span></div>
<p class="gauge-note" aria-live="polite" data-bind="hegemony.note"><b>2025년.</b> YAMAL은 연 1,970만 톤을 실제 수출 중이며 Arc7 쇄빙선 16척으로 유럽·아시아 양방향 공급이 가능하다. Alaska LNG는 FID 미확정, 생산 미개시 상태다.</p>
<p class="method-note">연구자 추정 · 자동 갱신 아님 — 생산·접근성·제재·프로젝트 실현 단계에 대한 정성 평가를 100으로 환산한 지수</p>
```

Place this comment directly below `<body>` on one line so WebEditor users see the preservation rule in code view:

```html
<!-- WebEditor: preserve data-bind and data-region attributes; they connect visible elements to safe automatic updates. -->
```

Add the scenario logic inside `#arctic-runtime` before `loadLatest()`:

```js
const HEGEMONY = {
  2025: { ru: 78, us: 22, note: "YAMAL은 연 1,970만 톤을 실제 수출 중이며 Arc7 쇄빙선 16척으로 유럽·아시아 양방향 공급이 가능하다. Alaska LNG는 FID 미확정, 생산 미개시 상태다." },
  2027: { ru: 60, us: 40, note: "EU 제재 시행을 전제로 YAMAL의 유럽 접근성이 약화되고 공급망이 이동한다는 조건부 연구 시나리오다." },
  2033: { ru: 48, us: 52, note: "Alaska LNG 생산 개시와 북태평양 직항 공급망이 실현된다는 가정 아래 미국이 근소하게 앞서는 조건부 연구 시나리오다." },
};

function selectHegemonyYear(year) {
  const selected = HEGEMONY[year];
  if (!selected) return;
  setText("hegemony.russia", `${selected.ru}%`);
  setText("hegemony.usa", `${selected.us}%`);
  setText("hegemony.note", `${year}년. ${selected.note}`);
  document.querySelector(".gauge-russia").style.width = `${selected.ru}%`;
  document.querySelector(".gauge-usa").style.width = `${selected.us}%`;
  for (const button of document.querySelectorAll(".year-tab")) {
    button.setAttribute("aria-pressed", String(button.dataset.year === String(year)));
  }
}

for (const button of document.querySelectorAll(".year-tab")) {
  button.addEventListener("click", () => selectHegemonyYear(Number(button.dataset.year)));
}
```

- [ ] **Step 4: Complete chart and comparison accessibility**

Split EIA plot coordinates into actual and forecast polylines, carrying the last actual point into the forecast sequence. Use `.plot-actual` for the solid line and `.plot-forecast` for the dashed line. Add this visible legend after every energy SVG:

```html
<div class="chart-legend" role="img" aria-label="EIA 실적과 전망 범례">
  <span><i class="solid" aria-hidden="true"></i>실적</span>
  <span><i class="dash" aria-hidden="true"></i>EIA 전망</span>
</div>
```

Use this comparison wrapper exactly:

```html
<div class="comparison-scroll" tabindex="0" aria-label="4A 비교표 가로 스크롤">
  <table class="comparison-table">
    <caption>YAMAL과 Alaska의 4A 비교</caption>
  </table>
</div>
```

- [ ] **Step 5: Run the focused tests and verify all three pass**

Run:

```bash
npm run test:webeditor
```

Expected: 3 tests pass, 0 fail.

- [ ] **Step 6: Commit interaction and accessibility**

```bash
git add tests/webeditor-export.test.mjs webeditor/arctic-dashboard.html
git commit -m "feat: preserve WebEditor dashboard interactions"
```

---

### Task 4: Regression, browser, and WebEditor verification

**Files:**
- Modify only if verification exposes a defect: `tests/webeditor-export.test.mjs`
- Modify only if verification exposes a defect: `webeditor/arctic-dashboard.html`

**Interfaces:**
- Consumes: completed standalone artifact and all prior test contracts.
- Produces: verified standalone file that opens in WebEditor, displays the fallback immediately, refreshes the public JSON, and leaves production application code unchanged.

- [ ] **Step 1: Verify the artifact is a single portable HTML file**

Run:

```bash
find webeditor -maxdepth 1 -type f -print
rg -n '<script[^>]+src=|<link[^>]+stylesheet|EIA_API_KEY|NEXT_PUBLIC_|VITE_' webeditor/arctic-dashboard.html
```

Expected: `find` prints only `webeditor/arctic-dashboard.html`; `rg` exits 1 with no matches.

- [ ] **Step 2: Run the complete local regression suite**

Run:

```bash
npm test
npm run test:pages
npm run lint
npm run build:vercel
```

Expected: every command exits 0; WebEditor tests report 3 passing tests; existing Arctic root and `/steel/` rendered/page tests remain green.

- [ ] **Step 3: Serve the file and verify browser behavior at desktop and mobile widths**

Run a local static server from the repository root:

```bash
python3 -m http.server 4174
```

Open `http://127.0.0.1:4174/webeditor/arctic-dashboard.html` in the browser. Verify at 1440×1000 and 390×844:

- the full fallback research copy appears before the remote request settles;
- the data mode becomes `실시간 공개 JSON` when the public JSON succeeds;
- all six nav links move to the correct section;
- the 2025·2027·2033 buttons update both percentages, widths, note, and `aria-pressed`;
- actual and forecast lines remain distinguishable;
- cards collapse to one column and the comparison table remains horizontally scrollable at 390px;
- the console contains no uncaught exception, mixed-content warning, or failed local-asset request.

Stop the server with `Ctrl-C` after verification.

- [ ] **Step 4: Verify fallback behavior without changing production code**

In browser request interception, abort only the exact public JSON URL and reload the local page. Verify the document keeps the embedded values, displays `업데이트 지연 · 내장 스냅샷`, and has no blank energy, sanctions, or sea-ice region. Remove interception and reload once to confirm the live state returns.

- [ ] **Step 5: Import and inspect the artifact in WebEditor**

Open `https://www.webeditor.co.kr/html/`, choose `HTML 불러오기`, and upload the absolute local path:

```text
/Users/suhyeonhong/Documents/GitHub/SteelSignal/.worktrees/steel-signal-dashboard/webeditor/arctic-dashboard.html
```

Verify the editor shows the full white dashboard, the layer tree exposes nav/section/card elements, and selecting the hero title or a card exposes design controls. Open WebEditor preview and verify the hegemony buttons and data status work. Do not publish through WebEditor or overwrite the Vercel project during this verification.

- [ ] **Step 6: Inspect the final diff and commit any verification fixes**

Run:

```bash
git diff --check
git status --short
git diff -- tests/webeditor-export.test.mjs webeditor/arctic-dashboard.html package.json
```

Expected: no whitespace errors; `.superpowers/` remains untracked and unstaged; only intentional WebEditor files are present. If Steps 3–5 required a fix, repeat the failing verification first, make the smallest correction, repeat all commands in Step 2, and commit only the three scoped paths:

```bash
git add package.json tests/webeditor-export.test.mjs webeditor/arctic-dashboard.html
git commit -m "fix: verify WebEditor Arctic export"
```
