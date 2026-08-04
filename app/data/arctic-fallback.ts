const energyPoint = (period: string, value: number, unit: string, kind: "actual" | "forecast") => ({
  period,
  value,
  unit,
  kind,
  source: "EIA STEO" as const,
});

const gasUnit = "billion cubic feet per day";
const priceUnit = "dollars per million Btu";
const years = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027"];
const kinds = years.map((year) => (Number(year) >= 2026 ? "forecast" as const : "actual" as const));

const ice = [
  ["2026-07-22", 7.111], ["2026-07-23", 7.029], ["2026-07-24", 6.972],
  ["2026-07-25", 6.832], ["2026-07-26", 6.787], ["2026-07-27", 6.683],
  ["2026-07-28", 6.565], ["2026-07-29", 6.544], ["2026-07-30", 6.507],
  ["2026-07-31", 6.526], ["2026-08-01", 6.495], ["2026-08-02", 6.479],
].map(([date, extent]) => ({
  date: String(date),
  extent: Number(extent),
  unit: "10^6 sq km" as const,
  missing: 0,
  source: "NSIDC Sea Ice Index v4" as const,
}));

export const ARCTIC_FALLBACK = {
  schemaVersion: 1 as const,
  generatedAt: "2026-08-04T05:27:21Z",
  sources: {
    eia: {
      status: "fresh" as const,
      hasData: true,
      lastAttemptAt: "2026-08-04T05:26:16Z",
      lastSuccessAt: "2026-08-04T05:26:16Z",
      dataThrough: "2027",
      url: "https://www.eia.gov/outlooks/steo/",
      contentHash: "sha256:e68d93bf8d021966489276809f8063947db5a1a89b29adf43d7425b33c6c2eb1",
      edition: "2026-08",
    },
    ofac: {
      status: "fresh" as const,
      hasData: true,
      lastAttemptAt: "2026-08-04T05:27:21Z",
      lastSuccessAt: "2026-08-04T05:27:21Z",
      dataThrough: "2026-08-04",
      url: "https://ofac.treasury.gov/sanctions-list-service",
      contentHash: "sha256:42ac662c72d2a5337a9d0d8fb2d213bec86c35e20d01b5447d2bcc22fa71c4ae",
    },
    eu: {
      status: "fresh" as const,
      hasData: true,
      lastAttemptAt: "2026-08-04T05:27:21Z",
      lastSuccessAt: "2026-08-04T05:27:21Z",
      dataThrough: "2026-07-31",
      url: "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions?locale=en",
      contentHash: "sha256:094fa61d2766d3dc9c0752dd3aedc09cd1401a068e11e3f4a0901a272da968d1",
    },
    nsidc: {
      status: "fresh" as const,
      hasData: true,
      lastAttemptAt: "2026-08-04T05:27:21Z",
      lastSuccessAt: "2026-08-04T05:27:21Z",
      dataThrough: "2026-08-02",
      url: "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv",
      contentHash: "sha256:ad8f8a7a9e4384a0107a13933b551228eacf0f55c1aa653e12d4b2d230dcdcef",
    },
  },
  energy: {
    usLngExports: [0.51049440164, 1.938471011, 2.9674461699, 4.9850602137, 6.5299534399, 9.7556656767, 10.590803704, 11.898703219, 11.932158265, 15.093106573, 17.411451378, 18.614648909].map((value, index) => energyPoint(years[index], value, gasUnit, kinds[index])),
    usDryGasProduction: [72.656038251, 74.90569589, 84.313065753, 92.874016438, 92.380114754, 94.600742466, 99.328594521, 103.15734795, 103.07356557, 107.65447397, 111.24731507, 115.30405808].map((value, index) => energyPoint(years[index], value, gasUnit, kinds[index])),
    henryHub: [2.5149166667, 2.9865, 3.1664166667, 2.5650833333, 2.0333333333, 3.9083333333, 6.4183333333, 2.5358333333, 2.1933333333, 3.5266666667, 3.6699643333, 3.4903939167].map((value, index) => energyPoint(years[index], value, priceUnit, kinds[index])),
  },
  sanctions: {
    watchlist: [
      { id: "novatek" as const, label: "NOVATEK", ofac: { listed: false, matches: [] }, eu: { listed: false, matches: [] } },
      { id: "yamal-lng" as const, label: "Yamal LNG", ofac: { listed: false, matches: [] }, eu: { listed: false, matches: [] } },
      { id: "leonid-mikhelson" as const, label: "Leonid Mikhelson", ofac: { listed: false, matches: [] }, eu: { listed: false, matches: [] } },
      {
        id: "gennady-timchenko" as const,
        label: "Gennady Timchenko",
        ofac: { listed: true, matches: [{ officialName: "TIMCHENKO, Gennady Nikolayevich", list: "SDN", programs: ["RUSSIA-EO14024", "UKRAINE-EO13661"], officialId: "16666" }] },
        eu: { listed: true, matches: [{ officialName: "Gennady Nikolayevich TIMCHENKO", list: "EU Consolidated Financial Sanctions List", programs: ["UKR"], officialId: "EU.7536.45" }] },
      },
    ],
  },
  seaIce: { latest: ice.at(-1)!, daily: ice },
};
