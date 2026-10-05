import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  const { product_id, tipe, jumlah, keterangan } = body || {};
  if (!Number.isSafeInteger(product_id) || product_id < 1 || !['masuk', 'keluar'].includes(tipe) ||
      !Number.isSafeInteger(jumlah) || jumlah < 1 ||
      (keterangan != null && (typeof keterangan !== 'string' || keterangan.length > 255)) ||
      (tipe === 'keluar' && (typeof keterangan !== 'string' || !keterangan.trim())))
    return NextResponse.json({ error: 'Data stok tidak valid' }, { status: 400 });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT id, stok FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!rows.length) {
      await conn.rollback();
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }
    const before = Number(rows[0].stok);
    const after = before + (tipe === 'masuk' ? jumlah : -jumlah);
    if (after < 0) {
      await conn.rollback();
      return NextResponse.json({ error: `Stok tidak cukup, sisa ${before}` }, { status: 400 });
    }
    await conn.query('UPDATE products SET stok = ? WHERE id = ?', [after, product_id]);
    await conn.query(
      `INSERT INTO stock_movements
       (product_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_id, tipe, jumlah, before, after, keterangan?.trim() || null, session.id]
    );
    await conn.commit();
    return NextResponse.json({ stok_sebelum: before, stok_sesudah: after }, { status: 201 });
  } catch {
    if (conn) await conn.rollback();
    return NextResponse.json({ error: 'Gagal memperbarui stok' }, { status: 500 });
  } finally {
    conn?.release();
  }
}