'use client';
import { useEffect, useState } from 'react';
import { KATEGORI } from '@/lib/constants';
import { rp } from '@/lib/utils';
import { stokBadge } from '@/lib/ui';
import { EmptyState, ErrorState, LoadingState } from '@/components/AdminStates';

const emptyForm = { kode: '', nama: '', kategori: '', harga_beli: '', harga: '', stok: '' };

function CategorySelect({ value, onChange, id, required = false, allOption = false }) {
  return (
    <select id={id} className="select" value={value} onChange={onChange} required={required}>
      <option value="">{allOption ? 'Semua kategori' : 'Pilih kategori'}</option>
      {KATEGORI.map((category) => <option key={category} value={category}>{category}</option>)}
    </select>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama: product.nama,
    kategori: product.kategori,
    harga_beli: String(product.harga_beli),
    harga: String(product.harga),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    const hargaBeli = Number(form.harga_beli);
    const harga = Number(form.harga);
    if (!form.nama.trim() || !form.kategori || !Number.isSafeInteger(hargaBeli) || hargaBeli < 0 ||
        !Number.isSafeInteger(harga) || harga < 0) {
      setError('Periksa kembali nama, kategori, dan harga barang.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama.trim(), kategori: form.kategori, harga_beli: hargaBeli, harga }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan perubahan.');
      onSaved();
    } catch (requestError) {
      setError(requestError.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-lg border border-line bg-surface p-5 shadow-xl sm:max-w-xl sm:rounded-lg" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-product-title" className="text-lg font-semibold">Edit Barang</h2>
            <p className="mt-1 text-sm text-muted">Stok hanya dapat diubah melalui menu Update Stok.</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Tutup" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="label" htmlFor="edit-product-name">Nama barang
            <input id="edit-product-name" className="input mt-1.5" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={150} required />
          </label>
          <label className="label" htmlFor="edit-product-category">Kategori
            <CategorySelect id="edit-product-category" value={form.kategori} onChange={(event) => setForm({ ...form, kategori: event.target.value })} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label" htmlFor="edit-product-cost">Harga beli
              <input id="edit-product-cost" type="number" min="0" step="1" className="input mt-1.5" value={form.harga_beli} onChange={(event) => setForm({ ...form, harga_beli: event.target.value })} required />
            </label>
            <label className="label" htmlFor="edit-product-price">Harga jual
              <input id="edit-product-price" type="number" min="0" step="1" className="input mt-1.5" value={form.harga} onChange={(event) => setForm({ ...form, harga: event.target.value })} required />
            </label>
          </div>
          {error && <ErrorState message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function BarangPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/products')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal memuat barang.');
        return result;
      })
      .then((result) => {
        if (!active) return;
        setProducts(result);
        setError('');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Gagal memuat barang.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [retry]);

  const visibleProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${product.kode} ${product.nama}`.toLowerCase().includes(term);
    return matchesSearch && (!category || product.kategori === category);
  });
  const buyPrice = Number(form.harga_beli);
  const sellPrice = Number(form.harga);
  const priceWarning = form.harga_beli !== '' && form.harga !== '' && sellPrice < buyPrice;

  function reload() {
    setLoading(true);
    setRetry((value) => value + 1);
  }

  async function addProduct(event) {
    event.preventDefault();
    setFormError('');
    const hargaBeli = Number(form.harga_beli);
    const harga = Number(form.harga);
    const stok = Number(form.stok);
    if (!form.kode.trim() || !form.nama.trim() || !form.kategori ||
        !Number.isSafeInteger(hargaBeli) || hargaBeli < 0 ||
        !Number.isSafeInteger(harga) || harga < 0 ||
        !Number.isSafeInteger(stok) || stok < 0) {
      setFormError('Lengkapi semua kolom. Harga dan stok harus berupa bilangan bulat minimal 0.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: form.kode.trim(), nama: form.nama.trim(), kategori: form.kategori,
          harga_beli: hargaBeli, harga, stok,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambah barang.');
      setForm(emptyForm);
      reload();
    } catch (requestError) {
      setFormError(requestError.message || 'Gagal menambah barang.');
    } finally {
      setSaving(false);
    }
  }

  function productFields() {
    return (
      <>
        <label className="label" htmlFor="product-code">Kode
          <input id="product-code" className="input mt-1.5" value={form.kode} onChange={(event) => setForm({ ...form, kode: event.target.value })} maxLength={30} required />
        </label>
        <label className="label" htmlFor="product-name">Nama
          <input id="product-name" className="input mt-1.5" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={150} required />
        </label>
        <label className="label" htmlFor="product-category">Kategori
          <CategorySelect id="product-category" value={form.kategori} onChange={(event) => setForm({ ...form, kategori: event.target.value })} required />
        </label>
        <label className="label" htmlFor="product-buy-price">Harga beli
          <input id="product-buy-price" type="number" min="0" step="1" className="input mt-1.5" value={form.harga_beli} onChange={(event) => setForm({ ...form, harga_beli: event.target.value })} required />
        </label>
        <label className="label" htmlFor="product-sell-price">Harga jual
          <input id="product-sell-price" type="number" min="0" step="1" className="input mt-1.5" value={form.harga} onChange={(event) => setForm({ ...form, harga: event.target.value })} required />
        </label>
        <label className="label" htmlFor="product-stock">Stok awal
          <input id="product-stock" type="number" min="0" step="1" className="input mt-1.5" value={form.stok} onChange={(event) => setForm({ ...form, stok: event.target.value })} required />
        </label>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Data Barang</h1>
        <p className="mt-1 text-sm text-muted">Kelola katalog dan harga barang.</p>
      </header>

      <form onSubmit={addProduct} className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold">Tambah Barang Baru</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{productFields()}</div>
        {priceWarning && <p className="rounded-md bg-primary-soft p-3 text-sm text-primary">Harga jual lebih rendah daripada harga beli.</p>}
        {formError && <ErrorState message={formError} />}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Tambah Barang'}</button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="product-search">Cari barang</label>
          <input id="product-search" className="input min-w-0 flex-1" placeholder="Cari kode atau nama barang" value={search} onChange={(event) => setSearch(event.target.value)} />
          <label className="sr-only" htmlFor="category-filter">Filter kategori</label>
          <div className="sm:w-64"><CategorySelect id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)} allOption /></div>
        </div>
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading ? <LoadingState label="Memuat daftar barang..." /> : !error && visibleProducts.length === 0 ? (
          <EmptyState>{products.length ? 'Tidak ada barang yang cocok dengan pencarian.' : 'Belum ada barang.'}</EmptyState>
        ) : !error && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
              <div className="overflow-x-auto">
                <table className="tbl min-w-[850px]">
                  <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Harga Beli</th><th>Harga Jual</th><th>Stok</th><th>Aksi</th></tr></thead>
                  <tbody>{visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="font-mono text-sm text-muted">{product.kode}</td>
                      <td className="font-medium">{product.nama}</td>
                      <td><span className="badge badge-primary">{product.kategori}</span></td>
                      <td>{rp(product.harga_beli)}</td>
                      <td>{rp(product.harga)}</td>
                      <td><span className={`badge ${stokBadge(Number(product.stok))}`}>{product.stok}</span></td>
                      <td><button type="button" className="btn btn-ghost" onClick={() => setEditing(product)}>Edit</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-3 md:hidden">
              {visibleProducts.map((product) => (
                <article className="card space-y-3 p-4" key={product.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold">{product.nama}</p><p className="mt-1 font-mono text-sm text-muted">{product.kode}</p></div>
                    <span className={`badge shrink-0 ${stokBadge(Number(product.stok))}`}>Stok {product.stok}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="badge badge-primary">{product.kategori}</span>
                    <span className="text-muted">Beli {rp(product.harga_beli)}</span>
                    <span className="font-medium">Jual {rp(product.harga)}</span>
                  </div>
                  <button type="button" className="btn btn-ghost w-full" onClick={() => setEditing(product)}>Edit barang</button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {editing && <ProductModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}