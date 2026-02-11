## 1. siteTexts.ts 수정
- [x] `constants/siteTexts.ts`에 `contactCalendarUrl` 필드 추가 (기본값: `""`) → Verify: IDE에서 타입 에러 없는지 확인

## 2. Admin.tsx 수정
- [x] `components/Admin.tsx`의 Contact 섹션 `SECTIONS` 배열에 `contactCalendarUrl` 필드 추가 (type: `url`) → Verify: 로컬 실행 후 Admin 페이지 Contact 섹션에 입력 필드 표시 확인

## 3. Contact.tsx 수정
- [ ] `components/Contact.tsx`에 캘린더 영역 조건부 렌더링 로직 추가 (`contactCalendarUrl` 유무 확인) → Verify: URL이 없을 때 렌더링되지 않는지 확인
- [ ] "Schedule" 소제목 및 설명 텍스트("촬영 가능 일정을 확인하고 문의해주세요") 추가 → Verify: 화면에 텍스트 표시 확인
- [ ] Google Calendar iframe 삽입 (스타일: `w-full`, 모바일 `h-[400px]`, 데스크톱 `h-[500px]`, `rounded-lg`) → Verify: iframe이 자리잡고 스타일이 적용되었는지 개발자 도구로 확인
- [ ] iframe에 `loading="lazy"` 속성 추가 → Verify: 코드 리뷰로 확인
- [ ] "Project Inquiry" 버튼을 캘린더 영역 아래로 배치 → Verify: 시각적으로 버튼 위치 확인

## 4. 빌드 & 배포
- [x] `npx vite build` 실행 → Verify: 터미널에 빌드 성공 메시지 확인
- [x] Git commit & push (`feat: add google calendar embed`) → Verify: GitHub 리포지토리에 반영 확인
- [x] `npx vercel --prod` (또는 자동 배포) → Verify: Vercel 대시보드에서 배포 성공 확인

## 5. 최종 검증
- [ ] 배포된 사이트 접속 후 Contact 섹션 확인 (URL 미입력 시) → Verify: 캘린더 미표시 확인
- [ ] Admin 접속 -> 캘린더 URL 입력 -> 저장 → Verify: 저장 성공 메시지 확인
- [ ] Contact 섹션 재확인 (URL 입력 후) → Verify: 구글 캘린더가 정상적으로 로드되는지 확인
- [ ] 모바일/데스크톱 뷰포트 변경 테스트 → Verify: 캘린더 높이 및 레이아웃 반응형 동작 확인
