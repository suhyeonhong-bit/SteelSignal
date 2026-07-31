"use client";

import { useIndicatorData } from "../hooks/useIndicatorData";
import {
  formatMonth,
  formatPpi,
  formatRate,
  getLatestDataMonth,
  getLatestMetric,
} from "../lib/indicator-data";
import { BrandMark } from "./BrandMark";
import { DashboardError } from "./DashboardError";
import { DashboardLoading } from "./DashboardLoading";
import { DataGuide } from "./DataGuide";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { IndicatorTable } from "./IndicatorTable";
import { MetricCard } from "./MetricCard";
import { TrendChart } from "./TrendChart";

export function SteelSignalDashboard() {
  const data = useIndicatorData();

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="STEEL SIGNAL">
          <BrandMark />
          <span className="brand-name">
            <span>STEEL</span> <span className="brand-accent">SIGNAL</span>
          </span>
        </a>
        {data.status === "success" ? (
          <span className="header-note">
            {formatMonth(getLatestDataMonth(data.rows))} 데이터 기준
          </span>
        ) : (
          <span className="header-note">공개 경제지표 대시보드</span>
        )}
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">5년 시장 지표</p>
          <h1>
            금리와 철강 가격의
            <br />
            흐름을 한눈에
          </h1>
          <p className="hero-copy">
            한국은행 기준금리와 미국 철강 생산자물가지수를 월별로 연결해
            시장의 방향을 살펴봅니다.
          </p>
        </div>
      </section>

      {data.status === "loading" ? <DashboardLoading /> : null}
      {data.status === "error" ? (
        <DashboardError kind={data.errorKind} onRetry={data.retry} />
      ) : null}
      {data.status === "success" ? (
        <>
          <section className="metric-grid" aria-label="최신 지표">
            <MetricCard
              label="한국 기준금리"
              value={formatRate(
                getLatestMetric(data.rows, "koreaBaseRatePercent").value,
              )}
              month={formatMonth(
                getLatestMetric(data.rows, "koreaBaseRatePercent").month,
              )}
              tone="rate"
            />
            <MetricCard
              label="미국 철강 PPI"
              value={formatPpi(
                getLatestMetric(data.rows, "usSteelPpiIndex").value,
              )}
              month={formatMonth(
                getLatestMetric(data.rows, "usSteelPpiIndex").month,
              )}
              tone="ppi"
            />
          </section>
          <TrendChart rows={data.rows} />
          <section className="detail-grid">
            <div className="table-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">원본에 가까운 보기</p>
                  <h2>월별 전체 데이터</h2>
                </div>
                <DownloadCsvButton rawCsv={data.rawCsv} />
              </div>
              <IndicatorTable rows={data.rows} />
            </div>
            <DataGuide />
          </section>
        </>
      ) : null}

      <footer className="site-footer">
        <p>매주 월요일 오전 11시 한국 시간 자동 갱신</p>
        <a href="https://github.com/suhyeonhong-bit/ToSuhyeon">
          공개 GitHub 데이터 저장소
        </a>
        <p>이 페이지는 공개 경제지표를 보여주며 투자 판단을 제공하지 않습니다.</p>
      </footer>
    </main>
  );
}
