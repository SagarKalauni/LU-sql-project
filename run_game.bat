@echo off
title Lindenwood University - The Missing Golden Lion SQL Mystery
cd /d "%~dp0"
echo ========================================================
echo   Launching The Missing Golden Lion SQL Mystery...
echo ========================================================
echo.
python serve.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python was not found in PATH or exited with an error.
    echo Trying to open index.html directly...
    start index.html
)
pause
