# 작업 목록 — TWOONG STUDIO 포트폴리오 v2.0

> **작성일**: 2026-02-10  
> **연관 문서**: `260210-PortfolioHomepage-Plan-v2.0.md`, `CODE_REVIEW_REPORT.md`  
> **적용 스킬**: `plan-writing`, `react-best-practices`, `frontend-dev-guidelines`, `interactive-portfolio`

---

## 범례

- 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low
- `[x]` 완료 | `[/]` 진행중 | `[ ]` 미완료

---

## Phase 1–3: 코드 리뷰 수정 (완료)

> Phase 1–3은 이전 TASKS.md에서 **모두 완료([x])** 된 항목입니다.  
> 상세 내용은 기존 `TASKS.md`의 Phase 1–3 섹션을 참고하세요.

- [x] **Phase 1** — 🔴 Critical & 🟠 High (CR-01, 02, 10, 13, 14, 16)
- [x] **Phase 2** — 🟡 Medium (CR-03, 05, 07, 11, 15, 18, 19)
- [x] **Phase 3** — 🔵 Low (CR-08, 09, 12/17)
- [ ] **CR-06** `Home.tsx` — 비디오 소스 함수에 확장자 포함 (선택적, 후순위)
- [ ] **CR-20** `App.tsx` — `RevealSection`을 별도 파일로 분리 (프로젝트 확장 시)

---

## Phase 4: About 섹션 + 구글 폼 + Admin + 모달 개선 (완료)

### 4-0. 시트 컬럼 동기화 🔴 (완료)

> 시트 컬럼명이 변경되었으나 코드의 `SheetRow`가 업데이트되지 않아 데이터 누락 발생 가능

- [x] `services/googleSheetService.ts` — `SheetRow` 인터페이스를 실제 시트에 맞게 수정
  - `role` → `my_role`
  - `edit_tool` → `use_tools`
  - `setup` → `set_up`
  - `thumbnail_url` 제거 (시트에서 삭제됨)
  - `contribution_rate`, `client` 추가
  → 검증: `npx tsc --noEmit` 타입 에러 없음

- [x] `services/googleSheetService.ts` — `fetchWorkItems()` 매핑 수정
  - `row.role` → `row.my_role`
  - `row.setup` → `row.set_up`
  - `row.thumbnail_url || getYouTubeThumbnail(...)` → `getYouTubeThumbnail(row.video_url)`
  - `row.contribution_rate` → `contributionRate` 매핑 추가
  → 검증: 브라우저 콘솔에서 `fetchWorkItems().then(console.log)` → role, setup, contributionRate 값 확인

- [x] `types.ts` — `WorkItem`에 `contributionRate: string` 필드 추가
  → 검증: 타입 에러 없음

---

### 4-A. About 섹션 — 3개 시트 분리 로드 🟡 (완료)

#### 4-A-1. `googleSheetService.ts` — 인터페이스 & 상수 추가

- [x] `TOOLS_GID`, `EQUIPMENT_GID` 상수 정의 + URL 생성
  → 검증: TypeScript 컴파일 에러 없음 (`npx tsc --noEmit`)

- [x] `ToolSheetRow` 인터페이스 추가 (id, hidden, source_table, group, vendor, tool_name, level, remark)
  → 검증: 인터페이스가 시트 컬럼명과 정확히 1:1 매핑되는지 확인

- [x] `EquipmentSheetRow` 인터페이스 추가 (id, hidden, source_table, group, brand, name, level, remark)
  → 검증: 동일

#### 4-A-2. `googleSheetService.ts` — fetch 함수 구현

- [x] `fetchToolsData(): Promise<SkillItem[]>` 함수 구현
  - `group` → `filter`, `tool_name` → `name` 매핑
  - `category`를 `'Tools'`로 고정
  - `hidden !== 'TRUE'` 필터링
  - 에러 발생 시 빈 배열 반환 (graceful degradation)
  → 검증: 브라우저 콘솔에서 `fetchToolsData().then(console.log)` 실행 → 배열 반환 확인

- [x] `fetchEquipmentData(): Promise<SkillItem[]>` 함수 구현
  - `group` → `filter` 매핑
  - `category`를 `'Equipment'`로 고정
  - **level > 0 필터링** (핵심 비즈니스 로직)
  - `hidden !== 'TRUE'` 필터링
  → 검증: 반환 배열에서 `level === 0`인 항목이 없는지 확인

#### 4-A-3. `About.tsx` — 3개 시트 병렬 fetch

- [x] `loadSkills()` 내부에서 `Promise.all([fetchSkillsData(), fetchToolsData(), fetchEquipmentData()])` 사용
  → 검증: DevTools Network 탭에서 **3개 CSV 요청이 동시에** 발생하는지 확인 (waterfall 아님)

- [x] `constants.ts` 하드코딩 데이터를 **fallback으로** 사용하도록 변경 (시트 fetch 실패 시)
  → 검증: DevTools → Network → Offline 모드 → About 섹션에 하드코딩 데이터 표시 확인

