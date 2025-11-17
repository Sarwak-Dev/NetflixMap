@echo off
echo [BACKEND] Activando entorno virtual...
CALL .\venv\Scripts\activate.bat

echo [BACKEND] Entorno virtual activado.
echo [BACKEND] Entrando a la carpeta src...
cd src

echo [BACKEND] Ejecutando 'python app.py' (Flask)...
REM Ahora 'python' es el python del venv, porque LO ACABAMOS DE ACTIVAR
python app.py