# Arctic Research Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SteelSignal default page with the approved editorial-white Arctic energy research dashboard, consume the public ToSuhyeon Arctic JSON with a verified fallback, and preserve the existing STEEL SIGNAL product at `/steel/` in both Vinext/Sites and GitHub Pages builds.

**Architecture:** A strict TypeScript parser and `useArcticData` hook form the runtime data boundary. `ArcticResearchDashboard` combines immutable research-authored content with automatic EIA, sanctions, and sea-ice panels, explicitly labeling which is which. Next routes and a Vite multi-page build share the same React components: root renders Arctic research; `/steel/` renders the existing dashboard. Existing steel behavior stays isolated under `.steel-page`, while new Arctic styles live under `.arctic-page`.

**Tech Stack:** React 19, Next 16/Vinext, TypeScript 5.9, Recharts 3, CSS, Vitest, Testing Library, Vite 8, Node test runner, GitHub Pages.

## Global Constraints

- Implement against `docs/superpowers/specs/2026-08-04-arctic-research-dashboard-design.md` and the fixed JSON contract in `docs/superpowers/plans/2026-08-04-arctic-data-automation.md`.
- Sync this branch with current `origin/main` before changing product files. Preserve the approved spec and plans and do not remove unrelated untracked `.superpowers/` artifacts.
- The root page is Arctic research. Existing STEEL SIGNAL must remain fully functional at `/steel/`, including load/error states, chart toggles, table, source links, and exact fetched CSV download.
- Use the user's approved `에디토리얼 화이트 + 굵은 산세리프 제목` direction: white/cool-gray paper, navy text, copper for Russia/YAMAL/warning, blue for United States/official live data, thin rules, low radii, no decorative shadows.
- The headline `북극 에너지 패권, 이미 결정됐는가?` and STEEL SIGNAL's `금리와 철강 가격의 흐름을 한눈에` both use the bold sans-serif display treatment.
- Never put `EIA_API_KEY` or any source credential in this repository, a `VITE_`/`NEXT_PUBLIC_` variable, browser request, build artifact, test fixture, or log.
- Automated panels may update numbers and status only. They must not rewrite the researcher's hegemony index, 4A conclusions, company interpretation, or Korea recommendations.
- Show direct official-list presence only. Include the legal limitation beside sanctions data.
- Show Arctic-wide sea-ice extent only. State explicitly that it is not NSR navigable days.
- Use TDD for each behavior change and run accessibility-oriented DOM assertions. Use browser checks at 1440×1000 and 390×844 before completion.
- Commit after every task using the messages shown below.

## Fixed Runtime Data Contract

Create these exported types in `app/lib/arctic-data.ts`:

```ts
export type SourceStatus = "fresh" | "stale";
export type ArcticSourceName = "eia" | "ofac" | "eu" | "nsidc";

export type SourceMetadata = {
  status: SourceStatus;
  hasData: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  dataThrough: string | null;
  url: string;
  contentHash: string | null;
  edition?: string | null;
};

export type EnergyPoint = {
  period: string;
  value: number;
  unit: string;
  kind: "actual" | "forecast";
  source: "EIA STEO";
};

export type SanctionMatch = {
  officialName: string;
  list: string;
  programs: string[];
  officialId: string;
};

export type SanctionSourceResult = {
  listed: boolean;
  matches: SanctionMatch[];
};

export type WatchlistItem = {
  id: "novatek" | "yamal-lng" | "leonid-mikhelson" | "gennady-timchenko";
  label: string;
  ofac: SanctionSourceResult;
  eu: SanctionSourceResult;
};

export type SeaIcePoint = {
  date: string;
  extent: number;
  unit: "10^6 sq km";
  missing: number;
  source: "NSIDC Sea Ice Index v4";
};

export type ArcticDashboardData = {
  schemaVersion: 1;
  generatedAt: string;
  sources: Record<ArcticSourceName, SourceMetadata>;
  energy: {
    usLngExports: EnergyPoint[];
    usDryGasProduction: EnergyPoint[];
    henryHub: EnergyPoint[];
  };
  sanctions: { watchlist: WatchlistItem[] };
  seaIce: { latest: SeaIcePoint | null; daily: SeaIcePoint[] };
};
```

Runtime URL:

```ts
export const ARCTIC_DATA_URL =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/arctic_dashboard.json";
```

## Fixed Research Content Contract

Store research-authored copy in `app/lib/arctic-content.ts`, not in fetched JSON. The implementation must preserve these values and labels:

