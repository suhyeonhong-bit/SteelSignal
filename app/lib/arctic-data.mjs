export const ARCTIC_DATA_URL =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/arctic_dashboard.json";

const SOURCE_NAMES = ["eia", "ofac", "eu", "nsidc"];
const WATCHLIST = [
  ["novatek", "NOVATEK"],
  ["yamal-lng", "Yamal LNG"],
  ["leonid-mikhelson", "Leonid Mikhelson"],
  ["gennady-timchenko", "Gennady Timchenko"],
];

export class ArcticDataError extends Error {
  constructor() {
    super("Arctic dashboard data is invalid");
    this.name = "ArcticDataError";
  }
}

function fail() {
  throw new ArcticDataError();
}

function record(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail();
  return value;
}

function exactKeys(value, expected) {
  const keys = Object.keys(value).sort();
  const required = [...expected].sort();
  if (keys.length !== required.length || keys.some((key, index) => key !== required[index])) fail();
}

function isoTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) fail();
  if (!Number.isFinite(Date.parse(value))) fail();
  return value;
}

function optionalTimestamp(value) {
  if (value !== null) isoTimestamp(value);
}

function finiteNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) fail();
  return value;
}

function sourceMetadata(value, name) {
  const source = record(value);
  const keys = ["status", "hasData", "lastAttemptAt", "lastSuccessAt", "dataThrough", "url", "contentHash"];
  if (name === "eia") keys.push("edition");
  exactKeys(source, keys);
  if (source.status !== "fresh" && source.status !== "stale") fail();
  if (typeof source.hasData !== "boolean") fail();
  optionalTimestamp(source.lastAttemptAt);
  optionalTimestamp(source.lastSuccessAt);
  if (typeof source.url !== "string" || !source.url.startsWith("https://")) fail();
  if (source.dataThrough !== null && typeof source.dataThrough !== "string") fail();
  if (source.hasData) {
    if (source.lastSuccessAt === null || source.dataThrough === null) fail();
    if (typeof source.contentHash !== "string" || !/^sha256:[0-9a-f]{64}$/.test(source.contentHash)) fail();
  } else if (source.contentHash !== null) {
    fail();
  }
  if (name === "eia" && source.edition !== null && !/^\d{4}-\d{2}$/.test(source.edition)) fail();
}

function energySeries(value) {
  if (!Array.isArray(value)) fail();
  let previous = "";
  let unit = null;
  for (const candidate of value) {
    const point = record(candidate);
    exactKeys(point, ["period", "value", "unit", "kind", "source"]);
    if (typeof point.period !== "string" || !/^\d{4}$/.test(point.period) || point.period <= previous) fail();
    previous = point.period;
    finiteNumber(point.value);
    if (typeof point.unit !== "string" || !point.unit) fail();
    if (unit === null) unit = point.unit;
    if (point.unit !== unit) fail();
    if (point.kind !== "actual" && point.kind !== "forecast") fail();
    if (point.source !== "EIA STEO") fail();
  }
}

function sanctionMatch(value) {
  const match = record(value);
  exactKeys(match, ["officialName", "list", "programs", "officialId"]);
  for (const key of ["officialName", "list", "officialId"]) {
    if (typeof match[key] !== "string" || !match[key]) fail();
  }
  if (!Array.isArray(match.programs) || match.programs.some((program) => typeof program !== "string" || !program)) fail();
}

function sanctionSource(value) {
  const source = record(value);
  exactKeys(source, ["listed", "matches"]);
  if (typeof source.listed !== "boolean" || !Array.isArray(source.matches)) fail();
  source.matches.forEach(sanctionMatch);
  if (source.listed !== (source.matches.length > 0)) fail();
}

function seaIcePoint(value) {
  const point = record(value);
  exactKeys(point, ["date", "extent", "unit", "missing", "source"]);
  if (typeof point.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(point.date)) fail();
  finiteNumber(point.extent);
  finiteNumber(point.missing);
  if (point.unit !== "10^6 sq km" || point.source !== "NSIDC Sea Ice Index v4") fail();
}

export function parseArcticDashboard(input) {
  const document = record(input);
  exactKeys(document, ["schemaVersion", "generatedAt", "sources", "energy", "sanctions", "seaIce"]);
  if (document.schemaVersion !== 1) fail();
  isoTimestamp(document.generatedAt);

  const sources = record(document.sources);
  exactKeys(sources, SOURCE_NAMES);
  SOURCE_NAMES.forEach((name) => sourceMetadata(sources[name], name));

  const energy = record(document.energy);
  exactKeys(energy, ["usLngExports", "usDryGasProduction", "henryHub"]);
  energySeries(energy.usLngExports);
  energySeries(energy.usDryGasProduction);
  energySeries(energy.henryHub);

  const sanctions = record(document.sanctions);
  exactKeys(sanctions, ["watchlist"]);
  if (!Array.isArray(sanctions.watchlist) || sanctions.watchlist.length !== WATCHLIST.length) fail();
  sanctions.watchlist.forEach((candidate, index) => {
    const item = record(candidate);
    exactKeys(item, ["id", "label", "ofac", "eu"]);
    if (item.id !== WATCHLIST[index][0] || item.label !== WATCHLIST[index][1]) fail();
    sanctionSource(item.ofac);
    sanctionSource(item.eu);
  });

  const seaIce = record(document.seaIce);
  exactKeys(seaIce, ["latest", "daily"]);
  if (!Array.isArray(seaIce.daily)) fail();
  let previousDate = "";
  for (const point of seaIce.daily) {
    seaIcePoint(point);
    if (point.date <= previousDate) fail();
    previousDate = point.date;
  }
  if (seaIce.daily.length === 0) {
    if (seaIce.latest !== null) fail();
  } else {
    seaIcePoint(seaIce.latest);
    if (JSON.stringify(seaIce.latest) !== JSON.stringify(seaIce.daily.at(-1))) fail();
  }

  return JSON.parse(JSON.stringify(document));
}
