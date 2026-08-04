"use client";

import { useEffect, useMemo, useState } from "react";
import { ARCTIC_FALLBACK } from "../data/arctic-fallback";
import { ARCTIC_DATA_URL, ArcticDataError, parseArcticDashboard } from "../lib/arctic-data.mjs";
import "../arctic.css";

type EnergyPoint = { period: string; value: number; unit: string; kind: "actual" | "forecast"; source: "EIA STEO" };
type SeaIcePoint = { date: string; extent: number; unit: "10^6 sq km"; missing: number; source: "NSIDC Sea Ice Index v4" };
type SanctionMatch = { officialName: string; list: string; programs: string[]; officialId: string };
type SanctionResult = { listed: boolean; matches: SanctionMatch[] };
type SourceMeta = { status: "fresh" | "stale"; hasData: boolean; lastAttemptAt: string | null; lastSuccessAt: string | null; dataThrough: string | null; url: string; contentHash: string | null; edition?: string | null };
type ArcticData = {
  schemaVersion: 1;
  generatedAt: string;
  sources: Record<"eia" | "ofac" | "eu" | "nsidc", SourceMeta>;
  energy: { usLngExports: EnergyPoint[]; usDryGasProduction: EnergyPoint[]; henryHub: EnergyPoint[] };
  sanctions: { watchlist: Array<{ id: string; label: string; ofac: SanctionResult; eu: SanctionResult }> };
  seaIce: { latest: SeaIcePoint | null; daily: SeaIcePoint[] };
};

const fallback = parseArcticDashboard(ARCTIC_FALLBACK) as ArcticData;
const sourceNames = { eia: "EIA · STEO", ofac: "OFAC", eu: "EU 제재", nsidc: "NSIDC" } as const;
const navItems = [
  ["개요", "#overview"], ["01 · 왜 북극인가", "#intro"], ["02 · YAMAL", "#yamal"],
  ["03 · 미국", "#usa"], ["04 · 비교", "#compare"], ["05 · 한국", "#korea"],
] as const;
const hegemony = {
  2025: { ru: 78, us: 22, note: "YAMAL은 연 1,970만 톤을 실제 수출 중이며 Arc7 쇄빙선 16척으로 유럽·아시아 양방향 공급이 가능하다. Alaska LNG는 FID 미확정, 생산 미개시 상태다." },
  2027: { ru: 60, us: 40, note: "EU 제재 시행을 전제로 YAMAL의 유럽 접근성이 약화되고 공급망이 이동한다는 조건부 연구 시나리오다." },
  2033: { ru: 48, us: 52, note: "Alaska LNG 생산 개시와 북태평양 직항 공급망이 실현된다는 가정 아래 미국이 근소하게 앞서는 조건부 연구 시나리오다." },
} as const;

function useArcticData() {
  const [data, setData] = useState<ArcticData>(fallback);
  const [mode, setMode] = useState<"checking" | "live" | "fallback">("checking");

  useEffect(() => {
    let active = true;
    fetch(ARCTIC_DATA_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("network");
        return response.json();
      })
      .then((payload) => parseArcticDashboard(payload) as ArcticData)
      .then((next) => {
        if (!active) return;
        setData(next);
        setMode("live");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ArcticDataError || error instanceof Error) setMode("fallback");
      });
    return () => { active = false; };
  }, []);

  return { data, mode };
}

function formatDate(value: string | null) {
  if (!value) return "기준일 없음";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(date);
}

function SectionHead({ number, eyebrow, title, conclusion, tone = "copper" }: { number: string; eyebrow: string; title: string; conclusion: React.ReactNode; tone?: "copper" | "blue" }) {
  return <header className="arctic-section-head"><p className={`arctic-kicker is-${tone}`}>{number} · {eyebrow}</p><h2>{title}</h2><div className={`arctic-conclusion is-${tone}`}>{conclusion}</div></header>;
}

