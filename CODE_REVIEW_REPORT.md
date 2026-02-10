# 코드 리뷰 보고서 — TWOONG STUDIO 포트폴리오

> **작성일**: 2026-02-10
> **대상 프로젝트**: React 19 + Vite + Tailwind CSS 4 기반 포트폴리오 홈페이지
> **배포 URL**: https://twoongstudio.vercel.app/

---

## 목차

1. [요약](#1-요약)
2. [심각도 분류 기준](#2-심각도-분류-기준)
3. [파일별 이슈 분석](#3-파일별-이슈-분석)
4. [아키텍처 리뷰](#4-아키텍처-리뷰)
5. [성능 리뷰](#5-성능-리뷰)
6. [접근성 및 SEO 리뷰](#6-접근성-및-seo-리뷰)
7. [신규 기능 제안](#7-신규-기능-제안)

---

## 1. 요약

| 심각도 | 건수 |
|---------|------|
| 🔴 Critical | 1 |
| 🟠 High | 5 |
| 🟡 Medium | 8 |
| 🔵 Low | 6 |
| **합계** | **20** |

전반적으로 코드 품질은 양호하며, 컴포넌트 분리·레이지 로딩·useMemo 등 React 모범 사례를 적절히 적용하고 있습니다. 주요 개선 포인트는 **보안(API 키 노출)**, **CSS 중복**, **TypeScript strict 설정**, **메모이제이션 누락** 등입니다.

---

## 2. 심각도 분류 기준

| 등급 | 설명 |
|------|------|
| 🔴 Critical | 보안 취약점, 프로덕션 장애 가능성 |
| 🟠 High | 성능 저하, 유지보수 심각한 방해 |
| 🟡 Medium | 코드 품질, 잠재적 버그 |
| 🔵 Low | 스타일, 사소한 개선사항 |

---

## 3. 파일별 이슈 분석

### 3.1 `vite.config.ts`

#### 🔴 CR-01: API 키가 빌드 번들에 포함됨 (Critical)

```typescript
// 현재 코드
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
},
```

**문제**: `define`으로 주입된 환경변수는 빌드 결과물에 **문자열 그대로** 포함됩니다. 프로덕션 JS 번들을 열면 API 키가 노출됩니다.

**수정 방안**: 현재 코드베이스에서 `process.env.GEMINI_API_KEY`를 참조하는 곳이 없으므로 `define` 블록을 제거합니다. 향후 API 키가 필요하면 서버사이드 프록시(Vercel Edge Function 등)를 통해 처리합니다.

---

### 3.2 `index.html`

#### 🟠 CR-02: CSS 중복 정의 (High)

`index.html`의 `<style>` 블록과 `index.css`에 `.reveal-view`, `.stagger-item` 등 동일한 스타일이 **중복 정의**되어 있습니다.

| 셀렉터 | index.html | index.css |
|---------|:----------:|:---------:|
| `.reveal-view` | ✅ | ✅ |
| `.stagger-item` | ✅ | ✅ |

**문제**: 유지보수 시 한쪽만 수정하면 스타일이 어긋남. 어떤 것이 적용되는지 예측 어려움.

**수정 방안**: `index.html`의 `<style>` 블록에서 중복 스타일을 제거하고, `index.css`로 통합합니다. `index.html`에는 모달 애니메이션·스크롤바 등 CSS-only 스타일만 남깁니다.

#### 🟡 CR-03: SEO 메타태그 부재 (Medium)

```html
<head>
  <title>TWOONG STUDIO</title>
  <!-- description, og:title, og:image 등 메타태그 없음 -->
</head>
```

**수정 방안**: `<meta name="description">`, Open Graph 태그, `<link rel="canonical">` 추가.

---

### 3.3 `index.css`

#### 🟡 CR-04: stagger-item 애니메이션 불일치 (Medium)

```css
/* index.css */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* index.html */
@keyframes slowFade {
  from { opacity: 0; transform: translateY(10px) scale(1); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

`stagger-item`이 두 곳에서 다른 키프레임을 참조하고 있어 실제 동작이 CSS 로드 순서에 따라 달라질 수 있습니다.

**수정 방안**: 하나의 키프레임으로 통일하여 `index.css`에 통합합니다.

---

### 3.4 `components/Home.tsx`

#### 🟡 CR-05: 인라인 `<style>` 태그 사용 (Medium)

```tsx
<style>{`
  @keyframes scroll-dot {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { transform: translateY(0%); opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }
`}</style>
```

**문제**: 컴포넌트 렌더링마다 `<style>` 태그가 DOM에 삽입됨. CSP(Content Security Policy) 정책에 위배될 수 있음.

**수정 방안**: `index.css`로 이동합니다.

#### 🔵 CR-06: 비디오 파일 확장자 누락 (Low)

```typescript
const getVideoSrc = (num: number) => {
  const numStr = num.toString().padStart(2, '0');
  return `/2026Showreel${numStr}`; // 확장자 없음
};
```

`<source>` 태그에서 `.mp4`를 붙이고 있어 동작에는 문제 없지만, 함수 자체의 의미가 불명확합니다.

---

### 3.5 `components/Navbar.tsx`

#### 🟡 CR-07: React.memo 미적용 (Medium)

`Navbar`는 `activeSection` prop이 변경될 때만 리렌더링되어야 하지만, 부모 컴포넌트(`App`)의 다른 상태 변화에도 리렌더링됩니다.

**수정 방안**: `React.memo`로 래핑합니다.

#### 🔵 CR-08: `window.pageYOffset` deprecated (Low)

```typescript
const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
```

`window.pageYOffset`은 deprecated 되었습니다. `window.scrollY`로 대체합니다.

---

### 3.6 `components/Work.tsx`

#### 🔵 CR-09: `openModal` 함수에 useCallback 미적용 (Low)

```typescript
const openModal = (item: WorkItem) => {
  setNavDirection('init');
  setSelectedWork(item);
};
```

`handleNext`, `handlePrev`, `closeModal`은 `useCallback`이 적용되어 있지만, `openModal`에만 빠져 있습니다.

**수정 방안**: `useCallback`으로 래핑합니다.

---

### 3.7 `components/ProjectModal.tsx`

#### 🟠 CR-10: YouTube URL 파싱 유틸리티 중복 (High)

`ProjectModal.tsx`의 `getYouTubeEmbedUrl()`과 `googleSheetService.ts`의 `getYouTubeId()`가 **동일한 정규식으로 YouTube URL을 파싱**하고 있습니다.

**수정 방안**: 공통 유틸리티 `utils/youtube.ts`로 분리하여 단일 소스로 관리합니다.

#### 🟡 CR-11: React.memo 미적용 (Medium)

부모(`Work`)의 상태가 변경될 때마다 불필요하게 리렌더링됩니다.

**수정 방안**: `React.memo`로 래핑합니다.

---

### 3.8 `components/About.tsx`

#### 🔵 CR-12: useRef 타입에 `any` 사용 (Low)

`useIntersectionObserver` 내부에서 `useRef<any>(null)`을 사용합니다.

**수정 방안**: `useRef<HTMLDivElement>(null)`로 구체적 타입을 지정합니다.

---

### 3.9 `components/Contact.tsx`

#### 🟠 CR-13: Vimeo 링크 placeholder (High)

```tsx
<a href="#" className="group" aria-label="Vimeo">
```

`href="#"`은 사용자를 페이지 상단으로 이동시킵니다. 실제 Vimeo 계정이 없으면 비활성화하거나 제거해야 합니다.

**수정 방안**: 실제 URL을 넣거나, 해당 링크를 비활성 처리합니다.

---

### 3.10 `services/googleSheetService.ts`

#### 🟠 CR-14: parseInt에 radix 누락 (High)

```typescript
level: parseInt(row.level) || 0,
order: parseInt(row.order) || 999,
```

**문제**: `parseInt`에 radix(진법)를 명시하지 않으면, `"08"` 등의 문자열에서 예기치 않은 결과가 발생할 수 있습니다.

**수정 방안**: `parseInt(row.level, 10)` 형태로 명시합니다.

#### 🟡 CR-15: 에러 처리 불일치 (Medium)

`fetchWorkItems`은 에러 시 `reject(err)`를 호출하고, `fetchSkillsData`의 `complete` 콜백은 `resolve([])`를 반환합니다. 일관성이 없습니다.

**수정 방안**: 두 함수 모두 `resolve([])`로 통일하여 graceful degradation 패턴을 유지합니다.

---

### 3.11 `hooks/useWorkItems.ts`

#### 🟠 CR-16: 캐싱 전략 부재 (High)

매 컴포넌트 마운트마다 Google Sheets API를 호출합니다. 페이지 내 네비게이션(SPA)에서는 한 번만 호출되지만, 새로고침 시마다 요청이 발생합니다.

**수정 방안**: 모듈 레벨 캐시 변수를 사용하여 동일 세션 내 중복 호출을 방지합니다.

---

### 3.12 `hooks/useIntersectionObserver.ts`

#### 🔵 CR-17: useRef 타입 `any` (Low)

```typescript
const ref = useRef<any>(null);
```

**수정 방안**: `useRef<HTMLElement>(null)`로 변경합니다.

---

### 3.13 `tsconfig.json`

#### 🟡 CR-18: strict 모드 비활성화 (Medium)

```json
{
  "compilerOptions": {
    // "strict": true 없음
  }
}
```

**문제**: `noImplicitAny`, `strictNullChecks` 등이 비활성 상태로, 타입 안전성이 보장되지 않습니다.

**수정 방안**: `"strict": true` 추가합니다.

---

### 3.14 `tailwind.config.js`

#### 🟡 CR-19: content 경로에 존재하지 않는 디렉토리 포함 (Medium)

```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",  // src 폴더 없음!
  "./components/**/*.{js,ts,jsx,tsx}",
  "./*.{js,ts,jsx,tsx}",
],
```

**문제**: `src` 디렉토리가 존재하지 않아 불필요한 경로 스캔이 발생합니다.

**수정 방안**: `./src/**/*` 경로를 제거합니다.

---

### 3.15 `App.tsx`

#### 🔵 CR-20: RevealSection 컴포넌트가 App 파일에 정의됨 (Low)

`RevealSection`은 재사용 가능한 컴포넌트이지만 `App.tsx` 내부에 정의되어 있습니다.

**수정 방안**: 현재 규모에서는 허용 가능. 프로젝트가 커지면 별도 파일로 분리를 권장합니다.

---

## 4. 아키텍처 리뷰

### 장점
- **레이지 로딩**: `React.lazy()` + `Suspense`로 코드 분할 적용 ✅
- **관심사 분리**: `hooks/`, `services/`, `components/` 구조로 역할 분리 ✅
- **Google Sheets CMS**: 서버 없이 컨텐츠 관리 가능 ✅
- **포탈(Portal)**: 모달을 `document.body`에 렌더링하여 z-index 문제 해결 ✅
- **IntersectionObserver**: 스크롤 이벤트 대신 IO 사용으로 성능 최적화 ✅

### 개선 필요
- `src/` 디렉토리 없이 루트에 모든 파일이 배치되어 있어 프로젝트 확장 시 정리가 필요합니다
- YouTube URL 파싱 로직이 두 곳에 중복되어 있습니다
- CSS 스타일이 `index.html`, `index.css`, 컴포넌트 인라인 세 곳에 분산되어 있습니다

---

## 5. 성능 리뷰

### 현재 적용된 최적화
- `useMemo`로 필터링 결과 캐싱 ✅
- `useCallback`으로 핸들러 메모이제이션 ✅
- `loading="lazy"`로 이미지 지연 로딩 ✅
- CSS `will-change` 힌트 ✅
- 컴포넌트 코드 스플리팅 ✅

### 추가 권장 최적화
- `Navbar`, `ProjectModal`에 `React.memo` 적용
- Google Sheets 응답 캐싱
- `openModal` 핸들러 `useCallback` 적용

---

## 6. 접근성 및 SEO 리뷰

### SEO
- ❌ `<meta name="description">` 없음
- ❌ Open Graph 메타태그 없음
- ❌ `<link rel="canonical">` 없음
- ✅ `<html lang="ko">` 설정됨
- ✅ 시맨틱 HTML (`<main>`, `<section>`, `<footer>`) 사용

### 접근성
- ✅ `aria-label` 적절히 사용 (네비게이션 버튼, 소셜 링크)
- ✅ `alt` 속성 이미지에 적용
- ❌ 키보드 포커스 인디케이터가 기본 스타일에서 제거될 수 있음
- ❌ 모달 열릴 때 포커스 트랩(Focus Trap) 미구현

---

## 7. 신규 기능 제안

### 7.1 연락처 폼 (EmailJS)
**EmailJS**는 서버 없이 프론트엔드에서 직접 이메일을 보낼 수 있는 서비스입니다.
- 무료 플랜: 월 200건 (포트폴리오 사이트에 적합)
- 구현: `emailjs-com` 패키지 설치 → `emailjs.send()` 호출
- `Contact.tsx`에 이름/이메일/메시지 폼 추가

### 7.2 다국어 지원 (i18n)
- `react-i18next` 라이브러리 활용
- `locales/ko.json`, `locales/en.json` 번역 파일 관리
- Navbar에 언어 전환 토글 추가

### 7.3 스크롤 애니메이션 강화 (Framer Motion)
- `framer-motion` 라이브러리 도입
- 현재 CSS 기반 애니메이션을 `motion` 컴포넌트로 교체
- `useScroll`, `useTransform` 훅으로 패럴랙스 효과 구현

### 7.4 비디오 호버 프리뷰
- Work 섹션 썸네일에 마우스 호버 시 짧은 프리뷰 비디오 재생
- Google Sheets에 `preview_url` 필드 추가
- `<video>` 태그로 자동 재생(muted, loop) 구현

---

*보고서 끝. 상세 수정 작업 목록은 `TASKS.md`를 참조하세요.*
