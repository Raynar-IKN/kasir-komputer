import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// PAYMENT
export async function POST(req) {
  const s = await getSession();
  if (!s || s.role !== 'kasir')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { items, bayar } = await req.json();
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    const detail = [];

    for (const it of items) {
      const qty = Number(it.qty);
      if (!Number.isInteger(qty) || qty < 1) throw new Error('Jumlah tidak valid');

      const [r] = await conn.query(
        'SELECT id, nama, harga, stok FROM products WHERE id = ? FOR UPDATE',
        [it.product_id]
      );
      const p = r[0];
      if (!p) throw new Error('Barang tidak ditemukan');
      if (p.stok < qty) throw new Error(`Stok ${p.nama} tidak cukup (sisa ${p.stok})`);

      const subtotal = p.harga * qty;
      total += subtotal;
      detail.push({ ...p, qty, subtotal });
    }

    if (!(Number(bayar) >= total)) throw new Error('Uang bayar kurang dari total');

    const kode = 'TRX' + Date.now();
    const kembalian = Number(bayar) - total;

    const [ins] = await conn.query(
      'INSERT INTO transactions (kode_transaksi, user_id, total, bayar, kembalian) VALUES (?,?,?,?,?)',
      [kode, s.id, total, Number(bayar), kembalian]
    );

    for (const d of detail) {
      await conn.query(
        `INSERT INTO transaction_items
         (transaction_id, product_id, nama_produk, harga, qty, subtotal)
         VALUES (?,?,?,?,?,?)`,
        [ins.insertId, d.id, d.nama, d.harga, d.qty, d.subtotal]
      );
      await conn.query('UPDATE products SET stok = stok - ? WHERE id = ?', [d.qty, d.id]);
    }

    await conn.commit();
    return NextResponse.json({ id: ins.insertId, kode }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    conn.release();
  }
}

// LAPORAN (filter tanggal)
export async function GET(req) {
  const s = await getSession();
  if (!s || s.role !== 'kasir')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = searchParams.get('from') || today;
  const to = searchParams.get('to') || today;

  const [rows] = await pool.query(
    `SELECT t.id, t.kode_transaksi, t.total, t.bayar, t.kembalian, t.created_at, u.nama AS kasir
     FROM transactions t JOIN users u ON u.id = t.user_id
     WHERE DATE(t.created_at) BETWEEN ? AND ?
     ORDER BY t.created_at DESC`,
    [from, to]
  );
  return NextResponse.json(rows);
}