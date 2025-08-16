@echo off
echo Starting MongoDB for D Dash Backend...
echo.

REM Check if MongoDB is already running
netstat -an | find "27017" > nul
if %errorlevel% equ 0 (
    echo MongoDB is already running on port 27017
    goto :end
)

REM Try to start MongoDB service
echo Attempting to start MongoDB service...
net start MongoDB > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB service started successfully
) else (
    echo ❌ Failed to start MongoDB service
    echo.
    echo Please ensure MongoDB is installed and configured properly.
    echo You can download MongoDB from: https://www.mongodb.com/try/download/community
    echo.
    echo Alternative: Use Docker to run MongoDB:
    echo docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
)

:end
echo.
echo Next steps:
echo 1. Create a .env file in the backend directory
echo 2. Run: npm install
echo 3. Run: npm run dev
echo.
pause