function SourceStrip({ data, mode }: { data: ArcticData; mode: "checking" | "live" | "fallback" }) {
  return <section className="source-strip" aria-label="자동 데이터 갱신 상태">
    <div className="source-strip-label"><span>AUTO DATA</span><strong>{mode === "live" ? "실시간 공개 JSON" : mode === "fallback" ? "업데이트 지연" : "최신 데이터 확인 중"}</strong></div>
    <ul>{(Object.keys(sourceNames) as Array<keyof typeof sourceNames>).map((name) => {
      const source = data.sources[name];
      const label = !source.hasData ? "데이터 확인 필요" : source.status === "stale" ? "업데이트 지연" : "최신";
      return <li key={name}><span className={`status-dot is-${source.status}`} aria-hidden="true" /><div><a href={source.url} target="_blank" rel="noreferrer">{sourceNames[name]} <span aria-hidden="true">↗</span></a><span>{label} · {source.dataThrough ?? "—"}</span></div></li>;
    })}</ul>
    <p>스냅샷 생성 {formatDate(data.generatedAt)} · 자동 수치와 연구자 해석은 별도로 표시합니다.</p>
  </section>;
}

function HegemonyGauge() {
  const [year, setYear] = useState<keyof typeof hegemony>(2025);
  const selected = hegemony[year];
  return <section className="hegemony-card" aria-labelledby="hegemony-title">
    <div className="hegemony-top"><div><p className="arctic-kicker">RESEARCH SCENARIO</p><h2 id="hegemony-title">Arctic LNG 패권 지수</h2></div><div className="year-tabs">{([2025, 2027, 2033] as const).map((item) => <button key={item} type="button" aria-pressed={year === item} onClick={() => setYear(item)}>{item}</button>)}</div></div>
    <div className="gauge-labels"><span>RUSSIA · YAMAL <b>{selected.ru}%</b></span><span><b>{selected.us}%</b> USA · ALASKA</span></div>
    <div className="gauge-track" aria-hidden="true"><span className="gauge-russia" style={{ width: `${selected.ru}%` }} /><span className="gauge-usa" style={{ width: `${selected.us}%` }} /></div>
    <p className="gauge-note" aria-live="polite"><b>{year}년.</b> {selected.note}</p>
    <p className="method-note">연구자 추정 · 자동 갱신 아님 — 생산·접근성·제재·프로젝트 실현 단계에 대한 정성 평가를 100으로 환산한 지수</p>
  </section>;
}

function Metric({ value, label, tone = "copper" }: { value: string; label: string; tone?: "copper" | "blue" }) {
  return <article className={`research-metric is-${tone}`}><strong>{value}</strong><span>{label}</span></article>;
}

function ManualBars({ items, unit = "%" }: { items: Array<{ label: string; value: number; tone?: "copper" | "blue" | "neutral" }>; unit?: string }) {
  const max = Math.max(...items.map((item) => item.value));
  return <div className="manual-bars">{items.map((item) => <div className="manual-bar" key={item.label}><div className="bar-copy"><span>{item.label}</span><b>{item.value}{unit}</b></div><span className={`bar-fill is-${item.tone ?? "neutral"}`} style={{ width: `${(item.value / max) * 100}%` }} /></div>)}</div>;
}

function LinePlot({ points, label }: { points: Array<{ label: string; value: number; kind?: "actual" | "forecast" }>; label: string }) {
  if (points.length < 2) return <p className="empty-data">데이터 확인 필요</p>;
  const values = points.map((point) => point.value);
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const coord = (point: typeof points[number], index: number) => `${20 + (index / (points.length - 1)) * 360},${155 - ((point.value - min) / span) * 120}`;
  const actualIndexes = points.map((point, index) => ({ point, index })).filter(({ point }) => point.kind !== "forecast");
  const forecastIndexes = points.map((point, index) => ({ point, index })).filter(({ point }) => point.kind === "forecast");
  if (forecastIndexes.length && actualIndexes.length) forecastIndexes.unshift(actualIndexes.at(-1)!);
  return <div className="line-plot"><svg viewBox="0 0 400 175" role="img" aria-label={label}><line x1="20" x2="380" y1="155" y2="155" className="plot-axis" /><line x1="20" x2="380" y1="95" y2="95" className="plot-grid" /><line x1="20" x2="380" y1="35" y2="35" className="plot-grid" />{actualIndexes.length > 1 && <polyline className="plot-actual" fill="none" points={actualIndexes.map(({ point, index }) => coord(point, index)).join(" ")} />}{forecastIndexes.length > 1 && <polyline className="plot-forecast" fill="none" points={forecastIndexes.map(({ point, index }) => coord(point, index)).join(" ")} />}</svg><div className="plot-labels"><span>{points[0].label}</span><span>{points.at(-1)?.label}</span></div></div>;
}

