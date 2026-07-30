import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const fallbackOrigin = "https://steel-signal.example";

async function render({
  siteOrigin,
  headers = {},
} = {}) {
  const previousSiteOrigin = process.env.SITE_ORIGIN;
  if (siteOrigin === undefined) {
    delete process.env.SITE_ORIGIN;
  } else {
    process.env.SITE_ORIGIN = siteOrigin;
  }

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  try {
    const { default: worker } = await import(workerUrl.href);
    return await worker.fetch(
      new Request("https://steel-signal.example/", {
        headers: {
          accept: "text/html",
          host: "steel-signal.example",
          "x-forwarded-host": "steel-signal.example",
          "x-forwarded-proto": "https",
          ...headers,
        },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
  } finally {
    if (previousSiteOrigin === undefined) {
      delete process.env.SITE_ORIGIN;
    } else {
      process.env.SITE_ORIGIN = previousSiteOrigin;
    }
  }
}

function assertSocialImageOrigin(html, origin) {
  const escapedOrigin = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    html,
    new RegExp(
      `<meta property="og:image" content="${escapedOrigin}/og\\.png"`,
    ),
  );
  assert.match(
    html,
    new RegExp(
      `<meta name="twitter:image" content="${escapedOrigin}/og\\.png"`,
    ),
  );
}

function readCssToken(css, token) {
  const match = css.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing --${token}`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function compositeHex(foreground, background, opacity) {
  const blend = [1, 3, 5].map((index) => {
    const foregroundChannel = Number.parseInt(
      foreground.slice(index, index + 2),
      16,
    );
    const backgroundChannel = Number.parseInt(
      background.slice(index, index + 2),
      16,
    );
    return Math.round(
      foregroundChannel * opacity + backgroundChannel * (1 - opacity),
    )
      .toString(16)
      .padStart(2, "0");
  });
  return `#${blend.join("")}`;
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
  assertSocialImageOrigin(html, fallbackOrigin);
});

test("uses the runtime canonical origin without trusting forwarding headers", async () => {
  const response = await render({
    siteOrigin: "https://dashboard.steel-signal.example/",
    headers: {
      host: "attacker.example",
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "http",
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assertSocialImageOrigin(html, "https://dashboard.steel-signal.example");
  assert.doesNotMatch(html, /attacker\.example/);
});

test("reads SITE_ORIGIN at request time", async () => {
  const firstResponse = await render({
    siteOrigin: "https://first.steel-signal.example",
  });
  assertSocialImageOrigin(
    await firstResponse.text(),
    "https://first.steel-signal.example",
  );

  const secondResponse = await render({
    siteOrigin: "https://second.steel-signal.example",
  });
  assertSocialImageOrigin(
    await secondResponse.text(),
    "https://second.steel-signal.example",
  );
});

test("uses a safe fallback for malformed settings and forwarding headers", async () => {
  const response = await render({
    siteOrigin: "https://user@attacker.example/path?rewrite=1",
    headers: {
      host: "attacker.example, steel-signal.example",
      "x-forwarded-host": "attacker.example, steel-signal.example",
      "x-forwarded-proto": "javascript, https",
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assertSocialImageOrigin(html, fallbackOrigin);
  assert.doesNotMatch(html, /attacker\.example|javascript/);
});

test("removes disposable starter assets", async () => {
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});

test("uses AA text tokens while preserving the copper chart accent", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--copper-text:\s*#[0-9a-f]{6}/i);

  const ivory = readCssToken(css, "ivory");
  const paper = readCssToken(css, "paper");
  const navy = readCssToken(css, "navy");
  const muted = readCssToken(css, "muted");
  const copperText = readCssToken(css, "copper-text");
  const blue = readCssToken(css, "blue");

  for (const [token, foreground] of [
    ["navy", navy],
    ["muted", muted],
    ["copper-text", copperText],
    ["blue", blue],
  ]) {
    for (const [surface, background] of [
      ["ivory", ivory],
      ["paper", paper],
    ]) {
      assert.ok(
        contrastRatio(foreground, background) >= 4.5,
        `--${token} must meet 4.5:1 on --${surface}`,
      );
    }
  }

  assert.equal(readCssToken(css, "copper"), "#c66e3c");
  assert.match(css, /\.eyebrow\s*\{[^}]*color:\s*var\(--copper-text\)/s);
  assert.match(css, /\.series-toggle--ppi\s*\{\s*color:\s*var\(--copper-text\)/);

  const inactiveMatch = css.match(
    /\.series-toggle\[aria-pressed="false"\]\s*\{\s*opacity:\s*([.\d]+)/,
  );
  assert.ok(inactiveMatch, "missing inactive series opacity");
  const inactiveOpacity = Number.parseFloat(inactiveMatch[1]);
  for (const foreground of [copperText, blue]) {
    assert.ok(
      contrastRatio(
        compositeHex(foreground, paper, inactiveOpacity),
        paper,
      ) >= 4.5,
      "inactive series text must meet 4.5:1 on --paper",
    );
  }
});

test("uses the STEEL SIGNAL package identity", async () => {
  const [packageJson, packageLock] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ]);
  const packageManifest = JSON.parse(packageJson);
  const lockManifest = JSON.parse(packageLock);

  assert.equal(packageManifest.name, "steel-signal-dashboard");
  assert.equal(lockManifest.name, "steel-signal-dashboard");
  assert.equal(lockManifest.packages[""].name, "steel-signal-dashboard");
});
