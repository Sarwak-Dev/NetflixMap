// backend/src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { Database } from 'sqlite';

const app = express();
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
app.use(express.json());

interface Show {
  show_id: string;
  title: string;
  director: string;
  country: string;
  // ... resto de las propiedades
}

let shows: Show[] = [];
let db: Database;

// Middleware de autenticación
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.body.user = user;
    next();
  });
}

// Cargar los datos del CSV
const loadCSV = async () => {
  return new Promise<void>((resolve, reject) => {
    const filePath = path.join(__dirname, '../../data/dataset.csv');
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: Show) => shows.push(data))
      .on('end', () => resolve())
      .on('error', (error) => reject(error));
  });
};

// --- Rutas de la API ---
app.get('/api/shows', (req: Request, res: Response) => {
  res.json(shows);
});

// Rutas de autenticación
app.post('/api/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('Username already exists');
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) {
    return res.status(400).send('Invalid credentials');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(400).send('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id, username: user.username }, secret);
  res.json({ token });
});

// Rutas para la lista de favoritos
app.get('/api/favorites', authenticateToken, async (req: Request, res: Response) => {
  const favorites = await db.all('SELECT movie_title FROM favorites WHERE user_id = ?', [req.body.user.id]);
  res.json(favorites);
});

app.post('/api/favorites', authenticateToken, async (req: Request, res: Response) => {
  const { movieTitle } = req.body;
  try {
    await db.run('INSERT INTO favorites (user_id, movie_title) VALUES (?, ?)', [req.body.user.id, movieTitle]);
    res.status(201).send('Favorite added');
  } catch (error) {
    res.status(400).send('Could not add favorite');
  }
});

// Inicia el servidor
app.listen(port, async () => {
  try {
    await loadCSV();
    db = await getDb();
    console.log(`Server listening at http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start server.');
    process.exit(1);
  }
});