- [x] Equipment에서 level=0 항목이 UI에 표시되지 않는지 확인
  → 검증: Equipment 탭에서 항목 목록 확인 (시트에 level=0 항목 존재 시 미표시)

---

### 4-B. 구글 폼 연동 🟢 (완료)

> 구글 폼 자체는 사용자가 직접 생성합니다. 코드에서는 **URL 연결 세팅만** 담당합니다.

- [x] `Contact.tsx` — "촬영 문의하기" CTA 버튼 추가
  - 위치: 소셜 아이콘 영역 아래
  - 스타일: border 미니멀 버튼 (기존 "Explore Portfolio"와 동일 계열)
  - 호버 효과: 배경 검정/텍스트 흰색 반전
  - `target="_blank" rel="noopener noreferrer"`
  → 검증: Contact 섹션에 버튼 표시 확인 + 클릭 시 새 탭 오픈

- [x] 폼 URL을 플레이스홀더 상수로 관리 (`'https://forms.google.com/YOUR_FORM_ID'`)
  - 이후 `useSiteTexts` 훅 적용 시 Admin에서 동적 변경 가능
  - 사용자가 폼 생성 후 URL만 교체하면 바로 연결됨
  → 검증: 버튼 클릭 시 새 탭에서 URL 오픈 확인

---

### 4-C. Admin 페이지 — 사이트 텍스트 편집 🟠 (완료)

#### 4-C-1. 기본 텍스트 인프라 구축

- [x] `constants/siteTexts.ts` — `DEFAULT_SITE_TEXTS` + `SITE_TEXT_LABELS` 정의
  - Home(2개) + About(4개) + Contact(6개) + Footer(1개) = **총 13개 키**
  → 검증: import 후 모든 키에 값이 있는지 확인

- [x] `hooks/useSiteTexts.ts` — localStorage 기반 텍스트 관리 훅
  - `getSiteText(key)`: localStorage 우선, 없으면 기본값 fallback
  - `setSiteText(key, value)`: 개별 저장
  - `saveAllTexts(texts)`: 일괄 저장
  - `resetSiteTexts()`: localStorage 삭제 + 기본값 복원
  → 검증: `useSiteTexts()` 훅에서 `getSiteText('home.copy')` 호출 → 기본값 반환 확인

#### 4-C-2. Admin 페이지 UI 구현

- [x] `components/Admin.tsx` — **비밀번호 인증 화면**
  - `input[type="password"]` + 확인 버튼
  - `import.meta.env.VITE_ADMIN_PASSWORD`와 비교
  - 실패 시 인라인 에러 메시지 * 3초 후 자동 소멸
  → 검증: `/#admin` 접속 → 비밀번호 입력 화면 표시

- [x] `components/Admin.tsx` — **텍스트 편집 폼**
  - 섹션별 그룹: Home / About / Contact / Footer
  - 각 필드: `SITE_TEXT_LABELS`에서 라벨 동적 생성 + `<textarea>`
  - 저장 버튼 → `saveAllTexts()` 호출 + "저장 완료" 피드백
  - 초기화 버튼 → `confirm()` 확인 다이얼로그 + `resetSiteTexts()` 호출
  - 메인 페이지로 돌아가기 링크 (`href="/#"`)
  → 검증: 인증 후 모든 필드에 현재 텍스트 표시 + 편집 + 저장 동작

- [x] `.env.local` — `VITE_ADMIN_PASSWORD=원하는비밀번호` 추가
  → 검증: `.env.local` 파일에 값 존재 확인

#### 4-C-3. 라우팅 & 레이지 로드

- [x] `App.tsx` — `#admin` hash 라우팅 분기
  - `useState` + `useEffect`로 `hashchange` 이벤트 리스닝
  - `#admin` → Admin 컴포넌트 렌더링
  - 그 외 → 기존 메인 페이지
  → 검증: `/#admin` ↔ `/#` 전환 시 화면 정상 전환

- [x] `App.tsx` — Admin 컴포넌트 `React.lazy()` + `Suspense` 레이지 로드
  → 검증: `/#admin` 최초 접속 시 스피너 표시 후 Admin 로드

#### 4-C-4. 기존 컴포넌트에 useSiteTexts 적용

- [x] `Home.tsx` — 하드코딩 텍스트를 `getSiteText()` 호출로 교체
  - `home.copy` (메인 카피)
  - `home.cta` ("Explore Portfolio" 버튼 텍스트)
  → 검증: Admin에서 `home.copy` 수정 → 메인 페이지 반영 확인

- [x] `About.tsx` — 하드코딩 텍스트를 `getSiteText()` 호출로 교체
  - `about.title`, `about.titleHighlight`, `about.quote`, `about.description`
  → 검증: Admin에서 수정 → About 섹션 반영 확인

