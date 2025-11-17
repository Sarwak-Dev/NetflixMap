# Dataflix
#### Un mapa interactivo para visualizar el catálogo global de Netflix y muestra las peliculas hechas en cada pais en el mapa.

https://www.kaggle.com/datasets/davidpbriggs/most-popular-netflix-shows
#### Link de los datos que se usan con el dataset

<br>
▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄  
<br>

## Comandos de inicio

### Opcion 1
#### Recomendamos ejecutar ```start_proyect.bat``` de la raiz del proyecto.

### Opcion 2
 #### En la carpeta `NetflixMap/backend` poner:
```bash
# 1. Iniciar entorno
python -m venv venv
.\venv\scripts\activate
# 2. Instalar dependencias
pip install -r requirements.txt
# 3. Iniciar el servidor
cd src
python app.py
```
#### En la carpeta `NetflixMap/frontend` poner:
```bash
# 1. Navega a la carpeta src/public
cd src/public
# 2. Inicia el servidor
python -m http.server 8000
```

<br>
▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄  
<br>

## Modo de Uso
#### Ve a la direccion http://127.0.0.1:8000/ ahi aparecera la pagina.
#### Para usar la pagina tienes que iniciar sesion y elegir si quieres ver el mapa o los graficos, en el mapa puedes elegir el pais que quieras y seleccionarlo para ver una lista de peliculas hechas en ese pais en orden alfabetico y puedes añadirla a tu lista de peliculas favoritas de tu cuenta.

<br>
▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄  
<br>

## Consideraciones
Detectamos un bug que no añade bien a favoritos.

###### 💻 | Development By Sarwak, Degoriv

