import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  try {
    const [rows] = await pool.query(
      "SELECT id, nama, username, role, created_at FROM users WHERE role = 'kasir' ORDER BY nama"
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data kasir' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  const nama = typeof body?.nama === 'string' ? body.nama.trim() : '';
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const { password } = body || {};
  if (!nama || nama.length > 100 || !/^[a-z0-9_]{3,30}$/.test(username) ||
      typeof password !== 'string' || password.length < 6 || password.length > 72)
    return NextResponse.json({ error: 'Nama, username, atau password tidak valid' }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, 'kasir')",
      [nama, username, hash]
    );
    return NextResponse.json({ id: result.insertId, nama, username, role: 'kasir' }, { status: 201 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal membuat akun kasir' }, { status: 500 });
  }
}