| Area | Fixed authored content |
|---|---|
| Researcher | `2022150047 · 홍수현 · Research Dashboard` |
| Title | `북극 에너지 패권, 이미 결정됐는가?` |
| Question | `YAMAL LNG의 지정학적 위력은 어디서 비롯되며, 미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가 — 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.` |
| Hegemony | 2025 RU 78/US 22; 2027 RU 60/US 40; 2033 RU 48/US 52; label all values `연구자 추정` |
| Arctic resources | oil `900억 배럴`, gas `47조 m³`, global share `22%` |
| NSR | claimed 7,000 km reduction and 40–50 to 18–19 days; authored limitation 90–100 icebreaker-free days even in 2080; four-month application versus Suez 48-hour notice |
| YAMAL shareholders | Novatek 50.1, Total 20, CNPC 20, Silk Road Fund 9.9 |
| 2025 destination | Europe 76.1, Asia/other 23.9; 19.7 Mt total; 15 Mt Europe; 14.3% of EU LNG imports |
| Fleet | Arc7 16, Arc4 6, ordinary 5 |
| Sanctions scenario | 2024/25 280 voyages, EU-sanctions estimate 125; state this is a research scenario |
| Last boarding | Jan–Mar 2026, 70/70 Sabetta departures to Europe versus 14/74 Asia-bound in 2025 Q1 |
| TotalEnergies | 20% share, 4 Mt/year largest buyer, keep equity while ending gas trading; Alaska Glenfarne 2 Mt/year for 20 years LOI dated 2026-02 |
| Mikhelson case | Timchenko 23.5% + Mikhelson 24% = 47.5%; retain as authored interpretation and do not replace with automated legal conclusion |
| US LNG cards | current authored capacity 129 MTPA; Europe 2025 imports 48.4 Mt; Polar LNG target 21 MTPA |
| US triangle | Alaska, Greenland, Canada; Greenland 85% oppose/6% support US joining; EXIM 2025-06 Tanbreez $120m interest letter; Canada NWP dispute |
| 4A | Availability, Accessibility, Affordability, Acceptability rows from the approved source dashboard |
| Korea timeline | `NOW · 2026`, `2027`, `2033`; LNG Canada phase 2, YAMAL gap, Alaska LNG double portfolio |
| Korea technology | Korea's Arc7 construction experience; shipbuilding cooperation; MASGA $150bn of $350bn total US investment |

Use the complete Korean paragraphs supplied in the approved dashboard source when populating the constants. Do not silently update future-dated claims from automatic APIs; those remain authored research and display their source/date context.

## Task 1: Sync the Branch and Lock Routing with Failing Tests

**Files:**

- Modify: `tests/dashboard.test.tsx`
- Create: `tests/arctic-routing.test.tsx`
- Create: `app/steel/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/components/SteelSignalDashboard.tsx`

- [ ] **Step 1: Inspect and sync safely**

Run:

```bash
git status --short --branch
git fetch origin
git merge --no-edit origin/main
git status --short --branch
```

Expected: current feature branch contains the approved spec/plan commits plus current `origin/main`. Resolve only genuine overlapping product changes; preserve untracked `.superpowers/`.

- [ ] **Step 2: Write failing route ownership tests**

`tests/arctic-routing.test.tsx` must import the default functions from `app/page` and `app/steel/page` and assert:

```ts
expect(render(<ArcticHome />).container.querySelector(".arctic-page")).toBeTruthy();
expect(render(<SteelHome />).container.querySelector(".steel-page")).toBeTruthy();
```

Update existing Steel dashboard tests to expect the root wrapper `.steel-page` while preserving all current assertions.

Run:

```bash
npx vitest run tests/arctic-routing.test.tsx tests/dashboard.test.tsx
```

Expected: FAIL because the Arctic component and `/steel/` route do not exist.

- [ ] **Step 3: Make the minimal route split**

Create a temporary semantic `ArcticResearchDashboard` shell in `app/components/arctic/ArcticResearchDashboard.tsx` with the final `.arctic-page` root and title. Change `app/page.tsx` to render it. Create `app/steel/page.tsx` that renders `SteelSignalDashboard` and exports steel-specific metadata. Add `.steel-page` to the existing component's `<main>` without changing its inner functionality:

```tsx
<main className="steel-page site-shell">{children}</main>
```

The Steel route metadata is:

