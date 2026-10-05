import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { firstDayOfMonthLocal, isValidDate, todayLocal } from '@/lib/utils';

export async function GET(req) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || firstDayOfMonthLocal();
  const to = searchParams.get('to') || todayLocal();
  const tipe = searchParams.get('tipe');
  const q = searchParams.get('q')?.trim() || '';
  if (q.length > 150)
    return NextResponse.json({ error: 'Kata pencarian terlalu panjang' }, { status: 400 });
  if (!isValidDate(from) || !isValidDate(to) || from > to ||
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 > 365)
    return NextResponse.json({ error: 'Rentang tanggal tidak valid' }, { status: 400 });
  if (tipe && !['baru', 'masuk', 'keluar'].includes(tipe))
    return NextResponse.json({ error: 'Tipe pergerakan tidak valid' }, { status: 400 });

  const conditions = ['DATE(sm.created_at) BETWEEN ? AND ?'];
  const values = [from, to];
  if (tipe) {
    conditions.push('sm.tipe = ?');
    values.push(tipe);
  }
  if (q) {
    conditions.push('(p.nama LIKE ? OR p.kode LIKE ?)');
    values.push(`%${q}%`, `%${q}%`);
  }
  const where = conditions.join(' AND ');
  try {
    const [rows] = await pool.query(
      `SELECT sm.*, p.kode, p.nama AS nama_produk, u.nama AS pengguna
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN users u ON u.id = sm.user_id
       WHERE ${where} ORDER BY sm.created_at DESC, sm.id DESC`,
      values
    );
    const [totals] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN sm.tipe = 'masuk' THEN sm.jumlah ELSE 0 END), 0) AS masuk,
         COALESCE(SUM(CASE WHEN sm.tipe = 'keluar' THEN sm.jumlah ELSE 0 END), 0) AS keluar,
         COALESCE(SUM(CASE WHEN sm.tipe = 'baru' THEN 1 ELSE 0 END), 0) AS baru
       FROM stock_movements sm JOIN products p ON p.id = sm.product_id WHERE ${where}`,
      values
    );
    const ringkasan = Object.fromEntries(Object.entries(totals[0]).map(([key, value]) => [key, Number(value)]));
    return NextResponse.json({ rows, ringkasan });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil riwayat stok' }, { status: 500 });
  }
}