import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { isValidDate } from '@/lib/utils';

function datesBetween(from, to) {
  const [year, month, day] = from.split('-').map(Number);
  const [endYear, endMonth, endDay] = to.split('-').map(Number);
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  const current = new Date(Date.UTC(year, month - 1, day));
  const dates = [];
  while (current <= end) {
    dates.push([
      current.getUTCFullYear(),
      String(current.getUTCMonth() + 1).padStart(2, '0'),
      String(current.getUTCDate()).padStart(2, '0'),
    ].join('-'));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export async function GET(req) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!isValidDate(from) || !isValidDate(to) || from > to ||
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 > 365)
    return NextResponse.json({ error: 'Rentang tanggal tidak valid' }, { status: 400 });

  try {
    const [transactionTotals] = await pool.query(
      `SELECT COUNT(*) AS total_transaksi, COALESCE(SUM(total), 0) AS pendapatan_kotor
       FROM transactions WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?`,
      [from, to]
    );
    const [itemTotals] = await pool.query(
      `SELECT COALESCE(SUM(i.qty), 0) AS barang_terjual,
              COALESCE(SUM(i.harga_beli * i.qty), 0) AS modal
       FROM transaction_items i JOIN transactions t ON t.id = i.transaction_id
       WHERE t.status = 'lunas' AND DATE(t.created_at) BETWEEN ? AND ?`,
      [from, to]
    );
    const [dailyTransactions] = await pool.query(
      `SELECT DATE(created_at) AS tanggal,
              COUNT(*) AS transaksi, COALESCE(SUM(total), 0) AS pendapatan
       FROM transactions WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY DATE(created_at)`,
      [from, to]
    );
    const [dailyItems] = await pool.query(
      `SELECT DATE(t.created_at) AS tanggal,
              COALESCE(SUM(i.harga_beli * i.qty), 0) AS modal
       FROM transactions t JOIN transaction_items i ON i.transaction_id = t.id
       WHERE t.status = 'lunas' AND DATE(t.created_at) BETWEEN ? AND ?
       GROUP BY DATE(t.created_at)`,
      [from, to]
    );
    const [products] = await pool.query(
      `SELECT p.id AS product_id, p.nama, p.kategori,
              SUM(i.qty) AS qty, SUM(i.subtotal) AS pendapatan,
              SUM(i.harga_beli * i.qty) AS modal
       FROM transaction_items i JOIN transactions t ON t.id = i.transaction_id
       JOIN products p ON p.id = i.product_id
       WHERE t.status = 'lunas' AND DATE(t.created_at) BETWEEN ? AND ?
       GROUP BY p.id, p.nama, p.kategori ORDER BY qty DESC, p.nama`,
      [from, to]
    );
    const [methods] = await pool.query(
      `SELECT metode_pembayaran AS metode, COUNT(*) AS transaksi,
              COALESCE(SUM(total), 0) AS total
       FROM transactions WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY metode_pembayaran ORDER BY metode_pembayaran`,
      [from, to]
    );

    const dailyByDate = new Map(dailyTransactions.map((row) => [row.tanggal, row]));
    const modalByDate = new Map(dailyItems.map((row) => [row.tanggal, Number(row.modal)]));
    const harian = datesBetween(from, to).map((tanggal) => {
      const row = dailyByDate.get(tanggal);
      const pendapatan = Number(row?.pendapatan || 0);
      return {
        tanggal,
        transaksi: Number(row?.transaksi || 0),
        pendapatan,
        laba: pendapatan - (modalByDate.get(tanggal) || 0),
      };
    });
    const totalTransaksi = Number(transactionTotals[0].total_transaksi);
    const pendapatanKotor = Number(transactionTotals[0].pendapatan_kotor);
    const modal = Number(itemTotals[0].modal);
    return NextResponse.json({
      ringkasan: {
        total_transaksi: totalTransaksi,
        barang_terjual: Number(itemTotals[0].barang_terjual),
        pendapatan_kotor: pendapatanKotor,
        modal,
        pendapatan_bersih: pendapatanKotor - modal,
      },
      harian,
      produk: products.map((row) => {
        const pendapatan = Number(row.pendapatan);
        const modalProduk = Number(row.modal);
        return {
          product_id: Number(row.product_id),
          nama: row.nama,
          kategori: row.kategori,
          qty: Number(row.qty),
          pendapatan,
          modal: modalProduk,
          laba: pendapatan - modalProduk,
        };
      }),
      metode: methods.map((row) => ({
        metode: row.metode,
        transaksi: Number(row.transaksi),
        total: Number(row.total),
      })),
    });
  } catch (error) {
    console.error('[reports/sales]', error);
    return NextResponse.json({ error: 'Gagal membuat laporan penjualan' }, { status: 500 });
  }
}