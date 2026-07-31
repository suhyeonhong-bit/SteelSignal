import { describe, expect, it } from "vitest";
import { buildCsvDownload } from "../app/lib/indicator-download";

describe("buildCsvDownload", () => {
  it("keeps the exact fetched CSV with a stable file name", () => {
    const rawCsv = "month,korea_base_rate_percent,us_steel_ppi_index\n";
    expect(buildCsvDownload(rawCsv)).toEqual({
      fileName: "monthly_indicators.csv",
      mimeType: "text/csv;charset=utf-8",
      content: rawCsv,
    });
  });
});
