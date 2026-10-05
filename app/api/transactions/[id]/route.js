import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(_req, { params }) {
  const s = await requireRole('admin', 'kasir');
  if (!s)
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { id } = await params;
  if (!/^\d+$/.test(String(id)) || Number(id) < 1)
    return NextResponse.json({ error: 'ID transaksi tidak valid' }, { status: 400 });

  try {
    const [transactions] = await pool.query(
      `SELECT t.*, u.nama AS kasir, m.nama AS member_nama, m.no_telp AS member_telp,
              m.kode_member
       FROM transactions t JOIN users u ON u.id = t.user_id
       LEFT JOIN members m ON m.id = t.member_id WHERE t.id = ?`,
      [Number(id)]
    );
    if (!transactions.length)
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    const [items] = await pool.query(
      'SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id',
      [Number(id)]
    );
    return NextResponse.json({ ...transactions[0], items });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil detail transaksi' }, { status: 500 });
  }
}