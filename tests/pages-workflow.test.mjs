import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/deploy-pages.yml",
  import.meta.url,
);

test("deploy workflow verifies both dashboards and uses minimum permissions", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /name:\s*Deploy Research Dashboards to GitHub Pages/);
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

test("lint excludes generated Pages output", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.match(packageJson.scripts.lint, /--ignore-pattern pages-dist/);
});
