import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { KATEGORI } from '@/lib/constants';

export async function PATCH(req, { params }) {
  const s = await requireRole('admin');
  if (!s)
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { id } = await params;
  if (!/^\d+$/.test(String(id)) || Number(id) < 1)
    return NextResponse.json({ error: 'ID barang tidak valid' }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }
  if (!body || Object.keys(body).some((key) => !['nama', 'kategori', 'harga_beli', 'harga'].includes(key)))
    return NextResponse.json({ error: 'Stok hanya dapat diubah melalui pencatatan stok' }, { status: 400 });

  const fields = [];
  const values = [];
  if (Object.hasOwn(body, 'nama')) {
    if (typeof body.nama !== 'string' || !body.nama.trim() || body.nama.trim().length > 150)
      return NextResponse.json({ error: 'Nama barang tidak valid' }, { status: 400 });
    fields.push('nama = ?');
    values.push(body.nama.trim());
  }
  if (Object.hasOwn(body, 'kategori')) {
    if (!KATEGORI.includes(body.kategori))
      return NextResponse.json({ error: 'Kategori barang tidak valid' }, { status: 400 });
    fields.push('kategori = ?');
    values.push(body.kategori);
  }
  for (const field of ['harga_beli', 'harga']) {
    if (Object.hasOwn(body, field)) {
      if (!Number.isSafeInteger(body[field]) || body[field] < 0)
        return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 });
      fields.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  if (!fields.length)
    return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });

  values.push(Number(id));
  try {
    const [result] = await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    if (!result.affectedRows) {
      const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [Number(id)]);
      if (!rows.length) return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Barang diperbarui' });
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui barang' }, { status: 500 });
  }
}