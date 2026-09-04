@echo off
title Tunel en Vivo - Pizzeria Don Nginx
cd /d "%~dp0"

echo =======================================================
echo   Iniciando Tunel Publico en Vivo para la Clase
echo =======================================================
echo.

if not exist "cloudflared.exe" (
    echo [*] cloudflared.exe no encontrado.
    echo [*] Descargando automaticamente por unica vez...
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    if not exist "cloudflared.exe" (
        echo [!] Error al descargar cloudflared.exe. Revisa tu conexion.
        pause
        exit /b 1
    )
    echo [*] Descarga completada con exito.
    echo.
)

echo [*] Conectando con Cloudflare hacia http://localhost:4200...
echo [*] La URL publica (https://...trycloudflare.com) aparecera en segundos:
echo.
cloudflared.exe tunnel --url http://localhost:4200
pause
