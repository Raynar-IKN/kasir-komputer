import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function PATCH(req, { params }) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { id } = await params;
  if (!/^\d+$/.test(String(id)) || Number(id) < 1)
    return NextResponse.json({ error: 'ID member tidak valid' }, { status: 400 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  const nama = typeof body?.nama === 'string' ? body.nama.trim() : '';
  const noTelp = normalizePhone(body?.no_telp);
  if (!nama || nama.length > 100 || !noTelp ||
      Object.keys(body || {}).some((key) => !['nama', 'no_telp'].includes(key)))
    return NextResponse.json({ error: 'Nama atau nomor telepon tidak valid' }, { status: 400 });

  try {
    const [result] = await pool.query(
      'UPDATE members SET nama = ?, no_telp = ? WHERE id = ?',
      [nama, noTelp, Number(id)]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.query('SELECT id FROM members WHERE id = ?', [Number(id)]);
      if (!rows.length) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Data member diperbarui' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return NextResponse.json({ error: 'Nomor telepon sudah terdaftar' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal memperbarui member' }, { status: 500 });
  }
}