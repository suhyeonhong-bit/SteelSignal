# 북극 에너지 연구 대시보드 및 자동 데이터 수집 설계

작성일: 2026-08-04
상태: 사용자 설계 승인 완료, 구현 계획 작성 전 문서 검토 대기

## 1. 목적

현재 STEEL SIGNAL을 기본 화면으로 제공하는 공개 대시보드를 북극 에너지
패권 연구 대시보드로 전환한다. 사용자가 제공한 연구 본문과 5개 분석
섹션을 에디토리얼 화이트 디자인으로 표현하고, 미국 에너지·제재·북극
해빙에 관한 공식 데이터를 자동 갱신한다.

기존 STEEL SIGNAL의 금리·철강 지표 기능은 삭제하지 않고 `/steel/` 별도
페이지로 옮긴다.

## 2. 저장소 경계

### `suhyeonhong-bit/ToSuhyeon`

데이터 수집과 정규화를 담당한다.

- 기존 `collect_data.py`, `collector/`, 월별 경제지표 CSV 수집 동작은
  변경하지 않는다.
- 북극 연구 전용 수집기와 워크플로를 별도로 추가한다.
- `EIA_API_KEY`는 ToSuhyeon의 GitHub Actions secret에서만 읽는다.
- 공식 소스의 응답을 검증한 뒤 화면용 JSON을 공개 데이터로 커밋한다.

### `suhyeonhong-bit/SteelSignal`

공개 화면과 상호작용을 담당한다.

- 프로젝트 기본 화면을 북극 에너지 연구 대시보드로 교체한다.
- 기존 STEEL SIGNAL 화면은 `/steel/` 경로에서 그대로 제공한다.
- 브라우저는 ToSuhyeon의 공개 JSON만 읽으며 API 키를 사용하지 않는다.
- Sites/Vinext 빌드와 GitHub Pages 정적 빌드에서 같은 화면 계약을 유지한다.

## 3. 화면 정보 구조

기본 페이지는 다음 순서로 구성한다.

1. 상단 내비게이션
   - 브랜드: `ARCTIC / YAMAL`
   - 개요, 왜 북극인가, YAMAL, 미국, 비교, 한국 섹션 앵커
   - 별도 `STEEL SIGNAL` 페이지 링크
2. 연구 개요
   - `북극 에너지 패권, 이미 결정됐는가?`
   - 연구 질문, 연구자 정보, 주요 출처
   - EIA·OFAC/EU·NSIDC 최신 상태 요약
3. Arctic LNG 패권 지수
   - 2025·2027·2033 연구자 추정값
   - 자동 API 수치가 아닌 연구자 해석임을 항상 표시
   - 산식과 기준 시점을 함께 제공
4. `01 · 왜 북극인가`
   - 미발견 석유·천연가스·세계 비중
   - 러시아·중국·미국 역할
   - NSR 계절성과 비용 구조, 트럼프 2기 맥락
5. `02 · YAMAL LNG PROJECT`
   - 주주 구성, 수출 목적지, Arc 등급별 함대, 제재 시뮬레이션
   - 막차 탑승 현상, TotalEnergies·미켈슨 사례
   - OFAC·EU 직접 등재 상태
6. `03 · US ARCTIC STRATEGY`
   - 미국 LNG 실적·전망, 생산, Henry Hub
   - Alaska·Greenland·Canada 분석
   - 북극 해빙 추이
7. `04 · 4A FRAMEWORK`
   - Availability, Accessibility, Affordability, Acceptability 비교
8. `05 · KOREA'S POSITION`
   - 2026·2027·2033 타임라인
   - LNG Canada, 조선 기술, 미국 우방국 프리미엄
9. 출처와 면책
   - 자동 수치와 연구자 해석을 구분
   - 데이터 기준일과 원문 링크 제공

## 4. 시각 디자인

사용자가 승인한 방향은 `에디토리얼 화이트 + 굵은 산세리프 제목`이다.

