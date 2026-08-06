import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const exportUrl = new URL("../webeditor/arctic-dashboard.html", import.meta.url);

async function readExport() {
  return readFile(exportUrl, "utf8");
}

function extractScript(html, id) {
  const match = html.match(new RegExp(`<script id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(match, `missing script #${id}`);
  return match[1].trim();
}

function createRuntimeHarness(html) {
  function createNode(textContent = "") {
    return {
      attributes: {},
      children: [],
      textContent,
      append(...children) {
        this.children.push(...children);
      },
      replaceChildren(...children) {
        this.children = children;
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
    };
  }

  const fallbackText = extractScript(html, "arctic-fallback");
  const bindings = new Map([
    ["mode.label", createNode("내장 스냅샷")],
    ["generatedAt", createNode("2026. 08. 04.")],
    ["energy.usLngExports.latest.value", createNode("18.61")],
    ["energy.usDryGasProduction.latest.value", createNode("115.30")],
    ["energy.henryHub.latest.value", createNode("3.49")],
    ["seaIce.latest.extent", createNode("6.479")],
  ]);
  const plots = new Map([
    ["energy.usLngExports", createNode()],
    ["energy.usDryGasProduction", createNode()],
    ["energy.henryHub", createNode()],
    ["seaIce.chart", createNode()],
  ]);
  const regions = new Map([
    ["sources", createNode()],
    ["sanctions.watchlist", createNode()],
  ]);
  const document = {
    documentElement: { dataset: {} },
    getElementById: (id) => id === "arctic-fallback" ? { textContent: fallbackText } : null,
    querySelector(selector) {
      const binding = selector.match(/^\[data-bind="(.+)"\]$/)?.[1];
      if (binding) return bindings.get(binding) ?? null;
      const plot = selector.match(/^\[data-region="(.+)"\](?: \.line-plot)?$/)?.[1];
      return plots.get(plot) ?? regions.get(plot) ?? null;
    },
    createDocumentFragment: () => createNode(),
    createElement: () => createNode(),
    createElementNS: () => createNode(),
  };
  const executable = extractScript(html, "arctic-runtime")
    .replace("(() => {", "return (() => {")
    .replace(
      "  renderDashboard(validatePayload(fallback));\n  loadLatest();",
      "  return { validatePayload, renderDashboard };",
    );
  const api = new Function("document", "structuredClone", executable)(document, structuredClone);
  return { api, bindings, fallback: JSON.parse(fallbackText), plots };
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

test("clears stale snapshot metrics and plots for valid partial live payloads", async () => {
  const harness = createRuntimeHarness(await readExport());
  const empty = structuredClone(harness.fallback);
  for (const key of ["usLngExports", "usDryGasProduction", "henryHub"]) empty.energy[key] = [];
  empty.seaIce = { latest: null, daily: [] };

  for (const plot of harness.plots.values()) plot.children = [{ stale: true }];
  harness.api.renderDashboard(harness.api.validatePayload(empty));

  for (const binding of [
    "energy.usLngExports.latest.value",
    "energy.usDryGasProduction.latest.value",
    "energy.henryHub.latest.value",
    "seaIce.latest.extent",
  ]) {
    assert.equal(harness.bindings.get(binding).textContent, "—");
  }
  for (const plot of harness.plots.values()) assert.deepEqual(plot.children, []);

  const single = structuredClone(harness.fallback);
  for (const key of ["usLngExports", "usDryGasProduction", "henryHub"]) {
    single.energy[key] = [single.energy[key][0]];
  }
  single.seaIce.daily = [single.seaIce.daily[0]];
  single.seaIce.latest = structuredClone(single.seaIce.daily[0]);
  for (const plot of harness.plots.values()) plot.children = [{ stale: true }];
  harness.api.renderDashboard(harness.api.validatePayload(single));

  assert.equal(harness.bindings.get("energy.usLngExports.latest.value").textContent, "0.51");
  assert.equal(harness.bindings.get("seaIce.latest.extent").textContent, "7.111");
  for (const plot of harness.plots.values()) assert.deepEqual(plot.children, []);
});
