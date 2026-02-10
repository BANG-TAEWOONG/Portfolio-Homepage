# About 섹션 수정 + 구글 폼 + Admin 페이지 구현 계획

## Context
포트폴리오 홈페이지의 About 섹션 데이터 소스를 3개 시트로 분리하고, 영상 촬영 지원서(구글 폼) 연동 및 사이트 텍스트 편집용 Admin 페이지를 추가합니다.

---

## Part 1: About 섹션 — 3개 시트에서 데이터 로드

### 현재 구조
- `fetchSkillsData()` → GID `865936350` 1개 시트에서 모든 데이터 로드
- `SkillItem` 타입: `{ category, filter, name, level, order, hidden }`

### 변경 후 구조
3개 시트를 각각 fetch:

| 시트 | GID | 컬럼 | 용도 |
|------|-----|-------|------|
| 02_Capabilities | `865936350` | category, filter, name, level, order, hidden | 기존과 동일 |
| 03_Tools | `2121398315` | id, hidden, source_table, **group**, vendor, **tool_name**, **level**, remark | group → filter, tool_name → name 매핑 |
| 04_Equipment | `1277913603` | id, hidden, source_table, **group**, brand, **name**, **level**, remark | group → filter, level > 0인 항목만 표시 |

### 수정 파일

**`types.ts`** — ToolItem, EquipmentItem 인터페이스 추가 (SheetRow용)

**`services/googleSheetService.ts`**:
1. `TOOLS_GID = '2121398315'`, `EQUIPMENT_GID = '1277913603'` 상수 추가
2. `ToolSheetRow`, `EquipmentSheetRow` 인터페이스 추가
3. `fetchToolsData()` 함수 추가 — group을 filter로, tool_name을 name으로 매핑
4. `fetchEquipmentData()` 함수 추가 — group을 filter로, level > 0만 필터링
5. 두 함수 모두 `SkillItem[]` 형태로 반환 (기존 About 컴포넌트와 호환)

**`components/About.tsx`**:
1. `fetchToolsData()`, `fetchEquipmentData()` 추가 import
2. `useEffect`에서 3개 시트 병렬 fetch (`Promise.all`)
3. 각 카테고리별 category 값 자동 설정 (Capabilities/Tools/Equipment)
4. Equipment는 level이 0인 항목 제외

---

## Part 2: 구글 폼 (영상 촬영 지원서)

### 접근 방식
Google Form을 새로 만드는 것은 Google 대시보드에서 수동으로 해야 합니다. 코드에서는:
1. Contact 섹션에 **"촬영 문의하기"** 버튼 추가
2. 버튼 클릭 시 Google Form URL을 새 탭으로 오픈
3. Google Form URL은 `.env.local`에 저장하거나 Google Sheets 텍스트 시트에서 읽어옴

### 수정 파일
**`components/Contact.tsx`**:
- 소셜 링크 아래에 "촬영 문의" CTA 버튼 추가
- 버튼 스타일: 기존 Home의 "Explore Portfolio" 버튼과 유사한 스타일
- URL은 상수로 관리 (향후 Admin에서 변경 가능)

---

## Part 3: Admin 페이지

### 아키텍처
Vercel 정적 배포 환경에서 **localStorage** 기반으로 텍스트 오버라이드합니다:
- 기본값: 코드에 하드코딩된 텍스트
- Admin에서 수정 → localStorage에 저장
- 각 컴포넌트는 localStorage 값 우선 사용, 없으면 기본값 fallback

### 신규 파일

**`hooks/useSiteTexts.ts`** — 사이트 텍스트 관리 커스텀 훅
- `getSiteText(key)`: localStorage에서 읽기, 없으면 기본값 반환
- `setSiteText(key, value)`: localStorage에 저장
- `getAllSiteTexts()`: 전체 텍스트 반환
- `resetSiteTexts()`: 기본값으로 초기화

**`constants/siteTexts.ts`** — 기본 텍스트 정의
```
{
  "home.copy": "세상을 프레임 속에 담아내는...",
  "about.title": "I AM A",
  "about.titleHighlight": "STORYTELLER.",
  "about.quote": "카메라는 도구일 뿐...",
  "about.description": "단순히 기록하는 것을...",
  "contact.heading": "CONTACT",
  "contact.subtext": "함께 새로운 프로젝트를...",
  "contact.formUrl": "https://forms.google.com/...",
  "contact.formButtonText": "촬영 문의하기",
  "contact.location": "Seoul, South Korea",
  "contact.availability": "Available for worldwide projects",
  "footer.copyright": "Video Producer"
}
```

**`components/Admin.tsx`** — Admin 페이지 컴포넌트
- 비밀번호 입력 화면 (미인증 상태)
- 인증 후: 섹션별 텍스트 편집 폼
- 각 필드: 라벨 + textarea
- 저장 버튼 → localStorage 저장
- 초기화 버튼 → 기본값 복원
- 비밀번호는 `.env.local`의 `VITE_ADMIN_PASSWORD`에서 읽거나, 빌드 시 주입

### 라우팅
**`App.tsx`** 수정:
- URL hash 기반 라우팅 (`#admin`)
- `#admin` 접속 시 Admin 컴포넌트 렌더링
- 그 외에는 기존 메인 페이지 렌더링

### 기존 컴포넌트 수정
각 컴포넌트에서 하드코딩 텍스트를 `useSiteTexts` 훅으로 교체:
- **`Home.tsx`**: 메인 카피, Explore Portfolio 버튼 텍스트
- **`About.tsx`**: 제목, 인용구, 설명문
- **`Contact.tsx`**: 헤딩, 서브텍스트, 위치, 가용성, 폼 URL/버튼텍스트
- **`App.tsx`**: 푸터 텍스트

---

## 수정 대상 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `types.ts` | ToolSheetRow, EquipmentSheetRow 타입 추가 |
| `services/googleSheetService.ts` | fetchToolsData(), fetchEquipmentData() 추가 |
| `components/About.tsx` | 3개 시트 병렬 fetch, Equipment level>0 필터 |
| `components/Contact.tsx` | 촬영 문의 버튼 추가, useSiteTexts 적용 |
| `components/Home.tsx` | useSiteTexts 적용 |
| `components/Admin.tsx` | **신규** — Admin 페이지 |
| `hooks/useSiteTexts.ts` | **신규** — 텍스트 관리 훅 |
| `constants/siteTexts.ts` | **신규** — 기본 텍스트 정의 |
| `App.tsx` | hash 라우팅 분기 + Admin 레이지 로드 |

---

## 검증 방법
1. `npm run build` 성공 확인
2. 개발 서버에서 About 섹션 — 3개 카테고리 데이터 각각 로드 확인
3. Equipment에서 level 0인 항목이 표시되지 않는지 확인
4. Contact 섹션의 촬영 문의 버튼 동작 확인
5. `/#admin` 접속 → 비밀번호 입력 → 텍스트 편집 → 저장 → 메인 페이지 반영 확인
6. localStorage 초기화 후 기본값 복원 확인
