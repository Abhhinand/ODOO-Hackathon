@echo off
echo ===================================================
echo   BRIGHTLOOP - Revenue in Motion
echo   Starting Backend (FastAPI) and Frontend (Vite)
echo ===================================================

start "Brightloop Backend (Port 8000)" cmd /k "cd backend && .\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "Brightloop Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo Backend running on http://localhost:8000 (Docs at /docs)
echo Frontend running on http://localhost:3000
echo.
