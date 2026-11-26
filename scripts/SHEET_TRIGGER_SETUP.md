# 구글 시트 새 행 추가 시 자동 미디어 동기화 (1분 설정 가이드)

PC에서 매시간 백그라운드로 돌던 예약 작업은 제거되었으며, 이제 **평소에는 PC·클라우드 어디서도 아무것도 돌지 않고**, 구글 시트(`01_Project`)에 새 작품을 입력했을 때만 클라우드가 **단 1회** 실행되어 썸네일·미리보기·스틸컷을 추출해 홈페이지에 반영합니다.

---

## 최초 1회 설정 (3단계 · 약 1분)

### 1단계: GitHub 토큰 1개 발급
1. GitHub 로그인 → 우측 상단 프로필 → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. 설정 값:
   - **Repository access**: `Only select repositories` → **`Portfolio-Homepage`** 선택
   - **Permissions → Repository permissions → Contents**: **`Read and write`** 선택
3. 생성된 토큰(`github_pat_...`) 복사

---

### 2단계: 구글 시트에 자동 신호 스크립트 넣기
1. 포트폴리오 `work` 구글 스프레드시트 열기
2. 상단 메뉴 **확장 프로그램 → Apps Script** 클릭
3. 편집기 내용을 모두 지우고 [`google_apps_script_trigger.gs`](./google_apps_script_trigger.gs) 파일 내용 전체 붙여넣기 → 저장(`Ctrl+S`)
4. 구글 시트로 돌아가 새로고침(`F5`) → 상단 메뉴 **`🎬 TWOONG 미디어 동기화 → GitHub 토큰 설정`** 클릭 후 1단계에서 복사한 토큰 붙여넣기 *(최초 1회 구글 권한 허용 클릭)*

---

### 3단계: "수정 시" 자동 실행 트리거 연결
1. 다시 **Apps Script** 창 왼쪽 메뉴 **⏰ 트리거(시계 아이콘) → `+ 트리거 추가`** 클릭
2. 아래와 같이 선택 후 **저장**:
   - 실행할 함수 선택: **`onProjectSheetEdit`**
   - 이벤트 소스 선택: **`스프레드시트에서`**
   - 이벤트 유형 선택: **`수정 시`**

✅ **완료!** 앞으로 `01_Project` 시트에 새 행(`id`, `title`, `video_url`)을 입력하면 자동으로 추출·빌드·Vercel 배포가 1회 실행됩니다. *(직접 수동으로 바로 돌리고 싶을 때는 시트 상단 메뉴 `🎬 TWOONG 미디어 동기화 → 지금 새 작품 동기화 실행`을 누르시면 됩니다.)*

---

## 참고: 클라우드에서 인스타그램/유튜브가 가끔 막힐 때
- **방법 1 (클라우드 쿠키 등록)**: 브라우저에서 내보낸 `cookies.txt`를 Base64로 변환해 GitHub 저장소 **Settings → Secrets and variables → Actions → `YTDLP_COOKIES_B64`** 시크릿으로 등록하면 클라우드에서도 로그인 세션을 통해 안정적으로 내려받습니다.
- **방법 2 (내 PC 원클릭 백업)**: 즉시 내 PC IP로 추출·배포하고 싶을 때는 루트 폴더의 [`sync_portfolio_media.bat`](../sync_portfolio_media.bat)를 더블클릭하시면 바로 처리됩니다.
