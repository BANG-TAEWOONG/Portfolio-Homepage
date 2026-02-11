# Google Calendar 임베드 + 촬영 일정 의뢰 기능

## Goal
Contact 섹션에 Google Calendar를 임베드하여 촬영 일정을 시각적으로 보여주고, 빈 날짜를 확인한 뒤 Google Form으로 의뢰할 수 있게 한다. Admin 대시보드에서 캘린더 URL을 관리할 수 있도록 한다.

## Proposed Changes

### SiteTexts 상수

#### [MODIFY] [siteTexts.ts](file:///c:/Users/BANG/Desktop/portfolio%20homepage%20PJT/constants/siteTexts.ts)
- Contact 섹션에 `contactCalendarUrl` 필드 추가 (기본값: `""`)
- URL이 비어있으면 캘린더 미표시, 값이 있으면 iframe 렌더링

---

### Admin 대시보드

#### [MODIFY] [Admin.tsx](file:///c:/Users/BANG/Desktop/portfolio%20homepage%20PJT/components/Admin.tsx)
- Contact 섹션 `SECTIONS` 배열에 `contactCalendarUrl` 필드 추가
  - 라벨: `"캘린더 임베드 URL"`
  - type: `url`
  - placeholder: Google Calendar 임베드 URL 형식 안내

---

### Contact 컴포넌트

#### [MODIFY] [Contact.tsx](file:///c:/Users/BANG/Desktop/portfolio%20homepage%20PJT/components/Contact.tsx)
- 소셜 아이콘 아래, CTA 버튼 위에 캘린더 영역 추가
- 조건부 렌더링: `texts.contactCalendarUrl`이 존재하고 비어있지 않을 때만 표시
- 구조:
  ```
  "Schedule" 소제목
  설명 텍스트 ("촬영 가능 일정을 확인하고 문의해주세요")
  Google Calendar iframe (반응형)
  "Project Inquiry" 버튼 (캘린더 아래)
  ```
- iframe 스타일: `w-full`, 높이 모바일 `400px` / 데스크톱 `500px`, `border-0`, `rounded-lg`
- iframe에 `loading="lazy"` 추가

## Verification Plan

### Automated Tests
```bash
npx vite build
```
- 빌드 성공 여부로 기본적인 타입/구문 에러 확인

### Manual Verification
1. `npm run dev` → Contact 섹션 이동 → URL 미입력 상태에서 캘린더 영역 **미표시** 확인
2. 푸터 5탭 → 비번 `1234` → Admin 진입 → Contact 섹션에 "캘린더 임베드 URL" 필드 존재 확인
3. Google Calendar 임베드 URL 입력 후 저장 → Contact 섹션에 캘린더 **표시** 확인
4. 모바일/데스크톱 반응형 확인 (브라우저 크기 조절)
5. 캘린더 아래 "Project Inquiry" 버튼 위치 확인
