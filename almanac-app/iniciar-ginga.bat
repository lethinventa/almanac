@echo off
title ginga.web
cd /d "%~dp0"
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3001"
npm run dev -- --port 3001
