Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  BRIGHTLOOP - Revenue in Motion" -ForegroundColor Green
Write-Host "  Starting Backend (FastAPI) and Frontend (Vite)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Backend running on http://localhost:8000 (API Docs at http://localhost:8000/docs)" -ForegroundColor Yellow
Write-Host "Frontend running on http://localhost:3000" -ForegroundColor Green
Write-Host ""
