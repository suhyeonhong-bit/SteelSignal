import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the STEEL SIGNAL dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>STEEL SIGNAL/);
  assert.match(html, /금리와 철강 가격의/);
  assert.match(html, /흐름을 한눈에/);
  assert.match(html, /한국 기준금리/);
  assert.match(html, /미국 철강 PPI/);
  assert.match(html, /연준 목표금리/);
  assert.match(html, /읽는 법/);
  assert.match(html, /금리와 원자재 가격의 관계/);
  assert.match(html, /IMF 연구 원문/);
  assert.match(html, /원본에 가까운 보기/);
  assert.doesNotMatch(html, /Your site is taking shape/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("keeps the reading guide above the source-like table", async () => {
  const response = await render();
  const html = await response.text();
  const guideIndex = html.indexOf("읽는 법");
  const tableIndex = html.indexOf("원본에 가까운 보기");
  assert.ok(guideIndex >= 0 && tableIndex > guideIndex);
  assert.match(html, /연준 목표금리/);
});

test("parses the four-column monthly indicator CSV", async () => {
  const { parseIndicatorCsv } = await import(
    "../app/lib/indicator-data.mjs"
  );
  const rows = parseIndicatorCsv(
    "month,korea_base_rate_percent,us_steel_ppi_index,us_fed_target_rate_percent\n" +
      "2026-02,2.5,359.1,4.25\n" +
      "2026-01,,355.2,4.25\n",
  );

  assert.deepEqual(rows, [
    {
      month: "2026-01",
      koreaBaseRate: null,
      usSteelPpi: 355.2,
      usFedTargetRate: 4.25,
    },
    {
      month: "2026-02",
      koreaBaseRate: 2.5,
      usSteelPpi: 359.1,
      usFedTargetRate: 4.25,
    },
  ]);
});

test("keeps loading legacy three-column CSVs while Fed data rolls out", async () => {
  const { parseIndicatorCsv } = await import(
    "../app/lib/indicator-data.mjs"
  );
  const rows = parseIndicatorCsv(
    "month,korea_base_rate_percent,us_steel_ppi_index\n" +
      "2026-02,2.5,359.1\n",
  );

  assert.deepEqual(rows[0], {
    month: "2026-02",
    koreaBaseRate: 2.5,
    usSteelPpi: 359.1,
    usFedTargetRate: null,
  });
});
