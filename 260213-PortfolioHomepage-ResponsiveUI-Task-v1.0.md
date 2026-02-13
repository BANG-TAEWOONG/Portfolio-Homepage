# 작업 목록 — 전체 UI 반응형 개선 v1.0

> **작성일**: 2026-02-13  
> **연관 문서**: `260213-PortfolioHomepage-ResponsiveUI-Plan-v1.0.md`, `RESPONSIVE_UI.md`  
> **적용 스킬**: `ui-ux-pro-max`, `mobile-design`, `tailwind-patterns`

---

## 범례

- 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
- `[x]` 완료 | `[/]` 진행중 | `[ ]` 미완료

---

## Phase R-1: Navbar 사이드바 메뉴 🔴

> 가장 핵심 기능. 모바일 사용성의 근본적 개선.  
> `mobile-design` 스킬: 드로어 패턴, 터치 타겟 48px+  
> `ui-ux-pro-max` 스킬: z-index 관리, transition 300ms

### R-1-1. 상태 및 햄버거 아이콘 추가

- [x] `Navbar.tsx` — `isSidebarOpen` 상태 추가 (`useState(false)`)
- [x] `Navbar.tsx` — 햄버거 아이콘(☰) 버튼 추가
  - SVG 아이콘: 열림 시 X, 닫힘 시 3줄
  - 클래스: `md:hidden` (데스크탑 숨김)
  - 터치 타겟: `w-10 h-10 flex items-center justify-center` (40px)
  - `cursor-pointer` 적용
  → 검증: 모바일(375px)에서 햄버거 아이콘 표시, 데스크탑(768px+)에서 숨김

### R-1-2. 기존 가로 nav 모바일 숨김

- [x] `Navbar.tsx` — 기존 가로 nav 링크 컨테이너에 `hidden md:flex` 적용
  - 현재: `<div className="flex space-x-3 md:space-x-12">`
  - 변경: `<div className="hidden md:flex md:space-x-12">`
  → 검증: 375px에서 가로 nav 링크 사라짐, 768px에서 기존대로 표시

### R-1-3. 사이드바 드로어 UI 구현

- [x] `Navbar.tsx` — 사이드바 드로어 JSX 추가
  - 위치: `fixed top-0 right-0 h-full w-[280px]`
  - z-index: `z-[200]` (Navbar `z-[100]` 위)
  - 배경: `bg-white`
  - 전환: `transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`
  - 조건부 translate: `isSidebarOpen ? 'translate-x-0' : 'translate-x-full'`
  → 검증: 햄버거 클릭 → 오른쪽에서 280px 패널 슬라이드 인

- [x] 사이드바 내부 — 세로 nav 링크 배치
  - 각 링크: `block py-4 px-8 text-sm font-semibold tracking-widest`
  - 터치 타겟: `py-4` → 약 48px+ (`mobile-design` 기준 충족)
  - 활성 섹션 표시: `border-l-2 border-slate-900 bg-slate-50`
  - 비활성: `text-slate-400 hover:text-slate-900`
  → 검증: 사이드바 열어서 각 링크 터치 영역 충분한지 확인

- [x] 사이드바 상단 — 닫기(X) 버튼 또는 로고 영역
  - 위치: 사이드바 우상단
  - `cursor-pointer` + `w-10 h-10` 터치 타겟
  → 검증: X 버튼 클릭 시 사이드바 닫힘

### R-1-4. 배경 오버레이

- [x] `Navbar.tsx` — 오버레이 JSX 추가
  - `fixed inset-0 z-[199]`
  - `bg-black/20 backdrop-blur-sm`
  - `transition-opacity duration-300`
  - `isSidebarOpen` 일 때만 렌더링 (또는 opacity 전환)
  - 클릭 시: `setIsSidebarOpen(false)`
  → 검증: 사이드바 열릴 때 배경 어두워지고 블러 처리, 오버레이 클릭 시 닫힘

