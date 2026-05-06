@echo off
title Spider - Credential Vault
cd /d "%~dp0"

:: Build the UI if dist/ doesn't exist yet
if not exist "dist\bundle.js" (
    echo Building Spider UI...
    call "%USERPROFILE%\.bun\bin\bun.exe" run build
    echo.
)

:: Start the server (production mode skips rebuild) and open browser
echo Starting Spider...
start "" "http://localhost:3000"
"%USERPROFILE%\.bun\bin\bun.exe" run src/server.ts data/output/spider.sqlite
