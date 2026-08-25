@echo off
title Vita Backend

cd /d "%~dp0"

:START
echo.
echo ==========================================
echo [%date% %time%] Iniciando Vita Backend...
echo ==========================================

node server.js

echo.
echo [%date% %time%] Backend detenido.
echo Reiniciando en 3 segundos...

for /l %%i in (3,-1,1) do (
    echo Reiniciando en %%i...
    timeout /t 1 /nobreak >nul
)

goto START