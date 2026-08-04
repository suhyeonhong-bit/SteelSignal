import assert from "node:assert/strict";
import test from "node:test";

import { parseArcticDashboard } from "../app/lib/arctic-data.mjs";

function validDocument() {
  const source = (url, extra = {}) => ({
    status: "fresh",
    hasData: true,
    lastAttemptAt: "2026-08-04T05:27:21Z",
    lastSuccessAt: "2026-08-04T05:27:21Z",
    dataThrough: "2026-08-02",
    url,
    contentHash: `sha256:${"a".repeat(64)}`,
    ...extra,
  });
  const watch = (id, label) => ({
    id,
    label,
    ofac: { listed: false, matches: [] },
    eu: { listed: false, matches: [] },
  });
  const point = {
    date: "2026-08-02",
    extent: 6.123,
    unit: "10^6 sq km",
    missing: 0,
    source: "NSIDC Sea Ice Index v4",
  };
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-04T05:27:21Z",
    sources: {
      eia: source("https://www.eia.gov/outlooks/steo/", { dataThrough: "2027", edition: "2026-08" }),
      ofac: source("https://ofac.treasury.gov/sanctions-list-service"),
      eu: source("https://data.europa.eu/data/datasets/example"),
      nsidc: source("https://noaadata.apps.nsidc.org/example.csv"),
    },
    energy: {
      usLngExports: [{ period: "2025", value: 15, unit: "billion cubic feet per day", kind: "actual", source: "EIA STEO" }, { period: "2026", value: 17.5, unit: "billion cubic feet per day", kind: "forecast", source: "EIA STEO" }],
      usDryGasProduction: [{ period: "2025", value: 105.9, unit: "billion cubic feet per day", kind: "actual", source: "EIA STEO" }],
      henryHub: [{ period: "2025", value: 3.53, unit: "dollars per million Btu", kind: "actual", source: "EIA STEO" }],
    },
    sanctions: {
      watchlist: [
        watch("novatek", "NOVATEK"),
        watch("yamal-lng", "Yamal LNG"),
        watch("leonid-mikhelson", "Leonid Mikhelson"),
        watch("gennady-timchenko", "Gennady Timchenko"),
      ],
    },
    seaIce: { latest: point, daily: [point] },
  };
}

test("parses the fixed Arctic dashboard contract", () => {
  const parsed = parseArcticDashboard(validDocument());
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.energy.usLngExports[1].kind, "forecast");
  assert.equal(parsed.seaIce.latest.extent, 6.123);
});

test("rejects unsupported schemas, bad hashes and duplicate periods", () => {
  const unsupported = validDocument();
  unsupported.schemaVersion = 2;
  assert.throws(() => parseArcticDashboard(unsupported), /Arctic dashboard data/);

  const badHash = validDocument();
  badHash.sources.eia.contentHash = "bad";
  assert.throws(() => parseArcticDashboard(badHash), /Arctic dashboard data/);

  const duplicate = validDocument();
  duplicate.energy.usLngExports.push({ ...duplicate.energy.usLngExports[0] });
  assert.throws(() => parseArcticDashboard(duplicate), /Arctic dashboard data/);
});

test("rejects sanctions state mismatches and a sea-ice latest mismatch", () => {
  const sanctions = validDocument();
  sanctions.sanctions.watchlist[0].ofac.listed = true;
  assert.throws(() => parseArcticDashboard(sanctions), /Arctic dashboard data/);

  const seaIce = validDocument();
  seaIce.seaIce.latest = { ...seaIce.seaIce.latest, extent: 9.9 };
  assert.throws(() => parseArcticDashboard(seaIce), /Arctic dashboard data/);
});