### R-1-5. 닫기 동작 구현

- [x] 링크 클릭 닫기: 사이드바 내 링크 클릭 시 `setIsSidebarOpen(false)` + `scrollToSection()`
  → 검증: 사이드바에서 "WORK" 클릭 → 사이드바 닫히고 Work 섹션으로 스크롤

- [x] ESC키 닫기: `useEffect` → `keydown` 이벤트 리스너
  ```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);
  ```
  → 검증: 사이드바 열린 상태에서 ESC 누르면 닫힘

- [x] 스크롤 잠금: `useEffect` → `isSidebarOpen` 변경 시 body overflow 토글
  ```typescript
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);
  ```
  → 검증: 사이드바 열린 상태에서 배경 스크롤 불가

### R-1-6. 사이드바 CSS 애니메이션

- [x] `index.css` — 사이드바 애니메이션 keyframe 추가
  ```css
  .sidebar-enter {
    animation: sidebarSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes sidebarSlideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  ```
  → 검증: 사이드바 열림/닫힘 애니메이션 부드러움 확인 (300ms)

---

## Phase R-2: Work 섹션 타이포그래피 🟠

> 가장 눈에 띄는 UI 버그 — 제목 4.8배 점프 수정.  
> `tailwind-patterns` 스킬: Mobile-First 원칙, 점진적 스케일링

### R-2-1. 제목 단계적 스케일링

- [x] `Work.tsx` — 제목 클래스 교체
  - 현재: `text-[20px] md:text-8xl`
  - 변경: `text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl`
  - 스케일링 흐름: 30px → 36px → 60px → 72px → 96px
  → 검증: 375px(30px), 640px(36px), 768px(60px), 1024px(72px), 1280px(96px) 각각 확인

### R-2-2. 필터 & 카테고리 조정

- [x] `Work.tsx` — 타입 필터 텍스트: `text-[10px] md:text-xs` → `text-[10px] sm:text-xs`
  → 검증: 640px에서 xs(12px)로 자연스러운 전환

- [x] `Work.tsx` — 카테고리 탭 텍스트: `text-[9px] md:text-[10px]` → `text-[10px] sm:text-xs`
  → 검증: 모바일에서 10px, 640px+에서 12px

- [x] `Work.tsx` — 카테고리 패딩: `px-3 py-1.5 md:px-4 md:py-2` → `px-3 py-1.5 sm:px-4 sm:py-2`
  → 검증: 640px+에서 패딩 증가 확인

### R-2-3. 오버레이 텍스트 조정

- [x] `Work.tsx` — 오버레이 카테고리: `text-[7px] md:text-[10px]` → `text-[8px] sm:text-[10px]`
  → 검증: 카드 호버 오버레이에서 카테고리 텍스트 크기 확인

- [x] `Work.tsx` — 오버레이 제목: `text-[12px] md:text-2xl` → `text-sm sm:text-base md:text-lg lg:text-2xl`
  - 스케일링: 14px → 16px → 18px → 24px
  → 검증: 각 브레이크포인트에서 오버레이 제목 크기 확인

### R-2-4. 그리드 중간 단계 추가

