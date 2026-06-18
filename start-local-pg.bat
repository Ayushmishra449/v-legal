@echo off
echo Starting local Postgres instance for V-Legal...
set PG_BIN="C:\Program Files\PostgreSQL\18\bin"

IF NOT EXIST "local-pg-data" (
    echo Initializing database cluster...
    %PG_BIN%\initdb.exe -D local-pg-data -U postgres --auth=trust
)

echo Starting Postgres server on port 5435...
%PG_BIN%\pg_ctl.exe -D local-pg-data -o "-p 5435" -l local-pg.log start

echo Waiting for database to start...
timeout /t 3 /nobreak

echo Creating v-legal database...
%PG_BIN%\createdb.exe -p 5435 -U postgres v-legal 2>nul

echo Local database is ready!
