# 🛠️ Portfolio Homepage — 기술스택 정리

> **프로젝트명:** minimalist-video-portfolio  
> **작성일:** 2026-05-11  

---

## 1. 프레임워크 & 언어

| 기술 | 버전 | 용도 |
|---|---|---|
| **React** | `^19.2.3` | UI 라이브러리 (최신 React 19) |
| **TypeScript** | `~5.8.2` | 정적 타입 언어 (`strict` 모드 활성화) |
| **Vite** | `^6.2.0` | 빌드 도구 & 개발 서버 |

- 개발 서버는 **포트 3000**, host `0.0.0.0` 으로 설정
- `@vitejs/plugin-react` (`^5.0.0`) 사용
- 모듈 시스템: **ESNext** (ESM)
- 컴파일 타겟: **ES2022**
- 경로 별칭: `@/*` → 프로젝트 루트

---

## 2. 스타일링

| 기술 | 버전 | 비고 |
|---|---|---|
| **Tailwind CSS** | `^4.1.18` | 유틸리티 기반 CSS 프레임워크 |
| **@tailwindcss/postcss** | `^4.1.18` | Tailwind v4 PostCSS 플러그인 |
| **PostCSS** | `^8.5.6` | CSS 후처리 도구 |
| **Autoprefixer** | `^10.4.23` | 브라우저 호환 접두사 자동 추가 |

- 기본 폰트: **Inter** (Google Fonts, sans-serif)
- 글로벌 스타일: `index.css`

---

## 3. 주요 라이브러리

| 라이브러리 | 버전 | 용도 |
|---|---|---|
| **react-swipeable** | `^7.0.2` | 모바일 스와이프 제스처 지원 |
| **papaparse** | `^5.5.3` | CSV 파싱 (Google Sheets 데이터 연동) |

---

## 4. 배포 & 인프라

| 기술 | 용도 |
|---|---|
| **Vercel** | 호스팅 & 배포 플랫폼 |
| **vercel.json** | SPA rewrites 설정 (`/*` → `/index.html`) |
| **`.env.local`** | 환경 변수 관리 (API 키 등) |

---

## 5. 프로젝트 구조

```
📁 루트
├── App.tsx                  ← 메인 앱 엔트리
├── index.tsx                ← React DOM 렌더링
├── index.html               ← HTML 템플릿
├── index.css                ← 글로벌 스타일
├── constants.ts             ← 상수 정의
├── siteTexts.ts             ← 사이트 텍스트 관리
├── types.ts                 ← 타입 정의
│
├── components/              ← UI 컴포넌트 (7개)
│   ├── Home.tsx             → 히어로 / 랜딩 섹션
│   ├── About.tsx            → 소개 섹션
│   ├── Work.tsx             → 작업물 목록
│   ├── ProjectModal.tsx     → 프로젝트 상세 모달
│   ├── Contact.tsx          → 연락처 섹션
│   ├── Navbar.tsx           → 네비게이션 바
│   └── Admin.tsx            → 관리자 페이지
│
├── hooks/                   ← 커스텀 React 훅 (3개)
│   ├── useIntersectionObserver.ts  → 스크롤 감지
│   ├── useSiteTexts.ts             → 사이트 텍스트 로딩
│   └── useWorkItems.ts            → 작업물 데이터 로딩
│
├── services/                ← 외부 API 연동 (2개)
│   ├── googleSheetService.ts  → Google Sheets CMS
│   └── youtube.ts             → YouTube API 연동
│
├── public/                  ← 정적 리소스
├── dist/                    ← 빌드 출력
└── templates/               ← 템플릿 파일
```

---

## 6. 설정 파일

| 파일 | 용도 |
|---|---|
| `package.json` | 의존성 및 스크립트 관리 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `vite.config.ts` | Vite 빌드 & 개발 서버 설정 |
| `tailwind.config.js` | Tailwind CSS 커스터마이징 |
| `postcss.config.cjs` | PostCSS 플러그인 설정 |
| `vercel.json` | Vercel 배포 설정 |
| `.env.local` | 환경 변수 (Git 제외) |

---

## 7. 주요 아키텍처 특징

### 📊 Google Sheets를 CMS로 활용
- `googleSheetService.ts` + `papaparse`를 통해 Google Sheets 스프레드시트에서 콘텐츠를 가져옴
- 별도의 백엔드 없이 콘텐츠를 관리할 수 있는 경량 CMS 패턴

### 🎬 YouTube 연동
- `youtube.ts` 서비스를 통해 영상 포트폴리오 지원

### 👁️ Intersection Observer
- `useIntersectionObserver` 커스텀 훅으로 스크롤 기반 애니메이션 및 뷰포트 감지

### 📱 모바일 대응
- `react-swipeable`로 터치 스와이프 제스처 지원
- 반응형 레이아웃

### 🔒 TypeScript Strict 모드
- `strict: true`로 타입 안전성 최대화

---

## 8. NPM 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
