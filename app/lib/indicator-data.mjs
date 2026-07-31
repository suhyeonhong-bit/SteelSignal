export const INDICATOR_HEADERS = [
  "month",
  "korea_base_rate_percent",
  "us_steel_ppi_index",
  "us_fed_target_rate_percent",
];

function parseRecords(text) {
  const source = text.replace(/^\uFEFF/, "");
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) records.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) records.push(row);
  }
  if (quoted) throw new Error("CSV 형식이 올바르지 않습니다.");
  return records;
}

function parseNumber(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === ".") return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number)) throw new Error("숫자 형식이 올바르지 않습니다.");
  return number;
}

export function parseIndicatorCsv(text) {
  const records = parseRecords(text);
  const header = records.shift();
  if (!header || INDICATOR_HEADERS.some((name, index) => header[index] !== name)) {
    throw new Error("필수 데이터 열을 찾을 수 없습니다.");
  }

  const rows = records.map((record) => {
    const month = record[0]?.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error("월 형식이 올바르지 않습니다.");
    }
    return {
      month,
      koreaBaseRate: parseNumber(record[1] ?? ""),
      usSteelPpi: parseNumber(record[2] ?? ""),
      usFedTargetRate: parseNumber(record[3] ?? ""),
    };
  });

  if (rows.length === 0) throw new Error("사용할 수 있는 월별 데이터가 없습니다.");
  return rows.sort((left, right) => left.month.localeCompare(right.month));
}

export function latestValue(rows, key) {
  return [...rows].reverse().find((row) => row[key] !== null) ?? null;
}
