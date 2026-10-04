import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_req, { params }) {
  const s = await getSession();
  if (!s || s.role !== 'kasir')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { id } = await params;

  const [t] = await pool.query(
    `SELECT t.*, u.nama AS kasir FROM transactions t
     JOIN users u ON u.id = t.user_id WHERE t.id = ?`,
    [id]
  );
  if (!t.length) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

  const [items] = await pool.query(
    'SELECT * FROM transaction_items WHERE transaction_id = ?',
    [id]
  );
  return NextResponse.json({ ...t[0], items });
}