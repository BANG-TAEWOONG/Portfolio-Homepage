# Site Texts Google Sheets CMS 전환 — Task Checklist

## Phase 1: Google Sheets 서비스 레이어
- [ ] `services/googleSheetService.ts`에 `SITE_TEXTS_SHEET_URL` 상수 추가
  → CSV URL: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQS8u7I2fzhfrogdXqEptSCalEY1revbT9OpnlTleQMpISMwezEEInp8EBoE2lEFMZuKkEmWAtc8zXh/pub?output=csv`
- [ ] `fetchSiteTexts(): Promise<Partial<SiteTexts>>` 함수 작성
  → PapaParse CSV 파싱, `{ key, value }` 행 → SiteTexts 객체 변환
  → Verify: 함수 import 시 타입 에러 없는지 확인

## Phase 2: Hook 전환
- [ ] `hooks/useSiteTexts.ts` — localStorage 로직 제거, Google Sheets fetch로 교체
  → 모듈 레벨 캐시 적용 (useWorkItems.ts 패턴)
  → `saveTexts` 함수 제거
  → `loading` 상태 추가 반환
  → Verify: `npm run build` 성공

## Phase 3: Admin 컴포넌트 정리
- [ ] `components/Admin.tsx` — 21개 인라인 편집 폼 제거
  → "Google Sheets에서 편집" 외부 링크 버튼으로 대체
  → Verify: Admin 모달에서 링크 버튼 표시 확인

## Phase 4: 통합 검증
- [ ] `npm run build` — 빌드 에러 없음
- [ ] `npm run dev` — 로컬에서 Google Sheets 데이터 정상 로드
- [ ] Google Sheets 값 변경 → 새로고침 시 반영 확인
- [ ] 시트 접근 불가 시 DEFAULT_SITE_TEXTS 폴백 동작 확인
- [ ] 모바일 브라우저에서 데이터 정상 표시 확인
