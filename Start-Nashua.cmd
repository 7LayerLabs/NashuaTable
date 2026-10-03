@echo off
node "%~dp0scripts\launch.mjs"
if errorlevel 1 (
    pause
    exit /b 1
)
start "" "http://127.0.0.1:8770/"
