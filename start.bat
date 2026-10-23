@echo off
title curiousBuddy Launcher
echo ========================================================
echo   Launching curiousBuddy (Backend & Frontend)
echo ========================================================

set "ROOT_DIR=%~dp0"

:: Detect Python executable in backend venv
set "PYTHON_EXE=python"
if exist "%ROOT_DIR%backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%backend\venv\Scripts\python.exe"
) else if exist "%ROOT_DIR%backend\venv\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%backend\venv\python.exe"
)

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "curiousBuddy Backend" cmd /k "cd /d "%ROOT_DIR%backend" && "%PYTHON_EXE%" -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "curiousBuddy Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo   Both services are launched in separate command windows!
echo   - Backend API: http://127.0.0.1:8000
echo   - Frontend UI: http://localhost:5173
echo ========================================================
echo Close this window or press any key to exit launcher.
pause >nul
