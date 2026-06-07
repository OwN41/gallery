@echo off

echo Starting Gallery Application...

cd /d "%~dp0gallery"

call npm install --silent

echo Gallery Application starting on http://localhost:3000
echo Press Ctrl+C to stop the application

call npm run start

echo.
echo Press Enter to close
pause > nul