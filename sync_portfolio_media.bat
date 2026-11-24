@echo off
chcp 65001 >nul
echo.
echo [TWOONG STUDIO] 구글 시트 신규 작품 미디어 자동 동기화 및 배포를 시작합니다...
echo.
"C:\Users\BANG\AppData\Local\Programs\Python\Python312\python.exe" -X utf8 "%~dp0scripts\sync_portfolio_media.py" --deploy
set EXIT_CODE=%ERRORLEVEL%
echo.
if %EXIT_CODE% EQU 0 (
    echo [완료] 모든 신규 작품 썸네일, 미리보기, 스틸컷 동기화 및 반영이 정상 완료되었습니다.
) else (
    echo [오류] 동기화 중 문제가 발생했습니다. logs\media_sync.log 파일을 확인해 주세요.
)
echo.
pause
exit /b %EXIT_CODE%