- 배경: 순백과 매우 옅은 쿨그레이
- 본문: 네이비
- 러시아·YAMAL·경고 강조: 제한적인 구리색
- 미국·공식 최신 데이터 강조: 제한적인 블루
- 구획: 그림자보다 얇은 선과 넉넉한 여백을 우선
- 제목: Pretendard 계열의 굵은 산세리프
- 숫자·출처·상태: 모노스페이스 보조 글꼴
- 카드: 낮은 라운드 또는 직선형 구획
- 모바일: 단일 열로 재배치하고 가로 내비게이션은 스크롤 허용

색상만으로 상태를 전달하지 않는다. 텍스트 레이블과 아이콘을 함께 쓰고,
키보드 포커스와 `prefers-reduced-motion`을 지원한다.

## 5. 데이터 수집 아키텍처

ToSuhyeon에 다음 전용 구조를 추가한다.

```text
collect_arctic_data.py
arctic_collector/
├── config.py
├── eia.py
├── sanctions.py
├── sea_ice.py
├── manifest.py
├── storage.py
└── errors.py
.github/workflows/
├── collect-arctic-monthly.yml
└── collect-arctic-daily.yml
```

데이터 흐름은 다음과 같다.

```text
EIA 월별 수집 ─────────┐
                      ├─ 출처별 검증 ─ 정규화 ─ arctic_dashboard.json
OFAC·EU·NSIDC 일별 수집 ┘                              ↓
                                                SteelSignal 화면
```

두 워크플로는 같은 `arctic-dashboard-data` concurrency 그룹을 사용해
동시에 공개 파일을 덮어쓰지 않는다. 수동 실행을 위한 `workflow_dispatch`도
각각 제공한다.

### 월별 EIA 수집

- 매월 15일 오전 9시 30분 `Asia/Seoul` 기준으로 실행한다.
- EIA API v2와 Short-Term Energy Outlook(STEO)을 사용한다.
- 미국 LNG 수출 실적, 미국 건성 천연가스 생산, Henry Hub 가격을 수집한다.
- STEO에서 올해 추정과 다음 해 전망을 가져온다.
- 실적과 전망을 동일한 시계열에 넣되 `actual`과 `forecast`를 명시한다.
- API 출처: `https://api.eia.gov/v2/`
- 공식 안내: `https://www.eia.gov/opendata/`
- STEO: `https://www.eia.gov/outlooks/steo/`

### 일별 제재·해빙 수집

- 매일 오전 9시 10분 `Asia/Seoul` 기준으로 실행한다.
- OFAC Sanctions List Service의 SDN·Non-SDN 공식 목록을 확인한다.
- EU Consolidated Financial Sanctions List의 최신 CSV 또는 XML을 확인한다.
- NSIDC Sea Ice Index의 북반구 일별 CSV를 확인한다.
- 공식 출처:
  - `https://ofac.treasury.gov/sanctions-list-service`
  - `https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions?locale=en`
  - `https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv`

## 6. 데이터 의미와 제한

### EIA

- 미국 LNG 수출 차트는 2016년 이후 실적과 최신 STEO 전망을 함께 보여준다.
- 실적과 전망은 서로 다른 선 모양·배경 구획·텍스트 레이블로 구분한다.
- 단위는 원본 단위를 보존하고 화면에서 Bcf/d 등으로 명시한다.
- 전망값에는 EIA 전망 발표 기준월을 함께 표시한다.

### OFAC·EU 감시 대상

초기 감시 대상은 다음과 같다.

- NOVATEK / PAO NOVATEK 및 공식 목록에 나타나는 주요 표기 변형
- Yamal LNG 및 공식 표기 변형
- Leonid Mikhelson 및 공식 표기 변형
- Gennady Timchenko 및 공식 표기 변형

정규화된 이름과 명시적인 별칭으로만 일치시킨다. 단순 부분 문자열이나
무제한 퍼지 검색은 오탐 때문에 사용하지 않는다. 일치한 경우 소스, 목록
종류, 공식 이름, 프로그램 태그, 공식 식별자와 기준일을 보존한다.

