'use client';
import { useEffect, useState } from 'react';
import { buatLaporanStokPDF, rp } from '@/lib/pdf';
import { firstDayOfMonthLocal, todayLocal } from '@/lib/utils';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

const typeLabels = { baru: 'Barang Baru', masuk: 'Masuk', keluar: 'Keluar' };
const typeBadge = { baru: 'badge-accent', masuk: 'badge-primary', keluar: 'badge-muted' };

function defaults() {
  return { from: firstDayOfMonthLocal(), to: todayLocal(), tipe: '', q: '' };
}

export default function LaporanStokPage() {
  const [filters, setFilters] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ masuk: 0, keluar: 0, baru: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ from: applied.from, to: applied.to });
    if (applied.tipe) params.set('tipe', applied.tipe);
    if (applied.q.trim()) params.set('q', applied.q.trim());
    fetch(`/api/stock-movements?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat laporan stok.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setRows(result.rows);
        setSummary(result.ringkasan);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat laporan stok.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [applied]);

  function showReport(event) {
    event.preventDefault();
    if (!filters.from || !filters.to || filters.from > filters.to) {
      setError('Periksa kembali rentang tanggal.');
      return;
    }
    setError('');
    setLoading(true);
    setApplied({ ...filters });
  }

  const stats = [
    { label: 'Total Barang Masuk', value: Number(summary.masuk), tone: 'text-primary' },
    { label: 'Total Barang Keluar', value: Number(summary.keluar), tone: 'text-muted' },
    { label: 'Jumlah Barang Baru', value: Number(summary.baru), tone: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Laporan Stok</h1>
        <p className="mt-1 text-sm text-muted">Riwayat barang baru, masuk, dan keluar.</p>
      </header>

      <form onSubmit={showReport} className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto] xl:items-end">
        <label className="label" htmlFor="stock-report-from">Dari
          <input id="stock-report-from" className="input mt-1.5" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} required />
        </label>
        <label className="label" htmlFor="stock-report-to">Sampai
          <input id="stock-report-to" className="input mt-1.5" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} required />
        </label>
        <label className="label" htmlFor="stock-report-type">Tipe
          <select id="stock-report-type" className="select mt-1.5" value={filters.tipe} onChange={(event) => setFilters({ ...filters, tipe: event.target.value })}>
            <option value="">Semua tipe</option><option value="baru">Barang Baru</option><option value="masuk">Masuk</option><option value="keluar">Keluar</option>
          </select>
        </label>
        <label className="label" htmlFor="stock-report-search">Cari barang
          <input id="stock-report-search" className="input mt-1.5" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Kode atau nama" />
        </label>
        <button type="submit" className="btn btn-primary">Tampilkan</button>
        <button type="button" className="btn btn-ghost" onClick={() => buatLaporanStokPDF(rows, applied.from, applied.to)} disabled={!rows.length || loading}>Export PDF</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading ? <LoadingState label="Memuat laporan stok..." /> : !error && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => <div className="stat-card" key={stat.label}><p className="text-sm text-muted">{stat.label}</p><p className={`mt-2 text-2xl font-bold ${stat.tone}`}>{stat.value}</p></div>)}
          </section>
          {rows.length === 0 ? <EmptyState>Tidak ada pergerakan stok pada rentang ini.</EmptyState> : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
                <div className="overflow-x-auto">
                  <table className="tbl min-w-[1100px]">
                    <thead><tr><th>Tanggal</th><th>Kode</th><th>Nama Barang</th><th>Tipe</th><th>Jumlah</th><th>Stok Sebelum → Sesudah</th><th>Keterangan</th><th>Oleh</th></tr></thead>
                    <tbody>{rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.created_at}</td><td className="font-mono text-sm text-muted">{row.kode}</td><td>{row.nama_produk}</td>
                        <td><span className={`badge ${typeBadge[row.tipe]}`}>{typeLabels[row.tipe]}</span></td>
                        <td>{row.jumlah}</td><td>{row.stok_sebelum} → {row.stok_sesudah}</td><td>{row.keterangan || '—'}</td><td>{row.pengguna}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="grid gap-3 md:hidden">
                {rows.map((row) => (
                  <article className="card space-y-3 p-4" key={row.id}>
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{row.nama_produk}</p><p className="mt-1 font-mono text-sm text-muted">{row.kode}</p></div><span className={`badge shrink-0 ${typeBadge[row.tipe]}`}>{typeLabels[row.tipe]}</span></div>
                    <p className="text-sm text-muted">{row.created_at}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm"><div><p className="text-muted">Jumlah</p><p className="mt-1 font-semibold">{row.jumlah}</p></div><div><p className="text-muted">Sebelum</p><p className="mt-1">{row.stok_sebelum}</p></div><div><p className="text-muted">Sesudah</p><p className="mt-1">{row.stok_sesudah}</p></div></div>
                    <p className="text-sm">{row.keterangan || '—'} <span className="text-muted">· {row.pengguna}</span></p>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}