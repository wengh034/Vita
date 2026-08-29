@echo off
setlocal EnableDelayedExpansion
title Vita Funnel Monitor

set FUNNEL_URL=https://desktop-5fmemtd.tailad2723.ts.net/api/health
set CHECK_INTERVAL=60
set MAX_FAILURES=3

echo.
echo ==========================================
echo        Vita Funnel Monitor
echo ==========================================
echo.

:WAIT_BACKEND

echo [%date% %time%] Comprobando backend local...

curl -s --max-time 5 http://127.0.0.1:3000/api/health >nul 2>&1

if errorlevel 1 (
    echo Backend no disponible. Reintentando en 5 segundos...
    timeout /t 5 /nobreak >nul
    goto WAIT_BACKEND
)

echo Backend local OK.
echo.

:CHECK

set /a FAILURES=0

echo [%date% %time%] Iniciando monitor de Funnel...

:MONITOR

echo.
echo [%date% %time%] Comprobando Funnel...

curl -s --max-time 10 "%FUNNEL_URL%" >nul 2>&1

if errorlevel 1 (

    set /a FAILURES+=1

    echo [ERROR] Funnel no responde.
    echo Fallo !FAILURES! de %MAX_FAILURES%.

    if !FAILURES! GEQ %MAX_FAILURES% (
        goto RECOVER
    )

) else (

    if !FAILURES!==0 (
        echo [OK] Funnel responde correctamente.
    ) else (
        echo [OK] Funnel recuperado.
    )

    set /a FAILURES=0
)

timeout /t %CHECK_INTERVAL% /nobreak >nul

goto MONITOR


:RECOVER

echo.
echo ==========================================
echo       RECUPERANDO FUNNEL
echo ==========================================
echo.

echo [%date% %time%] Apagando Funnel...

tailscale funnel off

timeout /t 2 /nobreak >nul

echo [%date% %time%] Levantando Funnel...

tailscale funnel --bg http://127.0.0.1:3000

echo.
echo [%date% %time%] Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo [%date% %time%] Verificando recuperacion...

curl -s --max-time 10 "%FUNNEL_URL%"

if errorlevel 1 (

    echo.
    echo [ERROR] Funnel sigue sin responder.
    echo Reintentando recuperacion en 10 segundos...

    timeout /t 10 /nobreak >nul

    goto RECOVER

)

echo.
echo.
echo [OK] Funnel recuperado correctamente.
echo.

goto CHECK