function EnergyCard({ title, points, source }: { title: string; points: EnergyPoint[]; source: SourceMeta }) {
  const unit = points[0]?.unit ?? "단위 확인 필요";
  return <article className="data-card"><div className="data-card-head"><div><span className="auto-badge">자동 갱신</span><h3>{title}</h3></div><span className={`fresh-label is-${source.status}`}>{source.status === "fresh" ? "최신" : "업데이트 지연"}</span></div>{points.length ? <><LinePlot label={`${title} 실적과 전망 추이`} points={points.map((point) => ({ label: point.period, value: point.value, kind: point.kind }))} /><div className="chart-legend"><span><i className="solid" /> 실적</span><span><i className="dash" /> EIA 전망</span></div><div className="latest-number"><strong>{points.at(-1)?.value.toFixed(2)}</strong><span>{unit}<br />{source.edition ? `STEO ${source.edition}` : source.dataThrough}</span></div><details><summary>연도별 값 보기</summary><table><thead><tr><th>연도</th><th>값</th><th>구분</th></tr></thead><tbody>{points.map((point) => <tr key={point.period}><th scope="row">{point.period}</th><td>{point.value.toFixed(3)}</td><td>{point.kind === "actual" ? "실적" : "전망"}</td></tr>)}</tbody></table></details></> : <p className="empty-data">데이터 확인 필요 · <a href={source.url}>EIA 원문</a></p>}</article>;
}

function SeaIceCard({ data }: { data: ArcticData }) {
  const latest = data.seaIce.latest;
  const recent = data.seaIce.daily.slice(-120);
  return <article className="data-card sea-ice-card"><div className="data-card-head"><div><span className="auto-badge">자동 갱신</span><h3>북극 해빙 면적</h3></div><span className={`fresh-label is-${data.sources.nsidc.status}`}>{data.sources.nsidc.status === "fresh" ? "최신" : "업데이트 지연"}</span></div>{latest ? <><div className="latest-number"><strong>{latest.extent.toFixed(3)}</strong><span>{latest.unit}<br />{latest.date} · 결측 {latest.missing.toFixed(3)}</span></div><LinePlot label="NSIDC 북극 해빙 면적 최근 추이" points={recent.map((point) => ({ label: point.date.slice(5), value: point.extent }))} /></> : <p className="empty-data">데이터 확인 필요</p>}<p className="limit-note">북극 전체 해빙 면적이며 NSR 실제 항행 가능 일수와 동일하지 않습니다.</p></article>;
}

function SanctionsWatch({ data }: { data: ArcticData }) {
  return <div className="sanctions-watch"><div className="watch-head"><div><span className="auto-badge">자동 갱신</span><h3>OFAC · EU 직접 등재 모니터</h3></div><span>기준 OFAC {data.sources.ofac.dataThrough} / EU {data.sources.eu.dataThrough}</span></div><div className="watch-grid">{data.sanctions.watchlist.map((item) => <article key={item.id}><h4>{item.label}</h4>{(["ofac", "eu"] as const).map((source) => { const result = item[source]; return <div className="watch-source" key={source}><b>{source.toUpperCase()}</b><span className={result.listed ? "listed" : "not-listed"}>{result.listed ? "직접 등재 확인" : "직접 등재 확인 안 됨"}</span>{result.matches.map((match) => <small key={`${source}-${match.officialId}`}>{match.officialName}<br />{match.list} · {match.programs.join(", ")} · ID {match.officialId}</small>)}</div>; })}</article>)}</div><p className="legal-note">공식 명단의 직접 등재 여부만 자동 확인합니다. 50% 룰·소유관계·법률 위반 판단이 아니며 법률 자문이 아닙니다.</p></div>;
}

