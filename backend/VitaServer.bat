@echo off
title Vita Backend

cd /d "%~dp0"

:START
echo [%date% %time%] Iniciando Vita Backend...

node server.js

echo.
echo [%date% %time%] Backend detenido.
echo Reiniciando en 5 segundos...

timeout /t 5 /nobreak >nul
goto START