```ts
export const metadata: Metadata = {
  title: "STEEL SIGNAL | 금리와 철강 가격의 흐름",
  description: "한국 기준금리와 미국 철강 생산자물가지수의 최신 값과 5년 흐름",
};
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npx vitest run tests/arctic-routing.test.tsx tests/dashboard.test.tsx
npm run lint
git add app/page.tsx app/steel/page.tsx app/components/SteelSignalDashboard.tsx app/components/arctic/ArcticResearchDashboard.tsx tests/arctic-routing.test.tsx tests/dashboard.test.tsx
git commit -m "feat: split arctic and steel routes"
```

Expected: focused tests and lint PASS.

## Task 2: Add Strict Arctic Data Parsing and the Verified Fallback

**Files:**

- Create: `app/lib/arctic-data.ts`
- Create: `app/data/arctic-dashboard-fallback.json`
- Create: `tests/fixtures/arctic-dashboard-valid.json`
- Create: `tests/arctic-data.test.ts`

- [ ] **Step 1: Copy the Python-validated public JSON into two controlled fixtures**

After the data-plan bootstrap commit exists, copy the exact generated JSON into:

- `tests/fixtures/arctic-dashboard-valid.json` for parser tests;
- `app/data/arctic-dashboard-fallback.json` for runtime fallback.

The fallback is intentionally build-time data. Add `fallbackCapturedAt` nowhere; use its existing `generatedAt` as the displayed snapshot time.

- [ ] **Step 2: Write failing strict parser tests**

Export:

```ts
export class ArcticDataError extends Error {
  readonly kind = "format";
}

export function parseArcticDashboard(input: unknown): ArcticDashboardData;
```

Tests must prove:

- the valid fixture parses and retains units/status/kinds;
- schemaVersion other than 1 fails;
- invalid ISO timestamps, source URL protocol other than HTTPS, malformed `sha256:` hash, NaN/non-number values, invalid period/date, unsorted or duplicate time points, missing source, incorrect watchlist ids/order, mismatch between `listed` and `matches.length`, invalid list ids, and a latest sea-ice point different from the last daily point fail;
- EIA series unit is internally consistent;
- `source` literals are exact;
- unknown top-level keys and unknown required-record keys fail so upstream changes cannot silently render incorrectly.

Run:

```bash
npx vitest run tests/arctic-data.test.ts
```

Expected: FAIL because the parser is absent.

- [ ] **Step 3: Implement runtime guards without unsafe casts**

Use small guards (`assertRecord`, `assertExactKeys`, `assertIsoTimestamp`, `assertFiniteNumber`) and return a freshly constructed object. Do not use a final `as ArcticDashboardData` cast over unvalidated input.

- [ ] **Step 4: Verify fixtures contain no credentials**

Run:

```bash
npx vitest run tests/arctic-data.test.ts
rg -n "EIA_API_KEY|api_key=|VITE_|NEXT_PUBLIC_|X-Amz-|token=" app/data tests/fixtures
```

Expected: tests PASS and the scan finds none of the forbidden strings. The safe source page URLs may remain.

- [ ] **Step 5: Commit**

```bash
git add app/lib/arctic-data.ts app/data/arctic-dashboard-fallback.json tests/fixtures/arctic-dashboard-valid.json tests/arctic-data.test.ts
git commit -m "feat: validate arctic dashboard data"
```

## Task 3: Add Runtime Loading with Snapshot Fallback

**Files:**

- Create: `app/hooks/useArcticData.ts`
- Create: `tests/use-arctic-data.test.tsx`

- [ ] **Step 1: Write failing hook tests**

The state contract is:

```ts
export type ArcticDataState =
  | { status: "loading"; data: ArcticDashboardData; mode: "snapshot"; errorKind: null }
  | { status: "success"; data: ArcticDashboardData; mode: "live"; errorKind: null }
  | { status: "fallback"; data: ArcticDashboardData; mode: "snapshot"; errorKind: "network" | "format" };

export function useArcticData(): ArcticDataState & { retry: () => Promise<void> };
```

Tests mirror the existing mounted/request-id protections and prove:

- loading exposes the validated bundled snapshot so server/static rendering has useful data;
- successful no-store fetch returns live mode;
- HTTP/network failure uses snapshot with `errorKind: "network"`;
- parse failure uses snapshot with `errorKind: "format"`;
- retry replaces fallback with live data;
- stale older requests cannot overwrite a newer response;
- unmount prevents state updates.

Run:

```bash
npx vitest run tests/use-arctic-data.test.tsx
```

Expected: FAIL because the hook is absent.

- [ ] **Step 2: Implement the hook**

