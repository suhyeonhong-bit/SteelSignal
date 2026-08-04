import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Arctic research dashboard at the root", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>북극 에너지 패권/);
  assert.match(html, /property="og:image" content="https:\/\/steel-signal\.vercel\.app\/arctic-og\.png"/);
  assert.match(html, /rel="canonical" href="https:\/\/steel-signal\.vercel\.app\/"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /ARCTIC \/ YAMAL/);
  assert.match(html, /북극 에너지 패권,/);
  assert.match(html, /이미 결정됐는가/);
  assert.match(html, /연구자 추정 · 자동 갱신 아님/);
  assert.match(html, /왜 북극인가/);
  assert.match(html, /YAMAL LNG PROJECT/);
  assert.match(html, /US ARCTIC STRATEGY/);
  assert.match(html, /4A FRAMEWORK/);
  assert.match(html, /KOREA(?:'|&#x27;)S POSITION/);
  assert.match(html, /공식 명단의 직접 등재 여부만 자동 확인/);
  assert.match(html, /NSR 실제 항행 가능 일수와 동일하지 않습니다/);
  assert.match(html, /href="\.\/steel\/"/);
  assert.match(html, /href="https:\/\/www\.eia\.gov\/outlooks\/steo\/"/);
  assert.match(html, /href="https:\/\/ofac\.treasury\.gov\/sanctions-list-service"/);
  assert.match(html, /href="https:\/\/data\.europa\.eu\/data\/datasets\/consolidated-list/);
  assert.match(html, /href="https:\/\/noaadata\.apps\.nsidc\.org\/NOAA\/G02135/);
  assert.match(html, /<button[^>]+aria-pressed="true"[^>]*>2025<\/button>/);
  assert.doesNotMatch(html, /EIA_API_KEY|api_key=/);
});

test("preserves the latest STEEL SIGNAL dashboard at /steel/", async () => {
  const response = await render("/steel");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /STEEL SIGNAL/);
  assert.match(html, /금리와 철강 가격의/);
  assert.match(html, /흐름을 한눈에/);
  assert.match(html, /한국 기준금리/);
  assert.match(html, /미국 철강 PPI/);
  assert.match(html, /연준 목표금리/);
  assert.match(html, /읽는 법/);
  assert.match(html, /원본에 가까운 보기/);
});

test("parses both current and legacy monthly indicator CSVs", async () => {
  const { parseIndicatorCsv } = await import("../app/lib/indicator-data.mjs");
  const current = parseIndicatorCsv(
    "month,korea_base_rate_percent,us_steel_ppi_index,us_fed_target_rate_percent\n" +
      "2026-02,2.5,359.1,4.25\n",
  );
  assert.equal(current[0].usFedTargetRate, 4.25);

  const legacy = parseIndicatorCsv(
    "month,korea_base_rate_percent,us_steel_ppi_index\n" +
      "2026-02,2.5,359.1\n",
  );
  assert.equal(legacy[0].usFedTargetRate, null);
});
