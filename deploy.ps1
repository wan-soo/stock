Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  AI 시대 미국 주식 예측 플랫폼 - GitHub 배포 도구" -ForegroundColor Cyan
Write-Host "========================================================"
Write-Host ""
Write-Host "원격 저장소 (https://github.com/wan-soo/stock.git)로 Push합니다..." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host " [성공] GitHub에 최신 버전이 성공적으로 업로드되었습니다!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "라이브 웹사이트: https://wan-soo.github.io/stock/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[안내] GitHub 로그인 인증이 필요할 수 있습니다." -ForegroundColor Red
}

Write-Host ""
Read-Host "종료하려면 아무 키나 누르십시오..."
