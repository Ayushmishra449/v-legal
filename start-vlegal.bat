@echo off
title V-Legal Startup script
echo ===================================================
echo Welcome to V-Legal!
echo ===================================================
echo.

echo 1. Checking dependencies...
IF NOT EXIST "node_modules\dotenv" goto INSTALL_DOTENV
echo Dependencies are ready!
goto CHECK_ENV

:INSTALL_DOTENV
echo Installing required database package...
call npm install dotenv

:CHECK_ENV
echo.
echo 2. Checking database configuration...
IF NOT EXIST ".env" goto COPY_ENV

findstr /C:"ep-xxx" .env >nul
if errorlevel 1 goto DB_READY

:DB_WARN
echo ===================================================
echo [ACTION REQUIRED] DATABASE CONFIGURATION
echo ===================================================
echo Please ensure you have opened the ".env" file and
echo replaced the DATABASE_URL with your actual Neon PostgreSQL URL.
echo.
echo If the URL is fake, the next step (database push) will fail!
echo.
pause
goto RUN_DB_PUSH

:COPY_ENV
echo WARNING: .env file not found! Copying .env.example...
copy .env.example .env
echo Please open .env and set your DATABASE_URL, then run this script again.
pause
exit /b

:DB_READY
echo Database configuration seems ready!

echo.
echo ===================================================
echo Starting isolated local PostgreSQL server...
echo ===================================================
call "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D local-pg-data -o "-p 5435" -l local-pg.log start
timeout /t 2 /nobreak >nul

:RUN_DB_PUSH
echo.
echo 3. Syncing database schema...
call npx prisma db push
if %errorlevel% neq 0 (
  echo.
  echo ===================================================
  echo [ERROR] DATABASE CONNECTION OR SYNC FAILED!
  echo ===================================================
  echo Prisma could not reach the database server.
  echo Please check your DATABASE_URL in your ".env" file.
  echo.
  pause
  exit /b 1
)

echo.
echo 4. Seeding database...
call node prisma/seed.js
if %errorlevel% neq 0 (
  echo.
  echo ===================================================
  echo [ERROR] DATABASE SEEDING FAILED!
  echo ===================================================
  echo The database connected but could not create the Super Admin account.
  echo Please check your DATABASE_URL in your ".env" file.
  echo.
  pause
  exit /b 1
)

echo.
echo 5. Starting V-Legal server...
call npm run dev
