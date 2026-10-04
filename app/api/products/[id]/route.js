import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  const s = await getSession();
  if (!s || s.role !== 'admin')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { id } = await params;
  const { stok, harga } = await req.json();

  if (!Number.isInteger(stok) || stok < 0 || !Number.isInteger(harga) || harga < 0)
    return NextResponse.json({ error: 'Stok/harga tidak valid' }, { status: 400 });

  await pool.query('UPDATE products SET stok = ?, harga = ? WHERE id = ?', [stok, harga, id]);
  return NextResponse.json({ message: 'Barang diperbarui' });
}