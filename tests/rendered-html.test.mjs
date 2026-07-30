import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("https://steel-signal.example/", {
      headers: {
        accept: "text/html",
        host: "steel-signal.example",
        "x-forwarded-host": "steel-signal.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the STEEL SIGNAL product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="ko"/i);
  assert.match(html, /<title>STEEL SIGNAL/);
  assert.match(html, /금리와 철강 가격의/);
  assert.match(html, /최신 데이터를 불러오고 있습니다/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
  assert.doesNotMatch(html, /FRED_API_KEY|ECOS_API_KEY/);
});

test("removes disposable starter assets", async () => {
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
