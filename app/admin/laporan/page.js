'use client';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buatLaporanPenjualanPDF } from '@/lib/pdf';
import { firstDayOfMonthLocal, rp, todayLocal } from '@/lib/utils';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

function dateDefaults() {
  return { from: firstDayOfMonthLocal(), to: todayLocal() };
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 shadow-lg">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-semibold text-primary">Pendapatan: {rp(payload[0].value)}</p>
    </div>
  );
}

function ProductTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-accent">Terjual: {Number(payload[0].value)} barang</p>
    </div>
  );
}

export default function LaporanPenjualanPage() {
  const [filters, setFilters] = useState(dateDefaults);
  const [applied, setApplied] = useState(dateDefaults);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(applied);
    fetch(`/api/reports/sales?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat laporan penjualan.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setReport(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat laporan penjualan.');
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

  const summary = report?.ringkasan;
  const hasSales = Number(summary?.total_transaksi || 0) > 0;
  const stats = summary ? [
    { label: 'Transaksi Lunas', value: Number(summary.total_transaksi), tone: 'text-primary' },
    { label: 'Barang Terjual', value: Number(summary.barang_terjual), tone: 'text-accent' },
    { label: 'Pendapatan Kotor', value: rp(summary.pendapatan_kotor), tone: 'text-primary' },
    { label: 'Modal', value: rp(summary.modal), tone: 'text-muted' },
    { label: 'Pendapatan Bersih', value: rp(summary.pendapatan_bersih), tone: 'text-accent' },
  ] : [];

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">Laporan Penjualan</h1><p className="mt-1 text-sm text-muted">Ringkasan transaksi lunas, pendapatan, modal, dan produk terjual.</p></header>

      <form onSubmit={showReport} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
        <label className="label" htmlFor="sales-from">Dari<input id="sales-from" className="input mt-1.5" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} required /></label>
        <label className="label" htmlFor="sales-to">Sampai<input id="sales-to" className="input mt-1.5" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} required /></label>
        <button className="btn btn-primary">Tampilkan</button>
        <button type="button" className="btn btn-ghost" disabled={!report || loading} onClick={() => buatLaporanPenjualanPDF(report, applied.from, applied.to)}>Export PDF</button>
      </form>

      {error && <ErrorState message={error} />}
      {loading ? <LoadingState label="Memuat laporan penjualan..." /> : !error && report && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => <div className="stat-card min-w-0" key={stat.label}><p className="text-sm text-muted">{stat.label}</p><p className={`mt-2 break-words text-2xl font-bold ${stat.tone}`}>{stat.value}</p></div>)}
          </section>

          {hasSales ? (
            <section className="grid min-w-0 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <article className="card min-w-0 p-4 sm:p-5">
                <h2 className="mb-4 text-lg font-semibold">Pendapatan per Hari</h2>
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.harian} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
                      <XAxis dataKey="tanggal" tick={{ fill: 'var(--muted)', fontSize: 14 }} tickLine={{ stroke: 'var(--line)' }} axisLine={{ stroke: 'var(--line)' }} minTickGap={24} />
                      <YAxis tick={{ fill: 'var(--muted)', fontSize: 14 }} tickLine={{ stroke: 'var(--line)' }} axisLine={{ stroke: 'var(--line)' }} tickFormatter={(value) => value >= 1000000 ? `${Math.round(value / 1000000)} jt` : value >= 1000 ? `${Math.round(value / 1000)} rb` : value} width={54} />
                      <Tooltip content={<RevenueTooltip />} />
                      <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'var(--primary)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>
              <article className="card min-w-0 p-4 sm:p-5">
                <h2 className="mb-4 text-lg font-semibold">5 Produk Terlaris</h2>
                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.produk.slice(0, 5)} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 14 }} tickLine={{ stroke: 'var(--line)' }} axisLine={{ stroke: 'var(--line)' }} />
                      <YAxis type="category" dataKey="nama" width={116} tick={{ fill: 'var(--muted)', fontSize: 14 }} tickLine={false} axisLine={{ stroke: 'var(--line)' }} />
                      <Tooltip content={<ProductTooltip />} />
                      <Bar dataKey="qty" name="Terjual" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>
          ) : <EmptyState>Tidak ada transaksi lunas pada rentang tanggal ini.</EmptyState>}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Rincian Produk Terjual</h2>
            {report.produk.length === 0 ? <EmptyState>Belum ada produk terjual pada periode ini.</EmptyState> : (
              <>
                <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block"><div className="overflow-x-auto"><table className="tbl min-w-[850px]">
                  <thead><tr><th>Nama</th><th>Kategori</th><th>Qty Terjual</th><th>Pendapatan</th><th>Modal</th><th>Laba</th></tr></thead>
                  <tbody>{report.produk.map((product) => <tr key={product.product_id}><td className="font-medium">{product.nama}</td><td><span className="badge badge-primary">{product.kategori}</span></td><td>{Number(product.qty)}</td><td>{rp(product.pendapatan)}</td><td>{rp(product.modal)}</td><td className="font-semibold text-accent">{rp(product.laba)}</td></tr>)}</tbody>
                </table></div></div>
                <div className="grid gap-3 md:hidden">{report.produk.map((product) => (
                  <article className="card space-y-3 p-4" key={product.product_id}>
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{product.nama}</p><p className="mt-1 text-sm text-muted">{product.kategori}</p></div><span className="badge badge-accent shrink-0">{Number(product.qty)} terjual</span></div>
                    <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted">Pendapatan</p><p className="mt-1 font-medium">{rp(product.pendapatan)}</p></div><div><p className="text-muted">Modal</p><p className="mt-1">{rp(product.modal)}</p></div></div>
                    <p className="border-t border-line pt-3 text-sm"><span className="text-muted">Laba </span><strong className="text-accent">{rp(product.laba)}</strong></p>
                  </article>
                ))}</div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}