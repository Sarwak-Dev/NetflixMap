@echo off
TITLE Proyecto Netflix - Script de Arranque
echo --- [SCRIPT DE ARRANQUE PROYECTO NETFLIX] ---

REM --- 1. Configurando y (re)instalando Backend ---
echo [INFO] Yendo a la carpeta 'backend'...
cd backend

REM Comprobar si venv existe, si no, crearlo
IF NOT EXIST "venv" (
    echo [SETUP] No se encontro 'venv'. Creando entorno virtual...
    python -m venv venv
    echo [SETUP] Entorno virtual creado.
)

REM Instalar/verificar dependencias (EL PASO CRUCIAL)
echo [SETUP] Instalando/verificando dependencias de 'requirements.txt'...
CALL .\venv\Scripts\pip.exe install -r requirements.txt

REM Volvemos a la carpeta raiz
cd ..

REM --- 2. Iniciando Servidores en Paralelo ---

echo [START] Iniciando servidor Backend (Flask) en una nueva ventana...
REM ¡ESTA ES LA CORRECCIÓN! Se usa /D "backend" para fijar el directorio de inicio.
START "Backend - Flask (Puerto 5000)" /D "backend" cmd /k "run_backend.bat"

echo [START] Iniciando servidor Frontend (HTTP) en una nueva ventana...
REM ¡ESTA ES LA CORRECCIÓN! Se usa /D "frontend" para fijar el directorio de inicio.
START "Frontend - HTTP (Puerto 8000)" /D "frontend" cmd /k "run_frontend.bat"

echo.
echo --- [SERVIDORES INICIADOS] ---
echo Deberias tener dos nuevas ventanas de terminal abiertas.
echo.
echo - Backend (Flask) corriendo en: http://127.0.0.1:5000
echo - Frontend (Sitio Web) corriendo en: http://127.0.0.1:8000
echo.
echo Esta ventana principal se cerrara en 10 segundos.
timeout /t 10