- [x] `Contact.tsx` — 하드코딩 텍스트를 `getSiteText()` 호출로 교체
  - `contact.heading`, `contact.subtext`, `contact.formUrl`, `contact.formButtonText`, `contact.location`, `contact.availability`
  → 검증: Admin에서 수정 → Contact 섹션 반영 확인

- [x] `App.tsx` (푸터) — `footer.copyright` 적용
  - `"Video Producer"` → `getSiteText('footer.copyright')`
  → 검증: Admin에서 수정 → 푸터 반영 확인

#### 4-C-5. 통합 검증

- [x] `npm run build` — **에러 0개** 확인
- [x] `npx tsc --noEmit` — **타입 에러 0개** 확인
- [x] localStorage 초기화 후 모든 섹션에서 **기본값 정상 표시** 확인
- [x] Admin에서 수정 → 저장 → 메인 페이지 새로고침 → **변경된 텍스트 표시** 확인

---

### 4-D. 모달 레이아웃 개선 🟠 (완료)

> `contribution_rate` 데이터는 4-0에서 이미 파이프라인 구축 완료. 여기서는 UI만 담당.

#### 4-D-1. PC 가로형 레이아웃

- [x] `ProjectModal.tsx` — 모달 너비 확대 (`max-w-xl` → `max-w-5xl`)
  → 검증: PC 브라우저에서 모달 열기 → 화면 너비 대부분 차지

- [x] `ProjectModal.tsx` — 내부 카드를 `flex-col md:flex-row`로 변경
  - 좌측: 영상 (`md:w-3/5`, `aspect-video`, 세로 꽉 채움)
  - 우측: 텍스트 내용 (`md:w-2/5`, 스크롤 가능)
  → 검증: PC(768px 이상)에서 좌: 영상, 우: 내용 가로 배치 확인

- [x] 모바일(768px 미만)에서 기존 세로형 레이아웃 유지 확인
  → 검증: 크롬 DevTools → 모바일 뷰 → 상: 영상, 하: 내용

#### 4-D-2. 참여율 표시

- [x] `ProjectModal.tsx` — Role 아래에 `contributionRate` 배지 표시
  - 예시: `참여율 80%`
  - 기존 디자인 톤 유지 (`text-slate-400 text-xs`)
  → 검증: 모달에서 참여율 표시 확인

#### 4-D-3. 네비게이션 조정

- [x] 좌우 화살표 위치가 넓어진 모달에서도 자연스러운지 확인 및 조정
  → 검증: PC에서 좌우 화살표 클릭하여 프로젝트 전환 정상 동작

---

## Phase 5: 향후 신규 기능 (미착수)

### 5-A. 연락처 폼 (EmailJS) 🔵

- [ ] `emailjs-com` 패키지 설치 (`npm i emailjs-com`)
- [ ] EmailJS 대시보드에서 서비스/템플릿 설정 (**수동 작업**)
- [ ] `Contact.tsx`에 이름·이메일·메시지 폼 UI 추가
  - `interactive-portfolio` 스킬: Contact 전환 최적화 — 최소 필드, 명확한 CTA
- [ ] `emailjs.send()` 연동 및 성공/실패 인라인 피드백
- [ ] 폼 유효성 검사: 이메일 형식(정규식), 필수 필드(이름+메시지), 최소 길이
- [ ] 전송 완료 후 인라인 성공 메시지 + 3초 자동 소멸

### 5-B. 다국어 지원 (i18n) 🔵

- [ ] `react-i18next` + `i18next` 패키지 설치
- [ ] `locales/ko.json`, `locales/en.json` 번역 파일 생성
  - `useSiteTexts`의 키를 그대로 i18n 키로 활용 (마이그레이션 용이)
- [ ] `i18n.ts` 초기화 설정 (자동 언어 감지 + fallback `ko`)
- [ ] 모든 하드코딩 텍스트를 `t('key')` 호출로 교체
- [ ] Navbar에 🌐 언어 전환 토글 버튼 추가
- [ ] 브라우저 `navigator.language` 기반 자동 감지

### 5-C. 스크롤 애니메이션 강화 (Framer Motion) 🔵

- [ ] `framer-motion` 패키지 설치 (`npm i framer-motion`)
- [ ] `RevealSection` → `motion.section` 기반 리팩토링
  - `scroll-experience` 스킬: `useScroll` + `useTransform`으로 패럴랙스 구현
- [ ] Work 그리드: `staggerChildren` 애니메이션 (카드가 순차적으로 나타남)
- [ ] About 섹션: 패럴랙스 스크롤 효과 (배경 속도 차이)
  - `scroll-experience` 스킬: Layer Speeds 원칙 적용 (Background 0.2x, Content 1.0x)
- [ ] Home 비디오 섹션: 스크롤 기반 opacity/scale 트랜지션
- [ ] 모바일: 무거운 애니메이션 비활성화 (graceful degradation)
  - `prefers-reduced-motion` 미디어 쿼리 존중

---

*각 Phase 완료 후 `npm run build` + `npx tsc --noEmit`로 빌드 & 타입 검증 필수.*
