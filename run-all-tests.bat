@echo off
echo 🧪 Todo API Test Suite
echo ====================
echo.

echo 📋 Setting up test environment...
echo.

REM Check if test database exists, create if not
echo ⚙️  Setting up test database...
node scripts/setup-test-db.js
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to setup test database
    pause
    exit /b 1
)

echo.
echo 🏃‍♂️ Running test suites...
echo.

echo 1️⃣ Running Unit Tests...
echo -------------------------
call npm run test:unit
if %ERRORLEVEL% neq 0 (
    echo ❌ Unit tests failed
    pause
    exit /b 1
)

echo.
echo 2️⃣ Running Integration Tests...
echo --------------------------------
call npm run test:integration
if %ERRORLEVEL% neq 0 (
    echo ❌ Integration tests failed
    pause
    exit /b 1
)

echo.
echo 3️⃣ Running API Tests...
echo -----------------------
call npm run test:api
if %ERRORLEVEL% neq 0 (
    echo ❌ API tests failed
    pause
    exit /b 1
)

echo.
echo 📊 Generating Coverage Report...
echo --------------------------------
call npm run test:coverage
if %ERRORLEVEL% neq 0 (
    echo ❌ Coverage report generation failed
    pause
    exit /b 1
)

echo.
echo ✅ All tests completed successfully!
echo.
echo 📊 Test Coverage Report generated in './coverage' folder
echo 📖 Open './coverage/lcov-report/index.html' to view detailed coverage
echo.
echo 🎯 Test Summary:
echo - Unit Tests: ✅ Passed
echo - Integration Tests: ✅ Passed  
echo - API Tests: ✅ Passed
echo - Coverage Report: ✅ Generated
echo.
pause
