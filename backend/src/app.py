from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

# --- 1. NUEVAS IMPORTACIONES PARA AUTH ---
from flask_sqlalchemy import SQLAlchemy      # ORM (POO) para la base de datos
from flask_bcrypt import Bcrypt            # Hashing de contraseñas
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

# --- 2. CONFIGURACIÓN DE RUTAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GRANDPARENT_DIR = os.path.join(BASE_DIR, '..', '..')
CSV_PATH = os.path.join(GRANDPARENT_DIR, 'data', 'dataset.csv')
# Nueva ruta para nuestra base de datos SQLite
DB_PATH = os.path.join(BASE_DIR, 'database.db') 

# --- 3. INICIALIZACIÓN DE FLASK Y EXTENSIONES ---
app = Flask(__name__)
CORS(app)

# Configuración de la Base de Datos SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Configuración de JWT (¡cambia esto en producción!)
app.config['JWT_SECRET_KEY'] = 'mi-clave-secreta-para-paradigmas-123' 

db = SQLAlchemy(app)      # Instancia del ORM
bcrypt = Bcrypt(app)      # Instancia de Bcrypt
jwt = JWTManager(app)     # Instancia de JWT

# --- 4. MODELO DE BASE DE DATOS (¡EL NÚCLEO DE POO!) ---
# Esta clase 'User' es un modelo (POO) que SQLAlchemy
# "mapea" a una tabla en la base de datos SQLite.
class User(db.Model):
    __tablename__ = 'user' # Nombre de la tabla
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False) # NUNCA guardamos la contraseña en texto plano

    # --- Métodos de la Clase (POO) ---
    
    def set_password(self, password):
        """
        (POO) Método de instancia.
        Toma una contraseña en texto plano, la "hashea" con bcrypt
        y la guarda en el atributo 'password_hash' del objeto.
        """
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """
        (POO) Método de instancia.
        Compara una contraseña en texto plano con el hash
        guardado en la base de datos para este usuario.
        """
        return bcrypt.check_password_hash(self.password_hash, password)

# --- 5. PARADIGMA FUNCIONAL (Funciones Puras) ---
def procesar_conteo_paises(df: pd.DataFrame) -> pd.DataFrame:
    countries_data = df[df['country'] != '']
    country_counts = countries_data['country'].str.split(', ', expand=True).stack()
    country_data = country_counts.value_counts().reset_index()
    country_data.columns = ['country', 'count']
    return country_data

def filtrar_titulos_por_pais(df: pd.DataFrame, target_country: str) -> pd.DataFrame:
    if not target_country:
        return pd.DataFrame()
    titles_list = df[df['country'].str.contains(target_country, regex=False)]
    result_df = titles_list[['title', 'type', 'release_year', 'rating']]
    return result_df

# --- ¡NUEVA FUNCIÓN PURA (PARADIGMA FUNCIONAL)! ---
def procesar_conteo_por_tipo(df: pd.DataFrame) -> pd.DataFrame:
    """
    (Funcional) Función pura que cuenta el contenido por tipo (Movie/TV Show).
    No modifica el 'df' original, solo lo lee y devuelve un nuevo DataFrame.
    """
    type_counts = df['type'].value_counts().reset_index()
    type_counts.columns = ['type', 'count']
    return type_counts
# --- FIN DE LA NUEVA FUNCIÓN ---


# --- 6. SERVICIO DE DATOS NETFLIX (POO) ---
class NetflixDataService:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = self._load_data() # (POO) Encapsulación, carga al iniciar

    def _load_data(self) -> pd.DataFrame:
        try:
            df = pd.read_csv(self.csv_path)
            df.fillna('', inplace=True)
            print(f"Dataset cargado desde: {self.csv_path}")
            return df
        except FileNotFoundError:
            print(f"Error: dataset.csv no encontrado en: {self.csv_path}")
            return pd.DataFrame()

    def is_ready(self) -> bool:
        return not self.df.empty

    def get_country_counts(self) -> pd.DataFrame:
        """(POO) Llama a la función pura para obtener conteo por país."""
        return procesar_conteo_paises(self.df)

    def get_titles_by_country(self, country: str) -> pd.DataFrame:
        """(POO) Llama a la función pura para obtener títulos por país."""
        return filtrar_titulos_por_pais(self.df, country)

    # --- ¡NUEVO MÉTODO (POO) QUE USA LA FUNCIÓN FUNCIONAL! ---
    def get_type_counts(self) -> pd.DataFrame:
        """(POO) Llama a la función pura para obtener conteo por tipo."""
        return procesar_conteo_por_tipo(self.df)
    # --- FIN DEL NUEVO MÉTODO ---

