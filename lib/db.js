import mysql from 'mysql2/promise';

const g = globalThis;

export const pool =
  g._pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true, // tanggal tampil sebagai string 'YYYY-MM-DD HH:MM:SS'
  });

if (process.env.NODE_ENV !== 'production') g._pool = pool;