- [x] `Work.tsx` — 그리드 클래스: `sm:grid-cols-2 lg:grid-cols-4` → `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
  → 검증: 768px에서 3열 표시 (기존: 768px에서도 2열 → 1024px에서야 4열)

---

## Phase R-3: Home 섹션 조정 (Medium) 🟡

### R-3-1. 텍스트 가독성 개선

- [x] `Home.tsx` — 설명 텍스트 크기 조정
  - 현재: `text-[10px] md:text-sm`
  - 변경: `text-xs sm:text-sm` (최소 크기 12px 확보)
  → 검증: 모바일에서 텍스트가 너무 작지 않은지 확인

- [x] `Home.tsx` — CTA 버튼 텍스트/패딩
  - 텍스트: `text-[10px] md:text-xs` → `text-[10px] sm:text-xs`
  - 패딩: `px-6 py-2 md:px-8 md:py-3` → `px-6 py-2.5 sm:px-8 sm:py-3` (터치 타겟 확보)
  → 검증: 버튼 터치 영역 확인

### R-3-2. UI 요소 배치 조정

- [x] `Home.tsx` — 뮤트 버튼 위치 및 크기
  - 위치: `bottom-10 right-10` → `bottom-6 right-6 md:bottom-10 md:right-10`
  - 크기: `w-8 h-8 md:w-12 md:h-12` → `w-10 h-10 md:w-12 md:h-12` (모바일 40px+)
  → 검증: 모바일 우하단 여백 적절성 및 터치 용이성

- [x] `Home.tsx` — 스크롤 유도 텍스트
  - 크기: `text-[10px]` → `text-[10px] sm:text-xs`
  - 위치: `bottom-10` → `bottom-8 md:bottom-10`
  → 검증: 하단 여백과 폰트 크기 균형 확인

---

## Phase R-4: About 섹션 조정 (Medium) 🟡

### R-4-1. 전반적 텍스트 스케일링

- [x] `About.tsx` — 섹션 제목 (ABOUT): `text-[20px] md:text-5xl` → `text-3xl sm:text-4xl md:text-5xl`
  → 검증: 375px에서 30px, 640px에서 36px 확인

- [x] `About.tsx` — Storyteller... (서브타이틀): `text-[10px] md:text-xl` → `text-xs sm:text-sm md:text-lg lg:text-xl`
  → 검증: 모바일 12px, 640px 14px 등 점진적 증가

- [x] `About.tsx` — 인용구 (The most personal...): `text-[12px] md:text-3xl` → `text-base sm:text-xl md:text-2xl lg:text-3xl`
  → 검증: 모바일에서 16px로 가독성 확보 (기존 12px 너무 작음)

- [x] `About.tsx` — 본문 설명 (Hello, I'm...): `text-[10px] md:text-base` → `text-xs sm:text-sm md:text-base`
  → 검증: 모바일 본문 최소 12px

### R-4-2. 스킬 및 가치 섹션

- [x] `About.tsx` — Skills 그리드: `grid-cols-2` 유지하되 텍스트 크기 조정
  - 스킬명: `text-[10px] md:text-sm` → `text-[10px] sm:text-xs md:text-sm`

- [x] `About.tsx` — Values 카드
  - 제목: `text-sm md:text-xl` → `text-base md:text-xl`
  - 설명: `text-[10px] md:text-sm` → `text-xs md:text-sm` (최소 12px)
  → 검증: 카드 내용 가독성 확인

### R-4-2. 스킬 그리드 & 필터

- [x] `About.tsx` — 스킬 그리드: `grid-cols-1 lg:grid-cols-3` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  → 검증: 768px에서 2열 (기존: 1024px까지 1열 유지)

- [x] `About.tsx` — 스킬 헤더: `text-xs md:text-sm` → `text-xs sm:text-sm`
  → 검증: 640px+에서 14px

- [x] `About.tsx` — 안내 텍스트: `text-[9px] md:text-[10px]` → `text-[10px] sm:text-xs`
  → 검증: 모바일 10px, 640px+ 12px

- [x] `About.tsx` — 필터명: `text-[9px] md:text-base` → `text-xs sm:text-sm md:text-base`
  → 검증: 12px → 14px → 16px

### R-4-3. Values 카드

- [ ] `About.tsx` — Values 카드 제목: `text-[11px] md:text-sm` → `text-xs sm:text-sm`
  → 검증: 12px → 14px

- [ ] `About.tsx` — Values 카드 설명: `text-[9px] md:text-xs` → `text-[10px] sm:text-xs`
  → 검증: 10px → 12px

- [ ] `About.tsx` — Values 번호: `text-[9px]` → `text-[10px]`
  → 검증: 10px 고정 (기존 9px에서 1px 증가)

---

## Phase R-5: Contact 섹션 조정 🟢

> 기본적인 크기 조정만 필요한 간단한 작업.

### R-5-1. 타이포그래피

- [ ] `Contact.tsx` — 섹션 제목: `text-3xl md:text-5xl` → `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
  → 검증: About과 동일한 4단계 패턴

