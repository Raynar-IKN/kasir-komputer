import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function GET(req) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (q.length > 150)
    return NextResponse.json({ error: 'Kata pencarian terlalu panjang' }, { status: 400 });
  try {
    const values = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];
    const [rows] = await pool.query(
      `SELECT id, kode_member, nama, no_telp, created_at FROM members
       ${q ? 'WHERE nama LIKE ? OR no_telp LIKE ? OR kode_member LIKE ?' : ''}
       ORDER BY nama`,
      values
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data member' }, { status: 500 });
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
  const noTelp = normalizePhone(body?.no_telp);
  if (!nama || nama.length > 100 || !noTelp)
    return NextResponse.json({ error: 'Nama atau nomor telepon tidak valid' }, { status: 400 });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const temporaryCode = `TMP${randomBytes(8).toString('hex')}`;
    const [insert] = await conn.query(
      'INSERT INTO members (kode_member, nama, no_telp) VALUES (?, ?, ?)',
      [temporaryCode, nama, noTelp]
    );
    const kodeMember = `MBR${String(insert.insertId).padStart(4, '0')}`;
    await conn.query('UPDATE members SET kode_member = ? WHERE id = ?', [kodeMember, insert.insertId]);
    await conn.commit();
    return NextResponse.json({ id: insert.insertId, kode_member: kodeMember, nama, no_telp: noTelp }, { status: 201 });
  } catch (error) {
    if (conn) await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY')
      return NextResponse.json({ error: 'Nomor telepon sudah terdaftar' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menambahkan member' }, { status: 500 });
  } finally {
    conn?.release();
  }
}