@echo off
REM SwiftAID Frontend Quick Start Script for Windows

echo.
echo ====================================================
echo    SwiftAID - Emergency Response Dashboard
echo    Quick Start Installation
echo ====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo ✓ Python found

REM Navigate to frontend directory
cd /d "%~dp0"

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed

echo.
echo ====================================================
echo    Installation Complete!
echo ====================================================
echo.
echo IMPORTANT: Before running, ensure backend is started:
echo.
echo   1. Open new terminal
echo   2. Navigate to: ..\backend
echo   3. Run: python app.py
echo.
echo THEN come back to this terminal and press any key
echo to start the frontend server.
echo.
echo ====================================================
echo.
pause

echo.
echo Starting SwiftAID Frontend Server...
echo.
python app.py
