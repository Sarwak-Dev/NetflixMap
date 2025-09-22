"use strict";
// backend/src/server.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const app = (0, express_1.default)();
const port = 4000;
const secret = 'mi_clave_secreta_jwt';
// --- MIDDLEWARE ---
// 1. Middleware a prueba de fallos para CORS.
// Este código añade los encabezados necesarios a CADA respuesta,
// garantizando que no haya errores de CORS en desarrollo.
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});
// 2. Middleware para procesar los cuerpos de las solicitudes en formato JSON.
app.use(express_1.default.json());
let shows = [];
let db;
// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, secret, (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.body.user = user;
        next();
    });
}
// Cargar los datos del CSV
const loadCSV = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, '../../data/dataset.csv');
        fs.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => shows.push(data))
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
    });
});
// --- Rutas de la API ---
app.get('/api/shows', (req, res) => {
    res.json(shows);
});
// Rutas de autenticación
app.post('/api/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const passwordHash = yield bcrypt_1.default.hash(password, 10);
    try {
        yield db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
        res.status(201).send('User registered successfully');
    }
    catch (error) {
        res.status(400).send('Username already exists');
    }
}));
app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
        return res.status(400).send('Invalid credentials');
    }
    const validPassword = yield bcrypt_1.default.compare(password, user.password_hash);
    if (!validPassword) {
        return res.status(400).send('Invalid credentials');
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, secret);
    res.json({ token });
}));
// Rutas para la lista de favoritos
app.get('/api/favorites', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const favorites = yield db.all('SELECT movie_title FROM favorites WHERE user_id = ?', [req.body.user.id]);
    res.json(favorites);
}));
app.post('/api/favorites', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { movieTitle } = req.body;
    try {
        yield db.run('INSERT INTO favorites (user_id, movie_title) VALUES (?, ?)', [req.body.user.id, movieTitle]);
        res.status(201).send('Favorite added');
    }
    catch (error) {
        res.status(400).send('Could not add favorite');
    }
}));
// Inicia el servidor
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield loadCSV();
        db = yield (0, db_1.getDb)();
        console.log(`Server listening at http://localhost:${port}`);
    }
    catch (error) {
        console.error('Failed to start server.');
        process.exit(1);
    }
}));
