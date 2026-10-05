import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!username) {
  throw new Error('ADMIN_USERNAME wajib diisi.');
}
if (typeof password !== 'string' || password.length < 8) {
  throw new Error('ADMIN_PASSWORD wajib diisi dan minimal 8 karakter.');
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const hash = await bcrypt.hash(password, 10);

  await conn.query(
    `INSERT INTO users (nama, username, password, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    ['Administrator', username, hash]
  );
} finally {
  await conn.end();
}