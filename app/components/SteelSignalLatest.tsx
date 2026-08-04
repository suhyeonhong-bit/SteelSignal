"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { latestValue, parseIndicatorCsv } from "../lib/indicator-data.mjs";
import "../dashboard.css";

const CSV_URL =
  "https://raw.githubusercontent.com/suhyeonhong-bit/ToSuhyeon/main/data/processed/monthly_indicators.csv";

type IndicatorRow = {
  month: string;
  koreaBaseRate: number | null;
  usSteelPpi: number | null;
  usFedTargetRate: number | null;
};

type MetricKey = "usSteelPpi" | "koreaBaseRate" | "usFedTargetRate";

const metrics: Array<{
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  description: string;
}> = [
  {
    key: "koreaBaseRate",
    label: "한국 기준금리",
    unit: "%",
    color: "#20354d",
    description: "한국은행 기준금리",
  },
  {
    key: "usSteelPpi",
    label: "미국 철강 PPI",
    unit: "지수",
    color: "#b85c38",
    description: "미국 철강 생산자물가지수",
  },
  {
    key: "usFedTargetRate",
    label: "연준 목표금리",
    unit: "%",
    color: "#6f7d4f",
    description: "연방기금 목표금리 범위의 중간값",
  },
];

function displayMonth(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year}.${monthNumber}`;
}

function displayNumber(value: number | null, digits = 2) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("ko-KR", {
        maximumFractionDigits: digits,
      }).format(value);
}

function MetricCard({ metric, row }: { metric: (typeof metrics)[number]; row: IndicatorRow | null }) {
  const value = row?.[metric.key] ?? null;
  return (
    <article className="metric-card" style={{ "--metric-color": metric.color } as React.CSSProperties}>
      <div className="metric-card-topline">
        <span className="metric-dot" aria-hidden="true" />
        <span>{metric.label}</span>
      </div>
      <div className="metric-value">
        {displayNumber(value)} <small>{metric.unit}</small>
      </div>
      <p>{metric.description}</p>
      <span className="metric-month">기준월 {row ? displayMonth(row.month) : "—"}</span>
    </article>
  );
}

function pointsFor(rows: IndicatorRow[], key: MetricKey) {
  const values = rows.map((row) => row[key]).filter((value): value is number => value !== null);
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return rows.map((row, index) => {
    const value = row[key];
    if (value === null) return null;
    const x = 22 + (index / Math.max(rows.length - 1, 1)) * 736;
    const y = 224 - ((value - min) / span) * 184;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

function TrendChart({ rows }: { rows: IndicatorRow[] }) {
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    koreaBaseRate: true,
    usSteelPpi: true,
    usFedTargetRate: true,
  });

  return (
    <section className="panel chart-panel" aria-labelledby="trend-title">
      <div className="panel-heading chart-heading">
        <div>
          <p className="eyebrow">MONTHLY SIGNAL</p>
          <h2 id="trend-title">월별 지표 추이</h2>
        </div>
        <div className="legend" aria-label="지표 표시 선택">
          {metrics.map((metric) => (
            <button
              className={`legend-button ${visible[metric.key] ? "is-active" : ""}`}
              key={metric.key}
              type="button"
              aria-pressed={visible[metric.key]}
              onClick={() => setVisible((current) => ({ ...current, [metric.key]: !current[metric.key] }))}
            >
              <span className="legend-dot" style={{ backgroundColor: metric.color }} aria-hidden="true" />
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-wrap">
        <svg className="trend-chart" viewBox="0 0 780 260" role="img" aria-label="세 지표의 월별 추이 선 그래프">
          {[40, 100, 160, 220].map((y) => (
            <line className="chart-grid" key={y} x1="22" x2="758" y1={y} y2={y} />
          ))}
          {metrics.map((metric) => {
            if (!visible[metric.key]) return null;
            const points = pointsFor(rows, metric.key).filter(Boolean).join(" ");
            return <polyline key={metric.key} fill="none" points={points} stroke={metric.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />;
          })}
        </svg>
        <div className="chart-axis-labels"><span>{displayMonth(rows[0]?.month ?? "—")}</span><span>최근 {displayMonth(rows[rows.length - 1]?.month ?? "—")}</span></div>
      </div>
      <p className="chart-note">왼쪽 축은 PPI 지수, 오른쪽 축은 금리입니다. 서로 다른 단위를 비교하므로 선의 방향과 변화 시점을 중심으로 읽어주세요.</p>
    </section>
  );
}

function DataGuide() {
  return (
    <section className="guide-panel panel" aria-labelledby="guide-title">
      <div className="panel-heading"><div><p className="eyebrow">READ THE SIGNAL</p><h2 id="guide-title">읽는 법</h2></div></div>
      <div className="guide-grid">
        <div><span className="guide-index">01</span><h3>축이 다릅니다</h3><p>철강 PPI는 지수, 두 금리는 퍼센트입니다. 같은 높이라도 같은 크기의 숫자를 뜻하지 않습니다.</p></div>
        <div><span className="guide-index">02</span><h3>시차를 보세요</h3><p>금리 결정과 물가 발표일은 다릅니다. 한 달의 움직임이 같은 원인에서 나온다고 단정하지 않습니다.</p></div>
        <div><span className="guide-index">03</span><h3>원본을 확인하세요</h3><p>아래 표는 그래프의 기초가 된 월별 값입니다. 결측값은 추정하지 않고 대시로 남겼습니다.</p></div>
      </div>
      <div className="relationship-note">
        <h3>금리와 원자재 가격의 관계</h3>
        <p>대체로 금리가 오르면 원자재 가격이 약해지는 경향이 있지만, 고정된 법칙은 아닙니다.</p>
        <ol>
          <li>금리 상승 → 경기·투자·건설 수요 둔화 → 원자재 수요 감소</li>
          <li>금리 상승 → 달러 강세 → 달러로 거래되는 원자재 가격 하락 압력</li>
          <li>금리 상승 → 재고 보유 비용 증가 → 원자재 재고 축소</li>
        </ol>
        <p>전쟁·감산·공급망 차질이나 강한 글로벌 수요가 금리 효과를 압도할 수 있습니다. 철강 PPI는 금리 변화 후 1~6개월의 시차를 두고 경기·건설·제조업 수요와 함께 보세요.</p>
        <p className="relationship-source">미국 정책금리 10bp 상승이 약 18~24영업일 뒤 원자재 가격을 0.5~2.5% 낮출 수 있다는 IMF 연구를 참고했습니다. <a href="https://www.imf.org/en/publications/wp/issues/2023/10/10/monetary-policy-transmission-through-commodity-prices-540373" target="_blank" rel="noreferrer">IMF 연구 원문</a></p>
      </div>
      <div className="source-links"><span>출처</span><a href="https://ecos.bok.or.kr/" target="_blank" rel="noreferrer">한국은행 ECOS</a><a href="https://fred.stlouisfed.org/" target="_blank" rel="noreferrer">미국 FRED</a><a href="https://github.com/suhyeonhong-bit/ToSuhyeon" target="_blank" rel="noreferrer">공개 데이터 저장소</a></div>
    </section>
  );
}

function SourceTable({ rows, csvText }: { rows: IndicatorRow[]; csvText: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([csvText], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "monthly_indicators.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel source-panel" aria-labelledby="source-title">
      <div className="panel-heading source-heading"><div><p className="eyebrow">SOURCE VIEW</p><h2 id="source-title">원본에 가까운 보기</h2><p>대시보드가 읽은 CSV의 월별 값을 최신순으로 보여줍니다.</p></div><button className="download-button" type="button" onClick={download}>CSV 내려받기 <span aria-hidden="true">↓</span></button></div>
      <div className="table-scroll"><table><caption className="sr-only">월별 지표 원본 데이터</caption><thead><tr><th>월</th><th>한국 기준금리</th><th>미국 철강 PPI</th><th>연준 목표금리</th></tr></thead><tbody>{[...rows].reverse().slice(0, 60).map((row) => <tr key={row.month}><th scope="row">{displayMonth(row.month)}</th><td>{displayNumber(row.koreaBaseRate)}%</td><td>{displayNumber(row.usSteelPpi)}</td><td>{displayNumber(row.usFedTargetRate)}%</td></tr>)}</tbody></table></div>
    </section>
  );
}

function LoadingShell() {
  return <div className="state-panel" role="status" aria-live="polite"><span className="loading-mark" aria-hidden="true" /><div><strong>최신 데이터를 불러오고 있습니다</strong><span className="state-detail">한국 기준금리 · 미국 철강 PPI · 연준 목표금리</span></div></div>;
}

function SourcePlaceholder() {
  return <section className="panel source-panel source-placeholder" aria-labelledby="source-title"><div className="panel-heading"><div><p className="eyebrow">SOURCE VIEW</p><h2 id="source-title">원본에 가까운 보기</h2><p>데이터를 읽으면 월별 값이 이곳에 표시됩니다.</p></div></div></section>;
}

export default function SteelSignalLatest() {
  const [rows, setRows] = useState<IndicatorRow[]>([]);
  const [csvText, setCsvText] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(`${CSV_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("network");
      const text = await response.text();
      setRows(parseIndicatorCsv(text));
      setCsvText(text);
      setStatus("ready");
    } catch {
      setErrorMessage("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const latestRows = useMemo(() => Object.fromEntries(metrics.map((metric) => [metric.key, latestValue(rows, metric.key)])), [rows]);
  const latestMonth = rows.at(-1)?.month ?? "—";

  return (
    <main className="site-shell">
      <header className="site-header"><a className="wordmark" href="#top">STEEL <span>SIGNAL</span></a><span className="header-meta">{latestMonth === "—" ? "MONTHLY BRIEF" : `${displayMonth(latestMonth)} DATA`}</span></header>
      <div className="hero" id="top"><p className="eyebrow">MARKET BRIEF / 01</p><h1>금리와 철강 가격의<br /><em>흐름을 한눈에</em></h1><p className="hero-copy">한국과 미국의 금리, 철강 생산자물가를 한 화면에<br />놓고 시장의 방향과 시차를 읽어보세요.</p></div>
      {status === "loading" && <LoadingShell />}
      {status === "error" && <div className="state-panel error-panel" role="alert"><strong>{errorMessage}</strong><a href={CSV_URL} target="_blank" rel="noreferrer">원본 CSV 열기</a><button className="retry-button" type="button" onClick={loadData}>다시 시도</button></div>}
      {status !== "ready" && <DataGuide />}
      {status !== "ready" && <SourcePlaceholder />}
      {status === "ready" && <>
        <section className="metric-grid" aria-label="최신 지표">{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} row={latestRows[metric.key]} />)}</section>
        <TrendChart rows={rows} />
        <DataGuide />
        <SourceTable rows={rows} csvText={csvText} />
      </>}
      <footer className="site-footer"><span>매월 1일 오전 9시 30분 업데이트</span><span>데이터는 참고용이며 투자 판단을 제공하지 않습니다.</span></footer>
    </main>
  );
}