Import the fallback JSON and immediately validate it once at module load with `parseArcticDashboard`. Fetch only `ARCTIC_DATA_URL` with `{ cache: "no-store" }`. The public UI must never construct official API URLs.

- [ ] **Step 3: Run tests and commit**

```bash
npx vitest run tests/use-arctic-data.test.tsx tests/arctic-data.test.ts
git add app/hooks/useArcticData.ts tests/use-arctic-data.test.tsx
git commit -m "feat: load arctic data with snapshot fallback"
```

Expected: focused tests PASS.

## Task 4: Build the Editorial Shell, Navigation, Freshness Strip, and Gauge

**Files:**

- Create: `app/lib/arctic-content.ts`
- Create: `app/components/arctic/ArcticHeader.tsx`
- Create: `app/components/arctic/FreshnessStrip.tsx`
- Create: `app/components/arctic/HegemonyGauge.tsx`
- Modify: `app/components/arctic/ArcticResearchDashboard.tsx`
- Create: `tests/arctic-dashboard.test.tsx`

- [ ] **Step 1: Write failing high-level dashboard tests**

Mock `useArcticData` with the valid fixture and assert:

- nav brand `ARCTIC / YAMAL` and anchor links `#overview`, `#intro`, `#yamal`, `#usa`, `#compare`, `#korea`;
- link to `./steel/` in static-compatible markup and `/steel/` route semantics;
- the researcher line, title, full research question, and source line;
- four source status items, each with status text plus last-success/data-through text;
- fallback mode banner `업데이트 지연 · 검증된 스냅샷 표시 중` and retry button;
- hegemony buttons 2025/2027/2033 expose `aria-pressed`, change RU/US percentages, notes, and maintain `연구자 추정 · 자동 갱신 아님`;
- keyboard click behavior works through native buttons;
- all five sections have unique labelled headings.

Run:

```bash
npx vitest run tests/arctic-dashboard.test.tsx
```

Expected: FAIL against the temporary shell.

- [ ] **Step 2: Create immutable authored constants**

Export:

```ts
export const NAV_ITEMS = [
  ["개요", "#overview"],
  ["01 · 왜 북극인가", "#intro"],
  ["02 · YAMAL", "#yamal"],
  ["03 · 미국", "#usa"],
  ["04 · 비교", "#compare"],
  ["05 · 한국", "#korea"],
] as const;

export const HEGEMONY = {
  2025: { ru: 78, us: 22, note: "2025년: YAMAL은 연 1,970만 톤을 실제 수출 중이며 Arc7 쇄빙선 16척으로 유럽·아시아 양방향 공급이 가능하다. 반면 Alaska LNG는 FID 미확정, 생산 미개시 상태다." },
  2027: { ru: 60, us: 40, note: "2027년: EU 제재 패키지 시행을 전제로 YAMAL의 유럽 접근성이 약화되는 연구 시나리오다. TotalEnergies의 알래스카 LOI 등 공급망 이동을 반영했다." },
  2033: { ru: 48, us: 52, note: "2033년: Alaska LNG 생산 개시 목표와 북태평양 직항 공급망이 실현된다는 가정 아래 미국이 근소하게 앞서는 연구 시나리오다." },
} as const;
```

The 2027/2033 notes must visibly say they are conditional scenarios, not current facts.

- [ ] **Step 3: Implement the semantic shell**

Use:

- a sticky `<header>` with horizontally scrollable `<nav aria-label="연구 섹션">`;
- `<main id="overview">` and section anchors with `scroll-margin-top`;
- source status `<ul>` with text labels `최신`, `지연`, or `데이터 확인 필요`, never color alone;
- `<output aria-live="polite">` for the selected gauge note;
- percentage text outside the color bars;
- an explicit methodology line: `생산·접근성·제재·프로젝트 실현 단계에 대한 연구자 정성 평가를 100으로 환산한 추정 지수`.

