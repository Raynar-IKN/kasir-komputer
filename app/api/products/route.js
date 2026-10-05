import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { KATEGORI } from '@/lib/constants';

// Semua role yang login boleh melihat data barang
export async function GET() {
  const s = await requireRole('admin', 'kasir');
  if (!s) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY nama');
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data barang' }, { status: 500 });
  }
}

// Hanya admin yang boleh menambah barang
export async function POST(req) {
  const s = await requireRole('admin');
  if (!s)
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  const { kode, nama, kategori, harga_beli, harga, stok } = body || {};
    if (typeof kode !== 'string' || !kode.trim() || kode.trim().length > 30 ||
      typeof nama !== 'string' || !nama.trim() || nama.trim().length > 150 ||
      !KATEGORI.includes(kategori) || !Number.isSafeInteger(harga_beli) || harga_beli < 0 ||
      !Number.isSafeInteger(harga) || harga < 0 || !Number.isSafeInteger(stok) || stok < 0)
    return NextResponse.json({ error: 'Data barang tidak valid' }, { status: 400 });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [insert] = await conn.query(
      'INSERT INTO products (kode, nama, kategori, harga_beli, harga, stok) VALUES (?,?,?,?,?,?)',
      [kode.trim(), nama.trim(), kategori, harga_beli, harga, stok]
    );
    await conn.query(
      `INSERT INTO stock_movements
       (product_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan, user_id)
       VALUES (?, 'baru', ?, 0, ?, 'Barang baru', ?)`,
      [insert.insertId, stok, stok, s.id]
    );
    await conn.commit();
    return NextResponse.json({ message: 'Barang ditambahkan' }, { status: 201 });
  } catch (e) {
    if (conn) await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY')
      return NextResponse.json({ error: 'Kode barang sudah ada' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menambahkan barang' }, { status: 500 });
  } finally {
    conn?.release();
  }
}