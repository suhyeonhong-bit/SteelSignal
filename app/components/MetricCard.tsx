export function MetricCard({
  label,
  value,
  month,
  tone,
}: {
  label: string;
  value: string;
  month: string;
  tone: "rate" | "ppi";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{month} 기준</span>
    </article>
  );
}
