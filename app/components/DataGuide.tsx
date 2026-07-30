export function DataGuide() {
  return (
    <aside className="guide-panel" aria-labelledby="guide-title">
      <p className="eyebrow">읽는 법</p>
      <h2 id="guide-title">숫자의 단위를 먼저 확인하세요</h2>
      <ul>
        <li>철강 PPI는 퍼센트가 아니라 지수 수준입니다.</li>
        <li>두 지표는 단위가 달라 그래프의 양쪽 축을 사용합니다.</li>
        <li>두 선이 함께 움직여도 원인과 결과를 바로 뜻하지 않습니다.</li>
      </ul>
      <div className="source-links">
        <a href="https://ecos.bok.or.kr/">한국은행 ECOS</a>
        <a href="https://fred.stlouisfed.org/series/WPU1017">미국 FRED</a>
      </div>
    </aside>
  );
}
