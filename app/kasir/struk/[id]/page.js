'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buatStrukPDF, rp } from '@/lib/pdf';

const Dash = () => <div className="my-3 border-t border-dashed border-slate-300 dark:border-slate-700" />;

export default function StrukPage() {
  const { id } = useParams();
  const [trx, setTrx] = useState(null);

  useEffect(() => {
    fetch(`/api/transactions/${id}`).then((r) => r.json()).then(setTrx);
  }, [id]);

  if (!trx) return <p className="py-10 text-center text-slate-500">Memuat struk...</p>;

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Pembayaran Berhasil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Transaksi telah tercatat.</p>
      </div>

      <div className="card p-6 font-mono text-sm shadow-lg">
        <h2 className="text-center text-base font-bold">TOKO KOMPUTER JAYA</h2>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">Jl. Contoh No. 1, Depok</p>
        <Dash />
        <div className="space-y-0.5 text-xs">
          <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">No</span><span>{trx.kode_transaksi}</span></p>
          <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Tanggal</span><span>{trx.created_at}</span></p>
          <p className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Kasir</span><span>{trx.kasir}</span></p>
        </div>
        <Dash />
        <div className="space-y-2">
          {trx.items.map((it) => (
            <div key={it.id}>
              <p>{it.nama_produk}</p>
              <p className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{it.qty} x {rp(it.harga)}</span>
                <span className="text-slate-800 dark:text-slate-100">{rp(it.subtotal)}</span>
              </p>
            </div>
          ))}
        </div>
        <Dash />
        <div className="space-y-1">
          <p className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{rp(trx.total)}</span></p>
          <p className="flex justify-between"><span>Bayar</span><span>{rp(trx.bayar)}</span></p>
          <p className="flex justify-between"><span>Kembali</span><span>{rp(trx.kembalian)}</span></p>
        </div>
        <Dash />
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">Terima kasih atas kunjungan Anda</p>
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={() => buatStrukPDF(trx)} className="btn btn-primary flex-1">Download PDF</button>
        <Link href="/kasir" className="btn btn-ghost flex-1">Transaksi Baru</Link>
      </div>
    </div>
  );
}