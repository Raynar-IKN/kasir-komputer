import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

// ===== STRUK (kertas thermal 80mm) =====
export function buatStrukPDF(trx) {
  const tinggi = 70 + trx.items.length * 10;
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
  doc.text('BAYAR', 4, y);   doc.text(rp(trx.bayar), 76, y, { align: 'right' }); y += 4;
  doc.text('KEMBALI', 4, y); doc.text(rp(trx.kembalian), 76, y, { align: 'right' }); y += 6;

  doc.text(garis, 4, y); y += 4;
  doc.text('Terima kasih atas kunjungan Anda', 40, y, { align: 'center' });

  doc.save(`struk-${trx.kode_transaksi}.pdf`);
}

// ===== LAPORAN (A4) =====
export function buatLaporanPDF(data, from, to) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('LAPORAN PENJUALAN', 14, 16);
  doc.setFontSize(10);
  doc.text(`Periode: ${from} s/d ${to}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Kode Transaksi', 'Tanggal', 'Kasir', 'Total']],
    body: data.map((t, i) => [i + 1, t.kode_transaksi, t.created_at, t.kasir, rp(t.total)]),
    foot: [['', '', '', 'TOTAL PENDAPATAN', rp(data.reduce((s, t) => s + t.total, 0))]],
  });

  doc.save(`laporan-${from}-sd-${to}.pdf`);
}