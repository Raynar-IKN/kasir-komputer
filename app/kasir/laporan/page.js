'use client';
import { useEffect, useState } from 'react';
import { METODE } from '@/lib/constants';
import { buatLaporanPDF, rp } from '@/lib/pdf';
import { todayLocal } from '@/lib/utils';

const methodLabel = (value) => METODE.find((method) => method.value === value)?.label || value;
const methodBadge = (value) => value === 'tunai' ? 'badge-accent' : value === 'transfer' ? 'badge-muted' : 'badge-primary';

export default function LaporanPage() {
  const today = todayLocal();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [metode, setMetode] = useState('');
  const [applied, setApplied] = useState({ from: today, to: today, metode: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ from: applied.from, to: applied.to });
    if (applied.metode) params.set('metode', applied.metode);
    fetch(`/api/transactions?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat riwayat transaksi.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat riwayat transaksi.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [applied]);

  function load(event) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setError('Periksa kembali rentang tanggal.');
      return;
    }
    setLoading(true);
    setError('');
    setApplied({ from, to, metode });
  }

  const pendapatan = data.reduce((sum, transaction) => sum + Number(transaction.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h1>
        <p className="text-sm text-muted">Pilih periode untuk melihat dan mengekspor laporan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-muted">Jumlah Transaksi</p>
          <p className="mt-1 text-3xl font-bold text-primary">{data.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-muted">Total Pendapatan</p>
          <p className="mt-1 text-3xl font-bold text-accent">{rp(pendapatan)}</p>
        </div>
      </div>

      <form onSubmit={load} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <label className="label" htmlFor="history-from">Dari
          <input id="history-from" type="date" className="input mt-1.5" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label className="label" htmlFor="history-to">Sampai
          <input id="history-to" type="date" className="input mt-1.5" value={to} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <label className="label" htmlFor="history-method">Metode
          <select id="history-method" className="select mt-1.5" value={metode} onChange={(e) => setMetode(e.target.value)}>
            <option value="">Semua metode</option>
            {METODE.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">Tampilkan</button>
          <button type="button" onClick={() => buatLaporanPDF(data, applied.from, applied.to)} disabled={!data.length || loading} className="btn btn-ghost">
          Export PDF
          </button>
        </div>
      </form>

      {error && <div className="alert-error flex flex-wrap items-center justify-between gap-3" role="alert"><span>{error}</span><button className="btn btn-ghost" onClick={() => { setLoading(true); setApplied({ ...applied }); }}>Coba lagi</button></div>}

      <div className="card overflow-hidden">
        {loading ? <p className="p-5 text-sm text-muted" role="status">Memuat riwayat transaksi...</p> : !error && data.length === 0 ? <p className="p-5 text-center text-sm text-muted">Tidak ada transaksi pada periode ini.</p> : !error && (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[900px]">
              <thead><tr><th>No</th><th>Kode</th><th>Tanggal</th><th>Kasir</th><th>Member</th><th>Metode</th><th className="text-right">Total</th></tr></thead>
              <tbody>{data.map((transaction, index) => (
                <tr key={transaction.id}>
                  <td>{index + 1}</td><td className="font-mono text-sm">{transaction.kode_transaksi}</td><td>{transaction.created_at}</td><td>{transaction.kasir}</td><td>{transaction.member_nama || '—'}</td>
                  <td><span className={`badge ${methodBadge(transaction.metode_pembayaran)}`}>{methodLabel(transaction.metode_pembayaran)}</span></td>
                  <td className="text-right font-semibold">{rp(transaction.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}