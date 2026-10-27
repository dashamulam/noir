@echo off
setlocal
title NOIR Music
cd /d "%~dp0"

echo.
echo   NOIR - Less noise. More feeling.
echo.

where node >nul 2>nul
if errorlevel 1 goto missing_node
where npm >nul 2>nul
if errorlevel 1 goto missing_node

node -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major>22 || (major===22 && minor>=14) ? 0 : 1)"
if errorlevel 1 goto old_node

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto failed

echo.
echo [2/3] Building your music app...
call npm run build
if errorlevel 1 goto failed

echo.
echo [3/3] Starting NOIR. Your browser will open when it is ready.
echo Keep this window open while listening. Press Ctrl+C to stop.
echo.
set "NOIR_OPEN_BROWSER=1"
call npm start
if errorlevel 1 goto failed
exit /b 0

:missing_node
echo Node.js and npm are required to start NOIR.
echo Install the current LTS version from https://nodejs.org/
echo Then close this window and double-click START-NOIR.cmd again.
pause
exit /b 1

:old_node
echo Please upgrade Node.js to version 22.14 or newer.
echo Download the current LTS version from https://nodejs.org/
pause
exit /b 1

:failed
echo.
echo NOIR could not start. The error details are printed above.
echo Check your internet connection during installation.
echo If the port is already in use, stop the previous NOIR window
echo or choose another PORT in .env.
pause
exit /b 1
