# Arctic Data Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate, tested Arctic-energy collector to `suhyeonhong-bit/ToSuhyeon` that publishes `data/processed/arctic_dashboard.json` from official EIA, OFAC, EU, and NSIDC sources without exposing the EIA key.

**Architecture:** Keep the existing ECOS/FRED collector untouched. A new `collect_arctic_data.py` CLI dispatches either the monthly EIA group or the daily OFAC/EU/NSIDC group. Each source fetcher returns normalized data plus safe provenance metadata; the manifest layer merges successes with the last valid public JSON, marks failed requested sources stale, validates the complete document, and performs one atomic replacement. Separate GitHub Actions workflows share one concurrency group so they never race on the public JSON.

**Tech Stack:** Python 3.9 standard library (`urllib`, `json`, `csv`, `hashlib`, `dataclasses`, `unittest`), GitHub Actions.

## Global Constraints

- Work in a dedicated ToSuhyeon worktree created from current `origin/main`; do not modify the user's clean main checkout.
- Preserve `collect_data.py`, `collector/`, `monthly_indicators.csv`, and the existing monthly economic workflow behavior.
- Use only official public endpoints listed below. Do not execute downloaded HTML or scripts.
- Read `EIA_API_KEY` only from the local `.env` or process environment. Never log a request URL containing the key and never store the key, key-bearing URL, or redirect URL.
- Match sanctions by normalized exact alias only. Do not infer ownership, OFAC's 50% rule, sanctions evasion, or legal liability.
- Treat NSIDC's figure as Arctic-wide sea-ice extent. Do not convert it to NSR navigable days.
- Keep raw OFAC/EU lists out of Git. Commit only the compact normalized dashboard JSON.
- Use test-driven development: write each failing test, observe the expected failure, implement the smallest passing change, rerun the focused test, then run the complete suite.
- Commit after every task using the commit messages shown below.

## Fixed Public Contract

