# STEEL SIGNAL GitHub Pages 공개 배포 전환 설계

작성일: 2026-07-30  
상태: 사용자 설계 승인 완료, 구현 전 문서 검토 대기

## 1. 배경과 목표

STEEL SIGNAL 대시보드의 기능과 시각 디자인은 완성됐지만, 현재 Sites
작업공간은 인터넷 공개 기능이 비활성화되어 있다. 배포 자체는 성공했으나
소유자 로그인이 필요하므로 “주소를 아는 누구나 볼 수 있는 공개
대시보드”라는 승인 요구사항을 만족하지 못한다.

GitHub Pages를 공개 호스팅 대안으로 사용한다. 기존 데이터 수집기와 API
키를 건드리지 않고, 대시보드 전용 공개 저장소에서 화면만 배포하는 것이
목표다.

## 2. 저장소 경계

- `suhyeonhong-bit/ToSuhyeon`은 기존 역할을 유지한다.
  - FRED·ECOS 데이터를 수집한다.
  - 매주 월요일 오전 11시(한국 시간)에 CSV를 갱신한다.
  - 기존 GitHub Actions와 Secrets를 변경하지 않는다.
- 새 공개 저장소 `suhyeonhong-bit/SteelSignal`을 만든다.
  - 대시보드 소스와 GitHub Pages 배포 워크플로만 보관한다.
  - `.env`, FRED 키, ECOS 키를 포함하지 않는다.

이 경계는 데이터 수집 장애와 화면 배포 장애를 분리하고, 초보 사용자가
두 저장소의 역할을 이름만 보고도 구분할 수 있게 한다.

## 3. 정적 페이지 구조

현재 React 컴포넌트, Recharts 차트, 데이터 파서, 로딩·오류·재시도
동작을 그대로 재사용한다. GitHub Pages용으로는 서버가 필요한 Next
레이아웃 대신 별도의 작은 브라우저 시작점을 둔다.

- GitHub Pages 시작 HTML이 React 앱을 불러온다.
- 브라우저 시작점이 `SteelSignalDashboard`를 마운트한다.
- 승인된 `globals.css`와 `public/og.png`를 재사용한다.
- 빌드 기준 경로는 `/SteelSignal/`로 고정한다.
- 정적 HTML의 제목, 설명, Open Graph 및 Twitter 이미지 주소는
  `https://suhyeonhong-bit.github.io/SteelSignal/`을 기준으로 고정한다.
- 기존 Sites/Vinext 빌드는 유지해 원래 테스트와 구현을 훼손하지 않는다.

예상 공개 주소:

`https://suhyeonhong-bit.github.io/SteelSignal/`

## 4. 데이터 흐름

```text
매주 월요일 GitHub Actions
  → ToSuhyeon의 monthly_indicators.csv 갱신
  → 방문자의 브라우저가 raw GitHub CSV를 cache: no-store로 읽음
  → 파싱 후 카드·차트·표 표시
```

대시보드 코드가 런타임에 CSV를 직접 읽으므로 월요일 데이터가 갱신될 때
GitHub Pages를 다시 배포할 필요가 없다. API 키는 수집기 GitHub
Secrets에만 있고 브라우저 요청에는 포함되지 않는다.

## 5. GitHub Pages 자동 배포

새 저장소의 기본 브랜치에 검증된 소스를 올리고 GitHub Actions 기반
Pages 배포를 사용한다.

워크플로는 다음 순서로 동작한다.

1. 저장소 소스를 체크아웃한다.
2. Node 22에서 잠긴 의존성을 설치한다.
3. 기존 테스트와 Pages 전용 빌드 검사를 실행한다.
4. 정적 산출물을 Pages artifact로 업로드한다.
5. GitHub Pages에 배포한다.

기본 브랜치 변경 때 자동 배포되며 수동 실행도 가능하게 한다. 워크플로
권한은 Pages 배포에 필요한 최소 범위만 사용한다.

## 6. 오류 처리와 보안

- 네트워크 오류, CSV 형식 오류, 재시도 UI는 현재 구현을 그대로 쓴다.
- 공개 CSV 원본 링크를 오류 화면의 대안으로 유지한다.
- 빌드 산출물에서 `.env`, API 키 이름·값, Sites 소스 인증정보가 없는지
  검사한다.
- GitHub Pages는 정적 파일만 제공하며 서버 비밀값을 사용하지 않는다.
- 기존 소유자 전용 Sites 배포는 삭제하지 않는다. GitHub Pages 검증이
  끝난 뒤에도 복구 참고용으로 남긴다.

## 7. 검증 기준

로컬 및 GitHub Actions에서 다음을 확인한다.

- 기존 단위 테스트, 렌더 테스트, lint가 통과한다.
- Pages 전용 빌드가 성공한다.
- 산출물에 `index.html`, 자바스크립트·CSS, `og.png`가 있다.
- HTML의 한국어 제목과 `/SteelSignal/` 기준 자산 경로가 정확하다.
- 스타터 화면, `.env`, API 키, 인증정보가 산출물에 없다.
- 실제 공개 주소가 로그인 없이 HTTP 200으로 열린다.
- 공개 페이지가 GitHub CSV를 읽고 최신 카드·차트·전체 표를 표시한다.
- 공유 이미지 주소가 실제 GitHub Pages 주소를 가리킨다.

## 8. 범위 밖

- 데이터 수집 주기와 지표 종류 변경
- FRED·ECOS 키 재발급 또는 Secrets 변경
- 사용자 계정, 로그인, 데이터베이스 추가
- 사용자 지정 도메인 구매·연결
- 기존 Sites 프로젝트 삭제
