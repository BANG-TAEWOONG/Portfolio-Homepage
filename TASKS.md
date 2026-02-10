# 작업 목록 — TWOONG STUDIO 포트폴리오

> **작성일**: 2026-02-10
> **연관 문서**: `CODE_REVIEW_REPORT.md`

---

## 범례

- 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low
- `[x]` 완료 | `[ ]` 미완료

---

## Phase 1: Critical & High 우선 수정

### 🔴 Critical

- [x] **CR-01** `vite.config.ts` — `define` 블록에서 API 키 주입 코드 제거
  - `process.env.API_KEY`, `process.env.GEMINI_API_KEY` 정의 삭제

### 🟠 High

- [x] **CR-02** `index.html` + `index.css` — CSS 중복 제거 및 통합
  - `index.html`에서 `.reveal-view`, `.stagger-item` 중복 스타일 제거
  - `index.css`에 모든 커스텀 애니메이션 통합

- [x] **CR-10** YouTube URL 파싱 유틸리티 분리
  - `utils/youtube.ts` 신규 생성
  - `ProjectModal.tsx`와 `googleSheetService.ts`에서 공통 유틸 사용

- [x] **CR-13** `components/Contact.tsx` — Vimeo 링크 비활성 처리
  - `href="#"` → 비활성 상태로 변경 (클릭 시 페이지 이동 방지)

- [x] **CR-14** `services/googleSheetService.ts` — `parseInt` radix 추가
  - `parseInt(row.level)` → `parseInt(row.level, 10)`
  - `parseInt(row.order)` → `parseInt(row.order, 10)`

- [x] **CR-16** `hooks/useWorkItems.ts` — 모듈 레벨 캐싱 추가

---

## Phase 2: Medium 개선

### 🟡 Medium

- [x] **CR-03** `index.html` — SEO 메타태그 추가
  - `<meta name="description">`
  - Open Graph 태그 (`og:title`, `og:description`, `og:image`, `og:url`)
  - `<link rel="canonical">`

- [x] **CR-05** `components/Home.tsx` — 인라인 `<style>` 태그를 `index.css`로 이동

- [x] **CR-07** `components/Navbar.tsx` — `React.memo` 래핑

- [x] **CR-11** `components/ProjectModal.tsx` — `React.memo` 래핑

- [x] **CR-15** `services/googleSheetService.ts` — 에러 처리 통일
  - `fetchWorkItems`의 에러 처리를 graceful degradation 패턴으로 변경

- [x] **CR-18** `tsconfig.json` — `"strict": true` 추가

- [x] **CR-19** `tailwind.config.js` — 존재하지 않는 `./src/**/*` 경로 제거

---

## Phase 3: Low 개선

### 🔵 Low

- [x] **CR-08** `components/Navbar.tsx` — `window.pageYOffset` → `window.scrollY`

- [x] **CR-09** `components/Work.tsx` — `openModal`에 `useCallback` 적용

- [x] **CR-12 / CR-17** `hooks/useIntersectionObserver.ts` — `useRef<any>` → `useRef<HTMLElement>`

- [ ] **CR-06** `components/Home.tsx` — 비디오 소스 함수에 확장자 포함 (선택적)

- [ ] **CR-20** `App.tsx` — `RevealSection`을 별도 파일로 분리 (프로젝트 확장 시)

---

## Phase 4: About 섹션 수정 + 구글 폼 + Admin (현재 작업)

> **연관 문서**: `PLAN.md`

### About 섹션 — 3개 시트 분리 로드

- [ ] `services/googleSheetService.ts` — Tools/Equipment 시트 GID 추가
- [ ] `services/googleSheetService.ts` — `ToolSheetRow` 인터페이스 추가 (id, hidden, source_table, group, vendor, tool_name, level, remark)
- [ ] `services/googleSheetService.ts` — `EquipmentSheetRow` 인터페이스 추가 (id, hidden, source_table, group, brand, name, level, remark)
- [ ] `services/googleSheetService.ts` — `fetchToolsData()` 함수 구현 (group→filter, tool_name→name 매핑)
- [ ] `services/googleSheetService.ts` — `fetchEquipmentData()` 함수 구현 (level > 0만 필터링)
- [ ] `components/About.tsx` — 3개 시트 병렬 fetch (`Promise.all`)
- [ ] `components/About.tsx` — Equipment level=0 항목 제외 로직

### 구글 폼 (영상 촬영 지원서)

- [ ] Google Forms에서 촬영 지원서 폼 생성 (수동)
- [ ] `components/Contact.tsx` — "촬영 문의하기" CTA 버튼 추가
- [ ] 버튼 클릭 시 구글 폼 새 탭 오픈

### Admin 페이지 — 사이트 텍스트 편집

- [ ] `constants/siteTexts.ts` — 기본 텍스트 정의 (home.copy, about.*, contact.*, footer.*)
- [ ] `hooks/useSiteTexts.ts` — localStorage 기반 텍스트 관리 훅
- [ ] `components/Admin.tsx` — 비밀번호 인증 + 텍스트 편집 폼 + 저장/초기화
- [ ] `App.tsx` — `#admin` hash 라우팅 분기 + Admin 레이지 로드
- [ ] `components/Home.tsx` — useSiteTexts 훅 적용
- [ ] `components/About.tsx` — useSiteTexts 훅 적용
- [ ] `components/Contact.tsx` — useSiteTexts 훅 적용
- [ ] `App.tsx` — 푸터 텍스트 useSiteTexts 적용
- [ ] `.env.local` — `VITE_ADMIN_PASSWORD` 설정

---

## Phase 5: 향후 신규 기능

### 연락처 폼 (EmailJS)

- [ ] `emailjs-com` 패키지 설치
- [ ] EmailJS 대시보드에서 서비스/템플릿 설정
- [ ] `Contact.tsx`에 이름·이메일·메시지 폼 UI 추가
- [ ] `emailjs.send()` 연동 및 성공/실패 피드백 구현
- [ ] 폼 유효성 검사 (이메일 형식, 필수 필드)
- [ ] 전송 완료 후 토스트 알림

### 다국어 지원 (i18n)

- [ ] `react-i18next` + `i18next` 패키지 설치
- [ ] `locales/ko.json`, `locales/en.json` 번역 파일 생성
- [ ] i18n 초기화 설정 (`i18n.ts`)
- [ ] 모든 하드코딩 텍스트를 `t('key')` 호출로 교체
- [ ] Navbar에 언어 전환 토글 버튼 추가
- [ ] 브라우저 언어 자동 감지 기능

### 스크롤 애니메이션 강화 (Framer Motion)

- [ ] `framer-motion` 패키지 설치
- [ ] `RevealSection` 컴포넌트를 `motion` 기반으로 리팩토링
- [ ] Work 그리드에 stagger 애니메이션 적용
- [ ] About 섹션 패럴랙스 스크롤 효과
- [ ] Home 비디오 섹션 스크롤 기반 트랜지션

### 비디오 호버 프리뷰

- [ ] Google Sheets에 `preview_url` 컬럼 추가
- [ ] `types.ts`에 `previewUrl` 필드 추가
- [ ] `googleSheetService.ts`에서 프리뷰 URL 파싱
- [ ] Work 썸네일 호버 시 `<video>` 프리뷰 재생 구현
- [ ] 모바일 대응 (long press → 프리뷰)

---

*각 Phase 완료 후 `npm run build`로 빌드 검증 필수.*
