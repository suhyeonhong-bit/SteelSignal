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