자동화가 판정하는 것은 `공식 명단에 직접 등재됐는가`뿐이다. OFAC 50%
룰 적용 여부, 실질 소유관계, 제재 회피 여부, 법률 위반 여부를 자동으로
결론 내리지 않는다. 화면에는 법률 자문이 아니라는 설명을 표시한다.

### NSIDC

- 북극 전체 해빙 면적의 최신 값과 일별 추이를 표시한다.
- 출처가 제공하는 단위와 품질 플래그를 보존한다.
- 북극 전체 해빙 면적을 NSR 실제 항행 가능 일수로 바꾸지 않는다.
- NSR 항행 가능 일수는 경로별 격자 농도 데이터와 승인된 산식이 추가되는
  후속 단계에서만 `모델 추정치`로 제공한다.

### 연구자 작성 정보

패권 지수, 4A 평가, 기업 계약 해석, 한국 전략 제언은 자동 데이터가
아니다. API 수치가 갱신돼도 자동으로 문장을 고치거나 결론을 재작성하지
않는다. 화면은 `자동 갱신 데이터`와 `연구자 해석`을 구분해 표시한다.

## 7. 공개 JSON 계약

최종 파일 경로는 다음으로 고정한다.

```text
data/processed/arctic_dashboard.json
```

개념적 구조는 다음과 같다.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-04T00:00:00Z",
  "sources": {
    "eia": {
      "status": "fresh",
      "lastSuccessAt": "2026-08-04T00:00:00Z",
      "dataThrough": "2027",
      "url": "https://www.eia.gov/outlooks/steo/",
      "contentHash": "sha256:..."
    },
    "ofac": {},
    "eu": {},
    "nsidc": {}
  },
  "energy": {
    "usLngExports": [],
    "usDryGasProduction": [],
    "henryHub": []
  },
  "sanctions": {
    "watchlist": []
  },
  "seaIce": {
    "latest": {},
    "daily": []
  }
}
```

각 시계열 항목은 기준일, 값, 단위, `actual` 또는 `forecast` 구분과 출처를
포함한다. 각 출처는 `fresh` 또는 `stale` 상태, 마지막 정상 수집 시각,
원본 URL, 원본 응답의 SHA-256 해시를 포함한다.

OFAC·EU 전체 목록은 매일 Git에 축적하지 않는다. 화면에 필요한 일치
레코드와 출처 메타데이터만 저장해 저장소 비대화를 막는다. API 키나 키가
포함된 요청 URL은 원본·정규화 파일·로그 어디에도 저장하지 않는다.

## 8. 장애 처리

- 출처별 수집과 파싱을 독립적으로 처리한다.
- 한 출처가 실패하면 그 출처의 마지막 정상 데이터를 유지하고 `stale`로
  표시한다.
- 일부 출처의 실패 때문에 다른 출처의 정상 갱신을 버리지 않는다.
- 모든 출처가 실패하거나 출력 스키마가 유효하지 않으면 공개 JSON을
  교체하지 않고 워크플로를 실패시킨다.
- 공개 JSON은 임시 파일에 완전히 작성하고 검증한 뒤 원자적으로 교체한다.
- 오류 메시지에는 기관명, 안전한 오류 분류, HTTP 상태 코드만 포함하고
  요청 URL과 자격증명은 포함하지 않는다.
- SteelSignal이 최신 JSON을 읽지 못하면 마지막 빌드에 포함된 검증된
  스냅샷을 표시하고 `업데이트 지연` 레이블을 붙인다.
- 특정 데이터가 한 번도 없었다면 빈 차트를 그리지 않고 출처 링크와
  `데이터 확인 필요` 안내를 표시한다.

## 9. 보안

- `EIA_API_KEY`는 ToSuhyeon Actions secret과 로컬 `.env`에만 둔다.
- `EIA_API_KEY`를 SteelSignal 저장소나 `VITE_`·`NEXT_PUBLIC_` 변수로
  전달하지 않는다.
- 워크플로는 pull request 이벤트에서 비밀값을 사용하지 않는다.
- EIA 워크플로는 `contents: write` 이외의 권한을 요청하지 않는다.
- 공식 공개 파일만 다운로드하며 임의 HTML 스크립트를 실행하지 않는다.
- 생성 파일 저장 전 현재 비밀 문자열 포함 여부를 검사한다.
- GitHub Pages와 Sites 산출물에서 키 이름·값·환경파일이 없는지 검사한다.

## 10. 테스트

### ToSuhyeon

Python 표준 `unittest`로 실제 네트워크와 실제 키 없이 검사한다.

- EIA 설정과 필수 키 검증
- EIA URL 생성 시 로그와 오류에 키가 노출되지 않는지 확인
- LNG 수출·생산·Henry Hub·STEO fixture 파싱
- OFAC와 EU CSV/XML fixture 파싱
- 감시 대상 공식 별칭 일치와 유사 이름 오탐 방지
- NSIDC CSV의 최신 값·일별 시계열 파싱
- 실적·전망 구분과 단위 보존
- 부분 장애 시 마지막 정상 데이터와 `stale` 상태 보존
- 모든 출처 실패 및 스키마 오류 시 기존 파일 유지
- 원자적 저장, SHA-256, 비밀값 차단
- 두 GitHub Actions의 일정, secret, 최소 권한, concurrency 계약

### SteelSignal

Vitest, Testing Library, 정적 빌드 검사를 사용한다.

- 기본 페이지가 북극 연구 대시보드인지 확인
- 내비게이션 앵커와 `/steel/` 링크 확인
- `/steel/`에서 기존 STEEL SIGNAL 카드·차트·표·CSV 다운로드 유지
- EIA 실적·전망 구분과 출처 기준일 표시
- OFAC·EU 직접 등재 상태와 법적 한계 문구 표시
- NSIDC 지표와 NSR 항행일수 비동일성 문구 표시
- `fresh`·`stale`·데이터 없음 상태 표시
- 네트워크 실패 시 검증된 스냅샷과 지연 안내 표시
- 모바일 단일 열, 가로 내비게이션, 키보드 포커스, 축소 모션 확인
- Sites/Vinext와 GitHub Pages 빌드 성공
- 산출물에 API 키, `.env`, 수집기 자격증명이 없는지 확인

실제 화면 검증은 데스크톱과 모바일 크기에서 수행한다. 주요 차트, 표,
긴 한국어 본문, 고정 내비게이션, `/steel/` 이동을 브라우저에서 확인한다.

## 11. 배포와 갱신

1. ToSuhyeon의 테스트를 통과한 북극 수집기를 배포한다.
2. 수동 Actions 실행으로 EIA·OFAC·EU·NSIDC 첫 JSON을 만든다.
3. 공개 JSON에 비밀이 없고 스키마가 유효한지 확인한다.
4. SteelSignal 기본 화면과 `/steel/` 화면을 배포한다.
5. SteelSignal이 ToSuhyeon의 공개 JSON을 읽고 최신 상태를 표시하는지
   확인한다.
6. 예약 워크플로가 데이터 변경 때만 생성 파일을 커밋한다.

데이터 변경은 ToSuhyeon의 공개 JSON에 반영되므로 매번 SteelSignal을
다시 배포하지 않아도 브라우저가 최신 데이터를 읽는다.

## 12. 이번 구현에서 제외

- MarineTraffic·Spire·Datalastic 등 유료 AIS 연동
- 유료 TTF 실시간 시세
- GDELT·NewsAPI 헤드라인 수집
- 기업 IR·보도자료·PDF 변경 감지
- 자동 법률 판단과 OFAC 50% 룰 결론
- NSR 실제 항행 가능 일수의 자동 계산
- 자동으로 연구 결론이나 패권 지수를 재작성하는 기능
- 알림 이메일, Slack, GitHub Issue 자동 생성

위 항목은 무료 공식 데이터 자동화가 안정적으로 운영된 뒤 별도 설계로
추가한다.