The generated document must conform to this exact shape. JSON property order is not semantically significant, but `save_dashboard` writes it deterministically with `sort_keys=True`, `indent=2`, UTF-8, and a trailing newline.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-04T00:00:00Z",
  "sources": {
    "eia": {
      "status": "fresh",
      "hasData": true,
      "lastAttemptAt": "2026-08-04T00:00:00Z",
      "lastSuccessAt": "2026-08-04T00:00:00Z",
      "dataThrough": "2027",
      "url": "https://www.eia.gov/outlooks/steo/",
      "contentHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      "edition": "2026-08"
    },
    "ofac": {
      "status": "fresh",
      "hasData": true,
      "lastAttemptAt": "2026-08-04T00:00:00Z",
      "lastSuccessAt": "2026-08-04T00:00:00Z",
      "dataThrough": "2026-08-04",
      "url": "https://ofac.treasury.gov/sanctions-list-service",
      "contentHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    },
    "eu": {
      "status": "fresh",
      "hasData": true,
      "lastAttemptAt": "2026-08-04T00:00:00Z",
      "lastSuccessAt": "2026-08-04T00:00:00Z",
      "dataThrough": "2026-07-31",
      "url": "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions?locale=en",
      "contentHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    },
    "nsidc": {
      "status": "fresh",
      "hasData": true,
      "lastAttemptAt": "2026-08-04T00:00:00Z",
      "lastSuccessAt": "2026-08-04T00:00:00Z",
      "dataThrough": "2026-08-02",
      "url": "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv",
      "contentHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    }
  },
  "energy": {
    "usLngExports": [
      {
        "period": "2025",
        "value": 15.0,
        "unit": "billion cubic feet per day",
        "kind": "actual",
        "source": "EIA STEO"
      }
    ],
    "usDryGasProduction": [],
    "henryHub": []
  },
  "sanctions": {
    "watchlist": [
      {
        "id": "gennady-timchenko",
        "label": "Gennady Timchenko",
        "ofac": {
          "listed": true,
          "matches": [
            {
              "officialName": "TIMCHENKO, Gennady Nikolayevich",
              "list": "SDN",
              "programs": ["RUSSIA-EO14024", "UKRAINE-EO13661"],
              "officialId": "16666"
            }
          ]
        },
        "eu": {
          "listed": true,
          "matches": [
            {
              "officialName": "Gennady Nikolayevich TIMCHENKO",
              "list": "EU Consolidated Financial Sanctions List",
              "programs": ["UKR"],
              "officialId": "EU.7536.45"
            }
          ]
        }
      }
    ]
  },
  "seaIce": {
    "latest": {
      "date": "2026-08-02",
      "extent": 6.123,
      "unit": "10^6 sq km",
      "missing": 0.0,
      "source": "NSIDC Sea Ice Index v4"
    },
    "daily": []
  }
}
```

An uncollected source keeps the same metadata keys with `status: "stale"`, `hasData: false`, and `null` for dates, hash, and source-specific fields. A failed source that has prior data keeps its previous data and provenance, sets `status: "stale"`, and updates only `lastAttemptAt`.

## Task 1: Isolate the ToSuhyeon Worktree and Add Arctic Configuration

**Files:**

- Create: ToSuhyeon worktree under the writable workspace, for example `.worktrees/tosuhyeon-arctic-data`
- Create: `arctic_collector/__init__.py`
- Create: `arctic_collector/errors.py`
- Create: `arctic_collector/config.py`
- Create: `tests/test_arctic_config.py`
- Modify: `.gitignore`

- [ ] **Step 1: Confirm both repositories are clean enough to start**

Run:

```bash
git status --short --branch
git -C /Users/suhyeonhong/Documents/GitHub/ToSuhyeon status --short --branch
```

Expected: the SteelSignal worktree may contain only known planning artifacts; the ToSuhyeon main checkout has no tracked edits. Stop if unrelated tracked edits appear.

- [ ] **Step 2: Fetch and create the isolated ToSuhyeon branch**

Run:

```bash
git -C /Users/suhyeonhong/Documents/GitHub/ToSuhyeon fetch origin
git -C /Users/suhyeonhong/Documents/GitHub/ToSuhyeon worktree add /Users/suhyeonhong/Documents/GitHub/SteelSignal/.worktrees/steel-signal-dashboard/.worktrees/tosuhyeon-arctic-data -b feature/arctic-data-automation origin/main
```

Expected: a new worktree on `feature/arctic-data-automation` based on current `origin/main`.

- [ ] **Step 3: Write failing configuration tests**

`tests/test_arctic_config.py` must define five concrete unittest methods named
`test_reads_eia_key_from_env_file`, `test_environment_overrides_file`,
`test_daily_group_does_not_require_eia_key`,
`test_missing_monthly_key_names_variable_without_exposing_values`, and
`test_whitespace_in_key_is_rejected`. Each method creates its own temporary
`.env` and asserts the exact result or safe error text.

Run:

```bash
python3 -m unittest tests.test_arctic_config -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'arctic_collector'`.

- [ ] **Step 4: Implement the minimal config API**

Use this public interface:

```python
@dataclass(frozen=True)
class ArcticConfig:
    eia_api_key: Optional[str]

LOAD_ARCTIC_CONFIG_SIGNATURE = (
    "load_arctic_config(env_path: Path, require_eia: bool, "
    "environ: Optional[Mapping[str, str]] = None) -> ArcticConfig"
)
```

Reuse the existing `.env` parsing behavior conceptually, but do not change `collector.config`. The Arctic error type is:

`ArcticCollectorError` subclasses `Exception` and its constructor accepts
`source: str`, `kind: str`, `message: str`, and optional `status: int`. Store
those four fields as read-only public attributes and pass only the sanitized
message to `Exception.__init__`.

Its `str()` output may include the source, safe kind, and HTTP status, but never a secret or full request URL.

Append only these generated or local patterns if absent:

```gitignore
data/processed/arctic_dashboard.json.tmp
```

`.env` is already ignored and must remain so.

- [ ] **Step 5: Run focused and complete tests**

Run:

```bash
python3 -m unittest tests.test_arctic_config -v
python3 -m unittest discover -s tests -v
```

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add .gitignore arctic_collector tests/test_arctic_config.py
git commit -m "feat: add arctic collector configuration"
```

## Task 2: Collect and Normalize EIA STEO Series

**Files:**

- Create: `arctic_collector/eia.py`
- Create: `tests/fixtures/eia_steo_annual.json`
- Create: `tests/test_arctic_eia.py`

Official route:

```text
https://api.eia.gov/v2/steo/data/
```

Fixed annual series:

```python
SERIES = {
    "NGEXPUS_LNG": "usLngExports",
    "NGPRPUS": "usDryGasProduction",
    "NGHHUUS": "henryHub",
}
```

- [ ] **Step 1: Add a minimal official-response fixture and failing parser tests**

The fixture must contain 2016, 2025, 2026, and 2027 rows for all three series with the real response fields `period`, `seriesId`, `seriesDescription`, `value`, and `unit`. Tests must prove ordering, numeric conversion, original unit preservation, series routing, unknown-series rejection, duplicate-period rejection, and classification as `actual` before the collection year and `forecast` from the collection year onward.

Use this interface:

Required callable signature: `parse_eia_steo(payload: Mapping[str, object],
as_of: date) -> Dict[str, List[Dict[str, object]]]`.

Run:

```bash
python3 -m unittest tests.test_arctic_eia -v
```

Expected: FAIL because `arctic_collector.eia` does not exist.

- [ ] **Step 2: Add failing request-security tests**

Tests inject a fake opener and assert:

- the request path is `/v2/steo/data/`;
- query contains `frequency=annual`, `data[0]=value`, the three `facets[seriesId][]` values, `start=2016`, ascending period sort, and a sufficient `length`;
- the key is sent only in the actual request query;
- a simulated HTTP error produces `ArcticCollectorError(source="eia", kind="http", status=503)` whose string does not contain the key or URL;
- returned metadata uses the safe public STEO page URL, not the key-bearing API URL.

- [ ] **Step 3: Implement fetch, hash, and parse**

Public interface:

```python
@dataclass(frozen=True)
class SourceResult:
    data: Mapping[str, object]
    content_hash: str
    data_through: str
    edition: Optional[str] = None

FETCH_EIA_STEO_SIGNATURE = (
    "fetch_eia_steo(api_key: str, as_of: date, "
    "opener: Callable = urlopen) -> SourceResult"
)
```

Construct the query with `urllib.parse.urlencode(query_items, doseq=True)` and decode JSON from bytes. Calculate the hash from the exact response bytes as `sha256:<hex>`. Never include the API URL in an exception. Normalize each point to:

```python
{
    "period": "2027",
    "value": 18.1,
    "unit": "billion cubic feet per day",
    "kind": "forecast",
    "source": "EIA STEO",
}
```

Set `edition` to the collection month (`YYYY-MM`) and `data_through` to the maximum returned year.

- [ ] **Step 4: Run tests and confirm no secret appears**

Run:

```bash
python3 -m unittest tests.test_arctic_eia -v
python3 -m unittest discover -s tests -v
rg -n "api_key=|EIA_API_KEY" tests/fixtures arctic_collector/eia.py
```

Expected: tests PASS; `rg` may find the configuration variable name in source but must find no fixture key and no hardcoded query containing a real key.

- [ ] **Step 5: Commit**

```bash
git add arctic_collector/eia.py tests/fixtures/eia_steo_annual.json tests/test_arctic_eia.py
git commit -m "feat: collect EIA arctic energy series"
```

## Task 3: Collect OFAC and EU Direct-Listing Matches

**Files:**

- Create: `arctic_collector/sanctions.py`
- Create: `tests/fixtures/ofac_sdn.csv`
- Create: `tests/fixtures/ofac_non_sdn.csv`
- Create: `tests/fixtures/eu_distributions.json`
- Create: `tests/fixtures/eu_sanctions.csv`
- Create: `tests/test_arctic_sanctions.py`

Official download compatibility endpoints:

```text
https://www.treasury.gov/ofac/downloads/sdn.csv
https://www.treasury.gov/ofac/downloads/consolidated/cons_prim.csv
```

EU distribution resolver:

```text
https://data.europa.eu/api/hub/repo/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions/distributions?valueType=metadata&limit=100
```

- [ ] **Step 1: Define the exact watchlist aliases in a failing test**

The production constant is fixed to these bounded aliases after uppercasing, Unicode NFKD normalization, punctuation-to-space conversion, and whitespace collapse:

```python
WATCHLIST = {
    "novatek": {
        "label": "NOVATEK",
        "aliases": {
            "NOVATEK", "PAO NOVATEK", "NOVATEK PAO",
            "PUBLIC JOINT STOCK COMPANY NOVATEK",
        },
    },
    "yamal-lng": {
        "label": "Yamal LNG",
        "aliases": {"YAMAL LNG", "OAO YAMAL LNG", "YAMAL LNG JSC"},
    },
    "leonid-mikhelson": {
        "label": "Leonid Mikhelson",
        "aliases": {
            "LEONID MIKHELSON", "MIKHELSON LEONID",
            "LEONID VIKTOROVICH MIKHELSON",
            "MIKHELSON LEONID VIKTOROVICH",
        },
    },
    "gennady-timchenko": {
        "label": "Gennady Timchenko",
        "aliases": {
            "GENNADY TIMCHENKO", "TIMCHENKO GENNADY",
            "GENNADY NIKOLAYEVICH TIMCHENKO",
            "TIMCHENKO GENNADY NIKOLAYEVICH",
        },
    },
}
```

Tests must prove `NOVATEK` does not match `NOVATEK MURMANSK`, `YAMAL LNG` does not match `YAMALPROMGEOFIZIKA`, and `Gennady Timchenko` does not match `Elena Timchenko`.

- [ ] **Step 2: Add OFAC fixture and failing parser tests**

Use headerless official primary-row order:

```text
ent_num,name,type,program,title,call_sign,vessel_type,tonnage,gross_registered_tonnage,vessel_flag,vessel_owner,remarks
```

Parse `-0-` as empty. Split the bracketed OFAC program field into a sorted unique list. Produce exact direct matches only:

```python
{
    "officialName": "TIMCHENKO, Gennady Nikolayevich",
    "list": "SDN",
    "programs": ["RUSSIA-EO14024", "UKRAINE-EO13661"],
    "officialId": "16666",
}
```

Public parser:

Required callable signature: `parse_ofac_csv(text: str, list_name: str) ->
Dict[str, List[Dict[str, object]]]`.

- [ ] **Step 3: Add EU resolver and semicolon-CSV parser tests**

The EU CSV is UTF-8 with BOM, `;` delimited, and contains at least:

```text
fileGenerationDate;Entity_LogicalId;Entity_EU_ReferenceNumber;Entity_Regulation_Programme;NameAlias_LastName;NameAlias_FirstName;NameAlias_MiddleName;NameAlias_WholeName
```

Match only `NameAlias_WholeName` or the explicitly assembled first/middle/last name. De-duplicate repeated address/birth-date rows by `(watchlist id, Entity_LogicalId, officialName)`. Set `officialId` to `Entity_EU_ReferenceNumber`, program from `Entity_Regulation_Programme`, and `dataThrough` from `fileGenerationDate` converted from `DD/MM/YYYY` to ISO.

The metadata resolver must choose an English CSV distribution whose title includes `Consolidated Financial Sanctions File 1.1`, then return its `dcat:downloadURL`. The resolved signed/tokenized URL is used only in memory and never appears in output or errors.

Public parsers:

Required callable signatures are `resolve_eu_csv_url(payload:
Mapping[str, object]) -> str` and `parse_eu_csv(text: str) ->
Tuple[Dict[str, List[Dict[str, object]]], str]`.

- [ ] **Step 4: Implement source fetchers and safe hashes**

Public fetchers:

Required callable signatures are `fetch_ofac(opener=urlopen) -> SourceResult`
and `fetch_eu(opener=urlopen) -> SourceResult`.

OFAC's `content_hash` is SHA-256 over `sdn_bytes + b"\0" + non_sdn_bytes`. EU's is over the downloaded CSV bytes. Each result's `data` maps every watchlist id to its source matches, including empty arrays. Use safe public source-page URLs in metadata.

- [ ] **Step 5: Run focused and complete tests**

Run:

```bash
python3 -m unittest tests.test_arctic_sanctions -v
python3 -m unittest discover -s tests -v
```

Expected: all tests PASS, including exact-match negative cases.

- [ ] **Step 6: Commit**

```bash
git add arctic_collector/sanctions.py tests/fixtures/ofac_sdn.csv tests/fixtures/ofac_non_sdn.csv tests/fixtures/eu_distributions.json tests/fixtures/eu_sanctions.csv tests/test_arctic_sanctions.py
git commit -m "feat: track official sanctions listings"
```

## Task 4: Collect the NSIDC Daily Sea-Ice Series

**Files:**

- Create: `arctic_collector/sea_ice.py`
- Create: `tests/fixtures/nsidc_sea_ice.csv`
- Create: `tests/test_arctic_sea_ice.py`

Official CSV:

```text
https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv
```

- [ ] **Step 1: Add a fixture that preserves the two official header rows**

The first two lines must be:

```csv
Year, Month, Day,     Extent,    Missing, Source Data
YYYY,    MM,  DD, 10^6 sq km, 10^6 sq km, Source data product web sites: http://nsidc.org/data/nsidc-0081.html and http://nsidc.org/data/nsidc-0051.html
```

Include valid rows crossing a year boundary, one duplicate-date case in a separate test string, and one malformed numeric case.

- [ ] **Step 2: Write failing tests for parsing and retention**

Public APIs:

Required callable signatures are `parse_nsidc_csv(text: str, retain_days: int
= 400) -> Dict[str, object]` and `fetch_nsidc(opener=urlopen) ->
SourceResult`.

Tests prove:

- whitespace around headers and values is stripped;
- row 2 is skipped as units, not parsed as data;
- `date` is ISO and `extent`/`missing` are finite floats;
- rows are sorted ascending and duplicate dates are rejected;
- only the latest 400 observations are retained;
- `latest` is the newest observation;
- unit remains exactly `10^6 sq km`;
- no NSR-day field is created;
- response-byte hash and safe URL metadata are correct.

Run:

```bash
python3 -m unittest tests.test_arctic_sea_ice -v
```

Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement the parser and fetcher**

Each daily row is:

```python
{
    "date": "2026-08-02",
    "extent": 6.123,
    "unit": "10^6 sq km",
    "missing": 0.0,
    "source": "NSIDC Sea Ice Index v4",
}
```

`SourceResult.data_through` is the latest date. Decode with UTF-8 BOM tolerance and raise a source-specific format error for empty or malformed data.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
python3 -m unittest tests.test_arctic_sea_ice -v
python3 -m unittest discover -s tests -v
git add arctic_collector/sea_ice.py tests/fixtures/nsidc_sea_ice.csv tests/test_arctic_sea_ice.py
git commit -m "feat: collect NSIDC sea ice extent"
```

Expected: all tests PASS and the commit succeeds.

## Task 5: Merge Partial Results and Atomically Publish the Manifest

**Files:**

- Create: `arctic_collector/manifest.py`
- Create: `arctic_collector/storage.py`
- Create: `tests/fixtures/arctic_dashboard_existing.json`
- Create: `tests/test_arctic_manifest.py`
- Create: `tests/test_arctic_storage.py`

- [ ] **Step 1: Write failing schema and merge tests**

Use these interfaces:

Set `SOURCE_NAMES = ("eia", "ofac", "eu", "nsidc")`. Required callable
signatures are `empty_dashboard() -> Dict[str, object]`,
`validate_dashboard(document: Mapping[str, object]) -> None`, and
`merge_collection_results(previous: Optional[Mapping[str, object]],
requested_sources: Sequence[str], successes: Mapping[str, SourceResult],
failures: Mapping[str, ArcticCollectorError], attempted_at: datetime) ->
Dict[str, object]`.

Tests must cover:

- first EIA-only run creates all four source metadata entries and valid empty sanctions/sea-ice sections;
- a successful EIA run changes only `energy` and EIA metadata;
- successful OFAC and failed EU retain the prior EU matches, mark only EU stale, and still publish OFAC;
- successful NSIDC changes only `seaIce`;
- an unrequested source retains its prior status and data exactly;
- all requested failures raise and do not return a replacement document;
- `generatedAt` changes only when at least one requested source succeeds;
- invalid periods, non-finite values, malformed hashes, unknown keys in required records, and missing watchlist ids fail validation;
- every output watchlist item exists in fixed order: `novatek`, `yamal-lng`, `leonid-mikhelson`, `gennady-timchenko`.

- [ ] **Step 2: Write failing atomic-storage and secret tests**

Public APIs:

Required callable signatures are `load_dashboard(path: Path) ->
Optional[Dict[str, object]]` and `save_dashboard(path: Path, document:
Mapping[str, object], secrets: Sequence[str]) -> Path`.

Tests prove:

- valid JSON is saved with UTF-8, stable formatting, and newline;
- `os.replace` failure preserves the old file;
- invalid prior JSON is rejected rather than silently overwritten;
- any non-empty secret found in serialized output blocks the write;
- a failed schema validation preserves the old file;
- temporary files are cleaned after failure.

- [ ] **Step 3: Implement manifest semantics**

For each successful source:

- set `status: "fresh"`, `hasData: true`, both attempt/success timestamps, safe URL, hash, and data-through;
- replace only that source's owned data branch;
- for OFAC/EU, replace only the corresponding nested source result inside each watchlist entry.

For each failed requested source:

- copy all prior fields and data;
- set `status: "stale"` and `lastAttemptAt`;
- if no prior success exists, use `hasData: false` and null provenance values.

Do not write error text to the public JSON; workflow logs provide the safe failure summary.

- [ ] **Step 4: Implement atomic validated storage**

Write a named temporary file in `path.parent`, flush and `os.fsync`, validate the serialized document before replacement, then call `os.replace`. The function must never delete or truncate an existing valid output on failure.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
python3 -m unittest tests.test_arctic_manifest tests.test_arctic_storage -v
python3 -m unittest discover -s tests -v
git add arctic_collector/manifest.py arctic_collector/storage.py tests/fixtures/arctic_dashboard_existing.json tests/test_arctic_manifest.py tests/test_arctic_storage.py
git commit -m "feat: publish resilient arctic dashboard data"
```

Expected: all tests PASS.

## Task 6: Add the CLI Orchestrator

**Files:**

- Create: `collect_arctic_data.py`
- Create: `tests/test_collect_arctic_data.py`

- [ ] **Step 1: Write failing orchestration tests**

The CLI contract is:

```text
python3 collect_arctic_data.py --group eia
python3 collect_arctic_data.py --group daily
python3 collect_arctic_data.py --group all
```

Public testable entry point:

Required callable signature: `run(project_root: Path, group: str, now:
Optional[datetime] = None, fetchers: Optional[Mapping[str,
Callable[[], SourceResult]]] = None) -> int`.

Tests prove:

- `eia` requests only EIA and requires the key;
- `daily` requests OFAC, EU, and NSIDC and works without an EIA key;
- `all` requests all four sources;
- one daily failure plus two successes returns 0, publishes successes, and reports a safe stale summary;
- all requested failures return 1 and preserve the old file;
- a source exception containing a fake secret is not printed verbatim;
- a naive `now` is normalized to UTC and timestamps end in `Z`;
- invalid `--group` is rejected by `argparse`.

- [ ] **Step 2: Implement orchestration**

The executable must:

1. read the previous dashboard;
2. build source fetchers for the selected group;
3. collect each requested source independently;
4. print only source name plus success count or safe error kind/status;
5. fail without writing if none succeed;
6. merge, validate, and atomically save if at least one succeeds;
7. pass the EIA secret to `save_dashboard` for final leak scanning.

No retry loop is required in this version; GitHub Actions can be manually rerun.

- [ ] **Step 3: Run focused and complete tests**

Run:

```bash
python3 -m unittest tests.test_collect_arctic_data -v
python3 -m unittest discover -s tests -v
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add collect_arctic_data.py tests/test_collect_arctic_data.py
git commit -m "feat: orchestrate arctic data collection"
```

## Task 7: Add Separate Monthly and Daily GitHub Actions

**Files:**

- Create: `.github/workflows/collect-arctic-monthly.yml`
- Create: `.github/workflows/collect-arctic-daily.yml`
- Create: `tests/test_arctic_workflows.py`
- Modify: `README.md`
- Modify: `tests/test_readme.py`

- [ ] **Step 1: Write failing workflow contract tests**

Test the workflow text for these exact requirements:

| Workflow | Schedule, Asia/Seoul | CLI | Secret |
|---|---|---|---|
| monthly | `30 9 15 * *` with `timezone: "Asia/Seoul"` | `--group eia` | `EIA_API_KEY: ${{ secrets.EIA_API_KEY }}` |
| daily | `10 9 * * *` with `timezone: "Asia/Seoul"` | `--group daily` | none |

Both must have `workflow_dispatch`, `permissions: contents: write`, `concurrency.group: arctic-dashboard-data`, `cancel-in-progress: false`, Python 3.9, a full unittest step before collection, a 15-minute timeout, and a commit step that stages only `data/processed/arctic_dashboard.json`.

The tests must reject `pull_request`, `VITE_`, `NEXT_PUBLIC_`, wildcard `git add`, API-key echoing, and staging `data/raw`.

- [ ] **Step 2: Implement both workflows**

Use `actions/checkout@v6` with `ref: main`, `actions/setup-python@v6`, bot identity, and a no-change exit. Commit messages:

```text
data: refresh monthly arctic energy YYYY-MM-DD
data: refresh daily arctic signals YYYY-MM-DD
```

Before `git push origin HEAD:main`, run:

```bash
git pull --rebase origin main
```

The shared concurrency group prevents the two Arctic jobs from rebasing over each other. It intentionally remains separate from the existing economic workflow group.

- [ ] **Step 3: Document local and public usage**

README additions must state:

- local `.env` line uses `EIA_API_KEY=<issued key>` with no quotes or spaces;
- the key belongs only in ToSuhyeon, never SteelSignal;
- daily sources require no key;
- three CLI commands and their cadence;
- public JSON path and raw GitHub URL;
- what is automated versus research-authored;
- direct-listing and sea-ice/NSR limitations;
- official source links.

- [ ] **Step 4: Run tests and workflow scan**

Run:

```bash
python3 -m unittest tests.test_arctic_workflows tests.test_readme -v
python3 -m unittest discover -s tests -v
rg -n "EIA_API_KEY|VITE_|NEXT_PUBLIC_|pull_request|git add" .github/workflows README.md
```

Expected: tests PASS; only the monthly workflow references the EIA secret; both Arctic workflows stage the exact public JSON path.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/collect-arctic-monthly.yml .github/workflows/collect-arctic-daily.yml tests/test_arctic_workflows.py README.md tests/test_readme.py
git commit -m "ci: schedule arctic data refreshes"
```

## Task 8: Bootstrap and Verify the First Public JSON

**Files:**

- Create: `data/processed/arctic_dashboard.json`

- [ ] **Step 1: Run the complete offline suite before network collection**

Run:

```bash
python3 -m unittest discover -s tests -v
```

Expected: all tests PASS with no network and no real key.

- [ ] **Step 2: Run the real collector locally**

Run from the isolated ToSuhyeon worktree where `.env` is available or export the key only for the command session:

```bash
python3 collect_arctic_data.py --group all
```

Expected: EIA, OFAC, EU, and NSIDC report success; `data/processed/arctic_dashboard.json` is created. If an official source is temporarily unavailable, run the successful group, keep the failed source stale, and use `workflow_dispatch` later; do not fabricate data.

- [ ] **Step 3: Validate schema, size, and secret absence**

Run:

```bash
python3 -m json.tool data/processed/arctic_dashboard.json
wc -c data/processed/arctic_dashboard.json
git diff --check
git status --short
```

Expected: valid JSON, compact size consistent with 400 sea-ice rows and watchlist matches rather than full sanctions lists, no whitespace errors, only intended files changed.

Search using the local key value without printing the value. Use a small Python assertion that reads `.env`, extracts `EIA_API_KEY`, and asserts the secret bytes are absent from the output; the assertion prints only `secret scan: PASS`.

- [ ] **Step 4: Run source-specific sanity assertions**

Use a short read-only Python command to assert:

- all three energy series are non-empty and start at 2016 or later;
- max energy period equals `sources.eia.dataThrough`;
- the four watchlist ids appear exactly once;
- Gennady Timchenko is directly listed by current official sources if the downloaded lists say so, without hardcoding that result in production;
- `seaIce.latest` equals the final `seaIce.daily` row;
- no key names, request query strings, signed EU URL, or full sanctions-list payload appears.

- [ ] **Step 5: Commit generated public data**

```bash
git add data/processed/arctic_dashboard.json
git commit -m "data: bootstrap arctic dashboard"
```

- [ ] **Step 6: Final repository verification**

Run:

```bash
python3 -m unittest discover -s tests -v
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: all tests PASS; no unintended or secret-bearing files are tracked; branch contains only Arctic collector, workflows, documentation, fixtures/tests, and the compact public JSON.

## Handoff to the UI Plan

The SteelSignal implementation may begin against a committed fallback copy of this public JSON as soon as Task 8 is complete. Its runtime URL is fixed to:

```text
https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/arctic_dashboard.json
```

Do not merge or deploy the SteelSignal UI until the same schema fixture passes both Python validation and TypeScript parsing tests.
