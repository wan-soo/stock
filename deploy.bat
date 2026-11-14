@echo off
chcp 65001 > nul
echo ========================================================
echo   AI 시대 미국 주식 예측 플랫폼 - GitHub 배포 도구
echo ========================================================
echo.
echo 원격 저장소 (https://github.com/wan-soo/stock.git)로
echo 최신 커밋을 업로드(Push)합니다...
echo.

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [성공] GitHub에 최신 버전이 성공적으로 업로드되었습니다!
    echo ========================================================
    echo.
    echo 이제 브라우저에서 GitHub Pages를 활성화하실 수 있습니다:
    echo 1. https://github.com/wan-soo/stock/settings/pages 접속
    echo 2. Branch: main / root 선택 후 Save 클릭
    echo 3. 라이브 주소: https://wan-soo.github.io/stock/
    echo.
) else (
    echo.
    echo [안내] 브라우저 인증 창이 나타나면 본인의 GitHub 계정으로 권한을 승인해주세요.
    echo.
)

pause
