# Google Calendar 임베드 + 촬영 일정 의뢰 기능

## Context
촬영 의뢰 시 일정이 겹치지 않도록, 공유 Google Calendar를 Contact 섹션에 임베드하여 이미 잡힌 촬영 일정을 시각적으로 보여주고, 빈 날짜를 확인한 뒤 Google Form으로 의뢰할 수 있게 한다.

## 구현 계획

### 1. `siteTexts.ts` — 캘린더 URL 필드 추가
- `contactCalendarUrl` 필드 추가 (Google Calendar 공개 임베드 URL)
- 기본값: 빈 문자열 `""` (Admin에서 설정 전까지 캘린더 미표시)

### 2. `Admin.tsx` — 캘린더 URL 편집 필드 추가
- Contact 섹션 필드 목록에 `contactCalendarUrl` (라벨: "캘린더 임베드 URL", type: `url`) 추가
- placeholder에 Google Calendar 임베드 URL 형식 안내

### 3. `Contact.tsx` — 캘린더 임베드 + 레이아웃 변경
- 소셜 아이콘 + CTA 버튼 아래, 하단 정보 위에 캘린더 영역 추가
- `texts.contactCalendarUrl`이 존재할 때만 렌더링 (조건부)
- 구조:
  ```
  "Schedule" 소제목
  설명 텍스트 ("촬영 가능 일정을 확인하고 문의해주세요")
  Google Calendar iframe (반응형)
  "Project Inquiry" 버튼 (기존 버튼 — 캘린더 아래로 이동)
  ```
- iframe 스타일: `w-full`, 높이 모바일 400px / 데스크톱 500px, `border: 0`, `rounded`
- iframe에 `loading="lazy"` 추가

## 수정 파일 목록
1. `constants/siteTexts.ts` — 필드 1개 추가
2. `components/Admin.tsx` — 편집 필드 1개 추가
3. `components/Contact.tsx` — 캘린더 영역 추가 + CTA 위치 조정

## Google Calendar 임베드 URL 가이드 (사용자 참고)
1. Google Calendar → 설정 → 캘린더 공개 설정 활성화
2. "캘린더 통합" → "맞춤설정" → 임베드 코드에서 `src="..."` URL 복사
3. Admin 대시보드에서 해당 URL 입력

## 검증 방법
1. `npm run build` 성공 확인
2. 개발 서버에서 Contact 섹션에 캘린더 표시 확인
3. Admin에서 URL 변경 시 실시간 반영 확인
4. URL 미입력 시 캘린더 영역 미표시 확인
5. 모바일/데스크톱 반응형 확인