Do not implement scroll-spy in this release; anchors and current gauge state are sufficient and avoid continuous scroll listeners.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/arctic-dashboard.test.tsx
git add app/lib/arctic-content.ts app/components/arctic/ArcticHeader.tsx app/components/arctic/FreshnessStrip.tsx app/components/arctic/HegemonyGauge.tsx app/components/arctic/ArcticResearchDashboard.tsx tests/arctic-dashboard.test.tsx
git commit -m "feat: build arctic editorial shell"
```

Expected: dashboard tests PASS.

## Task 5: Add Research Sections 01 and 02 with Manual Charts and Sanctions Data

**Files:**

- Create: `app/components/arctic/ResearchSection.tsx`
- Create: `app/components/arctic/ManualResearchCharts.tsx`
- Create: `app/components/arctic/SanctionsWatch.tsx`
- Modify: `app/components/arctic/ArcticResearchDashboard.tsx`
- Modify: `app/lib/arctic-content.ts`
- Create: `tests/arctic-yamal.test.tsx`

- [ ] **Step 1: Write failing content and chart tests**

Assert exact authored metrics and visible limitations:

- section 01 shows `900억`, `47조 m³`, `22%`, country cards, NSR 90–100 days, four-month application, Suez 48 hours, and conclusion `NSR은 공급망으로서 그 가치가 과대평가되어 있다.`;
- section 02 shows the shareholder, destination, fleet, and sanctions-scenario chart titles and source labels;
- chart summaries are available as accessible tables or lists so information does not depend on SVG/canvas;
- `막차 탑승`, TotalEnergies, and Mikhelson/47.5% authored cases appear;
- every sanctions watchlist item renders separate OFAC and EU states;
- direct listed matches expose official name, program, list, and official id;
- non-listed state says `직접 등재 확인 안 됨`, not `제재 없음`;
- legal note reads `공식 명단의 직접 등재 여부만 자동 확인합니다. 50% 룰·소유관계·법률 위반 판단이 아니며 법률 자문이 아닙니다.`;
- stale OFAC or EU metadata creates a source-specific `업데이트 지연` label without suppressing the other source.

- [ ] **Step 2: Implement reusable authored section primitives**

`ResearchSection` accepts `number`, `eyebrow`, `title`, `conclusion`, `tone`, and children, produces a labelled `<section>`, and does not accept fetched prose.

`ManualResearchCharts` uses Recharts for visual charts plus a visually compact semantic table/list containing the same values. Include:

- doughnut-style composition using `PieChart` for shareholders and destinations;
- bars for fleet and voyage scenario;
- chart subtitles `연구 자료 · 자동 갱신 아님`.

Recharts tooltip/legend text must be Korean and units explicit.

- [ ] **Step 3: Implement sanctions integration**

Pass parsed `watchlist`, `sources.ofac`, and `sources.eu` into `SanctionsWatch`. Render exact direct matches only; keep the authored Mikhelson case in a separate box titled `연구자 해석` so automatic state cannot overwrite it.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/arctic-yamal.test.tsx tests/arctic-dashboard.test.tsx
git add app/components/arctic/ResearchSection.tsx app/components/arctic/ManualResearchCharts.tsx app/components/arctic/SanctionsWatch.tsx app/components/arctic/ArcticResearchDashboard.tsx app/lib/arctic-content.ts tests/arctic-yamal.test.tsx
git commit -m "feat: add arctic and yamal research sections"
```

Expected: focused tests PASS.

## Task 6: Add Live EIA and NSIDC Panels to Section 03

**Files:**

- Create: `app/components/arctic/EnergyCharts.tsx`
- Create: `app/components/arctic/SeaIceChart.tsx`
- Modify: `app/components/arctic/ArcticResearchDashboard.tsx`
- Modify: `app/lib/arctic-content.ts`
- Create: `tests/arctic-live-data.test.tsx`

- [ ] **Step 1: Write failing EIA chart tests**

Tests assert:

- LNG exports, dry-gas production, and Henry Hub each render title, unit, source link, data-through, and STEO edition;
- actual points say `실적` and forecast points say `전망` in legend and accessible data table;
- actual line is solid and forecast line is dashed using `strokeDasharray`, with text distinction as the non-color cue;
- no data renders `데이터 확인 필요` and the official source link rather than an empty chart;
- stale EIA status renders `업데이트 지연` while retaining historical values;
- the authored `129 MTPA`, `48.4Mt`, and `21MTPA` cards are labelled `연구 자료 기준` and are not derived from EIA series.

- [ ] **Step 2: Write failing NSIDC chart tests**

Tests assert:

- latest extent, ISO data date, `10^6 sq km`, missing-data value, and source link;
- latest 400 retained observations are charted but accessible table shows newest 12 rows to avoid an enormous DOM;
- stale state is visible;
- no data shows source fallback;
- the exact note `북극 전체 해빙 면적이며 NSR 실제 항행 가능 일수와 동일하지 않습니다.` is always present.

- [ ] **Step 3: Implement the live charts**

Create a continuous actual-to-forecast line by transforming points to:

```ts
type ChartPoint = {
  period: string;
  actual: number | null;
  forecast: number | null;
};
```

