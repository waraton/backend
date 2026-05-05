@echo off
echo ================================
echo Waraton Backend Setup Script
echo ================================
echo.

REM Check if Node.js and npm are installed
echo Checking for Node.js and npm...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install Node.js from https://nodejs.org/
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm is not installed. Please install npm.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo Node.js %NODE_VERSION% found
echo npm %NPM_VERSION% found
echo.

REM Install dependencies
echo Installing project dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Dependencies installed successfully!
    echo.
    echo ================================
    echo Setup Complete!
    echo ================================
    echo.
    echo Next steps:
    echo 1. Create a .env file with your environment variables
    echo 2. Run 'npm run dev' to start the development server
    echo.
) else (
    echo X Failed to install dependencies
    exit /b 1
)
