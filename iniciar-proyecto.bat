@echo off
title Levantar Proyecto Docker - Pizzeria Don Nginx
cd /d "%~dp0\example"

echo =======================================================
echo   Levantando Contenedores (Frontend, BFF, Backend)
echo =======================================================
echo.
docker compose up --build -d

echo.
echo =======================================================
echo   Proyecto listo en: http://localhost:4200
echo =======================================================
echo Para ver los logs en tiempo real, ejecuta: docker compose logs -f
echo.
pause
