'use client';
import { useEffect, useState } from 'react';
import { rp } from '@/lib/pdf';
import { stokBadge } from '@/lib/ui';

function Stat({ label, value, color }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function Row({ p, onSaved }) {
  const [harga, setHarga] = useState(p.harga);
  const [stok, setStok] = useState(p.stok);
  const berubah = Number(harga) !== p.harga || Number(stok) !== p.stok;

  async function simpan() {
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ harga: Number(harga), stok: Number(stok) }),
    });
    if (res.ok) onSaved();
    else alert((await res.json()).error);
  }

  return (
    <tr>
      <td className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.kode}</td>
      <td className="font-medium">{p.nama}</td>
      <td>
        <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{p.kategori}</span>
      </td>
      <td><input type="number" className="input w-32!" value={harga} onChange={(e) => setHarga(e.target.value)} /></td>
      <td>
        <div className="flex items-center gap-2">
          <input type="number" className="input w-24!" value={stok} onChange={(e) => setStok(e.target.value)} />
          <span className={`badge ${stokBadge(p.stok)}`}>{p.stok === 0 ? 'Habis' : p.stok < 10 ? 'Menipis' : 'Aman'}</span>
        </div>
      </td>
      <td>
        <button onClick={simpan} disabled={!berubah} className="btn btn-success">Simpan</button>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const empty = { kode: '', nama: '', kategori: '', harga: '', stok: '' };
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function tambah(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, harga: Number(form.harga), stok: Number(form.stok) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setForm(empty);
    load();
  }

  const totalStok = products.reduce((s, p) => s + p.stok, 0);
  const menipis = products.filter((p) => p.stok < 10).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Barang & Stok</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola barang dan perbarui stok toko.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Jenis Barang" value={products.length} color="text-indigo-600 dark:text-indigo-400" />
        <Stat label="Total Stok" value={totalStok} color="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Stok Menipis (<10)" value={menipis} color="text-amber-600 dark:text-amber-400" />
      </div>

      <form onSubmit={tambah} className="card p-5">
        <h2 className="mb-3 font-semibold">Tambah Barang Baru</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className="input" placeholder="Kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} required />
          <input className="input lg:col-span-2" placeholder="Nama barang" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
          <input className="input" placeholder="Kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} required />
          <input type="number" className="input" placeholder="Harga" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
          <input type="number" className="input" placeholder="Stok" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} required />
        </div>
        {error && <div className="alert-error mt-3">{error}</div>}
        <button className="btn btn-primary mt-4">+ Tambah Barang</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Harga (Rp)</th><th>Stok</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <Row key={`${p.id}-${p.stok}-${p.harga}`} p={p} onSaved={load} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}