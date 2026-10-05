'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buatStrukPDF, rp } from '@/lib/pdf';

const Dash = () => <div className="my-3 border-t border-dashed border-line" />;
const methods = { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer Bank' };

export default function StrukPage() {
  const { id } = useParams();
  const [trx, setTrx] = useState(null);

  useEffect(() => {
    fetch(`/api/transactions/${id}`).then((r) => r.json()).then(setTrx);
  }, [id]);

  if (!trx) return <p className="py-10 text-center text-muted">Memuat struk...</p>;

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Pembayaran Berhasil</h1>
        <p className="text-sm text-muted">Transaksi telah tercatat.</p>
      </div>

      <div className="card p-6 font-mono text-sm shadow-lg">
        <h2 className="text-center text-base font-bold">TOKO KOMPUTER JAYA</h2>
        <p className="text-center text-sm text-muted">Jl. Contoh No. 1, Depok</p>
        <Dash />
        <div className="space-y-1 text-sm">
          <p className="flex justify-between gap-2"><span className="text-muted">No</span><span>{trx.kode_transaksi}</span></p>
          <p className="flex justify-between gap-2"><span className="text-muted">Tanggal</span><span>{trx.created_at}</span></p>
          <p className="flex justify-between gap-2"><span className="text-muted">Kasir</span><span>{trx.kasir}</span></p>
          <p className="flex justify-between gap-2"><span className="text-muted">Metode</span><span>{methods[trx.metode_pembayaran] || trx.metode_pembayaran}</span></p>
          {trx.member_nama && <p className="flex justify-between gap-2"><span className="text-muted">Member</span><span className="text-right">{trx.member_nama} · {trx.kode_member}</span></p>}
        </div>
        <Dash />
        <div className="space-y-2">
          {trx.items.map((it) => (
            <div key={it.id}>
              <p>{it.nama_produk}</p>
              <p className="flex justify-between text-sm text-muted">
                <span>{it.qty} x {rp(it.harga)}</span>
                <span className="text-ink">{rp(it.subtotal)}</span>
              </p>
            </div>
          ))}
        </div>
        <Dash />
        <div className="space-y-1">
          <p className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{rp(trx.total)}</span></p>
          {trx.metode_pembayaran === 'tunai' || !trx.metode_pembayaran ? (
            <>
              <p className="flex justify-between"><span>Bayar</span><span>{rp(trx.bayar)}</span></p>
              <p className="flex justify-between"><span>Kembali</span><span>{rp(trx.kembalian)}</span></p>
            </>
          ) : <p className="text-right">Dibayar via {methods[trx.metode_pembayaran] || trx.metode_pembayaran}</p>}
        </div>
        <Dash />
        <p className="text-center text-sm text-muted">Terima kasih atas kunjungan Anda</p>
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={() => buatStrukPDF(trx)} className="btn btn-primary flex-1">Download PDF</button>
        <Link href="/kasir" className="btn btn-ghost flex-1">Transaksi Baru</Link>
      </div>
    </div>
  );
}