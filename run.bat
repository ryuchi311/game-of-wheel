@echo off
setlocal
title Game of Wheel

cd /d "%~dp0"

echo ========================================================
echo               GAME OF WHEEL - LOCAL SERVER
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Set default port if not set
if "%PORT%"=="" (
    set PORT=3010
)

echo Starting server on http://localhost:%PORT% ...
echo Press Ctrl+C in this window to stop the server anytime.
echo.

:: Launch default web browser automatically after 1 second
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:%PORT%"

:: Run the Node.js server
node server.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly.
    pause
)
