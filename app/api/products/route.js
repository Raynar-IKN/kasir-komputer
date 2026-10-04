import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Semua role yang login boleh melihat data barang
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

  const [rows] = await pool.query('SELECT * FROM products ORDER BY nama');
  return NextResponse.json(rows);
}

// Hanya admin yang boleh menambah barang
export async function POST(req) {
  const s = await getSession();
  if (!s || s.role !== 'admin')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { kode, nama, kategori, harga, stok } = await req.json();
  if (!kode || !nama || !kategori || !(harga >= 0) || !(stok >= 0))
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });

  try {
    await pool.query(
      'INSERT INTO products (kode, nama, kategori, harga, stok) VALUES (?,?,?,?,?)',
      [kode, nama, kategori, harga, stok]
    );
    return NextResponse.json({ message: 'Barang ditambahkan' }, { status: 201 });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return NextResponse.json({ error: 'Kode barang sudah ada' }, { status: 409 });
    throw e;
  }
}