# Instanciamos el servicio de Netflix (POO)
data_service = NetflixDataService(CSV_PATH)

# --- 7. RUTAS/ENDPOINTS DE AUTENTICACIÓN ---

@app.route('/api/register', methods=['POST'])
def register():
    """Endpoint para registrar un nuevo usuario."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Usuario y contraseña requeridos"}), 400

    # Usamos la clase User (POO) para consultar la DB
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "El nombre de usuario ya existe"}), 400

    # Creamos una nueva "instancia" del objeto User (POO)
    new_user = User(username=username)
    # Usamos el método de la instancia (POO) para setear el password
    new_user.set_password(password) 

    # SQLAlchemy (el ORM) traduce esto a comandos SQL
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"Usuario {username} registrado exitosamente"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint para iniciar sesión y obtener un token JWT."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Usuario y contraseña requeridos"}), 400

    # Buscamos al usuario en la base de datos
    user = User.query.filter_by(username=username).first()

    # Verificamos si el usuario existe Y
    # Usamos el método de la instancia (POO) para chequear la contraseña
    if user and user.check_password(password):
        # Si es correcto, creamos el "pase" (token JWT)
        # La "identidad" es lo que guardamos dentro del token (el username)
        access_token = create_access_token(identity=user.username)
        return jsonify(access_token=access_token), 200
    else:
        # Si el usuario no existe o la contraseña es incorrecta
        return jsonify({"error": "Usuario o contraseña incorrectos"}), 401


# --- 8. RUTAS/ENDPOINTS DE DATOS (¡Ahora protegidas!) ---

@app.route('/api/country-counts', methods=['GET'])
@jwt_required() # <-- ¡NUEVO! Esta línea protege el endpoint
def api_get_country_counts():
    """
    Devuelve el conteo total de contenido por país.
    Solo accesible si se envía un token JWT válido.
    """
    if not data_service.is_ready():
        return jsonify({"error": "Dataset no disponible"}), 500
    
    country_data = data_service.get_country_counts()
    return jsonify(country_data.to_dict(orient='records'))

@app.route('/api/titles-by-country', methods=['GET'])
@jwt_required() # <-- ¡NUEVO! Esta línea también protege el endpoint
def api_get_titles_by_country():
    """
    Devuelve la lista de títulos para un país específico.
    Solo accesible si se envía un token JWT válido.
    """
    target_country = request.args.get('country')
    
    if not target_country:
        return jsonify({"error": "Parámetro 'country' requerido."}), 400
    
    if not data_service.is_ready():
        return jsonify({"error": "Dataset no disponible"}), 500

    result = data_service.get_titles_by_country(target_country)
    return jsonify(result.to_dict(orient='records'))

# --- ¡NUEVO ENDPOINT PROTEGIDO! ---
@app.route('/api/type-counts', methods=['GET'])
@jwt_required() # <-- ¡Protegido!
def api_get_type_counts():
    """
    Devuelve el conteo total de contenido por tipo (Movie vs TV Show).
    Perfecto para la página de gráficos.
    """
    if not data_service.is_ready():
        return jsonify({"error": "Dataset no disponible"}), 500
    
    # (POO) El controlador llama al método del servicio
    type_data = data_service.get_type_counts() 
    return jsonify(type_data.to_dict(orient='records'))
# --- FIN DEL NUEVO ENDPOINT ---


# --- EJECUCIÓN DEL SERVIDOR ---
if __name__ == '__main__':
    # ¡NUEVO! Esto crea la base de datos y las tablas
    # (definidas en la clase POO 'User') si no existen.
    with app.app_context():
        db.create_all()
    
    app.run(debug=True, port=5000)