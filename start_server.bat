@echo off
REM Servidor local offline para el minijuego (Windows).
REM No requiere Internet. Ejecutar este archivo y abrir http://localhost:8000

cd /d "%~dp0"

echo ============================================
echo  El desayuno no se toma vacaciones
echo  Servidor local en http://localhost:8000
echo  Presiona Ctrl+C para detener.
echo ============================================
echo.

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python -m http.server 8000
  goto :eof
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -m http.server 8000
  goto :eof
)

echo ERROR: No se encontro Python.
echo Instala Python o usa otro servidor local
echo apuntando a esta carpeta (puerto 8000).
pause
