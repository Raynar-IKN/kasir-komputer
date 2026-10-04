'use client';
import { useEffect, useState } from 'react';
import { buatLaporanPDF, rp } from '@/lib/pdf';

export default function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState([]);

  async function load() {
    const res = await fetch(`/api/transactions?from=${from}&to=${to}`);
    setData(await res.json());
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const pendapatan = data.reduce((s, t) => s + t.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Penjualan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Pilih periode untuk melihat dan mengekspor laporan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Jumlah Transaksi</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">{data.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Pendapatan</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{rp(pendapatan)}</p>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm font-medium">Dari
          <input type="date" className="input mt-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-sm font-medium">Sampai
          <input type="date" className="input mt-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button onClick={load} className="btn btn-primary">Tampilkan</button>
        <button onClick={() => buatLaporanPDF(data, from, to)} disabled={!data.length} className="btn btn-ghost">
          Export PDF
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>No</th><th>Kode</th><th>Tanggal</th><th>Kasir</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.map((t, i) => (
                <tr key={t.id}>
                  <td>{i + 1}</td>
                  <td className="font-mono text-xs">{t.kode_transaksi}</td>
                  <td>{t.created_at}</td>
                  <td>{t.kasir}</td>
                  <td className="text-right font-semibold">{rp(t.total)}</td>
                </tr>
              ))}
              {!data.length && (
                <tr><td colSpan="5" className="py-10 text-center text-slate-500">Tidak ada transaksi pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}