Duplicate the final actual value as the first forecast anchor only in the visual chart transformation; do not change source data or the accessible table's kind. Use `<ResponsiveContainer>` and a deterministic `isAnimationActive={false}` for stable tests and reduced-motion safety.

Section 03 also includes the authored Alaska/Greenland/Canada cards and Project Alaska three implications from the approved source content.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/arctic-live-data.test.tsx tests/arctic-dashboard.test.tsx
git add app/components/arctic/EnergyCharts.tsx app/components/arctic/SeaIceChart.tsx app/components/arctic/ArcticResearchDashboard.tsx app/lib/arctic-content.ts tests/arctic-live-data.test.tsx
git commit -m "feat: visualize live arctic indicators"
```

Expected: focused tests PASS.

## Task 7: Add the 4A Comparison, Korea Timeline, Sources, and Disclaimers

**Files:**

- Create: `app/components/arctic/ComparisonTable.tsx`
- Create: `app/components/arctic/KoreaTimeline.tsx`
- Create: `app/components/arctic/ResearchFooter.tsx`
- Modify: `app/components/arctic/ArcticResearchDashboard.tsx`
- Modify: `app/lib/arctic-content.ts`
- Create: `tests/arctic-conclusions.test.tsx`

- [ ] **Step 1: Write failing concluding-section tests**

Assert:

- the table has a caption and exactly four row headers: Availability, Accessibility, Affordability, Acceptability;
- every row has both YAMAL and Alaska cells and the approved Korean explanations;
- conclusion says current hegemony is YAMAL and structural turning point is 2027–2033, labelled researcher interpretation;
- timeline renders 2026, 2027, 2033 in DOM order with the LNG Canada, YAMAL gap, and Alaska portfolio actions;
- technology and US-ally cards show Arc7 experience and `$1,500억`/`$3,500억` or equivalent Korean numeric copy;
- footer distinguishes `자동 갱신 데이터` from `연구자 작성 정보`, links official EIA/OFAC/EU/NSIDC sources, lists USGS/Arctic Council/CHNL/DOE/TotalEnergies/Glenfarne authored sources, and includes `투자·법률 자문이 아닙니다.`.

- [ ] **Step 2: Implement the 4A table**

Use native `<table>`, `<caption>`, `<thead>`, and `<th scope="row">`. On narrow screens wrap it in an overflow region with `tabIndex={0}` and `aria-label="4A 비교표 가로 스크롤"`.

- [ ] **Step 3: Implement the timeline and source footer**

Use an ordered list for the timeline. All outbound links use `rel="noreferrer"`; they remain normal same-tab research references unless opening a new tab is explicitly indicated in visible text.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/arctic-conclusions.test.tsx tests/arctic-dashboard.test.tsx
git add app/components/arctic/ComparisonTable.tsx app/components/arctic/KoreaTimeline.tsx app/components/arctic/ResearchFooter.tsx app/components/arctic/ArcticResearchDashboard.tsx app/lib/arctic-content.ts tests/arctic-conclusions.test.tsx
git commit -m "feat: complete arctic research narrative"
```

Expected: focused tests PASS.

## Task 8: Apply the Approved Editorial-White Design Without Regressing Steel

**Files:**

- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`
- Create: `tests/arctic-styles.test.mjs`

- [ ] **Step 1: Write failing style-contract tests**

Test CSS text for exact scoped tokens and behaviors:

```css
:root {
  --paper-white: #ffffff;
  --paper-cool: #f4f6f8;
  --ink-navy: #14243a;
  --ink-muted: #596779;
  --rule: #d9dfe6;
  --copper: #b85f32;
  --copper-text: #934323;
  --official-blue: #235f8f;
  --focus: #0f6cbd;
}
```

Tests assert:

- `.arctic-page` and `.steel-page` root scopes exist;
- Arctic cards use borders and `box-shadow: none`;
- Arctic title uses `font-weight: 800` or higher and sans-serif stack;
- mono metadata uses `ui-monospace` fallback;
- sticky nav has horizontal overflow;
- anchors have scroll margin;
- buttons/links have visible `:focus-visible`;
- mobile media query creates one-column grids and preserves table/nav scrolling;
- `prefers-reduced-motion` disables smooth scroll and transitions/animations;
- no color-only status selector hides textual labels;
- navy, muted, copper-text, and official-blue meet WCAG AA on both white/cool surfaces using the existing luminance helper pattern.

- [ ] **Step 2: Refactor existing Steel styles under `.steel-page`**

Prefix Steel-specific selectors (`.site-shell`, `.site-header`, `.metric-grid`, `.chart-panel`, and related elements) with `.steel-page` or place them in an explicit `@layer components` block scoped by `.steel-page`. Preserve existing appearance and all chart dimensions. Do not let generic `.hero`, `.card`, `table`, `th`, or `td` rules leak between pages.

- [ ] **Step 3: Implement Arctic layout and typography**

Required desktop structure:

- maximum reading width 1180px;
- header 64–72px high with 1px bottom rule;
- hero 72–96px vertical breathing room;
- title `clamp(2.7rem, 6vw, 5.6rem)`, tight but readable line height;
- 12px uppercase/mono metadata;
- section gaps 80–112px;
- cards 1px rule, 6–10px radius, no shadow;
- copper and blue occupy emphasis only, never large background fields;
- charts have minimum 280px desktop and 230px mobile height.

At 760px, two/three-column layouts become one column. At 520px, title and card padding shrink; status strip remains readable; gauge labels stay outside bars.

- [ ] **Step 4: Run style and product tests**

```bash
node --test tests/arctic-styles.test.mjs
npx vitest run
npm run lint
```

Expected: all tests and lint PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/rendered-html.test.mjs tests/arctic-styles.test.mjs
git commit -m "style: apply arctic editorial design"
```

## Task 9: Update Root Metadata and Build Both GitHub Pages Entries

**Files:**

- Modify: `app/layout.tsx`
- Modify: `pages-static/index.html`
- Modify: `pages-static/main.tsx`
- Create: `pages-static/steel/index.html`
- Create: `pages-static/steel/main.tsx`
- Modify: `vite.pages.config.ts`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/pages-build.test.mjs`
- Modify: `tests/pages-workflow.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

- [ ] **Step 1: Write failing metadata and multi-page build tests**

Root expectations:

```text
title: 북극 에너지 패권, 이미 결정됐는가? | ARCTIC / YAMAL
description: YAMAL LNG와 미국 북극 전략을 공식 데이터와 연구자 분석으로 추적하는 연구 대시보드
canonical: https://suhyeonhong-bit.github.io/SteelSignal/
```

Steel expectations:

```text
output file: pages-dist/steel/index.html
title: STEEL SIGNAL | 금리와 철강 가격의 흐름
canonical: https://suhyeonhong-bit.github.io/SteelSignal/steel/
```

Build tests also scan all HTML/JS/CSS/JSON for both public runtime URLs and reject `EIA_API_KEY`, `api_key=`, `FRED_API_KEY`, `ECOS_API_KEY`, `VITE_`, `NEXT_PUBLIC_`, `.env`, `X-Amz-`, and EU tokenized download URLs.

- [ ] **Step 2: Implement Vite multi-page inputs**

Use:

```ts
import { fileURLToPath } from "node:url";

build: {
  rollupOptions: {
    input: {
      arctic: fileURLToPath(new URL("./pages-static/index.html", import.meta.url)),
      steel: fileURLToPath(new URL("./pages-static/steel/index.html", import.meta.url)),
    },
  },
}
```

`pages-static/main.tsx` renders `ArcticResearchDashboard`; `pages-static/steel/main.tsx` renders `SteelSignalDashboard`. Each throws a page-specific missing-root error.

Use project-base-aware relative link construction in shared navigation. For the Arctic page, the Steel link must resolve to `/SteelSignal/steel/` on Pages and `/steel/` on Next. Implement a tiny `SteelPageLink` that derives from `import.meta.env.BASE_URL` only in the Vite entry or pass `steelHref` as a prop (`"./steel/"` for root static/Next-safe navigation is preferred). Do not inspect `window.location` during render.

- [ ] **Step 3: Update Next root metadata**

Keep the existing safe `SITE_ORIGIN` resolver and request-time metadata behavior. Change root title/description/OpenGraph/Twitter to Arctic identity. `app/steel/page.tsx` provides Steel route overrides. Social image may remain `/og.png` for this implementation unless a new approved Arctic asset is supplied; do not generate an unapproved image.

- [ ] **Step 4: Rename the deploy workflow product label**

Change only the human-readable workflow name to `Deploy research dashboards to GitHub Pages`. Keep permissions, tests, Pages artifact path, and deployment actions unchanged.

- [ ] **Step 5: Run both build stacks**

```bash
npm run test:pages
npm test
npm run lint
npm run test:workflow
```

