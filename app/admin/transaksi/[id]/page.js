'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buatStrukPDF, rp } from '@/lib/pdf';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

const methods = { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', transfer: 'Transfer Bank' };

export default function DetailTransaksiAdminPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/transactions/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat detail transaksi.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setTransaction(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat detail transaksi.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [id, retry]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Detail Transaksi</h1>
        <Link href="/admin/transaksi" className="btn btn-ghost">Kembali</Link>
      </div>
      {error && <ErrorState message={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} />}
      {loading ? <LoadingState label="Memuat detail transaksi..." /> : error ? null : !transaction ? <EmptyState>Transaksi tidak ditemukan.</EmptyState> : (
        <>
          <div className="card p-5 sm:p-7">
            <div className="border-b border-dashed border-line pb-4 text-center">
              <p className="text-lg font-bold">KOMPUTER JAYA</p>
              <p className="mt-1 text-sm text-muted">Rincian transaksi penjualan</p>
            </div>
            <dl className="grid gap-x-6 gap-y-3 border-b border-dashed border-line py-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Kode Transaksi</dt><dd className="mt-1 font-mono font-semibold">{transaction.kode_transaksi}</dd></div>
              <div><dt className="text-muted">Tanggal</dt><dd className="mt-1">{transaction.created_at}</dd></div>
              <div><dt className="text-muted">Kasir</dt><dd className="mt-1">{transaction.kasir}</dd></div>
              <div><dt className="text-muted">Metode Pembayaran</dt><dd className="mt-1">{methods[transaction.metode_pembayaran] || transaction.metode_pembayaran}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted">Member</dt><dd className="mt-1">{transaction.member_nama ? `${transaction.member_nama} · ${transaction.kode_member} · ${transaction.member_telp}` : '—'}</dd></div>
            </dl>
            <div className="divide-y divide-line">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0"><p className="font-medium">{item.nama_produk}</p><p className="mt-1 text-muted">{item.qty} × {rp(item.harga)}</p></div>
                  <p className="shrink-0 font-medium">{rp(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <dl className="space-y-2 border-t border-dashed border-line pt-4 text-sm">
              <div className="flex justify-between gap-4 text-base font-bold"><dt>Total</dt><dd>{rp(transaction.total)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Bayar</dt><dd>{rp(transaction.bayar)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Kembalian</dt><dd>{rp(transaction.kembalian)}</dd></div>
            </dl>
          </div>
          <button type="button" onClick={() => buatStrukPDF(transaction)} className="btn btn-primary w-full">Download PDF</button>
        </>
      )}
    </div>
  );
}