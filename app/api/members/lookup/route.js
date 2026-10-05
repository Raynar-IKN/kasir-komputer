import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

export async function GET(req) {
  const session = await requireRole('admin', 'kasir');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const telp = normalizePhone(new URL(req.url).searchParams.get('telp') || '');
  if (!telp) return NextResponse.json({ error: 'Nomor telepon tidak valid' }, { status: 400 });
  try {
    const [rows] = await pool.query(
      'SELECT id, kode_member, nama, no_telp FROM members WHERE no_telp = ?',
      [telp]
    );
    if (!rows.length) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Gagal mencari member' }, { status: 500 });
  }
}