'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { METODE } from '@/lib/constants';
import { rp, todayLocal } from '@/lib/utils';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

const methodLabel = (value) => METODE.find((method) => method.value === value)?.label || value;
const methodBadge = (value) => value === 'tunai' ? 'badge-accent' : value === 'transfer' ? 'badge-muted' : 'badge-primary';

function defaultFilters() {
  return { from: todayLocal(), to: todayLocal(), metode: '', q: '' };
}

export default function RiwayatTransaksiPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ from: applied.from, to: applied.to });
    if (applied.metode) params.set('metode', applied.metode);
    if (applied.q.trim()) params.set('q', applied.q.trim());
    fetch(`/api/transactions?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat transaksi.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setTransactions(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat transaksi.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [applied]);

  function showTransactions(event) {
    event.preventDefault();
    if (!filters.from || !filters.to || filters.from > filters.to) {
      setError('Periksa kembali rentang tanggal.');
      return;
    }
    setError('');
    setLoading(true);
    setApplied({ ...filters });
  }

  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0);

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">Riwayat Transaksi</h1><p className="mt-1 text-sm text-muted">Cari transaksi berdasarkan periode, metode, atau kode.</p></header>

      <form onSubmit={showTransactions} className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr_auto] xl:items-end">
        <label className="label" htmlFor="transactions-from">Dari<input id="transactions-from" className="input mt-1.5" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} required /></label>
        <label className="label" htmlFor="transactions-to">Sampai<input id="transactions-to" className="input mt-1.5" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} required /></label>
        <label className="label" htmlFor="transactions-method">Metode
          <select id="transactions-method" className="select mt-1.5" value={filters.metode} onChange={(event) => setFilters({ ...filters, metode: event.target.value })}>
            <option value="">Semua metode</option>{METODE.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </select>
        </label>
        <label className="label" htmlFor="transactions-search">Cari kode<input id="transactions-search" className="input mt-1.5" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} maxLength={30} placeholder="Contoh TRX..." /></label>
        <button className="btn btn-primary">Tampilkan</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading ? <LoadingState label="Memuat transaksi..." /> : !error && (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="stat-card"><p className="text-sm text-muted">Jumlah Transaksi</p><p className="mt-2 text-2xl font-bold text-primary">{transactions.length}</p></div>
            <div className="stat-card"><p className="text-sm text-muted">Total Transaksi</p><p className="mt-2 text-2xl font-bold text-accent">{rp(total)}</p></div>
          </section>
          {transactions.length === 0 ? <EmptyState>Tidak ada transaksi pada filter ini.</EmptyState> : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block"><div className="overflow-x-auto"><table className="tbl min-w-[900px]">
                <thead><tr><th>Kode</th><th>Tanggal</th><th>Kasir</th><th>Member</th><th>Metode</th><th>Total</th></tr></thead>
                <tbody>{transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Buka transaksi ${transaction.kode_transaksi}`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={() => router.push(`/admin/transaksi/${transaction.id}`)}
                    onKeyDown={(event) => { if (event.key === 'Enter') router.push(`/admin/transaksi/${transaction.id}`); }}
                  >
                    <td className="font-mono text-sm text-primary">{transaction.kode_transaksi}</td><td>{transaction.created_at}</td><td>{transaction.kasir}</td><td>{transaction.member_nama || '—'}</td>
                    <td><span className={`badge ${methodBadge(transaction.metode_pembayaran)}`}>{methodLabel(transaction.metode_pembayaran)}</span></td><td className="font-semibold">{rp(transaction.total)}</td>
                  </tr>
                ))}</tbody>
              </table></div></div>
              <div className="grid gap-3 md:hidden">{transactions.map((transaction) => (
                <Link href={`/admin/transaksi/${transaction.id}`} className="card block space-y-3 p-4 transition hover:border-primary" key={transaction.id}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-mono text-sm font-semibold text-primary">{transaction.kode_transaksi}</p><p className="mt-1 text-sm text-muted">{transaction.created_at}</p></div><span className={`badge shrink-0 ${methodBadge(transaction.metode_pembayaran)}`}>{methodLabel(transaction.metode_pembayaran)}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-muted">Kasir</p><p className="mt-1">{transaction.kasir}</p></div><div><p className="text-muted">Member</p><p className="mt-1">{transaction.member_nama || '—'}</p></div></div>
                  <p className="border-t border-line pt-3 font-semibold">{rp(transaction.total)}</p>
                </Link>
              ))}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}