@echo off

set "DB=C:\Users\wengh\Desktop\Cursillo\vita\vita\backend\vita.db"
set "BACKUP_DIR=C:\Users\wengh\Desktop\Cursillo\vita\vita\backups"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=1-3 delims=/" %%a in ("%date%") do set "DATE=%%c-%%b-%%a"
set "TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%"
set "TIME=%TIME: =0%"

set "BACKUP=%BACKUP_DIR%\vita_%DATE%_%TIME%.db"

echo Creando backup...
sqlite3 "%DB%" ".backup '%BACKUP%'"

if %ERRORLEVEL% EQU 0 (
    echo Backup creado correctamente:
    echo %BACKUP%
) else (
    echo ERROR: no se pudo crear el backup.
)
