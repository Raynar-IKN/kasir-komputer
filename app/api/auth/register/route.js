import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';

export async function POST(req) {
  const { nama, username, password } = await req.json();

  if (!nama || !username || !password)
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });

  const [exist] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (exist.length)
    return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  // role SELALU 'kasir' agar orang tidak bisa mendaftar sebagai admin
  await pool.query(
    "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, 'kasir')",
    [nama, username, hash]
  );

  return NextResponse.json({ message: 'Registrasi berhasil' }, { status: 201 });
}