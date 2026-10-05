import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt-secret';

export async function POST(req) {
  getJwtSecret();
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data login tidak valid' }, { status: 400 });
  }
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const { password } = body || {};
  if (!username || username.length > 50 || typeof password !== 'string' || password.length > 72)
    return NextResponse.json({ error: 'Username atau password tidak valid' }, { status: 400 });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password)))
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });

    const token = await signToken({ id: user.id, nama: user.nama, role: user.role });

    const res = NextResponse.json({ role: user.role });
    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Gagal memproses login' }, { status: 500 });
  }
}