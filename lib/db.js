import mysql from 'mysql2/promise';

const g = globalThis;
const connectionLimit = Number(process.env.DB_POOL_LIMIT || 5);

function createPool() {
  const nextPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+07:00',
    waitForConnections: true,
    connectionLimit,
    enableKeepAlive: true,
    connectTimeout: 10000,
    dateStrings: true, // tanggal tampil sebagai string 'YYYY-MM-DD HH:MM:SS'
  });

  nextPool.pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+07:00'");
  });
  return nextPool;
}

export const pool = g._pool ?? createPool();

if (process.env.NODE_ENV !== 'production') g._pool = pool;