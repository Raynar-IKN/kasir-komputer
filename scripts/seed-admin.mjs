import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const hash = await bcrypt.hash('admin123', 10);

await conn.query(
  `INSERT INTO users (nama, username, password, role)
   VALUES (?, ?, ?, 'admin')
   ON DUPLICATE KEY UPDATE password = VALUES(password)`,
  ['Administrator', 'admin', hash]
);

console.log('Admin dibuat -> username: admin | password: admin123');
await conn.end();