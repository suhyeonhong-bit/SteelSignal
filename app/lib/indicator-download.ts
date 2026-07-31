export type CsvDownload = {
  fileName: "monthly_indicators.csv";
  mimeType: "text/csv;charset=utf-8";
  content: string;
};

export function buildCsvDownload(rawCsv: string): CsvDownload {
  return {
    fileName: "monthly_indicators.csv",
    mimeType: "text/csv;charset=utf-8",
    content: rawCsv,
  };
}