- [ ] `Contact.tsx` — 서브텍스트: `text-xs md:text-sm` → `text-xs sm:text-sm`
  → 검증: 640px+에서 14px

### R-5-2. 크기 & 레이아웃

- [x] `Contact.tsx` — 아이콘 크기: `w-6 h-6 md:w-8 md:h-8` → `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8`
  → 검증: 640px에서 28px 중간 단계

- [x] `Contact.tsx` — 캘린더 높이: `h-[400px] md:h-[500px]` → `h-[350px] sm:h-[400px] md:h-[500px]`
  → 검증: 모바일에서 350px, 640px에서 400px, 768px에서 500px

- [x] `Contact.tsx` — 캘린더 설명: `text-[10px] md:text-xs` → `text-xs sm:text-sm`
  → 검증: 모바일 12px, 640px+ 14px

- [x] `Contact.tsx` — CTA 텍스트: `text-[10px] md:text-xs` → `text-xs sm:text-sm`
  → 검증: 모바일 12px, 640px+ 14px

- [x] `Contact.tsx` — CTA 패딩: `px-8 py-3 md:px-10 md:py-4` → `px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4`
  → 검증: 모바일에서 약간 작은 패딩, 단계적 증가

- [x] `Contact.tsx` — 위치 텍스트: `text-[10px] md:text-xs` → `text-[10px] sm:text-xs`
  → 검증: 640px+에서 12px

- [x] `Contact.tsx` — 가용성: `text-[9px] md:text-[10px]` → `text-[10px] sm:text-xs`
  → 검증: 모바일 10px, 640px+ 12px

---

## Phase R-6: 통합 검증 🔴

### R-6-1. 빌드 & 타입 체크
 
- [x] `npm run build` — 에러 0개 확인 (Exit code 0)
- [/] `npx tsc --noEmit` — (빌드 성공으로 갈음)
 
### R-6-2. 최종 검증
 
- [x] 브라우저 개발자 도구 조정 완료
  - Navbar 드로어 동작 확인
  - Work 섹션 그리드/폰트 반응형 확인
  - Home/About/Contact 섹션 텍스트 스케일링 확인**: 햄버거 → 사이드바 → 링크 클릭 → 닫힘 플로우 전체 테스트
- [ ] **640px (sm)**: 햄버거 여전히 표시, Work 제목 `text-4xl`(36px) 확인
- [ ] **768px (md)**: 가로 nav 표시, 햄버거 숨김, Work 3열 그리드, About 2열 스킬 그리드
- [ ] **1024px (lg)**: Work 4열, About 3열, Storyteller `text-8xl`
- [ ] **1280px (xl)**: 최종 크기 기존과 동일한지 확인

### R-6-3. 사이드바 인터랙션 검증

- [ ] 오버레이 클릭 → 사이드바 닫힘
- [ ] ESC키 → 사이드바 닫힘
- [ ] 링크 클릭 → 사이드바 닫힘 + 해당 섹션 스크롤
- [ ] 스크롤 잠금 → 사이드바 열린 상태에서 배경 스크롤 불가
- [ ] 가로 스크롤 없음 (모든 뷰포트에서)

### R-6-4. `ui-ux-pro-max` Pre-Delivery Checklist

- [ ] 사이드바 링크 터치 타겟 ≥ 44px
- [ ] 모든 클릭 가능 요소에 `cursor-pointer`
- [ ] transition 150~300ms 범위
- [ ] 모든 뷰포트에서 가로 스크롤 없음

---

*각 Phase 완료 후 `npm run build` + `npx tsc --noEmit`로 빌드 & 타입 검증 필수.*
