# STEEL SIGNAL GitHub Pages Public Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing STEEL SIGNAL dashboard at `https://suhyeonhong-bit.github.io/SteelSignal/` without changing the collector or exposing API keys.

**Architecture:** Keep the existing Vinext/Sites product build intact and add a separate Vite browser entry that mounts the same `SteelSignalDashboard` as a static single page. A public `suhyeonhong-bit/SteelSignal` repository runs a least-privilege GitHub Actions workflow that tests the product, builds `pages-dist/`, and deploys that artifact to GitHub Pages.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Recharts 3, Vitest 4, Node 22, GitHub Actions, GitHub Pages

## Global Constraints

- Keep `suhyeonhong-bit/ToSuhyeon` unchanged; it remains the collector and public CSV source.
- Do not read, copy, commit, upload, or print `.env`, `FRED_API_KEY`, `ECOS_API_KEY`, Sites source credentials, or bypass tokens.
- The Pages base path is exactly `/SteelSignal/`.
- The canonical public origin is exactly `https://suhyeonhong-bit.github.io/SteelSignal/`.
- The browser continues fetching `https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv` with `cache: "no-store"`.
- Existing loading, network error, format error, retry, cards, chart, toggles, table, and byte-exact CSV download behavior must remain unchanged.
- Existing `npm test` and `npm run lint` must remain green.
- The GitHub repository and GitHub Pages site are public; no server-side secrets are used.

---

## File Structure

- `pages/index.html`: GitHub Pages document shell and fixed public metadata.
- `pages/main.tsx`: Browser-only React mount point that reuses `SteelSignalDashboard`.
- `vite.pages.config.ts`: Isolated static Vite build with the `/SteelSignal/` base path.
- `tests/pages-build.test.mjs`: Artifact contract tests for metadata, assets, CSV URL, and secret/starter absence.
- `.github/workflows/deploy-pages.yml`: Test, build, upload, and Pages deployment workflow.
- `package.json`: Adds `build:pages` and `test:pages` scripts.
- `.gitignore`: Ignores the generated `pages-dist/` directory.

---

### Task 1: Add and Verify the Static GitHub Pages Build

**Files:**
- Create: `pages/index.html`
- Create: `pages/main.tsx`
- Create: `vite.pages.config.ts`
- Create: `tests/pages-build.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `SteelSignalDashboard(): JSX.Element`, `app/globals.css`, and `public/og.png`.
- Produces: `npm run build:pages`, `npm run test:pages`, and deployable `pages-dist/`.

- [ ] **Step 1: Add the failing Pages artifact contract test**

Create `tests/pages-build.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const output = new URL("../pages-dist/", import.meta.url);
const outputPath = fileURLToPath(output);
const canonical = "https://suhyeonhong-bit.github.io/SteelSignal/";
const csvUrl =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv";

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

test("builds the Korean product shell for the SteelSignal project path", async () => {
  const html = await readFile(new URL("index.html", output), "utf8");
  assert.match(html, /<html[^>]*lang="ko"/i);
  assert.match(html, /<title>STEEL SIGNAL \| 금리와 철강 가격의 흐름<\/title>/);
  assert.match(html, new RegExp(`<link[^>]+href="${canonical}"[^>]+rel="canonical"|<link[^>]+rel="canonical"[^>]+href="${canonical}"`));
  assert.match(html, /https:\/\/suhyeonhong-bit\.github\.io\/SteelSignal\/og\.png/);
  assert.match(html, /(?:src|href)="\/SteelSignal\/[^"]+"/);
  assert.doesNotMatch(html, /steel-signal\.example|chatgpt\.site/i);
});

