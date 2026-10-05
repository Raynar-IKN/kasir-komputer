import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { METODE } from '@/lib/constants';
import { pool } from '@/lib/db';
import { isValidDate, todayLocal } from '@/lib/utils';

export async function POST(req) {
  const session = await requireRole('kasir');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  if (!body || !Array.isArray(body.items) || body.items.length === 0)
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });

  const combined = new Map();
  for (const item of body.items) {
    if (!Number.isSafeInteger(item?.product_id) || item.product_id < 1 ||
        !Number.isSafeInteger(item.qty) || item.qty < 1)
      return NextResponse.json({ error: 'Barang atau jumlah tidak valid' }, { status: 400 });
    const qty = (combined.get(item.product_id) || 0) + item.qty;
    if (!Number.isSafeInteger(qty))
      return NextResponse.json({ error: 'Jumlah barang terlalu besar' }, { status: 400 });
    combined.set(item.product_id, qty);
  }

  const metode = body.metode_pembayaran ?? 'tunai';
  const memberId = body.member_id ?? null;
  if (!METODE.some((item) => item.value === metode))
    return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });
  if (memberId !== null && (!Number.isSafeInteger(memberId) || memberId < 1))
    return NextResponse.json({ error: 'Member tidak valid' }, { status: 400 });
  if (metode === 'tunai' && (!Number.isSafeInteger(body.bayar) || body.bayar < 0))
    return NextResponse.json({ error: 'Jumlah pembayaran tidak valid' }, { status: 400 });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    if (memberId !== null) {
      const [members] = await conn.query('SELECT id FROM members WHERE id = ?', [memberId]);
      if (!members.length) {
        await conn.rollback();
        return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
      }
    }

    const detail = [];
    let total = 0;
    for (const [productId, qty] of [...combined].sort(([a], [b]) => a - b)) {
      const [rows] = await conn.query(
        'SELECT id, nama, harga, harga_beli, stok FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      const product = rows[0];
      if (!product) {
        await conn.rollback();
        return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
      }
      const stok = Number(product.stok);
      if (stok < qty) {
        await conn.rollback();
        return NextResponse.json({ error: `Stok ${product.nama} tidak cukup (sisa ${stok})` }, { status: 400 });
      }
      const harga = Number(product.harga);
      const hargaBeli = Number(product.harga_beli);
      const subtotal = harga * qty;
      if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(total + subtotal)) {
        await conn.rollback();
        return NextResponse.json({ error: 'Total transaksi terlalu besar' }, { status: 400 });
      }
      total += subtotal;
      detail.push({ ...product, harga, harga_beli: hargaBeli, qty, subtotal, stok });
    }

    const bayar = metode === 'tunai' ? body.bayar : total;
    if (metode === 'tunai' && bayar < total) {
      await conn.rollback();
      return NextResponse.json({ error: 'Uang bayar kurang dari total' }, { status: 400 });
    }
    const kembalian = metode === 'tunai' ? bayar - total : 0;
    let kode = '';
    let insert;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      kode = `TRX${Date.now()}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
      try {
        [insert] = await conn.query(
          `INSERT INTO transactions
           (kode_transaksi, user_id, member_id, total, bayar, kembalian, metode_pembayaran, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'lunas')`,
          [kode, session.id, memberId, total, bayar, kembalian, metode]
        );
        break;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY' || attempt === 4) throw error;
      }
    }

    for (const item of detail) {
      const after = item.stok - item.qty;
      await conn.query(
        `INSERT INTO transaction_items
         (transaction_id, product_id, nama_produk, harga, harga_beli, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [insert.insertId, item.id, item.nama, item.harga, item.harga_beli, item.qty, item.subtotal]
      );
      await conn.query('UPDATE products SET stok = ? WHERE id = ?', [after, item.id]);
      await conn.query(
        `INSERT INTO stock_movements
         (product_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan, user_id, transaction_id)
         VALUES (?, 'keluar', ?, ?, ?, ?, ?, ?)`,
        [item.id, item.qty, item.stok, after, `Penjualan ${kode}`, session.id, insert.insertId]
      );
    }

    await conn.commit();
    return NextResponse.json({ id: insert.insertId, kode }, { status: 201 });
  } catch {
    if (conn) await conn.rollback();
    return NextResponse.json({ error: 'Gagal memproses transaksi' }, { status: 500 });
  } finally {
    conn?.release();
  }
}

export async function GET(req) {
  const session = await requireRole('admin', 'kasir');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || todayLocal();
  const to = searchParams.get('to') || todayLocal();
  const metode = searchParams.get('metode');
  const q = searchParams.get('q')?.trim() || '';
  if (q.length > 30)
    return NextResponse.json({ error: 'Kata pencarian terlalu panjang' }, { status: 400 });
  if (!isValidDate(from) || !isValidDate(to) || from > to ||
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 > 365)
    return NextResponse.json({ error: 'Rentang tanggal tidak valid' }, { status: 400 });
  if (metode && !METODE.some((item) => item.value === metode))
    return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });

  const conditions = ['DATE(t.created_at) BETWEEN ? AND ?'];
  const values = [from, to];
  if (metode) {
    conditions.push('t.metode_pembayaran = ?');
    values.push(metode);
  }
  if (q) {
    conditions.push('t.kode_transaksi LIKE ?');
    values.push(`%${q}%`);
  }
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.kode_transaksi, t.total, t.bayar, t.kembalian, t.created_at,
              t.metode_pembayaran, t.status, u.nama AS kasir, m.nama AS member_nama
       FROM transactions t JOIN users u ON u.id = t.user_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE ${conditions.join(' AND ')} ORDER BY t.created_at DESC, t.id DESC`,
      values
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
  }
}