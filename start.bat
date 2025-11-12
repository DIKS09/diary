@echo off
echo Starting Diary Site Application...
echo.

REM Запуск MongoDB (если установлен как служба, он уже должен быть запущен)
echo Checking MongoDB...
net start MongoDB 2>nul
if %errorlevel% == 0 (
    echo MongoDB started successfully
) else (
    echo MongoDB is already running or not installed as service
)
echo.

REM Запуск Backend
echo Starting Backend Server...
start cmd /k "cd backend && python -m venv venv 2>nul & venv\Scripts\activate & pip install -r requirements.txt & python app.py"
timeout /t 3 /nobreak >nul
echo.

REM Запуск Frontend
echo Starting Frontend Server...
start cmd /k "npm install & npm start"
echo.

echo All servers are starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
echo.
pause

