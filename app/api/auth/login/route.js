import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();

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
}