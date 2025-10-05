/**
 * server.js — API Express (Node) para NOVATech
 * -----------------------------------------------------------
 * Este archivo expone endpoints para:
 * - Registro de usuario   (POST /api/auth/registro)
 * - Inicio de sesión      (POST /api/auth/ingreso)
 * - Historial de órdenes  (GET  /api/ordenes?usuario=<correo>)
 *
 * Notas:
 * - Seguridad: se usa bcrypt para hash de contraseñas y JWT para sesión.
 * - DB: MySQL (ver db.js). Las tablas esperadas: usuario, servicio, orden.
 * - Frontend: puede servirse estático desde /public (ver app.use(express.static...)).
 * - CORS: si sirves front y API en el mismo dominio, puedes desactivar CORS.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga .env (si tu plataforma ya inyecta variables, esto no estorba)
dotenv.config({ path: path.join(__dirname, '.env') });

// Logs de errores globales para depurar sin que el proceso “muera en silencio”
process.on('unhandledRejection', (err) => console.error('UNHANDLED REJECTION:', err));
process.on('uncaughtException', (err) => console.error('UNCAUGHT EXCEPTION:', err));

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js'; // Pool de MySQL (mysql2/promise)

// --- Config Express / CORS ---
const app = express();

// Si tu frontend vive en el mismo dominio, deja origins = undefined (se desactiva CORS estricto)
const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : undefined;

app.use(cors(origins ? { origin: origins } : undefined));
app.use(express.json());

// (Opcional) servir el frontend estático desde /public 

app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck simple para plataformas de despliegue
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Log de entorno básico ---
console.log('ENV:', {
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_DB: process.env.MYSQL_DATABASE,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET ? 'OK' : 'MISSING',
});

// --- Probar conexión a MySQL al arrancar ---
try {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('MySQL: conexión OK');
} catch (e) {
  console.error('MySQL ERROR (revisa .env y la base de datos):', e);
}

// --- Helpers de la API ---

/**
 * Firma un JWT con expiración de 2h.
 * Payload mínimo: { id, correo, rol }
 * - JWT_SECRET debe existir en .env
 */
function firmarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
}

/**
 * Convierte centavos (INT) a número decimal.
 * - En la DB guardamos dinero como enteros (centavos) para evitar errores binarios.
 */
function aMoneda(cent) {
  return Number((cent / 100).toFixed(2));
}

// =====================================================
// ================  ENDPOINTS PÚBLICOS  ===============
// =====================================================

/**
 * POST /api/auth/registro
 * Crea un usuario nuevo.
 *
 * body: { nombre, correo, clave }
 * - Valida requeridos
 * - Verifica que el correo no exista (case-insensitive)
 * - Hashea la clave con bcrypt
 * - Inserta y devuelve { token, usuario }
 *
 * Respuestas:
 * 201 OK: { token, usuario: { id, nombre, correo, rol } }
 * 400 Bad Request: campos faltantes
 * 409 Conflict: correo ya registrado
 * 500 Server Error
 */
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre = '', correo = '', clave = '' } = req.body || {};
    if (!nombre || !correo || !clave) {
      return res.status(400).json({ error: 'nombre, correo y clave son obligatorios' });
    }

    // ¿Existe ya el correo?
    const [existe] = await pool.query(
      'SELECT id FROM usuario WHERE LOWER(correo)=LOWER(?) LIMIT 1',
      [correo]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Hash seguro de la clave (bcrypt con salt; 10 es un buen costo por defecto)
    const hash = await bcrypt.hash(clave, 10);

    // Insert y respuesta
    const [result] = await pool.query(
      'INSERT INTO usuario (nombre, correo, clave_hash) VALUES (?,?,?)',
      [nombre, correo.toLowerCase(), hash]
    );

    const token = firmarToken({ id: result.insertId, correo: correo.toLowerCase(), rol: 'usuario' });

    res.status(201).json({
      token,
      usuario: { id: result.insertId, nombre, correo: correo.toLowerCase(), rol: 'usuario' }
    });
  } catch (e) {
    console.error('REGISTRO ERROR:', e);
    res.status(500).json({ error: 'Error en el registro' });
  }
});

/**
 * POST /api/auth/ingreso
 * Inicia sesión (login).
 *
 * body: { correo, clave }
 * - Busca el usuario por correo (case-insensitive)
 * - Compara la clave con bcrypt.compare
 * - Devuelve { token, usuario }
 *
 * Respuestas:
 * 200 OK: { token, usuario }
 * 400 Bad Request: campos faltantes
 * 401 Unauthorized: credenciales inválidas
 * 500 Server Error
 */
app.post('/api/auth/ingreso', async (req, res) => {
  try {
    const { correo = '', clave = '' } = req.body || {};
    if (!correo || !clave) {
      return res.status(400).json({ error: 'correo y clave son obligatorios' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM usuario WHERE LOWER(correo)=LOWER(?) LIMIT 1',
      [correo]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const u = rows[0];

    // Compara hash de bcrypt
    const ok = await bcrypt.compare(clave, u.clave_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Firma JWT
    const token = firmarToken({ id: u.id, correo: u.correo, rol: 'usuario' });

    res.json({
      token,
      usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: 'usuario' }
    });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * GET /api/ordenes?usuario=<correo>
 * Devuelve el historial de órdenes del usuario (solo lectura).
 *
 * query:
 * - usuario: correo del usuario (obligatorio)
 *
 * Respuesta (200 OK):
 * [
 *   { id, servicio, cantidad, total, estado, creado_en },
 *   ...
 * ]
 *
 * Notas:
 * - Convierte total_cent (INT) a decimal para mostrar en el frontend.
 * - En producción podrías proteger este endpoint con JWT y roles.
 */
app.get('/api/ordenes', async (req, res) => {
  try {
    const correo = String(req.query.usuario || '').toLowerCase();
    if (!correo) {
      return res.status(400).json({ error: 'Falta el parámetro usuario' });
    }

    // Busca el id del usuario por correo
    const [us] = await pool.query(
      'SELECT id FROM usuario WHERE LOWER(correo)=LOWER(?) LIMIT 1',
      [correo]
    );
    if (us.length === 0) {
      // Sin registros: devuelve array vacío (no error)
      return res.json([]);
    }

    const usuarioId = us[0].id;

    // Une órdenes con el catálogo de servicios
    const [rows] = await pool.query(
      `SELECT o.id,
              s.nombre AS servicio,
              o.cantidad,
              o.total_cent,
              o.estado,
              o.creado_en
         FROM orden o
         JOIN servicio s ON s.id = o.servicio_id
        WHERE o.usuario_id = ?
        ORDER BY o.creado_en DESC`,
      [usuarioId]
    );

    // Mapea a formato “bonito” para el front
    const data = rows.map(r => ({
      id: r.id,
      servicio: r.servicio,
      cantidad: r.cantidad,
      total: aMoneda(r.total_cent),
      estado: r.estado,
      creado_en: r.creado_en
    }));

    res.json(data);
  } catch (e) {
    console.error('ORDENES ERROR:', e);
    res.status(500).json({ error: 'Error consultando órdenes' });
  }
});

// =====================================================
// ============  HANDLERS DE ERRORES / 404  ============
// =====================================================

// 404 genérico para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

// (Opcional) Middleware de error centralizado
// app.use((err, req, res, next) => {
//   console.error('ERROR:', err);
//   res.status(500).json({ error: 'Error interno' });
// });

// =====================================================
// ====================  BOOT SERVER  ==================
// =====================================================

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API levantada en http://localhost:${port}`);
  console.log(`Frontend (si usas /public) disponible en /`);
});
