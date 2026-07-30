import {
  formatPpi,
  formatRate,
  type IndicatorRow,
} from "../lib/indicator-data";

export function IndicatorTable({ rows }: { rows: IndicatorRow[] }) {
  const newestFirst = [...rows].reverse();

  return (
    <div className="table-scroll">
      <table>
        <caption>한국 기준금리와 미국 철강 PPI 월별 전체 데이터</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">한국 기준금리</th>
            <th scope="col">미국 철강 PPI</th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{formatRate(row.koreaBaseRatePercent)}</td>
              <td>{formatPpi(row.usSteelPpiIndex)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
