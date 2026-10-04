'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { rp } from '@/lib/pdf';
import { stokBadge } from '@/lib/ui';

export default function KasirPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState({});
  const [cart, setCart] = useState([]); // { id, nama, harga, qty, stok }
  const [bayar, setBayar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  const filtered = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(q.toLowerCase()) ||
      p.kode.toLowerCase().includes(q.toLowerCase()) ||
      p.kategori.toLowerCase().includes(q.toLowerCase())
  );
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const kembalian = Number(bayar) - total;

  function tambah(p) {
    const jumlah = Number(qty[p.id] || 1);
    if (jumlah < 1) return;
    const ada = cart.find((c) => c.id === p.id);
    const baru = (ada?.qty || 0) + jumlah;
    if (baru > p.stok) return setError(`Stok ${p.nama} hanya ${p.stok}`);
    setError('');
    setCart(
      ada
        ? cart.map((c) => (c.id === p.id ? { ...c, qty: baru } : c))
        : [...cart, { id: p.id, nama: p.nama, harga: p.harga, qty: jumlah, stok: p.stok }]
    );
  }

  function ubah(id, delta) {
    setCart(cart.map((c) => (c.id === id ? { ...c, qty: Math.min(c.stok, Math.max(1, c.qty + delta)) } : c)));
  }

  async function prosesBayar() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((c) => ({ product_id: c.id, qty: c.qty })),
        bayar: Number(bayar),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push(`/kasir/struk/${data.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* DAFTAR BARANG */}
      <section className="space-y-4 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Barang</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pilih barang dan jumlahnya, lalu tambahkan ke keranjang.</p>
        </div>

        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input className="input pl-11" placeholder="Cari nama, kode, atau kategori..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{p.kategori}</span>
                <span className={`badge ${stokBadge(p.stok)}`}>Stok {p.stok}</span>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{p.nama}</h3>
              <p className="text-xs text-slate-400">{p.kode}</p>
              <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">{rp(p.harga)}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <div className="w-20 shrink-0">
                  <input type="number" min="1" className="input text-center" value={qty[p.id] ?? 1}
                    onChange={(e) => setQty({ ...qty, [p.id]: e.target.value })} />
                </div>
                <button disabled={p.stok === 0} onClick={() => tambah(p)} className="btn btn-primary flex-1">
                  {p.stok === 0 ? 'Habis' : 'Tambah'}
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <p className="col-span-full py-10 text-center text-slate-500">Barang tidak ditemukan.</p>
          )}
        </div>
      </section>

      {/* KERANJANG */}
      <aside className="card sticky top-20 h-fit p-5">
        <h2 className="mb-4 text-lg font-bold">Keranjang</h2>

        {cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
            Belum ada barang dipilih.
          </div>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {cart.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.nama}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rp(c.harga)}</p>
                  <div className="mt-2 inline-flex items-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <button onClick={() => ubah(c.id, -1)} className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">−</button>
                    <span className="min-w-8 text-center text-sm">{c.qty}</span>
                    <button onClick={() => ubah(c.id, 1)} className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">+</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{rp(c.harga * c.qty)}</p>
                  <button onClick={() => setCart(cart.filter((x) => x.id !== c.id))} className="mt-1 text-xs text-rose-600 hover:underline dark:text-rose-400">
                    hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-300">Total</span>
            <span className="text-xl font-bold">{rp(total)}</span>
          </div>

          <div className="flex gap-2">
            <input type="number" className="input" placeholder="Uang bayar" value={bayar} onChange={(e) => setBayar(e.target.value)} />
            <button onClick={() => setBayar(String(total))} disabled={!total} className="btn btn-ghost shrink-0">Pas</button>
          </div>

          {bayar !== '' && (
            <p className={`text-sm font-medium ${kembalian < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {kembalian < 0 ? `Kurang ${rp(-kembalian)}` : `Kembalian ${rp(kembalian)}`}
            </p>
          )}

          {error && <div className="alert-error">{error}</div>}

          <button onClick={prosesBayar} disabled={loading || cart.length === 0 || bayar === '' || kembalian < 0}
            className="btn btn-success w-full py-3">
            {loading ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </aside>
    </div>
  );
}