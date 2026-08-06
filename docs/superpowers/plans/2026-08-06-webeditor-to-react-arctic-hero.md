# WebEditor-to-React Arctic Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user-edited WebEditor navigation and hero design to the responsive React Arctic dashboard while keeping the standalone WebEditor source synchronized and preserving all automatic data behavior.

**Architecture:** The React component owns semantic hero copy, `app/arctic.css` translates the WebEditor coordinates into responsive `clamp()` spacing, and the standalone HTML mirrors the same copy and CSS. A source-contract test locks the three artifacts together without importing editor-only slide metadata.

**Tech Stack:** React 19, TypeScript 5.9, CSS3, HTML5, Node.js 22 built-in test runner, Vinext/Vite.

## Global Constraints

- Preserve EIA·OFAC·EU·NSIDC loading, fallback data, source links, and status rendering without modification.
- Preserve `/steel/`, the Arctic hegemony interaction, research sections, `data-bind`, `data-region`, `#arctic-runtime`, and `#arctic-fallback`.
- Use `#f4f6f8` for the hero background, black for primary hero and navigation text, and `#ef4444` for `결정`.
- Use Pretendard first for navigation and the hero kicker/deck/source copy, with existing system fallbacks.
- Translate WebEditor offsets into responsive margins capped at 16px, 60px, 105px, and 35px; never ship fixed editor transforms or 1920×1080 layout metadata.
- Render the revised deck as three block sentences on desktop and natural inline wrapping at 760px and below.
- Keep the grammatically correct title `이미 결정됐는가?` in the React dashboard.
- Do not expose API keys, add dependencies, or stage the user-owned `.superpowers/` directory.

---

### Task 1: Lock the synchronized hero contract

**Files:**
- Create: `tests/arctic-hero-design.test.mjs`
- Modify: `app/components/ArcticResearchDashboard.tsx:143`
- Modify: `app/arctic.css:1-34,178-205`
- Modify: `webeditor/arctic-dashboard.html:12-32,111,125`

**Interfaces:**
- Consumes: the existing `ArcticResearchDashboard` component, `.arctic-nav` and `.arctic-hero` selectors, and standalone WebEditor data bindings.
- Produces: three `.hero-deck-line` spans in both render sources; `--arctic-red`; responsive navigation and hero rules; a source-level test runnable with `node --test tests/arctic-hero-design.test.mjs`.

- [ ] **Step 1: Write the failing synchronization test**

Create `tests/arctic-hero-design.test.mjs`:

```js
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

  for (const source of [css, webeditor]) {
    assert.match(source, /--arctic-red:\s*#ef4444/);
    assert.match(source, /\.arctic-hero\s*\{[^}]*background:\s*var\(--arctic-cool\)/s);
    assert.match(source, /\.arctic-hero h1 em\s*\{[^}]*var\(--arctic-red\)/s);
    assert.match(source, /\.arctic-nav nav a\s*\{[^}]*color:\s*#000/s);
    assert.match(source, /\.hero-deck-line\s*\{[^}]*display:\s*block/s);
    assert.match(source, /margin-left:\s*clamp\(0px,\s*5\.5vw,\s*105px\)/);
    assert.match(source, /@media \(max-width:\s*760px\)[\s\S]*\.hero-deck-line\s*\{[^}]*display:\s*inline/s);
  }

  assert.doesNotMatch(webeditor, /data-editor-slide|webeditor-canvas-size|webeditor-html-sizing/);
});
```

- [ ] **Step 2: Run the focused test and verify the approved design is absent**

Run:

```bash
node --test tests/arctic-hero-design.test.mjs
```

Expected: FAIL because the revised `어디에서 비롯되는가?` copy and `--arctic-red` token are not present.

- [ ] **Step 3: Update the React hero copy**

Replace the hero section in `app/components/ArcticResearchDashboard.tsx` with:

```tsx
<section className="arctic-hero" id="overview">
  <p className="arctic-kicker">2022150047 · 홍수현 · RESEARCH DASHBOARD</p>
  <h1>북극 에너지 패권,<br />이미 <em>결정</em>됐는가?</h1>
  <p className="hero-deck">
    <span className="hero-deck-line">YAMAL LNG의 지정학적 위력은 어디에서 비롯되는가?</span>
    <span className="hero-deck-line">미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가</span>
    <span className="hero-deck-line">— 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.</span>
  </p>
  <p className="hero-sources">SOURCE · USGS 2008 / Arctic Council / EIA / OFAC / EU / NSIDC / CHNL / DOE</p>
</section>
```

- [ ] **Step 4: Add responsive operating-dashboard styles**

Add `--arctic-red: #ef4444;` to `:root` in `app/arctic.css` and replace the navigation/hero declarations with:

