# Site Texts Google Sheets CMS 전환 계획

## Context
현재 사이트 텍스트(21개 필드)는 `localStorage`에 저장되어 Admin 페이지에서 수정해도 **같은 브라우저에서만** 반영됨. 모바일 등 다른 기기에서는 `DEFAULT_SITE_TEXTS` 하드코딩 값만 표시되는 문제. 이미 Work Items에서 Google Sheets CMS를 사용 중이므로 동일한 패턴으로 통일.

## 변경 범위

### 1. Google Sheets에 새 시트(탭) 추가 (수동 작업)
- 기존 스프레드시트에 "SiteTexts" 탭 추가
- 2열 구조: `key` | `value`
- 21개 행 (homeDescription, homeButtonText, ... footerCopyright)
- 시트를 "웹에 게시" → CSV URL의 `gid` 확보

### 2. `services/googleSheetService.ts` — fetchSiteTexts() 추가
- 새 시트의 CSV URL 상수 추가 (`SITE_TEXTS_SHEET_URL`)
- `fetchSiteTexts(): Promise<Partial<SiteTexts>>` 함수 작성
- PapaParse로 CSV 파싱 → `{ key, value }` 행을 `SiteTexts` 객체로 변환
- 기존 `fetchWorkItems()` 패턴 그대로 재사용

### 3. `hooks/useSiteTexts.ts` — Google Sheets에서 로드하도록 변경
- localStorage 로직 제거
- `fetchSiteTexts()` 호출 → `DEFAULT_SITE_TEXTS`와 머지
- 모듈 레벨 캐시 적용 (useWorkItems.ts 패턴 동일)
- `saveTexts` 함수 제거 (Google Sheets에서 직접 편집)
- `loading` 상태 추가 반환

### 4. `components/Admin.tsx` — Google Sheets 편집 링크로 대체
- 기존 21개 인라인 편집 폼 제거
- "Google Sheets에서 편집" 외부 링크 버튼으로 대체
- 텍스트 섹션만 변경, 기타 Admin 기능(개발자 모드 등)은 유지

### 5. `constants/siteTexts.ts` — 변경 없음 (폴백 기본값으로 유지)

## 수정 파일 목록
| 파일 | 작업 |
|------|------|
| `services/googleSheetService.ts` | `fetchSiteTexts()` 함수 추가 |
| `hooks/useSiteTexts.ts` | localStorage → Google Sheets 전환 |
| `components/Admin.tsx` | 편집 폼 → Sheets 링크로 대체 |
| `constants/siteTexts.ts` | 변경 없음 (폴백용) |

## 데이터 흐름 (변경 후)
```
Google Sheets "sitetext" 시트
  ↓ CSV export (PapaParse)
services/googleSheetService.ts → fetchSiteTexts()
  ↓
hooks/useSiteTexts.ts (모듈 캐시 + DEFAULT_SITE_TEXTS 머지)
  ↓
components (Home, About, Contact, Footer)
```

## 검증 방법
1. `npm run build` — 빌드 성공 확인
2. `npm run dev` — 로컬에서 Google Sheets 데이터 로드 확인
3. Google Sheets에서 값 변경 → 페이지 새로고침 시 반영 확인
4. 시트 접근 불가 시 DEFAULT_SITE_TEXTS 폴백 동작 확인

## 사전 준비 (사용자 수동 작업)
- [x] Google Sheets "sitetext" 시트 생성 완료
- [x] 웹에 게시 완료
- [x] key/value 구조로 21개 행 데이터 입력
- CSV URL: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQS8u7I2fzhfrogdXqEptSCalEY1revbT9OpnlTleQMpISMwezEEInp8EBoE2lEFMZuKkEmWAtc8zXh/pub?output=csv`
- 별도 스프레드시트이므로 gid 불필요 (기본 첫 시트 사용)
