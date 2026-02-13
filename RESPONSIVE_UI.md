# 전체 UI 반응형 개선 계획

## Context
현재 포트폴리오 사이트는 `md`(768px) 하나의 브레이크포인트에만 의존하여, 모바일↔데스크탑 간 급격한 크기 점프가 발생합니다. 특히 모바일에서 네비게이션이 가로로 빽빽하게 나열되고, Work 제목이 20px→96px로 4.8배나 점프하는 등 문제가 있습니다. 이 계획은 **모바일 사이드바 메뉴**를 추가하고, 모든 섹션에 **부드러운 반응형 스케일링**을 적용합니다.

---

## 1. Navbar 사이드바 메뉴 (`components/Navbar.tsx`)

### 추가할 것
- `isSidebarOpen` 상태 추가
- **모바일 (< md)**: 기존 가로 nav 링크 숨기고, 햄버거 아이콘 표시
- **사이드바 드로어**: 오른쪽에서 슬라이드 인, `w-[280px]`, `z-[200]`
  - 배경 오버레이: `bg-black/20 backdrop-blur-sm`
  - 세로 nav 링크 (터치 타겟 48px+, `text-sm` 크기)
  - 활성 섹션 표시: `border-l-2 border-slate-900`
  - 링크 클릭 / 오버레이 클릭 / ESC키로 닫기
  - 열릴 때 `body overflow-hidden` 스크롤 잠금
- **데스크탑 (md+)**: 기존 가로 레이아웃 유지, 햄버거 숨김
- 사이드바 transition: `transform 300ms cubic-bezier(0.22, 1, 0.36, 1)`

### CSS 추가 (`index.css`)
```css
.sidebar-enter { animation: sidebarSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
@keyframes sidebarSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
```

---

## 2. Home 섹션 (`components/Home.tsx`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 설명 텍스트 | `text-lg md:text-2xl lg:text-3xl` | `text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl` |
| CTA 버튼 텍스트 | `text-[10px] md:text-xs` | `text-xs md:text-sm` |
| CTA 버튼 패딩 | `px-10 py-4 md:px-12 md:py-5` | `px-8 py-3.5 sm:px-10 sm:py-4 md:px-12 md:py-5` |
| 스크롤 텍스트 | `text-[8px]` | `text-[10px] md:text-xs` |
| 뮤트 버튼 위치 | `bottom-12 right-12` | `bottom-6 right-6 md:bottom-12 md:right-12` |

---

## 3. Work 섹션 (`components/Work.tsx`) — 가장 급한 수정

| 요소 | 현재 | 변경 |
|------|------|------|
| **제목** | `text-[20px] md:text-8xl` | `text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl` |
| 타입 필터 텍스트 | `text-[10px] md:text-xs` | `text-[10px] sm:text-xs` |
| 카테고리 탭 | `text-[9px] md:text-[10px]` | `text-[10px] sm:text-xs` |
| 카테고리 패딩 | `px-3 py-1.5 md:px-4 md:py-2` | `px-3 py-1.5 sm:px-4 sm:py-2` |
| 오버레이 카테고리 | `text-[7px] md:text-[10px]` | `text-[8px] sm:text-[10px]` |
| 오버레이 제목 | `text-[12px] md:text-2xl` | `text-sm sm:text-base md:text-lg lg:text-2xl` |
| 그리드 | `sm:grid-cols-2 lg:grid-cols-4` | `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` |

---

## 4. About 섹션 (`components/About.tsx`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 섹션 제목 | `text-3xl md:text-5xl` | `text-2xl sm:text-3xl md:text-4xl lg:text-5xl` |
| Storyteller | `text-5xl md:text-8xl lg:text-9xl` | `text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl` |
| 인용구 | `text-lg md:text-2xl` | `text-base sm:text-lg md:text-xl lg:text-2xl` |
| 설명 | `text-sm md:text-lg` | `text-sm sm:text-base md:text-lg` |
| 스킬 그리드 | `grid-cols-1 lg:grid-cols-3` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| 스킬 헤더 | `text-xs md:text-sm` | `text-xs sm:text-sm` |
| 안내 텍스트 | `text-[9px] md:text-[10px]` | `text-[10px] sm:text-xs` |
| 필터명 | `text-[9px] md:text-base` | `text-xs sm:text-sm md:text-base` |
| Values 카드 제목 | `text-[11px] md:text-sm` | `text-xs sm:text-sm` |
| Values 카드 설명 | `text-[9px] md:text-xs` | `text-[10px] sm:text-xs` |
| Values 번호 | `text-[9px]` | `text-[10px]` |

---

## 5. Contact 섹션 (`components/Contact.tsx`)

| 요소 | 현재 | 변경 |
|------|------|------|
| 섹션 제목 | `text-3xl md:text-5xl` | `text-2xl sm:text-3xl md:text-4xl lg:text-5xl` |
| 서브텍스트 | `text-xs md:text-sm` | `text-xs sm:text-sm` |
| 아이콘 크기 | `w-6 h-6 md:w-8 md:h-8` | `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8` |
| 캘린더 높이 | `h-[400px] md:h-[500px]` | `h-[350px] sm:h-[400px] md:h-[500px]` |
| 캘린더 설명 | `text-[10px] md:text-xs` | `text-xs sm:text-sm` |
| CTA 텍스트 | `text-[10px] md:text-xs` | `text-xs sm:text-sm` |
| CTA 패딩 | `px-8 py-3 md:px-10 md:py-4` | `px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4` |
| 위치 텍스트 | `text-[10px] md:text-xs` | `text-[10px] sm:text-xs` |
| 가용성 | `text-[9px] md:text-[10px]` | `text-[10px] sm:text-xs` |

---

## 6. ProjectModal (`components/ProjectModal.tsx`)
- 이미 `md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-7xl` 적용됨
- 추가 변경 없음

---

## 구현 순서
1. Navbar 사이드바 (가장 핵심 기능)
2. Work 제목 점프 수정 (가장 눈에 띄는 버그)
3. Home → About → Contact 순서로 타이포그래피 조정
4. index.css에 사이드바 애니메이션 추가

---

## 작업 체크리스트

### Navbar 사이드바
- [ ] `isSidebarOpen` 상태 + 햄버거 아이콘 추가
- [ ] 사이드바 드로어 UI (오른쪽 슬라이드, 280px)
- [ ] 배경 오버레이 + 스크롤 잠금
- [ ] 링크 클릭 / 오버레이 클릭 / ESC키 닫기
- [ ] `index.css`에 사이드바 애니메이션 추가

### Work 섹션
- [ ] 제목 `text-[20px] md:text-8xl` → 단계적 스케일링
- [ ] 타입 필터 / 카테고리 탭 크기 조정
- [ ] 오버레이 텍스트 크기 조정
- [ ] 그리드 `md:grid-cols-3` 추가

### Home 섹션
- [ ] 설명 텍스트 단계적 스케일링
- [ ] CTA 버튼 크기/패딩 조정
- [ ] 뮤트 버튼 위치 모바일 대응

### About 섹션
- [ ] 섹션 제목 / Storyteller 단계적 스케일링
- [ ] 인용구 / 설명 크기 조정
- [ ] 스킬 그리드 `md:grid-cols-2` 추가
- [ ] Values 카드 텍스트 크기 조정

### Contact 섹션
- [ ] 섹션 제목 / 서브텍스트 조정
- [ ] 아이콘 / 캘린더 / CTA 크기 조정

---

## 검증
- `npm run build` 빌드 성공 확인
- 개발 서버에서 브라우저 DevTools로 375px / 640px / 768px / 1024px / 1280px 뷰포트 확인