Expected: root and `/steel/` static HTML exist; Vinext server renders Arctic root; all tests and lint PASS.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/steel/page.tsx pages-static/index.html pages-static/main.tsx pages-static/steel/index.html pages-static/steel/main.tsx vite.pages.config.ts .github/workflows/deploy-pages.yml tests/pages-build.test.mjs tests/pages-workflow.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: deploy arctic and steel dashboards"
```

## Task 10: Verify Interaction, Responsive Layout, and Release Readiness

**Files:**

- Modify only files required by defects found during verification

- [ ] **Step 1: Run the complete automated verification**

Run:

```bash
npm ci
npm run test:unit
npm run build
node --test tests/rendered-html.test.mjs
npm run lint
npm run test:pages
npm run test:workflow
git diff --check origin/main...HEAD
```

Expected: every command exits 0. If dependencies are already installed and lockfile is unchanged, `npm ci` may be omitted locally but must remain covered by CI.

- [ ] **Step 2: Launch a local production-equivalent preview**

Run the GitHub Pages build and preview because it exercises both routes:

```bash
npm run build:pages
npx vite preview --config vite.pages.config.ts
```

Expected: preview prints a local URL. Keep the session running for browser checks.

- [ ] **Step 3: Inspect desktop at 1440×1000**

Using the browser automation skill, verify and capture evidence for:

- Arctic root header, title, status strip, gauge, five sections, charts, comparison, timeline, and footer;
- 2025/2027/2033 gauge buttons and live note updates;
- source links and explicit authored/automatic labels;
- no clipped Korean copy, chart legends, or table headers;
- Steel navigation opens `/SteelSignal/steel/` and the old dashboard loads, charts toggle, table is newest-first, and CSV button remains present;
- browser console has no React, hydration, chart-size, CORS, or asset-path errors.

- [ ] **Step 4: Inspect mobile at 390×844**

Verify:

- nav scrolls horizontally without causing page-wide horizontal overflow;
- all grids collapse to one column;
- gauge percentages and labels remain legible;
- Recharts containers have non-zero height;
- 4A table scroll region is keyboard/touch reachable;
- focus rings are visible;
- Steel route remains usable and its chart/table do not overflow the viewport.

- [ ] **Step 5: Verify live, stale, and missing states**

Use browser devtools/network stubbing or test-only fixture replacement without committing it:

- live public JSON shows `최신` and no fallback banner;
- blocked JSON request shows snapshot plus `업데이트 지연` banner and retry;
- a fixture with empty EIA or NSIDC data shows `데이터 확인 필요`, official link, and no broken empty SVG;
- stale OFAC with fresh EU displays separate statuses.

Restore the real fallback and source URL before continuing.

- [ ] **Step 6: Run final secret and artifact scans**

Run:

```bash
rg -n "EIA_API_KEY|api_key=|FRED_API_KEY|ECOS_API_KEY|VITE_|NEXT_PUBLIC_|X-Amz-|token=" app pages-static pages-dist dist tests .github
find pages-dist -name '.env*' -o -name '.git' -o -name 'node_modules'
git status --short --branch
```

Expected: no secret-bearing or tokenized strings; no local config/source-control/dependency directories in artifacts; only intentional tracked changes.

- [ ] **Step 7: Fix verified defects with focused regression tests**

For every defect, first add or tighten a test that reproduces it, observe failure, apply the minimal fix, and rerun the focused plus full suites. Do not make untested visual or routing fixes.

- [ ] **Step 8: Commit final verification fixes if any**

```bash
git add <only verified fix files and their tests>
git commit -m "fix: polish arctic dashboard verification"
```

Skip this commit if verification required no changes.

- [ ] **Step 9: Final branch summary**

Run:

```bash
git log --oneline --decorate origin/main..HEAD
git diff --stat origin/main...HEAD
git status --short --branch
```

Expected: a reviewable series of focused commits; no uncommitted product files; any pre-existing untracked `.superpowers/` remains untouched and called out in the handoff.

## Deployment Order

1. Complete and publish the ToSuhyeon data branch first.
2. Trigger the monthly and daily workflows manually once and verify the main-branch public JSON.
3. Refresh `app/data/arctic-dashboard-fallback.json` from that same validated JSON if the bootstrap changed after UI development.
4. Complete SteelSignal tests and browser verification.
5. Publish SteelSignal only after both root and `/steel/` builds pass and the runtime JSON returns through the public raw GitHub URL.

This order prevents the newly deployed Arctic root from depending on a public data path that does not yet exist; the bundled snapshot still protects users from later network outages.