test("ships the social card and exact public CSV runtime URL", async () => {
  const og = await stat(path.join(outputPath, "og.png"));
  assert.ok(og.size > 0);

  const files = await walk(outputPath);
  const textFiles = files.filter((file) => /\.(?:html|js|css)$/.test(file));
  const contents = (
    await Promise.all(textFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.match(contents, new RegExp(csvUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(
    contents,
    /FRED_API_KEY|ECOS_API_KEY|art_v1_|OAI-Sites-Authorization|codex-preview|Your site is taking shape/i,
  );
});

test("does not place local configuration or source-control data in the artifact", async () => {
  const files = (await walk(outputPath)).map((file) =>
    path.relative(outputPath, file),
  );
  assert.equal(files.some((file) => /(^|\/)\.env(?:\.|$)/.test(file)), false);
  assert.equal(files.some((file) => /(^|\/)\.git(?:\/|$)/.test(file)), false);
  assert.equal(files.some((file) => /(^|\/)node_modules(?:\/|$)/.test(file)), false);
});
```

- [ ] **Step 2: Add a temporary test script and verify RED**

In `package.json`, add:

```json
"test:pages": "node --test tests/pages-build.test.mjs"
```

Run:

```bash
npm run test:pages
```

Expected: FAIL with `ENOENT` because `pages-dist/index.html` does not exist.

- [ ] **Step 3: Add the static HTML entry**

Create `pages/index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>STEEL SIGNAL | 금리와 철강 가격의 흐름</title>
    <meta
      name="description"
      content="한국 기준금리와 미국 철강 생산자물가지수의 최신 값과 5년 흐름을 한눈에 확인하세요."
    />
    <link
      rel="canonical"
      href="https://suhyeonhong-bit.github.io/SteelSignal/"
    />
    <meta property="og:title" content="STEEL SIGNAL" />
    <meta
      property="og:description"
      content="금리와 철강 가격의 흐름을 한눈에"
    />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta
      property="og:url"
      content="https://suhyeonhong-bit.github.io/SteelSignal/"
    />
    <meta
      property="og:image"
      content="https://suhyeonhong-bit.github.io/SteelSignal/og.png"
    />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="STEEL SIGNAL" />
    <meta
      name="twitter:description"
      content="금리와 철강 가격의 흐름을 한눈에"
    />
    <meta
      name="twitter:image"
      content="https://suhyeonhong-bit.github.io/SteelSignal/og.png"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/pages/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Add the browser-only React mount point**

Create `pages/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SteelSignalDashboard } from "../app/components/SteelSignalDashboard";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("STEEL SIGNAL root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <SteelSignalDashboard />
  </StrictMode>,
);
```

- [ ] **Step 5: Add the isolated Vite Pages configuration**

Create `vite.pages.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/SteelSignal/",
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: "pages-dist",
  },
  root: ".",
});
```

- [ ] **Step 6: Add production scripts and ignore generated output**

In `package.json`, add:

```json
"build:pages": "vite build --config vite.pages.config.ts",
"test:pages": "npm run build:pages && node --test tests/pages-build.test.mjs",
"lint": "eslint . --ignore-pattern dist --ignore-pattern .next --ignore-pattern pages-dist"
```

Append to `.gitignore`:

```gitignore
/pages-dist/
```

- [ ] **Step 7: Run focused GREEN and full regression checks**

Run:

```bash
npm run test:pages
npm test
npm run lint
git diff --check
```

Expected:

- Pages build succeeds and all 3 Pages artifact tests pass.
- Existing 22 unit tests, Vinext build, and 7 rendered tests pass.
- ESLint and diff checks pass.

- [ ] **Step 8: Commit Task 1**

```bash
git add .gitignore package.json pages tests/pages-build.test.mjs vite.pages.config.ts
git commit -m "feat: add GitHub Pages build"
```

---

### Task 2: Add the Least-Privilege GitHub Pages Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `tests/pages-workflow.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `npm run test:pages` and the `pages-dist/` artifact from Task 1.
- Produces: GitHub Actions workflow `Deploy STEEL SIGNAL to GitHub Pages`.

- [ ] **Step 1: Write the failing workflow contract test**

Create `tests/pages-workflow.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/deploy-pages.yml",
  import.meta.url,
);

test("deploy workflow uses the tested Pages artifact and minimum permissions", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /name:\s*Deploy STEEL SIGNAL to GitHub Pages/);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\["main"\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /run:\s*npm test/);
  assert.match(workflow, /run:\s*npm run lint/);
  assert.match(workflow, /run:\s*npm run test:pages/);
  assert.match(workflow, /path:\s*pages-dist/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.doesNotMatch(workflow, /FRED|ECOS|secrets\./i);
});
```

- [ ] **Step 2: Add the temporary workflow test script and verify RED**

Add to `package.json`:

```json
"test:workflow": "node --test tests/pages-workflow.test.mjs"
```

Run:

```bash
npm run test:workflow
```

Expected: FAIL with `ENOENT` because the workflow does not exist.

- [ ] **Step 3: Add the deployment workflow**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy STEEL SIGNAL to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out source
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install locked dependencies
        run: npm ci
      - name: Test product
        run: npm test
      - name: Lint product
        run: npm run lint
      - name: Build and verify Pages artifact
        run: npm run test:pages
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: pages-dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Run focused GREEN and full checks**

Run:

```bash
npm run test:workflow
npm run test:pages
npm test
npm run lint
git diff --check
```

Expected: all workflow, Pages artifact, product, build, rendered, lint, and diff checks pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add .github/workflows/deploy-pages.yml tests/pages-workflow.test.mjs package.json
git commit -m "ci: deploy STEEL SIGNAL to GitHub Pages"
```

---

### Task 3: Create the Public Repository, Deploy, and Verify Anonymous Access

**Files:**
- No product source changes expected.
- Git remote configuration changes locally.
- GitHub repository and Pages access settings change externally.

**Interfaces:**
- Consumes: review-clean branch HEAD, public GitHub account `suhyeonhong-bit`, and the workflow from Task 2.
- Produces: public repository `https://github.com/suhyeonhong-bit/SteelSignal` and public site `https://suhyeonhong-bit.github.io/SteelSignal/`.

- [ ] **Step 1: Perform the final local publishing gate**

Run:

```bash
git status --short
git log -1 --format=%H
npm run test:workflow
npm run test:pages
npm test
npm run lint
git diff --check
```

Expected: clean worktree and every command passes.

- [ ] **Step 2: Create the GitHub repository through the logged-in GitHub browser session**

Create exactly one repository with:

```text
Owner: suhyeonhong-bit
Repository name: SteelSignal
Description: 한국 기준금리와 미국 철강 PPI의 5년 흐름을 보여주는 공개 대시보드
Visibility: Public
Initialize with README: No
Add .gitignore: No
Choose a license: No
```

Expected: `https://github.com/suhyeonhong-bit/SteelSignal` exists and is empty.

- [ ] **Step 3: Connect and push the exact reviewed HEAD**

Run:

```bash
git remote add origin https://github.com/suhyeonhong-bit/SteelSignal.git
git push -u origin HEAD:main
```

Expected: the exact local HEAD becomes the remote `main` branch. Do not force push and do not embed credentials in the URL.

- [ ] **Step 4: Enable GitHub Actions as the Pages source**

In repository settings:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Expected: Pages accepts deployments from `.github/workflows/deploy-pages.yml`.

- [ ] **Step 5: Monitor the first workflow to a terminal result**

Open:

```text
https://github.com/suhyeonhong-bit/SteelSignal/actions
```

Expected:

- `Deploy STEEL SIGNAL to GitHub Pages` succeeds.
- Both `build` and `deploy` jobs are green.
- No repository secrets are required.

If the workflow fails, inspect the failed job and logs, fix only the evidenced issue with a focused test, commit, push, and wait for the replacement run.

- [ ] **Step 6: Verify public anonymous behavior**

Fetch without GitHub or ChatGPT authentication:

```bash
curl -fsSL https://suhyeonhong-bit.github.io/SteelSignal/ \
  -o /private/tmp/steel-signal-github-pages.html
curl -fsSL https://suhyeonhong-bit.github.io/SteelSignal/og.png \
  -o /private/tmp/steel-signal-github-pages-og.png
```

Verify:

```bash
rg -n "STEEL SIGNAL|금리와 철강 가격의 흐름|SteelSignal/og.png" \
  /private/tmp/steel-signal-github-pages.html
sips -g pixelWidth -g pixelHeight \
  /private/tmp/steel-signal-github-pages-og.png
```

Expected:

- Anonymous HTTP response succeeds.
- HTML includes the product title and canonical social image.
- Social image is 1200×630.

- [ ] **Step 7: Open the public URL and complete the handoff**

Open exactly:

```text
https://suhyeonhong-bit.github.io/SteelSignal/
```

Explain:

- the page reads the latest public GitHub CSV at visit time;
- Monday CSV updates do not require site redeployment;
- hovering shows monthly values and each series can be toggled;
- the table and CSV download expose all parsed months;
- API keys are not present in the public repository or page.

- [ ] **Step 8: Stop retained local development processes**

Stop the retained site development session and run:

```bash
bash /Users/suhyeonhong/.codex/skills/brainstorming/scripts/stop-server.sh \
  /Users/suhyeonhong/Documents/GitHub/ToSuhyeon/.superpowers/brainstorm/26914-1785383099
```

Expected: local preview processes stop without deleting the ignored design reference directory.
