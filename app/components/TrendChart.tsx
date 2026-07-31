"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMonth,
  formatPpi,
  formatRate,
  type IndicatorRow,
} from "../lib/indicator-data";

type TooltipValues = {
  month: string;
  ppi: string;
  rate: string;
};

type TooltipPayload = {
  payload?: IndicatorRow;
};

export function buildTooltipValues(row: IndicatorRow): TooltipValues {
  return {
    month: formatMonth(row.month),
    ppi: formatPpi(row.usSteelPpiIndex),
    rate: formatRate(row.koreaBaseRatePercent),
  };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const values = buildTooltipValues(row);
  return (
    <div className="chart-tooltip" role="status">
      <strong>{values.month}</strong>
      <span>철강 PPI {values.ppi}</span>
      <span>기준금리 {values.rate}</span>
    </div>
  );
}

export function TrendChart({ rows }: { rows: IndicatorRow[] }) {
  const [showPpi, setShowPpi] = useState(true);
  const [showRate, setShowRate] = useState(true);

  return (
    <section className="chart-panel" aria-labelledby="trend-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">60개월 데이터</p>
          <h2 id="trend-title">월별 지표 추이</h2>
          <p>왼쪽은 철강 PPI 지수, 오른쪽은 한국 기준금리 %입니다.</p>
        </div>
        <div className="series-toggles" aria-label="그래프 지표 선택">
          <button
            type="button"
            className="series-toggle series-toggle--ppi"
            aria-pressed={showPpi}
            aria-controls="indicator-trend-chart"
            onClick={() => setShowPpi((value) => !value)}
          >
            철강 PPI
          </button>
          <button
            type="button"
            className="series-toggle series-toggle--rate"
            aria-pressed={showRate}
            aria-controls="indicator-trend-chart"
            onClick={() => setShowRate((value) => !value)}
          >
            한국 기준금리
          </button>
        </div>
      </div>
      <div
        id="indicator-trend-chart"
        className="chart-frame"
        aria-label="미국 철강 PPI와 한국 기준금리 월별 그래프"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="#d9d6ce" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month: string) => month.slice(2)}
              stroke="#697386"
              minTickGap={28}
            />
            <YAxis
              yAxisId="ppi"
              stroke="#b86137"
              width={52}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              stroke="#255880"
              width={48}
              domain={["auto", "auto"]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            {showPpi ? (
              <Line
                yAxisId="ppi"
                type="monotone"
                dataKey="usSteelPpiIndex"
                name="철강 PPI"
                stroke="#c66e3c"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ) : null}
            {showRate ? (
              <Line
                yAxisId="rate"
                type="stepAfter"
                dataKey="koreaBaseRatePercent"
                name="한국 기준금리"
                stroke="#255880"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
