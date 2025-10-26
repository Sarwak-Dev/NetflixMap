# backend/src/app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os 

app = Flask(__name__)
CORS(app) 

# --- CONFIGURACIÓN DE LA RUTA DEL DATASET (¡Corregida!) ---
# 1. Obtiene la ruta del directorio actual (src)
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
# 2. Sube DOS niveles ('../..') para llegar a 'NetflixMap'
GRANDPARENT_DIR = os.path.join(BASE_DIR, '..', '..')
# 3. Baja a la carpeta 'data' y selecciona el archivo
# Asegúrate de usar 'dataset.csv' o el nombre real del archivo.
CSV_PATH = os.path.join(GRANDPARENT_DIR, 'data', 'dataset.csv')

# --- 1. Cargar y Preprocesar los Datos ---
try:
    # Usar la ruta dinámica
    df = pd.read_csv(CSV_PATH)
    df.fillna('', inplace=True) 
    print(f"Dataset cargado desde: {CSV_PATH}")
    print("Dataset de Netflix cargado y preprocesado exitosamente.")
except FileNotFoundError:
    print(f"Error: dataset.csv no encontrado en la ruta esperada: {CSV_PATH}")
    df = pd.DataFrame()

# --- ENDPOINT 1: Conteo Total de Contenido por País (Para el Mapa) ---
@app.route('/api/country-counts', methods=['GET'])
def get_country_content_counts():
    """Devuelve el conteo total de contenido por país."""
    if df.empty:
        return jsonify({"error": "Dataset no disponible"}), 500
    
    # Filtrar las filas con países listados y separar las cadenas de países
    countries_data = df[df['country'] != '']
    
    # Dividir las cadenas por país, apilar y contar las ocurrencias
    country_counts = countries_data['country'].str.split(', ', expand=True).stack()
    country_data = country_counts.value_counts().reset_index()
    
    # Renombrar columnas para la respuesta JSON
    country_data.columns = ['country', 'count']
    
    # Convertir a lista de diccionarios
    return jsonify(country_data.to_dict(orient='records'))

# --- ENDPOINT 2: Obtener Títulos por País Específico (Para la Lista de Detalles) ---
@app.route('/api/titles-by-country', methods=['GET'])
def get_titles_by_country():
    """Devuelve la lista de títulos para un país específico."""
    
    # Obtener el parámetro 'country' de la URL (ej: /api/titles-by-country?country=Spain)
    target_country = request.args.get('country')
    
    if not target_country:
        return jsonify({"error": "Parámetro 'country' requerido."}), 400
    
    if df.empty:
        return jsonify({"error": "Dataset no disponible"}), 500

    # Filtrar el DataFrame donde la columna 'country' contenga el país objetivo
    titles_list = df[df['country'].str.contains(target_country, regex=False)]
    
    # Seleccionar solo las columnas necesarias para la lista de detalles
    # 'title', 'type', 'release_year', 'rating'
    result = titles_list[['title', 'type', 'release_year', 'rating']].to_dict(orient='records')
    
    return jsonify(result)

# --- EJECUCIÓN DEL SERVIDOR ---
if __name__ == '__main__':
    # Ejecuta la app en el puerto 5000 (ideal para desarrollo local)
    app.run(debug=True, port=5000)