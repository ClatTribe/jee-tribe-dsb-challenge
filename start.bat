@echo off
echo Setting up JEE Tribe DSB Challenge...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install --ignore-scripts

if not exist .env.local (
    echo.
    echo WARNING: No .env.local found.
    echo Create one with your Gemini API key:
    echo echo GEMINI_API_KEY=your_key_here ^> .env.local
    echo Get your key from: https://aistudio.google.com/
    echo.
)

echo.
echo Starting the app...
npx vite --port 3000 --host