```css
.arctic-nav nav a { flex: none; padding: 8px 10px; color: #000; font-family: "Pretendard Variable", Pretendard, var(--font-geist-sans), Arial, sans-serif; font-size: 12px; text-decoration: none; }
.arctic-nav nav a:hover { color: var(--arctic-navy); }
.arctic-nav .steel-link { margin-left: 8px; border-left: 1px solid var(--arctic-rule); color: #000; font-weight: 750; }
.arctic-hero { padding: 92px 0 52px; background: var(--arctic-cool); }
.arctic-hero .arctic-kicker { margin-left: clamp(0px, 1vw, 16px); color: #000; font-family: "Pretendard Variable", Pretendard, var(--font-geist-sans), Arial, sans-serif; }
.arctic-hero h1 { max-width: 704px; margin: 0 0 0 clamp(0px, 3.2vw, 60px); color: #000; font-size: clamp(3.2rem, 7vw, 6.6rem); font-weight: 850; letter-spacing: -.042em; line-height: .94; }
.arctic-hero h1 em { color: var(--arctic-red); font-style: normal; }
.hero-deck { max-width: 900px; margin: 30px 0 0 clamp(0px, 5.5vw, 105px); color: var(--arctic-muted); font-family: "Pretendard Variable", Pretendard, var(--font-geist-sans), Arial, sans-serif; font-size: clamp(1rem, 2vw, 1.2rem); line-height: 1.85; }
.hero-deck-line { display: block; }
.hero-sources { margin: 30px 0 0 clamp(0px, 1.9vw, 35px); color: #788797; font-family: "Pretendard Variable", Pretendard, var(--font-geist-sans), Arial, sans-serif; font-size: 10px; letter-spacing: .06em; }
```

Extend the existing 760px media query with:

```css
.arctic-hero .arctic-kicker, .arctic-hero h1, .hero-deck, .hero-sources { margin-left: 0; }
.arctic-hero h1 { max-width: none; font-size: clamp(3rem, 14vw, 5rem); }
.hero-deck-line { display: inline; }
.hero-deck-line:not(:last-child)::after { content: " "; }
```

- [ ] **Step 5: Mirror the same contract in the standalone HTML**

In `webeditor/arctic-dashboard.html`, add the same `--arctic-red`, navigation, hero, line, and mobile rules using `var(--font-display)` instead of Next font variables. Replace `.hero-deck` content with:

```html
<p class="hero-deck"><span class="hero-deck-line">YAMAL LNG의 지정학적 위력은 어디에서 비롯되는가?</span><span class="hero-deck-line">미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가</span><span class="hero-deck-line">— 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.</span></p>
```

Do not copy any `data-editor-slide`, WebEditor canvas metadata, inline transforms, or print-hook styles from the downloaded editor export. Keep every existing `data-bind`, `data-region`, script, and fallback payload byte-for-byte unchanged.

- [ ] **Step 6: Run the focused test and verify it passes**

Run:

```bash
node --test tests/arctic-hero-design.test.mjs
```

Expected: 1 test passes, 0 fails.

- [ ] **Step 7: Commit the synchronized design**

```bash
git add tests/arctic-hero-design.test.mjs app/components/ArcticResearchDashboard.tsx app/arctic.css webeditor/arctic-dashboard.html
git commit -m "feat: apply WebEditor Arctic hero design"
```

---

### Task 2: Verify responsive output and deployment builds

**Files:**
- Modify only if a verified defect requires a TDD fix: `tests/arctic-hero-design.test.mjs`, `app/components/ArcticResearchDashboard.tsx`, `app/arctic.css`, `webeditor/arctic-dashboard.html`

**Interfaces:**
- Consumes: Task 1 synchronized hero contract.
- Produces: verified Vinext, Vercel/static, GitHub Pages, and browser output without changing the public data contract.

- [ ] **Step 1: Run the complete automated verification matrix**

Run each command and require exit code 0:

```bash
npm test
npm run test:pages
npm run lint
npm run build:vercel
```

Expected: all tests pass, lint reports no errors, and both production builds finish successfully.

- [ ] **Step 2: Verify the rendered desktop dashboard**

Start a local production-compatible server and open the root page at 1440×1000. Confirm the hero uses a light-gray background; navigation and title are black; `결정` is red; the deck appears as three lines; and no horizontal overflow occurs. Click 2027 and 2033 and confirm the hegemony percentages and note update.

- [ ] **Step 3: Verify responsive mobile behavior**

At 390×844, confirm the extra left offsets are removed, the deck wraps naturally instead of forcing three lines, navigation remains horizontally accessible, and the title, data cards, and research sections do not overlap or clip.

- [ ] **Step 4: Verify fallback and editor contracts**

Confirm `webeditor/arctic-dashboard.html` opens with the same hero and that its `#arctic-fallback` and `#arctic-runtime` script hashes still match the pre-change values:

```text
arctic-fallback 03467df42ca7ee28fdcbbcc777a6b6fd3df29ade1d84b96069290d89bc31b784
arctic-runtime  052c60c05f37ef2f456df577f9a21c06637366ea84170c9489311a18b7378479
```

- [ ] **Step 5: Handle any verified defect with a new red-green cycle**

If a check fails, first add a minimal assertion to `tests/arctic-hero-design.test.mjs`, run it and observe the expected failure, then make the smallest CSS or markup change and rerun the focused and full suites. If no check fails, do not make additional code changes.

- [ ] **Step 6: Record a verification-only commit only when needed**

If Step 5 changed files, commit them with:

```bash
git add tests/arctic-hero-design.test.mjs app/components/ArcticResearchDashboard.tsx app/arctic.css webeditor/arctic-dashboard.html
git commit -m "fix: refine responsive Arctic hero"
```

If no files changed, skip this commit.
