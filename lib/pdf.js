import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { rp } from '@/lib/utils';

export { rp };

// ===== STRUK (kertas thermal 80mm) =====
export function buatStrukPDF(trx) {
  const tinggi = 82 + trx.items.length * 10;
  const doc = new jsPDF({ unit: 'mm', format: [80, tinggi] });
  const garis = '-'.repeat(40);
  let y = 8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text('TOKO KOMPUTER JAYA', 40, y, { align: 'center' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('Jl. Contoh No. 1, Depok', 40, y, { align: 'center' });
  y += 4;
  doc.text(garis, 4, y); y += 4;

  doc.text(`No     : ${trx.kode_transaksi}`, 4, y); y += 4;
  doc.text(`Tanggal: ${trx.created_at}`, 4, y); y += 4;
  doc.text(`Kasir  : ${trx.kasir}`, 4, y); y += 4;
  if (trx.metode_pembayaran) {
    const metode = { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer Bank' }[trx.metode_pembayaran] || trx.metode_pembayaran;
    doc.text(`Metode : ${metode}`, 4, y); y += 4;
  }
  if (trx.member_nama) {
    doc.text(`Member : ${trx.member_nama}`.slice(0, 42), 4, y); y += 4;
  }
  doc.text(garis, 4, y); y += 4;

  trx.items.forEach((it) => {
    doc.text(it.nama_produk.slice(0, 38), 4, y); y += 4;
    doc.text(`${it.qty} x ${rp(it.harga)}`, 4, y);
    doc.text(rp(it.subtotal), 76, y, { align: 'right' });
    y += 5;
  });

  doc.text(garis, 4, y); y += 4;
  doc.setFont('courier', 'bold');
  doc.text('TOTAL', 4, y);   doc.text(rp(trx.total), 76, y, { align: 'right' }); y += 4;
  doc.setFont('courier', 'normal');
  if (trx.metode_pembayaran === 'tunai' || !trx.metode_pembayaran) {
    doc.text('BAYAR', 4, y);   doc.text(rp(trx.bayar), 76, y, { align: 'right' }); y += 4;
    doc.text('KEMBALI', 4, y); doc.text(rp(trx.kembalian), 76, y, { align: 'right' }); y += 6;
  } else {
    const metode = { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer Bank' }[trx.metode_pembayaran] || trx.metode_pembayaran;
    doc.text(`DIBAYAR VIA ${metode}`, 4, y); y += 6;
  }

  doc.text(garis, 4, y); y += 4;
  doc.text('Terima kasih atas kunjungan Anda', 40, y, { align: 'center' });

  doc.save(`struk-${trx.kode_transaksi}.pdf`);
}

// ===== LAPORAN (A4) =====
export function buatLaporanPDF(data, from, to) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('LAPORAN PENJUALAN', 14, 16);
  doc.setFontSize(10);
  doc.text(`Periode: ${from} s/d ${to}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Kode Transaksi', 'Tanggal', 'Kasir', 'Member', 'Metode', 'Total']],
    body: data.map((transaction, index) => [
      index + 1,
      transaction.kode_transaksi,
      transaction.created_at,
      transaction.kasir,
      transaction.member_nama || '-',
      { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer Bank' }[transaction.metode_pembayaran] || transaction.metode_pembayaran || '-',
      rp(transaction.total),
    ]),
    foot: [['', '', '', '', '', 'TOTAL PENDAPATAN', rp(data.reduce((sum, transaction) => sum + Number(transaction.total), 0))]],
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.save(`laporan-${from}-sd-${to}.pdf`);
}

export function buatLaporanStokPDF(rows, from, to) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('LAPORAN PERGERAKAN STOK', 14, 16);
  doc.setFontSize(10);
  doc.text(`Periode: ${from} s/d ${to}`, 14, 23);
  autoTable(doc, {
    startY: 28,
    head: [['Tanggal', 'Kode', 'Nama Barang', 'Tipe', 'Jumlah', 'Stok Sebelum', 'Stok Sesudah', 'Keterangan', 'Oleh']],
    body: rows.map((row) => [
      row.created_at,
      row.kode,
      row.nama_produk,
      { baru: 'Barang Baru', masuk: 'Masuk', keluar: 'Keluar' }[row.tipe] || row.tipe,
      Number(row.jumlah),
      Number(row.stok_sebelum),
      Number(row.stok_sesudah),
      row.keterangan || '-',
      row.pengguna,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`laporan-stok-${from}-sd-${to}.pdf`);
}

export function buatLaporanPenjualanPDF(data, from, to) {
  const doc = new jsPDF();
  const summary = data.ringkasan;
  doc.setFontSize(14);
  doc.text('LAPORAN PENJUALAN', 14, 16);
  doc.setFontSize(10);
  doc.text(`Periode: ${from} s/d ${to}`, 14, 23);
  autoTable(doc, {
    startY: 28,
    head: [['Ringkasan', 'Nilai']],
    body: [
      ['Transaksi Lunas', Number(summary.total_transaksi)],
      ['Barang Terjual', Number(summary.barang_terjual)],
      ['Pendapatan Kotor', rp(summary.pendapatan_kotor)],
      ['Modal', rp(summary.modal)],
      ['Pendapatan Bersih', rp(summary.pendapatan_bersih)],
    ],
    headStyles: { fillColor: [37, 99, 235] },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Nama Produk', 'Kategori', 'Qty Terjual', 'Pendapatan', 'Modal', 'Laba']],
    body: data.produk.map((product) => [
      product.nama,
      product.kategori,
      Number(product.qty),
      rp(product.pendapatan),
      rp(product.modal),
      rp(product.laba),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 148, 136] },
  });
  doc.save(`laporan-penjualan-${from}-sd-${to}.pdf`);
}