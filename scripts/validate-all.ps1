# Validation Script — Local CI Emulation
# ========================================

Write-Host "🚀 Starting Local CI Validation..." -ForegroundColor Cyan

# 1. Unit & Integration Tests
Write-Host "`n[1/3] Running Vitest..." -ForegroundColor Yellow
npm run test
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Vitest failed!" -ForegroundColor Red; exit 1 }

# 2. E2E & API Tests
Write-Host "`n[2/3] Running Playwright (E2E + API)..." -ForegroundColor Yellow
# Playwright will automatically start Vite and Mock API as configured in playwright.config.ts
npx playwright test
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Playwright failed!" -ForegroundColor Red; exit 1 }

# 3. Performance Tests
Write-Host "`n[3/3] Running k6 Performance Test..." -ForegroundColor Yellow
# We need the mock server for k6. Since Playwright just stopped it, we start it again.
$MockProcess = Start-Process node -ArgumentList "tests/api/mock-server.cjs" -PassThru -NoNewWindow
Start-Sleep -Seconds 2
k6 run tests/performance/stock-load-test.js
Stop-Process -Id $MockProcess.Id

Write-Host "`n✅ All tests passed! Ready for push." -ForegroundColor Green
