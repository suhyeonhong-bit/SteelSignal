export function DashboardLoading() {
  return (
    <section className="loading-panel" role="status" aria-live="polite">
      <div className="loading-card" />
      <div className="loading-card" />
      <div className="loading-chart" />
      <p>최신 데이터를 불러오고 있습니다.</p>
    </section>
  );
}