const comparison = [
  ["Availability", "자원이 실제로 생산되고 있는가", "연 약 1,740만 톤 생산 중 · 2025년 실제 수출 1,970만 톤", "FID 미확정 · 생산 미개시 · 2033년 생산 목표"],
  ["Accessibility", "원하는 수요처에 공급 가능한가", "Arc7 쇄빙선 16척, 유럽·아시아 양방향 전환 — NSR 계절 제약", "부동항 루트, 한·일 항해시간 단축, 주요 초크포인트 우회"],
  ["Affordability", "경제적으로 지속 가능한가", "제재 이후 비용 구조 약화 중", "건설비·LNG Canada·카타르 대비 경쟁력은 여전히 불투명"],
  ["Acceptability", "정치·외교적으로 수용 가능한가", "2027 EU 제재 집행이 관건", "대러 제재 리스크로부터 상대적으로 자유로움"],
];

export default function ArcticResearchDashboard() {
  const { data, mode } = useArcticData();
  const sourceStatus = useMemo(() => ({ eia: data.sources.eia, nsidc: data.sources.nsidc }), [data]);
  return <div className="arctic-page">
    <header className="arctic-nav"><a className="arctic-brand" href="#overview">ARCTIC / YAMAL</a><nav aria-label="연구 섹션">{navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a className="steel-link" href="./steel/">STEEL SIGNAL ↗</a></nav></header>
    <main>
      <section className="arctic-hero" id="overview"><p className="arctic-kicker">2022150047 · 홍수현 · RESEARCH DASHBOARD</p><h1>북극 에너지 패권,<br />이미 <em>결정</em>됐는가?</h1><p className="hero-deck">YAMAL LNG의 지정학적 위력은 어디서 비롯되며, 미국의 북극 대응 전략은 이를 실질적으로 견제할 수 있는가 — 900억 배럴의 미발견 자원을 둘러싼 러시아·중국·미국의 북극 삼각 경쟁을 추적한다.</p><p className="hero-sources">SOURCE · USGS 2008 / Arctic Council / EIA / OFAC / EU / NSIDC / CHNL / DOE</p></section>
      <SourceStrip data={data} mode={mode} />
      <HegemonyGauge />

      <section className="arctic-section" id="intro"><SectionHead number="01" eyebrow="INTRODUCTION" title="왜 북극인가" conclusion={<>북극은 전 세계 미발견 자원의 <b>약 22%</b>가 매장된 지역이며, 러시아·중국·미국이 각축을 벌이고 있다.</>} /><div className="metric-row"><Metric value="900억" label="배럴 · 북극 미발견 석유 (USGS 2008)" /><Metric value="47조 m³" label="북극 미발견 천연가스" /><Metric value="22%" label="전 세계 미발견 자원 대비 비중" /></div><div className="country-grid"><article><span>RU</span><h3>러시아</h3><p>북극 해안선과 쇄빙선 전력을 바탕으로 항로·에너지 개발에서 가장 앞선 국가.</p></article><article><span>CN</span><h3>중국</h3><p>연안국은 아니지만 투자·물류·러시아 협력을 통해 영향력을 확대한다.</p></article><article><span>US</span><h3>미국</h3><p>Project Alaska, 그린란드 개발, 캐나다와의 NWP 이견 속에서 개발 의지를 높인다.</p></article></div><div className="research-grid two"><article className="research-card"><p className="card-tag">SEASONALITY</p><h3>NSR ‘제2의 수에즈’론 — 계절성의 함정</h3><p>러시아는 수에즈 대비 7,000km, 40~50일에서 18~19일로 단축된다고 주장하지만, 쇄빙선 없는 안정 항행 가능 기간은 <b>2080년에도 연 90~100일</b>에 불과하다. ‘연중 운항’은 Arc7급 함대에 한정된다.</p></article><article className="research-card"><p className="card-tag">FLEXIBILITY</p><h3>NSR 고비용 구조 — 유연성의 함정</h3><p>NSR은 <b>4개월 전 사전 신청</b>이 의무인 반면 수에즈는 48시간 통보로 충분하다. 보험·항해 리스크를 모두 반영하면 비용 우위는 약해진다.</p></article></div><div className="inline-conclusion">→ NSR은 공급망으로서 그 가치가 <b>과대평가</b>되어 있다.</div><article className="research-card wide"><h3>트럼프 2기, 북극 패권 재편 의지</h3><p>2025년 1월 행정명령 ‘Unleashing Alaska&apos;s Extraordinary Resource Potential’은 알래스카 LNG 개발과 태평양 동맹국 판매·운송을 우선 정책으로 제시했다.</p></article></section>

      <section className="arctic-section" id="yamal"><SectionHead number="02" eyebrow="YAMAL LNG PROJECT" title="서방의 포위망을 뚫는 지정학적 송곳" conclusion={<>LNG는 파이프라인과 달리 <b>유럽↔아시아 이중 레버리지</b>가 가능한 에너지이며, YAMAL은 서방·중국 자본을 구조적으로 편입했다.</>} /><div className="chart-grid"><article className="research-card"><p className="card-tag">연구 자료 · 자동 갱신 아님</p><h3>YAMAL 주주 구성</h3><ManualBars items={[{ label: "Novatek · 러시아", value: 50.1, tone: "copper" }, { label: "Total · 프랑스", value: 20, tone: "blue" }, { label: "CNPC · 중국", value: 20 }, { label: "Silk Road Fund", value: 9.9 }]} /></article><article className="research-card"><p className="card-tag">연구 자료 · 자동 갱신 아님</p><h3>2025 YAMAL 수출 목적지</h3><ManualBars items={[{ label: "유럽행", value: 76.1, tone: "copper" }, { label: "아시아 등 기타", value: 23.9, tone: "neutral" }]} /><p className="chart-caption">총 19.7Mt 중 유럽 15Mt · EU LNG 수입의 14.3%</p></article><article className="research-card"><p className="card-tag">연구 자료 · 자동 갱신 아님</p><h3>Arc 등급별 함대</h3><ManualBars unit="척" items={[{ label: "Arc7", value: 16, tone: "blue" }, { label: "Arc4", value: 6 }, { label: "일반 선박", value: 5 }]} /></article><article className="research-card"><p className="card-tag">연구 시나리오 · 자동 갱신 아님</p><h3>EU 제재 시 항차</h3><ManualBars unit="회" items={[{ label: "2024/25 실적", value: 280, tone: "blue" }, { label: "제재 후 추정", value: 125, tone: "copper" }]} /></article></div><article className="research-card wide highlight"><h3>‘막차 탑승’ 현상</h3><p>2026년 1~3월 사베타 출발 70항차는 <b>100% 유럽행</b>이었다. 2025년 1분기 74항차 중 14항차가 아시아행이었던 것과 대비된다.</p></article><div className="research-grid two"><article className="research-card"><p className="card-tag">연구자 해석</p><h3>TotalEnergies의 딜레마</h3><p>지분 20%, 연 400만 톤 최대 바이어. 가스 거래는 접되 지분은 유지한다. 2026년 2월 Alaska Glenfarne과 연 200만 톤·20년 LOI를 체결했다.</p></article><article className="research-card"><p className="card-tag">연구자 해석</p><h3>미켈슨과 ‘50% 룰’의 허점</h3><p>팀첸코 23.5%와 미켈슨 24%의 합산은 <b>47.5%</b>. 이는 자동 법률 판단이 아닌 연구 자료의 지분 구조 해석이다.</p></article></div><SanctionsWatch data={data} /></section>

      <section className="arctic-section" id="usa"><SectionHead number="03" eyebrow="US ARCTIC STRATEGY" title="제재의 선택성, 그리고 북극 삼각 거점" tone="blue" conclusion={<>미국은 세계 최대 LNG 수출국이며, 알래스카·그린란드·캐나다를 잇는 <b>북극 삼각 거점</b> 전략을 다지고 있다.</>} /><div className="energy-grid"><EnergyCard title="미국 LNG 수출" points={data.energy.usLngExports} source={sourceStatus.eia} /><EnergyCard title="미국 건성 가스 생산" points={data.energy.usDryGasProduction} source={sourceStatus.eia} /><EnergyCard title="Henry Hub 가격" points={data.energy.henryHub} source={sourceStatus.eia} /></div><div className="metric-row"><Metric value="129" label="MTPA · 미국 LNG 플랜트 9개 연구 자료 기준" tone="blue" /><Metric value="48.4Mt" label="2025년 유럽 수입량 · 연구 자료 기준" tone="blue" /><Metric value="21MTPA" label="Polar LNG 목표 · 연구 자료 기준" tone="blue" /></div><SeaIceCard data={data} /><div className="country-grid usa"><article><span>US</span><h3>Alaska</h3><p>TotalEnergies 200만 톤, POSCO인터내셔널 100만 톤 등 예비계약. 바인딩 계약과 FID는 여전히 핵심 리스크다.</p></article><article><span>GL</span><h3>Greenland</h3><p>그린란드인의 85%가 미국 합류에 반대, 6%만 찬성. EXIM은 2025년 6월 Tanbreez 광산에 1.2억 달러 융자 관심서를 냈다.</p></article><article><span>CA</span><h3>Canada</h3><p>NWP를 캐나다는 내수, 미국은 국제해협으로 본다. 해빙 감소와 함께 항로의 전략 가치가 커진다.</p></article></div><article className="research-card wide"><h3>Project Alaska 3대 함의</h3><p><b>① 미·러 에너지 대리전</b> — 지연 시 동아시아는 러시아·카타르 의존 지속. <b>② LNG Canada 경쟁</b> — 한·일 기업의 기존 지분 유인. <b>③ 북극 항로 주도권</b> — 니키스키발 북태평양 직항 루트.</p></article></section>

      <section className="arctic-section" id="compare"><SectionHead number="04" eyebrow="4A FRAMEWORK" title="YAMAL vs 미국 북극 개발" conclusion={<>현재 패권은 <b>YAMAL</b>에 있으나 구조적 전환점은 <b>2027~2033년</b> 사이에 놓여 있다. <span>연구자 해석</span></>} /><div className="comparison-scroll" tabIndex={0} aria-label="4A 비교표 가로 스크롤"><table className="comparison-table"><caption>YAMAL과 Alaska의 4A 비교</caption><thead><tr><th>기준</th><th>러시아 · YAMAL</th><th>미국 · ALASKA</th></tr></thead><tbody>{comparison.map(([term, meaning, russia, usa]) => <tr key={term}><th scope="row"><b>{term}</b><span>{meaning}</span></th><td>{russia}</td><td>{usa}</td></tr>)}</tbody></table></div></section>

      <section className="arctic-section" id="korea"><SectionHead number="05" eyebrow="KOREA'S POSITION" title="한국의 전략적 선택 2027–2033" tone="blue" conclusion={<>2027~2033년은 한국이 <b>구매자·기술공급자·외교파트너</b> 세 포지션을 동시에 쥘 수 있는 전략적 황금기다.</>} /><ol className="timeline"><li><span>NOW · 2026</span><h3>LNG Canada Phase 2 FID 참여</h3><p>KOGAS 5% 지분. 2026년 4월 월 수출 100만 톤 돌파, 절반 이상이 한국행. Phase 2 FID 전 적극적 의사 표명이 필요하다.</p></li><li><span>2027</span><h3>EU 제재 시행 · YAMAL 공백 대응</h3><p>제재 집행 시 가격 협상력 약화 가능성. LNG Canada 물량이 공급 완충재가 될 시점.</p></li><li><span>2033</span><h3>Alaska LNG · 이중 포트폴리오</h3><p>실현 시 LNG Canada와 함께 미·캐 서부 해안 이중 공급 포트폴리오 완성.</p></li></ol><div className="research-grid two"><article className="research-card"><h3>기술 우위 · 쇄빙 LNG선</h3><p>상선용 Arc7급 쇄빙선 건조 경험 보유국은 사실상 한국이 유일하다. 북부 직출항 루트에서 한국의 기술 파트너 중요도가 높다.</p></article><article className="research-card"><h3>미국 우방국 프리미엄</h3><p>한미 조선협력과 MASGA 합의로 대미 조선업 투자 <b>1,500억 달러</b>가 배정됐다. 전체 대미 투자 3,500억 달러 중 핵심 축이다.</p></article></div></section>
    </main>
    <footer className="arctic-footer"><div><strong>2022150047 홍수현</strong><span>북극 에너지 패권, 이미 결정됐는가?</span></div><p><b>자동 갱신 데이터</b> EIA · OFAC · EU · NSIDC &nbsp; / &nbsp; <b>연구자 작성 정보</b> 패권 지수 · 4A · 기업 해석 · 한국 제언</p><p>주요 연구 출처: USGS(2008) · Arctic Council(2009) · CHNL · EIA · DOE · TotalEnergies · Glenfarne 공시자료</p><p>공개 통계와 연구 해석을 구분해 읽어주세요. 투자·법률 자문이 아닙니다.</p></footer>
  </div>;
}
