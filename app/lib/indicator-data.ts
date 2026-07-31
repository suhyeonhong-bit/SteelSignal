export type IndicatorRow = {
  month: string;
  koreaBaseRatePercent: number | null;
  usSteelPpiIndex: number | null;
};

export type IndicatorMetricKey =
  | "koreaBaseRatePercent"
  | "usSteelPpiIndex";

export type LatestMetric = {
  value: number | null;
  month: string | null;
};

const EXPECTED_HEADERS = [
  "month",
  "korea_base_rate_percent",
  "us_steel_ppi_index",
] as const;

export class IndicatorDataError extends Error {
  readonly kind = "format";

  constructor(message = "CSV format is invalid") {
    super(message);
    this.name = "IndicatorDataError";
  }
}

function parseMonth(value: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new IndicatorDataError();
  }
  return value;
}

function parseOptionalNumber(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new IndicatorDataError();
  return parsed;
}

export function parseIndicatorCsv(csvText: string): IndicatorRow[] {
  const normalized = csvText.replace(/^\uFEFF/, "").trim();
  const [headerLine, ...lines] = normalized.split(/\r?\n/);
  if (!headerLine) throw new IndicatorDataError();

  const headers = headerLine.split(",");
  if (
    headers.length !== EXPECTED_HEADERS.length ||
    headers.some((header, index) => header !== EXPECTED_HEADERS[index])
  ) {
    throw new IndicatorDataError();
  }

  const seen = new Set<string>();
  const rows = lines
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const cells = line.split(",");
      if (cells.length !== 3) throw new IndicatorDataError();

      const month = parseMonth(cells[0]);
      if (seen.has(month)) throw new IndicatorDataError();
      seen.add(month);

      return {
        month,
        koreaBaseRatePercent: parseOptionalNumber(cells[1]),
        usSteelPpiIndex: parseOptionalNumber(cells[2]),
      };
    })
    .sort((left, right) => left.month.localeCompare(right.month));

  if (rows.length === 0) throw new IndicatorDataError();
  return rows;
}

export function getLatestMetric(
  rows: IndicatorRow[],
  key: IndicatorMetricKey,
): LatestMetric {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index][key];
    if (value !== null) return { value, month: rows[index].month };
  }
  return { value: null, month: null };
}

export function getLatestDataMonth(rows: IndicatorRow[]): string | null {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (
      rows[index].koreaBaseRatePercent !== null ||
      rows[index].usSteelPpiIndex !== null
    ) {
      return rows[index].month;
    }
  }
  return null;
}

export function formatMonth(month: string | null): string {
  if (!month) return "기준월 없음";
  const [year, monthNumber] = month.split("-");
  return `${year}년 ${Number(monthNumber)}월`;
}

export function formatRate(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)}%`;
}

export function formatPpi(value: number | null): string {
  return value === null ? "—" : value.toFixed(3);
}
