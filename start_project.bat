@echo off
TITLE Proyecto Netflix - Script de Arranque

echo --- [SCRIPT DE ARRANQUE PROYECTO NETFLIX] ---

REM --- 1. Configurando y (re)instalando Backend ---
echo [INFO] Yendo a la carpeta 'backend'...
cd backend

REM Comprobar si venv existe, si no, crearlo (como en tus instrucciones)
IF NOT EXIST "venv" (
    echo [SETUP] No se encontro 'venv'. Creando entorno virtual...
    python -m venv venv
    echo [SETUP] Entorno virtual creado.
)

REM Instalar/verificar dependencias (como en tus instrucciones)
echo [SETUP] Instalando/verificando dependencias (esto es rapido si ya esta listo)...
REM Usamos CALL para asegurar que el script espere a que pip termine
CALL .\venv\Scripts\pip.exe install -r requirements.txt

REM --- 2. Iniciando Servidores en Paralelo ---

echo [START] Iniciando servidor Backend (Flask) en una nueva ventana...
REM 'START' abre una nueva ventana. 'cmd /k' la mantiene abierta para ver logs.
REM 'cd ..' no es necesario aqui porque 'START' abre un nuevo proceso
REM y volvemos al directorio raiz en la linea 46
REM ¡¡¡ ESTA ES LA LÍNEA CORREGIDA !!!
REM En lugar de 'activate' y 'python', llamamos al python.exe del venv directamente.
START "Backend - Flask (Puerto 5000)" cmd /k ".\venv\Scripts\python.exe src\app.py"

REM Volvemos a la carpeta raiz (NetflixMap/)
cd ..
REM ... (el resto del script está perfecto) ...
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