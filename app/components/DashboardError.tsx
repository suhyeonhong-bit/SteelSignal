import { INDICATOR_CSV_URL } from "../hooks/useIndicatorData";

export function DashboardError({
  kind,
  onRetry,
}: {
  kind: "network" | "format";
  onRetry: () => Promise<void>;
}) {
  const title =
    kind === "format"
      ? "데이터 형식을 확인할 수 없습니다"
      : "데이터를 불러오지 못했습니다";

  return (
    <section className="error-panel" role="alert">
      <span className="error-mark" aria-hidden="true">
        !
      </span>
      <h2>{title}</h2>
      <p>잠시 후 다시 시도하거나 GitHub에서 원본 CSV를 확인해주세요.</p>
      <div className="error-actions">
        <button type="button" onClick={() => void onRetry()}>
          다시 시도
        </button>
        <a href={INDICATOR_CSV_URL}>GitHub 원본 CSV</a>
      </div>
    </section>
  );
}
