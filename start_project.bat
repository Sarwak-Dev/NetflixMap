@echo off
TITLE Proyecto Netflix - Script de Arranque

echo --- [SCRIPT DE ARRANQUE PROYECTO NETFLIX] ---

echo [INFO] Yendo a la carpeta 'backend'...
cd backend

IF NOT EXIST "venv" (
    echo [SETUP] No se encontro 'venv'. Creando entorno virtual...
    python -m venv venv
    echo [SETUP] Entorno virtual creado.
)

echo [SETUP] Instalando/verificando dependencias (esto es rapido si ya esta listo)...
CALL .\venv\Scripts\pip.exe install -r requirements.txt

echo [START] Iniciando servidor Backend (Flask) en una nueva ventana...
START "Backend - Flask (Puerto 5000)" cmd /k ".\venv\Scripts\python.exe src\app.py"

cd ..
echo [START] Iniciando servidor Frontend (HTTP) en una nueva ventana...
START "Frontend - HTTP (Puerto 8000)" cmd /k "cd frontend\src\public & python -m http.server 8000"

echo.
echo --- [SERVIDORES INICIADOS] ---
echo Deberias tener dos nuevas ventanas de terminal abiertas.
echo.
echo - Backend (Flask) corriendo en: http://127.0.0.1:5000
echo - Frontend (Sitio Web) corriendo en: http://127.0.0.1:8000
echo.
echo [INFO] Esperando 3 segundos para que los servidores inicien...
timeout /t 3 /nobreak > NUL

echo [INFO] Abriendo http://127.0.0.1:8000 en tu navegador...
START http://127.0.0.1:8000

echo.
echo Esta ventana principal se cerrara en 7 segundos (10 total).
timeout /t 7