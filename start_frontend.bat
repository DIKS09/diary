@echo off
echo Starting Frontend Server...
echo.

echo Installing dependencies if needed...
call npm install

echo.
echo Starting React development server...
npm start

pause

