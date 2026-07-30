import { describe, expect, it } from "vitest";
import {
  IndicatorDataError,
  formatMonth,
  formatPpi,
  formatRate,
  getLatestDataMonth,
  getLatestMetric,
  parseIndicatorCsv,
} from "../app/lib/indicator-data";

const VALID_CSV =
  "\uFEFFmonth,korea_base_rate_percent,us_steel_ppi_index\r\n" +
  "2026-04,2.5,341.281\r\n" +
  "2026-06,2.5,361.439\r\n" +
  "2026-05,,349.023\r\n";

describe("parseIndicatorCsv", () => {
  it("removes the BOM, parses numbers and sorts months ascending", () => {
    expect(parseIndicatorCsv(VALID_CSV)).toEqual([
      {
        month: "2026-04",
        koreaBaseRatePercent: 2.5,
        usSteelPpiIndex: 341.281,
      },
      {
        month: "2026-05",
        koreaBaseRatePercent: null,
        usSteelPpiIndex: 349.023,
      },
      {
        month: "2026-06",
        koreaBaseRatePercent: 2.5,
        usSteelPpiIndex: 361.439,
      },
    ]);
  });

  it.each([
    ["wrong headers", "month,rate,ppi\n2026-06,2.5,361.439"],
    ["invalid month", "month,korea_base_rate_percent,us_steel_ppi_index\n2026-13,2.5,361.439"],
    ["invalid number", "month,korea_base_rate_percent,us_steel_ppi_index\n2026-06,nope,361.439"],
    ["duplicate month", "month,korea_base_rate_percent,us_steel_ppi_index\n2026-06,2.5,361\n2026-06,2.5,362"],
    ["no rows", "month,korea_base_rate_percent,us_steel_ppi_index\n"],
  ])("rejects %s", (_label, csv) => {
    expect(() => parseIndicatorCsv(csv)).toThrow(IndicatorDataError);
  });
});

describe("metric helpers", () => {
  const rows = parseIndicatorCsv(VALID_CSV);

  it("finds each metric's last valid value independently", () => {
    expect(getLatestMetric(rows, "koreaBaseRatePercent")).toEqual({
      value: 2.5,
      month: "2026-06",
    });
    expect(getLatestMetric(rows, "usSteelPpiIndex")).toEqual({
      value: 361.439,
      month: "2026-06",
    });
  });

  it("uses the latest month containing any valid metric", () => {
    expect(getLatestDataMonth(rows)).toBe("2026-06");
  });

  it("formats Korean labels without inventing missing values", () => {
    expect(formatMonth("2026-06")).toBe("2026년 6월");
    expect(formatMonth(null)).toBe("기준월 없음");
    expect(formatRate(2.5)).toBe("2.50%");
    expect(formatRate(null)).toBe("—");
    expect(formatPpi(361.439)).toBe("361.439");
    expect(formatPpi(null)).toBe("—");
  });
});
