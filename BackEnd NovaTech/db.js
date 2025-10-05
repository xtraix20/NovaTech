/**
 * db.js — Conexión a MySQL con mysql2/promise (pool)
 * -----------------------------------------------------------
 * - Crea un pool de conexiones reutilizable (mejor que client único).
 * - Lee variables desde .env (ver README para nombres).
 * - Exporta `pool` para usar en server.js
 *
 *
 */

import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,             // p.ej. localhost o el host del proveedor
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,             // usuario de la DB
  password: process.env.MYSQL_PASSWORD,     // contraseña de la DB
  database: process.env.MYSQL_DATABASE,     // base de datos (schema) a usar
  waitForConnections: true,                 // cola si no hay conexiones disponibles
  connectionLimit: 10,                      // ajusta según carga/plan de hosting
  queueLimit: 0                             // 0 = sin límite de cola
});

// Ejemplo de helper (opcional) para consultas con manejo simple de errores
// export async function run(sql, params = []) {
//   const [rows] = await pool.query(sql, params);
//   return rows;
// }






