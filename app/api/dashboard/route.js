import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool } from '@/lib/db';
import { todayLocal } from '@/lib/utils';

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function GET() {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

  const hariIni = todayLocal();
  const kemarinDate = dateFromKey(hariIni);
  kemarinDate.setUTCDate(kemarinDate.getUTCDate() - 1);
  const kemarin = formatDate(kemarinDate);
  const bulanIni = `${hariIni.slice(0, 7)}-01`;
  const tanggalMulai = kemarin < bulanIni ? kemarin : bulanIni;
  const tujuhHariMulai = dateFromKey(hariIni);
  tujuhHariMulai.setUTCDate(tujuhHariMulai.getUTCDate() - 6);
  const tanggalTujuhHari = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(tujuhHariMulai);
    date.setUTCDate(date.getUTCDate() + index);
    return formatDate(date);
  });

  try {
    const [
      [transactionSummary],
      [itemSummary],
      [dailyTransactions],
      [methods],
      [bestSellers],
      [lowStock],
      [stockSummary],
      [memberSummary],
      [cashierSummary],
      [recentTransactions],
    ] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(CASE WHEN DATE(created_at) = ? THEN id END) AS hari_transaksi,
           COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total ELSE 0 END), 0) AS hari_pendapatan,
           COUNT(CASE WHEN DATE(created_at) = ? THEN id END) AS kemarin_transaksi,
           COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN total ELSE 0 END), 0) AS kemarin_pendapatan,
           COUNT(CASE WHEN DATE(created_at) >= ? THEN id END) AS bulan_transaksi,
           COALESCE(SUM(CASE WHEN DATE(created_at) >= ? THEN total ELSE 0 END), 0) AS bulan_pendapatan
         FROM transactions
         WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?`,
        [hariIni, hariIni, kemarin, kemarin, bulanIni, bulanIni, tanggalMulai, hariIni]
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN DATE(t.created_at) = ? THEN i.qty ELSE 0 END), 0) AS hari_qty,
           COALESCE(SUM(CASE WHEN DATE(t.created_at) = ? THEN i.subtotal - i.harga_beli * i.qty ELSE 0 END), 0) AS hari_laba,
           COALESCE(SUM(CASE WHEN DATE(t.created_at) = ? THEN i.qty ELSE 0 END), 0) AS kemarin_qty,
           COALESCE(SUM(CASE WHEN DATE(t.created_at) = ? THEN i.subtotal - i.harga_beli * i.qty ELSE 0 END), 0) AS kemarin_laba,
           COALESCE(SUM(CASE WHEN DATE(t.created_at) >= ? THEN i.subtotal - i.harga_beli * i.qty ELSE 0 END), 0) AS bulan_laba
         FROM transaction_items i
         JOIN transactions t ON t.id = i.transaction_id
         WHERE t.status = 'lunas' AND DATE(t.created_at) BETWEEN ? AND ?`,
        [hariIni, hariIni, kemarin, kemarin, bulanIni, tanggalMulai, hariIni]
      ),
      pool.query(
        `SELECT DATE(created_at) AS tanggal,
                COUNT(*) AS transaksi, COALESCE(SUM(total), 0) AS pendapatan
         FROM transactions
         WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?
         GROUP BY DATE(created_at)`,
        [tanggalTujuhHari[0], hariIni]
      ),
      pool.query(
        `SELECT metode_pembayaran AS metode, COUNT(*) AS transaksi,
                COALESCE(SUM(total), 0) AS total
         FROM transactions
         WHERE status = 'lunas' AND DATE(created_at) BETWEEN ? AND ?
         GROUP BY metode_pembayaran ORDER BY total DESC`,
        [bulanIni, hariIni]
      ),
      pool.query(
        `        SELECT i.product_id, i.nama_produk AS nama, COALESCE(SUM(qty), 0) AS qty,
                COALESCE(SUM(subtotal), 0) AS pendapatan
         FROM transaction_items i
         JOIN transactions t ON t.id = i.transaction_id
         WHERE t.status = 'lunas' AND DATE(t.created_at) BETWEEN ? AND ?
        GROUP BY i.product_id, i.nama_produk ORDER BY qty DESC, pendapatan DESC, nama_produk
         LIMIT 5`,
        [bulanIni, hariIni]
      ),
      pool.query(
        'SELECT id, kode, nama, stok FROM products WHERE stok < 10 ORDER BY stok ASC, nama ASC LIMIT 8'
      ),
      pool.query(
        `SELECT COUNT(*) AS jenis, COALESCE(SUM(stok), 0) AS total_stok,
                COALESCE(SUM(stok * harga_beli), 0) AS nilai_stok,
                COUNT(CASE WHEN stok = 0 THEN 1 END) AS habis
         FROM products`
      ),
      pool.query('SELECT COUNT(*) AS jumlah FROM members'),
      pool.query("SELECT COUNT(*) AS jumlah FROM users WHERE role = 'kasir'"),
      pool.query(
        `SELECT t.id, t.kode_transaksi, t.created_at, u.nama AS kasir,
                m.nama AS member_nama, t.metode_pembayaran, t.total
         FROM transactions t
         JOIN users u ON u.id = t.user_id
         LEFT JOIN members m ON m.id = t.member_id
         WHERE t.status = 'lunas'
         ORDER BY t.created_at DESC, t.id DESC
         LIMIT 6`
      ),
    ]);

    const transactions = transactionSummary[0];
    const items = itemSummary[0];
    const dailyByDate = new Map(dailyTransactions.map((row) => [row.tanggal, row]));
    const hariLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const tujuhHari = tanggalTujuhHari.map((tanggal) => {
      const row = dailyByDate.get(tanggal);
      return {
        tanggal,
        label: hariLabels[dateFromKey(tanggal).getUTCDay()],
        pendapatan: Number(row?.pendapatan || 0),
        transaksi: Number(row?.transaksi || 0),
      };
    });

    return NextResponse.json({
      hariIni: {
        transaksi: Number(transactions.hari_transaksi),
        pendapatan: Number(transactions.hari_pendapatan),
        laba: Number(items.hari_laba),
        barangTerjual: Number(items.hari_qty),
      },
      kemarin: {
        transaksi: Number(transactions.kemarin_transaksi),
        pendapatan: Number(transactions.kemarin_pendapatan),
        laba: Number(items.kemarin_laba),
        barangTerjual: Number(items.kemarin_qty),
      },
      bulanIni: {
        transaksi: Number(transactions.bulan_transaksi),
        pendapatan: Number(transactions.bulan_pendapatan),
        laba: Number(items.bulan_laba),
      },
      tujuhHari,
      metodeBulanIni: methods.map((row) => ({
        metode: row.metode,
        transaksi: Number(row.transaksi),
        total: Number(row.total),
      })),
      terlaris: bestSellers.map((row) => ({
        nama: row.nama,
        qty: Number(row.qty),
        pendapatan: Number(row.pendapatan),
      })),
      stokMenipis: lowStock.map((row) => ({
        id: Number(row.id),
        kode: row.kode,
        nama: row.nama,
        stok: Number(row.stok),
      })),
      stokRingkas: {
        jenis: Number(stockSummary[0].jenis),
        totalStok: Number(stockSummary[0].total_stok),
        nilaiStok: Number(stockSummary[0].nilai_stok),
        habis: Number(stockSummary[0].habis),
      },
      jumlahMember: Number(memberSummary[0].jumlah),
      jumlahKasir: Number(cashierSummary[0].jumlah),
      transaksiTerbaru: recentTransactions.map((row) => ({
        id: Number(row.id),
        kode_transaksi: row.kode_transaksi,
        created_at: row.created_at,
        kasir: row.kasir,
        member_nama: row.member_nama,
        metode_pembayaran: row.metode_pembayaran,
        total: Number(row.total),
      })),
    });
  } catch (error) {
    console.error('[dashboard]', error);
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 });
  }
}
